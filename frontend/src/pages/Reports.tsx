import {
  useQuery,
} from '@tanstack/react-query'

import {
  AlertTriangle,
  ClipboardCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

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


function Reports() {
  const navigate =
    useNavigate()

  const [search, setSearch] =
    useState('')

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


  const filteredReports =
    useMemo(() => {
      const reports =
        data?.recent_inspections ??
        []

      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return reports
      }

      return reports.filter(
        (
          report,
        ) => {
          const searchableText = [
            report.registration,
            report.make,
            report.model,
            report.severity ?? '',
            report.manual_review_required
              ? 'manual review'
              : '',
            report.damage_detected
              ? 'damage confirmed'
              : 'no confirmed damage',
          ]
            .join(' ')
            .toLowerCase()

          return searchableText
            .includes(
              query,
            )
        },
      )
    }, [
      data,
      search,
    ])


  return (
    <div className="mx-auto max-w-7xl">
      <div
        className="
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
            Inspection history
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
            Reports
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
            Review recent AI-assisted vehicle
            inspection reports and assessment
            outcomes.
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
            px-5
            py-3
            text-sm
            font-semibold
            text-black
            transition
            hover:bg-neutral-200
          "
        >
          New inspection
        </button>
      </div>

      {isError && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >
          <p className="text-sm text-red-300">
            Unable to load inspection reports.
          </p>
        </div>
      )}

      <section
        className="
          mt-8
          grid
          gap-4
          sm:grid-cols-3
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
          <p className="text-sm text-neutral-400">
            Total inspections
          </p>

          <p
            className="
              mt-5
              text-3xl
              font-semibold
            "
          >
            {isLoading
              ? '—'
              : (
                data
                  ?.total_inspections ??
                0
              )}
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
            Confirmed damage
          </p>

          <p
            className="
              mt-5
              text-3xl
              font-semibold
            "
          >
            {isLoading
              ? '—'
              : (
                data
                  ?.damage_detected ??
                0
              )}
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
            Manual review
          </p>

          <p
            className="
              mt-5
              text-3xl
              font-semibold
            "
          >
            {isLoading
              ? '—'
              : (
                data
                  ?.manual_review_count ??
                0
              )}
          </p>
        </div>
      </section>

      <section
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-[#0d0f12]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-white/10
            px-6
            py-5
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <h2 className="font-medium">
              Recent reports
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-neutral-500
              "
            >
              Showing the latest inspection results
            </p>
          </div>

          <div
            className="
              flex
              w-full
              items-center
              gap-2
              rounded-xl
              border
              border-white/10
              bg-white/[0.03]
              px-3
              md:max-w-xs
            "
          >
            <Search
              size={16}
              className="text-neutral-500"
            />

            <input
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search reports"
              className="
                w-full
                bg-transparent
                py-2.5
                text-sm
                outline-none
                placeholder:text-neutral-600
              "
            />
          </div>
        </div>

        {isLoading ? (
          <div
            className="
              flex
              min-h-72
              items-center
              justify-center
              px-6
            "
          >
            <p className="text-sm text-neutral-500">
              Loading reports…
            </p>
          </div>
        ) : (
          data
            ?.recent_inspections
            .length ?? 0
        ) === 0 ? (
          <div
            className="
              flex
              min-h-72
              flex-col
              items-center
              justify-center
              px-6
              text-center
            "
          >
            <ClipboardCheck
              size={26}
              className="text-neutral-500"
            />

            <h3
              className="
                mt-4
                text-sm
                font-medium
              "
            >
              No reports yet
            </h3>

            <p
              className="
                mt-2
                max-w-sm
                text-xs
                leading-5
                text-neutral-500
              "
            >
              Completed inspections will appear
              here once a vehicle image has been
              analysed.
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
                rounded-xl
                border
                border-white/10
                px-4
                py-2.5
                text-xs
                font-medium
                text-neutral-300
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              Start inspection
            </button>
          </div>
        ) : filteredReports.length ===
          0 ? (
          <div
            className="
              flex
              min-h-56
              items-center
              justify-center
              px-6
              text-center
            "
          >
            <div>
              <Search
                size={22}
                className="
                  mx-auto
                  text-neutral-500
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-medium
                "
              >
                No matching reports
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-neutral-500
                "
              >
                Try another registration, make,
                model or assessment status.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredReports.map(
              (
                report,
              ) => {
                let status =
                  'No confirmed damage'

                let StatusIcon =
                  ShieldCheck

                if (
                  report
                    .manual_review_required
                ) {
                  status =
                    'Manual review'

                  StatusIcon =
                    ShieldAlert
                } else if (
                  report
                    .damage_detected
                ) {
                  status =
                    'Damage confirmed'

                  StatusIcon =
                    AlertTriangle
                }

                return (
                  <button
                    key={
                      report.id
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        report
                          .report_url,
                      )
                    }
                    className="
                      grid
                      w-full
                      gap-4
                      px-6
                      py-5
                      text-left
                      transition
                      hover:bg-white/[0.03]
                      md:grid-cols-[1.2fr_1fr_1fr_auto]
                      md:items-center
                    "
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {
                          report.make
                        }{' '}
                        {
                          report.model
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
                          report.registration
                        }
                      </p>
                    </div>

                    <div>
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <StatusIcon
                          size={15}
                          className="text-neutral-400"
                        />

                        <p className="text-sm">
                          {status}
                        </p>
                      </div>

                      <p
                        className="
                          mt-1
                          text-xs
                          capitalize
                          text-neutral-500
                        "
                      >
                        {report.severity
                          ? `${report.severity} severity`
                          : 'Severity not assigned'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm">
                        {formatDate(
                          report.created_at,
                        )}
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-neutral-500
                        "
                      >
                        Inspection #
                        {report.id}
                      </p>
                    </div>

                    <span
                      className="
                        text-xs
                        font-medium
                        text-neutral-400
                        md:text-right
                      "
                    >
                      View report
                    </span>
                  </button>
                )
              },
            )}
          </div>
        )}
      </section>

      <div
        className="
          mt-4
          rounded-xl
          border
          border-white/10
          bg-white/[0.02]
          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            leading-5
            text-neutral-500
          "
        >
          This view currently shows the latest
          five inspection reports. Full report
          history and pagination will be added
          with the backend pagination work.
        </p>
      </div>
    </div>
  )
}


export default Reports