export interface OpeningMemory {
  id: string;
  title: string;
  dateStr: string;
  summary: string;
  timestamp: number;
}

export interface Widget {
  id: string;
  type: 'time' | 'weather' | 'music' | 'photo' | 'quote' | 'battery' | 'calendar' | 'todo' | 'countdown' | 'contact' | 'together' | 'schedule' | 'memo' | 'step' | 'mood' | 'healing-battery' | 'ins-split' | 'ticket' | 'collage' | 'ins-split-v2' | 'manga-blink' | 'film-frame' | 'ticket-v2' | 'polaroid-stack' | 'dynamic-cat' | 'live-weather' | 'ins-large-v1' | 'ins-large-v2' | 'ins-weather-calendar' | 'ins-photo-square' | 'ins-profile-card' | 'ins-circle-widget' | 'ins-music-circle-widget' | 'ins-photo-wall-v1' | 'ins-photo-wall-v2' | 'ins-signature-v1' | 'ins-signature-v2' | 'ins-large-calendar' | 'ins-love-music' | 'love-profile-card' | 'pure-photo-card' | 'polaroid-triple' | 'browser-square-card' | 'couple-anniversary-card' | 'pink-polaroid-collage' | 'frosted-note-card' | 'korean-profile-card' | 'custom-generator';
  size: '1x1' | '2x2' | '2x1' | '4x2' | '5x2' | '4x4' | '6x2' | '2x4' | 'circle';
  category?: string;
  data?: any;
}

export interface DesktopItem {
  id: string;
  type: 'app' | 'widget' | 'folder';
  position: { x: number; y: number; page: number };
  appId?: string;
  widget?: Widget;
  folderItems?: string[]; // AppIds
}

export interface ApiPreset {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  settings: Partial<AppSettings>;
}

export interface CharacterProfile {
  id: string;
  avatarUrl: string;
  name: string;
  gender: string;
  persona: string;
  experience: string;
  background: string;
  relationship: string;
}

export interface WorldBookEntry {
  id: string;
  name: string;
  category: string;
  isEnabled: boolean;
  scope: 'global' | 'character';
  linkedCharacterIds: string[]; // IDs from characterProfiles
  priority: 'high' | 'medium' | 'low'; // mapped to 前, 中, 后
  content: string;
  createdAt: number;
}

