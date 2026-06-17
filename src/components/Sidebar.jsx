import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutDashboard, Users, Route, Globe, LogOut, Activity, BarChart2, Zap } from 'lucide-react'
import { authActions } from '../store'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Overview'        },
  { to: '/users',         icon: Users,           label: 'Users'           },
  { to: '/routes',        icon: Route,           label: 'Routes'          },
  { to: '/circuit',       icon: Zap,             label: 'Circuit Breakers'},
  { to: '/public-routes', icon: Globe,           label: 'Public Routes'   },
  { to: '/metrics',       icon: BarChart2,       label: 'Metrics'         },
]

export function Sidebar({ health }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user     = useSelector((s) => s.auth.user)
  const isAdmin  = user?.role === 'admin'

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard size={16} className="text-indigo-400" />
          <span className="font-semibold text-gray-100 text-sm">Gateway</span>
        </div>
        <p className="text-xs text-gray-600 mono">lsuthar.in platform</p>
      </div>

      <div className="px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2 text-xs">
          <Activity size={11} className={health === 'ok' ? 'text-emerald-400' : 'text-red-400'} />
          <span className="text-gray-600">gateway</span>
          <span className={`mono ${health === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{health || '…'}</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
               ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}`
            }
          >
            <Icon size={14} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-semibold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-300 truncate">{user?.email}</p>
            <p className={`text-xs mono ${isAdmin ? 'text-amber-400' : 'text-gray-500'}`}>{user?.role}</p>
          </div>
          <button onClick={() => { dispatch(authActions.logout()); navigate('/login') }}
            className="text-gray-600 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
