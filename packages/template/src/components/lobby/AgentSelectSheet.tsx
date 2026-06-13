import { useState } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';

export interface AgentOption {
  name: string;
  emoji: string;
  emojiName: string;
  skillLevel: string;
  personality: string;
}

const SKILL_STYLES: Record<string, string> = {
  novice:
    'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
  advancedBeginner:
    'bg-sky-500/20 text-sky-700 border-sky-500/30 dark:text-sky-300',
  competent:
    'bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-300',
  proficient:
    'bg-orange-500/20 text-orange-700 border-orange-500/30 dark:text-orange-300',
  expert: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-300',
};

const SKILL_LABELS: Record<string, string> = {
  novice: 'Novice',
  advancedBeginner: 'Adv. Beginner',
  competent: 'Competent',
  proficient: 'Proficient',
  expert: 'Expert',
};

const AgentCard = ({
  agent,
  selected,
  onToggle,
}: {
  agent: AgentOption;
  selected: boolean;
  onToggle: () => void;
}) => {
  const skillStyle =
    SKILL_STYLES[agent.skillLevel] ??
    'bg-zinc-500/20 text-zinc-600 border-zinc-500/30 dark:text-zinc-300';
  const skillLabel = SKILL_LABELS[agent.skillLevel] ?? agent.skillLevel;

  return (
    <button
      onClick={onToggle}
      style={
        selected
          ? {
              borderColor:
                'color-mix(in srgb, var(--theme-primary-light) 40%, transparent)',
              backgroundColor:
                'color-mix(in srgb, var(--theme-primary-light) 10%, transparent)',
            }
          : {
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }
      }
      className="group w-full animate-[fadeSlideIn_0.3s_ease_forwards] rounded-xl border p-3 text-left opacity-0 transition-all duration-200 active:scale-[0.98]"
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full"
          aria-label={agent.emojiName}
        >
          <img
            className="rounded-full border border-zinc-500/30"
            src={`/opponents/${agent.name.toLowerCase()}.webp`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              {agent.name}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${skillStyle}`}
            >
              {skillLabel}
            </span>
          </div>
          <p
            className="text-xs leading-snug"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {agent.personality}
          </p>
        </div>
        <div
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${selected ? 'border-theme-primary bg-theme-primary' : ''}`}
          style={
            selected ? undefined : { borderColor: 'rgba(255,255,255,0.25)' }
          }
        >
          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
};

export function AgentSelectSheet({
  open,
  onClose,
  agentOptions,
  defaultSelectedAgentNames,
  onAgentMode,
}: {
  open: boolean;
  onClose: () => void;
  agentOptions: AgentOption[];
  defaultSelectedAgentNames: string[];
  onAgentMode: (selectedAgentNames: string[]) => void;
}) {
  const [selectedNames, setSelectedNames] = useState<Set<string>>(
    () => new Set(defaultSelectedAgentNames)
  );

  const toggleAgent = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const selectedCount = Array.from(selectedNames).filter((name) =>
    agentOptions.some((a) => a.name === name)
  ).length;

  const handleStart = () => {
    const selected = Array.from(selectedNames).filter((name) =>
      agentOptions.some((a) => a.name === name)
    );
    if (selected.length === 0) return;
    onAgentMode(selected);
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-[90]"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div
        onClick={onClose}
        aria-label="Close sheet"
        className="absolute inset-0"
        style={{
          background: 'rgba(2,1,8,0.66)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
          transition: 'opacity .26s ease',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden"
        style={{
          maxHeight: '88%',
          transform: open ? 'translateY(0)' : 'translateY(101%)',
          transition: 'transform .32s cubic-bezier(0.34,1.2,0.64,1)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background: 'linear-gradient(180deg,#15102e 0%,#0c0a1c 100%)',
          borderTop: '1px solid rgba(167,139,250,0.22)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center gap-3 px-5 pb-4 pt-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.95]"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
            }}
            aria-label="Back"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="m-0 text-base font-bold tracking-tight text-white">
              Pick Your Rivals
            </h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Select one or more opponents
            </p>
          </div>
          <button
            onClick={selectedCount > 0 ? handleStart : onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.95]"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
            }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Agent list */}
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {agentOptions.map((agent) => (
            <AgentCard
              key={agent.name}
              agent={agent}
              selected={selectedNames.has(agent.name)}
              onToggle={() => toggleAgent(agent.name)}
            />
          ))}
        </div>

        {/* Start button */}
        <div
          className="flex-shrink-0 px-4 pb-5 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={handleStart}
            disabled={selectedCount === 0}
            className="bg-theme-primary hover:bg-theme-primary-dark w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selectedCount === 0
              ? 'Select at least one rival'
              : `Race ${selectedCount} ${selectedCount === 1 ? 'Rival' : 'Rivals'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
