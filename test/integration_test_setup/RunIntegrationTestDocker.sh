#!/bin/bash
set -e

export INSTANCE_RUNNING=$1
echo "INSTANCE_RUNNING $INSTANCE_RUNNING"

# This is needed to avoid parallel jobs executing tests interfere with the other building image process
export IMAGE_NAME_WITH_TAG=tr_sdk_integration_test:${INSTANCE_RUNNING}

echo "building the image"
docker build --no-cache=true . -t $IMAGE_NAME_WITH_TAG -f ./test/integration_test_setup/Dockerfile

run_tests_in_docker() {
  echo "Run the docker tests"
  EXIT_CODE=0
  CONTAINER_NAME="tr_integration_${INSTANCE_RUNNING}_${RUN_COUNT}";
  docker run -e RUN_COUNT=$RUN_COUNT -e RETRIES_COUNT=$RETRIES_COUNT \
   --name "$CONTAINER_NAME" "$IMAGE_NAME_WITH_TAG" bash -c './test/integration_test_setup/RunIntegrationTest.sh' || EXIT_CODE=$?
}

RUN_COUNT=0
RETRIES_COUNT=3

while [[ $RUN_COUNT -eq 0 || ( $EXIT_CODE -eq 137 && $RUN_COUNT -lt $RETRIES_COUNT ) || ( $EXIT_CODE -ne 0 && $RUN_COUNT -lt $RETRIES_COUNT )]]
do
  RUN_COUNT=$((RUN_COUNT + 1))
  run_tests_in_docker
  echo "Docker run exit code $EXIT_CODE"
  if [[ $EXIT_CODE -eq 137 ]]; then
    echo "Test run failed because Docker container was killed"
  elif [[ $EXIT_CODE -ne 0 ]]; then
    echo "Test run failed because a test failed"
  fi
done

# cleaning up containers
echo "Listing all TR SDK containers"
docker ps -a -q --filter="name=^/tr_integration"

echo "Removing exited TR SDK containers"
docker rm -f $(docker ps -a -q --filter="name=^/tr_integration" --filter "status=exited")

# cleaning up images
echo "Listing all TR SDK docker images"
docker images --format '{{.Repository}}:{{.Tag}}' | grep 'tr_sdk_integration'

echo "Removing TR SDK docker image of this run"
docker rmi $(docker images --format '{{.Repository}}:{{.Tag}}' | grep $IMAGE_NAME_WITH_TAG) || true

# If tests failed, fail the job
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Test run failed in Docker"
  exit $EXIT_CODE
fi
