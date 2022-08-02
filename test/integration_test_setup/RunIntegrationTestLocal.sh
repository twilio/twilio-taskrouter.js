#!/bin/bash
set -e
USE_DOCKER=${1:-true}
INSTANCE_RUNNING=${2:-local};

if [[ $USE_DOCKER == true ]]; then
    sh ./test/integration_test_setup/RunIntegrationTestDocker.sh $INSTANCE_RUNNING
else
    sh ./test/integration_test_setup/RunIntegrationTest.sh
fi
