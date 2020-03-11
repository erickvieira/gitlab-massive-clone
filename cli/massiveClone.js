const inquirer = require('inquirer');
const chalk = require('chalk');
const shell = require('shelljs');
const { Spinner } = require('cli-spinner');
const { defaultSpinner } = require('../settings/constants');

const { getUserData, initializeApi } = require('../services/gitlabApiService');

const massiveClone = async (path, options) => {
  let answers;
  let spinner = new Spinner('%s Fetching user data...');

  if (!path) {
    answers = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Please, type the Gitlab path to be scanned',
      validate: value => {
        if (value) {
          return true;
        } else return 'The path can not be null. ' +
          'Ex.: my_username:my_group/my_sub_group';
      }
    }]);
  }

  const { privateKey } = options;
  let overridePk;

  if (!privateKey) {
    const envResult = shell.exec('echo $GMC_PRIVATE_KEY', { silent: true });

    if (!envResult.code) {
      overridePk = envResult.stdout;
    }
  }

  let [ username, realpath ] = (path || answers.path).split(':');
  if (!realpath) {
    realpath = username;
    username = undefined;
  }

  spinner.setSpinnerString(defaultSpinner);
  spinner.start();

  initializeApi(privateKey || overridePk);

  const { id, name } = await getUserData({ username });
  
  spinner.stop(true);

  console.log('Path:', chalk.blue(realpath));
  console.log('User name:', chalk.blue(username));
  console.log('User id:', chalk.blue(id));
  console.log('User real name:', chalk.blue(name));
  console.log('Private key:', chalk.blue(privateKey || overridePk));
}

module.exports = massiveClone;