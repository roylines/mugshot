#!/usr/bin/env node

'use strict';

var exif = require('exif'),
  fs = require('node-fs'),
  moment = require('moment'),
  path = require('path'),
  program = require('commander');

program
  .version('0.0.1')
  .option('-s, --source <source>', 'Source folder')
  .option('-d, --dest <dest>', 'Destination folder')
  .parse(process.argv);

function getDestination(file, done) {
  function parseExif(e, data) {

    if (!data || !data.exif || !data.exif.DateTimeOriginal) {
      return done('no exif');
    }
    var date = data.exif.DateTimeOriginal;
    var year = date.substr(0, 4),
      month = date.substr(5, 2),
      day = date.substr(8, 2),
      hour = date.substr(11, 2),
      minute = date.substr(14, 2),
      second = date.substr(17, 2);

    date = new Date(year, month - 1, day, hour, minute, second);

    var dir = path.join(program.dest, year, month),
      file = path.join(dir, date.toISOString() + '.jpg');

    fs.mkdir(dir, '0777', true, function() {
      return done(null, file);
    });
  }

  return new exif.ExifImage({
    image: file
  }, parseExif);
}

function structure(file, done) {
  process.stdout.write('.');
  return getDestination(file, function(e, dest) {
    if (e) {
      return done(e);
    }
    return fs.exists(dest, function(exists) {
      if (exists) {
        return done();
      }
      //console.log(file + ' -> ' + dest);

      var r = fs.createReadStream(file);
      var w = fs.createWriteStream(dest);
      r.on('error', done);
      w.on('error', function(e) {
        console.error(e);
        return done(e);
      });
      w.on('close', done);
      return r.pipe(w);

    });
  });
};

function archive(file, done) {
  process.stdout.write('.');
  return done();
};

function walk(dir, action, done) {
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
          return walk(file, action, checkDone);
        } else {
          return action(file, checkDone);
        }
      });
    });
  });
};

console.log('structuring');
return walk(program.source, structure, function() {
  console.log('.');
  console.log('archiving');
  return walk(program.dest, archive, function() {
    console.log('.');
    console.log('done');
    return process.exit(1);
  });
});
