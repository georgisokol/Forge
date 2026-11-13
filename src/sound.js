let ctx

// Browsers only allow audio after a user gesture, so call this from the tap that starts a timer.
export function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx ??= new AC()
  if (ctx.state === 'suspended') ctx.resume()
}

function beep(freq, start, duration) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

// Short tick for 3-2-1 countdowns.
export function tick() {
  if (!ctx) return
  beep(880, ctx.currentTime, 0.12)
}

// Three-beep alarm when a timer ends.
export function alarm() {
  navigator.vibrate?.([200, 100, 200, 100, 200])
  if (!ctx) return
  const t = ctx.currentTime
  ;[0, 0.28, 0.56].forEach((d) => beep(1320, t + d, 0.2))
}
