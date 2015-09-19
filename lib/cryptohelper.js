var bcrypt = require("bcryptjs");
var ecckey = require("ecckey");
var sjcl = require("ecckey").sjcl;


function makeSalt() {
  return bcrypt.genSaltSync(10);
}

function generateKeys(pass, salt) {
  if (!salt) {
    salt = makeSalt();
  }
  var hashedPass = bcrypt.hashSync(pass, salt);
  var keys = ecckey.generate(384, hashedPass);
  keys.salt = salt;

  return keys;
}

function encryptObject(pass, keys, obj) {
  var salt = keys.salt;
  var hashedPass = bcrypt.hashSync(pass, salt);
  var encryptedObj = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var encryptedPropName = ecckey.encrypt(hashedPass, keys, prop);
      var propVal = obj[prop];
      if (typeof propVal === "string" || typeof propVal === "number") {
        encryptedObj[encryptedPropName] = ecckey.encrypt(hashedPass, keys, propVal + '');
      } else if (propVal instanceof Array) {
        encryptedObj[encryptedPropName] = encryptList(pass, keys, propVal);
      } else { // propVal is going to be treated as an object.
        encryptedObj[encryptedPropName] = encryptObject(pass, keys, propVal);
      }
    }
  }
  return encryptedObj;
}

function encryptList(pass, keys, list) {
  var salt = keys.salt;
  var hashedPass = bcrypt.hashSync(pass, salt);
  var encryptedArr = [];

  for (var i = 0; i < list.length; i++) {
    var propVal = list[i];
    if (typeof propVal === "string" || typeof propVal === "number") {
      encryptedArr[i] = ecckey.encrypt(hashedPass, keys, propVal + '');
    } else if (propVal instanceof Array) {
      encryptedArr[i] = encryptList(pass, keys, propVal);
    } else {
      encryptedArr[i] = encryptObject(pass, keys, propVal);
    }
  }
  return encryptedArr;
}

function decryptObject(pass, keys, obj) {
  var salt = keys.salt;
  var hashedPass = bcrypt.hashSync(pass, salt);
  var decryptedObj = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var decryptedPropName = ecckey.decrypt(hashedPass, keys, prop);
      var propVal = obj[prop];
      if (typeof propVal === "string" || typeof propVal === "number") {
        decryptedObj[decryptedPropName] = ecckey.decrypt(hashedPass, keys, propVal + '');
      } else if (propVal instanceof Array) {
        decryptedObj[decryptedPropName] = decryptList(pass, keys, propVal);
      } else { // propVal is going to be treated as an object.
        decryptedObj[decryptedPropName] = decryptObject(pass, keys, propVal);
      }
    }
  }
  return decryptedObj;
}

function decryptList(pass, keys, list) {
  var salt = keys.salt;
  var hashedPass = bcrypt.hashSync(pass, salt);
  var decryptedArr = [];

  for (var i = 0; i < list.length; i++) {
    var propVal = list[i];
    if (typeof propVal === "string" || typeof propVal === "number") {
      decryptedArr[i] = ecckey.decrypt(hashedPass, keys, propVal + '');
    } else if (propVal instanceof Array) {
      decryptedArr[i] = decryptList(pass, keys, propVal);
    } else {
      decryptedArr[i] = decryptObject(pass, keys, propVal);
    }
  }
  return decryptedArr;
}

module.exports = {
  generateKeys: generateKeys,
  encryptObject: encryptObject,
  decryptObject: decryptObject,
  sjcl: sjcl,
}
