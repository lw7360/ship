var config = {
  timeout: 1000 * 60 * 15, // Default timeout
}

var ship = {

}

var gitConfirm = {
  type:    'confirm',
  name:    'git',
  message: 'Do you want a Git repository to be enabled?'
};

var passphraseQuestion = {
  type:    'password',
  name:    'passphrase',
  message: 'Enter your super secure passphrase: ',
};

var gitInit = 'git init && git add . && git commit -m "Initial Ship commit"';

module.exports = {
  config: config,
  ship: ship,
  gitConfirm: gitConfirm,
  passphraseQuestion: passphraseQuestion,
  gitInit: gitInit
}