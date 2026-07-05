'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiPost, extractErrorMessage } from '@/lib/api'

type VerifyState = 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const uid   = searchParams.get('uid')
  const token = searchParams.get('token')

  const [state, setState]     = useState<VerifyState>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!uid || !token) {
      setState('error')
      setMessage('This verification link is missing required information.')
      return
    }

    let cancelled = false

    apiPost<{ message: string }>('/auth/email/verify/', { uid, token })
      .then((data) => {
        if (cancelled) return
        setState('success')
        setMessage(data.message)
      })
      .catch((err) => {
        if (cancelled) return
        setState('error')
        setMessage(extractErrorMessage(err, 'This verification link is invalid or has expired.'))
      })

    return () => { cancelled = true }
  }, [uid, token])

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          {state === 'verifying' && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
          {state === 'success'   && <CheckCircle2 className="w-10 h-10 text-green-400" />}
          {state === 'error'     && <XCircle className="w-10 h-10 text-destructive" />}
        </div>
        <CardTitle>
          {state === 'verifying' && 'Verifying your email…'}
          {state === 'success'   && 'Email verified!'}
          {state === 'error'     && 'Verification failed'}
        </CardTitle>
        <CardDescription>{message || 'One moment please.'}</CardDescription>
      </CardHeader>
      <CardContent>
        {state === 'success' && (
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        )}
        {state === 'error' && (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You can request a new verification link from your account settings after signing in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white text-xl font-black">
            🔥
          </div>
          <h1 className="text-2xl font-black tracking-tight">NGP HabitForge</h1>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardHeader className="text-center">
                <Loader2 className="mx-auto mb-2 w-10 h-10 text-primary animate-spin" />
                <CardTitle>Loading…</CardTitle>
              </CardHeader>
            </Card>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}