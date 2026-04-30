export interface PaysConfig {
  nom: string;
  flag: string;
  devise: string;        // Nom de la devise
  symbole: string;       // Symbole affiché (FCFA, GH₵, ₦...)
  code: string;          // ISO code (XOF, GHS, NGN...)
  operateurs: { id: string; label: string; color: string }[];
  indicatif: string;     // Ex: +229
}

export const PAYS_AFRIQUE_OUEST: PaysConfig[] = [
  // Zone FCFA (XOF)
  {
    nom: 'Bénin',
    flag: '🇧🇯',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+229',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
    ],
  },
  {
    nom: "Côte d'Ivoire",
    flag: '🇨🇮',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+225',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'Wave', label: 'Wave', color: 'bg-blue-500' },
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
    ],
  },
  {
    nom: 'Sénégal',
    flag: '🇸🇳',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+221',
    operateurs: [
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'Wave', label: 'Wave', color: 'bg-blue-500' },
      { id: 'Free', label: 'Free Money', color: 'bg-red-500' },
      { id: 'Expresso', label: 'Expresso Cash', color: 'bg-green-600' },
    ],
  },
  {
    nom: 'Togo',
    flag: '🇹🇬',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+228',
    operateurs: [
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
      { id: 'Togocom', label: 'Togocom Cash', color: 'bg-green-500' },
    ],
  },
  {
    nom: 'Burkina Faso',
    flag: '🇧🇫',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+226',
    operateurs: [
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
    ],
  },
  {
    nom: 'Mali',
    flag: '🇲🇱',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+223',
    operateurs: [
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
    ],
  },
  {
    nom: 'Niger',
    flag: '🇳🇪',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+227',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Airtel', label: 'Airtel Money', color: 'bg-red-600' },
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
    ],
  },
  {
    nom: 'Guinée-Bissau',
    flag: '🇬🇼',
    devise: 'Franc CFA',
    symbole: 'FCFA',
    code: 'XOF',
    indicatif: '+245',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
    ],
  },
  // Autres devises
  {
    nom: 'Guinée',
    flag: '🇬🇳',
    devise: 'Franc Guinéen',
    symbole: 'GNF',
    code: 'GNF',
    indicatif: '+224',
    operateurs: [
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
    ],
  },
  {
    nom: 'Ghana',
    flag: '🇬🇭',
    devise: 'Cedi Ghanéen',
    symbole: 'GH₵',
    code: 'GHS',
    indicatif: '+233',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Vodafone', label: 'Vodafone Cash', color: 'bg-red-500' },
      { id: 'AirtelTigo', label: 'AirtelTigo Money', color: 'bg-red-700' },
    ],
  },
  {
    nom: 'Nigeria',
    flag: '🇳🇬',
    devise: 'Naira Nigérian',
    symbole: '₦',
    code: 'NGN',
    indicatif: '+234',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Airtel', label: 'Airtel Money', color: 'bg-red-600' },
      { id: 'Opay', label: 'OPay', color: 'bg-green-600' },
      { id: 'PalmPay', label: 'PalmPay', color: 'bg-emerald-500' },
    ],
  },
  {
    nom: 'Sierra Leone',
    flag: '🇸🇱',
    devise: 'Leone',
    symbole: 'Le',
    code: 'SLE',
    indicatif: '+232',
    operateurs: [
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
      { id: 'Africell', label: 'Africell Money', color: 'bg-purple-600' },
    ],
  },
  {
    nom: 'Liberia',
    flag: '🇱🇷',
    devise: 'Dollar Libérien',
    symbole: 'L$',
    code: 'LRD',
    indicatif: '+231',
    operateurs: [
      { id: 'MTN', label: 'MTN MoMo', color: 'bg-yellow-400' },
      { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500' },
    ],
  },
  {
    nom: 'Gambie',
    flag: '🇬🇲',
    devise: 'Dalasi',
    symbole: 'D',
    code: 'GMD',
    indicatif: '+220',
    operateurs: [
      { id: 'Africell', label: 'Africell Money', color: 'bg-purple-600' },
      { id: 'QCell', label: 'QCell', color: 'bg-blue-700' },
    ],
  },
  {
    nom: 'Mauritanie',
    flag: '🇲🇷',
    devise: 'Ouguiya',
    symbole: 'MRU',
    code: 'MRU',
    indicatif: '+222',
    operateurs: [
      { id: 'Moov', label: 'Moov Africa', color: 'bg-blue-600' },
      { id: 'Mauritel', label: 'Mauritel Money', color: 'bg-green-600' },
    ],
  },
  {
    nom: 'Cap-Vert',
    flag: '🇨🇻',
    devise: 'Escudo Cap-Verdien',
    symbole: 'Esc',
    code: 'CVE',
    indicatif: '+238',
    operateurs: [
      { id: 'CVMóvel', label: 'CVMóvel Pay', color: 'bg-blue-500' },
    ],
  },
];

export const PAYS_MAP = new Map(PAYS_AFRIQUE_OUEST.map(p => [p.nom, p]));

export function getPaysConfig(pays: string): PaysConfig {
  return PAYS_MAP.get(pays) ?? PAYS_AFRIQUE_OUEST[0];
}

export function formatMontant(montant: number, pays: string): string {
  const config = getPaysConfig(pays);
  return `${montant.toLocaleString('fr-FR')} ${config.symbole}`;
}

export function getSymbole(pays: string): string {
  return getPaysConfig(pays).symbole;
}

export function getOperateurs(pays: string) {
  return getPaysConfig(pays).operateurs;
}
