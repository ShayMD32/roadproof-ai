import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  CircleCheckBig,
  CircleHelp,
  Clock3,
  ImageIcon,
  LoaderCircle,
  Pencil,
  Save,
  ScanLine,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'

import {
  useEffect,
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
  formatSeverity,
  getProtectedImageUrl,
  getVehicle,
  getVehicleDamageImages,
  getVehicleInspectionSummary,
  hasAssignedSeverity,
  revokeProtectedImageUrl,
  updateVehicle,
  type DamageImage,
  type UpdateVehicleInput,
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


type ProtectedImageThumbnailProps = {
  image: DamageImage
}


function ProtectedImageThumbnail({
  image,
}: ProtectedImageThumbnailProps) {
  const [
    objectUrl,
    setObjectUrl,
  ] = useState<string | null>(
    null,
  )

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    hasError,
    setHasError,
  ] = useState(false)


  useEffect(() => {
    let active = true
    let createdUrl:
      | string
      | null = null

    async function loadImage() {
      setIsLoading(true)
      setHasError(false)

      try {
        const url =
          await getProtectedImageUrl(
            image.content_url,
          )

        createdUrl = url

        if (!active) {
          revokeProtectedImageUrl(
            url,
          )

          return
        }

        setObjectUrl(
          url,
        )
      } catch {
        if (active) {
          setHasError(
            true,
          )
        }
      } finally {
        if (active) {
          setIsLoading(
            false,
          )
        }
      }
    }

    loadImage()

    return () => {
      active = false

      if (createdUrl) {
        revokeProtectedImageUrl(
          createdUrl,
        )
      }
    }
  }, [
    image.content_url,
  ])


  return (
    <div
      className="
        flex
        h-20
        w-28
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border
        border-white/10
        bg-black/30
      "
    >
      {isLoading ? (
        <LoaderCircle
          size={18}
          className="
            animate-spin
            text-neutral-500
          "
        />
      ) : hasError ? (
        <div className="px-2 text-center">
          <ImageIcon
            size={17}
            className="
              mx-auto
              text-neutral-600
            "
          />

          <p
            className="
              mt-1
              text-[10px]
              text-neutral-600
            "
          >
            Preview unavailable
          </p>
        </div>
      ) : objectUrl ? (
        <img
          src={objectUrl}
          alt={image.filename}
          className="
            h-full
            w-full
            object-cover
          "
        />
      ) : (
        <ImageIcon
          size={18}
          className="text-neutral-600"
        />
      )}
    </div>
  )
}


