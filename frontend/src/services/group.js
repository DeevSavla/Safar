import api from './api'

function getGroups() {
  return api.get('/groups')
    .then(response => response.data)
}

function getGroupById(id) {
  return api.get(`/groups/${id}`)
    .then(response => response.data)
}

function createGroup(groupData) {
  return api.post('/groups', groupData)
    .then(response => response.data)
}

function updateGroup(id, groupData) {
  return api.put(`/groups/${id}`, groupData)
    .then(response => response.data)
}

function deleteGroup(id) {
  return api.delete(`/groups/${id}`)
    .then(response => response.data)
}

function addMemberToGroup(groupId, memberData) {
  return api.post(`/groups/${groupId}/members`, memberData)
    .then(response => response.data)
}

function getGroupItineraries(groupId) {
  return api.get(`/groups/${groupId}/itineraries`)
    .then(response => response.data)
}

export {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  getGroupItineraries
} 