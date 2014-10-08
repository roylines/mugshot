#!/usr/bin/env node

'use strict';

var mugshot = require('../lib/mugshot'),
  program = require('commander');

program
  .version('0.0.1')
  .option('--source <source>', 'Source folder')
  .option('--dest <dest>', 'Destination folder')
  .option('--bucket <bucket>', 'S3 bucket')
  .option('--accessid <access key id>', 'AWS Access Key Id')
  .option('--secretid <secret key id>', 'AWS Secret Key Id')
  .option('--action <action>', 'Action')

.parse(process.argv);

mugshot(program, function(e) {
  if (e) {
    console.error(e);
    return process.exit(1);
  }
  return process.exit(0);
});
