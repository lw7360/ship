#!/usr/bin/env node

var expandTilde = require("expand-tilde");
var defaults = require("./defaults.js");
var fs = require("fs");
var Git = require("nodegit");
var inquirer = require("inquirer");
var mkdirp = require("mkdirp");
var Promise = require("bluebird");
var sjcl = require("sjcl");

var argv = require('yargs').demand(1).argv;
  // .completion('completion').argv;

var shipPath = expandTilde('~') + '/.ship';

if (argv._.length === 1) {
  switch(argv._[0]) {
    case 'init':
      // Initialize Ship at ~/.ship
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

        inquirer.prompt([gitConfirm, passphraseQuestion], function(answers) {
          var config = sjcl.encrypt(answers.passphrase, JSON.stringify(defaults.config));
          var ship = sjcl.encrypt(answers.passphrase, JSON.stringify(defaults.ship));

          fs.writeFileSync(shipPath + '/config', config);
          fs.writeFileSync(shipPath + '/ship', ship);

          if (answers.git) {
            Git.Repository.init(shipPath, 0)
            .then(function() {
              console.log('Ship has been successfuly initialized with Git enabled at: ' + shipPath);
            })
            .catch(function (error) {
              console.log(error);
            });
          } else {
            console.log('Ship has been successfuly initialized at: ' + shipPath);
          }
        });
      } else {
        console.log('Looks like you already initialized Ship before.');
      }
      break;
    default:
  }
}
