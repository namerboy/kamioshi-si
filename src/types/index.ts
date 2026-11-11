export type WoodType = 
  | 'hinoki' 
  | 'cedar' 
  | 'vermilion' 
  | 'obsidian' 
  | 'sandalwood' 
  | 'kinpaku';

export type CordColor = 'crimson' | 'gold' | 'violet' | 'jade';

export type PlaqueCategory = 
  | 'vtuber' 
  | 'kpop' 
  | 'anime' 
  | 'esports' 
  | 'music' 
  | 'creator' 
  | 'athlete' 
  | 'place'
  | 'pet'
  | 'tech'
  | 'icon' 
  | 'other';

export type SacredStamp = '神' | '推' | '祈' | '愛' | '勝' | '光' | '寿' | '絆';

export interface EmaPlaque {
  id: string;
  coordinate: number;
  kamioshiName: string;
  category: PlaqueCategory;
  message: string;
  authorName: string;
  location: string;
  countryCode: string;
  woodType: WoodType;
  cordColor?: CordColor;
  stamp: SacredStamp;
  bowCount: number;
  createdAt: string;
  language: string;
  isOwn?: boolean;
}

export interface WallStats {
  totalVows: number;
  totalCountries: number;
  activePilgrims: number;
}

export type HarmCategory =
  | 'safe'
  | 'harassment_defamation'
  | 'hate_speech'
  | 'self_harm_violence'
  | 'doxxing_pii'
  | 'nsfw_explicit'
  | 'spam_solicitation';

export interface GuardianVerdict {
  allowed: boolean;
  category: HarmCategory;
  engine: 'built-in-ai' | 'bottled-heuristic';
  confidence: number;
  reasonEn?: string;
  reasonJa?: string;
}

export type ReportReason =
  | 'harassment'
  | 'doxxing'
  | 'hate_or_harm'
  | 'spam'
  | 'hide_only';
