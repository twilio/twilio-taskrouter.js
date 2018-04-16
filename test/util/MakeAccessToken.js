const credentials = require('../env');
const Twilio = require('twilio');
const AccessToken = Twilio.jwt.AccessToken;
const TaskRouterGrant = AccessToken.TaskRouterGrant;

module.exports.getAccessToken = function(accountSid, workspaceSid, workerSid, expirationTime) {
  const identity = 'ccis@twilio.com';
  const taskRouterGrant = new TaskRouterGrant({
    workerSid: workerSid,
    workspaceSid: workspaceSid,
    role: 'worker'
  });

  const accessToken = new AccessToken(accountSid, credentials.signingKeySid, credentials.signingKeySecret, { ttl: expirationTime });
  accessToken.addGrant(taskRouterGrant);
  accessToken.identity = identity;

  return accessToken.toJwt();
};
