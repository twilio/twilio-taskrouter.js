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
        '--headless',
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
