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

