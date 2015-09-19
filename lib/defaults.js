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
  message: 'Enter a super secure passphrase: ',
};

module.exports = {
  config: config,
  ship: ship,
  gitConfirm: gitConfirm,
  passphraseQuestion: passphraseQuestion,
}
