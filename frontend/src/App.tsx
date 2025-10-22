import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AppealFormPage from './pages/AppealFormPage'
import AppealStatusPage from './pages/AppealStatusPage'
import OperatorDashboard from './pages/OperatorDashboard'
import AdminPanel from './pages/AdminPanel'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="appeal" element={<AppealFormPage />} />
            <Route path="appeal/:id" element={<AppealStatusPage />} />
            <Route path="appeal-status" element={<AppealStatusPage />} />
            <Route path="appeal-status/:trackingNumber" element={<AppealStatusPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="operator" element={<OperatorDashboard />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App