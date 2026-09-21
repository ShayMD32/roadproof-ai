import {
  useQuery,
} from '@tanstack/react-query'

import {
  AlertTriangle,
  CarFront,
  CircleCheckBig,
  ScanLine,
  ShieldAlert,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router'

import {
  getDashboardSummary,
} from '../api/client'


function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  )
}


function Dashboard() {
  const navigate =
    useNavigate()

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'dashboard-summary',
    ],
    queryFn:
      getDashboardSummary,
  })


  const metrics = [
    {
      title:
        'Total Vehicles',

      value:
        data?.total_vehicles ??
        0,

      description:
        'Vehicles in this workspace',

      icon:
        CarFront,
    },
    {
      title:
        'Inspections',

      value:
        data?.total_inspections ??
        0,

      description:
        'AI assessments completed',

      icon:
        ScanLine,
    },
    {
      title:
        'Confirmed Damage',

      value:
        data?.damage_detected ??
        0,

      description:
        'Inspections with accepted damage',

      icon:
        AlertTriangle,
    },
    {
      title:
        'Manual Review',

      value:
        data?.manual_review_count ??
        0,

      description:
        'Inspections needing human review',

      icon:
        ShieldAlert,
    },
  ]


  return (
    <div className="mx-auto max-w-7xl">
      <div
        className="
          flex flex-col gap-4
          md:flex-row
          md:items-end
          md:justify-between
        "
      >
        <div>
          <p
            className="
              text-xs font-medium
              uppercase
              tracking-[0.25em]
              text-neutral-500
            "
          >
            Overview
          </p>

          <h1
            className="
              mt-2
              text-3xl font-semibold
              tracking-tight
              md:text-4xl
            "
          >
            Vehicle Intelligence
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-neutral-400
            "
          >
            Monitor vehicles, AI-assisted damage
            inspections and assessment results
            from one workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              '/app/inspections/new',
            )
          }
          className="
            rounded-xl
            bg-white
            px-5 py-3
            text-sm font-semibold
            text-black
            transition
            hover:bg-neutral-200
          "
        >
          Start new inspection
        </button>
      </div>

      {isError && (
        <div
          className="
            mt-6
            rounded-xl
            border border-red-500/20
            bg-red-500/10
            p-4
          "
        >
          <p className="text-sm text-red-300">
            Unable to load dashboard data.
          </p>

          <p className="mt-1 text-xs text-red-300/70">
            Check that the RoadProof API is running
            and try again.
          </p>
        </div>
      )}

      <section
        className="
          mt-8
          grid gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {metrics.map((metric) => {
          const Icon =
            metric.icon

          return (
            <div
              key={
                metric.title
              }
              className="
                rounded-2xl
                border border-white/10
                bg-[#0d0f12]
                p-5
              "
            >
              <div
                className="
                  flex items-center
                  justify-between
                "
              >
                <p className="text-sm text-neutral-400">
                  {metric.title}
                </p>

                <div
                  className="
                    flex h-9 w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/[0.05]
                    text-neutral-300
                  "
                >
                  <Icon
                    size={18}
                  />
                </div>
              </div>

              <p
                className="
                  mt-6
                  text-3xl font-semibold
                  tracking-tight
                "
              >
                {isLoading
                  ? '—'
                  : metric.value}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                {
                  metric.description
                }
              </p>
            </div>
          )
        })}
      </section>

      <section
        className="
          mt-6
          grid gap-6
          xl:grid-cols-[1.6fr_1fr]
        "
      >
        <div
          className="
            overflow-hidden
            rounded-2xl
            border border-white/10
            bg-[#0d0f12]
          "
        >
          <div
            className="
              flex items-center
              justify-between
              border-b
              border-white/10
              px-6 py-5
            "
          >
            <div>
              <h2 className="font-medium">
                Recent inspections
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                Latest AI-assisted vehicle assessments
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/app/reports',
                )
              }
              className="
                text-xs
                text-neutral-400
                transition
                hover:text-white
              "
            >
              View all
            </button>
          </div>

          {isLoading ? (
            <div
              className="
                flex min-h-72
                items-center
                justify-center
                px-6
              "
            >
              <p className="text-sm text-neutral-500">
                Loading inspections…
              </p>
            </div>
          ) : !data?.recent_inspections.length ? (
            <div
              className="
                flex min-h-72
                flex-col
                items-center
                justify-center
                px-6
                text-center
              "
            >
              <ScanLine
                size={24}
                className="text-neutral-400"
              />

              <h3
                className="
                  mt-4
                  text-sm
                  font-medium
                "
              >
                No inspections yet
              </h3>

              <p
                className="
                  mt-2
                  max-w-xs
                  text-xs
                  leading-5
                  text-neutral-500
                "
              >
                Add a vehicle, upload an image and
                run an AI-assisted inspection to see
                assessment results here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/app/inspections/new',
                  )
                }
                className="
                  mt-5
                  rounded-lg
                  border border-white/10
                  px-4 py-2
                  text-xs font-medium
                  text-neutral-300
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                Start inspection
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recent_inspections.map(
                (
                  inspection,
                ) => {
                  let statusLabel =
                    'No confirmed damage'

                  let StatusIcon =
                    CircleCheckBig

                  if (
                    inspection
                      .manual_review_required
                  ) {
                    statusLabel =
                      'Manual review'

                    StatusIcon =
                      ShieldAlert
                  } else if (
                    inspection
                      .damage_detected
                  ) {
                    statusLabel =
                      'Damage confirmed'

                    StatusIcon =
                      AlertTriangle
                  }

                  return (
                    <button
                      key={
                        inspection.id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          inspection.report_url,
                        )
                      }
                      className="
                        flex w-full
                        flex-col gap-4
                        px-6 py-4
                        text-left
                        transition
                        hover:bg-white/[0.03]
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {
                            inspection.make
                          }{' '}
                          {
                            inspection.model
                          }
                        </p>

                        <div
                          className="
                            mt-1
                            flex flex-wrap
                            items-center
                            gap-x-3 gap-y-1
                            text-xs
                            text-neutral-500
                          "
                        >
                          <span>
                            {
                              inspection.registration
                            }
                          </span>

                          <span>
                            Inspection #
                            {
                              inspection.id
                            }
                          </span>

                          <span>
                            {
                              formatDate(
                                inspection.created_at,
                              )
                            }
                          </span>
                        </div>
                      </div>

                      <div
                        className="
                          flex items-center gap-3
                          sm:justify-end
                        "
                      >
                        <StatusIcon
                          size={16}
                          className="text-neutral-400"
                        />

                        <div className="sm:text-right">
                          <p className="text-sm">
                            {statusLabel}
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              capitalize
                              text-neutral-500
                            "
                          >
                            {inspection.severity
                              ? `${inspection.severity} severity`
                              : 'Severity not assigned'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          )}
        </div>

        <div
          className="
            rounded-2xl
            border border-white/10
            bg-[#0d0f12]
            p-6
          "
        >
          <p className="text-sm font-medium">
            AI Engine
          </p>

          <p
            className="
              mt-1
              text-xs
              text-neutral-500
            "
          >
            Vehicle damage assessment service
          </p>

          <div
            className="
              mt-8
              flex items-center
              gap-3
            "
          >
            <span
              className="
                h-2.5 w-2.5
                rounded-full
                bg-emerald-400
              "
            />

            <div>
              <p className="text-sm font-medium">
                Model operational
              </p>

              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
                Ready for image analysis
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div
              className="
                rounded-xl
                border border-white/10
                bg-white/[0.02]
                p-4
              "
            >
              <p className="text-xs text-neutral-500">
                Scan threshold
              </p>

              <p className="mt-1 text-lg font-medium">
                1%
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-neutral-500
                "
              >
                Low-confidence candidates are retained
                as review signals rather than treated
                as confirmed damage.
              </p>
            </div>

            <div
              className="
                border-t
                border-white/10
                pt-4
              "
            >
              <p className="text-xs text-neutral-500">
                Damage acceptance threshold
              </p>

              <p className="mt-1 text-sm">
                25%
              </p>
            </div>

            <div
              className="
                border-t
                border-white/10
                pt-4
              "
            >
              <p className="text-xs text-neutral-500">
                Model
              </p>

              <p className="mt-1 text-sm">
                YOLOv11 Vehicle Damage
              </p>
            </div>

            <div
              className="
                border-t
                border-white/10
                pt-4
              "
            >
              <p className="text-xs text-neutral-500">
                Assessment mode
              </p>

              <p className="mt-1 text-sm">
                AI-assisted inspection
              </p>
            </div>
          </div>

          <div
            className="
              mt-6
              rounded-xl
              border border-amber-500/15
              bg-amber-500/[0.05]
              p-4
            "
          >
            <p
              className="
                text-xs
                leading-5
                text-neutral-400
              "
            >
              Model confidence is not a calibrated
              probability of vehicle condition.
              Uncertain or significant results should
              be reviewed by a person.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}


export default Dashboard