#!/usr/bin/env node
'use strict';

const cheerio = require('cheerio');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const stream = require('stream');
const vfs = require('vinyl-fs');

const docs = process.argv[2];

const publicClasses = [
  'lib/Activity.js',
  'lib/Channel.js',
  'lib/core/transfer/OutgoingTransfer.js',
  'lib/core/transfer/IncomingTransfer.js',
  'lib/core/transfer/Transfers.js',
  'lib/Reservation.js',
  'lib/Task.js',
  'lib/TaskQueue.js',
  'lib/Worker.js',
  'lib/Workspace.js'
];

const publicConstructors = [
  'Worker',
  'Workspace'
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

vfs.src(path.join(docs, '*.html'))
  .pipe(map(transform))
  .pipe(vfs.dest(docs));

function transform(file) {
  var $ = cheerio.load(file.contents.toString());

  var filename = file.path.slice(file.base.length);
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

  file.contents = new Buffer($.html());
  return file;
}

function map(f) {
  return new stream.Transform({
    objectMode: true,
    transform: function transform(file, encoding, callback) {
      callback(null, f(file));
    }
  });
}
