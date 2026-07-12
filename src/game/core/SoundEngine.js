const DEFAULT_VOLUMES = Object.freeze({ master: 1, voice: 1, music: 1, sfx: 1 });

export class SoundEngine {
  constructor({ resolveAsset = () => null, muted = false, volumes = {} } = {}) {
    this.resolveAsset = resolveAsset;
    this.muted = muted;
    this.volumes = { ...DEFAULT_VOLUMES, ...volumes };
    this.context = null;
    this.unlocked = false;
    this.voice = null;
    this.music = null;
    this.musicKey = null;
    this.pendingMusic = null;
    this.eventLog = [];
  }

  async unlock() {
    if (this.unlocked) return true;
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (AudioContextClass) {
      this.context ??= new AudioContextClass();
      if (this.context.state !== 'running') await this.context.resume();
      const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start();
    }
    this.unlocked = true;
    return true;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.music) this.music.muted = this.muted;
    if (this.voice) this.voice.muted = this.muted;
  }

  setVolumes(volumes) {
    this.volumes = { ...this.volumes, ...volumes };
    if (this.music) this.music.volume = this.effectiveVolume('music');
    if (this.voice) this.voice.volume = this.effectiveVolume('voice');
  }

  effectiveVolume(channel) {
    if (this.muted) return 0;
    return Math.max(0, Math.min(1, this.volumes.master * this.volumes[channel]));
  }

  playSfx(key, fallback = 'chime') {
    this.eventLog.push({ type: 'sfx', key });
    const path = this.resolveAsset(key);
    if (path && typeof Audio !== 'undefined') {
      const audio = new Audio(path);
      audio.volume = this.effectiveVolume('sfx');
      audio.play().catch(() => this.synth(fallback));
      return audio;
    }
    this.synth(fallback);
    return null;
  }

  synth(kind = 'chime') {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const recipes = {
      tap: [[440, 0.045, 'sine']],
      chime: [[660, 0.12, 'sine'], [880, 0.18, 'sine']],
      sparkle: [[784, 0.08, 'triangle'], [988, 0.13, 'sine']],
      fizzle: [[190, 0.12, 'sawtooth'], [130, 0.18, 'triangle']],
      rumble: [[75, 0.35, 'sawtooth']],
      flourish: [[523, 0.1, 'sine'], [659, 0.12, 'sine'], [784, 0.22, 'sine']],
    };
    const now = this.context.currentTime;
    let offset = 0;
    for (const [frequency, duration, type] of recipes[kind] ?? recipes.chime) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.effectiveVolume('sfx') * 0.08), now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + duration + 0.02);
      offset += duration * 0.45;
    }
  }

  async speak(key, text = '', { onEnded } = {}) {
    this.stopVoice();
    this.eventLog.push({ type: 'voice', key, text });
    this.duckMusic(true);
    const path = this.resolveAsset(key);
    if (path && typeof Audio !== 'undefined') {
      const voice = new Audio(path);
      this.voice = voice;
      voice.volume = this.effectiveVolume('voice');
      voice.onended = () => {
        if (this.voice === voice) this.voice = null;
        this.duckMusic(false);
        onEnded?.();
      };
      voice.onerror = () => this.speakFallback(text, onEnded);
      try {
        await voice.play();
        return;
      } catch {
        this.speakFallback(text, onEnded);
        return;
      }
    }
    this.speakFallback(text, onEnded);
  }

  speakFallback(text, onEnded) {
    if (!this.muted && text && 'speechSynthesis' in globalThis && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1.03;
      utterance.onend = () => {
        this.duckMusic(false);
        onEnded?.();
      };
      globalThis.speechSynthesis.cancel();
      globalThis.speechSynthesis.speak(utterance);
      return;
    }
    this.synth('chime');
    this.duckMusic(false);
    onEnded?.();
  }

  stopVoice() {
    if (this.voice) {
      this.voice.pause();
      this.voice.currentTime = 0;
      this.voice = null;
    }
    globalThis.speechSynthesis?.cancel?.();
    this.duckMusic(false);
  }

  async playMusic(key) {
    if (this.musicKey === key) return;
    const path = this.resolveAsset(key);
    if (!path || typeof Audio === 'undefined') return;
    const next = new Audio(path);
    next.loop = true;
    next.preload = 'auto';
    next.volume = this.effectiveVolume('music');
    try {
      await next.play();
    } catch {
      this.pendingMusic = key;
      return;
    }
    this.music?.pause();
    this.music = next;
    this.musicKey = key;
    this.pendingMusic = null;
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    this.music = null;
    this.musicKey = null;
    this.pendingMusic = null;
  }

  duckMusic(ducked) {
    if (!this.music) return;
    this.music.volume = this.effectiveVolume('music') * (ducked ? 0.4 : 1);
  }

  pause() {
    this.music?.pause();
    this.voice?.pause();
  }

  async resume() {
    if (this.context && this.context.state !== 'running') await this.context.resume();
    if (this.music) await this.music.play().catch(() => {});
    else if (this.pendingMusic) await this.playMusic(this.pendingMusic);
  }

  stopAll() {
    this.stopVoice();
    this.stopMusic();
    this.eventLog.length = 0;
  }

  destroy() {
    this.stopAll();
    this.context?.close?.();
    this.context = null;
    this.unlocked = false;
  }
}
