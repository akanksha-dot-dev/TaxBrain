/**
 * TaxBrain — Dashboard Island
 *
 * Two states:
 * 1. New user (no profile) → Welcome hero + sample profiles
 * 2. Returning user → Regime comparison, savings, stats, actions, tax calendar
 *
 * Enhancements:
 * - Animated number counters (count-up on load)
 * - Tax Calendar widget with FY2026-27 deadlines
 * - Reset Profile button in header
 * - Improved feature cards on welcome screen
 * - Slider fill tracks via CSS custom property
 */

import { useState, useEffect, useRef } from 'react';
import { compareRegimes, getOptimizationSuggestions } from '../../lib/tax-engine';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
import { loadProfile, clearProfile } from '../../lib/profile-store';
import { generateActions } from '../../lib/action-generator';
import { SAMPLE_PROFILES } from '../../data/default-profile';
import { saveProfile } from '../../lib/profile-store';
import {
  formatCurrency,
  formatPercent,
} from '../../lib/formatters';
import type { UserProfile, RegimeComparison, Suggestion } from '../../lib/types';

// ── Tax Calendar Data ──

interface TaxDeadline {
  month: string;
  day: number;
  label: string;
  description: string;
  urgency: 'critical' | 'soon' | 'upcoming';
}

const TAX_DEADLINES_FY2026: TaxDeadline[] = [
  { month: 'Jul', day: 15, label: 'Advance Tax (Q1)', description: '15% of annual tax liability due', urgency: 'upcoming' },
  { month: 'Sep', day: 15, label: 'Advance Tax (Q2)', description: '45% of annual tax liability due (cumulative)', urgency: 'upcoming' },
  { month: 'Sep', day: 30, label: 'ITR Filing Deadline', description: 'Last date to file Income Tax Return for FY 2025-26', urgency: 'soon' },
  { month: 'Dec', day: 15, label: 'Advance Tax (Q3)', description: '75% of annual tax liability due (cumulative)', urgency: 'upcoming' },
  { month: 'Jan', day: 15, label: 'TDS by Employer', description: 'Employer submits Form 24Q for Q3', urgency: 'upcoming' },
  { month: 'Mar', day: 15, label: 'Advance Tax (Q4)', description: '100% of annual tax liability due', urgency: 'critical' },
  { month: 'Mar', day: 31, label: 'Last date for tax-saving', description: 'Final day to make investments for Old Regime (80C, 80D etc.)', urgency: 'critical' },
];

function getUpcomingDeadlines(): TaxDeadline[] {
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentMonthIdx = now.getMonth();
  const currentDay = now.getDate();

  // Sort deadlines by calendar month/day (FY April–March)
  const fyMonthOrder = [3,4,5,6,7,8,9,10,11,0,1,2]; // Apr=3 ... Mar=2

  return TAX_DEADLINES_FY2026
    .filter(d => {
      const dMonth = monthNames.indexOf(d.month);
      const dFyPos = fyMonthOrder.indexOf(dMonth);
      const curFyPos = fyMonthOrder.indexOf(currentMonthIdx);
      if (dFyPos > curFyPos) return true;
      if (dFyPos === curFyPos && d.day >= currentDay) return true;
      return false;
    })
    .slice(0, 3);
}

// ── Animated Counter Hook ──

function useCountUp(target: number, duration = 1000, started: boolean = true): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started || target === 0) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    const startValue = 0;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, started]);

  return value;
}

