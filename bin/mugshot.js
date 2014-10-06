#!/usr/bin/env node

'use strict';

var exif = require('exif'),
  fs = require('node-fs'),
  path = require('path'),
  program = require('commander');

program
  .version('0.0.1')
  .option('-s, --source <source>', 'Source folder')
  .option('-d, --dest <dest>', 'Destination folder')
  .parse(process.argv);

function getDestinationDirectory(file, date, done) {
  var dest = path.join(program.dest, date.substr(0, 4), date.substr(5, 2), date.substr(8, 2));
  fs.mkdir(dest, '0777', true, function() {
    return done(null, dest);
  });
}

function act(file, done) {
  return new exif.ExifImage({
    image: file
  }, function(e, data) {
    if (!data || !data.exif || !data.exif.DateTimeOriginal) {
      return done();
    }
    return getDestinationDirectory(file, data.exif.DateTimeOriginal, function(e, dest) {
      console.log('act', file, data.exif.DateTimeOriginal, dest);
    });
  });
};

function walk(dir, done) {
  return fs.readdir(dir, function(e, list) {
    if (e) {
      return done(e);
    }

    var pending = list.length;

    function checkPending() {
      if (!pending) {
        return done();
      }
    };

    checkPending();

    function checkDone() {
      --pending;
      checkPending();
    }

    return list.forEach(function(file) {
      file = path.join(dir, file);
      fs.stat(file, function(e, stat) {
        if (stat && stat.isDirectory()) {
          return walk(file, checkDone);
        } else {
          return act(file, checkDone);
        }
      });
    });
  });
};

return walk(program.source, function(e, files) {
  return process.exit(1);
});
