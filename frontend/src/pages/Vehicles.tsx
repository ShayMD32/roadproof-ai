import { useQuery } from '@tanstack/react-query'
import {
  CarFront,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router'

import {
  getVehicles,
  type Vehicle,
} from '../api/client'


function Vehicles() {
  const {
    data: vehicles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
          Fleet
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Vehicles
        </h1>

        <p className="mt-2 text-sm text-neutral-400">
          View registered vehicles and access their inspection history.
        </p>
      </div>

      {isLoading && (
        <div className="mt-8 text-sm text-neutral-400">
          Loading vehicles...
        </div>
      )}

      {isError && (
        <div className="mt-8 text-sm text-red-400">
          Could not load vehicles.
        </div>
      )}

      {!isLoading &&
        !isError &&
        vehicles.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0d0f12] p-10 text-center">
            <CarFront
              className="mx-auto text-neutral-500"
              size={28}
            />

            <h2 className="mt-4 text-sm font-medium">
              No vehicles registered
            </h2>

            <p className="mt-2 text-xs text-neutral-500">
              Add a vehicle through the API to see it here.
            </p>
          </div>
        )}

      {!isLoading &&
        !isError &&
        vehicles.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr className="text-xs uppercase tracking-wider text-neutral-500">
                    <th className="px-6 py-4">
                      Registration
                    </th>

                    <th className="px-6 py-4">
                      Make
                    </th>

                    <th className="px-6 py-4">
                      Model
                    </th>

                    <th className="px-6 py-4">
                      Year
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {vehicles.map(
                    (vehicle: Vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-5">
                          <span className="rounded-md bg-white px-2.5 py-1.5 text-xs font-bold tracking-wider text-black">
                            {vehicle.registration}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-200">
                          {vehicle.make}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-300">
                          {vehicle.model}
                        </td>

                        <td className="px-6 py-5 text-sm text-neutral-400">
                          {vehicle.year}
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 text-xs text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Registered
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            to={`/vehicles/${vehicle.registration}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition hover:bg-white/5 hover:text-white"
                          >
                            <ChevronRight size={17} />
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}


export default Vehicles