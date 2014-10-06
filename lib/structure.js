var exif = require('exif'),
  fs = require('node-fs'),
  md5 = require('md5-file'),
  path = require('path');

module.exports = function(source, dest, file, done) {
  function getDestination(file, done) {

    function getFilename(date) {
      var year = date.substr(0, 4),
        month = date.substr(5, 2),
        day = date.substr(8, 2),
        hour = date.substr(11, 2),
        minute = date.substr(14, 2),
        second = date.substr(17, 2);
      var hash = md5(file);
      var filename = path.join(dest, year, month, [year,month,day,hour,minute,second,hash.substr(0, 4)].join('-') + '.jpg');

      return filename;
    };

    function parseExif(e, data) {

      if (!data || !data.exif || !data.exif.DateTimeOriginal) {
        return done('no exif');
      }

      var filename = getFilename(data.exif.DateTimeOriginal);

      fs.mkdir(path.dirname(filename), '0777', true, function(e) {
        return done(e, filename);
      });
    }

    return new exif.ExifImage({
      image: file
    }, parseExif);
  }

  process.stdout.write('.');

  return getDestination(file, function(e, target) {
    if (e) {
      return done(e);
    }
    return fs.exists(target, function(exists) {
      if (exists) {
        return done();
      }

      var r = fs.createReadStream(file);
      var w = fs.createWriteStream(target);
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
