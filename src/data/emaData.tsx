import React from 'react';
import { EmaPlaque } from '../types';
import { 
  ToriiIcon,
  CometIcon, 
  HeartBeaconIcon, 
  EsportsCrossIcon, 
  KatanaIcon, 
  ResonanceWaveIcon, 
  VictoryLaurelIcon, 
  BroadcastMicIcon, 
  PillarIcon, 
  CompassIcon,
  PawIcon,
  TerminalChipIcon,
  SacredSparkleIcon 
} from '../components/CustomIcons';

// Clean start: No dummy users, no mock data
export const INITIAL_EMA_PLAQUES: EmaPlaque[] = [];

export interface CategoryMeta {
  label: string;
  renderIcon: (props?: { className?: string; size?: number; color?: string }) => React.ReactNode;
  badgeClass: string;
}

export const CATEGORY_LABELS: Record<string, CategoryMeta> = {
  all: {
    label: 'All Plaques',
    renderIcon: (p) => <ToriiIcon size={16} {...p} />,
    badgeClass: 'bg-zinc-800 text-zinc-100 border-zinc-700'
  },
  vtuber: {
    label: 'VTuber',
    renderIcon: (p) => <CometIcon size={15} {...p} />,
    badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800/40'
  },
  kpop: {
    label: 'K-Pop',
    renderIcon: (p) => <HeartBeaconIcon size={15} {...p} />,
    badgeClass: 'bg-purple-950/40 text-purple-300 border-purple-800/40'
  },
  esports: {
    label: 'Esports',
    renderIcon: (p) => <EsportsCrossIcon size={15} {...p} />,
    badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/40'
  },
  anime: {
    label: 'Anime',
    renderIcon: (p) => <KatanaIcon size={15} {...p} />,
    badgeClass: 'bg-red-950/40 text-red-300 border-red-800/40'
  },
  music: {
    label: 'Music',
    renderIcon: (p) => <ResonanceWaveIcon size={15} {...p} />,
    badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
  },
  athlete: {
    label: 'Athletes',
    renderIcon: (p) => <VictoryLaurelIcon size={15} {...p} />,
    badgeClass: 'bg-yellow-950/40 text-yellow-300 border-yellow-800/40'
  },
  place: {
    label: 'Places',
    renderIcon: (p) => <CompassIcon size={15} {...p} />,
    badgeClass: 'bg-teal-950/40 text-teal-300 border-teal-800/40'
  },
  pet: {
    label: 'Pets & Nature',
    renderIcon: (p) => <PawIcon size={15} {...p} />,
    badgeClass: 'bg-orange-950/40 text-orange-300 border-orange-800/40'
  },
  tech: {
    label: 'Tech & Craft',
    renderIcon: (p) => <TerminalChipIcon size={15} {...p} />,
    badgeClass: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40'
  },
  creator: {
    label: 'Creators',
    renderIcon: (p) => <BroadcastMicIcon size={15} {...p} />,
    badgeClass: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
  },
  icon: {
    label: 'Icons',
    renderIcon: (p) => <PillarIcon size={15} {...p} />,
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  },
  other: {
    label: 'Other',
    renderIcon: (p) => <SacredSparkleIcon size={14} {...p} />,
    badgeClass: 'bg-stone-800 text-stone-300 border-stone-700'
  }
};
