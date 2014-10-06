#!/usr/bin/env node

'use strict';

var mugshot = require('../lib/mugshot'),
  program = require('commander');

program
  .version('0.0.1')
  .option('-s, --source <source>', 'Source folder')
  .option('-d, --dest <dest>', 'Destination folder')
  .parse(process.argv);

mugshot(program.source, program.dest, function(e) {
  if (e) {
    return process.exit(1);
  }
  return process.exit(0);
});
