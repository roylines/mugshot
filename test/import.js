var imp = require('../lib/import'),
  pedestrian = require('pedestrian'),
  path = require('path'),
  rimraf = require('rimraf');

describe('import', function() {
  var dest = path.join(__dirname, 'dest');
  var source = path.join(__dirname, 'images');

  beforeEach(function(done) {
    return rimraf(dest, done);
  });

  afterEach(function(done) {
    return rimraf(dest, done);
  });

  it('should not error', function(done) {
    return pedestrian.walk(path.resolve(source), function(e, files) {
      return imp({ source: source, dest: dest}, files, done);
    });
  });
});
