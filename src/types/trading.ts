// ─────────────────────────────────────────────────────────────────────────────
// TYPES PRINCIPAUX — MITrad Journal v2
// ─────────────────────────────────────────────────────────────────────────────

/** Profil utilisateur complet */
export interface User {
  email: string;
  password: string;
  name: string;
  country: string;
  capital: number;            // Capital initial de référence
  monthlyGoalR: number;       // Objectif mensuel en R
  bio: string;
  experience: string;
  tradingStyle: string;
  favoritePairs: string[];
  broker: string;
  avatar?: string;
  banner?: string;            // Image de bannière uploadable (base64)
  isPublic: boolean;
  customSetups: string[];     // Setups personnalisés de l'utilisateur
  customPairs?: string[];     // ← NOUVEAU v2 : actifs personnalisés de l'utilisateur
}

/** Compte de trading (Personnel, Funded, Démo, Propfirm) */
export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  broker: string;
  type: 'Personnel' | 'Funded' | 'Démo' | 'Propfirm'; // ← NOUVEAU v2 : type Propfirm ajouté
  capital: number;
  isDefault?: boolean;
}

/** Trade individuel enregistré dans le journal */
export interface Trade {
  id: string;
  userId: string;
  accountId?: string;         // Compte associé (optionnel)
  date: string;
  pair: string;               // Paire tradée (ex: EURUSD, XAUUSD...)
  direction: 'BUY' | 'SELL';
  session: string;            // Session de trading (London, NY, Asia...)
  quality?: 'A+' | 'A' | 'B' | 'C' | number | null;
  setup?: string | null;           // Optionnel pour trades import�s
  emotion: string;            // État émotionnel lors du trade
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  exitPrice?: number;
  resultR?: number | null;
  resultDollar: number;       // Résultat en dollars
  status: 'WIN' | 'LOSS' | 'BE' | 'RUNNING';
  duration: number;           // Durée en minutes
  entryNote: string;          // Justification de l'entrée
  exitNote: string;           // Analyse de la sortie
  tradingViewLink: string;    // Lien vers l'analyse TradingView
  screenshot: string;
  is_imported?: boolean;         // Capture d'écran base64
}

/** Analyse quotidienne des marchés */
export interface DailyAnalysis {
  id: string;
  userId: string;
  date: string;
  pairs: AnalyzedPair[];
}

/** Paire analysée dans une session quotidienne */
export interface AnalyzedPair {
  pair: string;
  fundamentalBias: string;   // Biais fondamental
  technicalBias: string;     // Biais technique
  decision: string;          // Décision (Autorisé, Non autorisé, Surveiller)
  tvLink: string;
  note: string;
  images?: string[];         // Max 3 images base64, max 5MB chacune
}

/** Badge de succès attribué automatiquement */
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

/** Objectif personnel du trader */
export interface Objective {
  id: string;
  text: string;              // Titre de l'objectif (obligatoire)
  description?: string;      // Description détaillée optionnelle
  targetDate?: string;       // Date cible ISO (YYYY-MM-DD)
  completed: boolean;
  createdAt: string;
  image?: string;            // Image/thumbnail base64 optionnelle
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/** Paires de trading disponibles par défaut */
export const ALL_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'USDCHF',
  'AUDUSD', 'NZDUSD', 'USDCAD', 'BTCUSD', 'ETHUSD'
];

/** Sessions de trading disponibles */
export const ALL_SESSIONS = ['London', 'New York', 'Asia', 'London/NY Overlap'];

/** Setups de trading disponibles par défaut */
export const ALL_SETUPS = [
  'BOS', 'CHoCH', 'Order Block', 'FVG',
  'Liquidity Grab', 'Breaker Block', 'IDWM', 'Swing Structure'
];

/** États émotionnels disponibles */
export const ALL_EMOTIONS = [
  'Confiant', 'Neutre', 'Stressé', 'FOMO',
  'Revenge Trading', 'Discipliné', 'Hésitant', 'Surexcité'
];

