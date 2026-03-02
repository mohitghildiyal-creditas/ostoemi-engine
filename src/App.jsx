import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";

const C = {
  primary: "#2563EB", primaryHover: "#1D4ED8", primaryLight: "#DBEAFE", primaryDark: "#1E40AF",
  bg: "#FAFAF8", surface: "#F5F3F0", card: "#FFFFFF", border: "#E8E4DD",
  text: "#2C2A27", textSec: "#6B6862", textTert: "#9B9691",
  success: "#059669", successLight: "#D1FAE5",
  warning: "#D97706", warningLight: "#FEF3C7",
  error: "#DC2626", errorLight: "#FEE2E2",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
};

const SEG_DATA = [
  { seg: "HP",   label: "High Propensity",    total: 80000,  pct: 65, cvr: 1.7,  color: C.primary },
  { seg: "LBCL", label: "Below Credit Limit", total: 12000,  pct: 72, cvr: 11.6, color: C.success },
  { seg: "LP",   label: "Low Propensity",     total: 290000, pct: 55, cvr: 0.9,  color: C.warning },
  { seg: "NV",   label: "New Vintage",        total: 48000,  pct: 60, cvr: 2.5,  color: C.purple },
  { seg: "PB",   label: "Previously Booked",  total: 70000,  pct: 68, cvr: 7.2,  color: C.error },
];

const CHANNELS = [
  { name: "RCS",      cost: 0.28, color: C.purple,  accounts: 45000  },
  { name: "WhatsApp", cost: 0.12, color: C.success, accounts: 95000  },
  { name: "SMS",      cost: 0.08, color: C.primary, accounts: 110000 },
  { name: "Email",    cost: 0.04, color: C.warning, accounts: 50000  },
];

const monthlyTrend = [
  { m: "Aug", bookings: 1.8 }, { m: "Sep", bookings: 2.0 }, { m: "Oct", bookings: 2.3 },
  { m: "Nov", bookings: 2.1 }, { m: "Dec", bookings: 2.6 }, { m: "Jan", bookings: 2.8 }, { m: "Feb", bookings: 3.0 },
];

const dailyPacing = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  sent: Math.round(9000 + Math.sin(i * 0.4) * 1200 + (i > 22 ? (i - 22) * 400 : 0)),
  booked: Math.round(220 + Math.sin(i * 0.4) * 30 + (i > 22 ? (i - 22) * 18 : 0)),
}));

const timePerf = [
  { time: "10:00", cvr: 2.1 }, { time: "11:00", cvr: 2.8 }, { time: "12:00", cvr: 2.2 },
  { time: "14:00", cvr: 2.3 }, { time: "15:00", cvr: 2.7 }, { time: "16:00", cvr: 3.1 },
  { time: "17:00", cvr: 3.4 }, { time: "18:00", cvr: 3.8 }, { time: "18:30", cvr: 4.1 },
];

const AB_TESTS = [
  {
    id: "AB-001", name: "Month-End Urgency vs Generic", status: "Running", accounts: 120000, confidence: 74,
    variants: [
      { name: "Variant A (Control)", desc: "Generic EMI offer message", sent: 60000, booked: 684, cvr: 1.14, amt: 0.41, color: C.primary },
      { name: "Variant B (Urgency)", desc: '"Offer expires tonight" + outstanding amount shown', sent: 60000, booked: 936, cvr: 1.56, amt: 0.57, color: C.success },
    ]
  },
  {
    id: "AB-002", name: "Personalised EMI Amount vs Flat Offer", status: "Completed", accounts: 90000, winner: "B", confidence: 96,
    variants: [
      { name: "Variant A (Flat)", desc: "Convert your outstanding to EMI today!", sent: 45000, booked: 405, cvr: 0.90, amt: 0.28, color: C.primary },
      { name: "Variant B (Personalised)", desc: '"Convert ₹[AMT] to just ₹[EMI]/month"', sent: 45000, booked: 900, cvr: 2.00, amt: 0.60, color: C.success },
    ]
  },
  {
    id: "AB-003", name: "RCS Rich Card vs Plain SMS", status: "Completed", accounts: 80000, winner: "B", confidence: 99,
    variants: [
      { name: "Variant A (SMS)", desc: "Plain text SMS with link", sent: 40000, booked: 328, cvr: 0.82, amt: 0.24, color: C.warning },
      { name: "Variant B (RCS)", desc: "Rich card with EMI calculator + CTA button", sent: 40000, booked: 890, cvr: 2.23, amt: 0.68, color: C.purple },
    ]
  },
  {
    id: "AB-004", name: "PB Segment: Past Booking Reference", status: "Running", accounts: 60000, confidence: 88,
    variants: [
      { name: "Variant A", desc: "Standard OSTOEMI offer", sent: 30000, booked: 648, cvr: 2.16, amt: 0.49, color: C.primary },
      { name: "Variant B", desc: "Since you loved our last EMI plan, here's another", sent: 30000, booked: 1107, cvr: 3.69, amt: 0.85, color: C.error },
    ]
  },
];

