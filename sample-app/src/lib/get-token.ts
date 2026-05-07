import 'server-only';

import Twilio from 'twilio';
import { resolveRegion } from './utils';

const AccessToken = Twilio.jwt.AccessToken;
const TaskRouterGrant = AccessToken.TaskRouterGrant;

/*
  function runs on the server to create access token
*/
export default async function createToken(
  accountSid: string,
  signingKeySid: string,
  signingKeySecret: string,
  workspaceSid: string,
  workerSid: string,
  identity: string,
  environment?: string
) {
  if (!accountSid || !signingKeySid || !signingKeySecret || !workspaceSid || !workerSid) {
    return '';
  }


  const taskRouterGrant = new TaskRouterGrant({
    workerSid: workerSid,
    workspaceSid: workspaceSid,
    role: 'worker',
  });

  const accessToken = new AccessToken(accountSid, signingKeySid, signingKeySecret, {
    identity: identity,
    region: resolveRegion(environment || 'stage'),
  });

  accessToken.addGrant(taskRouterGrant);
  accessToken.identity = identity;

  return accessToken.toJwt();
}
