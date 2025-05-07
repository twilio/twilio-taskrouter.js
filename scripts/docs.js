#!/usr/bin/env node
'use strict';

const cheerio = require('cheerio');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const fs = require('fs');

const docs = process.argv[2];

const publicClasses = [
  'lib/types.jsdoc.js',
  'lib/Activity.js',
  'lib/Channel.js',
  'lib/core/transfer/OutgoingTransfer.js',
  'lib/core/transfer/IncomingTransfer.js',
  'lib/core/transfer/Transfers.js',
  'lib/Reservation.js',
  'lib/Task.js',
  'lib/TaskQueue.js',
  'lib/Worker.js',
  'lib/Supervisor.js',
  'lib/Workspace.js'
];

const publicConstructors = [
  'Worker',
  'Workspace',
  'Supervisor'
];

const privateConstructors = [
  'Activity',
  'Channel',
  'IncomingTransfer',
  'OutgoingTransfer',
  'Reservation',
  'Task',
  'TaskQueue',
  'Transfers'
];

spawnSync('node', [
  require.resolve('jsdoc/jsdoc'),
  '-d', docs,
  '-c', './jsdoc.conf',
  '-t', path.dirname(require.resolve('ink-docstrap')),
  '-R', './README.md'
].concat(publicClasses), {
  stdio: 'inherit'
});

fs.readdir(docs, (err, files) => {
  if (err)
    // eslint-disable-next-line no-console
    console.log(err);
  else {
    const htmlFileNames = files.filter(filename => path.extname(filename) === '.html');
    htmlFileNames.forEach(filename => {
      const fileContent = fs.readFileSync(path.join(docs, filename), 'utf8');
      transform(filename, fileContent);
    });
  }
});

function transform(filename, fileContent) {
  var $ = cheerio.load(fileContent);

  var className = filename.split('.html')[0].replace(/\//g, '');
  var div;

  // Prefix public constructors.
  if (publicConstructors.indexOf(className) > -1) {
    div = $('.container-overview');
    var name = $('h4.name', div);
    name.html(name.html().replace(/new /, 'new <span style="color: #999">Twilio.TaskRouter.</span>'));
  }

  // Remove private constructors.
  if (privateConstructors.indexOf(className) > -1) {
    div = $('.container-overview');
    $('h2', div).remove();
    $('h4.name', div).remove();
    $('div.description', div).remove();
    $('h5:contains(Parameters:)', div).remove();
    $('table.params', div).remove();
  }

  const modifiedFileContent = Buffer.from($.html());
  fs.writeFile(path.join(docs, filename), modifiedFileContent, err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return;
    }
  });

  return;
}
