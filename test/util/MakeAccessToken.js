const credentials = require('../env');
const Twilio = require('twilio');
const AccessToken = Twilio.jwt.AccessToken;
const TaskRouterGrant = AccessToken.TaskRouterGrant;
const SyncGrant = AccessToken.SyncGrant;


module.exports.getAccessToken = function(accountSid, workspaceSid, workerSid, expirationTime, role, options = {}) {
  const identity = 'ccis@twilio.com';
  const taskRouterGrant = new TaskRouterGrant({
    workerSid: workerSid,
    workspaceSid: workspaceSid,
    role: role || 'worker'
  });

  const accessToken = new AccessToken(accountSid, credentials.signingKeySid, credentials.signingKeySecret, { ttl: expirationTime });
  accessToken.addGrant(taskRouterGrant);

  if (options.useSync) {
      const _syncGrant = new SyncGrant({
      serviceSid: workspaceSid + '.insights'  // these values can change anytime without notice
    });
    _syncGrant.key = 'flex_insights';
    accessToken.addGrant(_syncGrant);
  }

  accessToken.identity = identity;

  return accessToken.toJwt();
};
