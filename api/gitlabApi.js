const axios = require('axios').default;
const { baseURL } = require('../settings/constants');

let api;

const initializeApi = (token) => {
  api = axios.create({
    baseURL,
    headers: {
      'PRIVATE-TOKEN': token.trim(),
    },
  });
};

const getUserData = async ({ username = "" }) => {
  if (username.length > 0) {
    const [userdata] = (await api.get('/users', {
      params: { username }
    })).data;
    const { id, name } = userdata;
    return { id, name, username };
  } else throw new Error('invalid_username');
};

const getUserGroups = async ({ path = "" }) => {
  if (path.length > 0) {
    let groups = [];
    let page = 1;
    while (page > 0) {
      const response = (await api.get('/groups', {
        params: { page }
      })).data;
      if (response.length === 0) {
        page = -1;
      } else {
        page++;
        groups = [...groups, ...response];
      }
    }
    return groups.map(({ id, full_name, full_path, path }) => ({
      id,
      full_name,
      full_path,
      path,
      selected: false,
    })).filter(g => (
      g.full_path.includes(path))
    ).reduce((unique, item) => (
      unique.findIndex(u => u.id === item.id) > 0 ? (
        unique
      ) : (
        [...unique, item]
      )
    ), []).sort((x, y) => x.full_path > y.full_path);
  } else throw new Error('invalid_path');
};

const getGroupProjects = async ({ groupId = 0 }) => {
  if (groupId > 0) {
    let projects = [];
    let page = 1;

    while (page > 0) {
      const response = (await api.get(`/groups/${groupId}/projects`, {
        params: { page }
      })).data;
      if (response.length === 0) {
        page = -1;
      } else {
        page++;
        projects = [...projects, ...response];
      }
    }
    return projects.map(({ id, path_with_namespace, name_with_namespace, path }) => {
      return {
        id,
        full_name: name_with_namespace,
        full_path: path_with_namespace,
        path,
        selected: false,
      }
    });
  } else throw new Error('invalid_group_id');
};

const getSubGroups = async ({ groupId = 0 }) => {
  if (groupId > 0) {
    let subgroups = [];
    let page = 1;

    while (page > 0) {
      const response = (await api.get(`/groups/${groupId}/subgroups`, {
        params: { page }
      })).data;
      if (response.length === 0) {
        page = -1;
      } else {
        page++;
        subgroups = [...subgroups, ...response];
      }
    }
    return subgroups.map(({ id, full_path, full_name, path }) => {
      return {
        id,
        full_name,
        full_path,
        path,
        selected: false,
      }
    });
  } else throw new Error('invalid_group_id');
};

module.exports = {
  getUserData,
  getUserGroups,
  getGroupProjects,
  getSubGroups,
  initializeApi,
}