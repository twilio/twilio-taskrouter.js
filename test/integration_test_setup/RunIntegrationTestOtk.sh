#!/bin/bash
set -e
TEST_FILE="test.json"

echo "Running integration tests with OTK..."

yarn install

AUTH_TOKEN=$(echo "$AUTH_TOKEN" | jq -r '.["auth-token"]')
SIGNING_KEY_SECRET=$(echo "$SIGNING_KEY_SECRET" | jq -r '.["signing-key-secret"]')
DD_API_KEY=$(echo "$DD_API_KEY" | jq -r '.["datadog-api-key"]')

# set env variables
cat <<EOT > test/integration_test_setup/.env
ACCOUNT_SID=$ACCOUNT_SID
AUTH_TOKEN=$AUTH_TOKEN

SIGNING_KEY_SID=$SIGNING_KEY_SID
SIGNING_KEY_SECRET=$SIGNING_KEY_SECRET

DD_API_KEY=$DD_API_KEY
DD_REPORT_ENABLED=$DD_REPORT_ENABLED
JOB_NAME=$JOB_NAME

ENV=$ENV
WORKSPACE_FRIENDLY_NAME=$WORKSPACE_FRIENDLY_NAME
RUN_SIX_SIGMA_SUITE=$RUN_SIX_SIGMA_SUITE

RUN_VOICE_TESTS=$RUN_VOICE_TESTS
WORKER_NUMBER=$WORKER_NUMBER
SUPERVISOR_NUMBER=$SUPERVISOR_NUMBER
CUSTOMER_NUMBER=$CUSTOMER_NUMBER
FLEX_CC_NUMBER=$FLEX_CC_NUMBER
EOT

# Used by Datadog reporter script to determine test duration
export JOB_START_MS=$(date +%s000)

if ! test -f "$TEST_FILE"; then
    node test/integration_test_setup/IntegrationTestSetup.js || EXIT_CODE=$?
fi

# If test setup failed, fail the job
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Test setup failed"
  # will post failed job even if no report was generated
  if [[ $DD_REPORT_ENABLED == true ]]; then
    echo "Sending test setup failure report to Datadog"
    sh test/integration_test_setup/PublishIntegrationTestResultsDatadog.sh
  else
    echo "Skipping Datadog reporting (DD_REPORT_ENABLED=$DD_REPORT_ENABLED)"
  fi
  exit 1
fi

RUN_SIX_SIGMA_SUITE=$(grep RUN_SIX_SIGMA_SUITE ./test/integration_test_setup/.env | cut -d '=' -f2)
RUN_VOICE_TESTS=$(grep RUN_VOICE_TESTS ./test/integration_test_setup/.env | cut -d '=' -f2)

run_tests() {
  echo "Running tests (attempt $RUN_COUNT of $RETRIES_COUNT)"
  EXIT_CODE=0

  if [[ $RUN_SIX_SIGMA_SUITE == true ]]; then
    time yarn test:integration-six-sigma || EXIT_CODE=$?
  else
    if [[ $RUN_VOICE_TESTS == true ]]; then
      time yarn test:integration:tr:voice || EXIT_CODE=$?
    else
      time yarn test:integration || EXIT_CODE=$?
    fi
  fi

  echo "Integration test exit code $EXIT_CODE"
  echo "Run count: $RUN_COUNT of $RETRIES_COUNT"
}

# Initialize retry counters
RUN_COUNT=0
RETRIES_COUNT=3

# Retry loop
while [[ $RUN_COUNT -eq 0 || ( $EXIT_CODE -ne 0 && $RUN_COUNT -lt $RETRIES_COUNT ) ]]
do
  RUN_COUNT=$((RUN_COUNT + 1))
  export RUN_COUNT
  export RETRIES_COUNT
  run_tests

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo "Test run failed on attempt $RUN_COUNT"
    if [[ $RUN_COUNT -lt $RETRIES_COUNT ]]; then
      echo "Retrying..."
    fi
  fi
done

if [[ $RUN_COUNT -eq $RETRIES_COUNT ]] || [[ -z $EXIT_CODE ]] || [[ $EXIT_CODE -eq 0 ]]; then
  # send test results to Datadog only if enabled
  if [[ $DD_REPORT_ENABLED == true ]]; then
    echo "Sending test results to Datadog"
    sh test/integration_test_setup/PublishIntegrationTestResultsDatadog.sh
  else
    echo "Skipping Datadog reporting (DD_REPORT_ENABLED=$DD_REPORT_ENABLED)"
  fi
fi

# If tests failed after all retries, fail the job
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Test run failed after $RUN_COUNT attempts"
  exit 1
fi

echo "Tests passed successfully on attempt $RUN_COUNT"
