import { Routes, Route } from 'react-router-dom'
import ProblemsPage from './pages/ProblemsPage'
import CodingPage from './pages/CodingPage'

export default function App() {
  return (
    <div className="h-screen bg-app-gradient font-sans overflow-hidden">
      <Routes>
        <Route path="/" element={<ProblemsPage />} />
        <Route path="/problems/:problemId" element={<CodingPage />} />
      </Routes>
    </div>
  )
}
