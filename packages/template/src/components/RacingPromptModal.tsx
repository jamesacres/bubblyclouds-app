'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Users, ChevronRight, Bot, User, Check, X } from 'lucide-react';

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
}

type ViewState = 'mode-select' | 'agent-select';

const SKILL_STYLES: Record<string, string> = {
  novice: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  advancedBeginner: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  competent: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  proficient: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-300 border-red-500/30',
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
    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-700/60 text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    aria-label={agent.emojiName}
  >
    <span aria-hidden="true">{agent.emoji}</span>
  </div>
);

const AgentCard = ({
  agent,
  selected,
  onToggle,
  index,
}: {
  agent: AgentOption;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) => {
  const skillStyle =
    SKILL_STYLES[agent.skillLevel] ??
    'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  const skillLabel = SKILL_LABELS[agent.skillLevel] ?? agent.skillLevel;

  return (
    <button
      onClick={onToggle}
      style={{ animationDelay: `${index * 40}ms` }}
      className={`group w-full animate-[fadeSlideIn_0.3s_ease_forwards] rounded-xl border p-3 text-left opacity-0 transition-all duration-200 active:scale-[0.98] ${
        selected
          ? 'border-amber-500/40 bg-amber-500/10 shadow-[inset_0_1px_0_rgba(251,191,36,0.1)]'
          : 'border-white/8 bg-zinc-800/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/20 hover:bg-zinc-700/50'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-3">
        <AgentAvatar agent={agent} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              {agent.name}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${skillStyle}`}
            >
              {skillLabel}
            </span>
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-zinc-400">
            {agent.personality}
          </p>
        </div>
        <div
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${selected ? 'border-amber-500 bg-amber-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}
        >
          {selected && (
            <Check className="h-3 w-3 text-zinc-900" strokeWidth={3} />
          )}
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
}: RacingPromptModalProps) => {
  const [view, setView] = useState<ViewState>('mode-select');
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
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] sm:max-w-md sm:rounded-3xl">
                {view === 'mode-select' && (
                  <div className="p-6">
                    <div className="mb-6">
                      <Dialog.Title className="text-xl font-bold tracking-tight text-zinc-100">
                        Choose Your Mode
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-zinc-400">
                        Race others, challenge AI, or go solo
                      </p>
                    </div>

                    {/* Race Friends — primary option */}
                    <button
                      onClick={handleRaceMode}
                      className="group mb-3 w-full rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-600 to-blue-700 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-500 hover:to-blue-600 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                          <Users className="h-5 w-5 text-white" />
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
                        className="group mb-3 w-full rounded-2xl border border-white/10 bg-zinc-800/80 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:border-white/20 hover:bg-zinc-700/70 active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15 shadow-[inset_0_1px_0_rgba(251,191,36,0.1)]">
                            <Bot className="h-5 w-5 text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 text-sm font-bold text-zinc-100">
                              Race AI Opponents
                            </div>
                            <div className="text-xs leading-snug text-zinc-400">
                              Pick your rivals — from novice to expert
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    )}

                    {/* Solo — quiet tertiary */}
                    <div className="border-white/8 border-t pt-3">
                      <button
                        onClick={handleSoloMode}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-zinc-800/60 active:scale-[0.98]"
                      >
                        <div className="border-white/8 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border bg-zinc-800/80">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                        <span className="text-sm text-zinc-400 transition-colors duration-200 group-hover:text-zinc-300">
                          Solo Challenge
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {view === 'agent-select' && (
                  <div className="flex flex-col" style={{ maxHeight: '85dvh' }}>
                    <div className="border-white/8 flex flex-shrink-0 items-center gap-3 border-b px-5 pb-4 pt-5">
                      <button
                        onClick={handleBack}
                        className="border-white/8 flex h-8 w-8 items-center justify-center rounded-lg border bg-zinc-800/80 text-zinc-400 transition-all duration-200 hover:bg-zinc-700/60 hover:text-zinc-200 active:scale-[0.95]"
                        aria-label="Back"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </button>
                      <div className="flex-1">
                        <Dialog.Title className="text-base font-bold tracking-tight text-zinc-100">
                          Pick Your Rivals
                        </Dialog.Title>
                        <p className="text-xs text-zinc-400">
                          Select one or more opponents
                        </p>
                      </div>
                      <button
                        onClick={handleModalClose}
                        className="border-white/8 flex h-8 w-8 items-center justify-center rounded-lg border bg-zinc-800/80 text-zinc-400 transition-all duration-200 hover:bg-zinc-700/60 hover:text-zinc-200 active:scale-[0.95]"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                      {agentOptions.map((agent, index) => (
                        <AgentCard
                          key={agent.name}
                          agent={agent}
                          selected={selectedNames.has(agent.name)}
                          onToggle={() => toggleAgent(agent.name)}
                          index={index}
                        />
                      ))}
                    </div>

                    <div className="border-white/8 flex-shrink-0 border-t px-4 pb-5 pt-3">
                      <button
                        onClick={handleAgentStart}
                        disabled={selectedCount === 0}
                        className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
