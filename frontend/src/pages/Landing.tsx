import {
  ArrowRight,
  BrainCircuit,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

import {
  Link,
} from 'react-router'


function Landing() {
  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-semibold">
                RoadProof
              </p>

              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                AI Inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-400">
              <BrainCircuit size={14} />
              AI-assisted vehicle damage assessment
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
              Understand vehicle damage before making decisions.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-400">
              RoadProof analyses vehicle images for visible
              damage, estimates severity and flags uncertain
              results for manual review.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Start inspecting
                <ArrowRight size={17} />
              </Link>

              <a
                href="#preview"
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
              >
                See how it works
              </a>
            </div>

            <p className="mt-4 text-xs text-neutral-600">
              No account is required to explore the platform.
              Sign in when you want to run and save inspections.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d0f12] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Example inspection
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  2018 Volkswagen Golf
                </h2>
              </div>

              <div className="rounded-xl bg-white/[0.05] p-3">
                <CarFront size={22} />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-neutral-500">
                  Assessment
                </p>

                <p className="mt-2 font-medium">
                  Moderate damage
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-neutral-500">
                  Confirmed detections
                </p>

                <p className="mt-2 font-medium">
                  3
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-neutral-500">
                  Inspection confidence
                </p>

                <p className="mt-2 font-medium">
                  High
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs text-neutral-500">
                  Manual review
                </p>

                <p className="mt-2 font-medium">
                  Not required
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <ShieldCheck
                size={18}
                className="mt-0.5 text-emerald-400"
              />

              <p className="text-xs leading-5 text-neutral-400">
                This is demonstration data only. Public
                examples do not expose owner names, email
                addresses or vehicle registrations.
              </p>
            </div>
          </div>
        </section>

        <section
          id="preview"
          className="border-y border-white/10 bg-[#0d0f12]"
        >
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
                How RoadProof works
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Inspection without pretending AI is certain.
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                RoadProof combines damage detection with
                confidence and review rules so uncertain
                results can be escalated instead of being
                presented as definitive.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#08090b] p-6">
                <ScanLine size={22} />

                <h3 className="mt-5 font-medium">
                  1. Scan
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Upload vehicle images and run the AI
                  inspection pipeline.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#08090b] p-6">
                <ClipboardCheck size={22} />

                <h3 className="mt-5 font-medium">
                  2. Assess
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Review detections, severity, confidence
                  and inspection evidence.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#08090b] p-6">
                <CheckCircle2 size={22} />

                <h3 className="mt-5 font-medium">
                  3. Review
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Low-confidence and high-risk outcomes can
                  be flagged for human review.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-[#0d0f12] p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] sm:flex">
                <LockKeyhole size={21} />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Your inspections stay private.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  Account data and personal vehicle records
                  remain private. Future community sharing
                  will be optional, anonymised and disabled
                  by default.
                </p>
              </div>
            </div>

            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Create account
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}


export default Landing