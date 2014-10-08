var _ = require('lodash'),
  async = require('async'),
  path = require('path'),
  s3 = require('s3');

function client(config) {
  return s3.createClient({
    s3Options: {
      accessKeyId: config.accessid,
      secretAccessKey: config.secretid
    }
  });
}

module.exports = function(config, files, done) {
  return async.waterfall([list, diff, upload], function(e) {
    console.log('');
    console.log('completed uploading to ' + config.bucket);
    return done(e);
  });

  function list(cb) {
    console.log('getting list of uploaded files in ' + config.bucket);
    var params = {
      recursive: true,
      s3Params: {
        Bucket: config.bucket
      },
    };

    client(config)
      .listObjects(params)
      .on('data', onData)
      .on('error', onEnd)
      .on('end', onEnd);

    var keys = [];

    function onData(data) {
      _.each(data.Contents, function(item) {
        keys.push(path.join(config.dest, item.Key));
      });
    };

    function onEnd(e) {
      return cb(e, keys);
    };
  }

  function diff(keys, cb) {
    console.log('comparing ' + keys.length + ' files');
    files = _.sortBy(files);
    keys = _.sortBy(keys);

    var without = [];
    _.forEach(files, function(file) {
      var match = false;
      _.forEach(keys, function(key, i) {
        if(key === file) {
          match = true;
          keys.splice(i, 1);
          return false;
        }
        return true;
      });
      if(!match) {
        without.push(file);
      }
    });

    return cb(null, without);
  };

  function upload(diffs, cb) {
    console.log('uploading ' + diffs.length + ' files');
    return async.eachSeries(diffs, uploadOne, cb);
  }

  function uploadOne(file, cb) {
    console.log('uploading', path.basename(file));
    var params = {
      localFile: file,
      s3Params: {
        Bucket: config.bucket,
        Key: file.substr(config.dest.length + 1),
      }
    };
    var uploader = client(config).uploadFile(params);
    uploader.on('error', function(err) {
      console.error('');
      console.error('failed to upload: ' + file, err);
      return cb();
    });
    uploader.on('progress', function() {
      process.stdout.write('.');
    });
    uploader.on('end', function() {
      console.log('.');
      return cb();
    });
  }
};
