// Web Audio API Synthesizer Chime for Medicine Alarm
let audioCtx: AudioContext | null = null;
let intervalId: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSingleBeep(freq: number, duration: number = 0.2, startTimeOffset: number = 0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTimeOffset + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTimeOffset);
    osc.stop(ctx.currentTime + startTimeOffset + duration);
  } catch (err) {
    console.warn('Audio chime warning:', err);
  }
}

export function playAlarmChime() {
  stopAlarmChime();

  const playChord = () => {
    // 3-tone pleasant medical chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    playSingleBeep(523.25, 0.25, 0);
    playSingleBeep(659.25, 0.25, 0.15);
    playSingleBeep(783.99, 0.35, 0.3);
  };

  playChord();
  intervalId = setInterval(playChord, 2500);
}

export function stopAlarmChime() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
