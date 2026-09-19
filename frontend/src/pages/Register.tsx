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
  registerUser,
} from '../api/client'


function Register() {
  const navigate =
    useNavigate()

  const [
    fullName,
    setFullName,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword,
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


  function getPasswordError(
    value: string,
  ) {
    if (value.length < 8) {
      return (
        'Password must be at least 8 characters'
      )
    }

    if (
      !/[A-Z]/.test(value)
    ) {
      return (
        'Password must include at least one uppercase letter'
      )
    }

    if (
      !/[a-z]/.test(value)
    ) {
      return (
        'Password must include at least one lowercase letter'
      )
    }

    if (
      !/[0-9]/.test(value)
    ) {
      return (
        'Password must include at least one number'
      )
    }

    return ''
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

    const passwordError =
      getPasswordError(
        password,
      )

    if (passwordError) {
      setError(
        passwordError,
      )
      return
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'Passwords do not match',
      )
      return
    }

    setLoading(true)

    try {
      await registerUser({
        full_name: fullName,
        email,
        password,
      })

      await loginUser({
        email,
        password,
      })

      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed',
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
              Create account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Create an account to manage inspections securely.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={
                  (event) =>
                    setFullName(
                      event.target.value,
                    )
                }
                required
                autoComplete="name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="Your name"
              />
            </div>

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
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="Create a password"
              />

              <p className="mt-2 text-xs text-slate-400">
                Minimum 8 characters, with uppercase, lowercase and a number.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={
                  (event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder="Repeat your password"
              />
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
                ? 'Creating account...'
                : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


export default Register