import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, FileText, Calendar, CreditCard, Award, Bell, User,
  CheckCircle, Shield, LogOut, LayoutDashboard, Send, BookOpen,
  Users, BarChart3, Clock, ArrowRight, Download, SearchCheck, AlertCircle, XCircle, Star,
  Search, MapPin, Megaphone, Tag, Paperclip, Ticket, Layers, X, Bookmark, FileDown, Trash2
} from 'lucide-react';

/* ==========================================================================
   CONFERENCE SETTINGS — edit these to match your real event.
   Everything on the landing page, schedule, tickets and certificates reads
   from here, so you only change the details in one place.
   ========================================================================== */
const CONFERENCE = {
  name: 'AcademiaConf 2027',
  title: 'International Conference on Computing & Applied Sciences',
  startDate: '2027-03-18',
  dateLabel: 'March 18–20, 2027',
  venue: 'Hybrid: in person and online',
  description:
    'A peer-reviewed conference where authors present research, reviewers evaluate submissions, and participants build a personal program from the accepted papers.'
};
const CONFERENCE_YEAR = CONFERENCE.startDate.slice(0, 4);

// Timeline shown on the landing page and the dashboards. Each step matches a
// real stage of the workflow in this app.
const IMPORTANT_DATES = [
  { label: 'Paper submission deadline', date: '2026-12-15', note: 'Authors submit title, abstract and manuscript.' },
  { label: 'Review decisions announced', date: '2027-01-31', note: 'Reviewers score papers; organizers decide.' },
  { label: 'Early registration closes', date: '2027-02-15', note: 'Use code EARLYBIRD for 10% off.' },
  { label: 'Conference opens', date: '2027-03-18', note: 'Three days of sessions.' }
];

const TRACKS = [
  'Artificial Intelligence & Machine Learning',
  'Systems & Networking',
  'Human-Computer Interaction',
  'Security & Privacy',
  'Data Science & Analytics'
];

// Session slots the organizer assigns to accepted papers.
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00'];
const ROOMS = ['Hall A', 'Hall B', 'Room 101', 'Room 102', 'Online'];

// Ticket price = paper's conference fee x factor (fee is $299 for every paper).
const TICKET_TYPES = [
  { id: 'student', label: 'Student', factor: 0.5, note: 'Valid student ID required at check-in' },
  { id: 'academic', label: 'Academic / Author', factor: 1, note: 'Standard registration' },
  { id: 'industry', label: 'Industry', factor: 1.5, note: 'Corporate and industry attendees' }
];

// Promo codes. They stop working after validUntil.
const PROMO_CODES = {
  EARLYBIRD: { percent: 10, validUntil: '2027-02-15' },
  ACADEMIA20: { percent: 20, validUntil: '2027-03-18' }
};

const SEED_USERS = [
  { name: 'Dr. Alex Morgan', email: 'alex@university.edu', password: 'password123', role: 'Author' },
  { name: 'Prof. Sarah Jenkins', email: 'sarah@reviewer.org', password: 'password123', role: 'Reviewer' },
  { name: 'Sam Wilson', email: 'sam@gmail.com', password: 'password123', role: 'Participant' },
  { name: 'Admin Chair', email: 'admin@event.org', password: 'password123', role: 'Organizer' }
];

// Shows a "Demo accounts" helper under the sign-in form. Set to false before
// you show the site to anyone outside testing.
const SHOW_DEMO_ACCOUNTS = true;

const ROLE_GUIDE = [
  {
    role: 'Author',
    blurb: 'Submit your research',
    points: [
      'Submit title, abstract, keywords and track',
      'Automatic similarity score on every submission',
      'Follow review and decision on a live timeline',
      'Download your decision letter'
    ]
  },
  {
    role: 'Reviewer',
    blurb: 'Evaluate submissions',
    points: [
      'See every paper waiting for evaluation',
      'Score 1 to 5 and rate your confidence',
      'Write feedback for organizers and authors',
      'Keep a history of your reviews'
    ]
  },
  {
    role: 'Organizer',
    blurb: 'Run the conference',
    points: [
      'Approve or reject after peer review',
      'Build the session schedule without clashes',
      'Post announcements and check attendees in',
      'Export paper and attendee lists'
    ]
  },
  {
    role: 'Participant',
    blurb: 'Attend the program',
    points: [
      'Browse accepted papers by track',
      'Save sessions to your own schedule',
      'Pick a ticket type and register',
      'Get a badge and a certificate'
    ]
  }
];

/* ==========================================================================
   DESIGN TOKENS — institutional navy + maroon on a light background, serif
   headings, plain hairline-bordered cards. Only Tailwind's standard palette
   is used (no bg-[#hex] classes) so it renders in any Tailwind setup.
   ========================================================================== */
const UI = {
  page: 'min-h-screen bg-stone-100 text-slate-800',
  cardPad: 'bg-white border border-slate-200 rounded-lg p-5',
  statCard: 'bg-slate-50 border border-slate-200 rounded-lg p-4',
  heading: 'font-serif font-bold text-blue-900',
  label: 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5',
  input: 'w-full bg-white border border-slate-300 rounded-md p-3 text-sm text-slate-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900',
  primaryBtn: 'bg-red-800 hover:bg-red-900 text-white font-semibold rounded-md transition',
  secondaryBtn: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md transition',
  approveBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md transition',
  rejectBtn: 'bg-white border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded-md transition',
  chip: 'text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold'
};

/* ==========================================================================
   HELPERS
   ========================================================================== */
const pad2 = (n) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const daysUntil = (iso) => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((parseDate(iso) - t) / 86400000);
};
const formatDate = (iso, opts) =>
  parseDate(iso).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
const formatUSD = (n) => `$${Number(n).toFixed(2)}`;

const SESSION_DAYS = [0, 1, 2].map((i) => {
  const d = parseDate(CONFERENCE.startDate);
  d.setDate(d.getDate() + i);
  return {
    id: `day${i + 1}`,
    short: `Day ${i + 1}`,
    label: `Day ${i + 1} (${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`
  };
});

const sameEmail = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
// Older reviews were saved without an email, so fall back to the name.
const reviewBelongsTo = (r, user) => (r.reviewerEmail ? sameEmail(r.reviewerEmail, user.email) : r.reviewer === user.name);
const sameReviewer = (a, b) => (a.reviewerEmail && b.reviewerEmail ? sameEmail(a.reviewerEmail, b.reviewerEmail) : a.reviewer === b.reviewer);

const isPublished = (p) => p.status === 'Accepted' && p.organizerApproved === true;
const isFinalized = (p) => Boolean(p.finalDecision) || isPublished(p);
const isAwaitingDecision = (p) => p.reviews.length > 0 && !isFinalized(p);
const trackOf = (p) => p.track || 'General';
const hasSession = (p) => Boolean(p.session && p.session.day && p.session.time && p.session.room);

const averageScore = (reviews) => {
  if (!reviews || reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + Number(r.score || 0), 0) / reviews.length;
};

const sessionLabel = (p) => {
  if (!hasSession(p)) return 'Time to be announced';
  const day = SESSION_DAYS.find((d) => d.id === p.session.day);
  return `${day ? day.short : p.session.day}, ${p.session.time}, ${p.session.room}`;
};
const sessionSortKey = (p) => {
  if (!hasSession(p)) return 1e9;
  const d = SESSION_DAYS.findIndex((x) => x.id === p.session.day);
  return d * 10000 + TIME_SLOTS.indexOf(p.session.time) * 100 + ROOMS.indexOf(p.session.room);
};

const paperMatches = (p, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [p.title, p.authorName, p.track, (p.keywords || []).join(' '), p.abstract].join(' ').toLowerCase().includes(q);
};

const regAmount = (r, papers) => {
  if (typeof r.amountPaid === 'number') return r.amountPaid;
  const paper = papers.find((p) => p.id === r.paperId);
  return paper ? paper.conferenceFee : 299;
};

const ticketPrice = (paper, ticket) => Math.round(paper.conferenceFee * ticket.factor);

/* ==========================================================================
   PERSISTENCE — saves to the browser's localStorage so papers, reviews,
   registrations and accounts survive a page refresh.
   NOTE: this is a front-end demo. Passwords are stored in plain text in the
   browser, which is only acceptable for a demo. A real deployment needs a
   backend that stores salted password hashes (for example bcrypt).
   ========================================================================== */
const normalizePaper = (p) => ({ keywords: [], coAuthors: '', ...p, reviews: Array.isArray(p.reviews) ? p.reviews : [] });
const asList = (x) => (Array.isArray(x) ? x : null);
const asPapers = (x) => (Array.isArray(x) ? x.map(normalizePaper) : null);
const asObject = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);

function loadPersisted(key, fallback, migrate) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const out = migrate ? migrate(parsed) : parsed;
    return out == null ? fallback : out;
  } catch (e) {
    return fallback;
  }
}

function usePersistedState(key, initialValue, migrate) {
  const [value, setValue] = useState(() => loadPersisted(key, initialValue, migrate));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // storage unavailable (private mode); the app keeps working in memory
    }
  }, [key, value]);
  return [value, setValue];
}

/* ==========================================================================
   FILE EXPORTS (PDF + CSV)
   ========================================================================== */
function pdfEscape(str) {
  let out = '';
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0);
    if (ch === '\\' || ch === '(' || ch === ')') out += '\\' + ch;
    else if (c >= 32 && c <= 126) out += ch;
    else if (c >= 160 && c <= 255) out += '\\' + c.toString(8).padStart(3, '0');
    else out += '?';
  }
  return out;
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Builds a one-page PDF with a correct cross-reference table.
function downloadPdf(filename, { title, subtitle, blocks, footer, align = 'center' }) {
  const W = 612;
  const H = 792;
  const M = 64;
  let y = H - 116;
  let s = '2 w 30 30 552 732 re S\n0.6 w 38 38 536 716 re S\n';
  const text = (str, size, bold, x, yy) => `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${Math.round(x)} ${Math.round(yy)} Td (${pdfEscape(str)}) Tj ET\n`;
  const xFor = (str, size, bold, al) => (al === 'center' ? Math.max(M, (W - str.length * size * (bold ? 0.56 : 0.5)) / 2) : M);

  s += '0.478 0.122 0.239 rg\n';
  s += text(title, 22, true, xFor(title, 22, true, 'center'), y);
  s += '0 g\n';
  if (subtitle) {
    y -= 26;
    s += text(subtitle, 12, false, xFor(subtitle, 12, false, 'center'), y);
  }
  y -= 18;
  s += `0.5 w ${M} ${y} m ${W - M} ${y} l S\n`;
  y -= 44;

  for (const b of blocks) {
    const size = b.size || 12;
    const al = b.align || align;
    const maxChars = Math.floor((W - 2 * M) / (size * (b.bold ? 0.56 : 0.5)));
    for (const line of wrapText(b.text, maxChars)) {
      if (y < 100) break;
      s += text(line, size, Boolean(b.bold), xFor(line, size, Boolean(b.bold), al), y);
      y -= size * 1.55;
    }
    y -= b.gap == null ? 10 : b.gap;
  }
  if (footer) s += text(footer, 9, false, xFor(footer, 9, false, 'center'), 62);

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${s.length} >>\nstream\n${s}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  triggerDownload(new Blob([pdf], { type: 'application/pdf' }), filename);
}

