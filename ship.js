#!/usr/bin/env node

var argv = require('yargs').demand(1).argv;
var expandTilde = require('expand-tilde');
var fs = require('fs');
var inquirer = require('inquirer');
var mkdirp = require('mkdirp');
var Promise = require('bluebird');
var openpgp = require('openpgp');

Promise.promisifyAll(fs);

var shipPath = expandTilde('~') + '/.ship';

if (argv._.length === 1) {
  switch(argv._[0]) {
    case 'init':
      // Initialize Ship in ~/.ship
      if (mkdirp.sync(shipPath)) {
        var gitConfirm = {
          type: 'confirm',
          name: 'git',
          message: 'Do you want a Git repository to be enabled?'
        };

        var passphraseQuestion = {
          type: 'password',
          name: 'passphrase',
          message: 'Enter a super secure passphrase: ',
        };
        
        inquirer.prompt([gitConfirm, passphraseQuestion], function (answers) {
          var options = {
            numBits: 2048,
            userId: 'Ship Key <ship.key@example.org>',
            passphrase: answers.passphrase
 
          };

          console.log('Generating PGP key...');
          openpgp.generateKeyPair(options).then(function(keypair) {
            console.log('Ship has been initialized!');
          }).catch(function(error) {
            console.log(error); 
          });
        });
      } else {
        console.log('Looks like you already initialized Ship before.');
      }
      break;
  }
}
