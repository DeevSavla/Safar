import api from './api'

function registerDevice(deviceData) {
  return api.post('/notifications/register-device', deviceData)
    .then(response => response.data)
}

export {
  registerDevice
} 