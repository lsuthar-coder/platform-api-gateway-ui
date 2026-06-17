import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { getHealth } from './utils/api'

export function ProtectedLayout() {
  const token = useSelector((s) => s.auth.token)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    if (!token) return
    getHealth().then(({ data }) => setHealth(data.status)).catch(() => setHealth('error'))
  }, [token])

  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar health={health} />
      <main className="flex-1 p-8 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
