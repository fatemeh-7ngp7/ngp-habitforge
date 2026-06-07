'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/auth'
import { apiPut, apiPost, apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { User, Shield, Trash2, Download, LogOut } from 'lucide-react'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore()

  const [profileForm, setProfileForm] = useState({
    username:   user?.username   ?? '',
    first_name: user?.profile?.first_name ?? '',
    last_name:  user?.profile?.last_name  ?? '',
    bio:        user?.profile?.bio      ?? '',
    timezone:   user?.profile?.timezone ?? 'UTC',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password:     '',
    new_password:         '',
    new_password_confirm: '',
  })

  const [savingProfile,  setSavingProfile]  = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Profile update ─────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const updated = await apiPut<typeof user>('/users/me/', {
        username:   profileForm.username,
        first_name: profileForm.first_name,
        last_name:  profileForm.last_name,
        profile: {
          bio:      profileForm.bio,
          timezone: profileForm.timezone,
        },
      })
      setUser(updated)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Password change ────────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.new_password.length < 10) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      await apiPost('/auth/password/change/', {
        current_password:     passwordForm.current_password,
        new_password:         passwordForm.new_password,
        new_password_confirm: passwordForm.new_password_confirm,
      })
      setPasswordForm({ current_password: '', new_password: '', new_password_confirm: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  // ── GDPR export ───────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const data = await apiGet('/users/me/export/')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `ngp-habitforge-export-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data export downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  // ── Account deletion ──────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await authApi.logout()
      logout()
      toast.success('Account deletion requested. Data will be purged within 30 days.')
      window.location.href = '/login'
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingAccount(false)
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    window.location.href = '/login'
  }

  if (!user) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, profile, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div className="space-y-4">
          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              value={user.email}
              disabled
              className="bg-muted/30 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">
              Email cannot be changed here. Contact support.
            </p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs">Username</Label>
            <Input
              id="username"
              value={profileForm.username}
              onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))}
              placeholder="your_username"
            />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name" className="text-xs">First Name</Label>
              <Input
                id="first_name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                placeholder="First"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name" className="text-xs">Last Name</Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                placeholder="Last"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs">Bio</Label>
            <Input
              id="bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="A short bio about yourself"
              maxLength={200}
            />
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-xs">Timezone</Label>
            <select
              id="timezone"
              value={profileForm.timezone}
              onChange={(e) => setProfileForm(p => ({ ...p, timezone: e.target.value }))}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground"
            >
              {[
                'UTC', 'Asia/Tehran', 'Asia/Dubai', 'Asia/Tokyo',
                'Europe/London', 'Europe/Paris', 'Europe/Berlin',
                'America/New_York', 'America/Chicago', 'America/Los_Angeles',
                'Australia/Sydney',
              ].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full sm:w-auto"
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </Section>

      {/* Password */}
      <Section title="Security" icon={Shield}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="old_password" className="text-xs">Current Password</Label>
            <Input
              id="old_password"
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_password" className="text-xs">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password2" className="text-xs">Confirm Password</Label>
              <Input
                id="new_password2"
                type="password"
                value={passwordForm.new_password_confirm}
                onChange={(e) => setPasswordForm(p => ({ ...p, new_password_confirm: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {savingPassword ? 'Changing…' : 'Change Password'}
          </Button>
        </div>
      </Section>

      {/* Account — GDPR + Logout + Delete */}
      <Section title="Account" icon={Shield}>
        <div className="space-y-3">
          {/* Account info */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <p>Joined: {new Date(user.date_joined).toLocaleDateString()}</p>
            <p>Email verified: {user.is_verified ? '✅ Yes' : '❌ No'}</p>
          </div>

          {/* Export data */}
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Download className="w-4 h-4" />
            Export My Data (GDPR)
          </Button>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>

          {/* Delete account */}
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">
                ⚠ Confirm Account Deletion
              </p>
              <p className="text-xs text-muted-foreground">
                All your data will be permanently purged within 30 days per GDPR Art. 17.
                This action is irreversible.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={deletingAccount}
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {deletingAccount ? 'Deleting…' : 'Yes, Delete My Account'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

    </div>
  )
}
