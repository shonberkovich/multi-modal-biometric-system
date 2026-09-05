import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export function enroll({ nationalId, fullName, face, voice, palm, gait, fingerprint }) {
  const form = new FormData()
  form.append('national_id', nationalId)
  form.append('full_name', fullName)
  form.append('face', face)
  form.append('voice', voice)
  form.append('palm', palm)
  form.append('gait', gait)
  form.append('fingerprint', fingerprint)
  return api.post('/enroll', form)
}

export function verifySingle({ method, file }) {
  const form = new FormData()
  form.append('method', method)
  form.append('file', file)
  return api.post('/verify/single', form)
}

export function verifyFusion({ face, voice, palm }) {
  const form = new FormData()
  form.append('face', face)
  form.append('voice', voice)
  form.append('palm', palm)
  return api.post('/verify/fusion', form)
}

export function listPersons() {
  return api.get('/persons')
}

