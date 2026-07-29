/**
 * TaxBrain — Onboarding Wizard / Profile Editor
 *
 * Two modes:
 * 1. New user (no profile) → 3-step wizard with sample profiles
 * 2. Existing user → Pre-filled form for editing + Reset button
 *
 * Steps: Basics → Salary → Optimizations → Dashboard
 */

import { useState, useEffect } from 'react';
import { loadProfile, saveProfile, clearProfile, exportProfile, importProfile } from '../../lib/profile-store';
import { EMPTY_PROFILE, SAMPLE_PROFILES } from '../../data/default-profile';
import { formatCurrency } from '../../lib/formatters';
import { isMetroCity } from '../../lib/tax-rules';
import type { UserProfile, JobProfile } from '../../lib/types';

const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune',
  'Chennai', 'Kolkata', 'Gurugram', 'Noida', 'Ahmedabad',
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [validationError, setValidationError] = useState('');

  // Step 1: Basics
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [city, setCity] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(0);

  // Step 2: Salary
  const [annualCTC, setAnnualCTC] = useState(0);
  const [basicPercent, setBasicPercent] = useState(40);
  const [hasJobSwitch, setHasJobSwitch] = useState(false);
  const [switchMonth, setSwitchMonth] = useState(6);
  const [newCTC, setNewCTC] = useState(0);

  // Step 3: Optimizations
  const [wantNPS, setWantNPS] = useState(false);
  const [wantMeals, setWantMeals] = useState(false);
  const [hasHealthInsurance, setHasHealthInsurance] = useState(false);
  const [healthPremium, setHealthPremium] = useState(15000);
  const [homeLoanInterest, setHomeLoanInterest] = useState(0);

  // On mount: pre-fill from existing profile if one exists
  useEffect(() => {
    const existing = loadProfile();
    if (existing && existing.jobs.length > 0) {
      setIsEditing(true);
      setName(existing.name);
      setAge(existing.age);
      setCity(existing.city);
      setMonthlyRent(existing.monthlyRent);

      // Reverse-engineer CTC from job components
      // Load annualized CTC from components (including variable pay and employer PF)
      const currentJob = existing.jobs.find(j => j.isCurrentJob) || existing.jobs[0];
      const c = currentJob.components;
      const annualized = (c.basic ?? 0) + (c.hra ?? 0) + (c.specialAllowance ?? 0) + (c.lta ?? 0) +
        (c.fuelMaintenance ?? 0) + (c.flexiBasket ?? 0) + (c.managementAllowance ?? 0) + (c.otherAllowances ?? 0) +
        (currentJob.employerPF ?? 0) + (currentJob.variablePay ?? 0);
      setAnnualCTC(annualized);

      // Estimate basic % from components
      if (annualized > 0) {
        setBasicPercent(Math.round((c.basic / annualized) * 100));
      }

      // Multi-job detection
      if (existing.jobs.length > 1) {
        setHasJobSwitch(true);
        const newJob = existing.jobs.find(j => j.isCurrentJob);
        if (newJob) {
          setSwitchMonth(Math.max(2, newJob.startMonth));
          const nc = newJob.components;
          setNewCTC((nc.basic ?? 0) + (nc.hra ?? 0) + (nc.specialAllowance ?? 0) + (nc.lta ?? 0) +
            (nc.fuelMaintenance ?? 0) + (nc.flexiBasket ?? 0) + (nc.managementAllowance ?? 0) + (nc.otherAllowances ?? 0) +
            (newJob.employerPF ?? 0) + (newJob.variablePay ?? 0));
        }
        const prevJob = existing.jobs.find(j => !j.isCurrentJob) || existing.jobs[0];
        const pc = prevJob.components;
        setAnnualCTC((pc.basic ?? 0) + (pc.hra ?? 0) + (pc.specialAllowance ?? 0) + (pc.lta ?? 0) +
          (pc.fuelMaintenance ?? 0) + (pc.flexiBasket ?? 0) + (pc.managementAllowance ?? 0) + (pc.otherAllowances ?? 0) +
          (prevJob.employerPF ?? 0) + (prevJob.variablePay ?? 0));
      }

      // Optimizations
      setWantNPS(existing.optimizations.employerNPS);
      setWantMeals(existing.optimizations.mealVouchers);
      setHasHealthInsurance((existing.deductions.section80D?.selfPremium ?? 0) > 0);
      setHealthPremium(existing.deductions.section80D?.selfPremium || 15000);
      setHomeLoanInterest(existing.deductions.section24B || 0);
    }
  }, []);

  function buildProfile(): UserProfile {
    const isMetro = isMetroCity(city);
    const existing = loadProfile();

    const buildJob = (
      id: string, employer: string, ctc: number,
      startMonth: number, endMonth: number, isCurrent: boolean,
    ): JobProfile => {
      const targetJob = existing?.jobs.find(j => j.id === id || j.isCurrentJob === isCurrent);
      const targetComp = targetJob?.components;

      const annualBasic = Math.round(ctc * (basicPercent / 100));
      const annualHRA = Math.round(annualBasic * (isMetro ? 0.5 : 0.4));
      const annualPF = Math.round(annualBasic * 0.12);
      const preservedLTA = isEditing ? (targetComp?.lta ?? 0) : 0;
      const preservedFuel = isEditing ? (targetComp?.fuelMaintenance ?? 0) : 0;
      const preservedFlexi = isEditing ? (targetComp?.flexiBasket ?? 0) : 0;
      const preservedMgmt = isEditing ? (targetComp?.managementAllowance ?? 0) : 0;
      const preservedOther = isEditing ? (targetComp?.otherAllowances ?? 0) : 0;

      const annualSpecial = Math.max(
        0,
        ctc - annualBasic - annualHRA - annualPF - preservedLTA - preservedFuel - preservedFlexi - preservedMgmt - preservedOther
      );

      return {
        id, employer, startMonth, endMonth, isCurrentJob: isCurrent,
        components: {
          basic: annualBasic,
          hra: annualHRA,
          specialAllowance: annualSpecial,
          lta: preservedLTA,
          fuelMaintenance: preservedFuel,
          flexiBasket: preservedFlexi,
          managementAllowance: preservedMgmt,
          otherAllowances: preservedOther,
        },
        variablePay: isEditing ? (targetJob?.variablePay ?? 0) : 0,
        variablePayPercent: isEditing ? (targetJob?.variablePayPercent ?? 0) : 0,
        employerPF: annualPF,
      };
    };

    const jobs: JobProfile[] = [];
    if (hasJobSwitch && switchMonth > 1) {
      jobs.push(buildJob('job1', 'Previous Employer', annualCTC, 1, switchMonth - 1, false));
      jobs.push(buildJob('job2', 'Current Employer', newCTC || annualCTC, switchMonth, 12, true));
    } else {
      jobs.push(buildJob('job1', 'Employer', annualCTC, 1, 12, true));
    }

    return {
      ...EMPTY_PROFILE,
      name: name || 'User',
      age,
      city,
      isMetroCity: isMetro,
      monthlyRent,
      jobs,
      deductions: {
        ...EMPTY_PROFILE.deductions,
        section80CCD2: { enabled: wantNPS, percentage: 14 },
        section80D: {
          selfPremium: hasHealthInsurance ? healthPremium : 0,
          parentsPremium: 0,
          parentsAreSenior: false,
          preventiveCheckup: 0,
        },
        section24B: homeLoanInterest,
      },
      optimizations: {
        employerNPS: wantNPS,
        mealVouchers: wantMeals,
        phoneReimbursement: false,
        monthlyPhoneAmount: 0,
        ltaClaimed: false,
        ltaAmount: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  function handleComplete() {
    const profile = buildProfile();
    saveProfile(profile);
    window.location.href = '/';
  }

  function handleSampleProfile(profileData: UserProfile) {
    saveProfile(profileData);
    window.location.href = '/';
  }

  function handleReset() {
    clearProfile();
    // Clear all local state
    setName(''); setAge(25); setCity(''); setMonthlyRent(0);
    setAnnualCTC(0); setBasicPercent(40); setHasJobSwitch(false);
    setSwitchMonth(6); setNewCTC(0);
    setWantNPS(false); setWantMeals(false); setHasHealthInsurance(false);
    setHealthPremium(15000); setHomeLoanInterest(0);
    setIsEditing(false); setShowResetConfirm(false); setStep(1);
    setValidationError('');
  }

  function handleExportJSON() {
    const jsonStr = exportProfile();
    if (!jsonStr) return;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxbrain-profile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportSubmit() {
    setImportError('');
    if (!importJsonText.trim()) {
      setImportError('Please paste a valid TaxBrain JSON profile.');
      return;
    }
    const imported = importProfile(importJsonText);
    if (!imported) {
      setImportError('Invalid JSON or incompatible profile structure.');
      return;
    }
    setShowImportModal(false);
    window.location.href = '/';
  }

  function goToStep2() {
    if (validateStep1()) {
      setStep(2);
    }
  }

  function goToStep3() {
    if (validateStep2()) {
      setStep(3);
    }
  }

  function validateStep1(): boolean {
    setValidationError('');
    if (age < 18 || age > 100) {
      setValidationError('Please enter a valid age between 18 and 100.');
      return false;
    }
    if (monthlyRent < 0) {
      setValidationError('Monthly rent cannot be negative.');
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    setValidationError('');
    if (annualCTC <= 0) {
      setValidationError('Please enter an annual CTC greater than ₹0.');
      return false;
    }
    if (basicPercent < 30 || basicPercent > 70) {
      setValidationError('Basic salary percentage should be between 30% and 70%.');
      return false;
    }
    if (hasJobSwitch && newCTC <= 0) {
      setValidationError('Please enter a valid CTC for your new job.');
      return false;
    }
    return true;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header — Edit mode & Backup Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
        background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 'var(--space-2)'
      }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {isEditing ? '✏️ Editing existing profile' : '⚙️ Profile Tools'}
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {isEditing && (
            <button className="btn btn-ghost btn-sm" onClick={handleExportJSON} title="Download profile as JSON">
              📥 Export JSON
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => { setImportError(''); setShowImportModal(true); }}>
            📤 Import JSON
          </button>
          {isEditing && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowResetConfirm(true)}
              style={{ color: 'var(--color-danger)' }}>
              🗑️ Reset
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'var(--space-4)',
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', maxWidth: '500px', width: '100%',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              Import Profile JSON
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              Paste your saved TaxBrain JSON profile below:
            </p>
            <textarea
              className="input"
              rows={6}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder='{"name": "...", "jobs": [...]}'
            />
            {importError && (
              <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
                ⚠️ {importError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-ghost" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImportSubmit}>Load Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 500
        }}>
          ⚠️ {validationError}
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'var(--space-4)',
        }}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)', maxWidth: '400px', width: '100%',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              Reset your profile?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
              This will delete all your saved data (salary, deductions, action items) and return you to the welcome screen. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReset}
                style={{ background: 'var(--color-danger)' }}>
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{
        display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)',
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: '4px', borderRadius: 'var(--radius-full)',
            background: s <= step ? 'var(--accent-primary)' : 'var(--bg-surface-raised)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 'var(--space-2)',
          }}>
            {isEditing ? 'Edit your profile' : "Let's set up your tax profile"}
          </h2>
          <p style={{
            color: 'var(--text-secondary)', marginBottom: 'var(--space-8)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            {isEditing
              ? 'Update your details below. Changes are saved when you complete all steps.'
              : 'Takes about 60 seconds. All data stays in your browser — we never send anything to a server.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="name">Your first name</label>
              <input id="name" className="input" type="text" placeholder="e.g., Priya"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="age">Age</label>
              <input id="age" className="input" type="number" min={18} max={80}
                value={age} onChange={e => setAge(Number(e.target.value))} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="city">City you live in</label>
              <select id="city" className="input"
                value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Select city</option>
                {POPULAR_CITIES.map(c => (
                  <option key={c} value={c}>{c} {isMetroCity(c) ? '(Metro)' : ''}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Metro cities (50% HRA) vs Non-metro (40% HRA)
              </span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="rent">Monthly rent (₹)</label>
              <input id="rent" className="input" type="number" min={0} step={1000}
                placeholder="0 if you own your home"
                value={monthlyRent || ''} onChange={e => setMonthlyRent(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
            <a href="/" className="btn btn-ghost">← Dashboard</a>
            <button className="btn btn-primary" onClick={goToStep2}>
              Next: Salary →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Salary */}
      {step === 2 && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 'var(--space-2)',
          }}>
            Your salary details
          </h2>
          <p style={{
            color: 'var(--text-secondary)', marginBottom: 'var(--space-8)',
          }}>
            Enter your annual CTC. We'll estimate the component split — you can fine-tune later in the Calculator.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="ctc">Annual CTC (₹)</label>
              <input id="ctc" className="input" type="number" min={0} step={10000}
                placeholder="e.g., 1200000"
                value={annualCTC || ''} onChange={e => setAnnualCTC(Number(e.target.value))} />
              {annualCTC > 0 && (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {formatCurrency(annualCTC)} / year • {formatCurrency(Math.round(annualCTC / 12))} / month
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="basic-pct">Basic salary as % of CTC</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input id="basic-pct" className="slider" type="range" min={30} max={60}
                  value={basicPercent} onChange={e => setBasicPercent(Number(e.target.value))}
                  style={{ '--slider-fill': `${Math.round(((basicPercent - 30) / 30) * 100)}%` } as React.CSSProperties} />
                <span style={{ fontWeight: 600, minWidth: '45px', color: 'var(--text-primary)' }}>{basicPercent}%</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Most companies keep Basic at 40-50% of CTC. Check your offer letter or payslip.
              </span>
            </div>

            <div style={{
              padding: 'var(--space-4)', background: 'var(--bg-surface-raised)',
              borderRadius: 'var(--radius-md)',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer',
              }}>
                <input type="checkbox" className="toggle"
                  checked={hasJobSwitch} onChange={e => setHasJobSwitch(e.target.checked)} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  I switched jobs this financial year
                </span>
              </label>

              {hasJobSwitch && (
                <div style={{
                  marginTop: 'var(--space-4)', display: 'flex',
                  flexDirection: 'column', gap: 'var(--space-4)',
                }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="switch-month">Month you joined new job</label>
                    <select id="switch-month" className="input"
                      value={switchMonth} onChange={e => setSwitchMonth(Number(e.target.value))}>
                      {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m, i) => (
                        <option key={m} value={i + 2}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="new-ctc">New job CTC (₹/year)</label>
                    <input id="new-ctc" className="input" type="number" min={0} step={10000}
                      placeholder="CTC at new company"
                      value={newCTC || ''} onChange={e => setNewCTC(Number(e.target.value))} />
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    The CTC above ({formatCurrency(annualCTC)}) will be used for the previous job.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary"
              disabled={annualCTC <= 0}
              onClick={goToStep3}>
              Next: Optimizations →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Optimizations */}
      {step === 3 && (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 'var(--space-2)',
          }}>
            Quick optimizations
          </h2>
          <p style={{
            color: 'var(--text-secondary)', marginBottom: 'var(--space-8)',
          }}>
            Check what applies. You can always change these later.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <ToggleOption
              label="Employer NPS contribution"
              hint="14% of Basic, tax-free in both regimes. Ask HR to set it up."
              checked={wantNPS} onChange={setWantNPS}
            />
            <ToggleOption
              label="Meal vouchers / food card"
              hint="Up to ₹1,05,600/year tax-free (₹200/meal × 2 × 22 days × 12 months)"
              checked={wantMeals} onChange={setWantMeals}
            />
            <ToggleOption
              label="I have personal health insurance"
              hint="Premium qualifies for Section 80D deduction in Old Regime"
              checked={hasHealthInsurance} onChange={setHasHealthInsurance}
            />
            {hasHealthInsurance && (
              <div className="input-group" style={{ paddingLeft: 'var(--space-8)' }}>
                <label className="input-label" htmlFor="health-amt">Annual premium (₹)</label>
                <input id="health-amt" className="input" type="number" min={0} step={1000}
                  value={healthPremium} onChange={e => setHealthPremium(Number(e.target.value))} />
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="homeloan">Home loan interest (₹/year, 0 if none)</label>
              <input id="homeloan" className="input" type="number" min={0} step={10000}
                placeholder="0"
                value={homeLoanInterest || ''} onChange={e => setHomeLoanInterest(Number(e.target.value))} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Section 24(b) allows up to ₹2,00,000 deduction on home loan interest (Old Regime only)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={handleComplete}>
              {isEditing ? '💾 Save Changes' : '🚀 See My Tax Breakdown'}
            </button>
          </div>
        </div>
      )}

      {/* Sample Profiles — only shown on step 1 for new users */}
      {step === 1 && !isEditing && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          <div className="divider" />
          <p style={{
            fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
            textAlign: 'center', marginBottom: 'var(--space-4)',
          }}>
            Or explore with a sample profile
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
            {SAMPLE_PROFILES.map(sp => (
              <button key={sp.id} className="card" onClick={() => handleSampleProfile(sp.profile)}
                style={{
                  cursor: 'pointer', textAlign: 'center', padding: 'var(--space-4)',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
                }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{sp.emoji}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {sp.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {sp.ctc} CTC
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleOption({ label, hint, checked, onChange }: {
  label: string; hint: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      padding: 'var(--space-4)', background: 'var(--bg-surface-raised)',
      borderRadius: 'var(--radius-md)',
    }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer',
      }}>
        <input type="checkbox" className="toggle"
          checked={checked} onChange={e => onChange(e.target.checked)} />
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{hint}</div>
        </div>
      </label>
    </div>
  );
}
