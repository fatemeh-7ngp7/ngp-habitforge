'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, extractErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Users, UserPlus, Trophy, Rss,
  CheckCircle2, XCircle, Flame, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserMini {
  id: string
  username: string
  first_name: string
  last_name: string
}

interface Friendship {
  id: string
  requester: UserMini
  addressee: UserMini
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
}

interface ChallengeParticipant {
  user: UserMini
  score: number
  completions: number
  joined_at: string
}

interface Challenge {
  id: string
  title: string
  description: string
  created_by?: UserMini
  start_date: string
  end_date: string
  max_participants: number
  participant_count: number
  is_active: boolean
  habit_type?: string
  participants?: ChallengeParticipant[]
}

interface FeedItem {
  id: string
  user: UserMini
  event_type: string
  title: string
  body: string
  payload: Record<string, unknown>
  created_at: string
}

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK = {
  friends:   ['social', 'friends'],
  requests:  ['social', 'friend-requests'],
  challenges:['social', 'challenges'],
  feed:      ['social', 'feed'],
}

// ─── Feed event icon ──────────────────────────────────────────────────────────

function feedIcon(type: string) {
  switch (type) {
    case 'habit_completed':  return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
    case 'streak_reached':   return <Flame className="w-3.5 h-3.5 text-orange-400" />
    case 'challenge_joined': return <Trophy className="w-3.5 h-3.5 text-blue-400" />
    case 'challenge_won':    return <Trophy className="w-3.5 h-3.5 text-yellow-400" />
    case 'badge_earned':     return <Zap className="w-3.5 h-3.5 text-purple-400" />
    default:                 return <Rss className="w-3.5 h-3.5 text-muted-foreground" />
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }: { user: UserMini; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <div className={cn(
      'rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary uppercase',
      s
    )}>
      {user.username.slice(0, 1)}
    </div>
  )
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [inviteUsername, setInviteUsername] = useState('')

  const { data: friends = [], isLoading: fl } = useQuery({
    queryKey: QK.friends,
    queryFn:  () => apiGet<Friendship[]>('/social/friends/'),
    staleTime: 30_000,
  })

  const { data: requests = [], isLoading: rl } = useQuery({
    queryKey: QK.requests,
    queryFn:  () => apiGet<Friendship[]>('/social/friends/requests/'),
    staleTime: 30_000,
  })

  const invite = useMutation({
    mutationFn: (username: string) => apiPost('/social/friends/invite/', { username }),
    onSuccess: () => {
      toast.success('Friend request sent')
      setInviteUsername('')
      qc.invalidateQueries({ queryKey: QK.requests })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      apiPost(`/social/friends/requests/${id}/${action}/`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.friends })
      qc.invalidateQueries({ queryKey: QK.requests })
      toast.success('Request updated')
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const incomingRequests = requests.filter(r => r.addressee.username === user?.username)

  return (
    <div className="space-y-6">
      {/* Invite */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username…"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && invite.mutate(inviteUsername)}
              className="flex-1"
            />
            <Button
              onClick={() => invite.mutate(inviteUsername)}
              disabled={!inviteUsername.trim() || invite.isPending}
            >
              {invite.isPending ? 'Sending…' : 'Send Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Requests ({incomingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomingRequests.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar user={r.requester} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.requester.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respond.mutate({ id: r.id, action: 'accept' })}
                    disabled={respond.isPending}
                    className="gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respond.mutate({ id: r.id, action: 'decline' })}
                    disabled={respond.isPending}
                    className="gap-1 text-muted-foreground"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fl ? (
            <Skeleton className="h-20 w-full" />
          ) : friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No friends yet — invite someone to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map(f => {
                const friend = f.requester.username === user?.username ? f.addressee : f.requester
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar user={friend} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{friend.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {friend.first_name} {friend.last_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">
                      Friend
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Challenges Tab ───────────────────────────────────────────────────────────

function ChallengesTab() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '',
    start_date: '', end_date: '',
    max_participants: 10,
    privacy: 'PUBLIC',
  })

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: QK.challenges,
    queryFn:  () => apiGet<Challenge[]>('/social/challenges/'),
    staleTime: 30_000,
  })

  const create = useMutation({
    mutationFn: () => apiPost('/social/challenges/', form),
    onSuccess: () => {
      toast.success('Challenge created!')
      setShowCreate(false)
      setForm({ title: '', description: '', start_date: '', end_date: '', max_participants: 10, privacy: 'PUBLIC' })
      qc.invalidateQueries({ queryKey: QK.challenges })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const join = useMutation({
    mutationFn: (id: string) => apiPost(`/social/challenges/${id}/join/`, {}),
    onSuccess: () => {
      toast.success('Joined challenge!')
      qc.invalidateQueries({ queryKey: QK.challenges })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
        </p>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Challenge'}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. 30-Day Morning Run"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What's this challenge about?"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End Date *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Max Participants</Label>
              <Input
                type="number"
                min={2}
                max={100}
                value={form.max_participants}
                onChange={(e) => setForm(p => ({ ...p, max_participants: Number(e.target.value) }))}
                className="mt-1 w-32"
              />
            </div>
            <div>
              <Label className="text-xs">Privacy</Label>
              <select
                className="w-full mt-1 bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground"
                value={form.privacy}
                onChange={(e) => setForm(p => ({ ...p, privacy: e.target.value }))}
              >
                <option value="PUBLIC">Public — anyone can join</option>
                <option value="PRIVATE">Private — invite only</option>
              </select>
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.title || !form.start_date || !form.end_date}
              className="w-full"
            >
              {create.isPending ? 'Creating…' : 'Create Challenge'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Challenge list */}
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No challenges yet</p>
            <p className="text-xs text-muted-foreground">Create the first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {challenges.map(c => {
            const isCreator = c.created_by?.username === user?.username
            const isFull    = c.participant_count >= c.max_participants
            return (
              <Card key={c.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{c.title}</p>
                        {isCreator && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            Creator
                          </Badge>
                        )}
                        {isFull && (
                          <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/30">
                            Full
                          </Badge>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>by {c.created_by?.username ?? '—'}</span>
                        <span>·</span>
                        <span>{c.participant_count}/{c.max_participants} joined</span>
                        <span>·</span>
                        <span>{new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!isCreator && !isFull && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => join.mutate(c.id)}
                        disabled={join.isPending}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab() {
  const { data: feed = [], isLoading } = useQuery({
    queryKey: QK.feed,
    queryFn:  () => apiGet<FeedItem[]>('/social/feed/'),
    staleTime: 30_000,
  })

  if (isLoading) return <Skeleton className="h-40 w-full" />

  if (feed.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Rss className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Feed is empty</p>
          <p className="text-xs text-muted-foreground">
            Add friends and complete habits to see activity here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {feed.map(item => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
          <div className="mt-0.5">{feedIcon(item.event_type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{item.user.username}</span>
              {' '}{item.body}
            </p>
            {item.title && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.title}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'challenges' | 'feed'

export default function SocialPage() {
  const [tab, setTab] = useState<Tab>('friends')

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'friends',    label: 'Friends',    icon: Users  },
    { key: 'challenges', label: 'Challenges', icon: Trophy },
    { key: 'feed',       label: 'Feed',       icon: Rss    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Social</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Friends, challenges, and activity feed.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors border-r border-border last:border-0',
              tab === key
                ? 'bg-primary/10 text-primary'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'friends'    && <FriendsTab />}
      {tab === 'challenges' && <ChallengesTab />}
      {tab === 'feed'       && <FeedTab />}
    </div>
  )
}
