var async = require('async'),
  pedestrian = require('pedestrian'),
  archive = require('./s3-archive'),
  imp = require('./import'),
  path = require('path');

module.exports = function(config, done) {
  config.source = config.source ? path.resolve(config.source) : null;
  config.dest = config.dest ? path.resolve(config.dest) : null;

  var tasks = [];
  if(config.source) {
    tasks.push(walkSource);
    tasks.push(importFiles);
  }

  if(config.bucket) {
    tasks.push(walkDest);
    tasks.push(archiveFiles);
  }

  return async.waterfall(tasks, done);

  function walkSource(cb) {
    return pedestrian.walk(config.source, cb);
  };

  function importFiles(files, cb) {
    return imp(config, files, cb);
  }

  function walkDest(cb) {
    return pedestrian.walk(config.dest, cb);
  }

  function archiveFiles(files, cb) {
    return archive(config, files, cb);
  }

};
