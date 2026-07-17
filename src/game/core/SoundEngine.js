const DEFAULT_VOLUMES = Object.freeze({ master: 1, voice: 1, music: 1, sfx: 1 });
const MUSIC_FADE_TICK_MS = 50;

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
    this.pendingMusicOptions = null;
    this.outgoingMusic = null;
    this.musicFade = null;
    this.musicFadeTimer = null;
    this.musicDucked = false;
    this.paused = false;
    this.musicRequestId = 0;
    this.playbackGeneration = 0;
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
    if (this.outgoingMusic) this.outgoingMusic.muted = this.muted;
    if (this.voice) this.voice.muted = this.muted;
    this.applyMusicMix();
  }

  setVolumes(volumes) {
    this.volumes = { ...this.volumes, ...volumes };
    this.applyMusicMix();
    if (this.voice) this.voice.volume = this.effectiveVolume('voice');
  }

  effectiveVolume(channel) {
    if (this.muted) return 0;
    return Math.max(0, Math.min(1, this.volumes.master * this.volumes[channel]));
  }

  playSfx(key, fallback = 'chime', options = {}) {
    if (fallback && typeof fallback === 'object') {
      options = fallback;
      fallback = 'chime';
    }
    const pan = normalizePan(options?.pan);
    this.eventLog.push(pan === 0 ? { type: 'sfx', key } : { type: 'sfx', key, pan });
    const path = this.resolveAsset(key);
    if (path && typeof Audio !== 'undefined') {
      const audio = new Audio(path);
      audio.volume = this.effectiveVolume('sfx');
      this.connectPannedAudio(audio, pan);
      audio.play().catch(() => this.synth(fallback, { pan }));
      return audio;
    }
    this.synth(fallback, { pan });
    return null;
  }

  connectPannedAudio(audio, pan = 0) {
    if (
      pan === 0
      || !this.context
      || this.context.state !== 'running'
      || typeof this.context.createMediaElementSource !== 'function'
      || typeof this.context.createStereoPanner !== 'function'
    ) return null;
    try {
      const source = this.context.createMediaElementSource(audio);
      const panner = this.context.createStereoPanner();
      panner.pan.value = pan;
      source.connect(panner).connect(this.context.destination);
      return { source, panner };
    } catch {
      return null;
    }
  }

  synth(kind = 'chime', { pan = 0 } = {}) {
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
    const normalizedPan = normalizePan(pan);
    const panner = normalizedPan !== 0 && typeof this.context.createStereoPanner === 'function'
      ? this.context.createStereoPanner()
      : null;
    if (panner) {
      panner.pan.value = normalizedPan;
      panner.connect(this.context.destination);
    }
    for (const [frequency, duration, type] of recipes[kind] ?? recipes.chime) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.effectiveVolume('sfx') * 0.08), now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      oscillator.connect(gain).connect(panner ?? this.context.destination);
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

  async playMusic(key, options = {}) {
    if (this.musicKey === key) {
      this.musicRequestId += 1;
      this.pendingMusic = null;
      this.pendingMusicOptions = null;
      return;
    }
    const path = this.resolveAsset(key);
    if (!path || typeof Audio === 'undefined') return;
    const requestId = ++this.musicRequestId;
    const mode = options?.mode ?? 'replace';
    const requestedFadeSeconds = Number(options?.fadeSeconds);
    const fadeSeconds = Number.isFinite(requestedFadeSeconds) ? Math.max(0, requestedFadeSeconds) : 0;
    const next = new Audio(path);
    next.loop = true;
    next.preload = 'auto';
    next.muted = this.muted;
    const shouldCrossfade = mode === 'crossfade' && fadeSeconds > 0 && Boolean(this.music);
    next.volume = shouldCrossfade ? 0 : this.musicTargetVolume();
    try {
      await next.play();
    } catch {
      this.releaseAudio(next);
      if (requestId === this.musicRequestId) {
        this.pendingMusic = key;
        this.pendingMusicOptions = { ...options };
      }
      return;
    }

    if (requestId !== this.musicRequestId) {
      this.releaseAudio(next);
      return;
    }

    const previous = this.music;
    this.cancelMusicFade();
    this.music = next;
    this.musicKey = key;
    this.pendingMusic = null;
    this.pendingMusicOptions = null;

    if (shouldCrossfade && previous) {
      this.startMusicFade(previous, next, fadeSeconds * 1000);
    } else {
      this.releaseAudio(previous);
      this.applyMusicMix();
    }

    if (this.paused) {
      this.pauseAudio(next);
      this.pauseMusicFade();
    }
  }

  stopMusic() {
    this.musicRequestId += 1;
    this.playbackGeneration += 1;
    this.cancelMusicFade();
    this.releaseAudio(this.music);
    this.music = null;
    this.musicKey = null;
    this.pendingMusic = null;
    this.pendingMusicOptions = null;
  }

  duckMusic(ducked) {
    this.musicDucked = Boolean(ducked);
    this.applyMusicMix();
  }

  pause() {
    this.paused = true;
    this.playbackGeneration += 1;
    this.pauseMusicFade();
    this.music?.pause();
    this.outgoingMusic?.pause();
    this.voice?.pause();
  }

  async resume() {
    const generation = ++this.playbackGeneration;
    this.paused = false;
    if (this.context && this.context.state !== 'running') {
      try {
        await this.context.resume();
      } catch {
        // A later user gesture can retry the context without disrupting HTML audio.
      }
      if (!this.resumeIsCurrent(generation)) {
        this.settleStaleResume();
        return;
      }
    }

    const outgoing = this.outgoingMusic;
    if (outgoing) {
      await this.tryPlayAudio(outgoing);
      if (!this.resumeIsCurrent(generation)) {
        this.settleStaleResume(outgoing);
        return;
      }
    }

    const current = this.music;
    if (current) {
      await this.tryPlayAudio(current);
      if (!this.resumeIsCurrent(generation)) {
        this.settleStaleResume(current);
        return;
      }
    }

    if (this.pendingMusic) {
      await this.playMusic(this.pendingMusic, this.pendingMusicOptions ?? {});
      if (!this.resumeIsCurrent(generation)) {
        this.settleStaleResume(this.music);
        return;
      }
    }
    this.resumeMusicFade();
  }

  resumeIsCurrent(generation) {
    return generation === this.playbackGeneration && !this.paused;
  }

  settleStaleResume(completedAudio = null) {
    const completedIsTracked = completedAudio === this.music || completedAudio === this.outgoingMusic;
    if (this.paused) {
      this.pauseMusicFade();
      this.pauseAudio(this.music);
      this.pauseAudio(this.outgoingMusic);
    }
    if (completedAudio && !completedIsTracked) this.pauseAudio(completedAudio);
  }

  async tryPlayAudio(audio) {
    try {
      await audio.play();
    } catch {
      // The next visibility change or user gesture can retry playback.
    }
  }

  musicTargetVolume() {
    return this.effectiveVolume('music') * (this.musicDucked ? 0.4 : 1);
  }

  applyMusicMix() {
    const targetVolume = this.musicTargetVolume();
    if (this.musicFade) {
      const progress = this.musicFade.progress;
      this.musicFade.incoming.volume = targetVolume * progress;
      this.musicFade.outgoing.volume = targetVolume * (1 - progress);
      return;
    }
    if (this.music) this.music.volume = targetVolume;
  }

  startMusicFade(outgoing, incoming, durationMs) {
    this.outgoingMusic = outgoing;
    outgoing.muted = this.muted;
    this.musicFade = {
      outgoing,
      incoming,
      durationMs,
      elapsedMs: 0,
      startedAt: Date.now(),
      progress: 0,
    };
    this.applyMusicMix();
    this.scheduleMusicFadeTick();
  }

  scheduleMusicFadeTick() {
    if (!this.musicFade || this.musicFade.startedAt === null || this.musicFadeTimer !== null) return;
    const elapsed = this.musicFade.elapsedMs + (Date.now() - this.musicFade.startedAt);
    const remaining = Math.max(0, this.musicFade.durationMs - elapsed);
    this.musicFadeTimer = setTimeout(() => {
      this.musicFadeTimer = null;
      if (this.syncMusicFade()) this.finishMusicFade();
      else this.scheduleMusicFadeTick();
    }, Math.min(MUSIC_FADE_TICK_MS, remaining));
  }

  syncMusicFade() {
    if (!this.musicFade) return false;
    const runningMs = this.musicFade.startedAt === null ? 0 : Date.now() - this.musicFade.startedAt;
    const elapsed = Math.max(0, this.musicFade.elapsedMs + runningMs);
    this.musicFade.progress = Math.min(1, elapsed / this.musicFade.durationMs);
    this.applyMusicMix();
    return this.musicFade.progress >= 1;
  }

  pauseMusicFade() {
    if (!this.musicFade || this.musicFade.startedAt === null) return;
    if (this.syncMusicFade()) {
      this.finishMusicFade();
      return;
    }
    this.musicFade.elapsedMs += Math.max(0, Date.now() - this.musicFade.startedAt);
    this.musicFade.startedAt = null;
    this.clearMusicFadeTimer();
  }

  resumeMusicFade() {
    if (!this.musicFade || this.musicFade.startedAt !== null) return;
    this.musicFade.startedAt = Date.now();
    this.scheduleMusicFadeTick();
  }

  finishMusicFade() {
    if (!this.musicFade) return;
    const outgoing = this.musicFade.outgoing;
    this.clearMusicFadeTimer();
    this.musicFade = null;
    this.outgoingMusic = null;
    this.releaseAudio(outgoing);
    this.applyMusicMix();
  }

  cancelMusicFade() {
    this.clearMusicFadeTimer();
    if (this.outgoingMusic) this.releaseAudio(this.outgoingMusic);
    this.outgoingMusic = null;
    this.musicFade = null;
  }

  clearMusicFadeTimer() {
    if (this.musicFadeTimer === null) return;
    clearTimeout(this.musicFadeTimer);
    this.musicFadeTimer = null;
  }

  pauseAudio(audio) {
    audio?.pause();
  }

  releaseAudio(audio) {
    if (!audio) return;
    this.pauseAudio(audio);
    audio.currentTime = 0;
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

export function normalizePan(value) {
  const pan = Number(value);
  if (!Number.isFinite(pan)) return 0;
  return Math.max(-1, Math.min(1, pan));
}
