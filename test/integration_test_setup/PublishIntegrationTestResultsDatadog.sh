#!/bin/bash
set -e

# Datadog vars from .env if set
DD_API_KEY=$(grep -w "DD_API_KEY" ./test/integration_test_setup/.env | cut -d '=' -f2)
JOB_NAME=$(grep -w "JOB_NAME" ./test/integration_test_setup/.env | cut -d '=' -f2)
BUILD_NUMBER=$(grep -w "BUILD_NUMBER" ./test/integration_test_setup/.env | cut -d '=' -f2)
PROJECT=$(grep -w "PROJECT" ./test/integration_test_setup/.env | cut -d '=' -f2)

# Export Datadog configuration variables with defaults
export DD_API_KEY
export PROJECT=${PROJECT:-tr-sdk}
export JOB_NAME=${JOB_NAME:-tr-sdk-local-build}
export BUILD_NUMBER=${BUILD_NUMBER:-1}

if [ ! -z "$DD_API_KEY" ]; then
    echo "Publishing Integration Test results to Datadog"
    node test/integration_test_setup/PublishIntegrationTestResultsDatadog.js
fi
