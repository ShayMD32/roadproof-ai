import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  ImageIcon,
  Pencil,
  Save,
  ScanLine,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router'

import {
  deleteDamageImage,
  deleteVehicle,
  getVehicle,
  getVehicleDamageImages,
  getVehicleInspectionSummary,
  updateVehicle,
  type UpdateVehicleInput,
} from '../api/client'


function VehicleDetails() {
  const { registration = '' } = useParams()

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] =
    useState(false)

  const [formError, setFormError] =
    useState<string | null>(null)

  const [formData, setFormData] =
    useState<UpdateVehicleInput>({
      registration: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
    })


  const vehicleQuery = useQuery({
    queryKey: [
      'vehicle',
      registration,
    ],
    queryFn: () =>
      getVehicle(registration),
    enabled: Boolean(registration),
  })


  const imagesQuery = useQuery({
    queryKey: [
      'vehicle-images',
      registration,
    ],
    queryFn: () =>
      getVehicleDamageImages(
        registration,
      ),
    enabled: Boolean(registration),
  })


  const summaryQuery = useQuery({
    queryKey: [
      'vehicle-summary',
      registration,
    ],
    queryFn: () =>
      getVehicleInspectionSummary(
        registration,
      ),
    enabled: Boolean(registration),
  })


  const deleteImageMutation =
    useMutation({
      mutationFn: (
        imageId: number,
      ) =>
        deleteDamageImage(imageId),

      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [
              'vehicle-images',
              registration,
            ],
          }),

          queryClient.invalidateQueries({
            queryKey: [
              'vehicle-summary',
              registration,
            ],
          }),

          queryClient.invalidateQueries({
            queryKey: [
              'dashboard-summary',
            ],
          }),
        ])
      },
    })


  const deleteVehicleMutation =
    useMutation({
      mutationFn: () =>
        deleteVehicle(registration),

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['vehicles'],
        })

        await queryClient.invalidateQueries({
          queryKey: [
            'dashboard-summary',
          ],
        })

        navigate('/vehicles')
      },
    })


  const updateVehicleMutation =
    useMutation({
      mutationFn: (
        data: UpdateVehicleInput,
      ) =>
        updateVehicle(
          registration,
          data,
        ),

      onSuccess: async (
        updatedVehicle,
      ) => {
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

        setIsEditing(false)
        setFormError(null)

        if (
          updatedVehicle.registration !==
          registration
        ) {
          navigate(
            `/vehicles/${updatedVehicle.registration}`,
            {
              replace: true,
            },
          )

          return
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [
              'vehicle',
              registration,
            ],
          }),

          queryClient.invalidateQueries({
            queryKey: [
              'vehicle-summary',
              registration,
            ],
          }),
        ])
      },

      onError: (error) => {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Failed to update vehicle.',
        )
      },
    })


  function handleDeleteImage(
    imageId: number,
  ) {
    const confirmed = window.confirm(
      'Delete image?\n\n' +
        'This will permanently remove this image ' +
        'and its associated inspection data.\n\n' +
        'This action cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    deleteImageMutation.mutate(
      imageId,
    )
  }


  function handleDeleteVehicle() {
    const confirmed = window.confirm(
      'Delete vehicle?\n\n' +
        'This will permanently remove this vehicle, ' +
        'all uploaded damage images, inspections ' +
        'and AI detections.\n\n' +
        'This action cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    deleteVehicleMutation.mutate()
  }


  function openEditModal() {
    if (!vehicleQuery.data) {
      return
    }

    setFormData({
      registration:
        vehicleQuery.data.registration,
      make: vehicleQuery.data.make,
      model: vehicleQuery.data.model,
      year: vehicleQuery.data.year,
    })

    setFormError(null)
    setIsEditing(true)
  }


  function closeEditModal() {
    if (
      updateVehicleMutation.isPending
    ) {
      return
    }

    setIsEditing(false)
    setFormError(null)
  }


  function handleSaveVehicle() {
    const cleanedRegistration =
      formData.registration
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')

    const cleanedMake =
      formData.make.trim()

    const cleanedModel =
      formData.model.trim()

    if (
      !cleanedRegistration ||
      !cleanedMake ||
      !cleanedModel
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

    updateVehicleMutation.mutate({
      registration:
        cleanedRegistration,
      make: cleanedMake,
      model: cleanedModel,
      year: formData.year,
    })
  }


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
        className="
          inline-flex
          items-center
          gap-2
          text-sm
          text-neutral-400
          transition
          hover:text-white
        "
      >
        <ArrowLeft size={16} />
        Back to vehicles
      </Link>

      <div
        className="
          mt-6
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-end
          md:justify-between
        "
      >
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
            Vehicle profile
          </p>

          <div
            className="
              mt-3
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-white
                text-black
              "
            >
              <CarFront size={24} />
            </div>

            <div>
              <h1
                className="
                  text-3xl
                  font-semibold
                  tracking-tight
                "
              >
                {vehicle?.make}{' '}
                {vehicle?.model}
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-neutral-400
                "
              >
                {vehicle?.year}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
          "
        >
          <span
            className="
              w-fit
              rounded-md
              bg-white
              px-3
              py-2
              text-sm
              font-bold
              tracking-wider
              text-black
            "
          >
            {vehicle?.registration}
          </span>

          <button
            onClick={openEditModal}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-white/10
              bg-white/[0.04]
              px-4
              py-2
              text-sm
              font-medium
              text-neutral-300
              transition
              hover:bg-white/[0.08]
              hover:text-white
            "
          >
            <Pencil size={16} />
            Edit vehicle
          </button>

          <button
            onClick={
              handleDeleteVehicle
            }
            disabled={
              deleteVehicleMutation.isPending
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-2
              text-sm
              font-medium
              text-red-300
              transition
              hover:bg-red-500/20
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Trash2 size={16} />

            {deleteVehicleMutation.isPending
              ? 'Deleting...'
              : 'Delete vehicle'}
          </button>
        </div>
      </div>

      {deleteVehicleMutation.isError && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >
          <p className="text-sm text-red-300">
            {deleteVehicleMutation.error
              instanceof Error
              ? deleteVehicleMutation.error.message
              : 'Failed to delete vehicle.'}
          </p>
        </div>
      )}

      {deleteImageMutation.isError && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >
          <p className="text-sm text-red-300">
            {deleteImageMutation.error
              instanceof Error
              ? deleteImageMutation.error.message
              : 'Failed to delete image.'}
          </p>
        </div>
      )}

      <section
        className="
          mt-8
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
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
            {summary?.damage_detected
              ? 'Yes'
              : 'No'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <p className="text-sm text-neutral-400">
            Latest Severity
          </p>

          <p className="mt-6 text-3xl font-semibold capitalize">
            {summary?.latest_severity ??
              'None'}
          </p>

          {summary?.latest_severity_score !==
            null &&
            summary?.latest_severity_score !==
              undefined && (
              <p className="mt-1 text-xs text-neutral-500">
                Score:{' '}
                {
                  summary.latest_severity_score
                }
              </p>
            )}
        </div>
      </section>

      <section
        className="
          mt-6
          grid
          gap-6
          xl:grid-cols-[1fr_1.4fr]
        "
      >
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
            <div
              className="
                flex
                min-h-64
                flex-col
                items-center
                justify-center
                px-6
                text-center
              "
            >
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
              {images.map(
                (image) => (
                  <div
                    key={image.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      px-6
                      py-4
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {image.filename}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Image #{image.id}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteImage(
                          image.id,
                        )
                      }
                      disabled={
                        deleteImageMutation.isPending
                      }
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-red-500/20
                        bg-red-500/10
                        px-3
                        py-2
                        text-xs
                        font-medium
                        text-red-300
                        transition
                        hover:bg-red-500/20
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <Trash2 size={14} />

                      {deleteImageMutation.isPending
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {isEditing && (
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
                  Vehicle profile
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Edit vehicle
                </h2>
              </div>

              <button
                onClick={closeEditModal}
                disabled={
                  updateVehicleMutation.isPending
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

            <div className="space-y-5 p-6">
              <div>
                <label className="text-xs font-medium text-neutral-400">
                  Registration
                </label>

                <input
                  value={
                    formData.registration
                  }
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        registration:
                          event.target.value,
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
                <label className="text-xs font-medium text-neutral-400">
                  Make
                </label>

                <input
                  value={formData.make}
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        make:
                          event.target.value,
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
                <label className="text-xs font-medium text-neutral-400">
                  Model
                </label>

                <input
                  value={formData.model}
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        model:
                          event.target.value,
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
                <label className="text-xs font-medium text-neutral-400">
                  Year
                </label>

                <input
                  type="number"
                  value={formData.year}
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        year:
                          Number(
                            event.target.value,
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
                  <p className="text-sm text-red-300">
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
                onClick={closeEditModal}
                disabled={
                  updateVehicleMutation.isPending
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
                onClick={
                  handleSaveVehicle
                }
                disabled={
                  updateVehicleMutation.isPending
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

                {updateVehicleMutation.isPending
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


export default VehicleDetails