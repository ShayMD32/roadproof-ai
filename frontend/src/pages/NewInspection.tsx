import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import {
  AlertTriangle,
  CarFront,
  Check,
  CheckCircle2,
  CircleAlert,
  Image as ImageIcon,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import {
  analyseDamageImage,
  createVehicle,
  getVehicle,
  uploadDamageImage,
  type Vehicle,
} from '../api/client'


function NewInspection() {
  const navigate = useNavigate()

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    )

  const [
    registration,
    setRegistration,
  ] = useState('')

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null)

  const [
    vehicleExists,
    setVehicleExists,
  ] = useState<boolean | null>(
    null,
  )

  const [
    existingVehicle,
    setExistingVehicle,
  ] = useState<Vehicle | null>(
    null,
  )

  const [make, setMake] =
    useState('')

  const [model, setModel] =
    useState('')

  const [year, setYear] =
    useState('')

  const [
    lastRegistration,
    setLastRegistration,
  ] = useState('')


  const previewUrl = useMemo(
    () => {
      if (!selectedFile) {
        return null
      }

      return URL.createObjectURL(
        selectedFile,
      )
    },
    [selectedFile],
  )


  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        )
      }
    }
  }, [previewUrl])


  const vehicleLookupMutation =
    useMutation({
      mutationFn: async () => {
        const cleanRegistration =
          registration.trim()

        if (!cleanRegistration) {
          throw new Error(
            'Enter a registration first',
          )
        }

        return getVehicle(
          cleanRegistration,
        )
      },

      onSuccess: (vehicle) => {
        setVehicleExists(true)
        setExistingVehicle(vehicle)

        setMake('')
        setModel('')
        setYear('')
      },

      onError: () => {
        setVehicleExists(false)
        setExistingVehicle(null)
      },
    })


  const inspectionMutation =
    useMutation({
      mutationFn: async () => {
        const cleanRegistration =
          registration.trim()

        if (!cleanRegistration) {
          throw new Error(
            'Please enter a registration',
          )
        }

        if (
          vehicleExists === null
        ) {
          throw new Error(
            'Please check the vehicle first',
          )
        }

        if (!selectedFile) {
          throw new Error(
            'Please select an image',
          )
        }

        if (
          vehicleExists === false
        ) {
          if (!make.trim()) {
            throw new Error(
              'Please enter the vehicle make',
            )
          }

          if (!model.trim()) {
            throw new Error(
              'Please enter the vehicle model',
            )
          }

          const numericYear =
            Number(year)

          if (
            !year ||
            Number.isNaN(
              numericYear,
            ) ||
            numericYear < 1900 ||
            numericYear >
              new Date()
                .getFullYear() +
                1
          ) {
            throw new Error(
              'Please enter a valid vehicle year',
            )
          }

          await createVehicle({
            registration:
              cleanRegistration,

            make: make.trim(),

            model: model.trim(),

            year: numericYear,
          })
        }

        setLastRegistration(
          cleanRegistration
            .replace(/\s/g, '')
            .toUpperCase(),
        )

        const uploadResult =
          await uploadDamageImage(
            cleanRegistration,
            selectedFile,
          )

        const imageId =
          uploadResult.image.id

        return analyseDamageImage(
          imageId,
        )
      },

      onSuccess: () => {
        setRegistration('')
        setSelectedFile(null)

        setVehicleExists(null)
        setExistingVehicle(null)

        setMake('')
        setModel('')
        setYear('')

        vehicleLookupMutation.reset()

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            ''
        }
      },
    })


  function resetVehicleLookup() {
    setVehicleExists(null)
    setExistingVehicle(null)

    setMake('')
    setModel('')
    setYear('')

    vehicleLookupMutation.reset()
    inspectionMutation.reset()
  }


  function removeImage() {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  function clearForm() {
    setRegistration('')
    setSelectedFile(null)

    setVehicleExists(null)
    setExistingVehicle(null)

    setMake('')
    setModel('')
    setYear('')

    setLastRegistration('')

    vehicleLookupMutation.reset()
    inspectionMutation.reset()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  function startNewInspection() {
    clearForm()
  }


  const inspection =
    inspectionMutation.data
      ?.inspection


  if (
    inspectionMutation.isSuccess &&
    inspection
  ) {
    const review =
      inspection.review

    const manualReviewReasons =
      review?.manual_review_reasons ??
      []

    const requiresReview =
      review
        ?.manual_review_required ??
      false

    const inspectionConfidence =
      review
        ?.inspection_confidence ??
      'Unavailable'

    const damageLabel =
      inspection.damage_detected
        ? 'Detected'
        : requiresReview
          ? 'Not confirmed'
          : 'None'

    return (
      <div className="mx-auto max-w-5xl">
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
            Inspection complete
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
            AI Inspection Result
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-neutral-400
            "
          >
            RoadProof has completed
            the vehicle damage
            assessment.
          </p>
        </div>

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              border-b
              border-white/10
              pb-6
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                items-center
                gap-4
              "
            >
              <div
                className={`
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  ${
                    requiresReview
                      ? 'bg-amber-500/10'
                      : 'bg-emerald-500/10'
                  }
                `}
              >
                {requiresReview ? (
                  <CircleAlert
                    size={24}
                    className="text-amber-400"
                  />
                ) : (
                  <CheckCircle2
                    size={24}
                    className="text-emerald-400"
                  />
                )}
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Inspection completed
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-neutral-500
                  "
                >
                  {
                    lastRegistration
                  }
                </p>
              </div>
            </div>

            <div
              className={`
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-medium
                ${
                  requiresReview
                    ? (
                      'border-amber-500/20 ' +
                      'bg-amber-500/10 ' +
                      'text-amber-300'
                    )
                    : (
                      'border-emerald-500/20 ' +
                      'bg-emerald-500/10 ' +
                      'text-emerald-300'
                    )
                }
              `}
            >
              {requiresReview
                ? 'Manual review required'
                : 'Analysis complete'}
            </div>
          </div>

          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            <ResultCard
              label="Damage"
              value={damageLabel}
            />

            <ResultCard
              label="AI severity estimate"
              value={
                inspection.severity ??
                'None'
              }
            />

            <ResultCard
              label="Detections"
              value={String(
                inspection
                  .damage_count,
              )}
            />

            <ResultCard
              label="Model confidence"
              value={
                inspection
                  .highest_confidence !==
                null
                  ? `${Math.round(
                      inspection
                        .highest_confidence *
                        100,
                    )}%`
                  : 'N/A'
              }
            />

            <ResultCard
              label="Inspection confidence"
              value={
                inspectionConfidence
              }
            />

            <ResultCard
              label="Manual review"
              value={
                requiresReview
                  ? 'Required'
                  : 'Not required'
              }
            />
          </div>

          {requiresReview && (
            <div
              className="
                mt-6
                rounded-2xl
                border
                border-amber-500/20
                bg-amber-500/[0.06]
                p-5
              "
            >
              <div
                className="
                  flex
                  gap-3
                "
              >
                <AlertTriangle
                  size={19}
                  className="
                    mt-0.5
                    shrink-0
                    text-amber-400
                  "
                />

                <div>
                  <p
                    className="
                      text-sm
                      font-medium
                    "
                  >
                    Manual review
                    required
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-neutral-400
                    "
                  >
                    The AI result contains
                    uncertainty or a
                    high-risk severity
                    estimate and should
                    not be treated as a
                    final professional
                    assessment.
                  </p>

                  {manualReviewReasons
                    .length > 0 && (
                    <ul
                      className="
                        mt-3
                        space-y-2
                        text-xs
                        leading-5
                        text-neutral-300
                      "
                    >
                      {manualReviewReasons.map(
                        (
                          reason,
                        ) => (
                          <li
                            key={
                              reason
                            }
                            className="
                              flex
                              gap-2
                            "
                          >
                            <span className="text-amber-400">
                              •
                            </span>

                            <span>
                              {
                                reason
                              }
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {!requiresReview &&
            inspection.damage_detected && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-amber-500/20
                  bg-amber-500/[0.06]
                  p-5
                "
              >
                <div
                  className="
                    flex
                    gap-3
                  "
                >
                  <AlertTriangle
                    size={19}
                    className="
                      mt-0.5
                      shrink-0
                      text-amber-400
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      Vehicle damage
                      detected
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-neutral-400
                      "
                    >
                      Review the full
                      inspection report
                      for damage locations,
                      model confidence and
                      AI severity estimate.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {!requiresReview &&
            !inspection
              .damage_detected && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-emerald-500/20
                  bg-emerald-500/[0.05]
                  p-5
                "
              >
                <div
                  className="
                    flex
                    gap-3
                  "
                >
                  <ShieldCheck
                    size={19}
                    className="
                      mt-0.5
                      shrink-0
                      text-emerald-400
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                      "
                    >
                      No confirmed damage
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-neutral-400
                      "
                    >
                      No accepted damage
                      detections were
                      recorded for this
                      image.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div
            className="
              mt-7
              flex
              flex-col
              gap-3
              border-t
              border-white/10
              pt-6
              sm:flex-row
            "
          >
            <button
              onClick={() => {
                navigate(
                  `/reports/${inspection.id}`,
                )
              }}
              className="
                flex
                flex-1
                items-center
                justify-center
                rounded-xl
                bg-white
                px-5
                py-3
                text-sm
                font-semibold
                text-black
                transition
                hover:bg-neutral-200
              "
            >
              View Full Report
            </button>

            <button
              onClick={
                startNewInspection
              }
              className="
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                px-5
                py-3
                text-sm
                font-medium
                transition
                hover:bg-white/[0.07]
              "
            >
              <RotateCcw
                size={17}
              />

              Start New Inspection
            </button>
          </div>
        </section>
      </div>
    )
  }


  return (
    <div className="mx-auto max-w-6xl">
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
          Inspection workflow
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
          New Vehicle Inspection
        </h1>

        <p
          className="
            mt-2
            max-w-2xl
            text-sm
            text-neutral-400
          "
        >
          Check a vehicle
          registration, upload a
          damage image and run AI
          analysis.
        </p>
      </div>

      <div
        className="
          mt-8
          grid
          gap-6
          lg:grid-cols-[1fr_1.2fr]
        "
      >
        <section
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-6
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-white/[0.05]
              "
            >
              <CarFront size={19} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-medium
                "
              >
                Vehicle
              </h2>

              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
                Find an existing
                vehicle or register
                a new one
              </p>
            </div>
          </div>

          <label
            className="
              mt-6
              block
              text-xs
              font-medium
              text-neutral-400
            "
          >
            Registration
          </label>

          <div
            className="
              mt-2
              flex
              gap-2
            "
          >
            <input
              value={
                registration
              }
              onChange={(
                event,
              ) => {
                setRegistration(
                  event.target.value,
                )

                if (
                  vehicleExists !==
                  null
                ) {
                  resetVehicleLookup()
                }
              }}
              placeholder="e.g. AB12 CDE"
              className="
                min-w-0
                flex-1
                rounded-xl
                border
                border-white/10
                bg-black/20
                px-4
                py-3
                text-sm
                text-white
                outline-none
                placeholder:text-neutral-600
                focus:border-white/30
              "
            />

            <button
              type="button"
              disabled={
                !registration.trim() ||
                vehicleLookupMutation
                  .isPending
              }
              onClick={() =>
                vehicleLookupMutation
                  .mutate()
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                text-sm
                font-medium
                transition
                hover:bg-white/[0.09]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              {vehicleLookupMutation
                .isPending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Search
                  size={17}
                />
              )}

              Check
            </button>
          </div>

          {vehicleExists ===
            true &&
            existingVehicle && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-emerald-500/20
                  bg-emerald-500/[0.06]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-emerald-500/10
                    "
                  >
                    <Check
                      size={17}
                      className="text-emerald-400"
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                        text-emerald-200
                      "
                    >
                      Vehicle found
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-neutral-400
                      "
                    >
                      {
                        existingVehicle.year
                      }{' '}
                      {
                        existingVehicle.make
                      }{' '}
                      {
                        existingVehicle.model
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-neutral-500
                      "
                    >
                      {
                        existingVehicle.registration
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

          {vehicleExists ===
            false && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.025]
                  p-4
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  New vehicle
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-neutral-500
                  "
                >
                  This registration
                  isn't registered yet.
                  Add the vehicle
                  details and RoadProof
                  will create it when
                  the inspection starts.
                </p>

                <div
                  className="
                    mt-5
                    space-y-4
                  "
                >
                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-neutral-400
                      "
                    >
                      Make
                    </label>

                    <input
                      value={make}
                      onChange={(
                        event,
                      ) =>
                        setMake(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="e.g. BMW"
                      className="
                        mt-2
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-black/20
                        px-4
                        py-3
                        text-sm
                        outline-none
                        placeholder:text-neutral-600
                        focus:border-white/30
                      "
                    />
                  </div>

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-neutral-400
                      "
                    >
                      Model
                    </label>

                    <input
                      value={model}
                      onChange={(
                        event,
                      ) =>
                        setModel(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="e.g. M3"
                      className="
                        mt-2
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-black/20
                        px-4
                        py-3
                        text-sm
                        outline-none
                        placeholder:text-neutral-600
                        focus:border-white/30
                      "
                    />
                  </div>

                  <div>
                    <label
                      className="
                        block
                        text-xs
                        font-medium
                        text-neutral-400
                      "
                    >
                      Year
                    </label>

                    <input
                      value={year}
                      onChange={(
                        event,
                      ) =>
                        setYear(
                          event
                            .target
                            .value,
                        )
                      }
                      inputMode="numeric"
                      placeholder="e.g. 2024"
                      className="
                        mt-2
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-black/20
                        px-4
                        py-3
                        text-sm
                        outline-none
                        placeholder:text-neutral-600
                        focus:border-white/30
                      "
                    />
                  </div>
                </div>
              </div>
            )}

          <div className="mt-6">
            <p
              className="
                text-xs
                font-medium
                text-neutral-400
              "
            >
              Damage image
            </p>

            <label
              className="
                mt-2
                flex
                cursor-pointer
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-white/15
                bg-white/[0.02]
                px-6
                py-9
                text-center
                transition
                hover:border-white/30
                hover:bg-white/[0.04]
              "
            >
              <Upload
                size={24}
                className="text-neutral-400"
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                Upload damage image
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                JPEG or PNG, max 5MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(
                  event,
                ) => {
                  const file =
                    event
                      .target
                      .files?.[0] ??
                    null

                  setSelectedFile(
                    file,
                  )
                }}
              />
            </label>

            {selectedFile && (
              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  px-4
                  py-3
                "
              >
                <div className="min-w-0">
                  <p
                    className="
                      truncate
                      text-xs
                      font-medium
                    "
                  >
                    {
                      selectedFile.name
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      text-neutral-500
                    "
                  >
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{' '}
                    MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    removeImage
                  }
                  className="
                    ml-3
                    rounded-lg
                    p-2
                    text-neutral-500
                    transition
                    hover:bg-white/5
                    hover:text-white
                  "
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            disabled={
              vehicleExists ===
                null ||
              !selectedFile ||
              inspectionMutation
                .isPending
            }
            onClick={() =>
              inspectionMutation
                .mutate()
            }
            className="
              mt-6
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-white
              px-5
              py-3
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-neutral-200
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {inspectionMutation
              .isPending ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <ScanLine
                size={18}
              />
            )}

            {inspectionMutation
              .isPending
              ? 'Analysing...'
              : 'Run AI Inspection'}
          </button>

          <button
            type="button"
            onClick={clearForm}
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-transparent
              px-5
              py-3
              text-sm
              text-neutral-400
              transition
              hover:bg-white/[0.03]
              hover:text-white
            "
          >
            <RotateCcw
              size={16}
            />

            Clear
          </button>

          {inspectionMutation
            .isError && (
            <div
              className="
                mt-4
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
                {
                  inspectionMutation
                    .error
                    .message
                }
              </p>
            </div>
          )}
        </section>

        <section
          className="
            rounded-2xl
            border
            border-white/10
            bg-[#0d0f12]
            p-6
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-white/[0.05]
              "
            >
              <ImageIcon
                size={19}
              />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-medium
                "
              >
                Image Preview
              </h2>

              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
                Review the image
                before analysis
              </p>
            </div>
          </div>

          <div
            className="
              mt-6
              flex
              min-h-[420px]
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-black/30
            "
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vehicle damage preview"
                className="
                  h-full
                  max-h-[520px]
                  w-full
                  object-contain
                "
              />
            ) : (
              <div
                className="
                  px-6
                  text-center
                "
              >
                <ImageIcon
                  size={30}
                  className="
                    mx-auto
                    text-neutral-600
                  "
                />

                <p
                  className="
                    mt-3
                    text-sm
                    text-neutral-400
                  "
                >
                  No image selected
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-neutral-600
                  "
                >
                  Your uploaded image
                  will appear here
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}


type ResultCardProps = {
  label: string
  value: string
}


function ResultCard({
  label,
  value,
}: ResultCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.025]
        p-5
      "
    >
      <p
        className="
          text-xs
          text-neutral-500
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-xl
          font-semibold
          capitalize
        "
      >
        {value}
      </p>
    </div>
  )
}


export default NewInspection