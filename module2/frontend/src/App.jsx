import { Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import TestPage from './pages/TestPage'
import ResultPage from './pages/ResultPage'

export default function App() {
  return (
    <div className="min-h-screen bg-app-gradient font-sans">
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/test/:sessionId" element={<TestPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
      </Routes>
    </div>
  )
}
