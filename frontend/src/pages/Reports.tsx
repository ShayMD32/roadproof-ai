import {
  useQuery,
} from '@tanstack/react-query'

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
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
  formatSeverity,
  getDashboardSummary,
  getInspectionReports,
  hasAssignedSeverity,
} from '../api/client'


const PAGE_SIZE = 5


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

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    page,
    setPage,
  ] = useState(1)


  const {
    data: dashboardData,
    isLoading:
      dashboardLoading,
    isError:
      dashboardError,
  } = useQuery({
    queryKey: [
      'dashboard-summary',
    ],

    queryFn:
      getDashboardSummary,
  })


  const {
    data: reportsData,
    isLoading:
      reportsLoading,
    isFetching:
      reportsFetching,
    isError:
      reportsError,
  } = useQuery({
    queryKey: [
      'inspection-reports',
      page,
      PAGE_SIZE,
    ],

    queryFn: () =>
      getInspectionReports(
        page,
        PAGE_SIZE,
      ),
  })


  const filteredReports =
    useMemo(() => {
      const reports =
        reportsData
          ?.items ??
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
          const severityText =
            hasAssignedSeverity(
              report.severity,
            )
              ? formatSeverity(
                  report.severity,
                )
              : (
                'severity not ' +
                'assigned'
              )

          const searchableText = [
            report.registration,
            report.make,
            report.model,
            severityText,
            report
              .manual_review_required
              ? 'manual review'
              : '',
            report
              .damage_detected
              ? 'damage confirmed'
              : (
                'no confirmed ' +
                'damage'
              ),
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
      reportsData,
      search,
    ])


  const totalPages =
    reportsData
      ?.total_pages ??
    0

  const totalReports =
    reportsData
      ?.total ??
    0

  const currentPage =
    reportsData
      ?.page ??
    page

  const canGoPrevious =
    currentPage > 1

  const canGoNext =
    totalPages > 0 &&
    currentPage <
      totalPages

  const startItem =
    totalReports === 0
      ? 0
      : (
        (
          currentPage - 1
        ) *
        PAGE_SIZE +
        1
      )

  const endItem =
    Math.min(
      currentPage *
        PAGE_SIZE,
      totalReports,
    )


  function goToPreviousPage() {
    if (!canGoPrevious) {
      return
    }

    setPage(
      (
        current,
      ) =>
        current - 1,
    )
  }


  function goToNextPage() {
    if (!canGoNext) {
      return
    }

    setPage(
      (
        current,
      ) =>
        current + 1,
    )
  }


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
            Review the complete
            AI-assisted vehicle
            inspection history and
            assessment outcomes.
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

      {
        (
          dashboardError ||
          reportsError
        ) && (
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
              Unable to load
              inspection reports.
            </p>
          </div>
        )
      }

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
            {
              dashboardLoading
                ? '—'
                : (
                  dashboardData
                    ?.total_inspections ??
                  0
                )
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
            Confirmed damage
          </p>

          <p
            className="
              mt-5
              text-3xl
              font-semibold
            "
          >
            {
              dashboardLoading
                ? '—'
                : (
                  dashboardData
                    ?.damage_detected ??
                  0
                )
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
            Manual review
          </p>

          <p
            className="
              mt-5
              text-3xl
              font-semibold
            "
          >
            {
              dashboardLoading
                ? '—'
                : (
                  dashboardData
                    ?.manual_review_count ??
                  0
                )
            }
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
              Inspection reports
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-neutral-500
              "
            >
              {
                totalReports > 0
                  ? (
                    `Showing ${startItem}–${endItem} ` +
                    `of ${totalReports} reports`
                  )
                  : (
                    'Complete inspection history'
                  )
              }
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
              placeholder="Search this page"
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

        {
          reportsLoading
            ? (
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
            )
            : totalReports === 0
              ? (
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
                    Completed inspections
                    will appear here once
                    a vehicle image has
                    been analysed.
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
              )
              : filteredReports
                  .length === 0
                ? (
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
                        Try another
                        registration, make,
                        model or assessment
                        status on this page.
                      </p>
                    </div>
                  </div>
                )
                : (
                  <div className="divide-y divide-white/5">
                    {
                      filteredReports
                        .map(
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

                            const severityLabel =
                              hasAssignedSeverity(
                                report
                                  .severity,
                              )
                                ? `${formatSeverity(
                                    report
                                      .severity,
                                  )} severity`
                                : (
                                  'Severity ' +
                                  'not assigned'
                                )

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
                                      report
                                        .make
                                    }{' '}
                                    {
                                      report
                                        .model
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
                                      report
                                        .registration
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
                                      {
                                        status
                                      }
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
                                    {
                                      severityLabel
                                    }
                                  </p>
                                </div>

                                <div>
                                  <p className="text-sm">
                                    {
                                      formatDate(
                                        report
                                          .created_at,
                                      )
                                    }
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
                                      report
                                        .id
                                    }
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
                        )
                    }
                  </div>
                )
        }

        {
          totalReports > 0 && (
            <div
              className="
                flex
                flex-col
                gap-4
                border-t
                border-white/10
                px-6
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p
                className="
                  text-xs
                  text-neutral-500
                "
              >
                Page{' '}
                {
                  currentPage
                }{' '}
                of{' '}
                {
                  totalPages
                }
              </p>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    !canGoPrevious ||
                    reportsFetching
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-white/10
                    px-3
                    py-2
                    text-xs
                    font-medium
                    text-neutral-300
                    transition
                    hover:bg-white/5
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronLeft
                    size={15}
                  />

                  Previous
                </button>

                <button
                  type="button"
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    !canGoNext ||
                    reportsFetching
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-white/10
                    px-3
                    py-2
                    text-xs
                    font-medium
                    text-neutral-300
                    transition
                    hover:bg-white/5
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )
        }
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
          Reports are loaded in
          pages of five. Search
          currently filters the
          reports visible on the
          selected page.
        </p>
      </div>
    </div>
  )
}


export default Reports