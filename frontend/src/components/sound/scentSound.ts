// Procedural "Sonic Notes" engine with Weather Ambience integration.
// No audio files, no network, no dependencies.

export interface AmbientContext {
  isNight: boolean;
  isRain: boolean;
  isSnow: boolean;
  isFog: boolean;
  windSpeed: number;
  weatherCode: number;
}

export const NEUTRAL_AMBIENCE: AmbientContext = {
  isNight: false,
  isRain: false,
  isSnow: false,
  isFog: false,
  windSpeed: 0,
  weatherCode: 0,
};

let globalAmbience: AmbientContext = NEUTRAL_AMBIENCE;
const ambienceListeners = new Set<() => void>();

export function setGlobalAmbience(ambience: AmbientContext) {
  globalAmbience = ambience;
  ambienceListeners.forEach((listener) => listener());
}

export function subscribeToAmbience(listener: () => void) {
  ambienceListeners.add(listener);
  return () => ambienceListeners.delete(listener);
}

export function getGlobalAmbience(): AmbientContext {
  return globalAmbience;
}

export function ambienceFromWeather(data: any): AmbientContext {
  const code = data?.weathercode ?? 0;
  const isRain = code >= 51 && code <= 67;
  const isSnow = code >= 71 && code <= 77;
  const isFog = code >= 45 && code <= 48;
  
  return {
    isNight: data?.is_day === 0,
    isRain,
    isSnow,
    isFog,
    windSpeed: data?.windspeed ?? 0,
    weatherCode: code,
  };
}

