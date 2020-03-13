const {
  initializeApi,
  getUserData,
  getUserGroups,
  getGroupProjects,
  getSubGroups,
} = require('../api/gitlabApi');

const getStructuredGroupList = async ({ path = "" }) => {
  if (path && path.length > 0) {
    return await getUserGroups({ path });
  } else throw new Error('invalid_path');
}

const getProjectsConsideringSubgroups = async (
  groups = [],
  projects = [],
) => {
  if (groups.length > 0) {
    projects = projects.concat((
      await Promise.all(groups.map(async ({ id }) => (
        getGroupProjects({ groupId: id })
      )))
    ).reduce((acc, item) => [...acc, ...item], []));
    let subgroups = [];
    subgroups = subgroups.concat((
      await Promise.all(groups.map(async ({ id }) => (
        getSubGroups({ groupId: id })
      )))
    ).reduce((acc, item) => [...acc, ...item], []));
    if (subgroups.length > 0) {
      projects = projects.concat(
        await getProjectsConsideringSubgroups(subgroups, projects)
      )
    }
    return projects.reduce((unique, p) => (
      unique.findIndex(u => u.id === p.id) < 0 ? (
        [...unique, p]
      ) : (
        unique
      )
    ), []);
  } else throw new Error('invalid_group_list');
}

module.exports = {
  getUserData,
  initializeApi,
  getStructuredGroupList,
  getProjectsConsideringSubgroups,
}