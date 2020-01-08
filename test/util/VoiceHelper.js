import { readFile } from 'fs';
import { promisify } from 'util';
import { createServer } from 'http';
import { join } from 'path';
import { launch } from 'chrome-launcher';

const readFileAsync = promisify(readFile);

/**
 * @param {number} port - desired port
 * @return {Promise<Server>}
 */
export const serveVoiceHtml = async(port) => {
  const path = join(process.cwd(), 'test', 'browser', 'voice.html');
  const voiceHtml = await readFileAsync(path, { encoding: 'utf8' });
  const server = createServer((req, res) => {
      res.write(voiceHtml);
      res.end();
  });
  await new Promise((res, rej) => {
    server.on('error', err => rej(err));
    server.listen(port, () => res());
  });
  return server;
};

/**
 * @param {string} startingUrl url to open when chrome is launched
 * @param {string[]} chromeArgs chrome args
 * @return {Promise<LaunchedChrome>}
 */
export const browserLauncher = (startingUrl, chromeArgs = []) => {
  return launch({
    startingUrl: startingUrl,
    chromeFlags: [
        // '--headless',
        '--disable-gpu',
        '--allow-file-access-from-files',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--disable-web-security',
        '--allow-file-access'
    ].concat(chromeArgs)
  });
};

export const event = (emitter, eventName, msg, ms) => {
  return new Promise((resolve, reject) => {
    emitter.on(eventName, event => {
      return resolve(event);
    });
    setTimeout(reject, ms, new Error(msg));
  });
};

export const poll = (map, key, msg, maxTries) => {

  const loop = async(attempt = 0) => {
    let hasKey;
    let err;

    hasKey = await map.get(key).catch(e => {
      err = e;
    });

    if (hasKey) {
      return;
    }

    // Waste half a second
    await new Promise(r => setTimeout(r, 1000));

    if (err) {
      if (attempt >= maxTries) {
        throw new Error(msg);
      } else {
        return loop(++attempt);
      }
    }
  };

  return loop();
};

export const twiMl = 'http://twimlets.com/echo?Twiml=%3CResponse%3E%0A%20%20%20%20%20%3CSay%20loop%3D%2250%22%3EA%20little%20less%20conversation%2C%20a%20little%20more%20action%20please.%3C%2FSay%3E%0A%3C%2FResponse%3E%0A&';