export interface ScentSoundInput {
  seed: string;
  rarity: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

interface Profile {
  bright: number;
  warm: number;
  sparkle: number;
  air: number;
  rumble: number;
  crackle: number;
}

export interface Tuning {
  drone: number;
  pad: number;
  chimes: number;
  chimeDensity: number;
  breath: number;
  crackle: number;
  reverbWet: number;
  reverbSend: number;
  reverbLength: number;
  brightness: number;
  tempo: number;
}

export const DEFAULT_TUNING: Tuning = {
  drone: 1,
  pad: 1,
  chimes: 1,
  chimeDensity: 1,
  breath: 1,
  crackle: 1,
  reverbWet: 0.7,
  reverbSend: 0.55,
  reverbLength: 1,
  brightness: 1,
  tempo: 1,
};

const P = (bright: number, warm: number, sparkle: number, air: number, rumble: number, crackle: number): Profile =>
  ({ bright, warm, sparkle, air, rumble, crackle });

const FAMILIES: Array<[string[], Profile]> = [
  [["bergamot", "lemon", "orange", "grapefruit", "lime", "mandarin", "citrus", "fig"], P(1.2, 0.2, 1.2, 0.3, 0, 0)],
  [["mint", "eucalyptus", "basil", "rosemary", "thyme", "sage"], P(0.8, 0.3, 0.6, 1.0, 0, 0)],
  [["lavender", "violet", "iris", "chamomile"], P(0.6, 0.6, 0.4, 0.4, 0, 0)],
  [["rose", "peony", "geranium"], P(0.5, 0.8, 0.3, 0.2, 0, 0)],
  [["jasmine", "lily", "neroli", "ylang", "tuberose", "gardenia", "freesia", "heliotrope", "petitgrain", "blossom"], P(0.7, 0.7, 0.5, 0.3, 0, 0)],
  [["sandalwood", "cedarwood", "cedar", "wood"], P(0.2, 0.7, 0.1, 0.1, 0.8, 0.8)],
  [["vanilla", "tonka", "benzoin", "amber", "honey", "caramel"], P(0.3, 1.0, 0.1, 0.1, 0.6, 0.2)],
  [["musk"], P(0.4, 0.8, 0.2, 0.5, 0.5, 0)],
  [["patchouli", "vetiver", "oud", "leather", "tobacco", "moss"], P(0.1, 0.9, 0, 0, 1.2, 0.5)],
];

function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function profileOf(note: string): Profile {
  const n = note.toLowerCase();
  for (const [words, profile] of FAMILIES) {
    if (words.some((w) => n.includes(w))) return profile;
  }
  const r = makeRng(hash(n));
  return P(r(), r(), r() * 0.6, r() * 0.4, r() * 0.4, 0);
}

function average(notes: string[]): Profile {
  const list = notes.length ? notes.map(profileOf) : [P(0.5, 0.5, 0.3, 0.2, 0.2, 0)];
  const sum = list.reduce((a, p) => P(a.bright + p.bright, a.warm + p.warm, a.sparkle + p.sparkle, a.air + p.air, a.rumble + p.rumble, a.crackle + p.crackle), P(0, 0, 0, 0, 0, 0));
  const k = list.length;
  return P(sum.bright / k, sum.warm / k, sum.sparkle / k, sum.air / k, sum.rumble / k, sum.crackle / k);
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const MAJOR_PENTA = [0, 2, 4, 7, 9];
const MINOR_PENTA = [0, 3, 5, 7, 10];

type AudioCtor = typeof AudioContext;
function audioContextCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class ScentSoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private send: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private running = false;
  private volume = 0.8;
  private whiteNoise: AudioBuffer | null = null;
  private pinkNoise: AudioBuffer | null = null;
  private tuning: Tuning;
  private tone: BiquadFilterNode | null = null;
  private wet: GainNode | null = null;
  private droneNode: GainNode | null = null;
  private droneLfo: GainNode | null = null;
  private droneLevel = 0;
  private toneBase = 6000;
  private readonly rand: () => number;
  private readonly top: Profile;
  private readonly heart: Profile;
  private readonly base: Profile;
  private readonly scale: number[];
  private readonly rootMidi: number;
  private readonly tempoMod: number;
  private readonly ambient: AmbientContext;
  onStop: (() => void) | null = null;

  constructor(private readonly input: ScentSoundInput, tuning: Partial<Tuning> = {}, ambient?: Partial<AmbientContext>) {
    this.tuning = { ...DEFAULT_TUNING, ...tuning };
    this.ambient = { ...NEUTRAL_AMBIENCE, ...ambient };
    this.rand = makeRng(hash(input.seed));
    this.top = average(input.topNotes);
    this.heart = average(input.heartNotes);
    this.base = average(input.baseNotes);
    
    const mood = (this.top.bright + this.top.sparkle) - (this.base.warm + this.base.rumble);
    this.scale = mood > 0 ? MAJOR_PENTA : MINOR_PENTA;
    this.rootMidi = mood > 0 ? 60 + Math.floor(this.rand() * 5) : 43 + Math.floor(this.rand() * 4);
    this.tempoMod = 1.0 + (this.top.sparkle * 0.6) - (this.base.rumble * 0.6);

    // Apply ambient context modifiers
    if (this.ambient.isNight) {
      this.tuning.brightness *= 0.75;
      this.tuning.reverbLength *= 1.3;
      this.tuning.chimeDensity *= 0.6;
    }
    if (this.ambient.isRain || this.ambient.isFog) {
      this.tuning.reverbLength *= 1.2;
      this.tuning.breath *= 1.5;
      this.tuning.chimes *= 0.7;
    }
    if (this.ambient.isSnow) {
      this.tuning.brightness *= 0.8;
      this.tuning.reverbLength *= 1.4;
    }
  }

  get isRunning(): boolean { return this.running; }

  async start(): Promise<void> {
    const Ctor = audioContextCtor();
    if (!Ctor || this.running) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    await ctx.resume();
    this.running = true;

    const rarity = Math.max(0, Math.min(3, this.input.rarity));
    const bright = (this.top.bright + this.heart.bright) / 2;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    this.toneBase = 2500 + 9000 * bright;
    tone.frequency.value = Math.min(18000, this.toneBase * this.tuning.brightness);
    this.tone = tone;
    const comp = ctx.createDynamicsCompressor();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.data = new Uint8Array(this.analyser.fftSize);
    this.dry = ctx.createGain();
    this.send = ctx.createGain();
    this.send.gain.value = this.tuning.reverbSend;
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx, (2.5 + rarity * 0.8) * this.tuning.reverbLength);
    const wet = ctx.createGain();
    wet.gain.value = this.tuning.reverbWet;
    this.wet = wet;

    this.dry.connect(tone);
    this.send.connect(reverb);
    reverb.connect(wet);
    wet.connect(tone);
    tone.connect(this.master);
    this.master.connect(comp);
    comp.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.whiteNoise = this.noiseBuffer(ctx, 2, "white");
    this.pinkNoise = this.noiseBuffer(ctx, 2, "pink");
    this.master.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.8);

