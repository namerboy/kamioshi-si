import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// ⛩️ Authentic Minimalist Torii Shrine Gate
export const ToriiIcon: React.FC<IconProps> = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2 5.5C5.5 4.2 18.5 4.2 22 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M3.5 8H20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 11.2H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6.8 5.5L6.2 20.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    <path d="M17.2 5.5L17.8 20.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    <path d="M12 8V11.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 🪵 Ema Wooden Votive Plaque
export const EmaPlaqueIcon: React.FC<IconProps> = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2V5.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 5L20.5 9V19.8C20.5 20.5 19.9 21 19.2 21H4.8C4.1 21 3.5 20.5 3.5 19.8V9L12 5Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="8.2" r="1.4" fill={color} />
    <path d="M7.5 14H16.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M9 17H15" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.5" />
  </svg>
);

// 🔔 Traditional Suzu Shrine Bell with Slit & Tassel
export const SuzuBellIcon: React.FC<IconProps> = ({ className = '', size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="3.8" r="1.8" stroke={color} strokeWidth="1.5" />
    <path d="M5.5 12.5C5.5 8.9 8.4 6 12 6C15.6 6 18.5 8.9 18.5 12.5C18.5 15.8 15.8 18.5 12 18.5C8.2 18.5 5.5 15.8 5.5 12.5Z" stroke={color} strokeWidth="1.7" />
    <path d="M5.5 12.5H18.5" stroke={color} strokeWidth="1.3" />
    <path d="M9 16H15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="15.8" r="1.3" fill={color} />
    <path d="M12 18.5V22" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ☄️ VTuber Comet / Starlight Stream
export const CometIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17 3L18.5 7.5L23 9L18.5 10.5L17 15L15.5 10.5L11 9L15.5 7.5L17 3Z" fill={color} />
    <path d="M13 13L3 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" />
    <path d="M15 16L7 22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M10 11L2 17" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 💜 K-Pop Lightstick Beacon / Heart Prism
export const HeartBeaconIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 14.5V22" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    <path d="M12 4.5C10.5 2.5 7 2.5 5.5 4.5C4 6.5 4.5 9.5 7 11.5L12 15L17 11.5C19.5 9.5 20 6.5 18.5 4.5C17 2.5 13.5 2.5 12 4.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="8.5" r="1.5" fill={color} />
  </svg>
);

// 🎮 Esports Precision Controller Cross
export const EsportsCrossIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 3H15V8H20V14H15V19H9V14H4V8H9V3Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="11" r="1.5" fill={color} />
  </svg>
);

// ⚔️ Anime Katana Blade
export const KatanaIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 3C16 4.5 7 10 3 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M21 3C18 7 10 13.5 5 18" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M3.5 16.5L6.5 19.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M4 18L1.5 20.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 🎵 Harmonic Sound Wave Resonance
export const ResonanceWaveIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 12H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M7 8V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M10 5V19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M14 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M17 7V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 10V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ⚽ Victory Flame / Athlete Laurel
export const VictoryLaurelIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 21V15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 17C4 14 4 8 12 3C20 8 20 14 16 17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="1.4" />
  </svg>
);

// 🎙️ Studio Broadcast Mic
export const BroadcastMicIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="2" width="8" height="11" rx="4" stroke={color} strokeWidth="1.6" />
    <path d="M12 6V9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M5 10C5 13.866 8.134 17 12 17C15.866 17 19 13.866 19 10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 17V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 21H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 🏛️ Classical Sanctuary Pillar
export const PillarIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 4H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M6 7H18" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8 7V17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 7V17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M16 7V17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 17H18" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 🗺️ Places, Cities & Travel
export const CompassIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
    <path d="M15 9L9.5 10.5L8 16L13.5 14.5L15 9Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);

// 🐾 Pets & Nature
export const PawIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="7" cy="8" r="2" fill={color} />
    <circle cx="17" cy="8" r="2" fill={color} />
    <circle cx="12" cy="5" r="2" fill={color} />
    <path d="M8 14C6.5 14 5 15.5 5 17.5C5 19.5 7 21 12 21C17 21 19 19.5 19 17.5C19 15.5 17.5 14 16 14C14.5 14 13.5 15 12 15C10.5 15 9.5 14 8 14Z" fill={color} />
  </svg>
);

// ⚙️ Tech, Tools & Code
export const TerminalChipIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.6" />
    <path d="M8 9L11 12L8 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 15H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ✨ Sacred Sparkle Diamond
export const SacredSparkleIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={color} />
  </svg>
);

// 🔍 Calligraphy Brush Search
export const BrushSearchIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.7" />
    <path d="M15.5 15.5L20.5 20.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 🔊 Zen Chime Audio Active
