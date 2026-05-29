import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { login as signIn, loginWithGoogle } from "../services/firebase"
import { prepareQueriesAfterLogin } from "../lib/authQueryCache.js"
import { mapFirebaseError } from "../utils/mapFirebaseError.js"

export default function LoginPage() {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setShowEmptyError(true);
      setAuthError("");
      return;
    }

    setShowEmptyError(false);
    setAuthError("");
    try {
      await signIn(email, password);
      await prepareQueriesAfterLogin(queryClient);
      navigate("/kanban");
    } catch (err) {
      console.error(err?.code, err?.message);
      setAuthError(mapFirebaseError(err));
    }
  }
  const handleLoginWidthGoogle = async () => {
    setAuthError("");
    try {
      await loginWithGoogle();
      await prepareQueriesAfterLogin(queryClient);
      navigate("/kanban");
    } catch (err) {
      console.error(err?.code, err?.message);
      setAuthError(mapFirebaseError(err));
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome back. Enter your details below.</p>
        </div>

        <form className="space-y-5" action="#" method="post">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e)=> {
                setEmail(e.target.value);
                if (showEmptyError) setShowEmptyError(false);
                if (authError) setAuthError("");
              }}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e)=> {
                setPassword(e.target.value);
                if (showEmptyError) setShowEmptyError(false);
                if (authError) setAuthError("");
              }}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {showEmptyError ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              Please enter email and password.
            </p>
          ) : null}

          {authError ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {authError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleLogin}
            className="h-11 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Login
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide text-slate-500">
            <span className="bg-white px-3">Or continue with</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Sign in with Google"
            onClick={handleLoginWidthGoogle}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Sign in with Microsoft"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#7FBA00" d="M13 1h10v10H13z" />
              <path fill="#00A4EF" d="M1 13h10v10H1z" />
              <path fill="#FFB900" d="M13 13h10v10H13z" />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Sign in with Twitter"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1D9BF0" aria-hidden>
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