function downloadCsv(filename, rows) {
  // A leading quote stops spreadsheet apps from running cells that start with = + - @
  const cell = (v) => {
    let t = String(v == null ? '' : v);
    if (/^[=+\-@]/.test(t)) t = "'" + t;
    return `"${t.replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

/* ==========================================================================
   SMALL SHARED COMPONENTS
   ========================================================================== */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-red-50 border-red-300 text-red-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900'
  };
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm" role="status" aria-live="polite">
      <div className={`flex items-start gap-3 border rounded-lg shadow-lg px-4 py-3 ${styles[toast.type] || styles.success}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose} aria-label="Dismiss message" className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = 'text-blue-900' }) {
  return (
    <div className={UI.statCard}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

const STATUS_STYLES = {
  Accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  'Reviewer Accepted': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Under Review': 'bg-blue-50 text-blue-700 border border-blue-200'
};
function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-md font-semibold ${STATUS_STYLES[status] || STATUS_STYLES['Under Review']}`}>
      {status}
    </span>
  );
}

function SimilarityBadge({ score }) {
  const tone = score <= 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`text-xs border px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${tone}`}>
      <SearchCheck className="w-3.5 h-3.5" /> {score}% similarity
    </span>
  );
}

function KeywordChips({ keywords }) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {keywords.map((k) => (
        <span key={k} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
          <Tag className="w-3 h-3" /> {k}
        </span>
      ))}
    </div>
  );
}

function SearchFilterBar({ search, setSearch, placeholder, filter, setFilter, options }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={UI.input + ' pl-9 py-2.5'}
        />
      </div>
      {options && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" className={UI.input + ' sm:w-56 py-2.5'}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function EmptyState({ children }) {
  return <div className={UI.statCard + ' text-center text-sm text-slate-500 py-8'}>{children}</div>;
}

function BarRow({ label, value, max, display }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span className="font-semibold text-slate-900">{display != null ? display : value}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-900 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Four-step progress tracker so authors always know where a paper stands.
function getTimeline(p) {
  const hasReviews = p.reviews.length > 0;
  const accepted = isPublished(p);
  const rejected = p.finalDecision === 'Rejected';
  let decision = { label: 'Organizer decision', state: 'todo' };
  if (accepted) decision = { label: 'Approved', state: 'done' };
  else if (rejected) decision = { label: 'Not accepted', state: 'failed' };
  else if (hasReviews) decision = { label: 'Organizer decision', state: 'current' };
  return [
    { label: 'Submitted', state: 'done' },
    { label: 'Peer review', state: hasReviews || accepted || rejected ? 'done' : 'current' },
    decision,
    { label: 'Published', state: accepted ? 'done' : 'todo' }
  ];
}

function PaperTimeline({ paper }) {
  const steps = getTimeline(paper);
  const circle = {
    done: 'bg-emerald-600 border-emerald-600 text-white',
    current: 'bg-white border-blue-900 text-blue-900',
    todo: 'bg-white border-slate-300 text-slate-300',
    failed: 'bg-red-700 border-red-700 text-white'
  };
  return (
    <ol className="flex items-start w-full list-none p-0 m-0" aria-label="Paper progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex-1 flex flex-col items-center text-center relative">
          {i > 0 && (
            <span
              className={`absolute top-3 right-1/2 w-full h-0.5 ${steps[i - 1].state === 'done' && s.state !== 'todo' ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
          )}
          <span className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${circle[s.state]}`}>
            {s.state === 'done' && <CheckCircle className="w-3.5 h-3.5" />}
            {s.state === 'failed' && <X className="w-3.5 h-3.5" />}
            {s.state === 'current' && <span className="w-2 h-2 rounded-full bg-blue-900" />}
          </span>
          <span className={`text-xs mt-1.5 font-semibold ${s.state === 'todo' ? 'text-slate-400' : 'text-slate-700'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

const API_BASE = '/api';

/* ==========================================================================
   AI SUMMARY PANEL — shown inside the Author "My Papers" card.
   Calls POST /api/ai/summarize with a JWT (from authToken in App state).
   ========================================================================== */
function AiSummaryPanel({ paper, authToken }) {
  const [summary, setSummary] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');

  const handleGenerateSummary = async () => {
    setSummary('');
    setError('');
    setLoading(true);
    try {
      const text = [paper.title, paper.abstract, (paper.keywords || []).join(', ')].join('\n\n');
      const res  = await fetch(API_BASE + '/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}),
        },
        body: JSON.stringify({ paperText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate summary.');
      setSummary(data.summary || '');
    } catch (err) {
      setError(err.message || 'Could not reach the AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3 border-t border-slate-200 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> AI Summary
        </h5>
        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={loading}
          className="text-xs font-semibold bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-md transition"
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="bg-blue-50 border border-blue-200 text-slate-700 text-sm p-4 rounded-md whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState({ isLoggedIn: false, role: null, name: '', email: '' });
  const [activeTab, setActiveTab] = useState('Overview');
  const [loginRole, setLoginRole] = useState('Author');
  const [toast, setToast] = useState(null);

  // JWT returned by the backend after a successful login or register.
  const [authToken, setAuthToken] = usePersistedState('academiaconf_token', null, (v) => (typeof v === 'string' ? v : null));

  const showToast = (message, type = 'success') => setToast({ id: Date.now(), message, type });

  // Database store (saved in this browser)
  const [registeredUsers, setRegisteredUsers] = usePersistedState('academiaconf_registeredUsers', SEED_USERS, asList);

  const [papers, setPapers] = usePersistedState(
    'academiaconf_papers',
    [
      {
        id: 101,
        title: 'AI-Driven Reviewer Assignment Optimization',
        abstract: 'Explores machine learning algorithms for matching reviewers with academic papers efficiently.',
        track: 'Artificial Intelligence & Machine Learning',
        keywords: ['machine learning', 'peer review', 'optimization'],
        coAuthors: '',
        authorName: 'Dr. Alex Morgan',
        authorEmail: 'alex@university.edu',
        status: 'Accepted',
        plagiarismScore: 4,
        reviews: [
          { reviewer: 'Prof. Sarah Jenkins', score: '5', comments: 'Excellent methodology and clear benchmarks.' }
        ],
        organizerApproved: true,
        conferenceFee: 299
      }
    ],
    asPapers
  );

  const [registrations, setRegistrations] = usePersistedState('academiaconf_registrations', [], asList);
  const [reviewHistory, setReviewHistory] = usePersistedState(
    'academiaconf_reviewHistory',
    [
      { paperId: 101, paperTitle: 'AI-Driven Reviewer Assignment Optimization', reviewer: 'Prof. Sarah Jenkins', score: '5', comments: 'Excellent methodology and clear benchmarks.', date: '2026-09-02' }
    ],
    asList
  );
  const [announcements, setAnnouncements] = usePersistedState(
    'academiaconf_announcements',
    [
      {
        id: 1,
        title: 'Call for papers is open',
        message: `Authors can now submit papers for ${CONFERENCE.name}. Submissions close on ${formatDate(IMPORTANT_DATES[0].date)}.`,
        date: '2026-10-01',
        postedBy: 'Admin Chair'
      }
    ],
    asList
  );
  const [schedules, setSchedules] = usePersistedState('academiaconf_schedules', {}, asObject);

  // Auth — tries the Express backend first; falls back to localStorage if the
  // backend is unreachable (e.g. backend not started yet during pure-frontend dev).
  const handleRegister = async (name, email, password, role) => {
    if (!name || name.length < 2) return { success: false, message: 'Please enter your full name.' };
    if (!password || password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
    // --- Backend call ---
    try {
      const res = await fetch(API_BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Registration failed.' };
      // Backend does not return a token on register — auto-login right away.
      const loginRes = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.token) {
        setAuthToken(loginData.token);
        const u = loginData.user;
        setSession({ isLoggedIn: true, role: u.role, name: u.name, email: u.email });
        setActiveTab('Overview');
        return { success: true };
      }
    } catch (_backendErr) {
      // Backend unavailable — fall through to localStorage fallback.
    }
    // --- localStorage fallback ---
    if (registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'This email is already registered. Please login instead.' };
    }
    setRegisteredUsers([...registeredUsers, { name, email, password, role }]);
    setSession({ isLoggedIn: true, role, name, email });
    setActiveTab('Overview');
    return { success: true };
  };

  const handleLogin = async (email, password, selectedRole) => {
    // --- Backend call ---
    try {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Login failed.' };
      if (data.user && data.user.role !== selectedRole) {
        return { success: false, message: `This account is registered as "${data.user.role}". Please select "${data.user.role}" in the role dropdown.` };
      }
      setAuthToken(data.token);
      const u = data.user;
      setSession({ isLoggedIn: true, role: u.role, name: u.name, email: u.email });
      setActiveTab('Overview');
      return { success: true };
    } catch (_backendErr) {
      // Backend unavailable — fall through to localStorage fallback.
    }
    // --- localStorage fallback ---
    const user = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, message: 'No account found. Please register first (or start the backend).' };
    if (user.password !== password) return { success: false, message: 'Incorrect password.' };
    if (user.role !== selectedRole) {
      return { success: false, message: `This account is "${user.role}". Please select "${user.role}" in the role dropdown.` };
    }
    setSession({ isLoggedIn: true, role: user.role, name: user.name, email: user.email });
    setActiveTab('Overview');
    return { success: true };
  };


  const handleLogout = () => {
    setSession({ isLoggedIn: false, role: null, name: '', email: '' });
    setActiveTab('Overview');
  };

  // Papers and reviews
  const handleAddPaper = (newPaper) => {
    const score = Math.floor(Math.random() * 10) + 1; // simulated similarity scan
    const nextId = Math.max(100, ...papers.map((p) => p.id)) + 1;
    setPapers([
      {
        id: nextId,
        ...newPaper,
        status: 'Under Review',
        plagiarismScore: score,
        reviews: [],
        organizerApproved: false,
        conferenceFee: 299,
        submittedOn: todayISO()
      },
      ...papers
    ]);
    showToast(`"${newPaper.title}" submitted. The similarity scan found ${score}%.`);
  };

  const handleAddReview = (paperId, reviewData) => {
    const target = papers.find((p) => p.id === paperId);
    if (!target) return;
    if (target.reviews.some((r) => sameReviewer(r, reviewData))) {
      showToast('You have already evaluated this paper.', 'error');
      return;
    }
    const isPassed = Number(reviewData.score) >= 3;
    const finalized = isFinalized(target);
    setPapers((prev) =>
      prev.map((paper) =>
        paper.id === paperId
          ? {
              ...paper,
              // once the organizer has decided, a late review must not undo that decision
              status: finalized ? paper.status : isPassed ? 'Reviewer Accepted' : 'Rejected',
              reviews: [...paper.reviews, reviewData]
            }
          : paper
      )
    );
    setReviewHistory((prev) => [{ paperId, paperTitle: target.title, ...reviewData, date: todayISO() }, ...prev]);
    showToast('Evaluation submitted. It is now visible on the Organizer panel.');
  };

  const handleOrganizerApprove = (paperId) => {
    setPapers(papers.map((p) => (p.id === paperId ? { ...p, status: 'Accepted', organizerApproved: true, finalDecision: 'Accepted' } : p)));
    showToast('Paper approved and published for participant registration.');
  };

  const handleOrganizerReject = (paperId) => {
    setPapers(papers.map((p) => (p.id === paperId ? { ...p, status: 'Rejected', organizerApproved: false, finalDecision: 'Rejected' } : p)));
    showToast('Paper rejected.', 'info');
  };

  const handleUpdateSession = (paperId, field, value) => {
    const target = papers.find((p) => p.id === paperId);
    if (!target) return;
    const next = { ...(target.session || {}), [field]: value };
    if (next.day && next.time && next.room) {
      const clash = papers.find(
        (p) => p.id !== paperId && p.session && p.session.day === next.day && p.session.time === next.time && p.session.room === next.room
      );
      if (clash) {
        showToast(`That slot is already used by Paper #${clash.id}. Choose a different time or room.`, 'error');
        return;
      }
    }
    setPapers(papers.map((p) => (p.id === paperId ? { ...p, session: next } : p)));
  };

  // Registrations
  const handleRegisterParticipant = (regData) => {
    if (registrations.some((r) => sameEmail(r.userEmail, regData.userEmail) && r.paperId === regData.paperId)) return null;
    let transactionId;
    do {
      transactionId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    } while (registrations.some((r) => r.transactionId === transactionId));
    const reg = { ...regData, transactionId, registeredOn: todayISO(), checkedIn: false };
    setRegistrations([reg, ...registrations]);
    showToast(`Registration confirmed. Your registration ID is ${transactionId}.`);
    return reg;
  };

  const handleToggleCheckIn = (transactionId) => {
    setRegistrations(registrations.map((r) => (r.transactionId === transactionId ? { ...r, checkedIn: !r.checkedIn } : r)));
  };

  // Participant schedule
  const handleToggleSchedule = (email, paperId) => {
    const key = email.toLowerCase();
    const current = schedules[key] || [];
    const adding = !current.includes(paperId);
    setSchedules({ ...schedules, [key]: adding ? [...current, paperId] : current.filter((id) => id !== paperId) });
    showToast(adding ? 'Session saved to your schedule.' : 'Session removed from your schedule.', 'info');
  };

  // Announcements
  const handlePostAnnouncement = ({ title, message }) => {
    const nextId = Math.max(0, ...announcements.map((a) => a.id)) + 1;
    setAnnouncements([{ id: nextId, title, message, date: todayISO(), postedBy: session.name }, ...announcements]);
    showToast('Announcement posted. Everyone will see it under Notifications.');
  };
  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
    showToast('Announcement removed.', 'info');
  };

  const data = { papers, registrations, reviewHistory, registeredUsers, announcements, schedules };
  const actions = {
    addPaper: handleAddPaper,
    addReview: handleAddReview,
    approve: handleOrganizerApprove,
    reject: handleOrganizerReject,
    updateSession: handleUpdateSession,
    registerParticipant: handleRegisterParticipant,
    toggleCheckIn: handleToggleCheckIn,
    toggleSchedule: handleToggleSchedule,
    postAnnouncement: handlePostAnnouncement,
    deleteAnnouncement: handleDeleteAnnouncement,
    showToast
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }} className={UI.page + ' flex flex-col'}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {!session.isLoggedIn ? (
        <LandingAndAuthPage
          loginRole={loginRole}
          setLoginRole={setLoginRole}
          onLogin={handleLogin}
          onRegister={handleRegister}
          papers={papers}
          registrations={registrations}
        />
      ) : (
        <DashboardView
          session={session}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          data={data}
          actions={actions}
          authToken={authToken}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   1. PUBLIC EVENT PAGE + SIGN IN
   Modeled on the event websites in the platform review: event hero, key
   dates, tracks, a public program built from accepted papers, and how each
   role uses the portal.
   ========================================================================== */
function LandingAndAuthPage({ loginRole, setLoginRole, onLogin, onRegister, papers, registrations }) {
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showDemo, setShowDemo] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const goToAuth = (mode, role) => {
    setAuthMode(mode);
    setLoginRole(role);
    setAuthError('');
    const el = document.getElementById('auth-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const email = form.email.trim();
    const result =
      authMode === 'register'
        ? await onRegister(form.name.trim(), email, form.password, loginRole)
        : await onLogin(email, form.password, loginRole);
    if (!result.success) setAuthError(result.message);
  };

  const accepted = papers.filter(isPublished).sort((a, b) => sessionSortKey(a) - sessionSortKey(b));
  const nextDate = IMPORTANT_DATES.find((d) => daysUntil(d.date) >= 0);
  const stats = [
    { label: 'Papers submitted', value: papers.length },
    { label: 'Papers accepted', value: accepted.length },
    { label: 'Registered attendees', value: registrations.length },
    { label: 'Conference tracks', value: TRACKS.length }
  ];
  const trackNames = Array.from(new Set([...TRACKS, ...papers.map(trackOf).filter((t) => t !== 'General')]));

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <nav className="border-b border-slate-200 bg-white px-6 py-3.5 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 p-2 rounded-md text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-blue-900">AcademiaConf Portal</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#dates" className="hover:text-blue-900">Important dates</a>
          <a href="#tracks" className="hover:text-blue-900">Tracks</a>
          <a href="#program" className="hover:text-blue-900">Program</a>
          <a href="#roles" className="hover:text-blue-900">How it works</a>
          <button onClick={() => goToAuth('login', loginRole)} className={UI.primaryBtn + ' px-4 py-2 text-sm'}>Sign in</button>
        </div>
        <button onClick={() => goToAuth('login', loginRole)} className={UI.primaryBtn + ' md:hidden px-3 py-1.5 text-sm'}>Sign in</button>
      </nav>

      {/* Hero */}
      <header className="bg-blue-900 text-white px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            {nextDate && (
              <div className="inline-flex items-center gap-2 text-sm bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-md">
                <Clock className="w-4 h-4" />
                {nextDate.label}: {formatDate(nextDate.date)}
                {daysUntil(nextDate.date) > 0 && <span className="font-semibold">({daysUntil(nextDate.date)} days left)</span>}
              </div>
            )}
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">{CONFERENCE.name}</h1>
              <p className="font-serif text-xl text-slate-200 mt-2">{CONFERENCE.title}</p>
            </div>
            <div className="w-16 h-1 bg-red-700" />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 text-sm text-slate-100">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {CONFERENCE.dateLabel}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {CONFERENCE.venue}</span>
            </div>
            <p className="text-slate-200 text-base leading-relaxed max-w-xl">{CONFERENCE.description}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button onClick={() => goToAuth('register', 'Author')} className={UI.primaryBtn + ' px-5 py-3 text-sm flex items-center gap-2'}>
                Submit a paper <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToAuth('register', 'Participant')}
                className="border border-white/40 hover:bg-white/10 text-white font-semibold rounded-md transition px-5 py-3 text-sm"
              >
                Register to attend
              </button>
            </div>
          </div>

          <div className="lg:col-span-5" id="auth-card">
            <div className="bg-white rounded-lg shadow-xl p-7 space-y-5 text-slate-800">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-xl font-bold text-blue-900">
                    {authMode === 'login' ? 'Portal Sign In' : 'Register Account'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Strict email & role authentication</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                  className="text-xs font-semibold text-red-800 hover:underline"
                >
                  {authMode === 'login' ? 'Need Account?' : 'Back to Login'}
                </button>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2 text-xs text-red-700" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="auth-role" className={UI.label}>Select Account Role</label>
                  <select
                    id="auth-role"
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value)}
                    className={UI.input + ' font-semibold cursor-pointer'}
                  >
                    <option value="Author">Author (Submit Papers)</option>
                    <option value="Reviewer">Reviewer (Evaluate Papers)</option>
                    <option value="Participant">Participant (Attend & Register)</option>
                    <option value="Organizer">Organizer (Admin & Final Approval)</option>
                  </select>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label htmlFor="auth-name" className={UI.label}>Full Name</label>
                    <input id="auth-name" type="text" required placeholder="e.g. Dr. Alex Morgan" value={form.name} onChange={setField('name')} className={UI.input} />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className={UI.label}>Email Address</label>
                  <input id="auth-email" type="email" required placeholder="name@domain.com" autoComplete="email" value={form.email} onChange={setField('email')} className={UI.input} />
                </div>

                <div>
                  <label htmlFor="auth-password" className={UI.label}>Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={setField('password')}
                    className={UI.input}
                  />
                  {authMode === 'register' && <p className="text-xs text-slate-500 mt-1">At least 6 characters.</p>}
                </div>

                <button type="submit" className={UI.primaryBtn + ' w-full py-3.5 flex items-center justify-center gap-2 text-sm'}>
                  {authMode === 'login' ? `Sign In as ${loginRole}` : `Register as ${loginRole}`} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {SHOW_DEMO_ACCOUNTS && authMode === 'login' && (
                <div className="border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => setShowDemo(!showDemo)} className="text-xs font-semibold text-slate-600 hover:text-blue-900">
                    {showDemo ? 'Hide demo accounts' : 'Show demo accounts for testing'}
                  </button>
                  {showDemo && (
                    <ul className="mt-3 space-y-2">
                      {SEED_USERS.map((u) => (
                        <li key={u.email} className="flex items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                          <span className="min-w-0">
                            <span className="font-bold text-slate-800">{u.role}</span>
                            <span className="block text-slate-500 truncate">{u.email}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => { setLoginRole(u.role); setForm({ name: '', email: u.email, password: u.password }); setAuthError(''); }}
                            className="font-semibold text-red-800 hover:underline shrink-0"
                          >
                            Fill form
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Live numbers from the real data */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-3xl font-bold text-blue-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Important dates */}
      <section id="dates" className="px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-blue-900">Important dates</h2>
          <p className="text-slate-600 mt-1 mb-6 max-w-2xl">Every stage of the portal follows this timeline, from the first submission to the opening session.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {IMPORTANT_DATES.map((d) => {
              const left = daysUntil(d.date);
              const isNext = nextDate && nextDate.date === d.date;
              return (
                <div key={d.label} className={`bg-white border rounded-lg p-5 border-t-4 ${isNext ? 'border-slate-200 border-t-red-800' : 'border-slate-200 border-t-slate-300'}`}>
                  <div className="font-serif text-xl font-bold text-slate-900">{formatDate(d.date, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">{d.label}</div>
                  <p className="text-sm text-slate-500 mt-2">{d.note}</p>
                  <div className={`text-xs font-semibold mt-3 ${left < 0 ? 'text-slate-400' : isNext ? 'text-red-800' : 'text-slate-500'}`}>
                    {left < 0 ? 'Closed' : left === 0 ? 'Today' : `${left} days left`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="px-6 py-14 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-blue-900">Conference tracks</h2>
          <p className="text-slate-600 mt-1 mb-6 max-w-2xl">Authors choose a track when they submit. The counts below update as papers come in and get accepted.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackNames.map((t) => {
              const inTrack = papers.filter((p) => trackOf(p) === t);
              return (
                <div key={t} className="border border-slate-200 rounded-lg p-5 flex gap-3 items-start">
                  <Layers className="w-5 h-5 text-red-800 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">{t}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {inTrack.filter(isPublished).length} accepted of {inTrack.length} submitted
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public program */}
      <section id="program" className="px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-blue-900">Conference program</h2>
          <p className="text-slate-600 mt-1 mb-6 max-w-2xl">Accepted papers appear here once the organizers approve them and assign a session.</p>
          {accepted.length === 0 ? (
            <EmptyState>No papers have been accepted yet. The program will appear here after organizers approve papers.</EmptyState>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {accepted.slice(0, 8).map((p) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="sm:w-56 shrink-0 text-sm font-semibold text-red-800">{sessionLabel(p)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    <div className="text-sm text-slate-500">{p.authorName}</div>
                  </div>
                  <span className={UI.chip + ' self-start sm:self-center'}>{trackOf(p)}</span>
                </div>
              ))}
              {accepted.length > 8 && (
                <div className="p-4 text-sm text-slate-500">
                  {accepted.length - 8} more sessions. Sign in as a participant to browse the full program.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="roles" className="px-6 py-14 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-blue-900">How the portal works</h2>
          <p className="text-slate-600 mt-1 mb-6 max-w-2xl">One portal, four roles. Pick the one that matches what you want to do.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_GUIDE.map((r) => (
              <div key={r.role} className="border border-slate-200 rounded-lg p-5 flex flex-col">
                <div className="font-serif text-lg font-bold text-slate-900">{r.role}</div>
                <div className="text-sm text-red-800 font-semibold mb-3">{r.blurb}</div>
                <ul className="space-y-2 text-sm text-slate-600 flex-1">
                  {r.points.map((pt) => (
                    <li key={pt} className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {pt}</li>
                  ))}
                </ul>
                <button onClick={() => goToAuth('login', r.role)} className="mt-4 text-sm font-semibold text-blue-900 hover:underline text-left">
                  Sign in as {r.role}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-blue-950 text-slate-300 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between gap-3 text-sm">
          <div>
            <div className="font-serif font-bold text-white">{CONFERENCE.name}</div>
            <div>{CONFERENCE.title}</div>
          </div>
          <div className="md:text-right text-slate-400">
            Demo environment. Accounts and data are stored in this browser only.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ==========================================================================
   2. DASHBOARD SHELL
   ========================================================================== */
function DashboardView({ session, activeTab, setActiveTab, onLogout, data, actions, authToken }) {
  const { papers } = data;

  const navFor = (role) => {
    switch (role) {
      case 'Author':
        return [
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Submit Paper', icon: Send },
          { name: 'My Papers', icon: FileText },
          { name: 'Notifications', icon: Bell },
          { name: 'Profile', icon: User }
        ];
      case 'Reviewer':
        return [
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Assigned Papers', icon: BookOpen },
          { name: 'Review History', icon: Clock },
          { name: 'Notifications', icon: Bell },
          { name: 'Profile', icon: User }
        ];
      case 'Participant':
        return [
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Conference Papers', icon: BookOpen },
          { name: 'My Schedule', icon: Bookmark },
          { name: 'Register for Paper', icon: CheckCircle },
          { name: 'Certificate', icon: Award },
          { name: 'Notifications', icon: Bell },
          { name: 'Profile', icon: User }
        ];
      case 'Organizer':
        return [
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Paper Approvals', icon: FileText },
          { name: 'Program Schedule', icon: Calendar },
          { name: 'Manage Reviewers', icon: Users },
          { name: 'All Participants', icon: Users },
          { name: 'Reports', icon: BarChart3 },
          { name: 'Announcements', icon: Megaphone },
          { name: 'Notifications', icon: Bell },
          { name: 'Profile', icon: User }
        ];
      default:
        return [];
    }
  };

  // Small counters on the sidebar so each role sees what needs attention.
  const badgeFor = (name) => {
    if (session.role === 'Reviewer' && name === 'Assigned Papers') {
      return papers.filter((p) => !p.reviews.some((r) => reviewBelongsTo(r, session))).length;
    }
    if (session.role === 'Organizer' && name === 'Paper Approvals') return papers.filter(isAwaitingDecision).length;
    return 0;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-64 bg-blue-950 text-white p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="bg-red-800 p-2 rounded-md text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-none">{session.role} Workspace</h3>
              <span className="text-xs text-slate-400 font-semibold mt-1 block">{CONFERENCE.name}</span>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-1 md:block md:space-y-1" aria-label="Dashboard sections">
            {navFor(session.role).map((item) => {
              const Icon = item.icon;
              const badge = badgeFor(item.name);
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  aria-current={activeTab === item.name ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition ${
                    activeTab === item.name ? 'bg-red-800 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {badge > 0 && (
                    <span className="bg-amber-400 text-slate-900 rounded-full px-1.5 min-w-5 text-center text-xs font-bold">{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-6">
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{session.name}</p>
            <p className="text-xs text-slate-400 truncate">{session.email}</p>
          </div>
          <button onClick={onLogout} title="Logout" aria-label="Logout" className="text-slate-400 hover:text-white p-2 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-stone-100 p-5 md:p-8 space-y-6 overflow-y-auto min-w-0">
        <div className="flex justify-between items-center pb-4 border-b border-slate-300 gap-4">
          <div>
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">{session.role} Panel</span>
            <h2 className={UI.heading + ' text-2xl mt-1'}>{activeTab}</h2>
          </div>
          <div className="hidden sm:block text-right text-xs text-slate-500">
            <div className="font-semibold text-slate-700">{CONFERENCE.name}</div>
            <div>{CONFERENCE.dateLabel}</div>
          </div>
        </div>

        <div className={UI.cardPad + ' min-h-[450px]'}>
          <TabRenderer
            role={session.role}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={session}
            data={data}
            actions={actions}
          />
        </div>
      </main>
    </div>
  );
}

/* ==========================================================================
   FORMS THAT NEED THEIR OWN STATE
   ========================================================================== */
function SubmitPaperForm({ user, onAddPaper, setActiveTab }) {
  const [form, setForm] = useState({ title: '', track: '', abstract: '', keywords: '', coAuthors: '', declared: false });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const keywords = Array.from(new Set(form.keywords.split(',').map((k) => k.trim()).filter(Boolean)));
    const next = {};
    if (!form.title.trim()) next.title = 'Enter the paper title.';
    if (!form.track) next.track = 'Choose a track.';
    if (!form.abstract.trim()) next.abstract = 'Enter the abstract.';
    if (keywords.length > 6) next.keywords = 'Use at most 6 keywords.';
    if (file && file.size > 10 * 1024 * 1024) next.file = 'The file is larger than 10 MB.';
    if (!form.declared) next.declared = 'Confirm the declaration to submit.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsScanning(true);
    timerRef.current = setTimeout(() => {
      onAddPaper({
        title: form.title.trim(),
        abstract: form.abstract.trim(),
        track: form.track,
        keywords,
        coAuthors: form.coAuthors.trim(),
        fileName: file ? file.name : '',
        authorName: user.name,
        authorEmail: user.email
      });
      setIsScanning(false);
      setActiveTab('My Papers');
    }, 1200);
  };

  const Err = ({ id }) => (errors[id] ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors[id]}</p> : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl relative" noValidate>
      {isScanning && (
        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center gap-2 rounded-lg" role="status">
          <SearchCheck className="w-8 h-8 text-red-800" />
          <p className="text-sm font-bold text-slate-900">Running similarity scan</p>
          <p className="text-xs text-slate-500">Checking your manuscript before it goes to reviewers.</p>
        </div>
      )}

      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h3 className={UI.heading + ' text-lg'}>Submit Research Paper</h3>
        <span className="text-xs bg-slate-50 text-slate-700 px-3 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-semibold">
          <SearchCheck className="w-3.5 h-3.5 text-red-800" /> Similarity scan runs on submit
        </span>
      </div>

      <div>
        <label htmlFor="sp-title" className={UI.label}>Paper Title</label>
        <input id="sp-title" type="text" value={form.title} onChange={set('title')} placeholder="Title of paper..." className={UI.input} />
        <Err id="title" />
      </div>

      <div>
        <label htmlFor="sp-track" className={UI.label}>Track</label>
        <select id="sp-track" value={form.track} onChange={set('track')} className={UI.input}>
          <option value="">Select a track...</option>
          {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Err id="track" />
      </div>

      <div>
        <label htmlFor="sp-abstract" className={UI.label}>Abstract</label>
        <textarea id="sp-abstract" rows="5" maxLength={2000} value={form.abstract} onChange={set('abstract')} placeholder="Paper summary..." className={UI.input}></textarea>
        <div className="flex justify-between">
          <Err id="abstract" />
          <span className="text-xs text-slate-400 ml-auto">{form.abstract.length} / 2000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sp-keywords" className={UI.label}>Keywords</label>
          <input id="sp-keywords" type="text" value={form.keywords} onChange={set('keywords')} placeholder="e.g. neural networks, optimization" className={UI.input} />
          <p className="text-xs text-slate-500 mt-1">Separate with commas. Up to 6.</p>
          <Err id="keywords" />
        </div>
        <div>
          <label htmlFor="sp-coauthors" className={UI.label}>Co-authors (optional)</label>
          <input id="sp-coauthors" type="text" value={form.coAuthors} onChange={set('coAuthors')} placeholder="e.g. Dr. Jane Doe, Prof. Mike Chen" className={UI.input} />
        </div>
      </div>

      <div>
        <span className={UI.label}>Manuscript (PDF, optional)</span>
        <label className="flex items-center gap-3 w-full bg-slate-50 border border-dashed border-slate-300 rounded-md p-4 text-sm text-slate-500 cursor-pointer hover:border-red-800 focus-within:border-red-800 transition">
          <Paperclip className="w-4 h-4 shrink-0" />
          {file ? <span className="text-slate-900 font-semibold">{file.name}</span> : <span>Click to attach your manuscript (max 10 MB)</span>}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          />
        </label>
        <Err id="file" />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.declared} onChange={set('declared')} className="mt-1" />
          <span>I confirm this is original work and all authors agree to this submission.</span>
        </label>
        <Err id="declared" />
      </div>

      <button type="submit" disabled={isScanning} className={UI.primaryBtn + ' text-sm px-5 py-3 flex items-center gap-2 disabled:opacity-60'}>
        <Send className="w-4 h-4" /> Submit & Run Similarity Scan
      </button>
    </form>
  );
}

function RegistrationForm({ paper, user, onRegister, onDone }) {
  const [name, setName] = useState(user.name);
  const [institution, setInstitution] = useState('');
  const [ticketId, setTicketId] = useState('academic');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null); // { code, percent }
  const [promoMsg, setPromoMsg] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState({});

  const ticket = TICKET_TYPES.find((t) => t.id === ticketId);
  const base = ticketPrice(paper, ticket);
  const discount = promo ? Math.round((base * promo.percent) / 100) : 0;
  const total = base - discount;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const found = PROMO_CODES[code];
    if (!found) { setPromo(null); setPromoMsg('This promo code is not recognised.'); return; }
    if (todayISO() > found.validUntil) { setPromo(null); setPromoMsg('This promo code has expired.'); return; }
    setPromo({ code, percent: found.percent });
    setPromoMsg('');
  };

  const handleCard = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
    setCard(digits.replace(/(.{4})/g, '$1 ').trim());
  };
  const handleExpiry = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = 'Enter the name for your badge and certificate.';
    if (!institution.trim()) next.institution = 'Enter your institution or organization.';
    const digits = card.replace(/\s/g, '');
    if (digits.length < 13 || digits.length > 19) next.card = 'Enter a valid card number.';
    const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) next.expiry = 'Use the format MM/YY.';
    else {
      const now = new Date();
      const expYear = 2000 + Number(m[2]);
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && Number(m[1]) < now.getMonth() + 1)) next.expiry = 'This card has expired.';
    }
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = 'Enter the 3 or 4 digit code.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const reg = onRegister({
      userName: name.trim(),
      userEmail: user.email,
      paperId: paper.id,
      paperTitle: paper.title,
      institution: institution.trim(),
      ticketType: ticket.id,
      ticketLabel: ticket.label,
      amountPaid: total,
      promoCode: promo ? promo.code : ''
    });
    if (!reg) { setErrors({ form: 'You are already registered for this paper.' }); return; }
    onDone();
  };

  const Err = ({ id }) => (errors[id] ? <p className="text-xs text-red-600 mt-1">{errors[id]}</p> : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-700" role="alert">{errors.form}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rg-name" className={UI.label}>Name on badge and certificate</label>
          <input id="rg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={UI.input} />
          <Err id="name" />
        </div>
        <div>
          <label htmlFor="rg-inst" className={UI.label}>Institution / Organization</label>
          <input id="rg-inst" type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. Stanford University" className={UI.input} />
          <Err id="institution" />
        </div>
      </div>

      <fieldset>
        <legend className={UI.label}>Ticket type</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TICKET_TYPES.map((t) => (
            <label
              key={t.id}
              className={`border rounded-lg p-3.5 cursor-pointer transition ${ticketId === t.id ? 'border-red-800 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}
            >
              <input type="radio" name="ticket" value={t.id} checked={ticketId === t.id} onChange={() => setTicketId(t.id)} className="sr-only" />
              <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm"><Ticket className="w-4 h-4 text-red-800" /> {t.label}</div>
              <div className="text-lg font-bold text-blue-900 mt-1">{formatUSD(ticketPrice(paper, t))}</div>
              <div className="text-xs text-slate-500 mt-1">{t.note}</div>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="rg-promo" className={UI.label}>Promo code</label>
        <div className="flex gap-2">
          <input id="rg-promo" type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Enter code" className={UI.input + ' sm:max-w-xs'} />
          <button type="button" onClick={applyPromo} className={UI.secondaryBtn + ' px-4 text-sm'}>Apply</button>
          {promo && <button type="button" onClick={() => { setPromo(null); setPromoInput(''); }} className="text-sm text-slate-500 hover:underline">Remove</button>}
        </div>
        {promoMsg && <p className="text-xs text-red-600 mt-1">{promoMsg}</p>}
        {promo && <p className="text-xs text-emerald-700 mt-1">{promo.code} applied: {promo.percent}% off.</p>}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-slate-600"><span>{ticket.label} ticket</span><span>{formatUSD(base)}</span></div>
        {promo && <div className="flex justify-between text-emerald-700"><span>Promo {promo.code} ({promo.percent}% off)</span><span>-{formatUSD(discount)}</span></div>}
        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2"><span>Total</span><span>{formatUSD(total)} USD</span></div>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <h4 className="text-sm font-bold text-blue-900">Payment</h4>
        <p className="text-xs text-slate-500">Demo checkout: no payment is processed and card details are never saved.</p>
        <div>
          <label htmlFor="rg-card" className={UI.label}>Card number</label>
          <input id="rg-card" type="text" inputMode="numeric" autoComplete="off" value={card} onChange={handleCard} placeholder="4242 4242 4242 4242" className={UI.input} />
          <Err id="card" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rg-exp" className={UI.label}>Expiry</label>
            <input id="rg-exp" type="text" inputMode="numeric" autoComplete="off" value={expiry} onChange={handleExpiry} placeholder="MM/YY" className={UI.input} />
            <Err id="expiry" />
          </div>
          <div>
            <label htmlFor="rg-cvc" className={UI.label}>CVC</label>
            <input id="rg-cvc" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))} placeholder="123" className={UI.input} />
            <Err id="cvc" />
          </div>
        </div>
      </div>

      <button type="submit" className={UI.primaryBtn + ' w-full py-3.5 flex items-center justify-center gap-2 text-sm'}>
        <CreditCard className="w-4 h-4" /> Confirm Payment ({formatUSD(total)})
      </button>
    </form>
  );
}

/* ==========================================================================
   3. TAB CONTENT
   ========================================================================== */
function buildNotifications(role, user, data) {
  const { papers, registrations } = data;
  const items = [];
  if (role === 'Author') {
    const mine = papers.filter((p) => sameEmail(p.authorEmail, user.email));
    if (mine.length === 0) items.push({ tone: 'info', icon: Send, text: `You have not submitted a paper yet. Submissions close on ${formatDate(IMPORTANT_DATES[0].date)}.` });
    mine.forEach((p) => {
      p.reviews.forEach((r) => items.push({ tone: 'info', icon: Star, text: `"${p.title}" received a review from ${r.reviewer} (${r.score}/5).` }));
      if (isPublished(p)) items.push({ tone: 'success', icon: CheckCircle, text: `"${p.title}" was approved and is published in the program.` });
      else if (p.finalDecision === 'Rejected') items.push({ tone: 'error', icon: XCircle, text: `"${p.title}" was not accepted for this conference.` });
      else if (p.reviews.length === 0) items.push({ tone: 'warn', icon: Clock, text: `"${p.title}" is waiting for its first review.` });
    });
  } else if (role === 'Reviewer') {
    const pending = papers.filter((p) => !p.reviews.some((r) => reviewBelongsTo(r, user)));
    items.push(
      pending.length > 0
        ? { tone: 'warn', icon: Bell, text: `${pending.length} paper${pending.length === 1 ? '' : 's'} waiting for your evaluation.` }
        : { tone: 'success', icon: CheckCircle, text: 'You are all caught up. Every paper has your evaluation.' }
    );
  } else if (role === 'Participant') {
    const mine = registrations.filter((r) => sameEmail(r.userEmail, user.email));
    mine.forEach((r) => items.push({ tone: 'success', icon: CheckCircle, text: `Registration confirmed for "${r.paperTitle}". ID ${r.transactionId}.` }));
    const open = papers.filter(isPublished).filter((p) => !mine.some((r) => r.paperId === p.id));
    if (open.length > 0) items.push({ tone: 'info', icon: BookOpen, text: `${open.length} accepted paper${open.length === 1 ? ' is' : 's are'} open for registration.` });
  } else if (role === 'Organizer') {
    const awaiting = papers.filter(isAwaitingDecision).length;
    const unreviewed = papers.filter((p) => p.reviews.length === 0 && !isFinalized(p)).length;
    const unscheduled = papers.filter((p) => isPublished(p) && !hasSession(p)).length;
    if (awaiting > 0) items.push({ tone: 'warn', icon: FileText, text: `${awaiting} reviewed paper${awaiting === 1 ? '' : 's'} waiting for your final decision.` });
    if (unreviewed > 0) items.push({ tone: 'info', icon: Clock, text: `${unreviewed} paper${unreviewed === 1 ? ' has' : 's have'} no reviews yet.` });
    if (unscheduled > 0) items.push({ tone: 'warn', icon: Calendar, text: `${unscheduled} accepted paper${unscheduled === 1 ? ' needs' : 's need'} a session slot.` });
    items.push({ tone: 'info', icon: Users, text: `${registrations.length} attendee${registrations.length === 1 ? '' : 's'} registered so far.` });
  }
  return items;
}

const TONE = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-slate-50 border-slate-200 text-slate-700'
};

function TabRenderer({ role, activeTab, setActiveTab, user, data, actions }) {
  const { papers, registrations, reviewHistory, registeredUsers, announcements, schedules } = data;
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedPaperForReg, setSelectedPaperForReg] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Search boxes start fresh on every tab
  useEffect(() => {
    setSearch('');
    setFilter('All');
  }, [activeTab]);

  const acceptedPapers = papers.filter(isPublished);
  const mySchedule = schedules[user.email.toLowerCase()] || [];

  /* ---------- Overview ---------- */
  if (activeTab === 'Overview') {
    const mySubmissions = papers.filter((p) => sameEmail(p.authorEmail, user.email));
    const myAccepted = mySubmissions.filter(isPublished);
    const myReviews = reviewHistory.filter((r) => reviewBelongsTo(r, user));
    const pendingForMe = papers.filter((p) => !p.reviews.some((r) => reviewBelongsTo(r, user)));
    const myRegistrations = registrations.filter((r) => sameEmail(r.userEmail, user.email));
    const awaiting = papers.filter(isAwaitingDecision);
    const unscheduled = acceptedPapers.filter((p) => !hasSession(p));
    const nextDate = IMPORTANT_DATES.find((d) => daysUntil(d.date) >= 0);

    const steps = [];
    if (role === 'Author') {
      steps.push({ text: mySubmissions.length === 0 ? 'Submit your first paper.' : 'Submit another paper.', label: 'Submit Paper', tab: 'Submit Paper' });
      if (mySubmissions.length > 0) steps.push({ text: 'Check review progress and decisions.', label: 'My Papers', tab: 'My Papers' });
    } else if (role === 'Reviewer') {
      steps.push(
        pendingForMe.length > 0
          ? { text: `${pendingForMe.length} paper${pendingForMe.length === 1 ? ' needs' : 's need'} your evaluation.`, label: 'Open queue', tab: 'Assigned Papers' }
          : { text: 'You have evaluated every paper.', label: 'Review History', tab: 'Review History' }
      );
    } else if (role === 'Participant') {
      steps.push({ text: `${acceptedPapers.length} accepted paper${acceptedPapers.length === 1 ? ' is' : 's are'} open for registration.`, label: 'Browse papers', tab: 'Conference Papers' });
      if (mySchedule.length > 0) steps.push({ text: `${mySchedule.length} session${mySchedule.length === 1 ? '' : 's'} saved to your schedule.`, label: 'My Schedule', tab: 'My Schedule' });
    } else if (role === 'Organizer') {
      steps.push({ text: `${awaiting.length} paper${awaiting.length === 1 ? ' is' : 's are'} waiting for a final decision.`, label: 'Paper Approvals', tab: 'Paper Approvals' });
      if (unscheduled.length > 0) steps.push({ text: `${unscheduled.length} accepted paper${unscheduled.length === 1 ? ' needs' : 's need'} a session slot.`, label: 'Program Schedule', tab: 'Program Schedule' });
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className={UI.heading + ' text-xl'}>Welcome, {user.name}</h3>
          <p className="text-sm text-slate-500 mt-1">Logged in as <strong className="text-red-800">{role}</strong>.</p>
        </div>

        {role === 'Author' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="My Submissions" value={mySubmissions.length} />
            <StatCard label="My Accepted Papers" value={myAccepted.length} tone="text-emerald-700" />
            <StatCard label="Similarity Scan" value="Automatic" tone="text-red-800" />
          </div>
        )}
        {role === 'Reviewer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Papers Available for Review" value={papers.length} />
            <StatCard label="Pending My Evaluation" value={pendingForMe.length} tone="text-amber-700" />
            <StatCard label="Reviews Completed By Me" value={myReviews.length} tone="text-red-800" />
          </div>
        )}
        {role === 'Participant' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Available Conferences" value={acceptedPapers.length} />
            <StatCard label="My Registrations" value={myRegistrations.length} tone="text-emerald-700" />
            <StatCard label="Saved Sessions" value={mySchedule.length} tone="text-blue-900" />
            <StatCard label="Earned Certificates" value={myRegistrations.length} tone="text-red-800" />
          </div>
        )}
        {role === 'Organizer' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Paper Submissions" value={papers.length} />
            <StatCard label="Awaiting My Decision" value={awaiting.length} tone="text-amber-700" />
            <StatCard label="Published Conferences" value={acceptedPapers.length} tone="text-emerald-700" />
            <StatCard label="Total Attendees" value={registrations.length} tone="text-red-800" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={UI.statCard + ' space-y-1'}>
            <div className="text-xs font-semibold text-slate-500">Conference</div>
            <div className="font-serif text-lg font-bold text-slate-900">{CONFERENCE.name}</div>
            <div className="text-sm text-slate-600">{CONFERENCE.dateLabel}</div>
            <div className="text-sm text-slate-600">{CONFERENCE.venue}</div>
            {nextDate && (
              <div className="text-sm text-red-800 font-semibold pt-2">
                Next: {nextDate.label}, {formatDate(nextDate.date)}
                {daysUntil(nextDate.date) > 0 && ` (${daysUntil(nextDate.date)} days left)`}
              </div>
            )}
          </div>
          <div className={UI.statCard}>
            <div className="text-xs font-semibold text-slate-500 mb-2">What to do next</div>
            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.tab} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>{s.text}</span>
                  <button onClick={() => setActiveTab(s.tab)} className="text-red-800 font-semibold hover:underline shrink-0 flex items-center gap-1">
                    {s.label} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Profile ---------- */
  if (activeTab === 'Profile') {
    return (
      <div className="space-y-4 max-w-md">
        <h3 className={UI.heading + ' text-lg'}>User Profile</h3>
        <div className={UI.statCard + ' space-y-3 text-sm'}>
          <div><span className="text-slate-500 text-xs font-bold uppercase block">Name</span><span className="text-slate-900">{user.name}</span></div>
          <div><span className="text-slate-500 text-xs font-bold uppercase block">Email</span><span className="text-slate-900">{user.email}</span></div>
          <div><span className="text-slate-500 text-xs font-bold uppercase block">Role</span><span className="text-red-800 font-bold">{role}</span></div>
        </div>
      </div>
    );
  }

  /* ---------- Notifications (all roles) ---------- */
  if (activeTab === 'Notifications') {
    const items = buildNotifications(role, user, data);
    return (
      <div className="space-y-6 max-w-2xl">
        <h3 className={UI.heading + ' text-lg'}>Notifications</h3>

        <section className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700">Announcements from the organizers</h4>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className={UI.statCard + ' flex gap-3'}>
                <Megaphone className="w-5 h-5 text-red-800 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{a.title}</div>
                  <p className="text-sm text-slate-600 mt-1">{a.message}</p>
                  <div className="text-xs text-slate-400 mt-1">{formatDate(a.date)}, posted by {a.postedBy}</div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-bold text-slate-700">Your activity</h4>
          {items.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={i} className={`border rounded-lg p-3.5 flex items-start gap-3 text-sm ${TONE[n.tone]}`}>
                <Icon className="w-4 h-4 shrink-0 mt-0.5" /> <span>{n.text}</span>
              </div>
            );
          })}
        </section>

        <div className={UI.statCard + ' flex items-start gap-3'}>
          <Bell className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-900">Conference status workflow</p>
            <p className="text-sm text-slate-500 mt-1">Papers move: Under Review, Reviewer Evaluation, Organizer Final Approval, Published Conference Paper.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= AUTHOR ================= */
  if (role === 'Author') {
    if (activeTab === 'Submit Paper') {
      return <SubmitPaperForm user={user} onAddPaper={actions.addPaper} setActiveTab={setActiveTab} />;
    }

    if (activeTab === 'My Papers') {
      const myPapers = papers.filter((p) => sameEmail(p.authorEmail, user.email)).filter((p) => paperMatches(p, search));
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <h3 className={UI.heading + ' text-lg'}>My Papers & Review Status</h3>
            <button onClick={() => setActiveTab('Submit Paper')} className={UI.primaryBtn + ' text-sm px-4 py-2'}>+ Submit Paper</button>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch} placeholder="Search my papers by title, track or keyword" />

          {myPapers.length === 0 ? (
            <EmptyState>{search ? 'No papers match your search.' : 'No papers submitted under your email address.'}</EmptyState>
          ) : (
            <div className="space-y-4">
              {myPapers.map((paper) => {
                const avg = averageScore(paper.reviews);
                const decided = isPublished(paper) || paper.finalDecision === 'Rejected';
                return (
                  <div key={paper.id} className={UI.cardPad + ' space-y-4'}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="text-xs text-red-800 font-bold">Paper #{paper.id}</span>
                        <h4 className="font-bold text-slate-900 text-base mt-0.5">{paper.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{trackOf(paper)}</p>
                        <KeywordChips keywords={paper.keywords} />
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <SimilarityBadge score={paper.plagiarismScore} />
                        <StatusBadge status={paper.status} />
                      </div>
                    </div>

                    <PaperTimeline paper={paper} />

                    <p className="text-sm text-slate-600">{paper.abstract}</p>
                    {paper.coAuthors && <p className="text-xs text-slate-500">Co-authors: {paper.coAuthors}</p>}
                    {paper.fileName && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {paper.fileName}</p>}

                    {paper.reviews.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-bold text-red-800 uppercase">Review Feedback</h5>
                          <span className="text-xs font-bold text-amber-700">Average score {avg.toFixed(1)}/5</span>
                        </div>
                        {paper.reviews.map((rev, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-md text-sm space-y-1">
                            <p className="text-amber-700 font-bold">Rating: {rev.score}/5 Stars (Reviewer: {rev.reviewer})</p>
                            <p className="text-slate-700">"{rev.comments}"</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {decided && (
                      <button
                        onClick={() =>
                          downloadPdf(`Decision_Letter_Paper_${paper.id}.pdf`, {
                            title: 'DECISION LETTER',
                            subtitle: CONFERENCE.name,
                            align: 'left',
                            blocks: [
                              { text: `Paper #${paper.id}`, bold: true, size: 12, gap: 2 },
                              { text: paper.title, size: 12 },
                              { text: `Author: ${paper.authorName}`, size: 11 },
                              { text: `Track: ${trackOf(paper)}`, size: 11, gap: 14 },
                              { text: `Decision: ${isPublished(paper) ? 'ACCEPTED' : 'NOT ACCEPTED'}`, bold: true, size: 14 },
                              { text: `Average reviewer score: ${avg ? avg.toFixed(1) + ' / 5' : 'not scored'}`, size: 11, gap: 14 },
                              ...paper.reviews.map((r, i) => ({ text: `Reviewer ${i + 1} (${r.score}/5): ${r.comments}`, size: 10, gap: 6 }))
                            ],
                            footer: `${CONFERENCE.name}, ${CONFERENCE.dateLabel}`
                          })
                        }
                        className={UI.secondaryBtn + ' text-sm px-3 py-2 flex items-center gap-1.5 w-fit'}
                      >
                        <FileDown className="w-4 h-4" /> Download decision letter
                      </button>
                    )}

                    {/* AI Summary - calls POST /api/ai/summarize */}
                    <AiSummaryPanel paper={paper} authToken={authToken} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  /* ================= REVIEWER ================= */
  if (role === 'Reviewer') {
    if (activeTab === 'Assigned Papers') {
      const filtered = papers
        .filter((p) => paperMatches(p, search))
        .filter((p) => {
          const done = p.reviews.some((r) => reviewBelongsTo(r, user));
          return filter === 'All' || (filter === 'Pending' ? !done : done);
        });
      const selectedPaper = filtered.find((p) => p.id === Number(selectedPaperId)) || filtered[0];

      return (
        <div className="space-y-6">
          <h3 className={UI.heading + ' text-lg'}>Assigned Papers Evaluation Queue</h3>
          <SearchFilterBar search={search} setSearch={setSearch} placeholder="Search by title, author, track or keyword" filter={filter} setFilter={setFilter} options={['All', 'Pending', 'Evaluated']} />

          {filtered.length === 0 ? (
            <EmptyState>No papers match.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Submissions:</label>
                {filtered.map((p) => {
                  const mine = p.reviews.find((r) => reviewBelongsTo(r, user));
                  const isSelected = selectedPaper && selectedPaper.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaperId(p.id)}
                      className={`w-full text-left p-3.5 rounded-md border transition ${isSelected ? 'bg-red-50 border-red-800 text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-900">#{p.id}</span>
                        {mine ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Evaluated
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Pending Evaluation</span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate mt-2">{p.title}</div>
                      <div className="text-xs text-slate-400 mt-1">Author: {p.authorName}</div>
                      <div className="text-xs text-slate-400">{trackOf(p)}</div>
                    </button>
                  );
                })}
              </div>

              {selectedPaper && (
                <div className="md:col-span-7 bg-slate-50 border border-slate-200 p-5 rounded-md space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-900">Paper #{selectedPaper.id}</span>
                      <SimilarityBadge score={selectedPaper.plagiarismScore} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-2">{selectedPaper.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{trackOf(selectedPaper)}</p>
                    <KeywordChips keywords={selectedPaper.keywords} />
                    <p className="text-sm text-slate-600 mt-3">{selectedPaper.abstract}</p>
                    {selectedPaper.fileName && <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> {selectedPaper.fileName}</p>}
                  </div>

                  {(() => {
                    const mine = selectedPaper.reviews.find((r) => reviewBelongsTo(r, user));
                    if (mine) {
                      return (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md space-y-3">
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                            <CheckCircle className="w-4 h-4" /> Evaluation Submitted
                          </div>
                          <div className="bg-white p-3 rounded-md space-y-1 text-sm border border-emerald-100">
                            <div className="flex justify-between text-amber-700 font-bold">
                              <span>Your Score: {mine.score}/5 Stars</span>
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            </div>
                            {mine.confidence && <p className="text-slate-500 text-xs">Confidence: {mine.confidence}/5</p>}
                            <p className="text-slate-700 mt-1">"{mine.comments}"</p>
                          </div>
                          <p className="text-xs text-slate-500">Your review is reflected on the Organizer panel.</p>
                        </div>
                      );
                    }
                    return (
                      <form
                        key={selectedPaper.id}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.target);
                          actions.addReview(selectedPaper.id, {
                            reviewer: user.name,
                            reviewerEmail: user.email,
                            score: fd.get('score'),
                            confidence: fd.get('confidence'),
                            comments: String(fd.get('comments') || '').trim()
                          });
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="rv-score" className={UI.label}>Score Rating (1-5 Stars)</label>
                            <select id="rv-score" name="score" defaultValue="4" className={UI.input}>
                              <option value="5">5 Stars - Accept for Conference</option>
                              <option value="4">4 Stars - Weak Accept</option>
                              <option value="3">3 Stars - Borderline</option>
                              <option value="2">2 Stars - Weak Reject</option>
                              <option value="1">1 Star - Reject</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="rv-conf" className={UI.label}>Your confidence</label>
                            <select id="rv-conf" name="confidence" defaultValue="4" className={UI.input}>
                              <option value="5">5 - Expert in this area</option>
                              <option value="4">4 - High confidence</option>
                              <option value="3">3 - Medium confidence</option>
                              <option value="2">2 - Low confidence</option>
                              <option value="1">1 - Outside my expertise</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="rv-comments" className={UI.label}>Written Evaluation</label>
                          <textarea id="rv-comments" name="comments" rows="4" required placeholder="Detailed review feedback..." className={UI.input}></textarea>
                        </div>
                        <button type="submit" className={UI.primaryBtn + ' w-full py-3 text-sm flex items-center justify-center gap-2'}>
                          <CheckCircle className="w-4 h-4" /> Submit Evaluation
                        </button>
                      </form>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Review History') {
      const mine = reviewHistory.filter((r) => reviewBelongsTo(r, user));
      return (
        <div className="space-y-4">
          <h3 className={UI.heading + ' text-lg'}>My Evaluation History</h3>
          {mine.length === 0 ? (
            <EmptyState>You haven't submitted any evaluations yet.</EmptyState>
          ) : (
            <div className="space-y-3">
              {mine.map((h, idx) => (
                <div key={idx} className={UI.statCard + ' space-y-1 text-sm'}>
                  <div className="flex justify-between items-center gap-3">
                    <span className="font-bold text-blue-900">Paper #{h.paperId}: {h.paperTitle}</span>
                    <span className="text-amber-700 font-bold shrink-0">{h.score}/5 Stars</span>
                  </div>
                  <div className="text-xs text-slate-500">{h.date}{h.confidence ? `, confidence ${h.confidence}/5` : ''}</div>
                  <p className="text-slate-700 mt-1">"{h.comments}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  }

  /* ================= PARTICIPANT ================= */
  if (role === 'Participant') {
    if (activeTab === 'Conference Papers') {
      const trackOptions = ['All', ...Array.from(new Set(acceptedPapers.map(trackOf)))];
      const list = acceptedPapers
        .filter((p) => paperMatches(p, search))
        .filter((p) => filter === 'All' || trackOf(p) === filter)
        .sort((a, b) => sessionSortKey(a) - sessionSortKey(b));
      const minPrice = Math.round(299 * Math.min(...TICKET_TYPES.map((t) => t.factor)));

      return (
        <div className="space-y-4">
          <div>
            <h3 className={UI.heading + ' text-lg'}>Accepted & Confirmed Conference Papers</h3>
            <p className="text-sm text-slate-500 mt-1">Only papers reviewed and officially approved by organizers appear here for attendance.</p>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch} placeholder="Search papers, authors or keywords" filter={filter} setFilter={setFilter} options={trackOptions} />

          {list.length === 0 ? (
            <EmptyState>{acceptedPapers.length === 0 ? 'No papers have been approved and published by organizers yet.' : 'No papers match your search.'}</EmptyState>
          ) : (
            <div className="space-y-4">
              {list.map((paper) => {
                const saved = mySchedule.includes(paper.id);
                const registered = registrations.some((r) => sameEmail(r.userEmail, user.email) && r.paperId === paper.id);
                return (
                  <div key={paper.id} className={UI.cardPad + ' space-y-3'}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                          Official Conference Paper #{paper.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-2">{paper.title}</h4>
                        <p className="text-sm text-slate-500">Author: {paper.authorName}{paper.coAuthors ? `, with ${paper.coAuthors}` : ''}</p>
                        <p className="text-sm text-red-800 font-semibold mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {sessionLabel(paper)}</p>
                        <KeywordChips keywords={paper.keywords} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={UI.chip}>{trackOf(paper)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => actions.toggleSchedule(user.email, paper.id)}
                            aria-pressed={saved}
                            className={(saved ? 'bg-blue-900 text-white border border-blue-900' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50') + ' font-semibold rounded-md text-sm px-3 py-2 flex items-center gap-1.5 transition'}
                          >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} /> {saved ? 'Saved' : 'Save'}
                          </button>
                          {registered ? (
                            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Registered
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSelectedPaperForReg(paper); setActiveTab('Register for Paper'); }}
                              className={UI.primaryBtn + ' text-sm px-4 py-2'}
                            >
                              Register & Attend
                            </button>
                          )}
                        </div>
                        {!registered && <span className="text-xs text-slate-500">Tickets from {formatUSD(minPrice)}</span>}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{paper.abstract}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'My Schedule') {
      const mine = acceptedPapers.filter((p) => mySchedule.includes(p.id)).sort((a, b) => sessionSortKey(a) - sessionSortKey(b));
      return (
        <div className="space-y-4">
          <div>
            <h3 className={UI.heading + ' text-lg'}>My Schedule</h3>
            <p className="text-sm text-slate-500 mt-1">Sessions you saved from the conference program, in time order.</p>
          </div>
          {mine.length === 0 ? (
            <EmptyState>
              You have not saved any sessions yet.{' '}
              <button onClick={() => setActiveTab('Conference Papers')} className="text-red-800 font-semibold hover:underline">Browse conference papers</button>
            </EmptyState>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {mine.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="sm:w-56 shrink-0 text-sm font-semibold text-red-800">{sessionLabel(p)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    <div className="text-sm text-slate-500">{p.authorName}, {trackOf(p)}</div>
                  </div>
                  <button onClick={() => actions.toggleSchedule(user.email, p.id)} className="text-sm text-slate-500 hover:text-red-700 flex items-center gap-1 self-start sm:self-center">
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Register for Paper') {
      const activePaper = selectedPaperForReg
        ? acceptedPapers.find((p) => p.id === selectedPaperForReg.id) || acceptedPapers[0]
        : acceptedPapers[0];

      if (!activePaper) {
        return <EmptyState>No accepted conference papers available to register for yet.</EmptyState>;
      }
      const existingReg = registrations.find((r) => sameEmail(r.userEmail, user.email) && r.paperId === activePaper.id);

      return (
        <div className="max-w-2xl space-y-6">
          {!existingReg ? (
            <div>
              <h3 className={UI.heading + ' text-lg mb-1'}>Conference Registration</h3>
              <p className="text-sm text-slate-500 mb-5">Registering for: <strong className="text-red-800">{activePaper.title}</strong></p>
              <RegistrationForm
                key={activePaper.id}
                paper={activePaper}
                user={user}
                onRegister={actions.registerParticipant}
                onDone={() => setActiveTab('Certificate')}
              />
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-lg flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-700 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">Registered for "{activePaper.title}"</h4>
                <p className="text-sm text-emerald-700 mt-0.5">Transaction ID: {existingReg.transactionId}</p>
              </div>
              <button onClick={() => setActiveTab('Certificate')} className="text-sm font-semibold text-red-800 hover:underline shrink-0">View badge & certificate</button>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Certificate') {
      const mine = registrations.filter((r) => sameEmail(r.userEmail, user.email));
      return (
        <div className="space-y-6 max-w-2xl">
          <h3 className={UI.heading + ' text-lg'}>Badge & Participation Certificates</h3>
          {mine.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-sm text-amber-800">
              Register for an accepted paper under the <strong>Conference Papers</strong> tab to get your badge and certificate.
            </div>
          ) : (
            <div className="space-y-3">
              {mine.map((reg) => (
                <div key={reg.transactionId} className={UI.cardPad + ' space-y-4'}>
                  <div className="flex items-start gap-3">
                    <Award className="w-8 h-8 text-red-800 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">{reg.paperTitle}</h4>
                      <p className="text-sm text-slate-500">Attendee: {reg.userName} ({reg.institution})</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {reg.ticketLabel || 'Standard'} ticket, {formatUSD(regAmount(reg, papers))}, ID {reg.transactionId}
                      </p>
                      {reg.checkedIn && <p className="text-xs text-emerald-700 font-semibold mt-1">Checked in</p>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        downloadPdf(`Certificate_${reg.transactionId}.pdf`, {
                          title: 'CERTIFICATE OF PARTICIPATION',
                          subtitle: CONFERENCE.name,
                          blocks: [
                            { text: 'This is to certify that', size: 13, gap: 18 },
                            { text: reg.userName.toUpperCase(), size: 24, bold: true, gap: 6 },
                            { text: `of ${reg.institution}`, size: 13, gap: 22 },
                            { text: 'has registered for and attended the conference session', size: 13, gap: 8 },
                            { text: `"${reg.paperTitle}"`, size: 15, bold: true, gap: 22 },
                            { text: `${CONFERENCE.title}`, size: 11, gap: 2 },
                            { text: `${CONFERENCE.dateLabel}, ${CONFERENCE.venue}`, size: 11 }
                          ],
                          footer: `Verification Code: CERT-${CONFERENCE_YEAR}-${reg.transactionId}`
                        })
                      }
                      className={UI.primaryBtn + ' flex-1 py-2.5 text-sm flex items-center justify-center gap-2'}
                    >
                      <Download className="w-4 h-4" /> Download PDF Certificate
                    </button>
                    <button
                      onClick={() =>
                        downloadPdf(`Badge_${reg.transactionId}.pdf`, {
                          title: CONFERENCE.name,
                          subtitle: 'ATTENDEE BADGE',
                          blocks: [
                            { text: reg.userName, size: 30, bold: true, gap: 8 },
                            { text: reg.institution, size: 16, gap: 24 },
                            { text: (reg.ticketLabel || 'Attendee').toUpperCase(), size: 18, bold: true, gap: 24 },
                            { text: `Registration ID: ${reg.transactionId}`, size: 12, gap: 4 },
                            { text: `${CONFERENCE.dateLabel}`, size: 12 }
                          ],
                          footer: 'Show this badge at check-in'
                        })
                      }
                      className={UI.secondaryBtn + ' flex-1 py-2.5 text-sm flex items-center justify-center gap-2'}
                    >
                      <Ticket className="w-4 h-4" /> Download Badge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  }

  /* ================= ORGANIZER ================= */
  if (role === 'Organizer') {
    if (activeTab === 'Paper Approvals') {
      const list = papers
        .filter((p) => paperMatches(p, search))
        .filter((p) => {
          if (filter === 'All') return true;
          if (filter === 'Awaiting decision') return isAwaitingDecision(p);
          if (filter === 'Accepted') return isPublished(p);
          return p.status === filter;
        });

      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h3 className={UI.heading + ' text-lg'}>Paper Approval Workflow Panel</h3>
              <p className="text-sm text-slate-500 mt-1">Reviewer scores are rendered live below. Grant final approval to publish papers for participant registration.</p>
            </div>
            <button
              onClick={() =>
                downloadCsv('papers.csv', [
                  ['ID', 'Title', 'Track', 'Author', 'Author email', 'Status', 'Similarity %', 'Reviews', 'Average score', 'Session'],
                  ...papers.map((p) => [p.id, p.title, trackOf(p), p.authorName, p.authorEmail, p.status, p.plagiarismScore, p.reviews.length, averageScore(p.reviews) ? averageScore(p.reviews).toFixed(1) : '', hasSession(p) ? sessionLabel(p) : ''])
                ])
              }
              className={UI.secondaryBtn + ' text-sm px-3 py-2 flex items-center gap-1.5'}
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch} placeholder="Search by title, author, track or keyword" filter={filter} setFilter={setFilter} options={['All', 'Awaiting decision', 'Under Review', 'Reviewer Accepted', 'Accepted', 'Rejected']} />

          {list.length === 0 ? (
            <EmptyState>No papers match.</EmptyState>
          ) : (
            <div className="space-y-3">
              {list.map((p) => {
                const avg = averageScore(p.reviews);
                return (
                  <div key={p.id} className={UI.cardPad + ' space-y-3'}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="min-w-0">
                        <span className="text-xs text-red-800 font-bold">Paper #{p.id}</span>
                        <h4 className="font-bold text-slate-900 text-base mt-0.5">{p.title}</h4>
                        <p className="text-sm text-slate-500">Author: {p.authorName} ({p.authorEmail})</p>
                        <p className="text-xs text-slate-500 mt-0.5">{trackOf(p)}</p>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        {avg != null && <span className="text-xs font-bold text-amber-700">Avg {avg.toFixed(1)}/5</span>}
                        <SimilarityBadge score={p.plagiarismScore} />
                        <StatusBadge status={p.status} />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-md space-y-2">
                      <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">Submitted Reviews ({p.reviews.length})</h5>
                      {p.reviews.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No reviewers have evaluated this paper yet.</p>
                      ) : (
                        p.reviews.map((rev, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-md border border-slate-200 text-sm space-y-1">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-slate-700">Reviewer: {rev.reviewer}</span>
                              <span className="text-amber-700 font-bold">{rev.score}/5 Stars{rev.confidence ? ` (confidence ${rev.confidence}/5)` : ''}</span>
                            </div>
                            <p className="text-slate-700">"{rev.comments}"</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200 flex-wrap">
                      {!isPublished(p) && (
                        <button onClick={() => actions.approve(p.id)} className={UI.approveBtn + ' text-sm px-4 py-2 flex items-center gap-1.5'}>
                          <CheckCircle className="w-4 h-4" /> Approve & Publish to Participants
                        </button>
                      )}
                      {p.finalDecision !== 'Rejected' && (
                        <button onClick={() => actions.reject(p.id)} className={UI.rejectBtn + ' text-sm px-4 py-2 flex items-center gap-1.5'}>
                          <XCircle className="w-4 h-4" /> Reject Submission
                        </button>
                      )}
                      {isPublished(p) && <span className="text-sm text-emerald-700 font-semibold self-center">Published in the program</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Program Schedule') {
      const sorted = [...acceptedPapers].sort((a, b) => sessionSortKey(a) - sessionSortKey(b));
      const scheduled = sorted.filter(hasSession).length;
      const update = (id, field) => (e) => actions.updateSession(id, field, e.target.value);
      return (
        <div className="space-y-4">
          <div>
            <h3 className={UI.heading + ' text-lg'}>Program Schedule</h3>
            <p className="text-sm text-slate-500 mt-1">
              Give each accepted paper a day, time and room. Two papers cannot share the same slot. {scheduled} of {sorted.length} scheduled.
            </p>
          </div>
          {sorted.length === 0 ? (
            <EmptyState>Approve a paper first. Accepted papers show up here for scheduling.</EmptyState>
          ) : (
            <div className="space-y-3">
              {sorted.map((p) => (
                <div key={p.id} className={UI.cardPad + ' space-y-3'}>
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0">
                      <span className="text-xs text-red-800 font-bold">Paper #{p.id}</span>
                      <h4 className="font-bold text-slate-900 mt-0.5">{p.title}</h4>
                      <p className="text-xs text-slate-500">{p.authorName}, {trackOf(p)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${hasSession(p) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {hasSession(p) ? sessionLabel(p) : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`day-${p.id}`} className={UI.label}>Day</label>
                      <select id={`day-${p.id}`} value={(p.session && p.session.day) || ''} onChange={update(p.id, 'day')} className={UI.input}>
                        <option value="">Choose day</option>
                        {SESSION_DAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`time-${p.id}`} className={UI.label}>Time</label>
                      <select id={`time-${p.id}`} value={(p.session && p.session.time) || ''} onChange={update(p.id, 'time')} className={UI.input}>
                        <option value="">Choose time</option>
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`room-${p.id}`} className={UI.label}>Room</label>
                      <select id={`room-${p.id}`} value={(p.session && p.session.room) || ''} onChange={update(p.id, 'room')} className={UI.input}>
                        <option value="">Choose room</option>
                        {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Manage Reviewers') {
      const reviewerList = registeredUsers.filter((u) => u.role === 'Reviewer');
      return (
        <div className="space-y-4">
          <h3 className={UI.heading + ' text-lg'}>Reviewer Track Management</h3>
          {reviewerList.length === 0 ? (
            <EmptyState>No reviewers have registered yet.</EmptyState>
          ) : (
            <div className="space-y-3">
              {reviewerList.map((rev) => {
                const mine = reviewHistory.filter((r) => reviewBelongsTo(r, rev));
                const scores = mine.map((r) => Number(r.score));
                const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
                const pending = papers.filter((p) => !p.reviews.some((r) => reviewBelongsTo(r, rev))).length;
                return (
                  <div key={rev.email} className={UI.statCard + ' space-y-2 text-sm'}>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 gap-3 flex-wrap">
                      <span className="font-bold text-slate-900">{rev.name} ({rev.email})</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">Active Evaluator</span>
                    </div>
                    <div className="flex flex-wrap gap-x-8 gap-y-1 text-slate-500 pt-1">
                      <span>Evaluations Submitted: <strong className="text-red-800">{mine.length}</strong></span>
                      <span>Papers pending: <strong className="text-amber-700">{pending}</strong></span>
                      <span>Average score given: <strong className="text-blue-900">{avg ? `${avg}/5` : 'none yet'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'All Participants') {
      const list = registrations
        .filter((r) => [r.userName, r.userEmail, r.paperTitle, r.institution, r.transactionId].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
        .filter((r) => filter === 'All' || (filter === 'Checked in' ? r.checkedIn : !r.checkedIn));
      const checkedCount = registrations.filter((r) => r.checkedIn).length;
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h3 className={UI.heading + ' text-lg'}>Conference Attendees ({registrations.length})</h3>
              <p className="text-sm text-slate-500 mt-1">{checkedCount} of {registrations.length} checked in.</p>
            </div>
            <button
              onClick={() =>
                downloadCsv('attendees.csv', [
                  ['Registration ID', 'Name', 'Email', 'Institution', 'Paper', 'Ticket', 'Amount paid', 'Promo code', 'Registered on', 'Checked in'],
                  ...registrations.map((r) => [r.transactionId, r.userName, r.userEmail, r.institution, r.paperTitle, r.ticketLabel || 'Standard', regAmount(r, papers).toFixed(2), r.promoCode || '', r.registeredOn || '', r.checkedIn ? 'Yes' : 'No'])
                ])
              }
              className={UI.secondaryBtn + ' text-sm px-3 py-2 flex items-center gap-1.5'}
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <SearchFilterBar search={search} setSearch={setSearch} placeholder="Search by name, email, paper or ID" filter={filter} setFilter={setFilter} options={['All', 'Checked in', 'Not checked in']} />

          {registrations.length === 0 ? (
            <EmptyState>No participants registered yet.</EmptyState>
          ) : list.length === 0 ? (
            <EmptyState>No attendees match.</EmptyState>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.transactionId} className={UI.statCard + ' flex justify-between items-center gap-3 text-sm flex-wrap'}>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{r.userName} ({r.userEmail})</p>
                    <p className="text-slate-500">Paper: {r.paperTitle}, {r.institution}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.ticketLabel || 'Standard'} ticket, {formatUSD(regAmount(r, papers))}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-bold">{r.transactionId}</span>
                    <button
                      onClick={() => actions.toggleCheckIn(r.transactionId)}
                      className={(r.checkedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : UI.secondaryBtn) + ' text-sm font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5'}
                    >
                      <CheckCircle className="w-4 h-4" /> {r.checkedIn ? 'Checked in' : 'Check in'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Reports') {
      const revenue = registrations.reduce((sum, r) => sum + regAmount(r, papers), 0);
      const checkedCount = registrations.filter((r) => r.checkedIn).length;
      const scores = papers.flatMap((p) => p.reviews.map((r) => Number(r.score)));
      const overallAvg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
      const statusRows = ['Under Review', 'Reviewer Accepted', 'Accepted', 'Rejected'].map((s) => ({ label: s, value: papers.filter((p) => p.status === s).length }));
      const trackRows = Array.from(new Set([...TRACKS, ...papers.map(trackOf)])).map((t) => ({ label: t, value: papers.filter((p) => trackOf(p) === t).length })).filter((r) => r.value > 0);
      const ticketLabels = Array.from(new Set(registrations.map((r) => r.ticketLabel || 'Standard')));
      const ticketRows = ticketLabels.map((t) => ({ label: t, value: registrations.filter((r) => (r.ticketLabel || 'Standard') === t).length }));

      const Section = ({ title, rows }) => {
        const max = Math.max(1, ...rows.map((r) => r.value));
        return (
          <div className={UI.statCard + ' space-y-3'}>
            <h4 className="text-sm font-bold text-blue-900">{title}</h4>
            {rows.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : rows.map((r) => <BarRow key={r.label} label={r.label} value={r.value} max={max} />)}
          </div>
        );
      };

      return (
        <div className="space-y-5">
          <h3 className={UI.heading + ' text-lg'}>Analytics Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Submissions Accepted" value={`${acceptedPapers.length} / ${papers.length}`} tone="text-emerald-700" />
            <StatCard label="Total Revenue Collected" value={`${formatUSD(revenue)} USD`} />
            <StatCard label="Average Review Score" value={overallAvg === 'N/A' ? 'N/A' : `${overallAvg}/5`} tone="text-amber-700" />
            <StatCard label="Total Reviews Evaluated" value={reviewHistory.length} tone="text-red-800" />
            <StatCard label="Registered Attendees" value={registrations.length} />
            <StatCard label="Checked In" value={`${checkedCount} / ${registrations.length}`} tone="text-emerald-700" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Submissions by status" rows={statusRows} />
            <Section title="Submissions by track" rows={trackRows} />
            <Section title="Registrations by ticket type" rows={ticketRows} />
          </div>
        </div>
      );
    }

    if (activeTab === 'Announcements') {
      return (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className={UI.heading + ' text-lg'}>Announcements</h3>
            <p className="text-sm text-slate-500 mt-1">Messages posted here appear in every user's Notifications tab.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              actions.postAnnouncement({ title: String(fd.get('title')).trim(), message: String(fd.get('message')).trim() });
              e.target.reset();
            }}
            className={UI.statCard + ' space-y-3'}
          >
            <div>
              <label htmlFor="an-title" className={UI.label}>Title</label>
              <input id="an-title" name="title" required maxLength={100} placeholder="e.g. Schedule published" className={UI.input} />
            </div>
            <div>
              <label htmlFor="an-msg" className={UI.label}>Message</label>
              <textarea id="an-msg" name="message" rows="3" required maxLength={500} placeholder="Write the announcement..." className={UI.input}></textarea>
            </div>
            <button type="submit" className={UI.primaryBtn + ' text-sm px-4 py-2.5 flex items-center gap-2'}>
              <Megaphone className="w-4 h-4" /> Post announcement
            </button>
          </form>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <EmptyState>No announcements posted yet.</EmptyState>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className={UI.cardPad + ' flex justify-between gap-3'}>
                  <div>
                    <div className="font-semibold text-slate-900">{a.title}</div>
                    <p className="text-sm text-slate-600 mt-1">{a.message}</p>
                    <div className="text-xs text-slate-400 mt-1">{formatDate(a.date)}, posted by {a.postedBy}</div>
                  </div>
                  <button onClick={() => actions.deleteAnnouncement(a.id)} aria-label={`Delete announcement ${a.title}`} className="text-slate-400 hover:text-red-700 shrink-0 self-start p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
  }

  return <div className="text-slate-500 text-sm">Select a tab from the sidebar menu.</div>;
}
