/**
 * TaxBrain — Action Checklist Island
 *
 * Interactive checklist of tax optimization tasks.
 * Items grouped by timeline: before-leaving, day-1, month-1, month-3, annual.
 * Completion state persists in localStorage.
 */

import { useState, useEffect, useMemo } from 'react';
import { loadActionState, toggleAction, loadProfile, saveProfile } from '../../lib/profile-store';
import { generateActions } from '../../lib/action-generator';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
import { SAMPLE_PROFILES } from '../../data/default-profile';
import type { ActionItem, UserProfile } from '../../lib/types';

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  'before-leaving': { label: 'Before Leaving Current Job', icon: '🚪', color: 'var(--color-danger)' },
  'day-1': { label: 'Day 1 at New Job', icon: '🎯', color: 'var(--accent-primary)' },
  'month-1': { label: 'Within First Month', icon: '📅', color: 'var(--color-warning)' },
  'month-3': { label: 'Within 3 Months', icon: '📆', color: 'var(--color-info)' },
  'annual': { label: 'Annual / Ongoing', icon: '🔄', color: 'var(--color-success)' },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  'critical': { label: 'Critical', color: 'var(--color-danger)' },
  'important': { label: 'Important', color: 'var(--color-warning)' },
  'nice': { label: 'Nice to have', color: 'var(--text-muted)' },
};

