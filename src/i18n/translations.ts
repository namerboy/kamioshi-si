export type Language = 'en' | 'ja';

export interface Translations {
  header: {
    subtitleEmpty: string;
    subtitleCount: (count: number) => string;
    kotoAria: string;
    kotoTitlePlay: string;
    kotoTitleMute: string;
    langToggleAria: string;
    themeToggleAria: string;
    themeSakuraTitle: string;
    themeMidnightTitle: string;
    themeSakuraBtn: string;
    themeMidnightBtn: string;
    termsBtn: string;
    termsTitle: string;
    contactBtn: string;
    contactTitle: string;
    hangBtn: string;
    mobileDockWall: string;
    mobileDockSearch: string;
    mobileDockCarve: string;
    mobileDockTerms: string;
  };
  hero: {
    badge: string;
    title: string;
    desc: string;
    statPlaques: (count: number) => string;
    statCities: (count: number) => string;
    statBells: (count: number) => string;
    hangCta: string;
  };
  filter: {
    searchPlaceholder: string;
    searchAria: string;
    clear: string;
    sortNewest: string;
    sortOldest: string;
    sortBows: string;
    viewCompact: string;
    viewStandard: string;
  };
  categories: Record<string, string>;
  rack: {
    beamLabel: string;
    topReveredTitle: string;
    openHookTitle: (coord: number) => string;
    openHookDesc: string;
    emptySpotAvailable: (coord: number) => string;
    emptyNoMatchTitle: (query: string) => string;
    emptyNoCatTitle: (cat: string) => string;
    emptyReadyTitle: string;
    emptyNoMatchDesc: (query: string) => string;
    emptyReadyDesc: string;
    emptyCarveQuery: (query: string) => string;
    emptyCarveFirst: string;
    resetFilters: string;
    breezeBtn: string;
    breezeTitle: string;
  };
  card: {
    signedPrefix: string;
    defaultAuthor: string;
    defaultLocation: string;
    ringBell: string;
    bellRung: string;
    share: string;
    copied: string;
    keepsake: string;
    hidePlaqueTitle: string;
    justNow: string;
    minutesAgo: (m: number) => string;
    hoursAgo: (h: number) => string;
    daysAgo: (d: number) => string;
  };
  hangModal: {
    title: string;
    plaqueNumber: (coord: number) => string;
    freeForever: string;
    exampleIdeaBtn: string;
    closeAria: string;
    nameLabel: string;
    namePlaceholder: string;
    categoryLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    authorLabel: string;
    authorPlaceholder: string;
    locationLabel: string;
    locationPlaceholder: string;
    woodLabel: string;
    cordLabel: string;
    hankoLabel: string;
    previewLabel: string;
    previewDefaultOshi: string;
    previewDefaultMsg: string;
    previewDefaultAuthor: string;
    previewDefaultLoc: string;
    termsAgreeText: string;
    termsLink: string;
    termsSuffix: string;
    cancelBtn: string;
    submitBtn: string;
    submittingBtn: string;
    cooldownBtn: (sec: number) => string;
  };
  souvenirModal: {
    title: (coord: number) => string;
    closeAria: string;
    signed: (date: string) => string;
    ringBell: (count: number) => string;
    bellRung: (count: number) => string;
    removeTitle: string;
    removeConfirm: string;
    removeKeep: string;
    reportBtn: string;
    reportTitle: string;
    reportReasons: {
      harassment: string;
      doxxing: string;
      hate_or_harm: string;
      spam: string;
      hide_only: string;
    };
    reportConfirmBtn: string;
    reportCancelBtn: string;
    shareBtn: string;
    copiedBtn: string;
    shareXBtn: string;
    shareLineBtn: string;
    nativeShareBtn: string;
    shareTweetText: (oshi: string, coord: number) => string;
    downloadBtn: string;
    renderingBtn: string;
  };
  termsModal: {
    title: string;
    subtitle: string;
    closeAria: string;
    sec1Title: string;
    sec1Body: string;
    sec2Title: string;
    sec2Intro: string;
    sec2Rules: string[];
    sec3Title: string;
    sec3Body: string;
    sec4Title: string;
    sec4Body: string;
    sec5Title: string;
    sec5Body: string;
    sec6Title: (count: number, hiddenCount: number) => string;
    sec6Desc: string;
    exportJsonBtn: string;
    restoreHiddenBtn: (count: number) => string;
    resetWallBtn: string;
    confirmResetBtn: string;
    cancelBtn: string;
    clearedNotice: string;
    restoredNotice: string;
    footerEdition: string;
    gotItBtn: string;
  };
  footer: {
    brandTag: string;
    hangLink: string;
    termsLink: string;
    contactLink: string;
  };
  contactModal: {
    title: string;
    subtitle: string;
    closeAria: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHelp: string;
    topicLabel: string;
    topicOptions: {
      general: string;
      removal: string;
      feature: string;
      bug: string;
      partnership: string;
    };
    messageLabel: string;
    messagePlaceholder: string;
    privacyNote: string;
    submitBtn: string;
    submittingBtn: string;
    cancelBtn: string;
    successTitle: string;
    successDesc: string;
    closeBtn: string;
    sendAnotherBtn: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    header: {
      subtitleEmpty: 'Wooden Plaque Wall',
      subtitleCount: (count) => `${count.toLocaleString()} ${count === 1 ? 'Plaque' : 'Plaques'} Hung`,
      kotoAria: 'Traditional koto music',
      kotoTitlePlay: 'Play traditional Koto (箏) music',
      kotoTitleMute: 'Koto music playing (click to mute)',
      langToggleAria: 'Switch language to Japanese (日本語)',
      themeToggleAria: 'Switch theme between Midnight Temple and Sakura Spring',
      themeSakuraTitle: 'Switch to Sakura Spring Daylight theme (朝桜)',
      themeMidnightTitle: 'Switch to Midnight Temple theme (幽玄)',
      themeSakuraBtn: 'Sakura',
      themeMidnightBtn: 'Midnight',
      termsBtn: 'Terms',
      termsTitle: 'Terms of Use & Guidelines',
      contactBtn: 'Contact',
      contactTitle: 'Contact the Shrinekeeper',
      hangBtn: 'Hang a Plaque',
      mobileDockWall: 'Wall',
      mobileDockSearch: 'Search',
      mobileDockCarve: 'Carve',
      mobileDockTerms: 'Charter'
    },
    hero: {
      badge: '絵馬掛け • Wooden Plaque Wall',
      title: 'Who or what is your number one?',
      desc: 'An oshi can be anything—a person, a song, a city, your dog, a tool, or an idea. Carve a wooden plaque and hang it on the wall for whatever means the most to you.',
      statPlaques: (count) => (count === 1 ? 'Plaque Hung' : 'Plaques Hung'),
      statCities: (count) => (count === 1 ? 'City' : 'Cities'),
      statBells: (count) => (count === 1 ? 'Bell Rung' : 'Bells Rung'),
      hangCta: 'Hang Your Plaque'
    },
    filter: {
      searchPlaceholder: 'Search by oshi, city, message, or #number...',
      searchAria: 'Search plaques',
      clear: 'Clear',
      sortNewest: 'Newest',
      sortOldest: 'First (#1)',
      sortBows: 'Most Bells',
      viewCompact: 'Compact',
      viewStandard: 'Standard'
    },
    categories: {
      all: 'All Plaques',
      vtuber: 'VTuber',
      kpop: 'Idol / Pop',
      esports: 'Gaming / Esports',
      anime: 'Anime / Manga',
      music: 'Music / Song',
      athlete: 'Sports / Athlete',
      place: 'Place / City',
      pet: 'Pet / Nature',
      tech: 'Craft / Tech',
      creator: 'Creator / Writer',
      icon: 'Legend / History',
      other: 'Everything Else'
    },
    rack: {
      beamLabel: 'EMA-KAKE • WOODEN PLAQUE RACK',
      topReveredTitle: 'Most Revered',
      openHookTitle: (coord) => `Open Hook #${coord.toLocaleString()}`,
      openHookDesc: 'Click to carve and hang your plaque here',
      emptySpotAvailable: (coord) => `SPOT #${coord.toLocaleString()} AVAILABLE`,
      emptyNoMatchTitle: (query) => `No plaques found for “${query}”`,
      emptyNoCatTitle: (cat) => `No plaques in ${cat} yet`,
      emptyReadyTitle: 'The Wall is Ready',
      emptyNoMatchDesc: (query) => `Click this wooden plaque to be the first to hang one for “${query}”.`,
      emptyReadyDesc: 'Click this wooden plaque to hang the very first dedication on this wall.',
      emptyCarveQuery: (query) => `Carve Plaque for “${query}”`,
      emptyCarveFirst: 'Carve Plaque #1',
      resetFilters: 'Reset search & category filters',
      breezeBtn: 'Send Breeze',
      breezeTitle: 'Send a gentle breeze across the wooden plaques and sakura petals'
    },
    card: {
      signedPrefix: 'Signed',
      defaultAuthor: 'Fan',
      defaultLocation: 'Everywhere',
      ringBell: 'Ring Bell',
      bellRung: 'Bell Rung',
      share: 'Share',
      copied: 'Copied',
      keepsake: 'Keepsake',
      hidePlaqueTitle: 'Hide this plaque from your view',
      justNow: 'Just now',
      minutesAgo: (m) => `${m}m ago`,
      hoursAgo: (h) => `${h}h ago`,
      daysAgo: (d) => `${d}d ago`
    },
    hangModal: {
      title: 'Carve a Wooden Plaque',
      plaqueNumber: (coord) => `Plaque #${coord.toLocaleString()}`,
      freeForever: 'Free to Use',
      exampleIdeaBtn: 'Example Idea',
      closeAria: 'Close modal',
      nameLabel: 'WHO OR WHAT IS YOUR OSHI?',
      namePlaceholder: 'A person, game, city, pet, song, tool, or idea...',
      categoryLabel: 'CATEGORY',
      messageLabel: 'YOUR MESSAGE OR WISH',
      messagePlaceholder: 'Write a note of appreciation, memory, or wish...',
      authorLabel: 'YOUR NAME / NICKNAME',
      authorPlaceholder: 'e.g. Alex, Hoshiyomi',
      locationLabel: 'YOUR CITY / REGION',
      locationPlaceholder: 'e.g. Kyoto, Chicago, Seoul',
      woodLabel: 'WOOD FINISH (木材仕上げ)',
      cordLabel: 'BRAIDED SILK CORD (組紐)',
      hankoLabel: 'VERMILION HANKO SEAL (朱印)',
      previewLabel: 'Live Carved Preview',
      previewDefaultOshi: 'Your Oshi',
      previewDefaultMsg: 'Your message or wish...',
      previewDefaultAuthor: 'Fan',
      previewDefaultLoc: 'Everywhere',
      termsAgreeText: 'I agree to the',
      termsLink: 'Terms & Guidelines',
      termsSuffix: '.',
      cancelBtn: 'Cancel',
      submitBtn: 'Hang Plaque on Wall',
      submittingBtn: 'Hanging...',
      cooldownBtn: (sec) => `Wait ${sec}s...`
    },
    souvenirModal: {
      title: (coord) => `Plaque #${coord.toLocaleString()}`,
      closeAria: 'Close plaque view',
      signed: (date) => `Signed: ${date}`,
      ringBell: (count) => `Ring Bell (${count})`,
      bellRung: (count) => `Bell Rung (${count})`,
      removeTitle: 'Remove this plaque from your local wall',
      removeConfirm: 'Confirm',
      removeKeep: 'Keep',
      reportBtn: 'Hide',
      reportTitle: 'Hide This Plaque',
      reportReasons: {
        harassment: 'Harassment or offensive language',
        doxxing: 'Personal info or private data',
        hate_or_harm: 'Harmful or hateful content',
        spam: 'Spam or advertising',
        hide_only: 'Hide from my view'
      },
      reportConfirmBtn: 'Hide from Wall',
      reportCancelBtn: 'Cancel',
      shareBtn: 'Copy Link',
      copiedBtn: 'Copied',
      shareXBtn: 'Post on X',
      shareLineBtn: 'LINE',
      nativeShareBtn: 'Share',
      shareTweetText: (oshi, coord) =>
        `Dedicated wooden plaque #${coord} for ${oshi} on the wall ⛩️ #Kamioshi #Oshikatsu #神推し`,
      downloadBtn: 'Download PNG',
      renderingBtn: 'Rendering...'
    },
    termsModal: {
      title: 'Terms of Use & Guidelines',
      subtitle: 'Free community project • Guidelines, disclaimers & data controls',
      closeAria: 'Close terms and conditions',
      sec1Title: '1. About This Site',
      sec1Body:
        'kamioshi.si is an independent, non-commercial fan tribute inspired by Japanese shrine ema (絵馬) prayer boards. It is 100% free with no accounts, no subscriptions, and no advertisements. Plaques you create are saved directly in your browser’s local storage.',
      sec2Title: '2. Community Guidelines',
      sec2Intro:
        'An oshi can be anything that inspires you. To ensure the space remains positive and welcoming for everyone, dedications must not contain:',
      sec2Rules: [
        'Harassment, defamation, insults, or targeted slander.',
        'Private personal information, real names, phone numbers, addresses, or doxxing.',
        'Hate speech, threats, or explicit adult content.',
        'Commercial spam, advertising URLs, or automated bot floods.'
      ],
      sec3Title: '3. Trademarks & Fair Use',
      sec3Body:
        'kamioshi.si is an independent fan tribute and is not affiliated with, endorsed by, or sponsored by any talent agency, idol group, VTuber studio, sports team, or company mentioned on the wall. All referenced names and trademarks belong to their respective owners.',
      sec4Title: '4. Disclaimer of Liability',
      sec4Body:
        'This site is provided on an "as-is" and "as-available" basis for personal enjoyment without warranties of any kind. To the fullest extent permitted by law, the creator disclaims any liability for damages arising from your use of the site or user-submitted content.',
      sec5Title: '5. Your Content & Privacy',
      sec5Body:
        'You are solely responsible for any text you carve and share. We do not collect email addresses, passwords, or tracking cookies. You have full control over your local data and can export or erase it at any time below.',
      sec6Title: (count, hiddenCount) =>
        `Your Local Wall Data (${count} ${count === 1 ? 'Plaque' : 'Plaques'}${hiddenCount > 0 ? ` • ${hiddenCount} Hidden` : ''})`,
      sec6Desc: 'Export your plaques as a JSON backup or reset your local wall.',
      exportJsonBtn: 'Export JSON',
      restoreHiddenBtn: (count) => `Restore Hidden (${count})`,
      resetWallBtn: 'Reset Local Wall',
      confirmResetBtn: 'Confirm Reset',
      cancelBtn: 'Cancel',
      clearedNotice: 'Local wall data has been reset.',
      restoredNotice: 'Hidden plaques have been restored.',
      footerEdition: 'kamioshi.si • Free Community Edition',
      gotItBtn: 'Close'
    },
    footer: {
      brandTag: 'kamioshi.si — Inspired by Japanese shrine prayer boards (絵馬). Free to use.',
      hangLink: 'Hang a Plaque',
      termsLink: 'Terms & Guidelines',
      contactLink: 'Contact'
    },
    contactModal: {
      title: 'Contact the Shrinekeeper',
      subtitle: 'Questions, moderation requests, or suggestions • Replies sent to your email',
      closeAria: 'Close contact modal',
      nameLabel: 'Your Name / Nickname',
      namePlaceholder: 'e.g. Aoi, Fan, Anonymous',
      emailLabel: 'Your Email Address',
      emailPlaceholder: 'you@example.com',
      emailHelp: 'We will only use this to reply to your message.',
      topicLabel: 'Topic / Reason for Contact',
      topicOptions: {
        general: 'General Question or Feedback',
        removal: 'Plaque Removal or Moderation Request',
        feature: 'Feature Suggestion or Idea',
        bug: 'Technical Bug Report',
        partnership: 'Collaboration / Inquiries'
      },
      messageLabel: 'Message',
      messagePlaceholder: 'Write your message here... (If requesting plaque removal, include the #number or name)',
      privacyNote: 'Delivered securely via FormSubmit. No tracking, accounts, or marketing emails.',
      submitBtn: 'Send Message',
      submittingBtn: 'Delivering...',
      cancelBtn: 'Cancel',
      successTitle: 'Message Delivered',
      successDesc: 'Thank you for reaching out. Your message has been sent to the shrinekeeper.',
      closeBtn: 'Close',
      sendAnotherBtn: 'Send Another Message'
    }
  },
  ja: {
    header: {
      subtitleEmpty: '絵馬掛けの壁',
      subtitleCount: (count) => `${count.toLocaleString()}枚 奉納済`,
      kotoAria: '琴の音色を切り替え',
      kotoTitlePlay: '伝統的な琴（箏）の音楽を再生',
      kotoTitleMute: '琴の音楽を再生中（クリックで消音）',
      langToggleAria: '言語を英語（English）に切り替え',
      themeToggleAria: 'テーマ切り替え（幽玄の夜 / 朝桜の昼）',
      themeSakuraTitle: '春の朝桜（昼モード）に切り替え',
      themeMidnightTitle: '幽玄の神社（夜モード）に切り替え',
      themeSakuraBtn: '朝桜',
      themeMidnightBtn: '幽玄',
      termsBtn: '利用規約',
      termsTitle: '利用規約・ガイドライン',
      contactBtn: '社務所',
      contactTitle: '社務所（お問い合わせ）',
      hangBtn: '絵馬を掛ける',
      mobileDockWall: '絵馬壁',
      mobileDockSearch: '検索',
      mobileDockCarve: '奉納する',
      mobileDockTerms: '規約'
    },
    hero: {
      badge: '絵馬掛け • 神推し奉納所',
      title: 'あなたの「一番の推し」は誰ですか？',
      desc: '推しは人でも、歌でも、街でも、愛犬でも、道具や想いでも構いません。あなたにとって一番大切な存在への想いを、木の絵馬に刻んで掛けましょう。',
      statPlaques: () => '奉納された絵馬',
      statCities: () => '参加地域',
      statBells: () => '鳴らされた鈴',
      hangCta: '絵馬を奉納する'
    },
    filter: {
      searchPlaceholder: '推し名、地域、メッセージ、#番号で検索...',
      searchAria: '絵馬を検索',
      clear: 'クリア',
      sortNewest: '新着順',
      sortOldest: '初番順 (#1)',
      sortBows: '鈴の音順',
      viewCompact: 'コンパクト',
      viewStandard: '標準'
    },
    categories: {
      all: 'すべての絵馬',
      vtuber: 'VTuber',
      kpop: 'アイドル / ポップ',
      esports: 'ゲーム / eスポーツ',
      anime: 'アニメ / マンガ',
      music: '音楽 / 楽曲',
      athlete: 'スポーツ / 選手',
      place: '場所 / 街 / 聖地',
      pet: 'ペット / 自然',
      tech: '技術 / 創作 / ツール',
      creator: 'クリエイター / 作家',
      icon: '偉人 / 歴史 / 伝統',
      other: 'その他'
    },
    rack: {
      beamLabel: '絵馬掛け • 神推し奉納所',
      topReveredTitle: '注目の絵馬',
      openHookTitle: (coord) => `空き掛け所 #${coord.toLocaleString()}`,
      openHookDesc: 'タップしてここに絵馬を刻んで奉納',
      emptySpotAvailable: (coord) => `第 #${coord.toLocaleString()} 番の掛け所`,
      emptyNoMatchTitle: (query) => `「${query}」の絵馬はまだありません`,
      emptyNoCatTitle: (cat) => `「${cat}」の絵馬はまだありません`,
      emptyReadyTitle: '絵馬掛けの準備が整いました',
      emptyNoMatchDesc: (query) => `タップして「${query}」への最初の絵馬を奉納しましょう。`,
      emptyReadyDesc: 'タップしてこの壁に最初の絵馬を掛けましょう。',
      emptyCarveQuery: (query) => `「${query}」の絵馬を刻む`,
      emptyCarveFirst: '最初の絵馬を刻む',
      resetFilters: '検索とカテゴリー絞り込みを解除',
      breezeBtn: '春風を送る',
      breezeTitle: '絵馬掛けと桜の花びらに心地よい風を送ります'
    },
    card: {
      signedPrefix: '奉納日',
      defaultAuthor: 'ファン',
      defaultLocation: '世界中',
      ringBell: '鈴を鳴らす',
      bellRung: '参拝済',
      share: '共有',
      copied: 'コピー済',
      keepsake: '記念品',
      hidePlaqueTitle: 'この絵馬を非表示にする',
      justNow: 'たった今',
      minutesAgo: (m) => `${m}分前`,
      hoursAgo: (h) => `${h}時間前`,
      daysAgo: (d) => `${d}日前`
    },
    hangModal: {
      title: '絵馬を刻んで奉納する',
      plaqueNumber: (coord) => `絵馬 #${coord.toLocaleString()}`,
      freeForever: '完全無料',
      exampleIdeaBtn: '作例を入力',
      closeAria: 'モーダルを閉じる',
      nameLabel: 'あなたの推しは誰・何ですか？',
      namePlaceholder: '人物、ゲーム、街、ペット、楽曲、道具、想いなど...',
      categoryLabel: 'カテゴリー',
      messageLabel: 'メッセージ・願い・応援の言葉',
      messagePlaceholder: '応援メッセージ、思い出、願いなどを自由に書いてください...',
      authorLabel: 'あなたのお名前 / ハンドル名',
      authorPlaceholder: '例: 星詠み、たなか',
      locationLabel: 'お住まいの街 / 地域',
      locationPlaceholder: '例: 京都、東京、ロサンゼルス',
      woodLabel: '木材の仕上げ (木目種別)',
      cordLabel: '正絹組紐 (紐の色)',
      hankoLabel: '落款朱印 (印鑑)',
      previewLabel: '仕上がり見本',
      previewDefaultOshi: 'あなたの推し',
      previewDefaultMsg: 'あなたのメッセージや願い...',
      previewDefaultAuthor: 'ファン',
      previewDefaultLoc: '世界中',
      termsAgreeText: '利用規約に同意します',
      termsLink: '利用規約・ガイドライン',
      termsSuffix: '。',
      cancelBtn: 'キャンセル',
      submitBtn: '絵馬を壁に奉納する',
      submittingBtn: '奉納中...',
      cooldownBtn: (sec) => `あと ${sec}秒...`
    },
    souvenirModal: {
      title: (coord) => `絵馬 #${coord.toLocaleString()}`,
      closeAria: '絵馬の詳細を閉じる',
      signed: (date) => `奉納日: ${date}`,
      ringBell: (count) => `鈴を鳴らす (${count})`,
      bellRung: (count) => `参拝済 (${count})`,
      removeTitle: 'この絵馬をローカル壁から削除',
      removeConfirm: '削除する',
      removeKeep: '残す',
      reportBtn: '非表示',
      reportTitle: 'この絵馬を非表示にする',
      reportReasons: {
        harassment: '誹謗中傷・不快な表現',
        doxxing: '個人情報・プライバシーの侵害',
        hate_or_harm: '有害または差別的な内容',
        spam: '宣伝スパム・不審な誘導',
        hide_only: 'この絵馬を見たくない'
      },
      reportConfirmBtn: '非表示にする',
      reportCancelBtn: 'キャンセル',
      shareBtn: 'リンクをコピー',
      copiedBtn: 'コピー済',
      shareXBtn: 'Xでポスト',
      shareLineBtn: 'LINE',
      nativeShareBtn: '共有',
      shareTweetText: (oshi, coord) =>
        `私の神推し【${oshi}】への絵馬（#${coord}）を刻みました⛩️ #神推し #推し活 #Kamioshi`,
      downloadBtn: '記念画像を保存',
      renderingBtn: '画像生成中...'
    },
    termsModal: {
      title: '利用規約・ガイドライン',
      subtitle: '非営利コミュニティ方針とローカルデータ管理',
      closeAria: '利用規約を閉じる',
      sec1Title: '1. 本サイトについて',
      sec1Body:
        'kamioshi.si は、日本の絵馬（えま）文化に着想を得た独立した非営利のファンプロジェクトです。登録不要・完全無料でご利用いただけます。作成した絵馬データはお使いのブラウザ内部（localStorage）に安全に保存されます。',
      sec2Title: '2. コミュニティガイドライン',
      sec2Intro:
        '誰もが気持ちよく推しへの想いを語れる場所にするため、以下を含む内容の奉納はご遠慮ください:',
      sec2Rules: [
        '特定の個人・活動者・団体に対する誹謗中傷、侮辱、名誉毀損。',
        '個人情報（本名・住所・電話番号等）の書き込みやプライバシー侵害。',
        '差別的表現、ヘイトスピーチ、脅迫、わいせつな内容。',
        '宣伝スパム、外部URLの掲載、自動プログラムによる連投。'
      ],
      sec3Title: '3. 権利表記と非提携の明示',
      sec3Body:
        'kamioshi.si は独立したファンプロジェクトであり、掲載されるいかなる事務所、アイドルグループ、VTuber団体、企業とも提携・公認関係にありません。すべての名称や商標は各権利者に帰属します。',
      sec4Title: '4. 免責事項',
      sec4Body:
        '本サイトは現状有姿（AS-IS）で提供され、いかなる保証も伴いません。本サイトの利用や利用者が作成した内容に起因するいかなる損害についても、制作者は法的責任を負いかねます。',
      sec5Title: '5. データの自己管理とプライバシー',
      sec5Body:
        'ご自身が作成・共有する内容については自己の責任においてご利用ください。メールアドレス等の個人情報やCookieの収集は行っていません。ブラウザ内のデータはいつでも書き出し・消去できます。',
      sec6Title: (count, hiddenCount) =>
        `ローカル絵馬データ（現在 ${count}枚${hiddenCount > 0 ? ` • 非表示 ${hiddenCount}件` : ''}）`,
      sec6Desc: 'お使いのブラウザに保存されているデータのJSON出力、非表示解除、または初期化が行えます。',
      exportJsonBtn: 'JSON出力',
      restoreHiddenBtn: (count) => `非表示を解除 (${count})`,
      resetWallBtn: '壁を初期化',
      confirmResetBtn: '初期化する',
      cancelBtn: 'キャンセル',
      clearedNotice: 'ローカルの絵馬データを初期化しました。',
      restoredNotice: '非表示にしていた絵馬を再表示しました。',
      footerEdition: 'kamioshi.si • フリーコミュニティ版',
      gotItBtn: '閉じる'
    },
    footer: {
      brandTag: 'kamioshi.si — 神社仏閣の絵馬（えま）文化に想を得た奉納壁。完全無料。',
      hangLink: '絵馬を掛ける',
      termsLink: '利用規約',
      contactLink: '社務所・お問い合わせ'
    },
    contactModal: {
      title: '社務所（お問い合わせ）',
      subtitle: 'ご質問・絵馬の削除申請・ご要望など • メールにてご返信いたします',
      closeAria: 'お問い合わせ画面を閉じる',
      nameLabel: 'お名前（ニックネーム可）',
      namePlaceholder: '例: 名無しのファン、葵',
      emailLabel: '返信先メールアドレス',
      emailPlaceholder: 'you@example.com',
      emailHelp: '返信以外の目的で使用することはありません。',
      topicLabel: 'お問い合わせ項目',
      topicOptions: {
        general: '一般的なご質問・ご感想',
        removal: '絵馬の削除・通報・対応依頼',
        feature: '機能改善・新機能のご提案',
        bug: '不具合・表示崩れの報告',
        partnership: 'コラボレーション・その他'
      },
      messageLabel: 'お問い合わせ内容',
      messagePlaceholder: 'メッセージをご記入ください（絵馬の削除申請の場合は #番号 や推し名をご記入ください）',
      privacyNote: 'FormSubmit経由で安全に社務所へ送信されます。広告やメルマガ配信等には一切使用されません。',
      submitBtn: 'メッセージを送信する',
      submittingBtn: '送信中...',
      cancelBtn: 'キャンセル',
      successTitle: '送信完了',
      successDesc: 'メッセージが社務所へ届けられました。返信まで今しばらくお待ちください。',
      closeBtn: '閉じる',
      sendAnotherBtn: '別のメッセージを送る'
    }
  }
};
