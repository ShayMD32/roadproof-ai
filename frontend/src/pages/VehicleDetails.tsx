import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  ImageIcon,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'
import {
  Link,
  useParams,
} from 'react-router'

import {
  getVehicle,
  getVehicleDamageImages,
  getVehicleInspectionSummary,
} from '../api/client'


function VehicleDetails() {
  const { registration = '' } = useParams()

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', registration],
    queryFn: () => getVehicle(registration),
    enabled: Boolean(registration),
  })

  const imagesQuery = useQuery({
    queryKey: ['vehicle-images', registration],
    queryFn: () => getVehicleDamageImages(registration),
    enabled: Boolean(registration),
  })

  const summaryQuery = useQuery({
    queryKey: ['vehicle-summary', registration],
    queryFn: () => getVehicleInspectionSummary(registration),
    enabled: Boolean(registration),
  })

  if (
    vehicleQuery.isLoading ||
    imagesQuery.isLoading ||
    summaryQuery.isLoading
  ) {
    return (
      <div className="text-sm text-neutral-400">
        Loading vehicle...
      </div>
    )
  }

  if (
    vehicleQuery.isError ||
    imagesQuery.isError ||
    summaryQuery.isError
  ) {
    return (
      <div className="text-sm text-red-400">
        Could not load vehicle details.
      </div>
    )
  }

  const vehicle = vehicleQuery.data
  const images = imagesQuery.data ?? []
  const summary = summaryQuery.data

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/vehicles"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to vehicles
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Vehicle profile
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <CarFront size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {vehicle?.make} {vehicle?.model}
              </h1>

              <p className="mt-1 text-sm text-neutral-400">
                {vehicle?.year}
              </p>
            </div>
          </div>
        </div>

        <span className="w-fit rounded-md bg-white px-3 py-2 text-sm font-bold tracking-wider text-black">
          {vehicle?.registration}
        </span>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              Damage Images
            </p>

            <ImageIcon
              size={18}
              className="text-neutral-400"
            />
          </div>

          <p className="mt-6 text-3xl font-semibold">
            {summary?.total_images ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              Inspections
            </p>

            <ScanLine
              size={18}
              className="text-neutral-400"
            />
          </div>

          <p className="mt-6 text-3xl font-semibold">
            {summary?.total_inspections ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              Damage Detected
            </p>

            {summary?.damage_detected ? (
              <AlertTriangle
                size={18}
                className="text-amber-400"
              />
            ) : (
              <ShieldCheck
                size={18}
                className="text-emerald-400"
              />
            )}
          </div>

          <p className="mt-6 text-3xl font-semibold">
            {summary?.damage_detected ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <p className="text-sm text-neutral-400">
            Latest Severity
          </p>

          <p className="mt-6 text-3xl font-semibold capitalize">
            {summary?.latest_severity ?? 'None'}
          </p>

          {summary?.latest_severity_score !== null &&
            summary?.latest_severity_score !== undefined && (
              <p className="mt-1 text-xs text-neutral-500">
                Score: {summary.latest_severity_score}
              </p>
            )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-6">
          <h2 className="font-medium">
            Vehicle information
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-neutral-500">
                Registration
              </span>

              <span className="text-sm">
                {vehicle?.registration}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-neutral-500">
                Make
              </span>

              <span className="text-sm">
                {vehicle?.make}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-neutral-500">
                Model
              </span>

              <span className="text-sm">
                {vehicle?.model}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">
                Year
              </span>

              <span className="text-sm">
                {vehicle?.year}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0f12]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="font-medium">
              Damage image history
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              Images uploaded for this vehicle
            </p>
          </div>

          {images.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <ImageIcon
                size={24}
                className="text-neutral-500"
              />

              <p className="mt-3 text-sm font-medium">
                No damage images
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                This vehicle has no uploaded damage images yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="text-sm">
                      {image.filename}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Image #{image.id}
                    </p>
                  </div>

                  <span className="text-xs text-neutral-500">
                    Uploaded
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


export default VehicleDetails