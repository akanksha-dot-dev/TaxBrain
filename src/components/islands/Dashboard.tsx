/**
 * TaxBrain — Dashboard Island (Public Version)
 *
 * Two states:
 * 1. New user (no profile) → Welcome hero + sample profiles
 * 2. Returning user → Regime comparison, savings, stats, actions
 */

import { useState, useEffect } from 'react';
import { compareRegimes, getOptimizationSuggestions } from '../../lib/tax-engine';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
import { loadProfile } from '../../lib/profile-store';
import { generateActions } from '../../lib/action-generator';
import { SAMPLE_PROFILES } from '../../data/default-profile';
import { saveProfile } from '../../lib/profile-store';
import {
  formatCurrency,
  formatPercent,
} from '../../lib/formatters';
import type { UserProfile, RegimeComparison, Suggestion } from '../../lib/types';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [comparison, setComparison] = useState<RegimeComparison | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [visible, setVisible] = useState(false);

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

  // Loading state
  if (profile === undefined) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-muted)' }}>Loading...</div>;
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

  return (
    <div className="dashboard" style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)' }}>
        {getGreeting()}, {profile.name} 👋
      </h1>
      <p className="page-subtitle">Tax Year 2026-27 • Your personalized tax intelligence</p>

      {/* Hero Savings Card */}
      <div style={{
        background: 'var(--accent-gradient)', borderRadius: 'var(--radius-xl, 16px)',
        padding: 'var(--space-8)', marginBottom: 'var(--space-6)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)',
            padding: '4px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
            marginBottom: 'var(--space-4)', backdropFilter: 'blur(10px)',
          }}>
            🏆 {winner === 'new' ? 'New' : 'Old'} Regime Recommended
          </div>

          <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 'var(--space-2)', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(savings)}
          </div>
          <div style={{ fontSize: 'var(--text-md)', opacity: 0.85, marginBottom: 'var(--space-4)' }}>
            saved by choosing {winner === 'new' ? 'New' : 'Old'} Regime
          </div>
          <p style={{ fontSize: 'var(--text-sm)', opacity: 0.75, lineHeight: 'var(--leading-relaxed)', maxWidth: '600px' }}>
            {comparison!.explanation}
          </p>
        </div>
      </div>

      {/* Regime Comparison */}
      <div className="regime-comparison" style={{ marginBottom: 'var(--space-6)' }}>
        <RegimeCard result={newRegime} isWinner={winner === 'new'} label="New Regime" emoji="🆕" />
        <RegimeCard result={oldRegime} isWinner={winner === 'old'} label="Old Regime" emoji="🏛️" />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatCard icon="📊" label="Effective Rate" value={formatPercent(bestResult.effectiveTaxRate)} accent="default" />
        <StatCard icon="💰" label="Monthly Take-Home" value={formatCurrency(bestResult.monthlyTakeHome)} accent="success" />
        <StatCard icon="📅" label="Monthly TDS" value={formatCurrency(bestResult.monthlyTDS)} accent="default" />
        <StatCard icon="🎯" label="Optimization" value={`${optimizationScore}%`} accent={optimizationScore >= 80 ? 'success' : 'warning'} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', borderColor: 'var(--color-warning)', borderWidth: '1px' }}>
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
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', marginTop: '6px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{action.text}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{action.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit profile link */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', paddingBottom: 'var(--space-4)' }}>
        <a href="/setup" className="btn btn-ghost btn-sm">✏️ Edit Profile</a>
      </div>
    </div>
  );
}

// ── Welcome Screen (No Profile) ──

function WelcomeScreen({ visible, onSelectSample }: { visible: boolean; onSelectSample: (p: UserProfile) => void }) {
  function loadSample(profile: UserProfile) {
    onSelectSample(profile);
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
    }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: 'var(--space-10) var(--space-4)',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)' }}>🧠</div>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          Your Tax Intelligence Platform
        </h2>
        <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Compare New vs Old regime, optimize salary structure, and plan tax-saving strategies. Built for Indian salaried professionals.
        </p>
        <a href="/setup" className="btn btn-primary btn-lg">
          🚀 Set Up My Profile
        </a>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
          🔒 100% private — all data stays in your browser
        </p>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <FeatureCard icon="⚖️" title="Regime Comparison" desc="Instant side-by-side comparison of New vs Old tax regime with slab-by-slab breakdown" />
        <FeatureCard icon="🎛️" title="What-If Simulator" desc="Drag sliders to see how rent, NPS, home loans, and salary changes affect your tax" />
        <FeatureCard icon="📚" title="Knowledge Base" desc="Plain-English articles on 80C, 80D, NPS, HRA, salary restructuring, and more" />
        <FeatureCard icon="✅" title="Action Checklist" desc="Personalized to-do list based on your profile — job switch, investments, deadlines" />
      </div>

      {/* Sample Profiles */}
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
          Explore with a sample profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
          {SAMPLE_PROFILES.map(sp => (
            <button key={sp.id} onClick={() => loadSample(sp.profile)} style={{
              cursor: 'pointer', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)',
              textAlign: 'center', transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{sp.emoji}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{sp.ctc} CTC</div>
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

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{title}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>{desc}</div>
    </div>
  );
}

function RegimeCard({ result, isWinner, label, emoji }: {
  result: RegimeComparison['newRegime']; isWinner: boolean; label: string; emoji: string;
}) {
  return (
    <div className={`card ${isWinner ? 'card-success' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{emoji}</span> {label}
        </h3>
        {isWinner && <span className="badge badge-success">✓ Recommended</span>}
      </div>
      <div className={`tax-amount ${isWinner ? 'tax-amount-savings' : 'tax-amount-positive'}`} style={{ marginBottom: 'var(--space-4)' }}>
        {formatCurrency(result.totalTax)}
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

function StatCard({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent: 'success' | 'warning' | 'default';
}) {
  const accentColor = accent === 'success' ? 'var(--color-success)' : accent === 'warning' ? 'var(--color-warning)' : 'var(--text-primary)';
  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <a href={href} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{icon}</span>
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
