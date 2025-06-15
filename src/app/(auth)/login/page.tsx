'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleGithubSignIn = async () => {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with GitHub');
    }
  };

  return (
    <div className="flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center">
            <Image
              className="mx-auto w-64 h-auto"
              src="/GWlogo.png"
              alt="Ghostwriter"
              width={512}
              height={200}
              priority
              style={{ objectFit: 'contain' }}
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-zinc-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Not a member?{' '}
              <Link href="/register" className="font-semibold text-zinc-900 hover:text-zinc-700 underline decoration-zinc-300 underline-offset-4">
                Start a 14 day free trial
              </Link>
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-zinc-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6 bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-zinc-900">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-500 sm:text-sm sm:leading-6 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 bg-white"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-zinc-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <Link href="/forgot-password" className="font-semibold text-zinc-900 hover:text-zinc-700 underline decoration-zinc-300 underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-zinc-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div>
              <div className="relative mt-10">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.70495L1.27498 6.60995C0.464976 8.22995 0 10.0599 0 11.9999C0 13.9399 0.464976 15.7699 1.27498 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87043 19.245 6.21045 17.135 5.26545 14.29L1.27545 17.385C3.25545 21.31 7.31043 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">Google</span>
                </button>

                <button
                  onClick={handleGithubSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 transition-colors"
                >
                  <svg className="h-5 w-5 fill-zinc-900" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/login-background.jpg"
          alt="Login background"
          width={1920}
          height={1080}
          priority
        />
      </div>
    </div>
  );
}

