import type { Mood } from './expressions';

// Mood comes from a few slowly decaying feelings, so Nimo calms down (or sulks) over time.
export class Brain {
  joy = 0;
  annoy = 0;
  dizzy = 0;
  idle = 0;
  petting = false;
  holding = false;
  tickling = false;
  awayUntil = 0;
  private override: { mood: Mood; until: number } | null = null;
  private taps: number[] = [];

  update(dt: number) {
    if (this.petting) { this.joy += 0.5 * dt; this.annoy -= 0.55 * dt; this.dizzy -= 0.5 * dt; }
    if (this.holding) { this.joy += 0.35 * dt; this.annoy -= 0.8 * dt; }
    if (this.tickling) this.joy += 0.25 * dt;
    if (!this.petting && !this.holding) this.joy += (this.joy > 0 ? -0.05 : 0.1) * dt;
    this.annoy -= 0.06 * dt;
    this.dizzy -= 0.4 * dt;
    this.idle += dt;
    this.joy = Math.max(-1, Math.min(1, this.joy));
    this.annoy = Math.max(0, Math.min(1, this.annoy));
    this.dizzy = Math.max(0, this.dizzy);
  }

  mood(now: number): Mood {
    if (this.override && now < this.override.until) return this.override.mood;
    if (this.holding) return 'hug';
    if (this.dizzy > 0.35) return 'dizzy';
    if (this.tickling) return 'giggle';
    if (this.annoy > 0.92) return 'furious';
    if (this.annoy > 0.62) return 'angry';
    if (this.annoy > 0.38) return 'annoyed';
    if (this.petting && this.joy > 0.72) return 'love';
    if (this.joy > 0.3) return 'happy';
    if (this.idle > 28) return 'asleep';
    if (this.idle > 12) return 'sleepy';
    return 'calm';
  }

  // Times are in seconds (performance.now() / 1000).
  set(mood: Mood, secs: number, now: number) { this.override = { mood, until: now + secs }; }
  clearOverride() { this.override = null; }

  slap(power: number, now: number) {
    this.annoy = Math.min(1, this.annoy + 0.3 + 0.15 * power);
    this.joy = Math.max(-1, this.joy - 0.4);
    this.dizzy = Math.min(1, 0.55 + 0.45 * power);
    this.set('ouch', 0.26, now);
  }

  // Returns how many taps landed in the last 2 s, so the caller can escalate.
  tap(now: number): number {
    this.taps = this.taps.filter((t) => now - t < 2);
    this.taps.push(now);
    const n = this.taps.length;
    if (n >= 3) this.annoy = Math.min(1, this.annoy + 0.14);
    else this.joy = Math.min(1, this.joy + 0.1);
    if (n >= 7) { this.annoy = 1; this.taps = []; }
    return n;
  }
}

export interface Memory {
  visits: number; slaps: number; pets: number; hugs: number; boops: number; tickles: number;
  found: string[]; lastSeen: number;
}

const KEY = 'nimo_play_v1';

export function loadMemory(): Memory {
  const blank: Memory = { visits: 0, slaps: 0, pets: 0, hugs: 0, boops: 0, tickles: 0, found: [], lastSeen: 0 };
  try { return { ...blank, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { return blank; }
}

export function saveMemory(m: Memory) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...m, lastSeen: Date.now() })); } catch (_) { /* private mode */ }
}
