import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { LayoutDashboard, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { login, getMe } from '../utils/api'
import { authActions } from '../store'

export default function LoginPage() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await login(email, password)
      localStorage.setItem('gw_token', data.accessToken)
      const { data: user } = await getMe()
      dispatch(authActions.setCredentials({ token: data.accessToken, user }))
      toast.success(`Welcome, ${user.email}`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 mb-4">
            <LayoutDashboard className="text-indigo-400" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-gray-100">Gateway Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage the platform</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email</label>
            <input type="email" className="input" placeholder="you@lsuthar.in"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Password</label>
            <input type="password" className="input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading && <Loader size={14} className="animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
