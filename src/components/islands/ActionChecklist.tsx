/**
 * TaxBrain — Action Checklist Island
 *
 * Interactive checklist of tax optimization tasks.
 * Items grouped by timeline: before-leaving, day-1, month-1, month-3, annual.
 * Completion state persists in localStorage.
 */

import { useState, useEffect, useMemo } from 'react';
import { loadActionState, toggleAction, loadProfile } from '../../lib/profile-store';
import { generateActions } from '../../lib/action-generator';
import { TAX_CONFIG_FY2026 } from '../../lib/tax-rules';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedState, setCompletedState] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    setProfile(loadProfile());
    setCompletedState(loadActionState());
  }, []);

  const actions = useMemo(() => {
    if (!profile || profile.jobs.length === 0) return [];
    return generateActions(profile, TAX_CONFIG_FY2026);
  }, [profile]);

  const handleToggle = (id: string) => {
    const newState = toggleAction(id);
    setCompletedState({ ...newState });
  };

  if (!profile || profile.jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
        <h1 className="page-title">Action Checklist</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
          Set up your profile to get a personalized checklist of tax optimization actions.
        </p>
        <a href="/setup" className="btn btn-primary">Set Up Profile →</a>
      </div>
    );
  }

  // Group actions by category
  const grouped = useMemo(() => {
    const groups: Record<string, ActionItem[]> = {};
    for (const action of actions) {
      if (!groups[action.category]) groups[action.category] = [];

      const isCompleted = completedState[action.id] || false;
      if (filter === 'pending' && isCompleted) continue;
      if (filter === 'completed' && !isCompleted) continue;

      groups[action.category].push(action);
    }
    return groups;
  }, [actions, completedState, filter]);

  // Stats
  const total = actions.length;
  const completed = Object.values(completedState).filter(Boolean).length;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="actions-page">
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
          height: '10px', background: 'var(--bg-surface-raised)',
          borderRadius: 'var(--radius-full)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: completed === total
              ? 'var(--color-success)'
              : 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-base)',
          }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
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
              {items.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  completed={completedState[action.id] || false}
                  onToggle={() => handleToggle(action.id)}
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
    </div>
  );
}

function ActionRow({ action, completed, onToggle }: {
  action: ActionItem;
  completed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityMeta = PRIORITY_META[action.priority];

  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-4)',
        opacity: completed ? 0.6 : 1,
        transition: 'opacity var(--transition-fast)',
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
