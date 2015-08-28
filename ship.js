#!/usr/bin/env node

var argv = require('yargs').demand(1).argv;
var fs = require('fs');
var yargs = require('yargs');


console.log(argv);

if (argv._.length === 1) {
  switch(argv._[0]) {
    case 'init':
      // Initialize Ship in ~/.ship
      break;
  }
}