const EXEC_QUEUE = [
  { batchId: "BATCH-001", channel: "SMS",      segment: "PB",   records: 18400, time: "10:00", status: "Delivered",  booked: 412 },
  { batchId: "BATCH-002", channel: "WhatsApp", segment: "LBCL", records: 12200, time: "10:00", status: "Delivered",  booked: 198 },
  { batchId: "BATCH-003", channel: "RCS",      segment: "PB",   records: 8900,  time: "10:30", status: "Delivered",  booked: 124 },
  { batchId: "BATCH-004", channel: "Email",    segment: "LP",   records: 24600, time: "10:30", status: "Delivered",  booked: 280 },
  { batchId: "BATCH-005", channel: "SMS",      segment: "HP",   records: 15300, time: "11:00", status: "Delivering", booked: 0   },
  { batchId: "BATCH-006", channel: "WhatsApp", segment: "NV",   records: 9800,  time: "11:00", status: "Delivering", booked: 0   },
  { batchId: "BATCH-007", channel: "RCS",      segment: "HP",   records: 21000, time: "12:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-008", channel: "SMS",      segment: "LP",   records: 42000, time: "13:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-009", channel: "WhatsApp", segment: "PB",   records: 17500, time: "14:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-010", channel: "RCS",      segment: "NV",   records: 11200, time: "15:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-011", channel: "SMS",      segment: "LBCL", records: 6400,  time: "16:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-012", channel: "WhatsApp", segment: "HP",   records: 19800, time: "17:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-013", channel: "Email",    segment: "NV",   records: 14100, time: "17:30", status: "Queued",     booked: 0   },
  { batchId: "BATCH-014", channel: "SMS",      segment: "PB",   records: 8300,  time: "18:00", status: "Queued",     booked: 0   },
  { batchId: "BATCH-015", channel: "WhatsApp", segment: "LP",   records: 22600, time: "18:30", status: "Queued",     booked: 0   },
];

const DIAL_EVENTS = [
  { time: "06:42 AM", type: "sync",  msg: "Daily file pushed to dialler — 3,00,247 records", status: "success" },
  { time: "06:45 AM", type: "ack",   msg: "Dialler acknowledged receipt — Validating records", status: "success" },
  { time: "06:51 AM", type: "ready", msg: "Validation complete — 2,98,910 records queued", status: "success" },
  { time: "09:58 AM", type: "warn",  msg: "1,337 records rejected — DND conflicts flagged upstream", status: "warning" },
  { time: "10:00 AM", type: "live",  msg: "Campaigns LIVE — SMS / WhatsApp / RCS / Email executing", status: "success" },
  { time: "10:12 AM", type: "stat",  msg: "Wave 1: 42,000 delivered · 3,200 opens · 480 bookings", status: "info" },
  { time: "11:30 AM", type: "stat",  msg: "Running total: 98,400 delivered · 8,900 opens · 1,120 bookings", status: "info" },
];

const fmt = (n) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const Icon = ({ n, s = 18, c = "currentColor" }) => {
  const icons = {
    dashboard: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    brain: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
    flask: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M9 3h6v9l4 9H5l4-9V3z"/><line x1="9" y1="9" x2="15" y2="9"/></svg>,
    phone: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 5.58 5.58l1.9-1.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    zap: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    check: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    clock: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    send: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    rupee: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M6 3h12M6 8h12M10 21l6-13"/><path d="M6 8c0 4 3 6 6 6s6-2 6-6"/></svg>,
    block: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    dot3: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="5" r="1.2" fill={c}/><circle cx="12" cy="12" r="1.2" fill={c}/><circle cx="12" cy="19" r="1.2" fill={c}/></svg>,
    moon: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    sun: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
    download: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    link: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    wifi: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    play: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    sparkle: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    target: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    chart: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  };
  return icons[n] || null;
};

