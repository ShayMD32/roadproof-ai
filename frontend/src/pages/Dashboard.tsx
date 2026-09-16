import {
  AlertTriangle,
  CarFront,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

import { useQuery } from '@tanstack/react-query'

import { getVehicles } from '../api/client'


function Dashboard() {
  const {
    data: vehicles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  })

  const metrics = [
    {
      title: 'Total Vehicles',
      value: isLoading
        ? '...'
        : vehicles.length.toString(),
      description: 'Vehicles registered',
      icon: CarFront,
    },
    {
      title: 'Inspections',
      value: '0',
      description: 'AI inspections completed',
      icon: ScanLine,
    },
    {
      title: 'Damage Detected',
      value: '0',
      description: 'Vehicles with damage',
      icon: AlertTriangle,
    },
    {
      title: 'Clear Inspections',
      value: '0',
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

          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Monitor vehicles, AI damage inspections and
            assessment results from one platform.
          </p>

          {isError && (
            <p className="mt-3 text-sm text-red-400">
              Could not connect to the RoadProof backend.
            </p>
          )}
        </div>

        <button
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

      <section
        className="
          mt-8 grid gap-4
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
              <div className="flex items-center justify-between">
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
                {metric.value}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
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

              <p className="mt-1 text-xs text-neutral-500">
                Latest AI vehicle assessments
              </p>
            </div>
          </div>

          <div
            className="
              flex min-h-72
              flex-col items-center justify-center
              px-6 text-center
            "
          >
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-white/[0.05]
              "
            >
              <ScanLine
                size={22}
                className="text-neutral-400"
              />
            </div>

            <h3 className="mt-4 text-sm font-medium">
              No inspections yet
            </h3>

            <p
              className="
                mt-2 max-w-xs
                text-xs leading-5
                text-neutral-500
              "
            >
              Upload a vehicle damage image and run an
              AI inspection to see results here.
            </p>
          </div>
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

          <p className="mt-1 text-xs text-neutral-500">
            Damage detection service
          </p>

          <div className="mt-8 flex items-center gap-3">
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

              <p className="text-xs text-neutral-500">
                Ready for analysis
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <div
                className="
                  flex justify-between
                  text-xs text-neutral-500
                "
              >
                <span>Confidence threshold</span>
                <span>25%</span>
              </div>

              <div
                className="
                  mt-2 h-1.5
                  overflow-hidden
                  rounded-full
                  bg-white/5
                "
              >
                <div className="h-full w-1/4 bg-white" />
              </div>
            </div>

            <div
              className="
                border-t border-white/10
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
          </div>
        </div>
      </section>
    </div>
  )
}


export default Dashboard