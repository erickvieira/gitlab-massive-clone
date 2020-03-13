const inquirer = require('inquirer');
const chalk = require('chalk');
const shell = require('shelljs');
const { Spinner } = require('cli-spinner');
const Table = require('cli-table');
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
  const projects = await (
    getProjectsConsideringSubgroups(selectedGroups, [])
  );
  choices = projects.map(g => ({
    name: g.full_name,
    short: g.path,
    value: g.id,
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

  spinner.setSpinnerTitle(`${chalk.green('%s')} Creating dir structure...`);
  spinner.start();
  const selectedProjects = projects.filter(({ id }) => (
    reposPrompt.selected.includes(id)
  ));

  let dirs = [];
  const rootDir = shell.exec('pwd', { silent: true }).stdout;
  const clonedRepos = []
  let gitCloneResult;
  selectedProjects.forEach(p => {
    dirs = p.full_path.split('/');
    dirs.pop();
    dirs.forEach(dir => {
      shell.exec(`mkdir ${dir}`, { silent: true });
      shell.exec(`cd ${dir}`, { silent: true });
    });
    spinner.setSpinnerTitle(`${chalk.green('%s')} Cloning ${p.full_path}...`);
    gitCloneResult = shell.exec(
      `git clone https://x-token-auth:${privateKey}@gitlab.com/${p.full_path}.git`
    );
    clonedRepos.push({
      id: p.id,
      full_path: p.full_path,
      status: gitCloneResult.code ? chalk.red('×') : chalk.green('✓')
    });
    shell.exec(`cd ${rootDir}`);
  });
  spinner.stop();

  printResultTable(clonedRepos);
}

const printResultTable = (data) => {
  const table = new Table({
    head: ['id', 'path', 'status'],
    colWidths: [10, 40, 10]
  });
  data.map(({ id, full_path, status }) =>
    table.push([
      id,
      full_path,
      status
    ])
  );
  console.log(table.toString());
}

module.exports = massiveClone;