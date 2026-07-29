/**
 * TaxBrain — Scenario Simulator Island
 *
 * Interactive "what-if" analysis with sliders:
 * - Rent slider (₹0 – ₹1L/month)
 * - Salary slider (₹5L – ₹1Cr CTC)
 * - Home loan interest toggle + amount
 * - NPS percentage slider (0% – 14%)
 *
 * Shows live regime comparison chart as sliders move.
 * Identifies breakeven points.
 */

import { useState, useEffect, useMemo } from 'react';
import { compareRegimes, findBreakeven } from '../../lib/tax-engine';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
import { loadProfile, saveProfile } from '../../lib/profile-store';
import { SAMPLE_PROFILES } from '../../data/default-profile';
import { formatCurrency, formatCurrencyShort, formatPercent } from '../../lib/formatters';
import type { UserProfile } from '../../lib/types';

export default function Simulator() {
  const [baseProfile, setBaseProfile] = useState<UserProfile | null | undefined>(undefined);
  const [rent, setRent] = useState(13000);
  const [salaryMultiplier, setSalaryMultiplier] = useState(100);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);
  const [npsPercent, setNpsPercent] = useState(14);
  const [mealVouchers, setMealVouchers] = useState(true);

  useEffect(() => {
    const p = loadProfile();
    setBaseProfile(p);
    if (p && p.jobs.length > 0) {
      setRent(p.monthlyRent);
      setMealVouchers(p.optimizations.mealVouchers);
      setHomeLoanInterest(p.deductions.section24B);
      setNpsPercent(p.optimizations.employerNPS ? 14 : 0);
    }
  }, []);

  if (baseProfile === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-muted)' }}>
        Loading simulator...
      </div>
    );
  }

  // Build modified profile from slider values
  const modifiedProfile = useMemo(() => {
    if (!baseProfile) return null;
    const p = structuredClone(baseProfile);
    p.monthlyRent = rent;
    p.deductions.section24B = homeLoanInterest;
    p.optimizations.employerNPS = npsPercent > 0;
    p.optimizations.mealVouchers = mealVouchers;

    // Scale salary by multiplier
    if (salaryMultiplier !== 100) {
      const ratio = salaryMultiplier / 100;
      for (const job of p.jobs) {
        const c = job.components;
        c.basic = Math.round((c.basic ?? 0) * ratio);
        c.hra = Math.round((c.hra ?? 0) * ratio);
        c.lta = Math.round((c.lta ?? 0) * ratio);
        c.specialAllowance = Math.round((c.specialAllowance ?? 0) * ratio);
        c.fuelMaintenance = Math.round((c.fuelMaintenance ?? 0) * ratio);
        c.flexiBasket = Math.round((c.flexiBasket ?? 0) * ratio);
        c.managementAllowance = Math.round((c.managementAllowance ?? 0) * ratio);
        c.otherAllowances = Math.round((c.otherAllowances ?? 0) * ratio);
        job.variablePay = Math.round((job.variablePay ?? 0) * ratio);
        job.employerPF = Math.round((job.employerPF ?? 0) * ratio);
      }
    }

    return p;
  }, [baseProfile, rent, salaryMultiplier, homeLoanInterest, npsPercent, mealVouchers]);

  const comparison = useMemo(() => {
    if (!modifiedProfile) return null;
    return compareRegimes(modifiedProfile, TAX_CONFIG_FY2026);
  }, [modifiedProfile]);

  // Breakeven: what rent makes old regime better?
  const rentBreakeven = useMemo(() => {
    if (!baseProfile) return 0;
    return findBreakeven(baseProfile, TAX_CONFIG_FY2026, 'rent');
  }, [baseProfile]);

  const handleSelectSample = (sample: UserProfile) => {
    saveProfile(sample);
    setBaseProfile(sample);
    setRent(sample.monthlyRent);
    setMealVouchers(sample.optimizations.mealVouchers);
    setHomeLoanInterest(sample.deductions.section24B);
    setNpsPercent(sample.optimizations.employerNPS ? 14 : 0);
  };

  if (!baseProfile || baseProfile.jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🎛️</div>
        <h1 className="page-title">Scenario Simulator</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Set up your custom profile or choose a demo profile below to test what-if scenarios with live sliders.
        </p>
        <a href="/setup" className="btn btn-primary btn-lg" style={{ marginBottom: 'var(--space-8)' }}>Set Up Profile →</a>

        <div className="divider" style={{ marginBottom: 'var(--space-6)' }} />

        <h3 style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
          Or try a quick demo profile:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {SAMPLE_PROFILES.map(sp => (
            <button key={sp.id} className="card" onClick={() => handleSelectSample(sp.profile)}
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
    return <div className="loading">Calculating scenarios...</div>;
  }

  const { newRegime, oldRegime, winner, savings } = comparison;
  const savingsPerDay = Math.round(savings / 365);

  // Auto-scale rent slider: max = 50% of monthly take-home (minimum 100,000)
  const rentSliderMax = Math.max(100000, Math.round((newRegime.monthlyTakeHome * 0.5) / 5000) * 5000);

  return (
    <div className="simulator">
      <h1 className="page-title">Scenario Simulator</h1>
      <p className="page-subtitle">
        Drag the sliders to explore "what-if" scenarios instantly
      </p>

      {/* Results Banner */}
      <div className="winner-banner" style={{ marginBottom: 'var(--space-6)' }}>
        <span style={{ fontSize: '1.25rem' }}>
          {winner === 'new' ? '🆕' : '🏛️'}
        </span>
        <span>
          {winner === 'new' ? 'New' : 'Old'} Regime saves{' '}
          <strong>{formatCurrency(savings)}</strong>
          {' '}at these settings
        </span>
      </div>

      <div className="simulator-grid">
        {/* ── LEFT: Sliders ── */}
        <div className="simulator-controls">
          {/* Rent Slider */}
          <SliderCard
            label="Monthly Rent"
            value={rent}
            min={0}
            max={rentSliderMax}
            step={1000}
            formatValue={(v) => formatCurrency(v)}
            onChange={setRent}
            info={rent > 0 && rentBreakeven > 0
              ? `Old regime becomes better at ~${formatCurrency(rentBreakeven)}/month`
              : 'Set to 0 if you own your home'
            }
          />

          {/* Salary Slider */}
          <SliderCard
            label="Salary Scale"
            value={salaryMultiplier}
            min={50}
            max={300}
            step={5}
            formatValue={(v) => `${v}% of current`}
            onChange={setSalaryMultiplier}
            info={salaryMultiplier !== 100
              ? `Effective CTC: ~${formatCurrencyShort(newRegime.grossSalary)}`
              : 'Current salary'
            }
          />

          {/* Home Loan Interest */}
          <SliderCard
            label="Home Loan Interest (Sec 24b)"
            value={homeLoanInterest}
            min={0}
            max={200000}
            step={5000}
            formatValue={(v) => formatCurrency(v)}
            onChange={setHomeLoanInterest}
            info="Old regime only. Max ₹2L for self-occupied property"
          />

          {/* NPS Toggle */}
          <SliderCard
            label="Employer NPS"
            value={npsPercent}
            min={0}
            max={14}
            step={1}
            formatValue={(v) => `${v}% of Basic`}
            onChange={setNpsPercent}
            info="14% max in New Regime, 10% in Old (private)"
          />

          {/* Meal Vouchers */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>Meal Vouchers</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  ₹200/meal × 2 meals × 22 days = ~₹8,800/month tax-free
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={mealVouchers}
                onChange={(e) => setMealVouchers(e.target.checked)}
                role="switch"
                aria-label="Toggle meal vouchers"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="simulator-results">
          {/* Regime Comparison Bars */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="section-title">Tax Comparison</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <RegimeBar
                label="New Regime"
                tax={newRegime.totalTax}
                maxTax={Math.max(newRegime.totalTax, oldRegime.totalTax)}
                isWinner={winner === 'new'}
                takeHome={newRegime.monthlyTakeHome}
                effectiveRate={newRegime.effectiveTaxRate}
              />
              <RegimeBar
                label="Old Regime"
                tax={oldRegime.totalTax}
                maxTax={Math.max(newRegime.totalTax, oldRegime.totalTax)}
                isWinner={winner === 'old'}
                takeHome={oldRegime.monthlyTakeHome}
                effectiveRate={oldRegime.effectiveTaxRate}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-4)', marginBottom: 'var(--space-4)',
          }}>
            <MetricCard
              label="Annual Tax Savings"
              value={formatCurrency(savings)}
              subValue={savingsPerDay > 0 ? `≈ ${formatCurrency(savingsPerDay)}/day` : undefined}
              accent="success"
            />
            <MetricCard
              label="Monthly Difference"
              value={formatCurrency(Math.round(savings / 12))}
              subValue={savings > 0 ? `${winner === 'new' ? 'New' : 'Old'} regime wins` : undefined}
              accent="success"
            />
            <MetricCard
              label="New Regime Rate"
              value={formatPercent(newRegime.effectiveTaxRate)}
              accent={winner === 'new' ? 'success' : 'default'}
            />
            <MetricCard
              label="Old Regime Rate"
              value={formatPercent(oldRegime.effectiveTaxRate)}
              accent={winner === 'old' ? 'success' : 'default'}
            />
          </div>

          {/* Insight Card */}
          <div className="card card-glass">
            <h3 className="section-title">💡 Insight</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {comparison.explanation}
            </p>
            {rentBreakeven > 0 && rent < rentBreakeven && (
              <p style={{
                marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              }}>
                📌 <strong>Rent breakeven:</strong> If your rent exceeds{' '}
                <strong>{formatCurrency(rentBreakeven)}/month</strong>, Old Regime becomes better
                (due to HRA exemption).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SliderCard({ label, value, min, max, step, formatValue, onChange, info }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  onChange: (v: number) => void;
  info?: string;
}) {
  // Compute fill percentage for CSS gradient track
  const fillPct = max > min ? Math.round(((value - min) / (max - min)) * 100) : 0;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 'var(--space-3)',
      }}>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--accent-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ '--slider-fill': `${fillPct}%` } as React.CSSProperties}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
        marginTop: 'var(--space-1)',
      }}>
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
      {info && (
        <div style={{
          marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)', fontStyle: 'italic',
        }}>
          {info}
        </div>
      )}
    </div>
  );
}

