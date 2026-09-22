import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Activity,
  Building2,
  CarFront,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import {
  getOrganisations,
  getSelectedWorkspaceId,
  logoutUser,
  saveSelectedWorkspaceId,
} from '../../api/client'


const navigation = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
  },
  {
    name: 'Vehicles',
    href: '/app/vehicles',
    icon: CarFront,
  },
  {
    name: 'New Inspection',
    href: '/app/inspections/new',
    icon: ScanLine,
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: ClipboardCheck,
  },
]


function DashboardLayout() {
  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()

  const [
    selectedWorkspace,
    setSelectedWorkspace,
  ] = useState<
    number | null
  >(
    getSelectedWorkspaceId(),
  )


  const {
    data: organisations = [],
    isLoading:
      organisationsLoading,
    isError:
      organisationsError,
    error:
      organisationsQueryError,
  } = useQuery({
    queryKey: [
      'organisations',
    ],

    queryFn:
      getOrganisations,
  })


  const effectiveWorkspaceId =
    selectedWorkspace ??
    getSelectedWorkspaceId()

  const currentWorkspace =
    organisations.find(
      (
        organisation,
      ) =>
        organisation.id ===
        effectiveWorkspaceId,
    ) ??
    organisations[0] ??
    null


  function handleLogout() {
    logoutUser()

    queryClient.clear()

    navigate(
      '/',
      {
        replace: true,
      },
    )
  }


  async function handleWorkspaceChange(
    value: string,
  ) {
    const workspaceId =
      Number(value)

    if (
      !Number.isInteger(
        workspaceId,
      ) ||
      workspaceId <= 0
    ) {
      return
    }

    if (
      workspaceId ===
      effectiveWorkspaceId
    ) {
      return
    }

    saveSelectedWorkspaceId(
      workspaceId,
    )

    setSelectedWorkspace(
      workspaceId,
    )

    navigate(
      '/app',
    )

    await queryClient
      .invalidateQueries({
        predicate:
          (
            query,
          ) =>
            query.queryKey[0] !==
            'organisations',
      })
  }


  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <aside
        className="
          fixed
          inset-y-0
          left-0
          hidden
          w-64
          border-r
          border-white/10
          bg-[#0d0f12]
          lg:flex
          lg:flex-col
        "
      >
        <div className="flex h-20 items-center px-6">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-white
              text-black
            "
          >
            <ShieldCheck
              size={22}
            />
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

        <div className="px-3">
          <div
            className="
              rounded-xl
              border
              border-white/10
              bg-white/[0.03]
              p-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Building2
                size={15}
                className="text-neutral-400"
              />

              <p
                className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.15em]
                  text-neutral-500
                "
              >
                Workspace
              </p>
            </div>

            {organisationsLoading ? (
              <p
                className="
                  mt-3
                  text-xs
                  text-neutral-500
                "
              >
                Loading workspaces...
              </p>
            ) : organisationsError ? (
              <p
                className="
                  mt-3
                  text-xs
                  text-red-300
                "
              >
                Unable to load
                workspaces
              </p>
            ) : organisations.length ===
              0 ? (
              <p
                className="
                  mt-3
                  text-xs
                  text-neutral-500
                "
              >
                No workspace
                available
              </p>
            ) : (
              <>
                <select
                  value={
                    currentWorkspace
                      ?.id ??
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    handleWorkspaceChange(
                      event
                        .target
                        .value,
                    )
                  }
                  className="
                    mt-3
                    w-full
                    rounded-lg
                    border
                    border-white/10
                    bg-[#111317]
                    px-3
                    py-2.5
                    text-xs
                    text-white
                    outline-none
                    transition
                    focus:border-white/30
                  "
                >
                  {
                    organisations.map(
                      (
                        organisation,
                      ) => (
                        <option
                          key={
                            organisation.id
                          }
                          value={
                            organisation.id
                          }
                        >
                          {
                            organisation.name
                          }
                        </option>
                      ),
                    )
                  }
                </select>

                {
                  currentWorkspace && (
                    <div
                      className="
                        mt-2
                        flex
                        items-center
                        justify-between
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-[10px]
                          capitalize
                          text-neutral-500
                        "
                      >
                        {
                          currentWorkspace
                            .role
                            .replace(
                              '_',
                              ' ',
                            )
                        }
                      </span>

                      <span
                        className="
                          text-[10px]
                          text-neutral-600
                        "
                      >
                        {
                          currentWorkspace
                            .vehicle_count
                        }{' '}
                        vehicle
                        {
                          currentWorkspace
                            .vehicle_count ===
                          1
                            ? ''
                            : 's'
                        }
                      </span>
                    </div>
                  )
                }
              </>
            )}
          </div>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3">
          {
            navigation.map(
              (
                item,
              ) => {
                const Icon =
                  item.icon

                return (
                  <NavLink
                    key={
                      item.name
                    }
                    to={
                      item.href
                    }
                    end={
                      item.href ===
                      '/app'
                    }
                    className={({
                      isActive,
                    }) =>
                      `
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        font-medium
                        transition
                        ${
                          isActive
                            ? (
                              'bg-white ' +
                              'text-black'
                            )
                            : (
                              'text-neutral-400 ' +
                              'hover:bg-white/5 ' +
                              'hover:text-white'
                            )
                        }
                      `
                    }
                  >
                    <Icon
                      size={18}
                    />

                    {
                      item.name
                    }
                  </NavLink>
                )
              },
            )
          }
        </nav>

        <div className="space-y-3 border-t border-white/10 p-5">
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-4
            "
          >
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
              AI inspection engine
              ready
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-white/10
              px-4
              py-3
              text-sm
              font-medium
              text-neutral-400
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            <LogOut
              size={18}
            />

            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className="
            sticky
            top-0
            z-20
            flex
            h-20
            items-center
            border-b
            border-white/10
            bg-[#08090b]/90
            px-5
            backdrop-blur-xl
            lg:px-8
          "
        >
          <button
            type="button"
            className="
              mr-4
              rounded-lg
              border
              border-white/10
              p-2
              lg:hidden
            "
          >
            <Menu
              size={20}
            />
          </button>

          <div>
            <p className="text-sm font-medium">
              RoadProof AI
            </p>

            <p className="text-xs text-neutral-500">
              {
                currentWorkspace
                  ? currentWorkspace
                    .name
                  : (
                    'Vehicle intelligence ' +
                    'platform'
                  )
              }
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {
              currentWorkspace && (
                <div
                  className="
                    hidden
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-3
                    py-1.5
                    text-xs
                    text-neutral-400
                    md:flex
                  "
                >
                  <Building2
                    size={13}
                  />

                  <span
                    className="
                      max-w-40
                      truncate
                    "
                  >
                    {
                      currentWorkspace
                        .name
                    }
                  </span>
                </div>
              )
            }

            <div
              className="
                hidden
                rounded-full
                border
                border-white/10
                bg-white/[0.03]
                px-3
                py-1.5
                text-xs
                text-neutral-400
                sm:block
              "
            >
              Development
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              title="Sign out"
              className="
                hidden
                items-center
                gap-2
                rounded-xl
                border
                border-white/10
                px-3
                py-2
                text-xs
                text-neutral-400
                transition
                hover:bg-white/5
                hover:text-white
                sm:flex
              "
            >
              <LogOut
                size={15}
              />

              Sign out
            </button>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          {
            organisationsLoading
              ? (
                <div
                  className="
                    flex
                    min-h-[50vh]
                    items-center
                    justify-center
                  "
                >
                  <p className="text-sm text-neutral-500">
                    Loading workspace...
                  </p>
                </div>
              )
              : organisationsError
                ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-500/20
                      bg-red-500/10
                      p-5
                    "
                  >
                    <p className="text-sm font-medium text-red-300">
                      Unable to load
                      workspace
                    </p>

                    <p
                      className="
                        mt-2
                        text-xs
                        text-red-300/70
                      "
                    >
                      {
                        organisationsQueryError
                          instanceof Error
                          ? (
                            organisationsQueryError
                              .message
                          )
                          : (
                            'Workspace request ' +
                            'failed.'
                          )
                      }
                    </p>
                  </div>
                )
                : organisations.length ===
                    0
                  ? (
                    <div
                      className="
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.02]
                        p-6
                      "
                    >
                      <p className="text-sm font-medium">
                        No workspace
                        available
                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          text-neutral-500
                        "
                      >
                        Your account does
                        not currently have
                        access to an active
                        workspace.
                      </p>
                    </div>
                  )
                  : (
                    <Outlet />
                  )
          }
        </main>
      </div>
    </div>
  )
}


export default DashboardLayout