    this.buildDrone(rarity);
    this.nextChord(0, rarity);
    this.intro(rarity);
    this.intervals.push(setInterval(() => this.tick(), 300));
  }

  stop(fade = 1.2): void {
    if (!this.running || !this.ctx || !this.master) return;
    this.running = false;
    const ctx = this.ctx;
    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    this.timers = [];
    this.intervals = [];
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    setTimeout(() => void ctx.close(), fade * 1000 + 150);
    this.ctx = null;
    this.onStop?.();
  }

  setTuning(next: Partial<Tuning>): void {
    this.tuning = { ...this.tuning, ...next };
    const ctx = this.ctx;
    if (!ctx || !this.running) return;
    const t = ctx.currentTime;
    this.send?.gain.setTargetAtTime(this.tuning.reverbSend, t, 0.05);
    this.wet?.gain.setTargetAtTime(this.tuning.reverbWet, t, 0.05);
    this.tone?.frequency.setTargetAtTime(Math.min(18000, this.toneBase * this.tuning.brightness), t, 0.05);
    this.droneNode?.gain.setTargetAtTime(this.droneLevel * this.tuning.drone, t, 0.05);
    this.droneLfo?.gain.setTargetAtTime(this.droneLevel * this.tuning.drone * 0.35, t, 0.05);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.master && this.running) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  getLevel(): number {
    if (!this.analyser || !this.data) return 0;
    this.analyser.getByteTimeDomainData(this.data as unknown as Parameters<AnalyserNode["getByteTimeDomainData"]>[0]);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = (this.data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.data.length) * 6);
  }

  private step(n: number): number {
    const len = this.scale.length;
    const oct = Math.floor(n / len);
    return this.scale[((n % len) + len) % len] + 12 * oct;
  }

  private buildDrone(rarity: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.dry || !this.send) return;
    const f0 = mtof(this.rootMidi - 12);
    const level = 0.22 + 0.15 * this.base.warm;
    this.droneLevel = level;
    const gain = ctx.createGain();
    gain.gain.value = level * this.tuning.drone;
    this.droneNode = gain;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160 + 380 * this.base.warm;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05 + this.rand() * 0.07;
    lfoGain.gain.value = level * this.tuning.drone * 0.35;
    this.droneLfo = lfoGain;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    const voices: Array<[OscillatorType, number, number]> = [
      ["sine", f0, 1],
      ["triangle", f0 * 2, 0.35],
      ["sine", f0 * 1.5, 0.18 + 0.3 * this.base.warm],
    ];
    for (const [type, freq, g] of voices) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = (this.rand() - 0.5) * 8;
      
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 4 + this.rand() * 2;
      vibratoGain.gain.value = 2 + this.rand() * 3;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start();
      
      og.gain.value = g;
      osc.connect(og);
      og.connect(lp);
      osc.start();
    }
    lp.connect(gain);
    gain.connect(this.dry);
    gain.connect(this.send);

    if (this.base.rumble > 0.2 && this.whiteNoise) {
      const src = ctx.createBufferSource();
      src.buffer = this.whiteNoise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 110;
      const g = ctx.createGain();
      g.gain.value = 0.25 * this.base.rumble;
      src.connect(f);
      f.connect(g);
      g.connect(this.dry);
      src.start();
    }
    if (rarity >= 2) {
      const sh = ctx.createOscillator();
      const shg = ctx.createGain();
      sh.type = "sine";
      sh.frequency.value = f0 * 4;
      shg.gain.value = 0.015 * rarity;
      sh.connect(shg);
      shg.connect(this.send);
      sh.start();
    }
  }

  private nextChord(index: number, rarity: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.running || !this.dry || !this.send) return;
    const progression = [0, 3, 4, 2];
    const root = progression[index % progression.length];
    const lift = this.heart.bright > 0.55 ? 12 : 0;
    const steps = [root, root + 2, root + 4, ...(rarity >= 2 ? [root + 7] : [])];
    
    const dur = (9 + this.rand() * 5) * this.tuning.tempo * this.tempoMod;
    const now = ctx.currentTime;
    const level = (0.05 + 0.05 * this.heart.warm) * this.tuning.pad;

    for (const s of steps) {
      const freq = mtof(this.rootMidi + 12 + lift + this.step(s));
      for (const detune of [-7, 7]) {
        const osc = ctx.createOscillator();
        osc.type = this.heart.warm > 0.55 ? "triangle" : "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = detune + (this.rand() - 0.5) * 4;
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 500 + 2600 * this.heart.bright;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.08 + this.rand() * 0.1;
        lfoGain.gain.value = 250 + 500 * this.heart.bright;
        lfo.connect(lfoGain);
        lfoGain.connect(f.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(level, now + 3);
        g.gain.setValueAtTime(level, now + dur);
        g.gain.linearRampToValueAtTime(0, now + dur + 4);
        osc.connect(f);
        f.connect(g);
        g.connect(this.dry);
        g.connect(this.send);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + dur + 4.2);
        lfo.stop(now + dur + 4.2);
      }
    }
    this.timers.push(setTimeout(() => this.nextChord(index + 1, rarity), (dur - 1) * 1000));
  }

  private intro(rarity: number): void {
    const count = 3 + rarity;
    for (let i = 0; i < count; i++) {
      this.timers.push(setTimeout(() => this.bell(this.step(i * 2) + 12, 0.07 * this.tuning.chimes), 700 + i * 450));
    }
  }

  private tick(): void {
    if (!this.ctx || !this.running) return;
    const density = (0.05 + 0.8 * this.top.sparkle) * this.tuning.chimeDensity;
    if (this.rand() < density * 0.3) {
      this.bell(this.step(Math.floor(this.rand() * 10)) + 12, (0.05 + 0.04 * this.top.bright) * this.tuning.chimes);
    }
    if (this.top.air > 0.3 && this.rand() < 0.03 * this.top.air * this.tuning.breath) this.breath();
    if (this.base.crackle > 0.25 && this.rand() < this.base.crackle * 0.35 * this.tuning.crackle) this.crackle();
  }

  private bell(stepSemis: number, level: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.dry || !this.send) return;
    const t = ctx.currentTime;
    const freq = mtof(this.rootMidi + 24 + stepSemis);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    const pan = ctx.createStereoPanner();
    pan.pan.value = (this.rand() - 0.5) * 1.4;
    for (const [mult, amp] of [[1, 1], [2.76, 0.3], [5.4, 0.1]] as const) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      og.gain.value = amp;
      osc.connect(og);
      og.connect(g);
      osc.start(t);
      osc.stop(t + 3);
    }
    g.connect(pan);
    pan.connect(this.dry);
    pan.connect(this.send);
  }

  private breath(): void {
    const ctx = this.ctx;
    if (!ctx || !this.pinkNoise || !this.send) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.pinkNoise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800 + this.rand() * 3000;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime((0.05 * this.top.air + 0.01) * this.tuning.breath, t + 1.6);
    g.gain.linearRampToValueAtTime(0, t + 4);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.send);
    src.start(t, this.rand() * 1.5);
    src.stop(t + 4.1);
  }

  private crackle(): void {
    const ctx = this.ctx;
    if (!ctx || !this.whiteNoise || !this.dry) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteNoise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500 + this.rand() * 2500;
    const g = ctx.createGain();
    const peak = 0.04 + this.rand() * 0.08;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02 + this.rand() * 0.05);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.dry);
    src.start(t, this.rand() * 1.5);
    src.stop(t + 0.1);
  }

  private noiseBuffer(ctx: AudioContext, seconds: number, type: "white" | "pink" | "brown"): AudioBuffer {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    
    if (type === "white") {
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < ch.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        ch[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      let lastOut = 0;
      for (let i = 0; i < ch.length; i++) {
        const white = Math.random() * 2 - 1;
        ch[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = ch[i];
        ch[i] *= 3.5;
      }
    }
    return buf;
  }

  private impulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    return buf;
  }
}

let active: ScentSoundEngine | null = null;
let globalTuning: Partial<Tuning> = {};

export function setGlobalTuning(next: Partial<Tuning>): void {
  globalTuning = { ...globalTuning, ...next };
}

export function getActiveEngine(): ScentSoundEngine | null {
  return active;
}

export async function playScent(input: ScentSoundInput, tuning: Partial<Tuning> = {}, ambient?: Partial<AmbientContext>): Promise<ScentSoundEngine> {
  active?.stop(0.6);
  const engine = new ScentSoundEngine(input, { ...globalTuning, ...tuning }, ambient);
  active = engine;
  await engine.start();
  return engine;
}

export function stopScent(): void {
  active?.stop();
  active = null;
}