export interface ReceivedGift {
  id: string;
  productId: string;
  name: string;
  image: string;
  timestamp: number;
  from: string;
  characterReaction: string;
  friendId: string;
  // Legacy fields for compatibility
  boxId?: string;
  coverUrl?: string;
  receivedAt?: number;
  characterThoughts?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  mood?: string;
  images?: string[];
  heartCount?: number;
  comments?: { friendId: string; friendName: string; content: string; timestamp: number }[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumCover?: string;
  mediaUrl: string;
  lyrics?: string;
  duration?: number;
  localFile?: Blob;
}

export interface ListenTogetherState {
  isActive: boolean;
  isFolded: boolean;
  currentSongId: string | null;
  isPlaying: boolean;
  playlist: Song[];
  playbackMode: 'loop' | 'random' | 'single';
  startTime: number | null;
  isAccepted: boolean;
  friendId: string | null;
  currentTime: number; // current playback position in seconds
  backgroundUrl?: string; // custom background for the page
  vinylBackgroundUrl?: string; // custom background for the vinyl center
}

export interface WeiboCategory {
  id: string;
  name: string;
  prompt: string;
}

export interface ChatTheme {
  id: string;
  name: string;
  css: string;
}

export interface AppSettings {
  baseUrl: string;
  apiKey: string;
  userApiKey?: string;
  modelName: string;
  temperature?: number;
  apiPresets: ApiPreset[];
  autoSummaryThreshold: number;
  callBackground?: string;
  isCallBackgroundEnabled?: boolean;
  isInsBubbleEnabled?: boolean;
  // Global Beautification
  themeColor?: string;
  glassOpacity?: number;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: 'sans' | 'serif' | 'mono' | 'rounded' | 'cute-cheese' | 'dynalight' | 'lxgw-wenkai';
  backgroundBlur?: number;
  wallpaperUrl?: string;
  settingsBackgroundUrl?: string;
  customIcons?: Record<string, string>;
  hideStatusBar?: boolean;
  fullScreenMode?: boolean;
  customFontUrl?: string;
  fontPresets?: { id: string; name: string; url: string }[];
  homePages?: string[][]; // Array of pages, each page is an array of app IDs
  themeId?: 'default' | 'rainy-cat' | 'pink-cat' | 'ocean-blue' | 'normal';
  desktopLayout?: DesktopItem[];
  timeAwarenessEnabled?: boolean;
  minimaxApiKey?: string;
  minimaxGroupId?: string;
  minimaxName?: string;
  minimaxApiUrl?: string;
  minimaxModel?: string;
  minimaxRegion?: 'china' | 'international';
  minimaxVoiceId?: string;
  minimaxEnabled?: boolean;
  // Image Generation Settings
  imageGenEnabled?: boolean;
  imageGenApiKey?: string;
  imageGenBaseUrl?: string;
  imageGenModel?: string;
  imageGenSize?: '1024x1024' | '1024x1792' | '1792x1024' | '768x1344' | '1344x768';
  imageGenQuality?: 'standard' | 'hd';
  imageGenPositivePrompt?: string;
  imageGenNegativePrompt?: string;
  homeWallpaperUrl?: string;
  totalPages?: number;
  // Memory Summary API
  memoryApiUrl?: string;
  memoryApiKey?: string;
  memoryModel?: string;
  // New Theme System
  lockScreenDelay?: number;
  lockScreenPin?: string;
  lockScreenEnabled?: boolean;
  lastLoginTime?: string;
  customBubbleCss?: string;
  customGlobalCss?: string;
  themePresets?: ThemePreset[];
  modernTheme?: boolean;
  characterProfiles?: CharacterProfile[];
  worldBookEntries?: WorldBookEntry[];
  diaryEntries?: DiaryEntry[];
  // Global Beautification
  isCuteRabbitThemeEnabled?: boolean;
  isDarkThemeEnabled?: boolean;
  globalCustomCss?: string;
  bubbleCustomCss?: string;
  appBackgroundUrl?: string;
  backgroundBlurIntensity?: number;
  backgroundOpacity?: number;
  homeWallpaperBlur?: number;
  homeWallpaperOpacity?: number;
  settingsBackgroundBlur?: number;
  settingsBackgroundOpacity?: number;
  chatWallpaperBlur?: number;
  chatWallpaperOpacity?: number;
  chatWallpaperUrl?: string;
  chatFontColor?: string;
  customStickers?: Sticker[];
  blindBoxes?: BlindBox[];
  blindBoxCoins?: number;
  perspectiveCards?: number;
  hintCards?: number;
  blindBoxBanner?: string;
  transactions?: Transaction[];
  walletBalance?: number;
  bankCards?: BankCard[];
  diaryTemplate?: string;
  calendarCity?: string;
  chatThemes?: ChatTheme[];
  bubbleThemes?: ChatTheme[];
  activeChatThemeId?: string;
  activeBubbleThemeId?: string;
  restRoomBooks?: RestRoomBook[];
  restRoomApiUrl?: string;
  restRoomApiKey?: string;
  restRoomModel?: string;
  restRoomPosts?: RestRoomPost[];
}

export interface RestRoomBook {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  content: string;
  progress: number;
  pageIndex?: number;
  selectedCharacterId?: string;
}

export interface RestRoomPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  timestamp: number;
  likes: number;
  commentsCount: number;
  comments?: { id: string; authorName: string; content: string; timestamp: number }[];
}

export interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  balance: number;
  cardType?: string;
  theme?: string;
  backgroundUrl?: string;
}

export interface Transaction {
  id: string;
  type: 'topup' | 'spend' | 'transfer-out' | 'transfer-in' | 'blindbox_purchase' | 'recharge' | 'gift_sent';
  amount: number;
  title?: string;
  description?: string;
  timestamp: number;
  targetId?: string;
  paymentMethodId?: string;
}

export interface BlindBox {
  id: string;
  name: string;
  description: string;
  price: number;
  coverUrl: string;
  category: string;
  isCustom: boolean;
  addedAt: number;
}

export interface Sticker {
  id: string;
  url: string;
  description: string;
  addedAt: number;
}

export interface MemoryEntry {
  id: string;
  friendId: string;
  friendName: string;
  type: 'chat' | 'call' | 'group' | 'offline';
  summary: string;
  timestamp: number;
}

export interface MomentComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  replyToId?: string;
  replyToName?: string;
  replies?: MomentComment[];
  likes?: string[];
}

export interface MomentPost {
  id: string;
  authorId: string; // 'user' or friendId
  authorName?: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  imageDescription?: string;
  location?: string;
  visibility: 'public' | 'selected' | 'excluded';
  visibleTo?: string[]; // friend IDs
  hiddenFrom?: string[]; // friend IDs
  likes: string[]; // array of IDs (user or friendId)
  comments: MomentComment[];
  timestamp: number;
  categoryId?: string;
  isTextCard?: boolean;
}

export interface OfflineMemory {
  summary: string;
  rawHistory: ChatMessage[];
}

