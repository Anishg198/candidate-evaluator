import { Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ProblemsPage from './pages/ProblemsPage'
import CodingPage from './pages/CodingPage'
import ReportPage from './pages/ReportPage'
import HRDashboard from './pages/HRDashboard'

export default function App() {
  return (
    <div className="h-screen bg-app-gradient font-sans overflow-hidden">
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:problemId" element={<CodingPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/hr" element={<HRDashboard />} />
      </Routes>
    </div>
  )
}
