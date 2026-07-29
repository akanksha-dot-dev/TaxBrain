/**
 * TaxBrain — Calculator Island
 *
 * Full interactive tax calculator with:
 * - Job tabs (multi-job support)
 * - Per-component salary inputs
 * - Optimization toggles
 * - Live dual-regime comparison
 * - Step-by-step slab breakdown
 *
 * All calculations happen in the tax engine (src/lib/tax-engine.ts).
 * This component is purely UI.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { compareRegimes } from '../../lib/tax-engine';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
import { loadProfile, saveProfile } from '../../lib/profile-store';
import { SAMPLE_PROFILES } from '../../data/default-profile';
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  parseCurrencyInput,
} from '../../lib/formatters';
import type { UserProfile, TaxResult, SlabBreakdown, RegimeComparison } from '../../lib/types';

export default function Calculator() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    optimizations: true,
    'job-0': true,
  });
  const [activeSlabTab, setActiveSlabTab] = useState<'new' | 'old'>('new');

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const comparison = useMemo(() => {
    if (!profile) return null;
    return compareRegimes(profile, TAX_CONFIG_FY2026);
  }, [profile]);

  const updateProfile = useCallback((updater: (p: UserProfile) => UserProfile) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveProfile(updated);
      return updated;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (profile === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-muted)' }}>
        Loading calculator...
      </div>
    );
  }

  const handleLoadSample = (sample: UserProfile) => {
    saveProfile(sample);
    setProfile(sample);
  };

  if (!profile || profile.jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🧮</div>
        <h1 className="page-title">Tax Calculator</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Set up your custom salary profile or pick a sample profile below to explore interactive dual-regime tax calculations immediately.
        </p>
        <a href="/setup" className="btn btn-primary btn-lg" style={{ marginBottom: 'var(--space-8)' }}>Set Up My Profile →</a>

        <div className="divider" style={{ marginBottom: 'var(--space-6)' }} />

        <h3 style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
          Or try a quick demo profile:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {SAMPLE_PROFILES.map(sp => (
            <button key={sp.id} className="card" onClick={() => handleLoadSample(sp.profile)}
              style={{
                cursor: 'pointer', textAlign: 'center', padding: 'var(--space-4)',
                border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-raised)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{sp.emoji}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{sp.ctc} CTC</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return <div className="loading">Calculating...</div>;
  }

  return (
    <div className="calculator">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Tax Calculator</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Compare New vs Old regime with your actual salary structure
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm no-print"
          onClick={() => window.print()}
          title="Print or Save PDF"
        >
          🖨️ Save PDF
        </button>
      </div>

      <div className="calculator-grid">
        {/* ── LEFT: Input Panel ── */}
        <div className="calculator-inputs">
          {/* Personal Info */}
          <Section
            title="📍 Personal Info"
            id="personal"
            isOpen={!!openSections['personal']}
            onToggle={() => toggleSection('personal')}
          >
            <div className="input-row">
              <InputField
                label="City"
                value={profile.city}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  city: v,
                  isMetroCity: TAX_CONFIG_FY2026.metroCities.some(
                    m => m.toLowerCase() === v.toLowerCase()
                  ),
                }))}
                type="text"
              />
              <InputField
                label="Monthly Rent"
                value={profile.monthlyRent}
                onChange={(v) => updateProfile(p => ({ ...p, monthlyRent: parseCurrencyInput(String(v)) }))}
                type="currency"
              />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              {profile.isMetroCity ? '🏙️ Metro city (50% HRA)' : '🏘️ Non-metro (40% HRA)'}
            </div>
          </Section>

          {/* Job Tabs */}
          {profile.jobs.map((job, idx) => (
            <Section
              key={job.id}
              title={`💼 ${job.employer} (${getMonthName(job.startMonth)}–${getMonthName(job.endMonth)})`}
              id={`job-${idx}`}
              isOpen={openSections[`job-${idx}`] ?? (idx === profile.jobs.length - 1)}
              onToggle={() => toggleSection(`job-${idx}`)}
            >
              <div className="input-row">
                <InputField
                  label="Basic"
                  value={job.components.basic}
                  onChange={(v) => updateJobField(updateProfile, idx, 'basic', v)}
                  type="currency"
                />
                <InputField
                  label="HRA"
                  value={job.components.hra}
                  onChange={(v) => updateJobField(updateProfile, idx, 'hra', v)}
                  type="currency"
                />
              </div>
              <div className="input-row">
                <InputField
                  label="Special Allowance"
                  value={job.components.specialAllowance}
                  onChange={(v) => updateJobField(updateProfile, idx, 'specialAllowance', v)}
                  type="currency"
                />
                <InputField
                  label="LTA"
                  value={job.components.lta}
                  onChange={(v) => updateJobField(updateProfile, idx, 'lta', v)}
                  type="currency"
                />
              </div>
              <div className="input-row">
                <InputField
                  label="Variable Pay"
                  value={job.variablePay}
                  onChange={(v) => updateProfile(p => {
                    const jobs = [...p.jobs];
                    jobs[idx] = { ...jobs[idx], variablePay: parseCurrencyInput(String(v)) };
                    return { ...p, jobs };
                  })}
                  type="currency"
                />
                <InputField
                  label="Variable %"
                  value={job.variablePayPercent}
                  onChange={(v) => updateProfile(p => {
                    const jobs = [...p.jobs];
                    jobs[idx] = { ...jobs[idx], variablePayPercent: Number(v) || 0 };
                    return { ...p, jobs };
                  })}
                  type="number"
                  suffix="%"
                />
              </div>
            </Section>
          ))}

          {/* Optimizations */}
          <Section
            title="⚡ Optimizations"
            id="optimizations"
            isOpen={!!openSections['optimizations']}
            onToggle={() => toggleSection('optimizations')}
          >
            <ToggleField
              label="Employer NPS (14% of Basic)"
              checked={profile.optimizations.employerNPS}
              onChange={(v) => updateProfile(p => ({ ...p, optimizations: { ...p.optimizations, employerNPS: v } }))}
              info="Biggest tax saver. Ask HR to restructure CTC"
            />
            <ToggleField
              label="Meal Vouchers (₹200/meal)"
              checked={profile.optimizations.mealVouchers}
              onChange={(v) => updateProfile(p => ({ ...p, optimizations: { ...p.optimizations, mealVouchers: v } }))}
              info="Tax-free in both regimes"
            />
            <ToggleField
              label="Phone Reimbursement"
              checked={profile.optimizations.phoneReimbursement}
              onChange={(v) => updateProfile(p => ({ ...p, optimizations: { ...p.optimizations, phoneReimbursement: v } }))}
              info={`₹${formatNumber(profile.optimizations.monthlyPhoneAmount)}/month with bills`}
            />
          </Section>

          {/* Old Regime Deductions */}
          <Section
            title="📋 Old Regime Deductions"
            id="deductions"
            isOpen={!!openSections['deductions']}
            onToggle={() => toggleSection('deductions')}
          >
            <div className="input-row">
              <InputField
                label="80C: ELSS Investment"
                value={profile.deductions.section80C.elss}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: {
                    ...p.deductions,
                    section80C: { ...p.deductions.section80C, elss: parseCurrencyInput(String(v)) },
                  },
                }))}
                type="currency"
              />
              <InputField
                label="80CCD(1B): NPS Self"
                value={profile.deductions.section80CCD1B}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: { ...p.deductions, section80CCD1B: parseCurrencyInput(String(v)) },
                }))}
                type="currency"
              />
            </div>
            <div className="input-row">
              <InputField
                label="80D: Self Health"
                value={profile.deductions.section80D.selfPremium}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: {
                    ...p.deductions,
                    section80D: { ...p.deductions.section80D, selfPremium: parseCurrencyInput(String(v)) },
                  },
                }))}
                type="currency"
              />
              <InputField
                label="80D: Parents Health"
                value={profile.deductions.section80D.parentsPremium}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: {
                    ...p.deductions,
                    section80D: { ...p.deductions.section80D, parentsPremium: parseCurrencyInput(String(v)) },
                  },
                }))}
                type="currency"
              />
            </div>
            <div className="input-row">
              <InputField
                label="24(b): Home Loan Interest"
                value={profile.deductions.section24B}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: { ...p.deductions, section24B: parseCurrencyInput(String(v)) },
                }))}
                type="currency"
              />
              <InputField
                label="80TTA: Savings Interest"
                value={profile.deductions.section80TTA}
                onChange={(v) => updateProfile(p => ({
                  ...p,
                  deductions: { ...p.deductions, section80TTA: Math.min(10000, parseCurrencyInput(String(v))) },
                }))}
                type="currency"
              />
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Results Panel ── */}
        <div className="calculator-results">
          {/* Winner Banner */}
          <div className="winner-banner" style={{ marginBottom: 'var(--space-6)' }}>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
            <span>
              {comparison.winner === 'new' ? 'New' : 'Old'} Regime saves you{' '}
              <strong>{formatCurrency(comparison.savings)}</strong>
            </span>
          </div>

          {/* Side-by-side comparison */}
          <div className="regime-comparison" style={{ marginBottom: 'var(--space-6)' }}>
            <ResultCard result={comparison.newRegime} isWinner={comparison.winner === 'new'} />
            <ResultCard result={comparison.oldRegime} isWinner={comparison.winner === 'old'} />
          </div>

          {/* Step-by-step breakdown */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h3 className="section-title" style={{ margin: 0 }}>📊 Slab-by-Slab Breakdown</h3>
              <CopyBreakdownButton comparison={comparison} />
            </div>
            <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
              <button
                className={`tab ${activeSlabTab === 'new' ? 'active' : ''}`}
                onClick={() => setActiveSlabTab('new')}
              >
                New Regime
              </button>
              <button
                className={`tab ${activeSlabTab === 'old' ? 'active' : ''}`}
                onClick={() => setActiveSlabTab('old')}
              >
                Old Regime
              </button>
            </div>
            <SlabTable breakdown={comparison[activeSlabTab === 'new' ? 'newRegime' : 'oldRegime'].slabBreakdown} />
          </div>

          {/* Computation Steps */}
          <div className="card">
            <h3 className="section-title">🔍 How It's Calculated</h3>
            <ComputationSteps result={comparison.newRegime} label="New Regime" />
            <div className="divider" />
            <ComputationSteps result={comparison.oldRegime} label="Old Regime" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Section({ title, id, isOpen, onToggle, children }: {
  title: string;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <button
        className="accordion-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
        style={{ padding: 0, marginBottom: isOpen ? 'var(--space-4)' : 0 }}
      >
        <span>{title}</span>
        <span className="chevron">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div id={`section-${id}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, type, suffix }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type: 'text' | 'currency' | 'number';
  suffix?: string;
}) {
  const displayValue = type === 'currency' && typeof value === 'number'
    ? formatNumber(value)
    : String(value);

  return (
    <div className="input-group" style={{ flex: 1 }}>
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        {type === 'currency' && (
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 'var(--text-sm)', pointerEvents: 'none',
          }}>₹</span>
        )}
        <input
          className="input"
          type="text"
          inputMode={type === 'text' ? 'text' : 'numeric'}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          style={type === 'currency' ? { paddingLeft: '28px' } : undefined}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 'var(--text-sm)', pointerEvents: 'none',
          }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ToggleField({ label, checked, onChange, info }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info?: string;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-3) 0',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      userSelect: 'none',
    }}>
      <div>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>{label}</div>
        {info && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{info}</div>}
      </div>
      <input
        type="checkbox"
        className="toggle"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        role="switch"
        aria-label={label}
      />
    </label>
  );
}

function ResultCard({ result, isWinner }: {
  result: TaxResult;
  isWinner: boolean;
}) {
  return (
    <div className={`card ${isWinner ? 'card-success' : ''}`} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{result.regimeName}</h3>
        {isWinner && <span className="badge badge-success">✓ Better</span>}
      </div>
      <div className={`tax-amount ${isWinner ? 'tax-amount-savings' : 'tax-amount-positive'}`}>
        {formatCurrency(result.totalTax)}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
        Effective rate: {formatPercent(result.effectiveTaxRate)} • Take-home: {formatCurrency(result.monthlyTakeHome)}/mo
      </div>
    </div>
  );
}

function SlabTable({ breakdown }: { breakdown: readonly SlabBreakdown[] }) {
  return (
    <table className="slab-table">
      <thead>
        <tr>
          <th>Income Slab</th>
          <th className="amount">Taxable Amount</th>
          <th className="amount">Tax</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((row, i) => (
          <tr key={i} style={{ opacity: row.taxableInSlab === 0 ? 0.4 : 1 }}>
            <td>
              {row.slab.label}
              <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                @ {(row.slab.rate * 100).toFixed(0)}%
              </span>
            </td>
            <td className="amount">{formatCurrency(row.taxableInSlab)}</td>
            <td className="amount">{formatCurrency(row.taxOnSlab)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComputationSteps({ result, label }: { result: TaxResult; label: string }) {
  return (
    <div>
      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>{label}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <StepRow label="Gross Salary" value={result.grossSalary} />
        {result.exemptions.map((ex, i) => (
          <StepRow key={i} label={`- ${ex.name}`} value={-ex.amount} indent detail={ex.details} />
        ))}
        <StepRow label="= Gross Taxable Income" value={result.grossTaxableIncome} bold />
        {result.deductions.map((ded, i) => (
          <StepRow key={i} label={`- ${ded.name} (${ded.section})`} value={-ded.claimed} indent />
        ))}
        <StepRow label="= Net Taxable Income" value={result.netTaxableIncome} bold />
        <div className="divider" style={{ margin: 'var(--space-1) 0' }} />
        <StepRow label="Tax (from slabs)" value={result.taxBeforeRebate} />
        {result.rebate > 0 && <StepRow label="- Rebate (Sec 87A/156)" value={-result.rebate} indent />}
        {result.marginalRelief > 0 && <StepRow label="- Marginal Relief" value={-result.marginalRelief} indent />}
        {result.surcharge > 0 && <StepRow label="+ Surcharge" value={result.surcharge} indent />}
        <StepRow label="+ Cess (4%)" value={result.cess} indent />
        <div className="divider" style={{ margin: 'var(--space-1) 0' }} />
        <StepRow label="Total Tax Payable" value={result.totalTax} bold highlight />
      </div>
    </div>
  );
}

function StepRow({ label, value, bold, indent, highlight, detail }: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: boolean;
  detail?: string;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontSize: 'var(--text-sm)',
      fontWeight: bold ? 600 : 400,
      paddingLeft: indent ? 'var(--space-4)' : 0,
      color: highlight ? (value > 0 ? 'var(--color-danger)' : 'var(--color-success)') : 'var(--text-primary)',
    }}>
      <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>
        {label}
        {detail && (
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {detail}
          </span>
        )}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
        {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </span>
    </div>
  );
}

// ============================================================
// COPY BREAKDOWN COMPONENT
// ============================================================

function CopyBreakdownButton({ comparison }: { comparison: RegimeComparison }) {
  const [copied, setCopied] = useState(false);

  function buildText(): string {
    const { newRegime: nr, oldRegime: or, winner, savings } = comparison;
    const lines: string[] = [
      '═══════════════════════════════════',
      '  TaxBrain · Tax Breakdown FY2026-27',
      '═══════════════════════════════════',
      '',
      `  Winner: ${winner === 'new' ? 'New Regime' : 'Old Regime'} (saves ${formatCurrency(savings)})`,
      '',
      '┌─ NEW REGIME ─────────────────────',
      `│  Total Tax:      ${formatCurrency(nr.totalTax)}`,
      `│  Taxable Income: ${formatCurrency(nr.netTaxableIncome)}`,
      `│  Effective Rate: ${formatPercent(nr.effectiveTaxRate)}`,
      `│  Take-Home/mo:   ${formatCurrency(nr.monthlyTakeHome)}`,
      '',
      '┌─ OLD REGIME ─────────────────────',
      `│  Total Tax:      ${formatCurrency(or.totalTax)}`,
      `│  Taxable Income: ${formatCurrency(or.netTaxableIncome)}`,
      `│  Effective Rate: ${formatPercent(or.effectiveTaxRate)}`,
      `│  Take-Home/mo:   ${formatCurrency(or.monthlyTakeHome)}`,
      '',
      '  Generated by TaxBrain · tax.akanksha.dev',
      '═══════════════════════════════════',
    ];
    return lines.join('\n');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a textarea
      const ta = document.createElement('textarea');
      ta.value = buildText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      className="btn btn-ghost btn-sm no-print"
      onClick={handleCopy}
      style={{ gap: '6px', transition: 'all 0.2s ease' }}
      title="Copy breakdown to clipboard"
    >
      {copied ? '✅ Copied!' : '📋 Copy'}
    </button>
  );
}

// ============================================================
// HELPERS
// ============================================================

function updateJobField(
  updateProfile: (updater: (p: UserProfile) => UserProfile) => void,
  jobIndex: number,
  field: keyof UserProfile['jobs'][0]['components'],
  value: string
) {
  updateProfile(p => {
    const jobs = [...p.jobs];
    jobs[jobIndex] = {
      ...jobs[jobIndex],
      components: {
        ...jobs[jobIndex].components,
        [field]: parseCurrencyInput(value),
      },
    };
    return { ...p, jobs };
  });
}

function getMonthName(fyMonth: number): string {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return months[fyMonth - 1] || '?';
}