export default function ActionChecklist() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [completedState, setCompletedState] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(0);

  useEffect(() => {
    setProfile(loadProfile());
    setCompletedState(loadActionState());
  }, []);

  if (profile === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-muted)' }}>
        Loading action items...
      </div>
    );
  }

  const actions = useMemo(() => {
    if (!profile || profile.jobs.length === 0) return [];
    return generateActions(profile, TAX_CONFIG_FY2026);
  }, [profile]);

  const handleToggle = (id: string) => {
    const newState = toggleAction(id);
    setCompletedState({ ...newState });
    // Check if all done
    const totalActs = actions.length;
    const completedCount = Object.values(newState).filter(Boolean).length;
    if (completedCount === totalActs && totalActs > 0 && completedCount > prevCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    setPrevCompleted(completedCount);
  };

  const handleSelectSample = (sample: UserProfile) => {
    saveProfile(sample);
    setProfile(sample);
  };

  if (!profile || profile.jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>✅</div>
        <h1 className="page-title">Action Checklist</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 'var(--leading-relaxed)' }}>
          Set up your profile to get a personalized checklist of tax optimization actions, or pick a demo profile below.
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

  const grouped = useMemo(() => {
    const groups: Record<string, ActionItem[]> = {};
    for (const action of actions) {
      if (!groups[action.category]) groups[action.category] = [];

      const isCompleted = completedState[action.id] || false;
      if (filter === 'pending' && isCompleted) continue;
      if (filter === 'completed' && !isCompleted) continue;
      if (search && !action.text.toLowerCase().includes(search.toLowerCase()) && !action.details?.toLowerCase().includes(search.toLowerCase())) continue;

      groups[action.category].push(action);
    }
    return groups;
  }, [actions, completedState, filter, search]);

  // Stats
  const total = actions.length;
  const completed = Object.values(completedState).filter(Boolean).length;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="actions-page">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      <h1 className="page-title">Action Checklist</h1>
      <p className="page-subtitle">
        Track your tax optimization tasks for FY 2026-27
      </p>

      {/* Progress Bar */}
      <div className="card card-glass" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 'var(--space-3)',
        }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
            {completed} of {total} completed
          </span>
          <span style={{
            fontSize: 'var(--text-md)', fontWeight: 600,
            color: completed === total ? 'var(--color-success)' : 'var(--accent-primary)',
          }}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div style={{
          height: '12px', background: 'var(--bg-surface-raised)',
          borderRadius: 'var(--radius-full)', overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: completed === total
              ? 'linear-gradient(90deg, var(--green-600), var(--green-400))'
              : 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-base)',
            boxShadow: progressPercent > 0 ? '0 0 8px rgba(102,126,234,0.4)' : 'none',
          }} />
        </div>
        {completed === total && total > 0 && (
          <div style={{ marginTop: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
            🎉 All done! You're fully optimized for FY 2026-27!
          </div>
        )}
      </div>

      {/* Search + Filter Tabs */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          className="input"
          type="text"
          placeholder="🔍 Search actions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 'var(--space-3)' }}
        />
        <div className="tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({total})
          </button>
          <button
            className={`tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({total - completed})
          </button>
          <button
            className={`tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Done ({completed})
          </button>
        </div>
      </div>

      {/* Action Groups */}
      {Object.entries(CATEGORY_META).map(([category, meta]) => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;

        const categoryCompleted = items.filter(i => completedState[i.id]).length;

        return (
          <div key={category} style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--space-3)',
            }}>
              <h2 style={{
                fontSize: 'var(--text-md)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              }}>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </h2>
              <span style={{
                fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
              }}>
                {categoryCompleted}/{items.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {items.map((action, itemIdx) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  completed={completedState[action.id] || false}
                  onToggle={() => handleToggle(action.id)}
                  animationDelay={itemIdx * 60}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {filter !== 'all' && Object.values(grouped).every(g => !g || g.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
            {filter === 'completed' ? '🤷' : '🎉'}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filter === 'completed'
              ? 'No completed items yet. Start checking off tasks!'
              : 'All tasks completed! You\'re all set.'}
          </p>
        </div>
      )}

      {/* No search results */}
      {search && Object.values(grouped).every(g => !g || g.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔍</p>
          <p style={{ color: 'var(--text-secondary)' }}>No actions match "{search}"</p>
        </div>
      )}
    </div>
  );
}

function ActionRow({ action, completed, onToggle, animationDelay = 0 }: {
  action: ActionItem;
  completed: boolean;
  onToggle: () => void;
  animationDelay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityMeta = PRIORITY_META[action.priority];

  return (
    <div
      className="card action-item-animated"
      style={{
        padding: 'var(--space-4)',
        opacity: completed ? 0.6 : 1,
        transition: 'opacity var(--transition-fast)',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
      }}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            width: '22px', height: '22px', minWidth: '22px',
            borderRadius: 'var(--radius-sm)',
            border: completed ? 'none' : '2px solid var(--border-strong)',
            background: completed ? 'var(--color-success)' : 'transparent',
            color: 'white', fontSize: '12px',
            cursor: 'pointer', marginTop: '1px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--transition-fast)',
          }}
          aria-label={`Mark "${action.text}" as ${completed ? 'incomplete' : 'complete'}`}
        >
          {completed && '✓'}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: 'var(--text-base)',
              textDecoration: completed ? 'line-through' : 'none',
              color: completed ? 'var(--text-muted)' : 'var(--text-primary)',
            }}>
              {action.text}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: priorityMeta.color,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {priorityMeta.label}
            </span>
          </div>

          {/* Expandable details */}
          {action.details && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--accent-primary)', fontSize: 'var(--text-xs)',
                  cursor: 'pointer', padding: 0,
                  marginTop: 'var(--space-1)',
                  fontFamily: 'var(--font-family)',
                }}
              >
                {expanded ? '▼ Hide details' : '▶ Show details'}
              </button>
              {expanded && (
                <div style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {action.details}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confetti Component ──

function Confetti() {
  const COLORS = ['#667eea', '#764ba2', '#00E676', '#FFD740', '#FF5252', '#40C4FF', '#f5576c', '#43e97b'];
  const SHAPES = [
    'border-radius: 50%',
    'border-radius: 2px',
    'clip-path: polygon(50% 0%, 0% 100%, 100% 100%)',
    'border-radius: 0',
  ];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    left: `${(i * 37) % 100}%`,
    width: `${6 + (i % 4) * 3}px`,
    height: `${6 + (i % 3) * 4}px`,
    duration: `${1.5 + (i % 5) * 0.4}s`,
    delay: `${(i * 0.07) % 1.2}s`,
  }));

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            style: p.shape,
            animationDuration: p.duration,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
