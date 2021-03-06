#!/usr/bin/env node

var copyPaste = require("copy-paste");
var cryptohelper = require("./lib/cryptohelper");
var exec = require("child_process").exec;
var expandTilde = require("expand-tilde");
var defaults = require("./lib/defaults");
var fs = require("fs-extra");
var FuzzySet = require("fuzzyset.js");
var inquirer = require("inquirer");
var mkdirp = require("mkdirp");
var Promise = require("bluebird");
var pwgen = require("pwgenjs");

var argv = require("yargs").argv;
Promise.promisifyAll(inquirer);

var shipPath            = expandTilde('~') + '/.ship/';
var shipTmp             = shipPath + 'tmp/';
var shipJson            = shipPath + 'ship.json';
var shipConfig          = shipPath + 'config.json';
var shipJsonEncrypted   = shipPath + 'ship';
var shipConfigEncrypted = shipPath + 'config';
var shipKeys            = shipPath + 'keys';

var shipPass = '';

// Returns a promise with password.
// Will prompt user for password the first time this function is called.
function getPassword() {
  if (shipPass) {
    return Promise.resolve(shipPass);
  }

  // Use 'error' because inquirer.js doesn't use error first callbacks.
  return inquirer.promptAsync(defaults.passphraseQuestion).error(function(answers) {
    return answers.passphrase;
  });
}

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
      exec('cd ' + shipPath + ' && ' + defaults.gitInit, function(err, stdout, stderr) {
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

// Returns the Ship object in a Promise.
function getShip() {
  var shipJsonExists = fs.statSync(shipJson).isFile();
  if (shipJsonExists) {
    return Promise.resolve(fs.readJSONSync(shipJson));
  }

  return getPassword().then(function(pass) {
    var encryptedShip = fs.readJSONSync(shipJsonEncrypted);
    var keys = fs.readJSONSync(shipKeys);

    try {
      var decryptedShip = cryptohelper.decryptObject(pass, keys, encryptedShip);
    } catch(err) {
      console.log('The passphrase you entered was incorrect.');
      return err;
    }
    shipPass = pass;
    fs.writeJSONSync(shipJson, decryptedShip);
    return decryptedShip;
  });
}

// Save ship, will return Promise resolving in boolean value for success or failure.
function saveShip(ship) {
  return getPassword().then(function(pass) {
    var keys = fs.readJSONSync(shipKeys);
    try {
      var encryptedShip = cryptohelper.encryptObject(pass, keys, ship);
    } catch (err) {
      console.log('The passphrase you entered was incorrect.');
      return false;
    }
    shipPass = pass;
    fs.writeJSONSync(shipJson, ship);
    fs.writeJSONSync(shipJsonEncrypted, encryptedShip);
    return true
  });
}

// Add a password to Ship
function addToShip(id, pass) {
  return getShip().then(function(ship) {
    ship[id] = pass;
    return saveShip(ship);
  });
}

// Remove a password from Ship
function removeFromShip(id) {
  return Promise.all([getShip(), matchId(id)]).then(function(all) {
    var ship = all[0];
    var closestMatch = all[1];
    if (closestMatch) {
      delete ship[id];
      saveShip(ship).then(function(success) {
        if (success) {
          console.log('Removed "' + closestMatch + '" from Ship');
        } else {
          console.log('Could not find "' + id + '" to remove.');
        }
      });
    } else {
      console.log('Could not find "' + id + '" to remove.');
      return false;
    }
  });
}

// Generate a password
function generatePass(length) {
  return pwgen(length);
}

// Finds the closest matching id for given id, returns as a promise
function matchId(id) {
  return getShip().then(function(ship) {
    var ids = Object.keys(ship);
    var shipSet = FuzzySet();
    ids.forEach(function(i) {
      shipSet.add(i);
    });
  
    var closestMatch = shipSet.get(id);
    if (closestMatch) {
      return closestMatch[0][1];
    }
    return false;
  });
}

// Finds a password, returns as a promise
function findPassword(id) {
  return Promise.all([getShip(), matchId(id)]).then(function(all) {
    var ship = all[0];
    var closestMatch = all[1];

    if (closestMatch) {
      return [closestMatch, ship[closestMatch]];
    }
    return false; 
  });
}

// Prints out Ship
function printShip() {
  console.log('Ship');
  console.log('----');
  getShip().then(function(ship) {
    var ids = Object.keys(ship);
    ids.forEach(function(i) {
      console.log(i);
    });
  });
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
      var id = argv._[1];
      var pass = argv._[2];
      if (!id || !pass) {
        console.log('Not enough arguments to add a password.');
      } else {
        addToShip(id, pass);
      }
      break;
    case 'rm':
      // Remove a password from Ship
      removeFromShip(argv._[1]);
      break;
    case 'generate':
      // Generate a password
      console.log(copyPaste.copy(generatePass(12)));
      break;
    default:
      // Search for a password
      var id = argv._[0];
      findPassword(id).then(function(res) {
        var matchId = res[0];
        var pass = res[1];
        if (pass) {
          copyPaste.copy(pass);
          console.log(matchId + ': ' + pass);
        } else {
          console.log('A password for "' + id + '" was not found.');
        }
      });
  }
} else {
  if (isShipInit()) {
    printShip();
  } else {
    console.log("Error: Looks like you haven't initialized ship yet. Try \"ship init\".");
  }
}
