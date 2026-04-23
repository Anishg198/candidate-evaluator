import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ApplyPage from './pages/ApplyPage'
import ApplicationSuccessPage from './pages/ApplicationSuccessPage'
import WrittenTestPage from './pages/WrittenTestPage'
import WrittenTestDonePage from './pages/WrittenTestDonePage'
import InterviewPage from './pages/InterviewPage'
import CodingProblemsPage from './pages/CodingProblemsPage'
import CodingEditorPage from './pages/CodingEditorPage'
import FinalReportPage from './pages/FinalReportPage'
import HRDashboard from './pages/HRDashboard'
import TestInstructionsPage from './pages/TestInstructionsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-app-gradient-light dark:bg-app-gradient font-sans transition-colors duration-200">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply/:jobId" element={<ApplyPage />} />
        <Route path="/applied" element={<ApplicationSuccessPage />} />
        <Route path="/instructions" element={<TestInstructionsPage />} />
        <Route path="/written-test/:sessionId" element={<WrittenTestPage />} />
        <Route path="/written-test-done" element={<WrittenTestDonePage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/coding" element={<CodingProblemsPage />} />
        <Route path="/coding/:problemId" element={<CodingEditorPage />} />
        <Route path="/report" element={<FinalReportPage />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
