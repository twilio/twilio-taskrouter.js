#!/bin/bash
set -e

TEST_FILE="test.json"

if ! test -f "$TEST_FILE"; then
    node test/integration_test_setup/IntegrationTestSetup.js
fi

npm run test:integration
