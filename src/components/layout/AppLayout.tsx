import { Outlet, NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n'

export default function AppLayout() {
  const { lang, setLang, t } = useLanguage()

  const links = [
    { to: '/', label: t('dashboard'), icon: '✿' },
    { to: '/sessions', label: t('sessions'), icon: '❋' },
  ]

  return (
    <div className="flex h-screen">
      <aside className="w-60 sidebar-glow flex flex-col animate-fade-in">
        <div className="px-5 py-5 border-b border-pink-200/60">
          <h1 className="text-base font-bold tracking-tight">
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              {t('appTitle')}
            </span>
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-pink-50 text-pink-500 font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-pink-400 hover:bg-pink-50/50'
                }`
              }
            >
              <span className="text-xs opacity-60">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-pink-200/60">
          <div className="flex items-center gap-1.5 bg-pink-50 rounded-xl p-1">
            <button
              onClick={() => setLang('zh')}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 ${
                lang === 'zh'
                  ? 'bg-pink-400 text-white shadow-sm'
                  : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 ${
                lang === 'en'
                  ? 'bg-pink-400 text-white shadow-sm'
                  : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 relative">
        <Outlet />
      </main>
    </div>
  )
}
