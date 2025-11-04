const path = require('path');
const { existsSync, readFileSync } = require('fs');
require('isomorphic-fetch');
const Status = {
    'FAILED': 'failed',
    'PASSED': 'passed',
    'SKIPPED': 'skipped'
};

const MetricType = {
    'COUNT': 'count',
    'GAUGE': 'gauge'
};

const MetricUnit = {
    'ENTRY': 'entry',
    'SECOND': 'second'
};

const MetricName = {
    'SUITE': 'suite',
    'SUITE_DURATION': 'suite.duration',
    'JOB': 'job',
    'JOB_DURATION': 'job.duration',
    'TEST': 'test',
    'TEST_DURATION': 'test.duration'
};

/**
 * Report path
 */

const TagNames = {
    'JOB_NAME': 'jobname',
    'BUILD_NR': 'buildnr',
    'RESULT': 'result',
    'FAILED_TEST': 'failedtest',
    'TEST_NAME': 'testname',
    'SUITE_NAME': 'suitename'
};

const reportJsonPath = path.join('reports', 'e2e-test-report.json');
/**
 * Holds values read from ENV
 */

let config;

const validateConfig = () => {
    const {
        JOB_START_MS,
        JOB_NAME,
        BUILD_NUMBER,
        PROJECT,
        DD_API_KEY,
        RUN_COUNT,
        RETRIES_COUNT
        // eslint-disable-next-line no-process-env
    } = process.env;
    const configValues = [JOB_START_MS, JOB_NAME, BUILD_NUMBER, PROJECT, DD_API_KEY, RUN_COUNT, RETRIES_COUNT];
    // eslint-disable-next-line no-undefined
    const areConfigValuesPresent = configValues.every(value => value !== null && value !== undefined);

    if (!areConfigValuesPresent) {
        // eslint-disable-next-line no-console
        console.error(configValues);
        throw new Error('One or multiple keys are missing');
    }

    const dateNowMs = Date.now();
    const jobStartMs = Number(JOB_START_MS);
    const jobDurationS = (dateNowMs - jobStartMs) / 1000;
    config = {
        JOB_NAME: JOB_NAME,
        BUILD_NUMBER: Number(BUILD_NUMBER),
        PROJECT: PROJECT,
        DD_API_KEY: DD_API_KEY,
        JOB_START_MS: jobStartMs,
        JOB_DURATION_S: jobDurationS,
        RUN_COUNT: Number(RUN_COUNT),
        RETRIES_COUNT: Number(RETRIES_COUNT)
    };
};

const buildMetric = (metricName, tags, metricType, metricUnit, val = 1) => {
    return {
        metric: `flex.e2e.${config.PROJECT}.${metricName}`,
        points: [[Math.round(Date.now() / 1000), val]],
        type: metricType,
        unit: metricUnit,
        tags
    };
};
/**
 * @description adds custom tags to the default tags
 * @param tags custom tags to add to the default ones
 */


const generatesTags = tags => {
    return [`${TagNames.JOB_NAME}:${config.JOB_NAME}`, `${TagNames.BUILD_NR}:${config.BUILD_NUMBER}`, ...tags];
};

const processTest = (test, metricsToSend) => {
    const durationS = test.duration / 1000;
    const result = test.state || Status.SKIPPED;
    const name = test.title;
    const testTags = generatesTags([`${TagNames.TEST_NAME}:${name}`, `${TagNames.RESULT}:${result}`]);
    metricsToSend.push(buildMetric(MetricName.TEST, testTags, MetricType.COUNT, MetricUnit.ENTRY));
    metricsToSend.push(buildMetric(MetricName.TEST_DURATION, testTags, MetricType.GAUGE, MetricUnit.SECOND, durationS));
    return {
        name,
        result,
        durationS
    };
};

