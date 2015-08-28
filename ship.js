#!/usr/bin/env node

var argv = require('yargs').demand(1).argv;
var expandTilde = require('expand-tilde');
var fs = require('fs');
var mkdirp = require('mkdirp');
var yargs = require('yargs');

// console.log(argv);

if (argv._.length === 1) {
  switch(argv._[0]) {
    case 'init':
      // Initialize Ship in ~/.ship
      var shipPath = expandTilde('~') + '/.ship';
      var success = mkdirp.sync(shipPath);
      if (success) {
        console.log('Ship has been initialized in ' + success);
      } else {
        console.log('Looks like you already initialized Ship before.');
      }
      break;
  }
}
