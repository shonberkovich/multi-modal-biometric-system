import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Enrollment from './pages/Enrollment'
import SingleVerification from './pages/SingleVerification'
import FusionVerification from './pages/FusionVerification'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/enrollment" replace />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/verify/single" element={<SingleVerification />} />
          <Route path="/verify/fusion" element={<FusionVerification />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
