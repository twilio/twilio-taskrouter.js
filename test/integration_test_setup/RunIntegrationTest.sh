#!/bin/bash
set -e

TEST_FILE="test.json"

yarn install

# Used by Datadog reporter script to determine test duration
export JOB_START_MS=$(date +%s000)

if ! test -f "$TEST_FILE"; then
    node test/integration_test_setup/IntegrationTestSetup.js || EXIT_CODE=$?
fi

# Showcasing test.json
echo "Print test.json for debugging"
cat test.json

# If test setup failed, fail the job
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Test setup failed"
  # will post failed job even if no report was generated
  sh test/integration_test_setup/PublishIntegrationTestResultsDatadog.sh
  exit 1
fi

RUN_SIX_SIGMA_SUITE=$(grep RUN_SIX_SIGMA_SUITE ./test/integration_test_setup/.env | cut -d '=' -f2)

if [[ $RUN_SIX_SIGMA_SUITE == true ]]; then
  time yarn test:integration-six-sigma || EXIT_CODE=$?
else
  time yarn test:integration || EXIT_CODE=$?
fi

echo "Integration test exit code $EXIT_CODE"
echo "Run count: $RUN_COUNT of $RETRIES_COUNT"

if [[ $RUN_COUNT -eq $RETRIES_COUNT ]] || [[ -z $EXIT_CODE ]]; then
  # send test results to Datadog.
  sh test/integration_test_setup/PublishIntegrationTestResultsDatadog.sh
fi

# If tests failed, fail the job
if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Test run failed"
  exit 1
fi
