// Pre-populate with test.json if it exists.
let credentials = {};
try {
  credentials = require('../test.stage.outbound.json');
} catch (error) {
  // Do nothing.
}

// Ensure required variables are present
[
  'accountSid',
  'authToken',
  'signingKeySid',
  'signingKeySecret',
  'nonMultiTaskWorkspaceSid',
  'nonMultiTaskWorkflowSid',
  'nonMultiTaskAliceSid',
  'nonMultiTaskBobSid',
  'nonMultiTaskConnectActivitySid',
  'nonMultiTaskUpdateActivitySid',
  'nonMultiTaskNumActivities',
  'multiTaskWorkspaceSid',
  'multiTaskWorkflowSid',
  'multiTaskQueueSid',
  'numberToSid',
  'numberFromSid',
  'runtimeDomain',
  'prodRuntimeDomain',
  'numberTo',
  'numberFrom',
  'multiTaskAliceSid',
  'multiTaskBobSid',
  'multiTaskConnectActivitySid',
  'multiTaskUpdateActivitySid',
  'multiTaskNumActivities',
  'multiTaskNumChannels',
  'ebServer',
  'wsServer',
  'eventgw',
  'chunderw'
].forEach(key => {
  if (!(key in credentials)) {
    throw new Error('Missing ' + key);
  }
});

if (credentials.hasOwnProperty('env')) {
  if (credentials.env.includes('dev')) {
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.dev.twil.io';
    credentials.syncClientRegion = 'dev-us1';
  } else if (credentials.env.includes('stage')) {
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.stage.twil.io';
    credentials.syncClientRegion = 'stage-us1';
  } else {
    credentials.env = credentials.env.concat('.us1');
    credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.twil.io';
    credentials.syncClientRegion = 'us1';
  }
} else {
  credentials.runtimeBaseUrl = 'https://' + credentials.runtimeDomain + '.twil.io';
}

module.exports = credentials;