// ── Main Component ──

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [comparison, setComparison] = useState<RegimeComparison | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [visible, setVisible] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    if (p && p.jobs.length > 0) {
      const c = compareRegimes(p, TAX_CONFIG_FY2026);
      setComparison(c);
      setSuggestions(getOptimizationSuggestions(p, TAX_CONFIG_FY2026));
    }
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleSelectSample = (sampleProfile: UserProfile) => {
    saveProfile(sampleProfile);
    setProfile(sampleProfile);
    if (sampleProfile.jobs.length > 0) {
      setComparison(compareRegimes(sampleProfile, TAX_CONFIG_FY2026));
      setSuggestions(getOptimizationSuggestions(sampleProfile, TAX_CONFIG_FY2026));
    }
  };

  const handleReset = () => {
    clearProfile();
    setProfile(null);
    setComparison(null);
    setSuggestions([]);
    setShowResetConfirm(false);
  };

  // Loading state
  if (profile === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)', animation: 'pulse 2s ease-in-out infinite' }}>🧠</div>
          <div>Loading your tax data…</div>
        </div>
      </div>
    );
  }

  // No profile → Welcome screen
  if (!profile || profile.jobs.length === 0) {
    return <WelcomeScreen visible={visible} onSelectSample={handleSelectSample} />;
  }

  // Profile exists → Full dashboard
  const { newRegime, oldRegime, winner, savings } = comparison!;
  const bestResult = winner === 'new' ? newRegime : oldRegime;
  const actions = generateActions(profile, TAX_CONFIG_FY2026);
  const topActions = actions.filter(a => a.priority === 'critical').slice(0, 4);

  const maxSavingsPossible = suggestions.reduce((sum, s) => sum + s.potentialSaving, 0) + savings;
  const optimizationScore = maxSavingsPossible > 0 ? Math.round((savings / maxSavingsPossible) * 100) : 100;

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <div className="dashboard" style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'var(--space-4)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)', maxWidth: '400px', width: '100%',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🗑️</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>
              Reset your profile?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
              This will delete all your saved data (salary, deductions, action items) and return you to the welcome screen. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReset}
                style={{ background: 'var(--color-danger)' }}>
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)',
      }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>
            {getGreeting()}, {profile.name} 👋
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Tax Year 2026-27 • Your personalized tax intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }} className="no-print">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
            title="Print or Save as PDF"
          >
            🖨️ Save PDF
          </button>
          <a href="/setup" className="btn btn-secondary btn-sm">✏️ Edit Profile</a>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowResetConfirm(true)}
            style={{ color: 'var(--color-danger)' }}
            title="Reset all profile data"
          >
            🗑️ Reset
          </button>
        </div>
      </div>

      {/* Hero Savings Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #5a3f9e 50%, #764ba2 100%)',
        borderRadius: 'var(--radius-xl, 20px)',
        padding: 'var(--space-8)', marginBottom: 'var(--space-6)',
        color: 'white', position: 'relative', overflow: 'hidden',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 6s ease infinite',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '15%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '20px', left: '40%', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'rgba(255,255,255,0.18)', borderRadius: 'var(--radius-full)',
            padding: '5px 14px', fontSize: 'var(--text-xs)', fontWeight: 700,
            marginBottom: 'var(--space-4)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            letterSpacing: '0.04em',
          }}>
            🏆 {winner === 'new' ? 'New' : 'Old'} Regime Recommended
          </div>

          <AnimatedAmount
            value={savings}
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight: 800, lineHeight: 1.1,
              marginBottom: 'var(--space-2)',
              fontVariantNumeric: 'tabular-nums',
              color: 'white',
              display: 'block',
            }}
            started={visible}
          />
          <div style={{ fontSize: 'var(--text-md)', opacity: 0.85, marginBottom: 'var(--space-4)' }}>
            saved by choosing {winner === 'new' ? 'New' : 'Old'} Regime vs the other
          </div>
          <p style={{ fontSize: 'var(--text-sm)', opacity: 0.75, lineHeight: 'var(--leading-relaxed)', maxWidth: '600px', margin: 0 }}>
            {comparison!.explanation}
          </p>
        </div>
      </div>

      {/* Regime Comparison */}
      <div className="regime-comparison" style={{ marginBottom: 'var(--space-6)' }}>
        <RegimeCard result={newRegime} isWinner={winner === 'new'} label="New Regime" emoji="🆕" started={visible} />
        <RegimeCard result={oldRegime} isWinner={winner === 'old'} label="Old Regime" emoji="🏛️" started={visible} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatCard icon="📊" label="Effective Rate" value={formatPercent(bestResult.effectiveTaxRate)} accent="default" started={visible} />
        <StatCard icon="💰" label="Monthly Take-Home" value={formatCurrency(bestResult.monthlyTakeHome)} accent="success" started={visible} />
        <StatCard icon="📅" label="Monthly TDS" value={formatCurrency(bestResult.monthlyTDS)} accent="default" started={visible} />
        <ScoreRingCard score={optimizationScore} started={visible} />
      </div>

      {/* Suggestions + Tax Calendar — two column on large screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="card" style={{ borderColor: 'var(--color-warning)', borderWidth: '1px' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>💡</span><span>You Could Save More</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {suggestions.slice(0, 3).map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 500 }}>{s.title}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{s.description}</div>
                  </div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-success)', whiteSpace: 'nowrap', marginLeft: 'var(--space-4)', fontVariantNumeric: 'tabular-nums' }}>
                    +{formatCurrency(s.potentialSaving)}
                  </div>
                </div>
              ))}
            </div>
            <a href="/simulator" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }}>
              Explore in Simulator →
            </a>
          </div>
        )}

        {/* Tax Calendar */}
        {upcomingDeadlines.length > 0 && (
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <span>📆</span><span>Upcoming Tax Deadlines</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {upcomingDeadlines.map((d, i) => (
                <TaxDeadlineRow key={i} deadline={d} />
              ))}
            </div>
            <div style={{
              marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            }}>
              <span className="pulse-dot" style={{ background: 'var(--color-danger)' }} />
              <span>Critical &nbsp;</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)', display: 'inline-block' }} />
              <span>Soon &nbsp;</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
              <span>Upcoming</span>
            </div>
          </div>
        )}
      </div>

      {/* Tax Health + FY Countdown row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <TaxHealthScore
          profile={profile}
          comparison={comparison!}
          suggestions={suggestions}
          started={visible}
        />
        <FYCountdown />
      </div>

      {/* Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <QuickLink href="/calculator" icon="🧮" title="Calculator" desc="Full salary input with dual regime" />
        <QuickLink href="/simulator" icon="🎛️" title="Simulator" desc="What-if analysis with sliders" />
        <QuickLink href="/knowledge" icon="📚" title="Knowledge Base" desc="Tax planning articles" />
      </div>

      {/* Priority Actions */}
      {topActions.length > 0 && (
        <div className="card">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🎯 Priority Actions</span>
            <a href="/actions" className="btn btn-ghost btn-sm">View All →</a>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {topActions.map(action => (
              <div key={action.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)',
              }}>
                <span className="pulse-dot" style={{ marginTop: '6px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{action.text}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{action.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tax Deadline Row ──

function TaxDeadlineRow({ deadline }: { deadline: TaxDeadline }) {
  const urgencyClass = `tax-deadline-urgency-${deadline.urgency}`;
  return (
    <div className="tax-deadline-row">
      <div className="tax-deadline-date">
        <span className="month">{deadline.month}</span>
        <span className="day">{deadline.day}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
          className={urgencyClass}>
          {deadline.urgency === 'critical' && <span style={{ marginRight: '4px' }}>🔴</span>}
          {deadline.urgency === 'soon' && <span style={{ marginRight: '4px' }}>🟡</span>}
          {deadline.label}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
          {deadline.description}
        </div>
      </div>
    </div>
  );
}

// ── Animated Amount ──

function AnimatedAmount({ value, style, started }: {
  value: number;
  style?: React.CSSProperties;
  started: boolean;
}) {
  const animated = useCountUp(value, 1200, started);
  return <span style={style}>{formatCurrency(animated)}</span>;
}

// ── Welcome Screen (No Profile) ──

function WelcomeScreen({ visible, onSelectSample }: { visible: boolean; onSelectSample: (p: UserProfile) => void }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
    }}>
      {/* Hero */}
      <div className="welcome-hero-section" style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4) var(--space-8)' }}>
        {/* Animated particles */}
        <div className="hero-particles-container" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="hero-particle"
              style={{
                width: `${6 + (i % 4) * 4}px`,
                height: `${6 + (i % 4) * 4}px`,
                left: `${8 + (i * 8) % 84}%`,
                bottom: `${(i * 13) % 40}%`,
                background: i % 3 === 0
                  ? 'rgba(102,126,234,0.4)'
                  : i % 3 === 1
                  ? 'rgba(118,75,162,0.35)'
                  : 'rgba(0,230,118,0.3)',
                animationDuration: `${4 + (i % 5) * 1.2}s`,
                animationDelay: `${(i * 0.6) % 4}s`,
              }}
            />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="welcome-badge-pill">
            🇮🇳 FY 2026-27 · Income Tax Act 2025
          </div>

          <h1 style={{
            fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 800,
            lineHeight: 1.1, marginBottom: 'var(--space-4)',
            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Your Free Tax Intelligence<br />Platform
          </h1>
          <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
            Compare New vs Old regime, optimize salary structure, and plan tax-saving strategies. Built for Indian salaried professionals.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <a href="/setup" className="btn btn-primary btn-lg cta-button-shimmer">
              🚀 Set Up My Profile
            </a>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              🔒 100% private — all data stays in your browser. No accounts needed.
            </p>
          </div>

          {/* Stats ticker */}
          <div className="stats-ticker" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div className="stats-ticker-item">✨ <span className="stats-ticker-value">100% Free</span> forever</div>
            <div className="stats-ticker-item">🔐 <span className="stats-ticker-value">Zero</span> data sent</div>
            <div className="stats-ticker-item">⚡ <span className="stats-ticker-value">Live</span> calculations</div>
            <div className="stats-ticker-item">🇮🇳 <span className="stats-ticker-value">ITA 2025</span> updated</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="feature-card-grid">
        <FeatureCard icon="⚖️" title="Regime Comparison" desc="Instant side-by-side comparison of New vs Old tax regime with slab-by-slab breakdown" gradient="135deg, #667eea, #764ba2" />
        <FeatureCard icon="🎛️" title="What-If Simulator" desc="Drag sliders to see how rent, NPS, home loans, and salary changes affect your tax in real time" gradient="135deg, #f093fb, #f5576c" />
        <FeatureCard icon="📚" title="Knowledge Base" desc="Plain-English articles on 80C, 80D, NPS, HRA, salary restructuring, and the new tax law" gradient="135deg, #4facfe, #00f2fe" />
        <FeatureCard icon="✅" title="Action Checklist" desc="Personalized to-do list based on your profile — job switch, investments, deadlines" gradient="135deg, #43e97b, #38f9d7" />
      </div>

      {/* Sample Profiles */}
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Explore with a sample profile
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
          No setup needed — pick a persona to see TaxBrain in action
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
          {SAMPLE_PROFILES.map(sp => (
            <button key={sp.id} onClick={() => onSelectSample(sp.profile)} style={{
              cursor: 'pointer', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)',
              textAlign: 'center', transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-primary)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-glow-purple)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{sp.emoji}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>{sp.ctc} CTC</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function FeatureCard({ icon, title, desc, gradient }: { icon: string; title: string; desc: string; gradient: string }) {
  return (
    <div className="card" style={{ textAlign: 'left', padding: 'var(--space-6)' }}>
      <div className="feature-card-icon-wrap" style={{
        background: `linear-gradient(${gradient})`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{title}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>{desc}</div>
    </div>
  );
}

function RegimeCard({ result, isWinner, label, emoji, started }: {
  result: RegimeComparison['newRegime']; isWinner: boolean; label: string; emoji: string; started: boolean;
}) {
  const animatedTax = useCountUp(result.totalTax, 1000, started);

  return (
    <div className={`card ${isWinner ? 'card-success' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{emoji}</span> {label}
        </h3>
        {isWinner && <span className="badge badge-success">✓ Recommended</span>}
      </div>
      <div className={`tax-amount ${isWinner ? 'tax-amount-savings' : 'tax-amount-positive'}`} style={{ marginBottom: 'var(--space-4)' }}>
        {formatCurrency(animatedTax)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <DetailRow label="Gross Salary" value={formatCurrency(result.grossSalary)} />
        <DetailRow label="Exemptions" value={`-${formatCurrency(result.totalExemptions)}`} />
        <DetailRow label="Deductions" value={`-${formatCurrency(result.totalDeductions)}`} />
        <div className="divider" style={{ margin: 'var(--space-1) 0' }} />
        <DetailRow label="Taxable Income" value={formatCurrency(result.netTaxableIncome)} bold />
        <DetailRow label="Effective Rate" value={formatPercent(result.effectiveTaxRate)} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, started }: {
  icon: string; label: string; value: string; accent: 'success' | 'warning' | 'default'; started: boolean;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (started) {
      const t = setTimeout(() => setAnimated(true), 300);
      return () => clearTimeout(t);
    }
  }, [started]);

  const accentColor = accent === 'success' ? 'var(--color-success)' : accent === 'warning' ? 'var(--color-warning)' : 'var(--text-primary)';
  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{label}</div>
      <div
        className={animated ? 'count-animate' : ''}
        style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a href={href} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <span style={{
        fontSize: '1.75rem', flexShrink: 0,
        width: '44px', height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(102,126,234,0.1)', borderRadius: 'var(--radius-md)',
      }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </a>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: bold ? 600 : 400 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

// ── Optimization Score Ring ──

function ScoreRingCard({ score, started }: { score: number; started: boolean }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setAnimScore(score), 200);
    return () => clearTimeout(t);
  }, [score, started]);

  const offset = circumference - (animScore / 100) * circumference;
  const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '96px', height: '96px' }}>
        <svg width="96" height="96" viewBox="0 0 96 96" className="score-ring-svg" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle className="score-ring-track" cx="48" cy="48" r={radius} />
          <circle
            className="score-ring-fill"
            cx="48" cy="48" r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
            {animScore}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>Optimization</div>
    </div>
  );
}

// ── Tax Health Score ──

function TaxHealthScore({ profile, comparison, suggestions, started }: {
  profile: UserProfile;
  comparison: RegimeComparison;
  suggestions: Suggestion[];
  started: boolean;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (started) {
      const t = setTimeout(() => setAnimated(true), 300);
      return () => clearTimeout(t);
    }
  }, [started]);

  // Pillar 1: Regime Choice (25 pts) — are they using the recommended regime?
  const regimeScore = 25; // always correct since we always show best

  // Pillar 2: Exemption Efficiency (25 pts) — HRA claimed, LTA claimed
  const bestResult = comparison.winner === 'new' ? comparison.newRegime : comparison.oldRegime;
  const hraExemption = bestResult.exemptions.find(e => e.name.includes('HRA'))?.amount ?? 0;
  const hasHRA = profile.monthlyRent > 0 && hraExemption > 0;
  const exemptionScore = Math.min(25, Math.round(
    (hraExemption > 0 ? 15 : 0) + (profile.optimizations.ltaClaimed ? 10 : 0)
  ));

  // Pillar 3: Deduction Usage (25 pts) — 80C, 80D
  const total80C = Object.values(profile.deductions.section80C).reduce((a, b) => a + b, 0);
  const has80D = (profile.deductions.section80D.selfPremium ?? 0) > 0;
  const deductionScore = Math.min(25, Math.round(
    (Math.min(total80C, 150000) / 150000) * 15 + (has80D ? 10 : 0)
  ));

  // Pillar 4: Optimization (25 pts) — NPS, meals, phone
  const optCount = [profile.optimizations.employerNPS, profile.optimizations.mealVouchers, profile.optimizations.phoneReimbursement].filter(Boolean).length;
  const optScore = Math.round((optCount / 3) * 25);

  const totalScore = regimeScore + exemptionScore + deductionScore + optScore;
  const grade = totalScore >= 90 ? '🏆 Excellent' : totalScore >= 70 ? '✅ Good' : totalScore >= 50 ? '⚡ Fair' : '⚠️ Needs Work';
  const gradeColor = totalScore >= 90 ? 'var(--color-success)' : totalScore >= 70 ? 'var(--blue-500)' : totalScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
  const gradeBg = totalScore >= 90 ? 'var(--color-success-bg)' : totalScore >= 70 ? 'rgba(64,196,255,0.1)' : totalScore >= 50 ? 'rgba(255,215,64,0.1)' : 'var(--color-danger-bg)';

  const pillars = [
    { icon: '⚖️', label: 'Regime Choice', score: regimeScore, max: 25 },
    { icon: '🏠', label: 'Exemptions', score: exemptionScore, max: 25 },
    { icon: '📋', label: 'Deductions', score: deductionScore, max: 25 },
    { icon: '⚡', label: 'Optimizations', score: optScore, max: 25 },
  ];

  return (
    <div className="card">
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <span>🩺</span><span>Tax Health Score</span>
      </h2>
      <div className="health-score-total">
        <div className="health-score-number" style={{ color: gradeColor }}>{totalScore}</div>
        <div className="health-score-label">out of 100</div>
        <div className="health-grade-badge" style={{ background: gradeBg, color: gradeColor }}>
          {grade}
        </div>
      </div>
      <div className="health-score-grid">
        {pillars.map(p => (
          <div key={p.label} className="health-pillar">
            <div className="health-pillar-header">
              <span className="health-pillar-icon">{p.icon}</span>
              <span className="health-pillar-score" style={{ color: p.score >= p.max * 0.8 ? 'var(--color-success)' : p.score >= p.max * 0.5 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                {p.score}/{p.max}
              </span>
            </div>
            <div className="health-pillar-label">{p.label}</div>
            <div className="health-pillar-bar-track">
              <div className="health-pillar-bar-fill" style={{
                width: animated ? `${(p.score / p.max) * 100}%` : '0%',
                background: p.score >= p.max * 0.8 ? 'var(--color-success)' : p.score >= p.max * 0.5 ? 'var(--color-warning)' : 'var(--color-danger)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FY Countdown ──

function FYCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    function calc() {
      // FY2026-27 ends March 31, 2027 at 23:59:59
      const fyEnd = new Date(2027, 2, 31, 23, 59, 59);
      const now = new Date();
      const diff = fyEnd.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0 }); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ days, hours, minutes });
    }
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, []);

  const urgency = timeLeft.days < 30 ? 'var(--color-danger)' : timeLeft.days < 90 ? 'var(--color-warning)' : 'var(--accent-primary)';

  return (
    <div className="card">
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <span>⏰</span><span>FY 2026-27 Ends In</span>
      </h2>
      <div className="fy-countdown-segments" style={{ justifyContent: 'center' }}>
        <div className="fy-countdown-segment">
          <span className="fy-countdown-number" style={{ '--accent-gradient': `linear-gradient(135deg, ${urgency}, ${urgency})` } as React.CSSProperties}>
            {String(timeLeft.days).padStart(3, '0')}
          </span>
          <span className="fy-countdown-unit">Days</span>
        </div>
        <span className="fy-countdown-separator">:</span>
        <div className="fy-countdown-segment">
          <span className="fy-countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="fy-countdown-unit">Hours</span>
        </div>
        <span className="fy-countdown-separator">:</span>
        <div className="fy-countdown-segment">
          <span className="fy-countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="fy-countdown-unit">Mins</span>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
        {timeLeft.days < 30
          ? '🔴 Final stretch! Make tax-saving investments before March 31.'
          : timeLeft.days < 90
          ? '🟡 Q4 is here — review your 80C investments and file advance tax.'
          : '📅 March 31, 2027 · Last date for tax-saving investments (Old Regime)'
        }
      </div>
    </div>
  );
}
