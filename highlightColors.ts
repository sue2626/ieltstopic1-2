export interface HighlightColorDef {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
}

export const HIGHLIGHT_PALETTE: HighlightColorDef[] = [
  { id: 'yellow-lemon', name: 'Vàng chanh sáng', bg: '#fef08a', text: '#0f172a', border: '#facc15' },
  { id: 'yellow-amber', name: 'Vàng nghệ mật ong', bg: '#fde68a', text: '#0f172a', border: '#f59e0b' },
  { id: 'orange-peach', name: 'Cam đào san hô', bg: '#fed7aa', text: '#0f172a', border: '#fb923c' },
  { id: 'green-mint', name: 'Xanh bạc hà (Mint)', bg: '#bbf7d0', text: '#0f172a', border: '#4ade80' },
  { id: 'green-emerald', name: 'Xanh ngọc lục bảo', bg: '#86efac', text: '#0f172a', border: '#22c55e' },
  { id: 'cyan-ice', name: 'Xanh băng (Ice Cyan)', bg: '#a5f3fc', text: '#0f172a', border: '#38bdf8' },
  { id: 'blue-sky', name: 'Xanh da trời (Sky)', bg: '#bae6fd', text: '#0f172a', border: '#60a5fa' },
  { id: 'blue-cobalt', name: 'Xanh coban đậm', bg: '#1d4ed8', text: '#ffffff', border: '#1e40af' },
  { id: 'pink-rose', name: 'Hồng phấn hoa đào', bg: '#fbcfe8', text: '#0f172a', border: '#f472b6' },
  { id: 'pink-crimson', name: 'Hồng sen rực rỡ', bg: '#e11d48', text: '#ffffff', border: '#be123c' },
  { id: 'purple-lavender', name: 'Tím hoa oải hương', bg: '#e9d5ff', text: '#0f172a', border: '#c084fc' },
  { id: 'purple-deep', name: 'Tím than hoàng gia', bg: '#7e22ce', text: '#ffffff', border: '#6b21a8' },
  { id: 'teal-deep', name: 'Xanh cổ vịt sâu', bg: '#0f766e', text: '#ffffff', border: '#115e59' },
  { id: 'red-ruby', name: 'Đỏ ruby nổi bật', bg: '#b91c1c', text: '#ffffff', border: '#991b1b' },
];

/**
 * Calculates optimal text color (#0f172a or #ffffff) based on background luminance
 * Guarantees zero washed-out white text in dark mode on bright backgrounds
 */
export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor || hexColor === 'transparent') {
    return 'inherit';
  }

  // Check palette match first
  const match = HIGHLIGHT_PALETTE.find(
    c => c.bg.toLowerCase() === hexColor.toLowerCase()
  );
  if (match) return match.text;

  // Hex to RGB luminance calculation
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    // HSP equation
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 155 ? '#0f172a' : '#ffffff';
  }

  return '#0f172a';
}