function RegimeBar({ label, tax, maxTax, isWinner, takeHome, effectiveRate }: {
  label: string;
  tax: number;
  maxTax: number;
  isWinner: boolean;
  takeHome: number;
  effectiveRate: number;
}) {
  const barWidth = maxTax > 0 ? Math.max(8, (tax / maxTax) * 100) : 0;

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {isWinner && <span className="badge badge-success">✓ Better</span>}
        </div>
        <span style={{
          fontWeight: 700, fontSize: 'var(--text-lg)',
          fontVariantNumeric: 'tabular-nums',
          color: isWinner ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
          {formatCurrency(tax)}
        </span>
      </div>

      {/* Visual bar */}
      <div style={{
        height: '12px', background: 'var(--bg-surface-raised)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${barWidth}%`,
          background: isWinner
            ? 'linear-gradient(90deg, var(--green-600), var(--green-400))'
            : 'linear-gradient(90deg, var(--red-600), var(--red-400))',
          borderRadius: 'var(--radius-full)',
          transition: 'width var(--transition-base)',
        }} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
        marginTop: 'var(--space-1)',
      }}>
        <span>Take-home: {formatCurrency(takeHome)}/mo</span>
        <span>Rate: {formatPercent(effectiveRate)}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, accent }: {
  label: string;
  value: string;
  subValue?: string;
  accent: 'success' | 'default';
}) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
        marginBottom: 'var(--space-1)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--text-lg)', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: accent === 'success' ? 'var(--color-success)' : 'var(--text-primary)',
      }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subValue}
        </div>
      )}
    </div>
  );
}