export const ZenAudioOnIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M15.5 8.5C16.8 9.8 16.8 12.2 15.5 13.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18.5 5.5C21 8 21 14 18.5 16.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 🔇 Zen Audio Muted
export const ZenAudioOffIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M21 9L15 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 9L21 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 📥 Scroll Download
export const ScrollDownloadIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3V15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 10L12 15L17 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 19H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 🔗 Link Crest
export const LinkCrestIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 13C10.6 14.2 11.8 15 13.2 15H17C19.2 15 21 13.2 21 11C21 8.8 19.2 7 17 7H13.2C12 7 10.9 7.6 10.3 8.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M14 11C13.4 9.8 12.2 9 10.8 9H7C4.8 9 3 10.8 3 13C3 15.2 4.8 17 7 17H10.8C12 17 13.1 16.4 13.7 15.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 風 Flowing Wind Gust
export const WindBreezeIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 8H16.5C18 8 19 7 19 5.5C19 4 17.8 3 16.5 3C15.3 3 14.3 3.8 14 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M2 12H19.5C21 12 22 13 22 14.5C22 16 20.8 17 19.5 17C18.2 17 17.2 16 17 14.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 16H12.5C13.8 16 14.8 17 14.8 18.2C14.8 19.5 13.8 20.5 12.5 20.5C11.4 20.5 10.5 19.7 10.2 18.7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 📜 Terms & Charter Scroll
export const CharterScrollIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4Z" stroke={color} strokeWidth="1.6" />
    <path d="M8 9H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 13H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 17H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ✓ Crisp Check Seal
export const CheckSealIcon: React.FC<IconProps> = ({ className = '', size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 12.5L9.5 17L19 7.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ✕ Crisp Close Cross
export const CloseSealIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 🗑️ Remove Plaque Icon
export const TrashSealIcon: React.FC<IconProps> = ({ className = '', size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 7H20" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 7V4.5C9 4.2 9.2 4 9.5 4H14.5C14.8 4 15 4.2 15 4.5V7" stroke={color} strokeWidth="1.6" />
    <path d="M6.5 7L7.5 19.5C7.6 20.3 8.2 21 9 21H15C15.8 21 16.4 20.3 16.5 19.5L17.5 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 🌐 Language / Globe Icon
export const LanguageGlobeIcon: React.FC<IconProps> = ({ className = '', size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
    <path d="M3.6 9H20.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M3.6 15H20.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke={color} strokeWidth="1.4" />
  </svg>
);

// ✉️ Shrine Letter / Contact Envelope Icon
export const ContactEnvelopeIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="15" x="2" y="4.5" rx="2.5" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

// ⛩️ Shide (紙垂) Sacred Zigzag Paper Streamer SVG
export const ShideStreamer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg width="26" height="44" viewBox="0 0 26 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={`animate-shide drop-shadow-md ${className}`}>
    <path d="M13 0V7H6L11 18H4L10 30H3L9 42L15 32H9L15 20H8L14 9H13" fill="#FAF6EE" stroke="#D8CEBE" strokeWidth="1" />
    <path d="M13 0V7H20L15 18H22L16 30H23L17 42" fill="#EFE8DA" opacity="0.65" />
  </svg>
);

// 🌸 Sakura Blossom / Spring Daybreak Sun
export const SakuraSunIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="3" fill={color} />
    <path d="M12 2.5C10.5 4.5 10.5 6 12 7C13.5 6 13.5 4.5 12 2.5Z" fill={color} />
    <path d="M21.5 12C19.5 10.5 18 10.5 17 12C18 13.5 19.5 13.5 21.5 12Z" fill={color} />
    <path d="M12 21.5C13.5 19.5 13.5 18 12 17C10.5 18 10.5 19.5 12 21.5Z" fill={color} />
    <path d="M2.5 12C4.5 13.5 6 13.5 7 12C6 10.5 4.5 10.5 2.5 12Z" fill={color} />
    <path d="M18.7 5.3C16.6 6.3 15.6 7.4 16.3 8.8C17.7 8.1 18.8 7.1 18.7 5.3Z" fill={color} />
    <path d="M18.7 18.7C17.7 16.6 16.6 15.6 15.2 16.3C15.9 17.7 16.9 18.8 18.7 18.7Z" fill={color} />
    <path d="M5.3 18.7C7.4 17.7 8.4 16.6 7.7 15.2C6.3 15.9 5.2 16.9 5.3 18.7Z" fill={color} />
    <path d="M5.3 5.3C6.3 7.4 7.4 8.4 8.8 7.7C8.1 6.3 7.1 5.2 5.3 5.3Z" fill={color} />
  </svg>
);

// 🌙 Crescent Shrine Lantern Moon
export const MidnightMoonIcon: React.FC<IconProps> = ({ className = '', size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20.5 14.5C19.3 14.8 18.1 15 16.8 15C10.7 15 5.8 10.1 5.8 4C5.8 2.7 6 1.5 6.3 0.3C2.6 1.7 0 5.3 0 9.5C0 15 4.5 19.5 10 19.5C14.2 19.5 17.8 16.9 19.2 13.2L20.5 14.5Z" transform="translate(1.5, 1.5)" fill={color} />
    <circle cx="17.5" cy="6.5" r="1.2" fill={color} />
  </svg>
);
