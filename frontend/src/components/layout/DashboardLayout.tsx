import {
  Activity,
  CarFront,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
} from 'react-router'


const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Vehicles',
    href: '/vehicles',
    icon: CarFront,
  },
  {
    name: 'New Inspection',
    href: '/inspections/new',
    icon: ScanLine,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ClipboardCheck,
  },
]


function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <aside
        className="
          fixed inset-y-0 left-0
          hidden w-64
          border-r border-white/10
          bg-[#0d0f12]
          lg:flex lg:flex-col
        "
      >
        <div className="flex h-20 items-center px-6">
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              bg-white text-black
            "
          >
            <ShieldCheck size={22} />
          </div>

          <div className="ml-3">
            <p className="text-lg font-semibold tracking-tight">
              RoadProof
            </p>

            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              AI Inspection
            </p>
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3
                    rounded-xl px-4 py-3
                    text-sm font-medium
                    transition
                    ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }
                  `
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <Activity
                size={15}
                className="text-emerald-400"
              />

              <span className="text-xs text-neutral-300">
                System status
              </span>
            </div>

            <p className="mt-2 text-sm font-medium">
              All systems operational
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              AI inspection engine ready
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className="
            sticky top-0 z-20
            flex h-20 items-center
            border-b border-white/10
            bg-[#08090b]/90
            px-5
            backdrop-blur-xl
            lg:px-8
          "
        >
          <button
            className="
              mr-4 rounded-lg
              border border-white/10
              p-2
              lg:hidden
            "
          >
            <Menu size={20} />
          </button>

          <div>
            <p className="text-sm font-medium">
              RoadProof AI
            </p>

            <p className="text-xs text-neutral-500">
              Vehicle intelligence platform
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div
              className="
                hidden
                rounded-full
                border border-white/10
                bg-white/[0.03]
                px-3 py-1.5
                text-xs text-neutral-400
                sm:block
              "
            >
              Development
            </div>

            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full
                bg-neutral-800
                text-xs font-semibold
              "
            >
              SM
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


export default DashboardLayout