var
  archive = require('./s3-archive'),
  fs = require('node-fs'),
  path = require('path'),
  structure = require('./structure');

module.exports = function(source, dest, done) {

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
            return action(source, dest, file, checkDone);
          }
        });
      });
    });
  };

  console.log('structuring');
  return walk(source, structure, function() {
    console.log('.');
    console.log('archiving');
    return walk(dest, archive, function() {
      console.log('.');
      console.log('done');
      return process.exit(1);
    });
  });
}