export interface OfflineConfig {
  writingStyle: string;
  characterPerspective: string;
  userPerspective: string;
  minWords: number;
  maxWords: number;
  onlineContextCount: number;
  location: string;
  openingLine?: string;
  cardTheme?: 'classic' | 'student' | 'glass' | 'time';
  writingStylePresets?: any[];
  bgImage?: string;
  customCss?: string;
  worldBookEnabled?: boolean;
  selectedWorldBookIds?: string[];
}

export interface MomentsSettings {
  autoPostEnabled: boolean;
  frequency: number; // posts per day
  scheduledTimes: string[]; // e.g. ["09:00", "21:00"]
}

export interface Friend {
  id: string;
  name: string;
  alias?: string;
  avatar: string;
  persona: string;
  address?: string;
  isBlocked?: boolean;
  gender?: 'male' | 'female' | 'other';
  createdAt: number;
  momentsBackground?: string;
  moments?: MomentPost[];
  momentsSettings?: MomentsSettings;
  lastMessage?: string;
  lastTime?: string;
  chatBackground?: string;
  memoryCount?: number;
  lastSummarizedIndex?: number;
  voiceId?: string;
  voiceType?: 'gemini' | 'minimax';
  voiceFrequency?: 'never' | 'always' | 'every_two' | 'random' | 'one_per_round';
  language?: string;
  profileId?: string;
  mood?: string;
  affection?: number;
  moodIndex?: number;
  innerThoughts?: string;
  autoTranslateEnabled?: boolean;
  isNarrationMode?: boolean;
  activeOpening?: {
    id: string;
    title: string;
    startTimestamp: number;
  };
  openingMemories?: OpeningMemory[];
  characterImageGenEnabled?: boolean;
  characterImageGenFrequency?: '2_per_day' | '3_per_day' | '5_per_day' | 'unlimited';
  characterImageGenPositivePrompt?: string;
  characterImageGenNegativePrompt?: string;
  characterImageGenDailyCount?: number;
  characterImageGenLastResetDate?: string;
  relationshipConfirmed?: boolean;
  isSecretCrush?: boolean;
  offlineMemory?: OfflineMemory;
  currentOfflineMessages?: ChatMessage[];
  carriedOfflineMessages?: ChatMessage[];
  isOfflineMode?: boolean;
  offlineConfig?: OfflineConfig;
  offlineChatBackground?: string;
  disableActionDescription?: boolean;
  weiboFans?: number;
  weiboFollowing?: number;
  weiboLikes?: number;
  weiboBackground?: string;
  isFollowedByMe?: boolean;
  isFollowingMe?: boolean;
  weiboVipLevel?: number;
  weiboDescription?: string;
  weiboTag?: string;
  weiboStats?: { fans: string; following: string; likes: string };
  wechatId?: string;
  memorySettings?: {
    contextLimit: number;
    summaryThreshold: number;
    summaryBuffer: number;
    autoSummaryEnabled: boolean;
    silentSummaryMode: boolean;
    syncThreshold: number;
    summaryPrompt?: string;
  };
  sharedGroupMemorySettings?: {
    enabled: boolean;
    memoryCount: number;
    customPrompt?: string;
  };
  spotCheckEnabled?: boolean;
  proactiveSpotCheckEnabled?: boolean;
  spotCheckLimit?: number;
  spotCheckProbability?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  memberIds: string[];
  avatar: string;
  createdAt: number;
  lastMessage?: string;
  lastTime?: string;
  chatBackground?: string;
  chatThemeId?: string;
  autoTranslateEnabled?: boolean;
  isNarrationMode?: boolean;
  language?: string;
  disableActionDescription?: boolean;
  groupNotice?: string;
  memberTitles?: Record<string, { title: string; color: string }>;
  worldBookEnabled?: boolean;
  selectedWorldBookIds?: string[];
  activeOpening?: {
    id: string;
    title: string;
    startTimestamp: number;
  };
  openingMemories?: OpeningMemory[];
  isHtmlCardEnabled?: boolean;
}

export interface OnlineMemoryEntry {
  id: string;
  content: string;
  timestamp: number;
  type: 'auto' | 'manual';
  source?: 'chat' | 'weibo';
}

export interface OfflinePlotEntry {
  id: string;
  title: string;
  timestamp: number;
  logs: ChatMessage[];
  summary: string;
}

