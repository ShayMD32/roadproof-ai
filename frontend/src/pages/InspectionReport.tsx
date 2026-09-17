import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  CheckCircle2,
  ScanLine,
} from 'lucide-react'

import { useNavigate, useParams } from 'react-router'

import {
  getInspectionReport,
} from '../api/client'


function InspectionReport() {
  const navigate = useNavigate()

  const { inspectionId } = useParams()

  const numericInspectionId = Number(
    inspectionId,
  )

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'inspection-report',
      numericInspectionId,
    ],

    queryFn: () =>
      getInspectionReport(
        numericInspectionId,
      ),

    enabled: Number.isFinite(
      numericInspectionId,
    ),
  })


  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-neutral-400">
          Loading inspection report...
        </p>
      </div>
    )
  }


  if (isError || !report) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-red-300">
          {error instanceof Error
            ? error.message
            : 'Unable to load report'}
        </p>
      </div>
    )
  }


  const confidence =
    report.summary.highest_confidence

  return (
    <div className="mx-auto max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="
          flex items-center gap-2
          text-sm text-neutral-400
          transition
          hover:text-white
        "
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mt-6">
        <p
          className="
            text-xs font-medium
            uppercase
            tracking-[0.25em]
            text-neutral-500
          "
        >
          Inspection report
        </p>

        <div
          className="
            mt-2 flex flex-col gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl font-semibold
                tracking-tight
                md:text-4xl
              "
            >
              {report.vehicle.make}{' '}
              {report.vehicle.model}
            </h1>

            <p className="mt-2 text-sm text-neutral-400">
              {report.vehicle.year} ·{' '}
              {report.vehicle.registration}
            </p>
          </div>

          <div
            className="
              rounded-full
              border border-white/10
              bg-white/[0.04]
              px-4 py-2
              text-xs text-neutral-300
            "
          >
            Inspection #{report.inspection_id}
          </div>
        </div>
      </div>

      <section
        className="
          mt-8 grid gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <ReportStat
          label="Damage"
          value={
            report.summary.damage_detected
              ? 'Detected'
              : 'None'
          }
        />

        <ReportStat
          label="Severity"
          value={
            report.summary.severity ??
            'None'
          }
        />

        <ReportStat
          label="Detections"
          value={String(
            report.summary.damage_count,
          )}
        />

        <ReportStat
          label="Confidence"
          value={
            confidence !== null
              ? `${Math.round(
                  confidence * 100,
                )}%`
              : 'N/A'
          }
        />
      </section>

      <section
        className="
          mt-6
          rounded-2xl
          border border-white/10
          bg-[#0d0f12]
          p-6
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              bg-white/[0.05]
            "
          >
            <CarFront size={18} />
          </div>

          <div>
            <h2 className="text-sm font-medium">
              Vehicle information
            </h2>

            <p className="text-xs text-neutral-500">
              Inspection subject
            </p>
          </div>
        </div>

        <div
          className="
            mt-6 grid gap-4
            sm:grid-cols-2
          "
        >
          <InfoRow
            label="Registration"
            value={report.vehicle.registration}
          />

          <InfoRow
            label="Make"
            value={report.vehicle.make}
          />

          <InfoRow
            label="Model"
            value={report.vehicle.model}
          />

          <InfoRow
            label="Year"
            value={String(
              report.vehicle.year,
            )}
          />
        </div>
      </section>

      <section
        className="
          mt-6
          rounded-2xl
          border border-white/10
          bg-[#0d0f12]
          p-6
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              bg-white/[0.05]
            "
          >
            <ScanLine size={18} />
          </div>

          <div>
            <h2 className="text-sm font-medium">
              Damage detections
            </h2>

            <p className="text-xs text-neutral-500">
              AI-generated findings
            </p>
          </div>
        </div>

        {report.detections.length === 0 ? (
          <div
            className="
              mt-6
              rounded-2xl
              border border-white/10
              bg-white/[0.02]
              p-6
              text-center
            "
          >
            <CheckCircle2
              size={22}
              className="
                mx-auto
                text-emerald-400
              "
            />

            <p className="mt-3 text-sm">
              No damage detections recorded
            </p>

            <p
              className="
                mt-1
                text-xs text-neutral-500
              "
            >
              AI results may require manual review.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {report.detections.map(
              (detection) => (
                <div
                  key={detection.id}
                  className="
                    flex items-center
                    justify-between
                    rounded-xl
                    border border-white/10
                    bg-white/[0.025]
                    p-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm font-medium
                        capitalize
                      "
                    >
                      {detection.damage_type}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-neutral-500
                      "
                    >
                      Detection #{detection.id}
                    </p>
                  </div>

                  <p
                    className="
                      text-sm font-medium
                    "
                  >
                    {Math.round(
                      detection.confidence *
                        100,
                    )}
                    %
                  </p>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section
        className="
          mt-6
          rounded-2xl
          border border-amber-500/20
          bg-amber-500/[0.05]
          p-5
        "
      >
        <div className="flex gap-3">
          <AlertTriangle
            size={19}
            className="
              mt-0.5
              shrink-0
              text-amber-400
            "
          />

          <div>
            <p className="text-sm font-medium">
              AI-assisted assessment
            </p>

            <p
              className="
                mt-1
                text-xs leading-5
                text-neutral-400
              "
            >
              Results should be manually reviewed
              when confidence is low or significant
              damage is suspected.
            </p>
          </div>
        </div>
      </section>

      <section
        className="
          mt-6
          rounded-2xl
          border border-white/10
          bg-[#0d0f12]
          p-6
        "
      >
        <h2 className="text-sm font-medium">
          AI model
        </h2>

        <div className="mt-5 space-y-3">
          <InfoRow
            label="Repository"
            value={report.model.repository}
          />

          <InfoRow
            label="Checkpoint"
            value={report.model.checkpoint}
          />

          <InfoRow
            label="Confidence threshold"
            value={`${Math.round(
              report.model
                .confidence_threshold *
                100,
            )}%`}
          />
        </div>
      </section>
    </div>
  )
}


type ReportStatProps = {
  label: string
  value: string
}


function ReportStat({
  label,
  value,
}: ReportStatProps) {
  return (
    <div
      className="
        rounded-2xl
        border border-white/10
        bg-[#0d0f12]
        p-5
      "
    >
      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p
        className="
          mt-2
          text-xl font-semibold
          capitalize
        "
      >
        {value}
      </p>
    </div>
  )
}


type InfoRowProps = {
  label: string
  value: string
}


function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div
      className="
        flex items-center
        justify-between gap-4
        border-b border-white/5
        pb-3
      "
    >
      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p className="text-sm text-right">
        {value}
      </p>
    </div>
  )
}


export default InspectionReport