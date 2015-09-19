#!/usr/bin/env node

var cryptohelper = require("./lib/cryptohelper");
var expandTilde = require("expand-tilde");
var defaults = require("./lib/defaults");
var fs = require("fs-extra");
var Git = require("nodegit");
var inquirer = require("inquirer");
var mkdirp = require("mkdirp");

var argv = require('yargs').argv;
  // .completion('completion').argv;

var shipPath = expandTilde('~') + '/.ship';
var shipTmp = shipPath + '/tmp';
var shipJson = shipPath + '/ship.json';
var shipConfig = shipPath + '/config.json';
var shipJsonEncrypted = shipPath + '/ship.json';
var shipConfigEncrypted = shipPath + '/config.json';

// Returns whether Ship has already been initialized 
// i.e. whether ~/.ship, ~/.ship/ship.json, and ~/.ship/config.json all exist
function isShipInit() {
  try {
    var shipExists = fs.statSync(shipPath).isDirectory();
    var shipTmpExists = fs.statSync(shipTmp).isDirectory();
    var shipJsonExists = fs.statSync(shipJson).isFile();
    var shipConfigExists = fs.statSync(shipConfig).isFile();

    return shipExists && shipTmpExists && shipJsonExists && shipConfigExists;
  } catch(e) {
    return false;
  }
}


// Initialize Ship at ~/.ship
function initShip() {
  mkdirp.sync(shipPath);
  mkdirp.sync(shipTmp);

  inquirer.prompt([defaults.gitConfirm, defaults.passphraseQuestion], function(answers) {
    var keys = cryptohelper.generateKeys(answers.passphrase);
    var encryptedShip = cryptohelper.encryptObject(answers.passphrase, keys, defaults.ship);
    var defaultConfig = cryptohelper.encryptObject(answers.passphrase, keys, defaults.config);

    fs.writeJSONSync(shipJson, defaults.ship);
    fs.writeJSONSync(shipConfig, defaults.config);
    fs.copySync('./lib/ship.gitignore', shipPath + '/.gitignore');

    if (answers.git) {
      Git.Repository.init(shipPath, 0)
      .then(function() {
        console.log('Ship has been successfuly initialized with Git enabled at: ' + shipPath);
      })
      .catch(function (error) {
        console.log('Woops')
        console.log(error);
      });
    } else {
      console.log('Ship has been successfuly initialized at: ' + shipPath);
    }
  });
}

// Add a password to Ship
function addToShip() {

}

// Generate a password
function generatePassword(options) {

}

// Finds a password
function findPassword() {
}

// Prints out Ship
function printShip() {
  console.log('Ship');
}

if (argv._.length) {
  switch(argv._[0]) {
    case 'init':
      if (!isShipInit()) {
        initShip();
      } else {
        console.log('Looks like you already initialized Ship before.');
      }
      break;
    case 'add':
      // Add a password to Ship
      break;
    case 'rm':
      // Remove a password from Ship
      break;
    case 'generate':
      // Generate a password
      break;
    default:
      // Search for a password
  }
} else {
  if (isShipInit()) {
    printShip();
  } else {
    console.log("Error: Looks like you haven't initialized ship yet. Try \"ship init\".");
  }
}