function VehicleDetails() {
  const {
    registration = '',
  } = useParams()

  const navigate =
    useNavigate()

  const queryClient =
    useQueryClient()

  const [
    isEditing,
    setIsEditing,
  ] = useState(false)

  const [
    formError,
    setFormError,
  ] = useState<string | null>(
    null,
  )

  const [
    formData,
    setFormData,
  ] =
    useState<UpdateVehicleInput>({
      registration: '',
      make: '',
      model: '',
      year:
        new Date().getFullYear(),
    })


  const vehicleQuery =
    useQuery({
      queryKey: [
        'vehicle',
        registration,
      ],

      queryFn: () =>
        getVehicle(
          registration,
        ),

      enabled:
        Boolean(
          registration,
        ),
    })


  const imagesQuery =
    useQuery({
      queryKey: [
        'vehicle-images',
        registration,
      ],

      queryFn: () =>
        getVehicleDamageImages(
          registration,
        ),

      enabled:
        Boolean(
          registration,
        ),
    })


  const summaryQuery =
    useQuery({
      queryKey: [
        'vehicle-summary',
        registration,
      ],

      queryFn: () =>
        getVehicleInspectionSummary(
          registration,
        ),

      enabled:
        Boolean(
          registration,
        ),
    })


  const deleteImageMutation =
    useMutation({
      mutationFn: (
        imageId: number,
      ) =>
        deleteDamageImage(
          imageId,
        ),

      onSuccess: async () => {
        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                'vehicle-images',
                registration,
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                'vehicle-summary',
                registration,
              ],
            }),

          queryClient
            .invalidateQueries({
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
        deleteVehicle(
          registration,
        ),

      onSuccess: async () => {
        await queryClient
          .invalidateQueries({
            queryKey: [
              'vehicles',
            ],
          })

        await queryClient
          .invalidateQueries({
            queryKey: [
              'dashboard-summary',
            ],
          })

        navigate(
          '/app/vehicles',
        )
      },
    })


  const updateVehicleMutation =
    useMutation({
      mutationFn: (
        data:
          UpdateVehicleInput,
      ) =>
        updateVehicle(
          registration,
          data,
        ),

      onSuccess: async (
        updatedVehicle,
      ) => {
        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                'vehicles',
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                'dashboard-summary',
              ],
            }),
        ])

        setIsEditing(
          false,
        )

        setFormError(
          null,
        )

        if (
          updatedVehicle
            .registration !==
          registration
        ) {
          navigate(
            (
              '/app/vehicles/' +
              updatedVehicle
                .registration
            ),
            {
              replace:
                true,
            },
          )

          return
        }

        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                'vehicle',
                registration,
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                'vehicle-summary',
                registration,
              ],
            }),
        ])
      },

      onError: (
        error,
      ) => {
        setFormError(
          error instanceof Error
            ? error.message
            : (
              'Failed to ' +
              'update vehicle.'
            ),
        )
      },
    })


  function handleDeleteImage(
    imageId: number,
  ) {
    const confirmed =
      window.confirm(
        (
          'Delete image?\n\n' +
          'This will permanently ' +
          'remove this image and ' +
          'its associated ' +
          'inspection data.\n\n' +
          'This action cannot ' +
          'be undone.'
        ),
      )

    if (!confirmed) {
      return
    }

    deleteImageMutation
      .mutate(
        imageId,
      )
  }


  function handleDeleteVehicle() {
    const confirmed =
      window.confirm(
        (
          'Delete vehicle?\n\n' +
          'This will permanently ' +
          'remove this vehicle, ' +
          'all uploaded damage ' +
          'images, inspections ' +
          'and AI detections.\n\n' +
          'This action cannot ' +
          'be undone.'
        ),
      )

    if (!confirmed) {
      return
    }

    deleteVehicleMutation
      .mutate()
  }


  function openEditModal() {
    if (
      !vehicleQuery.data
    ) {
      return
    }

    setFormData({
      registration:
        vehicleQuery
          .data
          .registration,

      make:
        vehicleQuery
          .data
          .make,

      model:
        vehicleQuery
          .data
          .model,

      year:
        vehicleQuery
          .data
          .year,
    })

    setFormError(
      null,
    )

    setIsEditing(
      true,
    )
  }


  function closeEditModal() {
    if (
      updateVehicleMutation
        .isPending
    ) {
      return
    }

    setIsEditing(
      false,
    )

    setFormError(
      null,
    )
  }


  function handleSaveVehicle() {
    const cleanedRegistration =
      formData
        .registration
        .trim()
        .toUpperCase()
        .replace(
          /\s+/g,
          '',
        )

    const cleanedMake =
      formData
        .make
        .trim()

    const cleanedModel =
      formData
        .model
        .trim()

    if (
      !cleanedRegistration ||
      !cleanedMake ||
      !cleanedModel
    ) {
      setFormError(
        (
          'Registration, make ' +
          'and model are required.'
        ),
      )

      return
    }

    if (
      !Number.isInteger(
        formData.year,
      ) ||
      formData.year <
        1900 ||
      formData.year >
        (
          new Date()
            .getFullYear() +
          1
        )
    ) {
      setFormError(
        'Enter a valid vehicle year.',
      )

      return
    }

    setFormError(
      null,
    )

    updateVehicleMutation
      .mutate({
        registration:
          cleanedRegistration,

        make:
          cleanedMake,

        model:
          cleanedModel,

        year:
          formData.year,
      })
  }


  if (
    vehicleQuery
      .isLoading ||
    imagesQuery
      .isLoading ||
    summaryQuery
      .isLoading
  ) {
    return (
      <div className="text-sm text-neutral-400">
        Loading vehicle...
      </div>
    )
  }


  if (
    vehicleQuery
      .isError ||
    imagesQuery
      .isError ||
    summaryQuery
      .isError
  ) {
    return (
      <div className="text-sm text-red-400">
        Could not load vehicle details.
      </div>
    )
  }


  const vehicle =
    vehicleQuery.data

  const images =
    imagesQuery.data ??
    []

  const summary =
    summaryQuery.data

  const severityAssigned =
    hasAssignedSeverity(
      summary
        ?.latest_severity,
    )


  let assessmentLabel =
    'Not inspected'

  let assessmentDescription =
    (
      'No AI inspection has ' +
      'been completed yet.'
    )

  let AssessmentIcon =
    CircleHelp


  if (
    summary
      ?.assessment_status ===
    'manual_review_required'
  ) {
    assessmentLabel =
      'Manual review'

    assessmentDescription =
      (
        'The latest evidence ' +
        'requires human review.'
      )

    AssessmentIcon =
      ShieldAlert
  } else if (
    summary
      ?.assessment_status ===
    'damage_confirmed'
  ) {
    assessmentLabel =
      'Damage confirmed'

    assessmentDescription =
      (
        'Accepted damage was ' +
        'identified during inspection.'
      )

    AssessmentIcon =
      AlertTriangle
  } else if (
    summary
      ?.assessment_status ===
    'no_confirmed_damage'
  ) {
    assessmentLabel =
      'No confirmed damage'

    assessmentDescription =
      (
        'No damage met the ' +
        'confirmation threshold.'
      )

    AssessmentIcon =
      CircleCheckBig
  }


  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/app/vehicles"
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
        <ArrowLeft
          size={16}
        />

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
              <CarFront
                size={24}
              />
            </div>

            <div>
              <h1
                className="
                  text-3xl
                  font-semibold
                  tracking-tight
                "
              >
                {
                  vehicle
                    ?.make
                }{' '}
                {
                  vehicle
                    ?.model
                }
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-neutral-400
                "
              >
                {
                  vehicle
                    ?.year
                }
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
            {
              vehicle
                ?.registration
            }
          </span>

          <button
            type="button"
            onClick={
              openEditModal
            }
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
            <Pencil
              size={16}
            />

            Edit vehicle
          </button>

          <button
            type="button"
            onClick={
              handleDeleteVehicle
            }
            disabled={
              deleteVehicleMutation
                .isPending
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
            <Trash2
              size={16}
            />

            {
              deleteVehicleMutation
                .isPending
                ? 'Deleting...'
                : 'Delete vehicle'
            }
          </button>
        </div>
      </div>

      {deleteVehicleMutation
        .isError && (
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
            {
              deleteVehicleMutation
                .error instanceof Error
                ? deleteVehicleMutation
                  .error.message
                : (
                  'Failed to ' +
                  'delete vehicle.'
                )
            }
          </p>
        </div>
      )}

      {deleteImageMutation
        .isError && (
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
            {
              deleteImageMutation
                .error instanceof Error
                ? deleteImageMutation
                  .error.message
                : (
                  'Failed to ' +
                  'delete image.'
                )
            }
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
        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <p className="text-sm text-neutral-400">
              Damage Images
            </p>

            <ImageIcon
              size={18}
              className="text-neutral-400"
            />
          </div>

          <p
            className="
              mt-6
              text-3xl
              font-semibold
            "
          >
            {
              summary
                ?.total_images ??
              0
            }
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <p className="text-sm text-neutral-400">
              Inspections
            </p>

            <ScanLine
              size={18}
              className="text-neutral-400"
            />
          </div>

          <p
            className="
              mt-6
              text-3xl
              font-semibold
            "
          >
            {
              summary
                ?.total_inspections ??
              0
            }
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <p className="text-sm text-neutral-400">
              Assessment
            </p>

            <AssessmentIcon
              size={18}
              className="text-neutral-400"
            />
          </div>

          <p
            className="
              mt-6
              text-xl
              font-semibold
            "
          >
            {
              assessmentLabel
            }
          </p>

          <p
            className="
              mt-2
              text-xs
              leading-5
              text-neutral-500
            "
          >
            {
              assessmentDescription
            }
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-5
          "
        >
          <p className="text-sm text-neutral-400">
            Latest Severity
          </p>

          <p
            className="
              mt-6
              text-3xl
              font-semibold
              capitalize
            "
          >
            {
              severityAssigned
                ? formatSeverity(
                    summary
                      ?.latest_severity,
                  )
                : 'Not assigned'
            }
          </p>

          {
            severityAssigned &&
            summary
              ?.latest_severity_score !==
              null &&
            summary
              ?.latest_severity_score !==
              undefined && (
              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                Score:{' '}
                {
                  summary
                    .latest_severity_score
                }
              </p>
            )
          }
        </div>
      </section>

      {summary
        ?.latest_inspection_id && (
        <section
          className="
            mt-6
            flex
            flex-col
            gap-4
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                mt-0.5
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-white/[0.05]
              "
            >
              <Clock3
                size={17}
                className="text-neutral-400"
              />
            </div>

            <div>
              <p className="text-sm font-medium">
                Latest inspection
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                Inspection #
                {
                  summary
                    .latest_inspection_id
                }

                {
                  summary
                    .latest_inspection_created_at
                  ? (
                    ' · ' +
                    formatDate(
                      summary
                        .latest_inspection_created_at,
                    )
                  )
                  : ''
                }
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  capitalize
                  text-neutral-500
                "
              >
                Status:{' '}
                {
                  summary
                    .latest_inspection_status ??
                  'Unknown'
                }
              </p>
            </div>
          </div>

          <Link
            to={
              (
                '/app/reports/' +
                summary
                  .latest_inspection_id
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              px-4
              py-2.5
              text-sm
              font-medium
              text-neutral-300
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            View report
          </Link>
        </section>
      )}

      <section
        className="
          mt-6
          grid
          gap-6
          xl:grid-cols-[1fr_1.4fr]
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-6
          "
        >
          <h2 className="font-medium">
            Vehicle information
          </h2>

          <div className="mt-6 space-y-4">
            <div
              className="
                flex
                justify-between
                border-b
                border-white/5
                pb-4
              "
            >
              <span className="text-sm text-neutral-500">
                Registration
              </span>

              <span className="text-sm">
                {
                  vehicle
                    ?.registration
                }
              </span>
            </div>

            <div
              className="
                flex
                justify-between
                border-b
                border-white/5
                pb-4
              "
            >
              <span className="text-sm text-neutral-500">
                Make
              </span>

              <span className="text-sm">
                {
                  vehicle
                    ?.make
                }
              </span>
            </div>

            <div
              className="
                flex
                justify-between
                border-b
                border-white/5
                pb-4
              "
            >
              <span className="text-sm text-neutral-500">
                Model
              </span>

              <span className="text-sm">
                {
                  vehicle
                    ?.model
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-neutral-500">
                Year
              </span>

              <span className="text-sm">
                {
                  vehicle
                    ?.year
                }
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
          "
        >
          <div
            className="
              border-b
              border-white/10
              px-6
              py-5
            "
          >
            <h2 className="font-medium">
              Damage image history
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-neutral-500
              "
            >
              Protected images uploaded
              for this vehicle
            </p>
          </div>

          {images.length ===
          0 ? (
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

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                No damage images
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                This vehicle has no
                uploaded damage images
                yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {
                images.map(
                  (
                    image,
                  ) => (
                    <div
                      key={
                        image.id
                      }
                      className="
                        flex
                        flex-col
                        gap-4
                        px-6
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-4
                        "
                      >
                        <ProtectedImageThumbnail
                          image={
                            image
                          }
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            {
                              image
                                .filename
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-neutral-500
                            "
                          >
                            Image #
                            {
                              image.id
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-[11px]
                              text-neutral-600
                            "
                          >
                            Authenticated
                            preview
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteImage(
                            image.id,
                          )
                        }
                        disabled={
                          deleteImageMutation
                            .isPending
                        }
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          justify-center
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
                        <Trash2
                          size={14}
                        />

                        {
                          deleteImageMutation
                            .isPending
                            ? 'Deleting...'
                            : 'Delete'
                        }
                      </button>
                    </div>
                  ),
                )
              }
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
          onMouseDown={
            (
              event,
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeEditModal()
              }
            }
          }
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
                type="button"
                onClick={
                  closeEditModal
                }
                disabled={
                  updateVehicleMutation
                    .isPending
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
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="text-xs font-medium text-neutral-400">
                  Registration
                </label>

                <input
                  value={
                    formData
                      .registration
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (
                        current,
                      ) => ({
                        ...current,

                        registration:
                          event
                            .target
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
                <label className="text-xs font-medium text-neutral-400">
                  Make
                </label>

                <input
                  value={
                    formData
                      .make
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (
                        current,
                      ) => ({
                        ...current,

                        make:
                          event
                            .target
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
                <label className="text-xs font-medium text-neutral-400">
                  Model
                </label>

                <input
                  value={
                    formData
                      .model
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (
                        current,
                      ) => ({
                        ...current,

                        model:
                          event
                            .target
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
                <label className="text-xs font-medium text-neutral-400">
                  Year
                </label>

                <input
                  type="number"
                  value={
                    formData
                      .year
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormData(
                      (
                        current,
                      ) => ({
                        ...current,

                        year:
                          Number(
                            event
                              .target
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
                  <p className="text-sm text-red-300">
                    {
                      formError
                    }
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
                type="button"
                onClick={
                  closeEditModal
                }
                disabled={
                  updateVehicleMutation
                    .isPending
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
                type="button"
                onClick={
                  handleSaveVehicle
                }
                disabled={
                  updateVehicleMutation
                    .isPending
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
                <Save
                  size={16}
                />

                {
                  updateVehicleMutation
                    .isPending
                    ? 'Saving...'
                    : 'Save changes'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default VehicleDetails