/** Niveaux de qualité disponibles (format lettre) */
export const ALL_QUALITIES: Array<'A+' | 'A' | 'B' | 'C'> = ['A+', 'A', 'B', 'C'];

/** Options de biais directionnel */
export const BIAS_OPTIONS = [
  'Haussier', 'Baissier', 'Neutre', 'Légèrement Haussier', 'Légèrement Baissier'
];

/** Décisions possibles pour une paire analysée */
export const DECISION_OPTIONS = ['Autorisé ✅', 'Non autorisé ❌', 'Surveiller 👀'];

/** Types de compte disponibles — NOUVEAU v2 : Propfirm ajouté */
export const ACCOUNT_TYPES = ['Personnel', 'Funded', 'Démo', 'Propfirm'] as const;

/** Pays africains supportés */
export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cameroon', 'Central African Republic', 'Comoros',
  'Congo', 'DRC', 'Ivory Coast', 'Djibouti', 'Egypt', 'Eritrea',
  'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'Equatorial Guinea', 'Kenya', 'Lesotho', 'Liberia',
  'Libya', 'Madagascar', 'Malawi', 'Mali', 'Morocco', 'Mauritius',
  'Mauritania', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Uganda',
  'Rwanda', 'São Tomé', 'Senegal', 'Seychelles', 'Sierra Leone',
  'Somalia', 'Sudan', 'South Sudan', 'Tanzania', 'Chad', 'Togo',
  'Tunisia', 'Zambia', 'Zimbabwe', 'South Africa'
];

/** Drapeaux des pays africains */
export const COUNTRY_FLAGS: Record<string, string> = {
  'Algeria': '🇩🇿', 'Angola': '🇦🇴', 'Benin': '🇧🇯', 'Botswana': '🇧🇼',
  'Burkina Faso': '🇧🇫', 'Burundi': '🇧🇮', 'Cabo Verde': '🇨🇻',
  'Cameroon': '🇨🇲', 'Central African Republic': '🇨🇫', 'Comoros': '🇰🇲',
  'Congo': '🇨🇬', 'DRC': '🇨🇩', 'Ivory Coast': '🇨🇮', 'Djibouti': '🇩🇯',
  'Egypt': '🇪🇬', 'Eritrea': '🇪🇷', 'Eswatini': '🇸🇿', 'Ethiopia': '🇪🇹',
  'Gabon': '🇬🇦', 'Gambia': '🇬🇲', 'Ghana': '🇬🇭', 'Guinea': '🇬🇳',
  'Guinea-Bissau': '🇬🇼', 'Equatorial Guinea': '🇬🇶', 'Kenya': '🇰🇪',
  'Lesotho': '🇱🇸', 'Liberia': '🇱🇷', 'Libya': '🇱🇾', 'Madagascar': '🇲🇬',
  'Malawi': '🇲🇼', 'Mali': '🇲🇱', 'Morocco': '🇲🇦', 'Mauritius': '🇲🇺',
  'Mauritania': '🇲🇷', 'Mozambique': '🇲🇿', 'Namibia': '🇳🇦', 'Niger': '🇳🇪',
  'Nigeria': '🇳🇬', 'Uganda': '🇺🇬', 'Rwanda': '🇷🇼', 'São Tomé': '🇸🇹',
  'Senegal': '🇸🇳', 'Seychelles': '🇸🇨', 'Sierra Leone': '🇸🇱',
  'Somalia': '🇸🇴', 'Sudan': '🇸🇩', 'South Sudan': '🇸🇸', 'Tanzania': '🇹🇿',
  'Chad': '🇹🇩', 'Togo': '🇹🇬', 'Tunisia': '🇹🇳', 'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼', 'South Africa': '🇿🇦'
};

/** Options d'expérience de trading */
export const EXPERIENCE_OPTIONS = [
  'Moins d\'1 an', '1-2 ans', '3-5 ans', '5+ ans'
];

/** Styles de trading disponibles */
export const STYLE_OPTIONS = [
  'Scalping', 'Day Trading', 'Swing Trading', 'Position Trading'
];




