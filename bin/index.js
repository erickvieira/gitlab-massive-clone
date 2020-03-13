#!/usr/bin/env node

const program = require('commander');
const massiveClone = require('../cli/massiveClone');

program.command(
  'clone [path]'
).description(
  'Display an interactive prompt helper to select group\'s repos to clone.'
).option(
  '-p, --private-key [privateKey]',
  'The private key for GitLab authentication (used to display private repos).'
).action(massiveClone);

program.parse(process.argv);