const processSuite = (suite, metricsToSend) => {
    const innerSuites = suite.suites;
    const tests = suite.tests;
    let suiteStatus = Status.PASSED;
    let failedTest;
    let durationS = 0; // To handle nested describe blocks

    if (innerSuites.length) {
        innerSuites.forEach(innerSuite => {
            processSuite(innerSuite, metricsToSend);
        }); // If a describe block has other descirbe blocks inside and no tests, we can skip it

        if (!tests.length) return;
    }

    tests.forEach(test => {
        const testStat = processTest(test, metricsToSend);
        durationS += testStat.durationS;

        if (suiteStatus === Status.PASSED && testStat.result === Status.FAILED) {
            suiteStatus = Status.FAILED;
            failedTest = testStat.name;
        }
    });
    const suiteTags = generatesTags([`${TagNames.SUITE_NAME}:${suite.title}`, `${TagNames.RESULT}:${suiteStatus}`]);

    if (failedTest) {
        suiteTags.push(`${TagNames.FAILED_TEST}:${failedTest}`);
    }

    metricsToSend.push(buildMetric(MetricName.SUITE, suiteTags, MetricType.COUNT, MetricUnit.ENTRY));
    metricsToSend.push(buildMetric(MetricName.SUITE_DURATION, suiteTags, MetricType.GAUGE, MetricUnit.SECOND, durationS));
};

const processJob = (report, metricsToSend) => {
    const stats = report.stats;
    let jobStatus;

    if (stats.failures !== 0) {
        jobStatus = Status.FAILED;
    } else {
        // no failures but not all tests were run
        // usually means there was an error in before/after hook
        jobStatus = stats.hasSkipped ? Status.FAILED : Status.PASSED;
    } // Only mark job as failed on the last retry run
    // Run count goes as 1..2..3..RETRIES_COUNT


    if (config.RUN_COUNT < config.RETRIES_COUNT) {
        jobStatus = Status.PASSED;
    }

    const jobDurationS = config.JOB_DURATION_S;
    const jobTags = generatesTags([`${TagNames.RESULT}:${jobStatus}`]);
    metricsToSend.push(buildMetric(MetricName.JOB, jobTags, MetricType.COUNT, MetricUnit.ENTRY));
    metricsToSend.push(buildMetric(MetricName.JOB_DURATION, jobTags, MetricType.GAUGE, MetricUnit.SECOND, jobDurationS));
};

const generateMetrics = () => {
    if (!existsSync(reportJsonPath)) {
        return [];
    }

    const report = JSON.parse(readFileSync(reportJsonPath, 'utf8'));
    const suites = report.results[0].suites;
    const metricsToSend = [];
    processJob(report, metricsToSend);
    suites.forEach(suite => {
        processSuite(suite, metricsToSend);
    });
    return metricsToSend;
};
/**
 * @description generates an empty set of metrics to send as a substitue in case report JSON was not generated
 */


const generateEmptyMetrics = () => {
    const metrics = [];
    const jobTags = generatesTags([`${TagNames.RESULT}:${Status.FAILED}`]);
    metrics.push(buildMetric(MetricName.JOB, jobTags, MetricType.COUNT, MetricUnit.ENTRY));
    metrics.push(buildMetric(`${MetricName.JOB_DURATION}`, jobTags, MetricType.GAUGE, MetricUnit.SECOND, config.JOB_DURATION_S));
    return metrics;
};

const sendMetrics = async() => {
    let metrics = generateMetrics(); // For situations where a report is not generated sends information about the job and manually setting it as failed

    if (!metrics.length) {
        metrics = generateEmptyMetrics();
    }

    console.log('Metrics read: ', metrics)

    const result = await fetch(`https://api.datadoghq.com/api/v1/series?${new URLSearchParams({
        // eslint-disable-next-line camelcase
        api_key: config.DD_API_KEY
    })}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            series: metrics
        })
    });
    const responseStr = await result.text(); // eslint-disable-next-line no-console

    console.log(`Metrics sent! Successful: ${result.ok}, API response: ${responseStr}`);
};

validateConfig();
sendMetrics();
