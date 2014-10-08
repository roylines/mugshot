var async = require('async'),
  fs = require('node-fs'),
  md5 = require('md5-file'),
  path = require('path'),
  Exif = require('exif');

module.exports = function(config, files, done) {
  console.log('importing ' + files.length + ' files from ' + config.source);
  return async.each(files, function(file, cb) {
    return importFile(config.dest, file, cb);
  }, function(e) {
    console.log('.');
    console.log('import complete.');
    return done(e);
  });
}

function importFile(dest, file, done) {
  if(path.extname(file).toLowerCase() !== '.jpg') {
    return done();
  }
  
  return async.waterfall([getExif, exif, getDestination, mkdirs, exists, copy], complete);

  function complete(e) {
    return done();
  };

  function getExif(cb) {
    process.stdout.write('.');
    return new Exif.ExifImage({
      image: file
    }, cb);
  }

  function exif(data, cb) {
    if (!data || !data.exif || !data.exif.DateTimeOriginal) {
      return done();
    }

    return cb(null, data.exif.DateTimeOriginal);
  }

  function getDestination(date, cb) {
    if (!date) {
      return cb();
    }
    var year = date.substr(0, 4),
      month = date.substr(5, 2),
      day = date.substr(8, 2),
      hour = date.substr(11, 2),
      minute = date.substr(14, 2),
      second = date.substr(17, 2);
    var hash = md5(file);
    var filename = path.join(dest, year, month, [year, month, day, hour, minute, second, hash.substr(0, 4)].join('-') + '.jpg');

    return cb(null, filename);
  }

  function mkdirs(target, cb) {
    fs.mkdir(path.dirname(target), '0777', true, function(e) {
      return cb(e, target);
    });
  }

  function exists(target, cb) {
    return fs.exists(target, function(exists) {
      return cb(null, target, exists);
    });
  }

  function copy(target, exists, cb) {
    process.stdout.write('.');
    if (exists) {
      return cb();
    }
    
    process.stdout.write('*');
    var r = fs.createReadStream(file);
    var w = fs.createWriteStream(target);
    r.on('error', cb);
    w.on('error', cb);
    w.on('close', function() {
      process.stdout.write('*');
      return cb();
    });
    return r.pipe(w);
  }
};