export interface MemoryStore {
  [friendId: string]: {
    onlineMemories: OnlineMemoryEntry[];
    offlinePlots: OfflinePlotEntry[];
  };
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'video' | 'voice' | 'transfer' | 'location' | 'call' | 'memory' | 'sticker' | 'blindbox-gift' | 'dice' | 'offline-invitation' | 'photo_card' | 'date_summary' | 'shopping-receipt' | 'red-packet' | 'opening-card' | 'group-announcement' | 'huabei-bill';
  mediaUrl?: string;
  stickerUrl?: string;
  avatar?: string;
  duration?: number; // for voice or call duration
  amount?: string; // for transfer
  transferStatus?: 'pending' | 'received' | 'refunded'; // for transfer
  description?: string; // for transfer or image
  callStatus?: 'missed' | 'rejected' | 'accepted' | 'ended'; // for call
  timestamp: number;
  translation?: string; // for voice translation
  hideTranslation?: boolean;
  quote?: ChatMessage;
  innerThought?: string; // for AI's inner thoughts
  isNarration?: boolean;
  cardText?: string;
  location?: string; // for photo_card or location message
  date?: string; // for photo_card
  timeLabel?: string; // for photo_card
  ccdMetadata?: {
    location: string;
    date: string;
    timeLabel: string;
  };
  openingData?: { title: string; content: string; dateStr: string };
  giftData?: {
    boxId: string;
    boxName: string;
    coverUrl: string;
    message: string;
    price: number;
    isOpened: boolean;
    source?: string;
  };
  huabeiData?: {
    username: string;
    totalDebt: string;
    categories?: Array<{
      name: string;
      amount: string;
      items: Array<{ title: string; amount: string; time: string }>;
    }>;
    items: Array<{ title: string; amount: string; time: string }> | string[];
  };
  invitationData?: {
    friendId: string;
    friendName: string;
    openingText: string;
    status: 'pending' | 'accepted' | 'declined';
  };
  redPacketData?: {
    id: string;
    packetType: 'random' | 'normal' | 'exclusive'; // 'random' (拼手速), 'normal' (普通), 'exclusive' (专属)
    totalAmount: number;
    count: number;
    remainingAmount: number;
    remainingCount: number;
    message: string;
    senderId: string;
    senderName: string;
    targetMemberId?: string; // for exclusive
    targetMemberName?: string;
    claims: Array<{ memberId: string; memberName: string; amount: number; timestamp: number }>;
  };
  isSystemNotification?: boolean;
  notificationType?: string;
  notificationData?: any;
  locationName?: string;
  isForwarded?: boolean;
  forwardFrom?: string;
  innerMonologue?: string;
  status?: string;
  outfit?: string;
  announcementData?: {
    content: string;
    author: string;
    timestamp: number;
    confirms?: string[]; // list of member IDs/names who confirmed
    declines?: string[]; // list of member IDs/names who declined
  };
  isRecalled?: boolean;
  recalledContent?: string;
  isMergedForward?: boolean;
  mergedMessages?: Array<{ senderName: string; content: string; timestamp: number }>;
}

export interface MovieReport {
  id: string;
  friendId: string;
  friendName: string;
  movieName: string;
  content: string;
  timestamp: number;
  rating: number;
  director?: string;
  screenwriter?: string;
  genre?: string;
  cast?: string;
  duration?: string;
  excerpts?: string;
  posterUrl?: string;
}

export interface MovieDanmaku {
  id: string;
  content: string;
  timestamp: number;
  authorName: string;
  color?: string;
}

export type AppId = 
  | 'home'
  | 'chat'
  | 'world-book'
  | 'settings'
  | 'meituan'
  | 'weibo'
  | 'shopping'
  | 'parallel-universe'
  | 'check-phone'
  | 'dating'
  | 'calendar'
  | 'diary'
  | 'memory'
  | 'phone'
  | 'character-profile'
  | 'moon-shadow'
  | 'rest-room'
  | 'text-adventure';

export interface MallProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  category: string;
  sales: number;
  stock: number;
  isCustom: boolean;
  description: string;
  customDesignNote?: string;
  specs?: { name: string; options: string[] }[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  spec?: string;
  quantity: number;
  selected: boolean;
}

export interface MallOrder {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'received' | 'completed' | 'refunded';
  timestamp: number;
  address: MallAddress;
  paymentMethod: 'wechat' | 'alipay' | 'balance';
}

export interface MallAddress {
  id: string;
  name: string;
  phone: string;
  area: string;
  detail: string;
  isDefault: boolean;
}

export interface UserPersona {
  id: string;
  name: string;
  wechatId: string;
  persona: string;
  signature: string;
  isEnabled: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  id: string;
  wechatId?: string;
  signature?: string;
  persona?: string;
  momentsBackground?: string;
  moments?: MomentPost[];
  favorites?: FavoriteMessage[];
  personas?: UserPersona[];
  activePersonaId?: string;
  balance?: number;
  balanceBackground?: string;
  paymentBackground?: string;
  bankCards?: BankCard[];
  transactions?: Transaction[];
}

export interface FavoriteMessage {
  id: string;
  friendId: string;
  friendName: string;
  content: string;
  timestamp: number;
  type: string;
}

export interface AppInfo {
  id: AppId;
  name: string;
  icon: string;
  color: string;
  category?: string;
  customIcon?: string;
}