const ChBadge = ({ ch }) => {
  const m = { RCS: [C.purpleLight, C.purple], WhatsApp: [C.successLight, C.success], SMS: [C.primaryLight, C.primary], Email: [C.warningLight, C.warning] };
  const [bg, cl] = m[ch] || ["#F3F4F6", "#6B7280"];
  return <span style={{ background: bg, color: cl, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{ch}</span>;
};

const StatusPill = ({ status }) => {
  const m = { Delivered: [C.successLight, C.success], Delivering: [C.primaryLight, C.primary], Queued: [C.surface, C.textSec] };
  const [bg, cl] = m[status] || ["#F3F4F6", "#6B7280"];
  return (
    <span style={{ background: bg, color: cl, borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cl, display: "inline-block" }} />
      {status}
    </span>
  );
};

const StatCard = ({ title, value, sub, icon, color, trend, gradient }) => (
  <div style={{ background: gradient || C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", transition: "all 0.2s", cursor: "default" }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "none"; }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: gradient ? "rgba(255,255,255,0.75)" : C.textSec, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: gradient ? "#fff" : C.text, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: gradient ? "rgba(255,255,255,0.65)" : C.textTert, marginTop: 5 }}>{sub}</div>}
        {trend !== undefined && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 5, color: gradient ? "#fff" : (trend >= 0 ? C.success : C.error) }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
        </div>}
      </div>
      <div style={{ background: gradient ? "rgba(255,255,255,0.2)" : color + "18", borderRadius: 12, padding: 12 }}>
        <Icon n={icon} s={22} c={gradient ? "#fff" : color} />
      </div>
    </div>
  </div>
);

const ABCard = ({ test }) => {
  const [expanded, setExpanded] = useState(false);
  const winner = test.variants.reduce((a, b) => a.cvr > b.cvr ? a : b);
  const lift = (((winner.cvr / test.variants[0].cvr) - 1) * 100).toFixed(0);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ background: test.status === "Completed" ? C.successLight : C.primaryLight, borderRadius: 10, padding: 10 }}>
          <Icon n="flask" s={18} c={test.status === "Completed" ? C.success : C.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{test.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: test.status === "Completed" ? C.successLight : C.primaryLight, color: test.status === "Completed" ? C.success : C.primary }}>{test.status}</span>
            {test.winner && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FFF7ED", color: "#C2410C" }}>Winner Found</span>}
          </div>
          <div style={{ fontSize: 12, color: C.textSec }}>{test.id} · {fmt(test.accounts)} accounts</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.textSec }}>Confidence</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: test.confidence > 95 ? C.success : test.confidence > 85 ? C.warning : C.textSec }}>{test.confidence}%</div>
        </div>
        <div style={{ color: C.textTert }}>{expanded ? "▲" : "▼"}</div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
            {test.variants.map((v, i) => (
              <div key={i} style={{ background: v.cvr === winner.cvr && test.status === "Completed" ? C.successLight : C.surface, border: `2px solid ${v.cvr === winner.cvr && test.status === "Completed" ? C.success : C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{v.name}</span>
                  {v.cvr === winner.cvr && test.status === "Completed" && <span style={{ fontSize: 11, fontWeight: 700, color: C.success }}>WINNER</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textSec, marginBottom: 14, fontStyle: "italic" }}>"{v.desc}"</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["Sent", fmt(v.sent)], ["Booked", fmt(v.booked)], ["CVR", `${v.cvr}%`], ["Amount", `₹${v.amt}Cr`]].map(([l, val]) => (
                    <div key={l} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: C.textTert }}>{l}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {test.winner && (
            <div style={{ background: "linear-gradient(135deg, #065F46, #059669)", borderRadius: 12, padding: "14px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Variant B deployed to 100% traffic</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>+{lift}% CVR uplift · Statistically significant at {test.confidence}% confidence</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>+{lift}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liveBookings, setLiveBookings] = useState(1120);
  const [liveDelivered, setLiveDelivered] = useState(98400);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [engineStep, setEngineStep] = useState(0); // 0=idle,1=running,2=done
  const [engineLog, setEngineLog] = useState([]);
  const [engineResult, setEngineResult] = useState(null);
  const TODAY = new Date().toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const runEngine = () => {
    setShowEngineModal(true);
    setEngineStep(1);
    setEngineLog([]);
    setEngineResult(null);

    const steps = [
      { delay: 400,  msg: "🔄 Loading past delivery data (last 30 days)..." },
      { delay: 900,  msg: "📊 Refreshing propensity-to-pay scores for 5,00,000 accounts..." },
      { delay: 1600, msg: "✅ Propensity refresh complete — avg score: 0.61 (+4.2% vs yesterday)" },
      { delay: 2200, msg: "🧠 ML Agent 1: Re-scoring segments using updated signals..." },
      { delay: 2900, msg: "📬 ML Agent 2: Selecting optimal channel per account (RCS / WhatsApp / SMS / Email)..." },
      { delay: 3600, msg: "✍️  ML Agent 3: Assigning best-performing template per segment..." },
      { delay: 4300, msg: "⏰ Optimising send-time windows based on past open rates..." },
      { delay: 4900, msg: "🚫 Suppressing 18,420 DND / recently contacted accounts..." },
      { delay: 5500, msg: "✅ Engine run complete. Dispatching today's plan..." },
    ];

    steps.forEach(({ delay, msg }) => {
      setTimeout(() => setEngineLog(prev => [...prev, msg]), delay);
    });

    setTimeout(() => {
      setEngineStep(2);
      setEngineResult({
        totalAccounts: 481580,
        suppressed: 18420,
        segments: [
          { seg: "HP",   label: "High Propensity",    accounts: 78200,  propensity: 0.71, channel: "RCS",       template: "Personalised EMI Amount",    expectedCVR: 2.1  },
          { seg: "LBCL", label: "Below Credit Limit", accounts: 11400,  propensity: 0.78, channel: "WhatsApp",  template: "Credit Limit Restore Offer", expectedCVR: 12.4 },
          { seg: "LP",   label: "Low Propensity",     accounts: 274000, propensity: 0.48, channel: "SMS",       template: "Generic EMI Offer",          expectedCVR: 1.0  },
          { seg: "NV",   label: "New Vintage",        accounts: 46800,  propensity: 0.63, channel: "Email",     template: "Welcome + EMI Intro",        expectedCVR: 2.7  },
          { seg: "PB",   label: "Previously Booked",  accounts: 71180,  propensity: 0.74, channel: "WhatsApp",  template: "Re-engagement with History",  expectedCVR: 7.8  },
        ],
        totalExpectedBookings: 8240,
        projectedAmount: "3.24 Cr",
        costSaved: "₹12,400 vs yesterday",
      });
    }, 5800);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setLiveBookings(b => b + Math.floor(Math.random() * 3));
      setLiveDelivered(d => d + Math.floor(Math.random() * 150));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const card = dark ? "#1E1C1A" : C.card;
  const tp = dark ? "#F5F3F0" : C.text;
  const ts = dark ? "#9B9691" : C.textSec;
  const br = dark ? "#2C2A27" : C.border;
  const sf = dark ? "#2a2926" : C.surface;

  const tabs = [
    { id: "dashboard", label: "Dashboard",    icon: "dashboard" },
    { id: "agents",    label: "ML Agents",    icon: "brain"     },
    { id: "abtest",    label: "A/B Testing",  icon: "flask"     },
    { id: "execution", label: "Execution",    icon: "zap"       },
    { id: "dialling",  label: "Dialling Hub", icon: "phone"     },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh", background: dark ? "#111" : "linear-gradient(180deg,#FAFAF8,#F5F3F0)", color: tp }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .anim{animation:fadeIn 0.32s ease forwards}
        .live{animation:pulse 1.5s infinite}
        .hover-row:hover{background:${sf}!important}
      `}</style>

      {/* HEADER */}
      <div style={{ background: dark ? "#0D0D0C" : "#fff", borderBottom: `1px solid ${br}`, padding: "0 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", height: 58, gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
            <div style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="target" s={16} c="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: tp }}>OSTOEMI Engine</div>
              <div style={{ fontSize: 10, color: ts, letterSpacing: "0.05em" }}>CAMPAIGN DECISION PLATFORM</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s", background: tab === t.id ? C.primaryLight : "transparent", color: tab === t.id ? C.primary : ts }}>
                <Icon n={t.icon} s={14} c={tab === t.id ? C.primary : ts} />
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#D1FAE5", borderRadius: 20, padding: "5px 13px", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="live" style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>LIVE · {fmt(liveDelivered)} delivered</span>
            </div>
            <div style={{ fontSize: 11, color: ts }}>{TODAY}</div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
                <Icon n="dot3" s={18} c={ts} />
              </button>
              {showMenu && (
                <div style={{ position: "absolute", right: 0, top: 34, background: card, border: `1px solid ${br}`, borderRadius: 10, padding: 8, minWidth: 170, boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 300 }}>
                  {[{ icon: dark ? "sun" : "moon", label: dark ? "Light Mode" : "Dark Mode", fn: () => { setDark(!dark); setShowMenu(false); } },
                    { icon: "download", label: "Export Today's Plan", fn: () => setShowMenu(false) },
                    { icon: "refresh", label: "Re-run ML Models", fn: () => setShowMenu(false) },
                  ].map((item, i) => (
                    <div key={i} onClick={item.fn}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: tp }}
                      onMouseEnter={e => e.currentTarget.style.background = sf}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Icon n={item.icon} s={14} c={ts} /> {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: 1480, margin: "0 auto" }}>

        {/* ═══════════════ DASHBOARD ═══════════════ */}
        {tab === "dashboard" && (
          <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: tp }}>Campaign Intelligence Dashboard</h2>
                <p style={{ fontSize: 13, color: ts, margin: "3px 0 0" }}>AI-powered daily decisions for 5 Lakh OSTOEMI accounts</p>
              </div>
              <button onClick={runEngine} style={{ display: "flex", alignItems: "center", gap: 7, background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                <Icon n="play" s={14} c="#fff" /> Run Today's Engine
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <StatCard title="Total Eligible Accounts" value="5,00,000" sub="Active OSTOEMI pool" icon="target" color={C.primary} trend={3} gradient="linear-gradient(135deg,#2563EB,#1E40AF)" />
              <StatCard title="Campaigns Today" value="3,00,247" sub="60% of eligible pool" icon="send" color={C.success} trend={5} gradient="linear-gradient(135deg,#059669,#047857)" />
              <StatCard title="Expected Bookings" value="₹3.0 Cr" sub="Today's projected amount" icon="rupee" color={C.warning} trend={8} gradient="linear-gradient(135deg,#D97706,#B45309)" />
              <StatCard title="Live Bookings" value={`₹${(liveBookings * 780 / 10000000).toFixed(2)}Cr`} sub={`${fmt(liveBookings)} accounts booked so far`} icon="zap" color={C.error} trend={12} gradient="linear-gradient(135deg,#DC2626,#991B1B)" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Accounts Suppressed", val: "1,99,753", note: "Cap / fatigue / low score", c: C.error, icon: "block" },
                { label: "Retargeting Pool", val: "84,200", note: "Landed, awaiting conversion", c: C.warning, icon: "refresh" },
                { label: "Delivered Today", val: fmt(liveDelivered), note: "Running total", c: C.primary, icon: "check" },
                { label: "Avg Expected CVR", val: "2.8%", note: "Weighted across segments", c: C.success, icon: "chart" },
              ].map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${br}`, borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: ts, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>{s.note}</div>
                    </div>
                    <div style={{ background: s.c + "15", borderRadius: 10, padding: 10 }}><Icon n={s.icon} s={20} c={s.c} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
              <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 2 }}>Monthly Booking Trend (₹ Crore)</div>
                <div style={{ fontSize: 12, color: ts, marginBottom: 16 }}>OSTOEMI digital channel bookings</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyTrend}>
                    <defs><linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.25}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={br} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: ts }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: ts }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${br}`, fontSize: 12, background: card }} formatter={v => [`₹${v}Cr`, "Bookings"]} />
                    <Area type="monotone" dataKey="bookings" stroke={C.primary} fill="url(#ag1)" strokeWidth={2.5} dot={{ r: 4, fill: C.primary }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 2 }}>Channel Mix Today</div>
                <div style={{ fontSize: 12, color: ts, marginBottom: 10 }}>3L campaigns distribution</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={CHANNELS} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="accounts">
                      {CHANNELS.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={v => [fmt(v), "Accounts"]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {CHANNELS.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                        <span style={{ fontSize: 12, color: ts }}>{c.name} (₹{c.cost})</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>{fmt(c.accounts)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 2 }}>Best Time Slots</div>
                <div style={{ fontSize: 12, color: ts, marginBottom: 14 }}>CVR by send time (TRAI window)</div>
                {timePerf.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: ts, minWidth: 44, fontFamily: "monospace" }}>{t.time}</span>
                    <div style={{ flex: 1, height: 14, background: sf, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(t.cvr / 4.5) * 100}%`, height: "100%", background: t.cvr >= 3.5 ? C.success : t.cvr >= 2.5 ? C.primary : C.textTert, borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 5 }}>
                        <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{t.cvr}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 16 }}>Segment Performance Overview</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {SEG_DATA.map(s => {
                  const toSend = Math.round(s.total * s.pct / 100);
                  const expBooking = (toSend * s.cvr / 100 * 7.2).toFixed(1);
                  return (
                    <div key={s.seg} style={{ background: s.color + "08", border: `2px solid ${s.color}22`, borderRadius: 14, padding: 16, borderTop: `4px solid ${s.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.seg}</span>
                        <span style={{ fontSize: 11, background: s.color + "18", color: s.color, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>{s.cvr}% CVR</span>
                      </div>
                      <div style={{ fontSize: 11, color: ts, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: tp }}>{fmt(toSend)}</div>
                      <div style={{ fontSize: 11, color: ts, marginBottom: 8 }}>of {fmt(s.total)} accounts</div>
                      <div style={{ height: 5, background: br, borderRadius: 99, marginBottom: 8 }}>
                        <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.success }}>₹{expBooking}L expected</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: tp }}>Feb 2025 — Daily Campaign Pacing</div>
                  <div style={{ fontSize: 12, color: ts }}>Campaigns sent vs conversions per day</div>
                </div>
                <div style={{ background: C.warningLight, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.warning, fontWeight: 600 }}>
                  Month-end reserve: 25% capacity held · Days 22–28
                </div>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={dailyPacing} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={br} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: ts }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 10, fill: ts }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: ts }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${br}`, fontSize: 12, background: card }} />
                  <Bar yAxisId="l" dataKey="sent" name="Sent" fill={C.primaryLight} radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="r" dataKey="booked" name="Booked" fill={C.success} radius={[3, 3, 0, 0]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════ ML AGENTS ═══════════════ */}
        {tab === "agents" && (
          <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: tp }}>ML Agent Pipeline</h2>
                <p style={{ fontSize: 13, color: ts, margin: "3px 0 0" }}>Three intelligent agents collaborating on account-level decisions for 5L accounts daily</p>
              </div>
              <div style={{ background: "#D1FAE5", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: C.success, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="live" style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                All 3 Agents Active
              </div>
            </div>

            {/* Pipeline Banner */}
            <div style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)", borderRadius: 20, padding: 26, color: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Daily Decision Pipeline</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>Each account passes through all 3 agents sequentially. Output = channel + time + template + send/suppress decision.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {[
                  { step: "1", title: "Raw Data Feed", sub: "5L accounts loaded" },
                  null,
                  { step: "2", title: "Agent 1: Propensity", sub: "Score & rank each account" },
                  null,
                  { step: "3", title: "Agent 2: Channel+Time", sub: "Best channel + time slot" },
                  null,
                  { step: "4", title: "Agent 3: Template AI", sub: "Personalised content" },
                  null,
                  { step: "5", title: "Execution Output", sub: "Push to dialling platform" },
                ].map((s, i) => s === null ? (
                  <div key={i} style={{ color: "rgba(255,255,255,0.4)", fontSize: 20, margin: "0 6px", flexShrink: 0 }}>→</div>
                ) : (
                  <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Step {s.step}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Agent Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {[
                {
                  title: "Agent 1 — Propensity to Pay",
                  subtitle: "Scores every account 0-100 on likelihood to convert OSTOEMI today. Drives send/suppress decision.",
                  gradient: "linear-gradient(135deg,#2563EB,#1E40AF)",
                  accuracy: 84, icon: "brain", lastRun: "Today 06:30 AM",
                  metrics: [["Accounts Scored", "5,00,000"], ["High Score >70%", "1,12,400"], ["Model", "XGBoost"], ["AUC Score", "0.843"]],
                  features: ["Propensity Score (Bank)", "Segment", "Churn 6m", "Cross-product COB", "Payment Day", "ELA", "Last Booked Date", "Campaign History", "Decile"],
                },
                {
                  title: "Agent 2 — Best Channel & Time",
                  subtitle: "Recommends optimal channel (SMS/WA/RCS/Email) and exact send time slot per account. Cost-aware.",
                  gradient: "linear-gradient(135deg,#7C3AED,#5B21B6)",
                  accuracy: 79, icon: "clock", lastRun: "Today 06:35 AM",
                  metrics: [["Channel Decisions", "3,00,247"], ["RCS Recommended", "45,000"], ["Model", "Multi-arm Bandit"], ["Lift vs Random", "+31%"]],
                  features: ["Historical CVR by channel", "Last campaign channel", "Time of last open", "Device patterns", "Churn per channel", "Cost vs ELA", "Segment"],
                },
                {
                  title: "Agent 3 — Template Creator AI",
                  subtitle: "Generates personalised message content using account attributes and winning A/B learnings.",
                  gradient: "linear-gradient(135deg,#059669,#047857)",
                  accuracy: 76, icon: "sparkle", lastRun: "Today 06:42 AM",
                  metrics: [["Templates Generated", "3,00,247"], ["Unique Variants", "48"], ["Model", "LLM + Rules"], ["Personalisation", "94%"]],
                  features: ["ELA & EMI amount", "Segment", "Outstanding balance", "Month day", "AB test winners", "Past template CVR", "Name"],
                },
              ].map((agent, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${br}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", transition: "all 0.25s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ background: agent.gradient, padding: 22, color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 10 }}>
                        <Icon n={agent.icon} s={20} c="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.75, letterSpacing: "0.08em", textTransform: "uppercase" }}>ML AGENT</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{agent.title}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>{agent.subtitle}</div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {agent.metrics.map(([l, v], j) => (
                        <div key={j} style={{ background: sf, borderRadius: 8, padding: "9px 12px" }}>
                          <div style={{ fontSize: 10, color: ts }}>{l}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: tp }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: ts }}>Model Accuracy</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: agent.accuracy > 80 ? C.success : C.warning }}>{agent.accuracy}%</span>
                      </div>
                      <div style={{ height: 8, background: sf, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${agent.accuracy}%`, height: "100%", background: agent.accuracy > 80 ? C.success : C.warning, borderRadius: 99 }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: ts, marginBottom: 6 }}>Key Features</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {agent.features.map((f, j) => (
                          <span key={j} style={{ background: C.primaryLight, color: C.primary, borderRadius: 5, padding: "2px 7px", fontSize: 11 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${br}`, fontSize: 11 }}>
                      <span style={{ color: ts }}>Last run: {agent.lastRun}</span>
                      <span style={{ color: C.success, fontWeight: 600 }}>● Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature importance + Channel matrix */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 4 }}>Agent 1 — Feature Importance (SHAP)</div>
                <div style={{ fontSize: 12, color: ts, marginBottom: 16 }}>Top drivers of propensity score</div>
                {[
                  { name: "Propensity Score (Bank)", imp: 24 }, { name: "Segment Type", imp: 18 },
                  { name: "Churn (6m campaigns)", imp: 14 }, { name: "Previous OSTOEMI Bookings", imp: 12 },
                  { name: "ELA Amount", imp: 10 }, { name: "Days Since Last Campaign", imp: 9 },
                  { name: "Cross-product COB Count", imp: 7 }, { name: "Payment Day", imp: 6 },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: tp }}>{f.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{f.imp}%</span>
                    </div>
                    <div style={{ height: 6, background: sf, borderRadius: 99 }}>
                      <div style={{ width: `${f.imp * 4}%`, height: "100%", background: `linear-gradient(90deg,${C.primary},#60A5FA)`, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 4 }}>Agent 2 — Channel × Segment CVR Matrix</div>
                <div style={{ fontSize: 12, color: ts, marginBottom: 16 }}>Historical CVR used to train bandit model</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: sf }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: ts, fontWeight: 600 }}>Seg</th>
                      {["RCS", "WhatsApp", "SMS", "Email"].map(c => (
                        <th key={c} style={{ padding: "8px 10px", textAlign: "center", color: ts, fontWeight: 600 }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { seg: "PB",   c: C.error,   cvrs: [4.2, 3.8, 2.9, 1.4] },
                      { seg: "LBCL", c: C.success, cvrs: [8.1, 7.4, 5.2, 3.1] },
                      { seg: "HP",   c: C.primary, cvrs: [2.8, 2.4, 1.9, 0.9] },
                      { seg: "NV",   c: C.purple,  cvrs: [3.1, 2.7, 2.0, 1.1] },
                      { seg: "LP",   c: C.warning, cvrs: [1.4, 1.1, 0.9, 0.4] },
                    ].map(row => {
                      const max = Math.max(...row.cvrs);
                      return (
                        <tr key={row.seg} style={{ borderTop: `1px solid ${br}` }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: row.c }}>{row.seg}</td>
                          {row.cvrs.map((cvr, i) => (
                            <td key={i} style={{ padding: "8px 10px", textAlign: "center" }}>
                              <span style={{ background: cvr === max ? C.successLight : sf, color: cvr === max ? C.success : tp, fontWeight: cvr === max ? 800 : 500, padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>
                                {cvr}%{cvr === max ? "★" : ""}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: tp, marginBottom: 12 }}>Agent 3 — Sample Personalised Templates</div>
                  {[
                    { seg: "PB", ch: "RCS", content: "Hi [Name], You've availed our EMI plan before! Convert ₹[AMT] outstanding to just ₹[EMI]/mo. Zero processing fee. Accept instantly ↓" },
                    { seg: "LBCL", ch: "WhatsApp", content: "Dear [Name], Convert your CC outstanding of ₹[AMT] to 12-month EMI at [RATE]% interest. Today only. Tap: [LINK]" },
                  ].map((t, i) => (
                    <div key={i} style={{ background: sf, borderRadius: 10, padding: 14, marginBottom: 8, border: `1px solid ${br}` }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <span style={{ background: SEG_DATA.find(s => s.seg === t.seg)?.color + "18", color: SEG_DATA.find(s => s.seg === t.seg)?.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5 }}>{t.seg}</span>
                        <ChBadge ch={t.ch} />
                      </div>
                      <div style={{ fontSize: 12, color: tp, lineHeight: 1.6, fontStyle: "italic" }}>"{t.content}"</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ A/B TESTING ═══════════════ */}
        {tab === "abtest" && (
          <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: tp }}>A/B Testing Lab</h2>
                <p style={{ fontSize: 13, color: ts, margin: "3px 0 0" }}>Template, channel and timing experiments — results feed directly into Agent 3</p>
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.purple, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                <Icon n="flask" s={14} c="#fff" /> New Experiment
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Active Tests", val: "2", c: C.primary }, { label: "Completed Tests", val: "2", c: C.success },
                { label: "Total Accounts Tested", val: "3,50,000", c: C.purple }, { label: "CVR Uplift from AB Wins", val: "+38%", c: C.warning },
              ].map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${br}`, borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ fontSize: 11, color: ts, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.c }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 4 }}>CVR Comparison — All Experiments</div>
              <div style={{ fontSize: 12, color: ts, marginBottom: 16 }}>Variant A (Control) vs Variant B across all tests</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={AB_TESTS.map(t => ({ name: t.id, A: t.variants[0].cvr, B: t.variants[1].cvr }))} barSize={28} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={br} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: ts }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: ts }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${br}`, fontSize: 12, background: card }} formatter={v => [`${v}%`, "CVR"]} />
                  <Bar dataKey="A" name="Variant A (Control)" fill={C.primaryLight} stroke={C.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="B" name="Variant B" fill={C.success} radius={[4, 4, 0, 0]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AB_TESTS.map(t => <ABCard key={t.id} test={t} />)}
            </div>

            <div style={{ background: "linear-gradient(135deg,#065F46,#047857)", borderRadius: 16, padding: 24, color: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Key Learnings Auto-Applied to Agent 3</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  { insight: "Show personalised ₹EMI/month", uplift: "+122%", note: "Biggest CVR driver across all segments" },
                  { insight: "RCS rich cards over plain SMS", uplift: "+172%", note: "For HP + PB + LBCL segments" },
                  { insight: "Past booking reference for PB", uplift: "+71%", note: "PB segment only — strong trust signal" },
                ].map((l, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{l.insight}</div>
                    <div style={{ fontSize: 30, fontWeight: 800 }}>{l.uplift}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>CVR uplift · {l.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ EXECUTION ═══════════════ */}
        {tab === "execution" && (
          <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: tp }}>Today's Execution Plan</h2>
              <p style={{ fontSize: 13, color: ts, margin: "3px 0 0" }}>3,00,247 accounts · 15 batches · 10:00 AM – 6:45 PM TRAI window</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                { label: "Total Batches", val: "15", c: C.primary },
                { label: "Delivered", val: fmt(liveDelivered), c: C.success },
                { label: "In Progress", val: "2 batches", c: C.warning },
                { label: "Queued", val: "9 batches", c: ts },
                { label: "Bookings So Far", val: `₹${(liveBookings * 780 / 10000000).toFixed(2)}Cr`, c: C.error },
              ].map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${br}`, borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, color: ts, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${br}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp }}>Batch Execution Queue</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.success, fontWeight: 600 }}>
                  <span className="live" style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                  Live updating
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: sf }}>
                    {["#", "Batch ID", "Channel", "Segment", "Records", "Scheduled", "Status", "Booked"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: ts, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EXEC_QUEUE.map((row, i) => (
                    <tr key={row.batchId} className="hover-row" style={{ borderTop: `1px solid ${br}` }}>
                      <td style={{ padding: "11px 16px", color: ts, fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: tp, fontFamily: "monospace", fontSize: 12 }}>{row.batchId}</td>
                      <td style={{ padding: "11px 16px" }}><ChBadge ch={row.channel} /></td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ background: SEG_DATA.find(s => s.seg === row.segment)?.color + "18", color: SEG_DATA.find(s => s.seg === row.segment)?.color, padding: "2px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{row.segment}</span>
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 600, color: tp }}>{fmt(row.records)}</td>
                      <td style={{ padding: "11px 16px", color: ts, fontSize: 12, fontFamily: "monospace" }}>{row.time}</td>
                      <td style={{ padding: "11px 16px" }}><StatusPill status={row.status} /></td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: row.booked > 0 ? C.success : ts }}>
                        {row.booked > 0 ? `${fmt(row.booked)} · ₹${(row.booked * 7.8 / 10000).toFixed(1)}L` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 4 }}>Intraday Booking Accumulation</div>
              <div style={{ fontSize: 12, color: ts, marginBottom: 14 }}>Live booking curve — projected to hit ₹3Cr by 6:45 PM</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={[
                  { t: "10AM", actual: 0.12, proj: 0.12 }, { t: "11AM", actual: 0.38, proj: 0.40 },
                  { t: "12PM", actual: 0.62, proj: 0.65 }, { t: "1PM", actual: 0.81, proj: 0.88 },
                  { t: "2PM", actual: 1.05, proj: 1.15 }, { t: "3PM", proj: 1.50 },
                  { t: "4PM", proj: 1.95 }, { t: "5PM", proj: 2.45 }, { t: "6PM", proj: 2.80 }, { t: "6:45", proj: 3.00 },
                ]}>
                  <defs><linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.2}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={br} />
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: ts }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: ts }} axisLine={false} tickLine={false} unit="Cr" />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, background: card }} />
                  <Area type="monotone" dataKey="proj" stroke={ts} fill="none" strokeWidth={1.5} strokeDasharray="5 3" name="Projected" />
                  <Area type="monotone" dataKey="actual" stroke={C.success} fill="url(#ag2)" strokeWidth={2.5} name="Actual" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════ DIALLING HUB ═══════════════ */}
        {tab === "dialling" && (
          <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: tp }}>Dialling Platform Hub</h2>
                <p style={{ fontSize: 13, color: ts, margin: "3px 0 0" }}>Automated execution bridge — AI decisions push directly to dialler for zero-manual-intervention delivery</p>
              </div>
              <div style={{ background: "#D1FAE5", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: C.success, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon n="wifi" s={14} c={C.success} /> Connected · Auto-Execution ON
              </div>
            </div>

            {/* Connection Banner */}
            <div style={{ background: "linear-gradient(135deg,#111827,#1F2937)", borderRadius: 20, padding: 26, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <div style={{ background: "rgba(5,150,105,0.2)", border: "1px solid #059669", borderRadius: 12, padding: 12 }}>
                  <Icon n="link" s={24} c={C.success} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>OSTOEMI Engine ↔ Dialling Platform</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>API Bridge · Real-time sync · Zero manual intervention</div>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(5,150,105,0.2)", border: "1px solid #059669", borderRadius: 10, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="live" style={{ width: 9, height: 9, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                  <span style={{ color: C.success, fontWeight: 700, fontSize: 13 }}>LIVE · AUTO-EXECUTION</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {[
                  { label: "API Endpoint", val: "api.dialler.internal/v2" },
                  { label: "Last Sync", val: "2 mins ago" },
                  { label: "Records Pushed", val: "3,00,247" },
                  { label: "Rejection Rate", val: "0.44%" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Flow */}
            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: tp, marginBottom: 4 }}>Automatic Execution Flow</div>
              <div style={{ fontSize: 12, color: ts, marginBottom: 22 }}>Zero manual steps — model outputs auto-trigger dialler API</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                {[
                  { time: "06:00", title: "Data Ingestion", desc: "Daily account file + churn + campaign trail loaded", color: C.primary },
                  null,
                  { time: "06:30", title: "ML Agents Run", desc: "3 agents score all 5L accounts (~8 min)", color: C.purple },
                  null,
                  { time: "06:45", title: "Decision Output", desc: "3L accounts with channel + time + template", color: C.success },
                  null,
                  { time: "07:15", title: "Push to Dialler", desc: "API call with full payload per batch", color: C.warning },
                  null,
                  { time: "09:55", title: "Validation Done", desc: "DND, format, duplicates checked", color: C.success },
                  null,
                  { time: "10:00", title: "CAMPAIGNS LIVE", desc: "Auto-execute across all channels", color: C.error },
                ].map((step, i) => step === null ? (
                  <div key={i} style={{ width: 24, height: 2, background: `linear-gradient(90deg,${C.border},${C.border})`, marginTop: 34, flexShrink: 0 }} />
                ) : (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: ts, marginBottom: 8, fontFamily: "monospace" }}>{step.time}</div>
                    <div style={{ background: step.color + "18", border: `2px solid ${step.color}40`, borderRadius: 12, padding: 10, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: step.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>{Math.ceil((i + 1) / 2)}</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: tp, textAlign: "center", marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 10, color: ts, textAlign: "center", lineHeight: 1.4 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Event Log */}
            <div style={{ background: card, border: `1px solid ${br}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${br}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: tp }}>Live Event Log</div>
                <div style={{ fontSize: 11, color: ts, background: sf, padding: "3px 10px", borderRadius: 20 }}>Auto-refreshing every 30s</div>
              </div>
              {DIAL_EVENTS.map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < DIAL_EVENTS.length - 1 ? `1px solid ${br}` : "none" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: ts, minWidth: 70 }}>{ev.time}</div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.status === "success" ? C.success : ev.status === "warning" ? C.warning : C.primary, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: tp, flex: 1 }}>{ev.msg}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ev.status === "success" ? C.successLight : ev.status === "warning" ? C.warningLight : C.primaryLight, color: ev.status === "success" ? C.success : ev.status === "warning" ? C.warning : C.primary }}>{ev.type.toUpperCase()}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", background: "#D1FAE520" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: ts, minWidth: 70 }}>Now</div>
                <div className="live" style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: C.success, fontWeight: 500 }}>
                  Running total: {fmt(liveDelivered)} delivered · {fmt(liveBookings)} bookings · ₹{(liveBookings * 780 / 10000000).toFixed(2)}Cr booked
                </div>
              </div>
            </div>

            {/* Channel Delivery Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {CHANNELS.map((ch, i) => {
                const delivered = Math.round(ch.accounts * 0.72);
                const booked = Math.round(delivered * [0.028, 0.022, 0.018, 0.012][i]);
                return (
                  <div key={i} style={{ background: card, border: `1px solid ${br}`, borderRadius: 14, padding: 20, borderLeft: `4px solid ${ch.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <ChBadge ch={ch.name} />
                      <span style={{ fontSize: 11, color: ts }}>₹{ch.cost}/msg</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: tp, marginBottom: 2 }}>{fmt(ch.accounts)}</div>
                    <div style={{ fontSize: 11, color: ts, marginBottom: 12 }}>accounts targeted</div>
                    {[["Delivered", fmt(delivered), tp], ["Booked", fmt(booked), C.success], ["CVR", `${((booked / delivered) * 100).toFixed(2)}%`, ch.color]].map(([l, v, c]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: ts }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ ENGINE RUN MODAL ═══════════════ */}
      {showEngineModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: card, borderRadius: 16, width: "min(820px, 95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", padding: 28 }}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="brain" s={18} c="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: tp }}>ML Engine Run</div>
                  <div style={{ fontSize: 12, color: ts }}>AI-powered daily decision pipeline</div>
                </div>
              </div>
              <button onClick={() => { setShowEngineModal(false); setEngineStep(0); setEngineLog([]); setEngineResult(null); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: ts, lineHeight: 1 }}>✕</button>
            </div>

            {/* Log Output */}
            <div style={{ background: dark ? "#0D0D0C" : "#0F172A", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontFamily: "monospace", fontSize: 12, minHeight: 160 }}>
              {engineLog.map((line, i) => (
                <div key={i} style={{ color: "#A3E635", marginBottom: 5, animation: "fadeIn 0.3s ease" }}>{line}</div>
              ))}
              {engineStep === 1 && (
                <span style={{ color: "#60A5FA", animation: "pulse 1s infinite" }}>▌</span>
              )}
            </div>

            {/* Results */}
            {engineStep === 2 && engineResult && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                {/* Summary Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "Accounts Targeted", value: (engineResult.totalAccounts).toLocaleString("en-IN"), color: C.primary },
                    { label: "Suppressed (DND)", value: engineResult.suppressed.toLocaleString("en-IN"), color: C.error },
                    { label: "Expected Bookings", value: engineResult.totalExpectedBookings.toLocaleString("en-IN"), color: C.success },
                    { label: "Projected Amount", value: "₹" + engineResult.projectedAmount, color: C.warning },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: sf, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: 11, color: ts, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Per-Segment Table */}
                <div style={{ fontWeight: 700, fontSize: 13, color: tp, marginBottom: 10 }}>Segment-wise Decisions</div>
                <div style={{ borderRadius: 10, border: `1px solid ${br}`, overflow: "hidden", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: sf }}>
                        {["Segment", "Accounts", "Propensity", "Best Channel", "Template", "Exp. CVR"].map(h => (
                          <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: ts, fontWeight: 600, borderBottom: `1px solid ${br}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {engineResult.segments.map((s, i) => (
                        <tr key={s.seg} style={{ borderBottom: i < engineResult.segments.length - 1 ? `1px solid ${br}` : "none" }}
                          onMouseEnter={e => e.currentTarget.style.background = sf}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ background: s.propensity > 0.7 ? C.successLight : s.propensity > 0.55 ? C.warningLight : C.errorLight, color: s.propensity > 0.7 ? C.success : s.propensity > 0.55 ? C.warning : C.error, borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 11 }}>{s.seg}</span>
                            <span style={{ marginLeft: 8, color: ts }}>{s.label}</span>
                          </td>
                          <td style={{ padding: "9px 12px", fontWeight: 600, color: tp }}>{s.accounts.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "9px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 50, height: 6, background: br, borderRadius: 3 }}>
                                <div style={{ width: `${s.propensity * 100}%`, height: "100%", background: s.propensity > 0.7 ? C.success : s.propensity > 0.55 ? C.warning : C.error, borderRadius: 3 }} />
                              </div>
                              <span style={{ color: tp, fontWeight: 600 }}>{(s.propensity * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "9px 12px" }}>
                            <span style={{ background: C.purpleLight, color: C.purple, borderRadius: 6, padding: "2px 8px", fontWeight: 600, fontSize: 11 }}>{s.channel}</span>
                          </td>
                          <td style={{ padding: "9px 12px", color: ts, maxWidth: 180 }}>{s.template}</td>
                          <td style={{ padding: "9px 12px", fontWeight: 700, color: C.success }}>{s.expectedCVR}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: ts }}>💰 Cost saved: <strong style={{ color: C.success }}>{engineResult.costSaved}</strong></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { setShowEngineModal(false); setEngineStep(0); setEngineLog([]); setEngineResult(null); }}
                      style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${br}`, background: "transparent", color: tp, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                      Close
                    </button>
                    <button onClick={runEngine}
                      style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon n="refresh" s={13} c="#fff" /> Re-run Engine
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
