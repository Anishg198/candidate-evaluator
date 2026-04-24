import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import CandidateRegister from './pages/CandidateRegister'
import CandidateUpload from './pages/CandidateUpload'
import HRDashboard from './pages/HRDashboard'
import JobCreate from './pages/JobCreate'
import CandidateProfile from './pages/CandidateProfile'
import AppliedConfirmation from './pages/AppliedConfirmation'
import Settings from './pages/Settings'
import HRPortal from './pages/HRPortal'
import { useAppStore } from './store/appStore'
import { Toaster } from './components/ui/toaster'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'

function Guard({ children, allow }) {
  // Route access is role-based, so we guard candidate and HR screens here instead of inside each page.
  const role = useAppStore((state) => state.role)
  if (!allow(role)) return <Navigate to="/" replace />
  return children
}

const candidateOnboardingRoutes = new Set(['/', '/register', '/upload', '/applied'])

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = useAppStore((state) => state.role)
  const clearRole = useAppStore((state) => state.clearRole)

  if (candidateOnboardingRoutes.has(location.pathname) || location.pathname === '/hr') return null

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            H
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-700">HCL AI Candidate Evaluation Platform</p>
            <p className="text-lg font-bold text-slate-900">CV Matcher</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">{role || 'No Role Selected'}</Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearRole()
              navigate('/')
            }}
          >
            Back to Candidate Page
          </Button>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* The app is split into candidate onboarding, HR workspace, and shared utility pages. */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hr" element={<HRPortal />} />
        <Route
          path="/register"
          element={
            <Guard allow={(role) => role === 'CANDIDATE' || !role}>
              <CandidateRegister />
            </Guard>
          }
        />
        <Route
          path="/upload"
          element={
            <Guard allow={(role) => role === 'CANDIDATE'}>
              <CandidateUpload />
            </Guard>
          }
        />
        <Route
          path="/applied"
          element={
            <Guard allow={(role) => role === 'CANDIDATE'}>
              <AppliedConfirmation />
            </Guard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Guard allow={(role) => role === 'HR'}>
              <HRDashboard />
            </Guard>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <Guard allow={(role) => role === 'HR'}>
              <JobCreate />
            </Guard>
          }
        />
        <Route
          path="/candidate/:id"
          element={
            <Guard allow={(role) => role === 'HR'}>
              <CandidateProfile />
            </Guard>
          }
        />
        <Route
          path="/settings"
          element={
            <Guard allow={(role) => role === 'HR' || role === 'CANDIDATE'}>
              <Settings />
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  )
}
