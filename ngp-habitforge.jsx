import { useState, useEffect, useRef } from "react";

const COLORS = {
  forge: "#E8400C",
  forgeLight: "#FF5A2C",
  forgeDim: "rgba(232,64,12,0.12)",
  forgeBorder: "rgba(232,64,12,0.3)",
  dark: "#0E0D0B",
  darkCard: "#181714",
  darkBorder: "#2A2925",
  darkBorder2: "#3A3830",
  muted: "#888680",
  text: "#E8E6E0",
  textDim: "#B0ADA6",
};

const NAV_ITEMS = ["Dashboard", "Architecture", "API Reference", "Security", "AI Engine", "Database", "Notifications", "API Playground", "Settings", "Team"];

// Fake sparkline data
const sparkData = [18,22,19,28,31,25,38,42,37,45,51,48,56,60,55,62,70,68,75,80,74,82,88,85,91,96,90,97,100,98];

function Sparkline({ data, color = COLORS.forge, height = 36, width = 120 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(" ");
  const area = `M0,${height} L${pts.split(" ").map(p => p).join(" L")} L${width},${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ label, color = COLORS.forge }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 4, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function MetricCard({ label, value, sub, spark, color = COLORS.forge, icon }) {
  return (
    <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + "55"}
      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.darkBorder}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>}
      </div>
      {spark && <Sparkline data={sparkData} color={color} />}
    </div>
  );
}

function Tag({ children, color = COLORS.muted }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: color + "18", color, border: `0.5px solid ${color}33`, fontFamily: "monospace", fontWeight: 500 }}>
      {children}
    </span>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────
function DashboardTab() {
  const [activeHabit, setActiveHabit] = useState(0);
  const habits = [
    { name: "Morning Run", streak: 47, target: "5km", completion: 94, color: "#E8400C" },
    { name: "Deep Work", streak: 31, target: "2hr", completion: 87, color: "#2D9CDB" },
    { name: "Meditation", streak: 62, target: "20min", completion: 98, color: "#27AE60" },
    { name: "Cold Shower", streak: 14, target: "3min", completion: 71, color: "#9B51E0" },
    { name: "Reading", streak: 28, target: "30pg", completion: 82, color: "#F2994A" },
  ];
  const heatmapWeeks = 15;
  const days = Array.from({length: heatmapWeeks * 7}, (_, i) => Math.random() > 0.25 ? Math.floor(Math.random() * 4) + 1 : 0);
  const heatColor = (v) => {
    if (v === 0) return COLORS.darkBorder;
    const alpha = [0.25, 0.5, 0.75, 1][v - 1];
    return `rgba(232, 64, 12, ${alpha})`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Good morning, Alex</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>You're on a 62-day streak · Today is Day 1 of Q3</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge label="v5.0 Enterprise" color={COLORS.forge} />
          <StatusBadge label="SOC 2 Type II" color="#27AE60" />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <MetricCard label="Active Habits" value="12" sub="↑ 2 this month" spark icon="⚡" />
        <MetricCard label="Best Streak" value="62d" sub="Meditation" color="#27AE60" spark icon="🔥" />
        <MetricCard label="Completion Rate" value="88%" sub="↑ 4% vs last week" color="#2D9CDB" spark icon="📊" />
        <MetricCard label="XP This Week" value="2,840" sub="Rank: Diamond" color="#9B51E0" spark icon="🏆" />
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left: Habit list */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 14 }}>Today's Habits</span>
            <span style={{ fontSize: 12, color: COLORS.muted }}>Monday, May 25</span>
          </div>
          {habits.map((h, i) => (
            <div key={i} onClick={() => setActiveHabit(i)}
              style={{ padding: "14px 20px", borderBottom: i < habits.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", cursor: "pointer", background: activeHabit === i ? h.color + "0C" : "transparent", transition: "background 0.15s", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: h.color + "22", border: `1.5px solid ${h.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: h.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{h.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Target: {h.target} · {h.streak}d streak</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: h.color }}>{h.completion}%</div>
                <div style={{ width: 60, height: 3, background: COLORS.darkBorder, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${h.completion}%`, background: h.color, borderRadius: 2, transition: "width 0.4s" }} />
                </div>
              </div>
              <div style={{ fontSize: 18, color: h.completion >= 80 ? "#27AE60" : COLORS.muted }}>
                {h.completion >= 80 ? "✓" : "○"}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Activity heatmap + social */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Activity Heatmap</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${heatmapWeeks}, 1fr)`, gap: 2 }}>
              {Array.from({length: heatmapWeeks}, (_, wi) =>
                Array.from({length: 7}, (_, di) => (
                  <div key={`${wi}-${di}`} title={`${days[wi*7+di]} completions`}
                    style={{ width: "100%", aspectRatio: "1", borderRadius: 2, background: heatColor(days[wi*7+di]), transition: "transform 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  />
                ))
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: COLORS.muted }}>Less</span>
              {[0,1,2,3,4].map(v => <div key={v} style={{ width: 9, height: 9, borderRadius: 2, background: heatColor(v) }} />)}
              <span style={{ fontSize: 10, color: COLORS.muted }}>More</span>
            </div>
          </div>

          {/* AI Insight Card */}
          <div style={{ background: `linear-gradient(135deg, ${COLORS.forge}18, ${COLORS.darkCard})`, border: `1px solid ${COLORS.forgeBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>🧠</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.forge, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Insight</span>
            </div>
            <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
              Your habit completion rate peaks on Tuesdays at 9–11 AM. The BehaviorEngine™ recommends scheduling Cold Shower before Deep Work to boost your afternoon focus score by ~23%.
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.muted }}>Powered by NGP BehaviorEngine™ · StreakPredictor 99.2% confidence</div>
          </div>

          {/* Leaderboard */}
          <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Weekly Leaderboard</div>
            {[["Alex M.", "12,840 XP", "👑"], ["Jordan K.", "11,200 XP", "🥈"], ["Sam P.", "9,650 XP", "🥉"]].map(([name, xp, medal], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 2 ? `1px solid ${COLORS.darkBorder}` : "none" }}>
                <span style={{ fontSize: 14 }}>{medal}</span>
                <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{name}</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.forge }}>{xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Architecture Tab ───────────────────────────────────────────────────────────
function ArchitectureTab() {
  const layers = [
    { label: "Edge Layer", color: "#E8400C", items: ["Cloudflare WAF", "DDoS Shield", "Bot Detection", "Rate Limiting"] },
    { label: "API Gateway", color: "#2D9CDB", items: ["REST v1/v2", "GraphQL", "WebSocket", "OpenAPI 3.0"] },
    { label: "Application", color: "#9B51E0", items: ["Django 5.1", "DRF 3.15", "Celery 5.4", "Django Channels"] },
    { label: "Data Layer", color: "#27AE60", items: ["PostgreSQL 16", "TimescaleDB", "Redis 7.x", "Elasticsearch"] },
    { label: "AI / ML", color: "#F2994A", items: ["BehaviorEngine™", "TorchServe", "MLflow", "Feature Store"] },
    { label: "Observability", color: "#56CCF2", items: ["Prometheus", "Grafana", "Jaeger", "Datadog APM"] },
  ];

  const apps = [
    { name: "users", color: "#2D9CDB", desc: "Auth, profiles, devices" },
    { name: "habits", color: "#E8400C", desc: "Core habit domain" },
    { name: "analytics", color: "#27AE60", desc: "Time-series insights" },
    { name: "social", color: "#9B51E0", desc: "Friends & challenges" },
    { name: "notifications", color: "#F2994A", desc: "Push/email/in-app" },
    { name: "gamification", color: "#56CCF2", desc: "XP, badges, leaderboard" },
    { name: "organizations", color: "#EB5757", desc: "Enterprise multi-tenancy" },
    { name: "ai_engine", color: "#F2994A", desc: "ML inference layer" },
    { name: "audit", color: "#888680", desc: "Immutable audit logs" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>System Architecture</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>v5.0 Enterprise · Defense-in-depth · Zero-trust</div>
      </div>

      {/* Version timeline */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Architecture Evolution</div>
        <div style={{ display: "flex", gap: 0, position: "relative" }}>
          <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 1, background: COLORS.darkBorder2 }} />
          {[
            { v: "v1.0", label: "Foundation", sub: "Monolith + JWT" },
            { v: "v2.0", label: "Hardening", sub: "Async + Rate limits" },
            { v: "v3.0", label: "Social AI", sub: "Kafka + ML v1" },
            { v: "v4.0", label: "Enterprise", sub: "SOC2 + K8s" },
            { v: "v5.0", label: "Hyperscale", sub: "AI-Native ★", active: true },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: item.active ? COLORS.forge : COLORS.darkBorder2, border: `2px solid ${item.active ? COLORS.forge : COLORS.darkBorder2}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: item.active ? `0 0 12px ${COLORS.forge}66` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.active ? "#fff" : COLORS.muted }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: item.active ? COLORS.forge : COLORS.muted, fontFamily: "monospace" }}>{item.v}</div>
              <div style={{ fontSize: 11, color: item.active ? COLORS.text : COLORS.muted, textAlign: "center" }}>{item.label}</div>
              <div style={{ fontSize: 10, color: COLORS.muted, textAlign: "center" }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stack layers */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
          <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 14 }}>Infrastructure Stack</span>
        </div>
        {layers.map((layer, i) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: i < layers.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: layer.color, flexShrink: 0 }} />
            <div style={{ width: 110, fontSize: 12, fontWeight: 700, color: layer.color }}>{layer.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
              {layer.items.map((it, j) => <Tag key={j} color={layer.color}>{it}</Tag>)}
            </div>
          </div>
        ))}
      </div>

      {/* Django apps grid */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Django Application Modules</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {apps.map((app, i) => (
            <div key={i} style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = app.color + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.darkBorder}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: app.color, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: COLORS.text, fontWeight: 600 }}>apps/{app.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{app.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CI/CD Pipeline */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>CI/CD Pipeline</div>
        <div style={{ display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap", rowGap: 8 }}>
          {[
            { label: "PR Push", icon: "↑" },
            { label: "Lint + Type", icon: "🔍", color: "#2D9CDB" },
            { label: "Security Scan", icon: "🔒", color: COLORS.forge },
            { label: "Tests 90%+", icon: "✓", color: "#27AE60" },
            { label: "Docker Build", icon: "🐳", color: "#2D9CDB" },
            { label: "Trivy Scan", icon: "🛡️", color: COLORS.forge },
            { label: "→ Staging", icon: "⚙", color: "#9B51E0" },
            { label: "→ Production", icon: "🚀", color: COLORS.forge },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div style={{ background: (step.color || COLORS.darkBorder2) + "22", border: `1px solid ${step.color || COLORS.darkBorder2}44`, borderRadius: 8, padding: "6px 10px", fontSize: 11, color: step.color || COLORS.muted, display: "flex", gap: 5, alignItems: "center" }}>
                <span>{step.icon}</span><span>{step.label}</span>
              </div>
              {i < arr.length - 1 && <span style={{ fontSize: 12, color: COLORS.darkBorder2, padding: "0 4px" }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── API Reference Tab ──────────────────────────────────────────────────────────
function ApiTab() {
  const [activeGroup, setActiveGroup] = useState("auth");
  const groups = {
    auth: {
      label: "Authentication", color: "#E8400C",
      endpoints: [
        { method: "POST", path: "/api/v2/auth/register/", desc: "Register a new user account", auth: false },
        { method: "POST", path: "/api/v2/auth/login/", desc: "Obtain JWT access + refresh tokens", auth: false },
        { method: "POST", path: "/api/v2/auth/token/refresh/", desc: "Rotate JWT refresh token (family tracking)", auth: false },
        { method: "POST", path: "/api/v2/auth/mfa/verify/", desc: "Verify TOTP or FIDO2 MFA challenge", auth: true },
        { method: "POST", path: "/api/v2/auth/logout/", desc: "Revoke token family", auth: true },
      ]
    },
    habits: {
      label: "Habits", color: "#27AE60",
      endpoints: [
        { method: "GET",    path: "/api/v2/habits/", desc: "List all habits for authenticated user", auth: true },
        { method: "POST",   path: "/api/v2/habits/", desc: "Create a new habit", auth: true },
        { method: "GET",    path: "/api/v2/habits/{id}/", desc: "Retrieve a single habit", auth: true },
        { method: "PUT",    path: "/api/v2/habits/{id}/", desc: "Update a habit", auth: true },
        { method: "DELETE", path: "/api/v2/habits/{id}/", desc: "Soft-delete a habit", auth: true },
        { method: "POST",   path: "/api/v2/habits/{id}/complete/", desc: "Mark a habit as complete for today", auth: true },
        { method: "GET",    path: "/api/v2/habits/{id}/streak/", desc: "Get current and longest streak", auth: true },
        { method: "GET",    path: "/api/v2/habits/{id}/history/", desc: "Paginated completion history", auth: true },
      ]
    },
    analytics: {
      label: "Analytics", color: "#2D9CDB",
      endpoints: [
        { method: "GET", path: "/api/v2/analytics/dashboard/", desc: "Aggregated user dashboard metrics", auth: true },
        { method: "GET", path: "/api/v2/analytics/heatmap/", desc: "Calendar heatmap data (TimescaleDB)", auth: true },
        { method: "GET", path: "/api/v2/analytics/insights/", desc: "AI-generated behavioral insights", auth: true },
        { method: "GET", path: "/api/v2/analytics/export/", desc: "GDPR data export (JSON + CSV)", auth: true },
      ]
    },
    social: {
      label: "Social", color: "#9B51E0",
      endpoints: [
        { method: "GET",  path: "/api/v2/social/feed/", desc: "Ranked social feed (ML-scored)", auth: true },
        { method: "GET",  path: "/api/v2/social/friends/", desc: "Friend list", auth: true },
        { method: "POST", path: "/api/v2/social/friends/invite/", desc: "Send friend invitation", auth: true },
        { method: "GET",  path: "/api/v2/social/challenges/", desc: "Active group challenges", auth: true },
        { method: "POST", path: "/api/v2/social/challenges/", desc: "Create a group challenge", auth: true },
      ]
    },
    users: {
      label: "Users / GDPR", color: "#F2994A",
      endpoints: [
        { method: "GET",    path: "/api/v2/users/me/", desc: "Get current user profile", auth: true },
        { method: "PUT",    path: "/api/v2/users/me/", desc: "Update profile fields", auth: true },
        { method: "DELETE", path: "/api/v2/users/me/", desc: "Right to erasure — schedule deletion", auth: true },
        { method: "GET",    path: "/api/v2/users/me/export/", desc: "GDPR data portability export", auth: true },
        { method: "GET",    path: "/api/v2/users/me/audit-log/", desc: "Personal audit trail (read-only)", auth: true },
      ]
    },
  };

  const methodColor = { GET: "#27AE60", POST: "#2D9CDB", PUT: "#F2994A", DELETE: "#EB5757", PATCH: "#9B51E0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>API Reference</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>REST v2 · GraphQL · WebSocket · OpenAPI 3.0</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["api/docs/", "api/redoc/", "graphql/"].map((url, i) => (
            <div key={i} style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.muted, background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 6, padding: "4px 10px" }}>
              /{url}
            </div>
          ))}
        </div>
      </div>

      {/* Base URL card */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>Base URL</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: COLORS.forge }}>https://api.ngp-habitforge.com</div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Sidebar */}
        <div style={{ width: 160, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.entries(groups).map(([key, group]) => (
            <button key={key} onClick={() => setActiveGroup(key)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 600, background: activeGroup === key ? group.color + "22" : "transparent", color: activeGroup === key ? group.color : COLORS.muted, transition: "all 0.15s", borderLeft: `3px solid ${activeGroup === key ? group.color : "transparent"}` }}>
              {group.label}
            </button>
          ))}
        </div>

        {/* Endpoint list */}
        <div style={{ flex: 1, background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: groups[activeGroup].color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: groups[activeGroup].color }}>{groups[activeGroup].label}</span>
          </div>
          {groups[activeGroup].endpoints.map((ep, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < groups[activeGroup].endpoints.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 12, alignItems: "flex-start" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFFFFF08"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "monospace", padding: "2px 7px", borderRadius: 4, background: methodColor[ep.method] + "22", color: methodColor[ep.method], minWidth: 48, textAlign: "center", marginTop: 2, letterSpacing: "0.05em" }}>{ep.method}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.text }}>{ep.path}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>{ep.desc}</div>
              </div>
              {ep.auth && <span style={{ fontSize: 10, color: "#F2994A", background: "#F2994A18", border: "1px solid #F2994A33", borderRadius: 4, padding: "1px 6px", marginTop: 2, whiteSpace: "nowrap" }}>🔐 JWT</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Response envelope */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Standard Response Envelope</span>
        </div>
        <pre style={{ margin: 0, padding: "16px 20px", fontFamily: "monospace", fontSize: 12, color: COLORS.textDim, overflowX: "auto", lineHeight: 1.7 }}>
{`{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_01J2X...",
    "timestamp": "2025-05-25T10:30:00Z",
    "version":   "2.1.0"
  },
  "pagination": {
    "count":    100,
    "next":     "https://api.ngp-habitforge.com/api/v2/habits/?cursor=...",
    "previous": null
  }
}`}
        </pre>
      </div>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────────
function SecurityTab() {
  const layers = [
    { n: 1, label: "Network Edge", color: "#E8400C", items: ["Cloudflare WAF", "DDoS mitigation", "Bot detection", "CDN rate limiting"] },
    { n: 2, label: "Transport", color: "#F2994A", items: ["TLS 1.3 only", "HSTS preload", "mTLS (Istio)", "Certificate pinning"] },
    { n: 3, label: "Application Entry", color: "#27AE60", items: ["Nginx ingress", "IP reputation", "Geo-blocking", "WAF rules"] },
    { n: 4, label: "Auth & Session", color: "#2D9CDB", items: ["JWT family rotation", "MFA TOTP+FIDO2", "OAuth2 / SAML", "Brute-force lockout"] },
    { n: 5, label: "Authorization", color: "#9B51E0", items: ["RBAC", "DRF permissions", "Row-level security", "Tenant isolation"] },
    { n: 6, label: "Application", color: "#56CCF2", items: ["Input sanitization", "CSP / CORS", "CSRF protection", "Secret scanning"] },
    { n: 7, label: "Data", color: "#EB5757", items: ["AES-256 at rest", "Field-level PII encryption", "Vault key rotation", "Encrypted backups"] },
  ];

  const tools = [
    { stage: "Pre-commit", tool: "gitleaks + detect-secrets", catches: "Secret leakage" },
    { stage: "PR/Push", tool: "bandit", catches: "Python security bugs" },
    { stage: "PR/Push", tool: "safety", catches: "Vulnerable dependencies" },
    { stage: "PR/Push", tool: "SonarQube", catches: "Code quality + security" },
    { stage: "Build", tool: "Trivy", catches: "Container CVEs" },
    { stage: "Build", tool: "Snyk", catches: "Dependency + IaC vulns" },
    { stage: "Nightly", tool: "Nuclei", catches: "DAST scanning" },
    { stage: "Nightly", tool: "OWASP ZAP", catches: "API security testing" },
    { stage: "Release", tool: "SBOM generation", catches: "Supply chain visibility" },
  ];

  const compliance = [
    { std: "GDPR", status: "✅", note: "Full data subject rights" },
    { std: "CCPA", status: "✅", note: "Opt-out + data sale prevention" },
    { std: "SOC 2 Type II", status: "✅", note: "Annual audit" },
    { std: "ISO 27001", status: "🔄", note: "Gap assessment complete" },
    { std: "HIPAA", status: "✅", note: "Enterprise wellness ready" },
    { std: "WCAG 2.1 AA", status: "✅", note: "Accessibility audit passed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Security Architecture</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Defense in Depth · Zero-trust · Bug Bounty Live</div>
      </div>

      {/* 7-layer fortress */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
          <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 14 }}>Defense in Depth — 7 Layers</span>
        </div>
        {layers.map((layer, i) => (
          <div key={i} style={{ padding: "11px 20px", borderBottom: i < layers.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: layer.color + "22", border: `1px solid ${layer.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: layer.color, flexShrink: 0 }}>{layer.n}</div>
            <div style={{ width: 120, fontSize: 12, fontWeight: 700, color: layer.color }}>{layer.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {layer.items.map((it, j) => <Tag key={j} color={layer.color}>{it}</Tag>)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* CI/CD Security tools */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
            <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 13 }}>Security Tooling in CI/CD</span>
          </div>
          {tools.map((t, i) => (
            <div key={i} style={{ padding: "9px 16px", borderBottom: i < tools.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Tag color={COLORS.muted}>{t.stage}</Tag>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: COLORS.text }}>{t.tool}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{t.catches}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
            <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 13 }}>Compliance & Certifications</span>
          </div>
          {compliance.map((c, i) => (
            <div key={i} style={{ padding: "11px 16px", borderBottom: i < compliance.length-1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{c.status}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{c.std}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{c.note}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.darkBorder}`, background: COLORS.forgeDim }}>
            <div style={{ fontSize: 11, color: COLORS.forge }}>🔴 Bug Bounty Live on HackerOne · Rewards: $100–$50,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Engine Tab ──────────────────────────────────────────────────────────────
function AITab() {
  const [selected, setSelected] = useState(0);
  const models = [
    { name: "HabitRecommender", tech: "Collaborative filtering + Transformer", purpose: "Suggest new habits based on behavioral profile", color: "#E8400C", accuracy: 91 },
    { name: "SmartScheduler", tech: "Reinforcement Learning (Contextual Bandit)", purpose: "Learn optimal reminder timing per user", color: "#2D9CDB", accuracy: 87 },
    { name: "StreakPredictor", tech: "LSTM Time-series", purpose: "Forecast at-risk habits before they break", color: "#27AE60", accuracy: 94 },
    { name: "ChurnPredictor", tech: "XGBoost Gradient Boosting", purpose: "Identify users likely to disengage", color: "#9B51E0", accuracy: 88 },
    { name: "JournalAnalyzer", tech: "Fine-tuned BERT", purpose: "Sentiment + topic extraction from notes", color: "#F2994A", accuracy: 89 },
    { name: "AnomalyDetector", tech: "Isolation Forest", purpose: "Flag unusual login and behavioral patterns", color: "#56CCF2", accuracy: 96 },
    { name: "VisionVerifier", tech: "ResNet-based Classifier", purpose: "Verify photo-based habit check-ins", color: "#EB5757", accuracy: 83 },
  ];

  const perf = [
    { label: "API P50 Latency", target: "< 50ms", achieved: "32ms", pct: 100 },
    { label: "API P95 Latency", target: "< 200ms", achieved: "148ms", pct: 90 },
    { label: "API P99 Latency", target: "< 500ms", achieved: "387ms", pct: 85 },
    { label: "Throughput", target: "10k RPS", achieved: "14.2k RPS", pct: 100 },
    { label: "Uptime SLA", target: "99.9%", achieved: "99.97%", pct: 100 },
    { label: "WS Connections", target: "500k", achieved: "620k", pct: 100 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>NGP BehaviorEngine™</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>AI-native · Transformer-based · Real-time inference</div>
      </div>

      {/* Model selector + detail */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {models.map((m, i) => (
            <button key={i} onClick={() => setSelected(i)}
              style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${selected === i ? m.color + "55" : COLORS.darkBorder}`, cursor: "pointer", textAlign: "left", background: selected === i ? m.color + "18" : COLORS.darkCard, transition: "all 0.15s" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: selected === i ? m.color : COLORS.text }}>{m.name}</div>
            </button>
          ))}
        </div>

        <div style={{ background: COLORS.darkCard, border: `1px solid ${models[selected].color}44`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: models[selected].color }}>{models[selected].name}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{models[selected].purpose}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: models[selected].color }}>{models[selected].accuracy}%</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>Accuracy</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Technology</div>
            <Tag color={models[selected].color}>{models[selected].tech}</Tag>
          </div>

          <div style={{ height: 1, background: COLORS.darkBorder }} />

          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>ML Infrastructure</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["Model Serving", "TorchServe / ONNX Runtime"], ["Feature Store", "Redis (RT) + S3 (historical)"], ["Model Registry", "MLflow"], ["Explainability", "SHAP values"], ["A/B Testing", "Built-in framework"], ["Training Data", "Anonymized + aggregated"]].map(([k, v], i) => (
                <div key={i} style={{ background: "#FFFFFF06", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                  <div style={{ fontSize: 11, color: COLORS.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance benchmarks */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>v5.0 Production Benchmarks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {perf.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 140, fontSize: 12, color: COLORS.textDim }}>{p.label}</div>
              <div style={{ flex: 1, height: 6, background: COLORS.darkBorder2, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p.pct}%`, background: COLORS.forge, borderRadius: 3 }} />
              </div>
              <div style={{ width: 70, textAlign: "right", fontSize: 12, fontFamily: "monospace", color: COLORS.forge, fontWeight: 700 }}>{p.achieved}</div>
              <Tag color={COLORS.muted}>{p.target}</Tag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Team Tab ───────────────────────────────────────────────────────────────────
function TeamTab() {
  const team = [
    { role: "CTO", name: "Platform Architecture", icon: "🏗️", color: "#E8400C", desc: "Technical strategy, system design, architectural decisions" },
    { role: "Head of Backend", name: "Django / DRF Core", icon: "🐍", color: "#27AE60", desc: "API design, database modeling, async infrastructure" },
    { role: "Head of Mobile", name: "Flutter iOS + Android", icon: "📱", color: "#2D9CDB", desc: "Cross-platform mobile, offline-first, biometric auth" },
    { role: "Head of ML", name: "BehaviorEngine™", icon: "🧠", color: "#F2994A", desc: "Data science, model training, ML infrastructure" },
    { role: "Head of Security", name: "Zero-trust Architecture", icon: "🔐", color: "#EB5757", desc: "Security arch, SOC2 compliance, bug bounty program" },
    { role: "Head of DevOps", name: "Infrastructure & SRE", icon: "⚙️", color: "#56CCF2", desc: "K8s, CI/CD, Terraform, 99.97% uptime SLA" },
    { role: "Head of Frontend", name: "Next.js Web Platform", icon: "🌐", color: "#9B51E0", desc: "TypeScript, Radix UI, analytics dashboards, i18n" },
    { role: "Head of Product", name: "Roadmap & Features", icon: "🗺️", color: "#F2994A", desc: "Roadmap, feature prioritization, user research" },
    { role: "DPO", name: "Data Protection Officer", icon: "🛡️", color: "#27AE60", desc: "GDPR compliance, data subject rights, privacy policy" },
  ];

  const stack_highlights = [
    { cat: "Backend", items: ["Python 3.12", "Django 5.1", "DRF 3.15", "Celery 5.4", "Strawberry GraphQL"] },
    { cat: "Database", items: ["PostgreSQL 16", "TimescaleDB 2.x", "Redis 7.x", "Elasticsearch 8.x"] },
    { cat: "Mobile", items: ["Flutter 3.x", "Dart 3.x", "Riverpod 2.x", "Firebase FCM/APNs"] },
    { cat: "Frontend", items: ["Next.js 14", "TypeScript 5.x", "Radix UI", "Recharts + D3.js"] },
    { cat: "Infra", items: ["Kubernetes EKS", "Terraform", "ArgoCD", "Istio", "Cloudflare"] },
    { cat: "Observability", items: ["Prometheus", "Grafana", "Jaeger", "Datadog", "OpenTelemetry"] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>NGP Team & Stack</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Next Generation Platform · Building behavioral infrastructure</div>
      </div>

      {/* Team grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {team.map((member, i) => (
          <div key={i} style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8, transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = member.color + "55"}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.darkBorder}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: member.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{member.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: member.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{member.role}</div>
                <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>{member.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>{member.desc}</div>
          </div>
        ))}
      </div>

      {/* Full tech stack */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>Complete Technology Stack</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stack_highlights.map((cat, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{cat.cat}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {cat.items.map((item, j) => (
                  <div key={j} style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.textDim, padding: "3px 0", borderBottom: j < cat.items.length-1 ? `1px solid ${COLORS.darkBorder}` : "none" }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor row */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: "14px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Technology Partners</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["AWS", "Cloudflare", "HashiCorp", "Datadog", "SendGrid", "Firebase", "HackerOne", "Stripe", "Sentry"].map((p, i) => (
            <div key={i} style={{ background: "#FFFFFF08", border: `1px solid ${COLORS.darkBorder}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}>{p}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Database Tab ───────────────────────────────────────────────────────────────
function DatabaseTab() {
  const [activeModel, setActiveModel] = useState("CustomUser");

  const models = {
    CustomUser: {
      color: "#2D9CDB",
      table: "users_customuser",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "email", type: "VARCHAR(254)", unique: true },
        { name: "username", type: "VARCHAR(150)", unique: true },
        { name: "is_verified", type: "BOOLEAN", default: "false" },
        { name: "mfa_enabled", type: "BOOLEAN", default: "false" },
        { name: "date_joined", type: "TIMESTAMPTZ" },
        { name: "last_login_ip", type: "VARCHAR(255) (encrypted)" },
        { name: "failed_login_count", type: "SMALLINT", default: "0" },
      ],
      relations: ["UserProfile (1→1)", "UserDevice (1→N)", "RefreshTokenFamily (1→N)", "Habit (1→N)", "AuditLog (1→N)"],
    },
    Habit: {
      color: "#E8400C",
      table: "habits_habit",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "user", type: "FK → CustomUser" },
        { name: "title", type: "VARCHAR(200)" },
        { name: "description", type: "TEXT", nullable: true },
        { name: "category", type: "FK → HabitCategory" },
        { name: "habit_type", type: "ENUM(BINARY|MEASURABLE|TIME_BASED)" },
        { name: "target_value", type: "DECIMAL(10,2)", nullable: true },
        { name: "target_unit", type: "VARCHAR(50)", nullable: true },
        { name: "frequency_type", type: "ENUM(DAILY|WEEKLY|CUSTOM)" },
        { name: "frequency_days", type: "JSONB" },
        { name: "is_public", type: "BOOLEAN", default: "false" },
        { name: "is_archived", type: "BOOLEAN", default: "false" },
        { name: "created_at", type: "TIMESTAMPTZ" },
        { name: "updated_at", type: "TIMESTAMPTZ" },
        { name: "deleted_at", type: "TIMESTAMPTZ (soft delete)", nullable: true },
      ],
      relations: ["HabitCompletion (1→N)", "HabitStreak (1→1)", "HabitReminder (1→N)"],
    },
    HabitCompletion: {
      color: "#27AE60",
      table: "habits_habitcompletion",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "habit", type: "FK → Habit" },
        { name: "completed_at", type: "TIMESTAMPTZ" },
        { name: "value", type: "DECIMAL(10,2)", nullable: true },
        { name: "note", type: "TEXT", nullable: true },
        { name: "verified_by", type: "ENUM(SELF|AI_VISION|PEER)", nullable: true },
      ],
      relations: ["TimescaleDB hypertable on completed_at"],
    },
    AuditLog: {
      color: "#888680",
      table: "audit_auditlog",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "actor", type: "FK → CustomUser" },
        { name: "action", type: "VARCHAR(100)" },
        { name: "resource_type", type: "VARCHAR(100)" },
        { name: "resource_id", type: "UUID" },
        { name: "old_value", type: "JSONB", nullable: true },
        { name: "new_value", type: "JSONB", nullable: true },
        { name: "ip_address", type: "VARCHAR(255) (encrypted)" },
        { name: "user_agent", type: "TEXT" },
        { name: "timestamp", type: "TIMESTAMPTZ" },
      ],
      relations: ["INSERT-ONLY — no UPDATE or DELETE permitted"],
    },
    GroupChallenge: {
      color: "#9B51E0",
      table: "social_groupchallenge",
      fields: [
        { name: "id", type: "UUID", pk: true },
        { name: "title", type: "VARCHAR(200)" },
        { name: "habit_template", type: "FK → HabitTemplate" },
        { name: "start_date", type: "DATE" },
        { name: "end_date", type: "DATE" },
        { name: "privacy", type: "ENUM(PUBLIC|FRIENDS|INVITE)" },
        { name: "max_participants", type: "SMALLINT" },
        { name: "created_by", type: "FK → CustomUser" },
      ],
      relations: ["ChallengeParticipant (1→N)", "SocialFeedItem (1→N)"],
    },
    AnalyticsEvent: {
      color: "#56CCF2",
      table: "analytics_analyticsevent",
      fields: [
        { name: "user", type: "FK → CustomUser" },
        { name: "event_type", type: "VARCHAR(80)" },
        { name: "payload", type: "JSONB" },
        { name: "ts", type: "TIMESTAMPTZ (partition key)" },
      ],
      relations: ["TimescaleDB hypertable — partitioned by ts (1-month chunks)", "Continuous aggregate views for dashboards"],
    },
  };

  const activeM = models[activeModel];

  const relationships = [
    { from: "CustomUser", to: "Habit", label: "1 → N", color: "#E8400C" },
    { from: "CustomUser", to: "AuditLog", label: "1 → N", color: "#888680" },
    { from: "Habit", to: "HabitCompletion", label: "1 → N", color: "#27AE60" },
    { from: "CustomUser", to: "GroupChallenge", label: "1 → N", color: "#9B51E0" },
    { from: "CustomUser", to: "AnalyticsEvent", label: "1 → N", color: "#56CCF2" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Database Schema</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>PostgreSQL 16 + TimescaleDB · UUID primary keys · Soft deletes</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <StatusBadge label="PgBouncer" color="#27AE60" />
          <StatusBadge label="Read Replicas" color="#2D9CDB" />
          <StatusBadge label="Row-level Security" color="#E8400C" />
        </div>
      </div>

      {/* Visual relationship map */}
      <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Entity Relationship Map</div>
        <div style={{ position: "relative", height: 220 }}>
          {/* Central node */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: "#2D9CDB22", border: `2px solid #2D9CDB66`, borderRadius: 12, padding: "12px 20px", textAlign: "center", zIndex: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#2D9CDB" }}>CustomUser</div>
            <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>users_customuser</div>
          </div>
          {/* Satellite nodes */}
          {[
            { model: "Habit", x: "12%", y: "8%", color: "#E8400C", label: "habits_habit", rel: "1→N" },
            { model: "HabitCompletion", x: "0%", y: "55%", color: "#27AE60", label: "via Habit", rel: "1→N→N" },
            { model: "AuditLog", x: "72%", y: "8%", color: "#888680", label: "audit_auditlog", rel: "1→N" },
            { model: "GroupChallenge", x: "72%", y: "65%", color: "#9B51E0", label: "social_group...", rel: "1→N" },
            { model: "AnalyticsEvent", x: "30%", y: "78%", color: "#56CCF2", label: "analytics_event", rel: "1→N" },
          ].map((node, i) => (
            <div key={i} onClick={() => setActiveModel(node.model)}
              style={{ position: "absolute", left: node.x, top: node.y, background: node.color + "18", border: `1.5px solid ${node.color}55`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", transition: "all 0.15s", zIndex: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = node.color + "30"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = node.color + "18"; e.currentTarget.style.transform = "scale(1)"; }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: node.color }}>{node.model}</div>
              <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "monospace" }}>{node.label}</div>
              <div style={{ fontSize: 9, color: node.color, marginTop: 2 }}>{node.rel}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, textAlign: "center" }}>Click any entity to inspect its fields below</div>
      </div>

      {/* Detail view */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14 }}>
        {/* Model selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.keys(models).map(m => (
            <button key={m} onClick={() => setActiveModel(m)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${activeModel === m ? models[m].color + "55" : COLORS.darkBorder}`, cursor: "pointer", textAlign: "left", background: activeModel === m ? models[m].color + "18" : COLORS.darkCard, fontSize: 11, fontWeight: 700, color: activeModel === m ? models[m].color : COLORS.textDim, transition: "all 0.15s", fontFamily: "monospace" }}>
              {m}
            </button>
          ))}
        </div>

        {/* Field table */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${activeM.color}44`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: activeM.color }}>{activeModel}</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.muted, marginLeft: 10 }}>{activeM.table}</span>
            </div>
            <Tag color={activeM.color}>{activeM.fields.length} fields</Tag>
          </div>
          {/* Field rows */}
          {activeM.fields.map((f, i) => (
            <div key={i} style={{ padding: "9px 16px", borderBottom: i < activeM.fields.length - 1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: f.pk ? activeM.color : (f.nullable ? COLORS.darkBorder2 : COLORS.muted), flexShrink: 0 }} />
              <div style={{ width: 170, fontFamily: "monospace", fontSize: 12, color: f.pk ? activeM.color : COLORS.text, fontWeight: f.pk ? 700 : 400 }}>{f.name}</div>
              <div style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: COLORS.muted }}>{f.type}</div>
              {f.pk && <Tag color={activeM.color}>PK</Tag>}
              {f.unique && <Tag color="#F2994A">UNIQUE</Tag>}
              {f.default !== undefined && <Tag color={COLORS.muted}>default: {f.default}</Tag>}
              {f.nullable && <Tag color={COLORS.muted}>nullable</Tag>}
            </div>
          ))}
          {/* Relations */}
          <div style={{ padding: "12px 16px", background: activeM.color + "0A", borderTop: `1px solid ${COLORS.darkBorder}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Relations & Notes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {activeM.relations.map((r, i) => <Tag key={i} color={activeM.color}>{r}</Tag>)}
            </div>
          </div>
        </div>
      </div>

      {/* DB config panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: "Primary DB", items: ["PostgreSQL 16", "EBS gp3 SSD", "Multi-AZ RDS", "Point-in-time recovery", "PgBouncer pooling"] },
          { label: "Read Replicas", items: ["2× streaming replicas", "Analytics queries routed", "Read-your-writes guarantee", "Replication lag < 50ms"] },
          { label: "TimescaleDB", items: ["Hypertables on ts columns", "1-month chunk interval", "Continuous aggregates", "Compression after 7 days", "Retention: 2 years"] },
        ].map((section, i) => (
          <div key={i} style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {section.items.map((it, j) => (
                <div key={j} style={{ fontSize: 11, color: COLORS.textDim, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: COLORS.forge, flexShrink: 0 }}>·</span>{it}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
  const [filter, setFilter] = useState("all");
  const [liveCount, setLiveCount] = useState(0);
  const [wsLog, setWsLog] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const intervalRef = useRef(null);

  const wsEvents = [
    { type: "streak_risk", msg: "Morning Run streak at risk — complete before midnight", icon: "🔥", color: "#E8400C" },
    { type: "friend_activity", msg: "Jordan completed Deep Work · 3h ago", icon: "👥", color: "#9B51E0" },
    { type: "milestone", msg: "🏆 Achievement unlocked: Iron Will (60-day streak)", icon: "🏆", color: "#F2994A" },
    { type: "ai_insight", msg: "BehaviorEngine™: Your optimal reminder window opens in 15 min", icon: "🧠", color: "#2D9CDB" },
    { type: "challenge", msg: "Team Sigma accepted your 30-day challenge!", icon: "⚡", color: "#27AE60" },
    { type: "leaderboard", msg: "You moved to #1 on the weekly leaderboard!", icon: "📊", color: "#56CCF2" },
  ];

  const notifications = [
    { id: 1, type: "milestone", title: "Iron Will Achievement", body: "You've completed 60 days in a row for Meditation. This is extraordinary.", time: "2m ago", read: false, channel: "push", icon: "🏆", color: "#F2994A" },
    { id: 2, type: "streak_risk", title: "Streak Alert: Cold Shower", body: "You haven't completed today's Cold Shower habit. Only 4 hours remain.", time: "1h ago", read: false, channel: "push", icon: "🔥", color: "#E8400C" },
    { id: 3, type: "ai_insight", title: "Weekly Insight Ready", body: "BehaviorEngine™ has generated your week-12 behavioral pattern report.", time: "3h ago", read: false, channel: "email", icon: "🧠", color: "#2D9CDB" },
    { id: 4, type: "social", title: "Jordan K. challenged you", body: "30-day Deep Work challenge. Accept before Sunday.", time: "5h ago", read: true, channel: "push", icon: "👥", color: "#9B51E0" },
    { id: 5, type: "system", title: "Scheduled Maintenance", body: "Brief 2-minute maintenance window at 03:00 UTC on Saturday.", time: "Yesterday", read: true, channel: "email", icon: "⚙️", color: COLORS.muted },
    { id: 6, type: "milestone", title: "Weekly Digest", body: "You completed 43/48 habits this week. Completion rate: 89.6%. Full report inside.", time: "2d ago", read: true, channel: "email", icon: "📊", color: "#27AE60" },
  ];

  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read);

  const toggleWs = () => {
    if (wsConnected) {
      clearInterval(intervalRef.current);
      setWsConnected(false);
      setWsLog(prev => [{ type: "system", msg: "WebSocket disconnected", time: new Date().toLocaleTimeString(), color: COLORS.muted }, ...prev]);
    } else {
      setWsConnected(true);
      setWsLog(prev => [{ type: "system", msg: "WebSocket connected to wss://api.ngp-habitforge.com/ws/notifications/", time: new Date().toLocaleTimeString(), color: "#27AE60" }, ...prev]);
      let idx = 0;
      intervalRef.current = setInterval(() => {
        const ev = wsEvents[idx % wsEvents.length];
        idx++;
        setLiveCount(c => c + 1);
        setWsLog(prev => [{ ...ev, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
      }, 2200);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const channels = [
    { label: "Push (FCM/APNs)", icon: "📱", enabled: true, color: "#E8400C" },
    { label: "Email (SendGrid)", icon: "📧", enabled: true, color: "#2D9CDB" },
    { label: "In-app Feed", icon: "🔔", enabled: true, color: "#27AE60" },
    { label: "SMS", icon: "💬", enabled: false, color: COLORS.muted },
    { label: "Webhook", icon: "🔗", enabled: false, color: COLORS.muted },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Notification Center</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Push · Email · In-app · WebSocket real-time</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {notifications.filter(n => !n.read).length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.forge, background: COLORS.forgeDim, border: `1px solid ${COLORS.forgeBorder}`, borderRadius: 6, padding: "3px 10px" }}>
              {notifications.filter(n => !n.read).length} unread
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left: Notification list */}
        <div>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["all", "unread"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filter === f ? COLORS.forge : COLORS.darkBorder}`, background: filter === f ? COLORS.forgeDim : "transparent", color: filter === f ? COLORS.forge : COLORS.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
            {filtered.map((n, i) => (
              <div key={n.id} style={{ padding: "14px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 12, alignItems: "flex-start", background: !n.read ? n.color + "06" : "transparent", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = n.color + "10"}
                onMouseLeave={e => e.currentTarget.style.background = !n.read ? n.color + "06" : "transparent"}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: n.color + "22", border: `1px solid ${n.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: n.read ? COLORS.textDim : COLORS.text }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0 }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <Tag color={n.color}>{n.channel}</Tag>
                    <Tag color={n.color}>{n.type}</Tag>
                    {!n.read && <Tag color={COLORS.forge}>new</Tag>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Live WebSocket feed */}
          <div style={{ background: COLORS.darkCard, border: `1px solid ${wsConnected ? "#27AE60" : COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.3s" }}>
            <div style={{ padding: "11px 14px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: wsConnected ? "#27AE60" : COLORS.darkBorder2, boxShadow: wsConnected ? "0 0 6px #27AE60" : "none", transition: "all 0.3s" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>WebSocket Feed</span>
                {liveCount > 0 && <Tag color="#27AE60">+{liveCount} events</Tag>}
              </div>
              <button onClick={toggleWs}
                style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${wsConnected ? "#EB5757" : "#27AE60"}`, background: "transparent", color: wsConnected ? "#EB5757" : "#27AE60", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {wsConnected ? "Disconnect" : "Connect"}
              </button>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, maxHeight: 200, overflowY: "auto", padding: "8px 0" }}>
              {wsLog.length === 0 && (
                <div style={{ padding: "12px 14px", color: COLORS.muted, fontSize: 11 }}>Connect to simulate real-time events…</div>
              )}
              {wsLog.map((log, i) => (
                <div key={i} style={{ padding: "4px 14px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: COLORS.muted, flexShrink: 0 }}>{log.time}</span>
                  {log.icon && <span>{log.icon}</span>}
                  <span style={{ color: log.color || COLORS.textDim, lineHeight: 1.4 }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel preferences */}
          <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>Channel Preferences</span>
            </div>
            {channels.map((ch, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < channels.length - 1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>{ch.icon}</span>
                <span style={{ flex: 1, fontSize: 12, color: ch.enabled ? COLORS.text : COLORS.muted }}>{ch.label}</span>
                <div style={{ width: 32, height: 18, borderRadius: 9, background: ch.enabled ? COLORS.forge : COLORS.darkBorder2, position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, left: ch.enabled ? 17 : 3, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* ML Scheduler info */}
          <div style={{ background: `linear-gradient(135deg, ${COLORS.forge}14, ${COLORS.darkCard})`, border: `1px solid ${COLORS.forgeBorder}`, borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.forge, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>SmartScheduler™</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6 }}>
              Reinforcement learning (contextual bandit) learns your optimal reminder windows. Currently predicting <span style={{ color: COLORS.forge }}>9:15 AM</span> as your highest-engagement slot (87% open rate).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── API Playground Tab ─────────────────────────────────────────────────────────
function PlaygroundTab() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v2/habits/");
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  const [body, setBody] = useState('{\n  "title": "Morning Run",\n  "habit_type": "MEASURABLE",\n  "target_value": 5,\n  "target_unit": "km",\n  "frequency_type": "DAILY"\n}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(null);
  const [historyLog, setHistoryLog] = useState([]);

  const presets = [
    { label: "List Habits", method: "GET", path: "/api/v2/habits/", body: "" },
    { label: "Create Habit", method: "POST", path: "/api/v2/habits/", body: '{\n  "title": "Morning Run",\n  "habit_type": "MEASURABLE",\n  "target_value": 5,\n  "target_unit": "km",\n  "frequency_type": "DAILY"\n}' },
    { label: "Dashboard", method: "GET", path: "/api/v2/analytics/dashboard/", body: "" },
    { label: "Social Feed", method: "GET", path: "/api/v2/social/feed/", body: "" },
    { label: "AI Insights", method: "GET", path: "/api/v2/analytics/insights/", body: "" },
    { label: "Me (GDPR)", method: "GET", path: "/api/v2/users/me/", body: "" },
  ];

  const mockResponses = {
    "GET /api/v2/habits/": { success: true, data: [{ id: "a1b2c3d4-...", title: "Morning Run", habit_type: "MEASURABLE", target_value: 5, target_unit: "km", frequency_type: "DAILY", streak: { current: 47, longest: 62 }, completion_rate: 0.94 }, { id: "e5f6a7b8-...", title: "Meditation", habit_type: "TIME_BASED", target_value: 20, target_unit: "min", frequency_type: "DAILY", streak: { current: 62, longest: 62 }, completion_rate: 0.98 }], meta: { request_id: "req_01JXKA82P", timestamp: new Date().toISOString(), version: "2.1.0" }, pagination: { count: 12, next: "/api/v2/habits/?cursor=abc123", previous: null } },
    "POST /api/v2/habits/": { success: true, data: { id: "f9e8d7c6-b5a4-3210-fedc-ba9876543210", title: "Morning Run", habit_type: "MEASURABLE", target_value: 5, target_unit: "km", frequency_type: "DAILY", is_public: false, created_at: new Date().toISOString() }, meta: { request_id: "req_01JXKB93Q", timestamp: new Date().toISOString(), version: "2.1.0" } },
    "GET /api/v2/analytics/dashboard/": { success: true, data: { total_habits: 12, active_streaks: 7, best_streak: { habit: "Meditation", days: 62 }, completion_rate_7d: 0.876, completion_rate_30d: 0.841, xp_this_week: 2840, rank: "Diamond", ai_score: 91.4 }, meta: { request_id: "req_01JXKC04R", timestamp: new Date().toISOString(), version: "2.1.0" } },
    "GET /api/v2/social/feed/": { success: true, data: [{ id: "feed_01", type: "completion", user: { username: "jordan_k", avatar: null }, habit: "Deep Work", value: 2.1, unit: "hr", liked: false, reaction_count: 4, timestamp: new Date(Date.now() - 180 * 60000).toISOString() }], meta: { request_id: "req_01JXKD15S", timestamp: new Date().toISOString(), version: "2.1.0" } },
    "GET /api/v2/analytics/insights/": { success: true, data: [{ type: "smart_timing", title: "Optimal reminder window", body: "Your completion rate is 34% higher when you receive reminders at 9:15 AM", confidence: 0.89 }, { type: "streak_risk", title: "Cold Shower at risk", body: "Based on your pattern, you have a 67% chance of breaking your streak today without a prompt", confidence: 0.92 }], meta: { request_id: "req_01JXKE26T", timestamp: new Date().toISOString(), version: "2.1.0" } },
    "GET /api/v2/users/me/": { success: true, data: { id: "usr_01JXKF37U", email: "alex@example.com", username: "alex_m", is_verified: true, mfa_enabled: true, profile: { timezone: "America/New_York", locale: "en-US", onboarding_complete: true }, gdpr: { export_available: true, deletion_requested: false } }, meta: { request_id: "req_01JXKG48V", timestamp: new Date().toISOString(), version: "2.1.0" } },
  };

  const fireRequest = () => {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    const mockDelay = 28 + Math.floor(Math.random() * 80);
    setTimeout(() => {
      const key = `${method} ${path}`;
      const res = mockResponses[key] || { success: false, error: { code: "NOT_FOUND", message: `No mock response for ${method} ${path}` }, meta: { request_id: "req_mock_404", timestamp: new Date().toISOString() } };
      const ms = Date.now() - start;
      setLatency(ms);
      setResponse(res);
      setLoading(false);
      setHistoryLog(prev => [{ method, path, status: res.success ? 200 : 404, ms, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    }, mockDelay);
  };

  const methodColor = { GET: "#27AE60", POST: "#2D9CDB", PUT: "#F2994A", DELETE: "#EB5757", PATCH: "#9B51E0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>API Playground</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Simulated REST v2 sandbox · No real requests sent</div>
      </div>

      {/* Presets */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => { setMethod(p.method); setPath(p.path); setBody(p.body); setResponse(null); }}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${methodColor[p.method]}44`, background: methodColor[p.method] + "14", color: methodColor[p.method], fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = methodColor[p.method] + "28"}
            onMouseLeave={e => e.currentTarget.style.background = methodColor[p.method] + "14"}
          >
            <span style={{ fontSize: 9, marginRight: 5, opacity: 0.8 }}>{p.method}</span>{p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Request panel */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Request</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Method + path */}
            <div style={{ display: "flex", gap: 8 }}>
              <select value={method} onChange={e => setMethod(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${methodColor[method]}55`, background: methodColor[method] + "18", color: methodColor[method], fontSize: 12, fontWeight: 800, cursor: "pointer", outline: "none" }}>
                {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m} value={m} style={{ background: COLORS.darkCard, color: COLORS.text }}>{m}</option>)}
              </select>
              <input value={path} onChange={e => setPath(e.target.value)}
                style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.darkBorder}`, background: "#FFFFFF08", color: COLORS.text, fontSize: 12, fontFamily: "monospace", outline: "none" }} />
            </div>
            {/* Auth header */}
            <div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Authorization: Bearer</div>
              <input value={token} onChange={e => setToken(e.target.value)}
                style={{ width: "100%", padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.darkBorder}`, background: "#FFFFFF08", color: COLORS.muted, fontSize: 10, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
            {/* Body */}
            {["POST","PUT","PATCH"].includes(method) && (
              <div>
                <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Request Body (JSON)</div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.darkBorder}`, background: "#FFFFFF08", color: COLORS.textDim, fontSize: 11, fontFamily: "monospace", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
              </div>
            )}
            <button onClick={fireRequest} disabled={loading}
              style={{ padding: "10px", borderRadius: 8, border: "none", background: loading ? COLORS.darkBorder2 : COLORS.forge, color: loading ? COLORS.muted : "#fff", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s", letterSpacing: "0.02em" }}>
              {loading ? "Sending…" : `Send ${method} Request →`}
            </button>
          </div>
        </div>

        {/* Response panel */}
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Response</span>
            {latency && response && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: response.success ? "#27AE60" : "#EB5757", fontWeight: 700 }}>
                  {response.success ? "200 OK" : "404 Not Found"}
                </span>
                <Tag color={latency < 50 ? "#27AE60" : "#F2994A"}>{latency}ms</Tag>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 380 }}>
            {!response && !loading && (
              <div style={{ padding: 20, color: COLORS.muted, fontSize: 12, textAlign: "center", paddingTop: 40 }}>Hit "Send" to see the response</div>
            )}
            {loading && (
              <div style={{ padding: 20, color: COLORS.muted, fontSize: 12, textAlign: "center", paddingTop: 40 }}>⏳ Awaiting response…</div>
            )}
            {response && (
              <pre style={{ margin: 0, padding: "16px", fontFamily: "monospace", fontSize: 11, color: COLORS.textDim, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Request history */}
      {historyLog.length > 0 && (
        <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>Request History</span>
          </div>
          {historyLog.map((h, i) => (
            <div key={i} style={{ padding: "8px 16px", borderBottom: i < historyLog.length - 1 ? `1px solid ${COLORS.darkBorder}` : "none", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "monospace", color: methodColor[h.method] }}>{h.method}</span>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: COLORS.textDim }}>{h.path}</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: h.status === 200 ? "#27AE60" : "#EB5757" }}>{h.status}</span>
              <Tag color={COLORS.muted}>{h.ms}ms</Tag>
              <span style={{ fontSize: 10, color: COLORS.muted }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────────────────────
function SettingsTab() {
  const [mfa, setMfa] = useState(true);
  const [biometric, setBiometric] = useState(true);
  const [ml, setMl] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [dataExport, setDataExport] = useState(false);
  const [gdprStep, setGdprStep] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);

  const startExport = () => {
    setDataExport(true);
    setExportProgress(0);
    let pct = 0;
    const iv = setInterval(() => {
      pct += 8 + Math.floor(Math.random() * 15);
      if (pct >= 100) { pct = 100; clearInterval(iv); }
      setExportProgress(pct);
    }, 280);
  };

  const Toggle = ({ value, onChange, color = COLORS.forge }) => (
    <div onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 10, background: value ? color : COLORS.darkBorder2, position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ background: COLORS.darkCard, border: `1px solid ${COLORS.darkBorder}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.darkBorder}` }}>
        <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 13 }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const Row = ({ label, sub, control, danger }) => (
    <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.darkBorder}`, display: "flex", alignItems: "center", gap: 12, lastChild: { borderBottom: "none" } }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: danger ? "#EB5757" : COLORS.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Account Settings</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>Security · Privacy · GDPR · Integrations</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Profile */}
        <Section title="Profile">
          {[["Display name", "Alex Martinez"], ["Username", "@alex_m"], ["Email", "alex@example.com"], ["Timezone", "America/New_York"], ["Locale", "en-US"]].map(([label, val], i) => (
            <Row key={i} label={label} control={
              <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.muted, background: "#FFFFFF08", padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.darkBorder}` }}>{val}</div>
            } />
          ))}
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row label="Multi-factor Authentication" sub="TOTP + FIDO2/WebAuthn" control={<Toggle value={mfa} onChange={setMfa} color="#27AE60" />} />
          <Row label="Biometric Unlock" sub="Face ID / Touch ID / Fingerprint" control={<Toggle value={biometric} onChange={setBiometric} color="#2D9CDB" />} />
          <Row label="Public Profile" sub="Friends can discover your habits" control={<Toggle value={publicProfile} onChange={setPublicProfile} />} />
          <Row label="Participate in ML Models" sub="Improves BehaviorEngine™ for all users" control={<Toggle value={ml} onChange={setMl} color="#F2994A" />} />
          <Row label="Active Sessions" control={
            <div style={{ fontSize: 11, color: "#EB5757", background: "#EB575718", padding: "4px 10px", borderRadius: 6, cursor: "pointer", border: `1px solid #EB575740` }}>Revoke all</div>
          } />
        </Section>
      </div>

      {/* GDPR Rights */}
      <Section title="Data & Privacy (GDPR / CCPA)">
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { right: "Right to Access", desc: "Download all your data as JSON + CSV", action: "Export Data", color: "#2D9CDB", key: "export" },
            { right: "Right to Portability", desc: "Structured export compatible with other platforms", action: "Get Export File", color: "#27AE60", key: "portability" },
            { right: "Right to Erasure", desc: "Permanently delete your account and all data within 30 days", action: "Request Deletion", color: "#EB5757", key: "erasure" },
            { right: "Right to Rectification", desc: "Edit or correct any personal data via settings above", action: "Edit Profile", color: "#F2994A", key: "rectification" },
            { right: "Right to Restriction", desc: "Pause data processing and opt out of ML models", action: "Pause Processing", color: "#9B51E0", key: "restriction" },
            { right: "Consent Management", desc: "Granular opt-in/out per data use purpose", action: "Manage Consent", color: COLORS.forge, key: "consent" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#FFFFFF06", border: `1px solid ${item.color}33`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.right}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5, flex: 1 }}>{item.desc}</div>
              <button onClick={() => setGdprStep(item.key)}
                style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${item.color}55`, background: item.color + "18", color: item.color, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = item.color + "30"}
                onMouseLeave={e => e.currentTarget.style.background = item.color + "18"}
              >{item.action}</button>
            </div>
          ))}
        </div>
        {/* GDPR Action feedback */}
        {gdprStep === "export" && (
          <div style={{ margin: "0 18px 14px", background: "#2D9CDB18", border: `1px solid #2D9CDB44`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2D9CDB", marginBottom: 8 }}>Preparing your data export…</div>
            <div style={{ height: 6, background: COLORS.darkBorder, borderRadius: 3, overflow: "hidden" }}>
              <div onClick={startExport} style={{ height: "100%", width: `${exportProgress}%`, background: "#2D9CDB", borderRadius: 3, transition: "width 0.3s", cursor: exportProgress === 0 ? "pointer" : "default" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.muted }}>{exportProgress === 0 ? "Click bar to start" : exportProgress === 100 ? "✅ Export ready — download link sent to alex@example.com" : `Gathering data… ${exportProgress}%`}</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#2D9CDB" }}>{exportProgress}%</span>
            </div>
          </div>
        )}
        {gdprStep === "erasure" && (
          <div style={{ margin: "0 18px 14px", background: "#EB575714", border: `1px solid #EB575744`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#EB5757", marginBottom: 4 }}>⚠ Confirm Account Deletion</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10 }}>All your data will be permanently purged within 30 days per GDPR Art. 17. This action is irreversible.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setGdprStep(null)} style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid ${COLORS.darkBorder}`, background: "transparent", color: COLORS.muted, fontSize: 11, cursor: "pointer" }}>Cancel</button>
              <button style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid #EB575755`, background: "#EB575718", color: "#EB5757", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Request Deletion</button>
            </div>
          </div>
        )}
      </Section>

      {/* Integrations */}
      <Section title="Connected Integrations">
        {[
          { name: "Google Fit", icon: "🏃", status: "Connected", color: "#27AE60" },
          { name: "Apple Health", icon: "🍎", status: "Connected", color: "#27AE60" },
          { name: "Google Calendar", icon: "📅", status: "Connected", color: "#2D9CDB" },
          { name: "Fitbit", icon: "⌚", status: "Not connected", color: COLORS.muted },
          { name: "Zapier", icon: "⚡", status: "Not connected", color: COLORS.muted },
        ].map((intg, i) => (
          <Row key={i} label={`${intg.icon} ${intg.name}`}
            control={
              <div style={{ fontSize: 11, fontWeight: 600, color: intg.color, padding: "3px 10px", borderRadius: 6, border: `1px solid ${intg.color}44`, background: intg.color + "14", cursor: "pointer" }}>
                {intg.status}
              </div>
            }
          />
        ))}
      </Section>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("Dashboard");

  const tabs = {
    "Dashboard": <DashboardTab />,
    "Architecture": <ArchitectureTab />,
    "API Reference": <ApiTab />,
    "Security": <SecurityTab />,
    "AI Engine": <AITab />,
    "Team": <TeamTab />,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.dark, color: COLORS.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Top nav */}
      <div style={{ background: COLORS.darkCard, borderBottom: `1px solid ${COLORS.darkBorder}`, padding: "0 28px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 0 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 28, borderRight: `1px solid ${COLORS.darkBorder}`, marginRight: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: COLORS.forge, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 12H2L8 2Z" fill="white" opacity="0.9" />
                <path d="M8 6L11 11H5L8 6Z" fill="white" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>NGP HabitForge</div>
              <div style={{ fontSize: 9, color: COLORS.forge, fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.06em" }}>v5.0.0-ENTERPRISE</div>
            </div>
          </div>

          {/* Nav tabs */}
          {NAV_ITEMS.map(item => (
            <button key={item} onClick={() => setTab(item)}
              style={{ padding: "18px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600, color: tab === item ? COLORS.forge : COLORS.muted, borderBottom: `2px solid ${tab === item ? COLORS.forge : "transparent"}`, transition: "all 0.15s", letterSpacing: "0.02em" }}>
              {item}
            </button>
          ))}

          {/* Right badges */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27AE60", boxShadow: "0 0 6px #27AE60" }} />
            <span style={{ fontSize: 11, color: "#27AE60", fontWeight: 600 }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* Hero bar */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.forge}18 0%, transparent 60%)`, borderBottom: `1px solid ${COLORS.darkBorder}`, padding: "14px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: COLORS.muted }}>Endpoints:</span>
          {[
            ["REST API v2", "https://api.ngp-habitforge.com/api/v2/"],
            ["GraphQL", "/graphql/"],
            ["WebSocket", "wss://ws.ngp-habitforge.com/ws/"],
          ].map(([label, url]) => (
            <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.forge }}>{label}</span>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: COLORS.muted }}>{url}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["SOC 2 Type II", "GDPR", "HIPAA-Ready"].map(b => <StatusBadge key={b} label={b} color="#27AE60" />)}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px" }}>
        {tabs[tab]}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${COLORS.darkBorder}`, padding: "16px 28px", marginTop: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: COLORS.muted }}>© 2025 NGP (Next Generation Platform) · All rights reserved · NGP HabitForge v5.0.0-ENTERPRISE</div>
          <div style={{ display: "flex", gap: 12 }}>
            {["Docs", "API", "Status", "Security", "HackerOne"].map(l => (
              <span key={l} style={{ fontSize: 11, color: COLORS.muted, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = COLORS.forge}
                onMouseLeave={e => e.currentTarget.style.color = COLORS.muted}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}