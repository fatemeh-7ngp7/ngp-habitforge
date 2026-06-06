'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { authApi } from '@/lib/auth'
import { extractErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

const registerSchema = z.object({
  email:            z.string().email('Enter a valid email address'),
  username:         z.string()
                     .min(3, 'Username must be at least 3 characters')
                     .max(50, 'Username too long')
                     .regex(/^[a-zA-Z0-9_]+$/, 'Letters, digits and underscores only'),
  first_name:       z.string().optional(),
  last_name:        z.string().optional(),
  password:         z.string().min(10, 'Password must be at least 10 characters'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Passwords do not match',
  path:    ['password_confirm'],
})
type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router    = useRouter()
  const setUser   = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const { user } = await authApi.register(values)
      setUser(user)
      toast.success(`Welcome to HabitForge, ${user.username}! 🎉`)
      router.push('/habits')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white text-xl font-black">
            🔥
          </div>
          <h1 className="text-2xl font-black tracking-tight">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start building better habits today</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Fill in the details below to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" placeholder="Alex" {...register('first_name')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" placeholder="Smith" {...register('last_name')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="alex_smith" autoComplete="username" {...register('username')} />
                {errors.username && <p className="text-destructive text-xs">{errors.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 10 characters" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password_confirm">Confirm password</Label>
                <Input id="password_confirm" type="password" placeholder="Repeat your password" autoComplete="new-password" {...register('password_confirm')} />
                {errors.password_confirm && <p className="text-destructive text-xs">{errors.password_confirm.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
