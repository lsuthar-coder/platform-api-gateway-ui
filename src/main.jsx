import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import { ProtectedLayout } from './App'
import LoginPage        from './pages/LoginPage'
import OverviewPage     from './pages/OverviewPage'
import UsersPage        from './pages/UsersPage'
import RoutesPage       from './pages/RoutesPage'
import CircuitPage      from './pages/CircuitPage'
import PublicRoutesPage from './pages/PublicRoutesPage'
import MetricsPage      from './pages/MetricsPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#1f2937' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1f2937' } },
          duration: 3000,
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="/users"         element={<UsersPage />} />
            <Route path="/routes"        element={<RoutesPage />} />
            <Route path="/circuit"       element={<CircuitPage />} />
            <Route path="/public-routes" element={<PublicRoutesPage />} />
            <Route path="/metrics"       element={<MetricsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
