import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CarFront,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

import { useNavigate } from 'react-router'

import {
  getDashboardSummary,
} from '../api/client'


function Dashboard() {
  const navigate = useNavigate()

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })


  const metrics = [
    {
      title: 'Total Vehicles',
      value: data?.total_vehicles ?? 0,
      description: 'Vehicles registered',
      icon: CarFront,
    },
    {
      title: 'Inspections',
      value: data?.total_inspections ?? 0,
      description: 'AI inspections completed',
      icon: ScanLine,
    },
    {
      title: 'Damage Detected',
      value: data?.damage_detected ?? 0,
      description: 'Inspections with damage',
      icon: AlertTriangle,
    },
    {
      title: 'Clear Inspections',
      value: data?.clear_inspections ?? 0,
      description: 'No damage detected',
      icon: ShieldCheck,
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
              text-neutral-400
            "
          >
            Monitor vehicles, AI damage inspections
            and assessment results from one platform.
          </p>
        </div>

        <button
          onClick={() =>
            navigate('/inspections/new')
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
          const Icon = metric.icon

          return (
            <div
              key={metric.title}
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
                    items-center justify-center
                    rounded-xl
                    bg-white/[0.05]
                    text-neutral-300
                  "
                >
                  <Icon size={18} />
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
                {metric.description}
              </p>
            </div>
          )
        })}
      </section>

      <section
        className="
          mt-6 grid gap-6
          xl:grid-cols-[1.6fr_1fr]
        "
      >
        <div
          className="
            rounded-2xl
            border border-white/10
            bg-[#0d0f12]
          "
        >
          <div
            className="
              flex items-center justify-between
              border-b border-white/10
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
                  text-xs text-neutral-500
                "
              >
                Latest AI vehicle assessments
              </p>
            </div>
          </div>

          {!data?.recent_inspections.length ? (
            <div
              className="
                flex min-h-72
                flex-col items-center justify-center
                px-6 text-center
              "
            >
              <ScanLine
                size={22}
                className="text-neutral-400"
              />

              <h3
                className="
                  mt-4
                  text-sm font-medium
                "
              >
                No inspections yet
              </h3>

              <p
                className="
                  mt-2 max-w-xs
                  text-xs leading-5
                  text-neutral-500
                "
              >
                Upload a vehicle damage image and
                run an AI inspection to see results here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recent_inspections.map(
                (inspection) => (
                  <button
                    key={inspection.id}
                    onClick={() =>
                      navigate(
                        `/reports/${inspection.id}`,
                      )
                    }
                    className="
                      flex w-full
                      items-center justify-between
                      px-6 py-4
                      text-left
                      transition
                      hover:bg-white/[0.03]
                    "
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {inspection.make}{' '}
                        {inspection.model}
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-neutral-500
                        "
                      >
                        {inspection.registration}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm capitalize">
                        {inspection.severity ?? 'None'}
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-neutral-500
                        "
                      >
                        Inspection #{inspection.id}
                      </p>
                    </div>
                  </button>
                ),
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
            Damage detection service
          </p>

          <div
            className="
              mt-8
              flex items-center gap-3
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
                Ready for analysis
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <div
                className="
                  flex justify-between
                  text-xs
                  text-neutral-500
                "
              >
                <span>
                  Confidence threshold
                </span>

                <span>
                  1% debug
                </span>
              </div>

              <div
                className="
                  mt-2
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-white/5
                "
              >
                <div
                  className="
                    h-full
                    w-[1%]
                    min-w-[3px]
                    bg-white
                  "
                />
              </div>
            </div>

            <div
              className="
                border-t
                border-white/10
                pt-4
              "
            >
              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
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
              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
                Assessment mode
              </p>

              <p className="mt-1 text-sm">
                AI-assisted inspection
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


export default Dashboard