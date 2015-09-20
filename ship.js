#!/usr/bin/env node

var copyPaste = require("copy-paste");
var cryptohelper = require("./lib/cryptohelper");
var exec = require("child_process").exec;
var expandTilde = require("expand-tilde");
var defaults = require("./lib/defaults");
var fs = require("fs-extra");
var inquirer = require("inquirer");
var mkdirp = require("mkdirp");
var pwgen = require("pwgenjs");

var argv = require("yargs").argv;
  // .completion('completion').argv;

var shipPath            = expandTilde('~') + '/.ship/';
var shipTmp             = shipPath + 'tmp/';
var shipJson            = shipPath + 'ship.json';
var shipConfig          = shipPath + 'config.json';
var shipJsonEncrypted   = shipPath + 'ship';
var shipConfigEncrypted = shipPath + 'config';
var shipKeys            = shipPath + 'keys';

// Returns whether Ship has already been initialized 
// i.e. whether ~/.ship, ~/.ship/ship.json, and ~/.ship/config.json all exist
function isShipInit() {
  try {
    var shipExists = fs.statSync(shipPath).isDirectory();
    var shipTmpExists = fs.statSync(shipTmp).isDirectory();
    var shipJsonExists = fs.statSync(shipJsonEncrypted).isFile();
    var shipConfigExists = fs.statSync(shipConfigEncrypted).isFile();

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
    var encryptedConfig = cryptohelper.encryptObject(answers.passphrase, keys, defaults.config);

    fs.writeJSONSync(shipKeys, keys);
    fs.writeJSONSync(shipJson, defaults.ship);
    fs.writeJSONSync(shipConfig, defaults.config);
    fs.writeJSONSync(shipJsonEncrypted, encryptedShip);
    fs.writeJSONSync(shipConfigEncrypted, encryptedConfig);
    fs.copySync('./lib/ship.gitignore', shipPath + '.gitignore');

    if (answers.git) {
      exec('cd ' + shipPath + ' && git init && git add . && git commit -m "Initial Ship commit"', function(err, stdout, stderr) {
        if (err) {
          console.log("Git couldn't be initialized at: " + shipPath);
          console.log("But other than that, Ship is ready to go.");
          return;
        }
        console.log('Ship has been successfuly initialized with Git at: ' + shipPath);
      })
    } else {
      console.log('Ship has been successfuly initialized at: ' + shipPath);
    }
  });
}

// Returns the Ship object if it's cached,
// otherwise, will prompt for password.
function getShip() {
  var shipJsonExists = fs.statSync(shipJson).isFile();
  if (shipJsonExists) {
    return fs.readJSONSync(shipJson);
  }

  inquirer.prompt([defaults.passphraseQuestion], function(answers) {
    var pass = answers.passphrase;
    var encryptedShip = fs.readJSONSync(shipJsonEncrypted);
    var keys = fs.readJSONSync(shipKeys);
    
    try {
      var decryptedShip = cryptohelper.decryptObject(pass, keys, encryptedShip);
      fs.writeJSONSync(shipJson, decryptedShip);
      return decryptedShip;
    } catch(err) {
      console.log('The passphrase you entered was incorrect.');
    }
  });
}

// Returns the Config object if it's cached,
// otherwise, will prompt for password.
function getShipConfig() {
  var shipConfigExists = fs.statSync(shipConfig).isFile();
  if (shipConfigExists) {
    return fs.readJSONSync(shipConfig);
  }

  inquirer.prompt([defaults.passphraseQuestion], function(answers) {
    var pass = answers.passphrase;
    var encryptedShipConfig = fs.readJSONSync(shipConfigEncrypted);
    var keys = fs.readJSONSync(shipKeys);
    
    try {
      var decryptedShipConfig = cryptohelper.decryptObject(pass, keys, encryptedShipConfig);
      fs.writeJSONSync(shipConfig, decryptedShipConfig);
      return decryptedShipConfig;
    } catch(err) {
      console.log('The passphrase you entered was incorrect.');
    }
  });
}

function saveShip(ship) {

}

// Add a password to Ship
function addToShip(id, pass) {
  var ship = getShip();
  ship[id] = pass;
}

// Generate a password
function generatePass(length) {
  return pwgen(length);
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
      console.log(copyPaste.copy(generatePass(12)));
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
