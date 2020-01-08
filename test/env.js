// Pre-populate with test.json if it exists.
let credentials = {};
try {
  credentials = require('../test.ccis.stage.json');
} catch (error) {
  // Do nothing.
}

const singleTaskingKeys = [
  'nonMultiTaskWorkspaceSid',
  'nonMultiTaskWorkflowSid',
  'nonMultiTaskAliceSid',
  'nonMultiTaskBobSid',
  'nonMultiTaskConnectActivitySid',
  'nonMultiTaskUpdateActivitySid',
  'nonMultiTaskNumActivities'
];

const voiceE2EKeys = [
  'numberToSid',
  'numberFromSid',
  'runtimeDomain',
  'prodRuntimeDomain',
  'numberTo',
  'numberFrom',
  'eventgw',
  'chunderw'
];

// Ensure required variables are present
const requiredKeys = [
  'accountSid',
  'authToken',
  'signingKeySid',
  'signingKeySecret',
  'hasSingleTasking',
  'multiTaskWorkspaceSid',
  'multiTaskWorkflowSid',
  'multiTaskQueueSid',
  'multiTaskAliceSid',
  'multiTaskBobSid',
  'multiTaskConnectActivitySid',
  'multiTaskUpdateActivitySid',
  'multiTaskNumActivities',
  'multiTaskNumChannels',
  'ebServer',
  'wsServer'
];

requiredKeys.forEach(key => {
  if (!(key in credentials)) {
    throw new Error('Missing ' + key);
  }

  // e2e tester -- no voice
  if (key === 'hasSingleTasking') {
    if (credentials[key]) {
      // check for single tasking
      singleTaskingKeys.forEach(singleTaskingKey => {
        if (!(singleTaskingKey in credentials)) {
          throw new Error('Missing Single Tasking Key ' + key);
        }
      });
    } else {
      // check for voice
      voiceE2EKeys.forEach(voiceKey => {
        if (!(voiceKey in credentials)) {
          throw new Error('Missing Voice Integrtion Key ' + key);
        }
      });
    }
  }
});

if (credentials.hasOwnProperty('env') && credentials.env) {
  if (credentials.env.includes('dev')) {
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.dev.twil.io';
    credentials.syncClientRegion = 'dev-us1';
  } else if (credentials.env.includes('stage')) {
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.stage.twil.io';
    credentials.syncClientRegion = 'stage-us1';
  } else {
    credentials.env = credentials.env.concat('.us1');
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.twil.io';
  }
} else {
  credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.twil.io';
}

module.exports = credentials;
