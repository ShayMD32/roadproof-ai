import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  loginUser,
} from '../api/client'


function Login() {
  const navigate =
    useNavigate()

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)


  function isValidEmail(
    value: string,
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    )
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (
      !isValidEmail(email)
    ) {
      setError(
        'Please enter a valid email address',
      )
      return
    }

    if (
      password.length < 8
    ) {
      setError(
        'Password must be at least 8 characters',
      )
      return
    }

    setLoading(true)

    try {
      await loginUser({
        email,
        password,
      })

      navigate(
        '/app',
        {
          replace: true,
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed',
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-sky-400">
              RoadProof AI
            </p>

            <h1 className="text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your RoadProof dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={
                  (event) =>
                    setEmail(
                      event.target.value,
                    )
                }
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={
                  (event) =>
                    setPassword(
                      event.target.value,
                    )
                }
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="Enter your password"
              />

              <p className="mt-2 text-xs text-slate-500">
                Minimum 8 characters.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            No account yet?{' '}
            <Link
              to="/register"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Create one
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-500">
            <Link
              to="/"
              className="hover:text-slate-300"
            >
              Back to RoadProof
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


export default Login