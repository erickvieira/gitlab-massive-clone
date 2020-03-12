const inquirer = require('inquirer');
const chalk = require('chalk');
const shell = require('shelljs');
const { Spinner } = require('cli-spinner');
const { defaultSpinner } = require('../settings/constants');

const {
  getUserData,
  initializeApi,
  getStructuredGroupList,
  getProjectsConsideringSubgroups,
} = require('../services/gitlabApiService');

const massiveClone = async (path, options) => {
  let answers;
  let spinner = new Spinner(`${chalk.green('%s')} Fetching user data...`);

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

  // ===========================================================================
  spinner.setSpinnerString(defaultSpinner);
  spinner.start();

  initializeApi(privateKey || overridePk);

  const userData = await getUserData({ username });
  
  spinner.stop(true);
  // ===========================================================================
  
  // ===========================================================================
  spinner.setSpinnerTitle(`${chalk.green('%s')} Loading groups...`);
  spinner.start();
  const groups = await getStructuredGroupList({ path: realpath });
  let choices = groups.map(g => ({
    name: g.full_name,
    short: g.path,
    value: g.id,
    type: 'choice'
  }));
  spinner.stop(true);
  // ===========================================================================
  
  const groupsPrompt = await inquirer.prompt({
    type: 'checkbox',
    name: 'selected',
    message: 'Please, select the subgroups where you want to search repos:\n',
    choices,
  });
  
  // ===========================================================================
  spinner.setSpinnerTitle(`${chalk.green('%s')} Searching projects...`);
  spinner.start();
  const selectedGroups = groups.filter(({ id }) => (
    groupsPrompt.selected.includes(id)
  ));
  const groupProjectsRequests = await (
    getProjectsConsideringSubgroups(selectedGroups, [])
  );
  choices = groupProjectsRequests.map(g => ({
    name: g.full_name,
    short: g.path,
    value: g.full_path,
    type: 'choice'
  }));
  spinner.stop(true);
  // ===========================================================================
  
  const reposPrompt = await inquirer.prompt({
    type: 'checkbox',
    name: 'selected',
    message: 'Choose the project repos to clone:\n',
    choices,
  });

  console.log(reposPrompt.selected);
}

module.exports = massiveClone;