'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Users, ChevronRight, User, Check, X } from 'lucide-react';

export interface AgentOption {
  name: string;
  emoji: string;
  emojiName: string;
  skillLevel: string;
  personality: string;
}

interface RacingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRaceMode: () => void;
  onSoloMode: () => void;
  onAgentMode?: (selectedAgentNames: string[]) => void;
  agentOptions?: AgentOption[];
  defaultSelectedAgentNames?: string[];
  initialView?: ViewState;
}

type ViewState = 'mode-select' | 'agent-select';

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

const AgentAvatar = ({ agent }: { agent: AgentOption }) => (
  <div
    className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full"
    aria-label={agent.emojiName}
  >
    {
      <img
        className="rounded-full border border-zinc-500/30"
        src={`/opponents/${agent.name.toLowerCase()}.webp`}
      />
    }
  </div>
);

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
        <AgentAvatar agent={agent} />
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

const RacingPromptModal = ({
  isOpen,
  onClose,
  onRaceMode,
  onSoloMode,
  onAgentMode,
  agentOptions = [],
  defaultSelectedAgentNames = ['Bumblebee', 'Sage'],
  initialView = 'mode-select',
}: RacingPromptModalProps) => {
  const [view, setView] = useState<ViewState>(initialView);
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

  const handleRaceMode = () => {
    onRaceMode();
    onClose();
  };

  const handleSoloMode = () => {
    onSoloMode();
    onClose();
  };

  const handleAgentStart = () => {
    const selected = Array.from(selectedNames).filter((name) =>
      agentOptions.some((a) => a.name === name)
    );
    if (selected.length === 0) return;
    onAgentMode?.(selected);
    onClose();
  };

  const handleBack = () => {
    setView('mode-select');
  };

  const handleModalClose = () => {
    setView('mode-select');
    onClose();
  };

  const selectedCount = Array.from(selectedNames).filter((name) =>
    agentOptions.some((a) => a.name === name)
  ).length;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0"
            style={{
              background: 'rgba(2,1,8,0.66)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
        </Transition.Child>

        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <div className="w-full sm:max-w-md">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className="w-full overflow-hidden rounded-t-3xl sm:rounded-3xl"
                style={{
                  background: 'linear-gradient(180deg,#15102e 0%,#0c0a1c 100%)',
                  borderTop: '1px solid rgba(167,139,250,0.22)',
                  boxShadow: '0 -20px 60px rgba(0,0,0,0.55)',
                }}
              >
                {view === 'mode-select' && (
                  <div className="p-6">
                    <div className="mb-6">
                      <div
                        className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-widest"
                        style={{ color: 'var(--theme-primary-light)' }}
                      >
                        Get racing
                      </div>
                      <Dialog.Title className="text-2xl font-bold tracking-tight text-white">
                        Choose Your Mode
                      </Dialog.Title>
                    </div>

                    {/* Race Friends — primary option */}
                    <button
                      onClick={handleRaceMode}
                      className="group mb-3 w-full rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600 to-blue-700 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-500 hover:to-blue-600 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                          <Users className="h-10 w-10 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 text-sm font-bold text-white">
                            Race Friends &amp; Family
                          </div>
                          <div className="text-xs leading-snug text-sky-100/80">
                            Share a link — race to finish first
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/60 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </button>

                    {/* Race AI Opponents */}
                    {onAgentMode && agentOptions.length > 0 && (
                      <button
                        onClick={() => setView('agent-select')}
                        className="group mb-3 w-full rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98]"
                        style={{
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={`/opponents/phantom.webp`}
                            className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full"
                            style={{
                              border:
                                '1px solid color-mix(in srgb, var(--theme-primary-light) 30%, transparent)',
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 text-sm font-bold text-white">
                              Race AI Opponents
                            </div>
                            <div
                              className="text-xs leading-snug"
                              style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                              Pick your rivals — from novice to expert
                            </div>
                          </div>
                          <ChevronRight
                            className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                          />
                        </div>
                      </button>
                    )}

                    {/* Solo — quiet tertiary */}
                    <div
                      className="border-t pt-3"
                      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <button
                        onClick={handleSoloMode}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-[0.98]"
                      >
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <User
                            className="h-4 w-4"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                          />
                        </div>
                        <span
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          Solo Challenge
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {view === 'agent-select' && (
                  <div className="flex flex-col" style={{ maxHeight: '85svh' }}>
                    <div
                      className="flex flex-shrink-0 items-center gap-3 px-5 pb-4 pt-5"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <button
                        onClick={handleBack}
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
                        <Dialog.Title className="text-base font-bold tracking-tight text-white">
                          Pick Your Rivals
                        </Dialog.Title>
                        <p
                          className="text-xs"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          Select one or more opponents
                        </p>
                      </div>
                      <button
                        onClick={handleModalClose}
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

                    <div
                      className="flex-shrink-0 px-4 pb-5 pt-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <button
                        onClick={handleAgentStart}
                        disabled={selectedCount === 0}
                        className="bg-theme-primary hover:bg-theme-primary-dark w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {selectedCount === 0
                          ? 'Select at least one rival'
                          : `Race ${selectedCount} ${selectedCount === 1 ? 'Rival' : 'Rivals'}`}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export { RacingPromptModal };
export default RacingPromptModal;
