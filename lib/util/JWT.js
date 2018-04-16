import _ from 'lodash';

const decode = (token) => {
  const segs = token.split('.');
  if (segs.length !== 3) {
    throw new Error('Wrong number of segments');
  }

  let encodedPayload = segs[1];
  const remainder = encodedPayload.length % 4;
  if (remainder > 0) {
    const padlen = 4 - remainder;
    encodedPayload += new Array(padlen + 1).join('=');
  }

  encodedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(new Buffer(encodedPayload, 'base64').toString('ascii'));
};

export const objectize = _.memoize(decode);
