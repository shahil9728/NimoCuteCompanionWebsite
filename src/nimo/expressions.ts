import type { EyeP, MouthP } from './rig';

export type Mood =
  | 'calm' | 'happy' | 'love' | 'excited' | 'surprised' | 'annoyed' | 'angry' | 'furious'
  | 'dizzy' | 'ouch' | 'sleepy' | 'yawn' | 'asleep' | 'sad' | 'giggle' | 'hug' | 'skeptical';

type EyeShape = Omit<EyeP, 'blink'>;

export interface Expr {
  eye: EyeShape;
  eyeR: EyeShape;
  heart: number; spiral: number; closed: number; closedCurve: number;
  mouth: MouthP;
  cheeks: number; tear: number; sweat: number; stars: number;
  breath: number; breathRate: number;
  color: string;
}

interface ExprIn {
  eye?: Partial<EyeShape>;
  eyeR?: Partial<EyeShape>;
  mouth?: Partial<MouthP>;
  heart?: number; spiral?: number; closed?: number; closedCurve?: number;
  cheeks?: number; tear?: number; sweat?: number; stars?: number;
  breath?: number; breathRate?: number;
  color?: string;
}

const EYE: EyeShape = { w: 54, h: 56, lidY: 0, lidRot: 0, botY: 0, rot: 0, dy: 0 };
const BASE = {
  heart: 0, spiral: 0, closed: 0, closedCurve: 1,
  mouth: { curve: 0.45, w: 20, open: 0, wavy: 0 } as MouthP,
  cheeks: 0.2, tear: 0, sweat: 0, stars: 0, breath: 0.012, breathRate: 2.1, color: '#35e0ff',
};

const RAW: Record<Mood, ExprIn> = {
  calm: {},
  happy: { eye: { w: 58, h: 56, botY: 0.4, dy: -2 }, mouth: { curve: 1, w: 28 }, cheeks: 0.6 },
  love: { eye: { w: 58 }, heart: 1, mouth: { curve: 1, w: 26, open: 0.2 }, cheeks: 1, color: '#ff6fae' },
  excited: { eye: { w: 62, h: 66, botY: 0.1 }, mouth: { curve: 0.6, w: 18, open: 0.85 }, cheeks: 0.5 },
  surprised: { eye: { w: 62, h: 68 }, mouth: { curve: 0, w: 14, open: 0.75 }, cheeks: 0.1, color: '#5ee8ff' },
  annoyed: { eye: { h: 46, lidY: 0.3, lidRot: 9 }, mouth: { curve: -0.2, w: 20 }, sweat: 1, cheeks: 0, color: '#ffb347' },
  angry: { eye: { w: 56, h: 50, lidY: 0.3, lidRot: 24, dy: 2 }, mouth: { curve: -0.9, w: 24 }, cheeks: 0, color: '#ff5a3c' },
  furious: { eye: { w: 56, h: 48, lidY: 0.34, lidRot: 30, dy: 3 }, mouth: { curve: -0.6, w: 26, open: 0.45, wavy: 0.5 }, cheeks: 0, color: '#ff3b2f' },
  dizzy: { spiral: 1, stars: 1, mouth: { curve: 0, w: 24, open: 0.25, wavy: 1 }, color: '#7ee8ff' },
  ouch: { eye: { rot: 22 }, closed: 1, closedCurve: -0.8, mouth: { curve: -0.6, w: 20, open: 0.4, wavy: 0.6 }, cheeks: 0, color: '#ff7a5c' },
  sleepy: { eye: { h: 52, lidY: 0.52, lidRot: -6, dy: 3 }, mouth: { curve: 0.15, w: 14 }, breath: 0.018, breathRate: 1.4, color: '#6fcfe0' },
  yawn: { eye: { h: 40, lidY: 0.6, botY: 0.2 }, mouth: { curve: 0, w: 22, open: 1 }, breath: 0.018, breathRate: 1.4, color: '#6fcfe0' },
  asleep: { closed: 1, closedCurve: 1, mouth: { curve: 0.2, w: 12, open: 0.12 }, cheeks: 0.1, breath: 0.028, breathRate: 1.1, color: '#4fb3c8' },
  sad: { eye: { h: 58, lidY: 0.16, lidRot: -18, dy: 2 }, mouth: { curve: -0.7, w: 18 }, tear: 1, cheeks: 0.1, color: '#6cb8ff' },
  giggle: { closed: 1, closedCurve: -1, mouth: { curve: 1, w: 28, open: 0.55 }, cheeks: 0.9 },
  hug: { closed: 1, closedCurve: -1, mouth: { curve: 1, w: 22 }, cheeks: 1, color: '#8ff3ff' },
  skeptical: { eye: { h: 54, lidY: 0.38, lidRot: 4 }, eyeR: { h: 60, lidY: 0.05, lidRot: -8 }, mouth: { curve: -0.25, w: 16 }, cheeks: 0 },
};

export function expr(m: Mood): Expr {
  const r = RAW[m];
  const eye = { ...EYE, ...r.eye };
  return {
    ...BASE, ...r,
    eye,
    eyeR: { ...eye, ...r.eyeR },
    mouth: { ...BASE.mouth, ...r.mouth },
  } as Expr;
}

export const MOOD_COPY: Record<Mood, { title: string; text: string }> = {
  calm: { title: 'Chilling', text: 'Riding along, keeping an eye on you.' },
  happy: { title: 'Happy', text: 'When you pet him or finish a task.' },
  love: { title: 'In love', text: "Keep petting. He's melting." },
  excited: { title: 'Boop!', text: 'Right on the nose. He loves that.' },
  surprised: { title: 'Huh?!', text: 'Wide awake now.' },
  annoyed: { title: 'Annoyed', text: "Okay, that's enough poking." },
  angry: { title: 'Grumpy', text: 'If you brake too hard or flick him!' },
  furious: { title: 'Furious', text: 'Too much! Pet him to calm him down.' },
  dizzy: { title: 'Dizzy', text: 'Seeing stars after that flick.' },
  ouch: { title: 'Ouch!', text: 'Right on the cheek.' },
  sleepy: { title: 'Sleepy', text: 'At night or when his battery is low.' },
  yawn: { title: 'Sleepy', text: 'Yaaawn…' },
  asleep: { title: 'Asleep', text: 'Tap him or move closer to wake him up.' },
  sad: { title: 'Lonely', text: "When you've been away too long." },
  giggle: { title: 'Giggling', text: 'Ticklish under the chin!' },
  hug: { title: 'Hug', text: "Hold on. He's not letting go." },
  skeptical: { title: 'Suspicious', text: 'He remembers last time…' },
};
