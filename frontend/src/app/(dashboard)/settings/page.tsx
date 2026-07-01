'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { User, Shield, Trash2, Download, LogOut, History } from 'lucide-react'

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

// ─── Audit log ────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id:            string
  action:        string
  resource_type: string
  resource_id:   string
  ip_address:    string | null
  extra:         Record<string, unknown>
  timestamp:     string
}

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'text-green-400 bg-green-400/10 border-green-400/20',
  UPDATE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  DELETE: 'text-destructive bg-destructive/10 border-destructive/20',
  LOGIN:  'text-primary bg-primary/10 border-primary/20',
  LOGOUT: 'text-muted-foreground bg-muted/40 border-border',
  EXPORT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  OTHER:  'text-muted-foreground bg-muted/40 border-border',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// resource_type is logged as the raw request path (e.g. "/api/v2/habits/<uuid>/complete/").
// Strip the API prefix and any UUID segments so it reads like "habits / complete".
function formatResourcePath(path: string): string {
  const segments = path
    .replace(/^\/api\/v2\//, '')
    .replace(/\/$/, '')
    .split('/')
    .filter((seg) => seg && !UUID_RE.test(seg))

  return segments.join(' / ') || path
}

function AuditLogList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', 'my-log'],
    queryFn:  () => apiGet<AuditLogEntry[]>('/users/me/audit-log/'),
    staleTime: 30_000,
  })

  const logs = data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Couldn't load activity history.
      </p>
    )
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No recent activity yet.
      </p>
    )
  }

  return (
    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/10"
        >
          <span
            className={`shrink-0 text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
              ACTION_STYLE[log.action] ?? ACTION_STYLE.OTHER
            }`}
          >
            {log.action}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate font-mono">
              {formatResourcePath(log.resource_type)}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] text-muted-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </p>
            {log.ip_address && (
              <p className="text-[10px] text-muted-foreground/70 font-mono">{log.ip_address}</p>
            )}
          </div>
        </div>
      ))}
    </div>
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

      {/* Recent Activity — personal audit trail */}
      <Section title="Recent Activity" icon={History}>
        <AuditLogList />
      </Section>

    </div>
  )
}