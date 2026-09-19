import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  CarFront,
  ChevronRight,
  Pencil,
  Save,
  X,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  Link,
} from 'react-router'

import {
  getVehicles,
  updateVehicle,
  type Vehicle,
  type UpdateVehicleInput,
} from '../api/client'


function Vehicles() {
  const queryClient = useQueryClient()

  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null)

  const [formData, setFormData] =
    useState<UpdateVehicleInput>({
      registration: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
    })

  const [formError, setFormError] =
    useState<string | null>(null)


  const {
    data: vehicles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  })


  const updateMutation = useMutation({
    mutationFn: ({
      currentRegistration,
      data,
    }: {
      currentRegistration: string
      data: UpdateVehicleInput
    }) =>
      updateVehicle(
        currentRegistration,
        data,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['vehicles'],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            'dashboard-summary',
          ],
        }),
      ])

      setEditingVehicle(null)
      setFormError(null)
    },

    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Failed to update vehicle',
      )
    },
  })


  function openEditModal(
    vehicle: Vehicle,
  ) {
    setEditingVehicle(vehicle)

    setFormData({
      registration:
        vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    })

    setFormError(null)
  }


  function closeEditModal() {
    if (updateMutation.isPending) {
      return
    }

    setEditingVehicle(null)
    setFormError(null)
  }


  function handleSave() {
    if (!editingVehicle) {
      return
    }

    const registration =
      formData.registration
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')

    const make =
      formData.make.trim()

    const model =
      formData.model.trim()

    if (
      !registration ||
      !make ||
      !model
    ) {
      setFormError(
        'Registration, make and model are required.',
      )

      return
    }

    if (
      !Number.isInteger(
        formData.year,
      ) ||
      formData.year < 1900 ||
      formData.year >
        new Date().getFullYear() + 1
    ) {
      setFormError(
        'Enter a valid vehicle year.',
      )

      return
    }

    setFormError(null)

    updateMutation.mutate({
      currentRegistration:
        editingVehicle.registration,

      data: {
        registration,
        make,
        model,
        year: formData.year,
      },
    })
  }


  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-[0.25em]
            text-neutral-500
          "
        >
          Fleet
        </p>

        <h1
          className="
            mt-2
            text-3xl
            font-semibold
            tracking-tight
            md:text-4xl
          "
        >
          Vehicles
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-neutral-400
          "
        >
          View registered vehicles and
          access their inspection history.
        </p>
      </div>

      {isLoading && (
        <div
          className="
            mt-8
            text-sm
            text-neutral-400
          "
        >
          Loading vehicles...
        </div>
      )}

      {isError && (
        <div
          className="
            mt-8
            text-sm
            text-red-400
          "
        >
          Could not load vehicles.
        </div>
      )}

      {!isLoading &&
        !isError &&
        vehicles.length === 0 && (
          <div
            className="
              mt-8
              rounded-2xl
              border
              border-white/10
              bg-[#0d0f12]
              p-10
              text-center
            "
          >
            <CarFront
              className="
                mx-auto
                text-neutral-500
              "
              size={28}
            />

            <h2
              className="
                mt-4
                text-sm
                font-medium
              "
            >
              No vehicles registered
            </h2>

            <p
              className="
                mt-2
                text-xs
                text-neutral-500
              "
            >
              Vehicles created during
              inspections will appear here.
            </p>
          </div>
        )}

      {!isLoading &&
        !isError &&
        vehicles.length > 0 && (
          <div
            className="
              mt-8
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-[#0d0f12]
            "
          >
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  text-left
                "
              >
                <thead
                  className="
                    border-b
                    border-white/10
                    bg-white/[0.02]
                  "
                >
                  <tr
                    className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-neutral-500
                    "
                  >
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

                    <th className="px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {vehicles.map(
                    (
                      vehicle: Vehicle,
                    ) => (
                      <tr
                        key={vehicle.id}
                        className="
                          border-b
                          border-white/5
                          transition
                          last:border-b-0
                          hover:bg-white/[0.02]
                        "
                      >
                        <td
                          className="
                            px-6
                            py-5
                          "
                        >
                          <span
                            className="
                              rounded-md
                              bg-white
                              px-2.5
                              py-1.5
                              text-xs
                              font-bold
                              tracking-wider
                              text-black
                            "
                          >
                            {
                              vehicle.registration
                            }
                          </span>
                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-sm
                            text-neutral-200
                          "
                        >
                          {vehicle.make}
                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-sm
                            text-neutral-300
                          "
                        >
                          {vehicle.model}
                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-sm
                            text-neutral-400
                          "
                        >
                          {vehicle.year}
                        </td>

                        <td
                          className="
                            px-6
                            py-5
                          "
                        >
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-2
                              text-xs
                              text-emerald-400
                            "
                          >
                            <span
                              className="
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-emerald-400
                              "
                            />

                            Registered
                          </span>
                        </td>

                        <td
                          className="
                            px-6
                            py-5
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >
                            <button
                              onClick={() =>
                                openEditModal(
                                  vehicle,
                                )
                              }
                              className="
                                inline-flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/10
                                text-neutral-400
                                transition
                                hover:bg-white/5
                                hover:text-white
                              "
                              aria-label={
                                `Edit ${vehicle.registration}`
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <Link
                              to={
                                `/app/vehicles/${vehicle.registration}`
                              }
                              className="
                                inline-flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-white/10
                                text-neutral-400
                                transition
                                hover:bg-white/5
                                hover:text-white
                              "
                              aria-label={
                                `View ${vehicle.registration}`
                              }
                            >
                              <ChevronRight
                                size={17}
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {editingVehicle && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/70
            px-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditModal()
            }
          }}
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-2xl
              border
              border-white/10
              bg-[#0d0f12]
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-white/10
                px-6
                py-5
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-[0.2em]
                    text-neutral-500
                  "
                >
                  Vehicle
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-semibold
                  "
                >
                  Edit vehicle
                </h2>
              </div>

              <button
                onClick={
                  closeEditModal
                }
                disabled={
                  updateMutation.isPending
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-neutral-400
                  transition
                  hover:bg-white/5
                  hover:text-white
                  disabled:opacity-50
                "
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="
                space-y-5
                p-6
              "
            >
              <div>
                <label
                  className="
                    text-xs
                    font-medium
                    text-neutral-400
                  "
                >
                  Registration
                </label>

                <input
                  value={
                    formData.registration
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        registration:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-3
                    text-sm
                    uppercase
                    outline-none
                    transition
                    focus:border-white/30
                  "
                />
              </div>

              <div>
                <label
                  className="
                    text-xs
                    font-medium
                    text-neutral-400
                  "
                >
                  Make
                </label>

                <input
                  value={
                    formData.make
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        make:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-white/30
                  "
                />
              </div>

              <div>
                <label
                  className="
                    text-xs
                    font-medium
                    text-neutral-400
                  "
                >
                  Model
                </label>

                <input
                  value={
                    formData.model
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        model:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-white/30
                  "
                />
              </div>

              <div>
                <label
                  className="
                    text-xs
                    font-medium
                    text-neutral-400
                  "
                >
                  Year
                </label>

                <input
                  type="number"
                  value={
                    formData.year
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        year:
                          Number(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-white/30
                  "
                />
              </div>

              {formError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    p-4
                  "
                >
                  <p
                    className="
                      text-sm
                      text-red-300
                    "
                  >
                    {formError}
                  </p>
                </div>
              )}
            </div>

            <div
              className="
                flex
                justify-end
                gap-3
                border-t
                border-white/10
                px-6
                py-5
              "
            >
              <button
                onClick={
                  closeEditModal
                }
                disabled={
                  updateMutation.isPending
                }
                className="
                  rounded-xl
                  border
                  border-white/10
                  px-4
                  py-2.5
                  text-sm
                  text-neutral-300
                  transition
                  hover:bg-white/5
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={
                  updateMutation.isPending
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-neutral-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Save size={16} />

                {updateMutation.isPending
                  ? 'Saving...'
                  : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default Vehicles