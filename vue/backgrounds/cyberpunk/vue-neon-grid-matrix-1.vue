<template>
  <div class="component-root dark-component overflow-hidden" :style="rootStyle">
    <canvas ref="canvasRef" :style="canvasStyle"></canvas>
    <div class="pointer-events-none absolute inset-0" :style="overlayStyle"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const canvasRef = ref(null);
const primaryColor = ref('#00d9ff');
const secondaryColor = ref('#ff2bd6');
const speed = ref(1);
const density = ref(26);

const animationFrame = ref(0);
const resizeObserver = ref(null);
const ctxRef = ref(null);
const size = ref({ width: 0, height: 0 });
const phase = ref(0);

const rootStyle = computed(() => {
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'transparent'
  };
});

const canvasStyle = computed(() => {
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'block'
  };
});

const overlayStyle = computed(() => {
  return {
    background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.28) 100%)',
    mixBlendMode: 'screen'
  };
});

function hexToRgb(hex) {
  let clean = String(hex || '').replace('#', '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbaString(hex, alpha) {
  const rgb = hexToRgb(hex);
  return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
}

function resizeCanvas() {
  const canvas = canvasRef.value;
  if (!canvas || !canvas.parentElement) return;

  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  size.value = {
    width: rect.width,
    height: rect.height
  };

  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctxRef.value = ctx;
}

function drawGrid(time) {
  const canvas = canvasRef.value;
  const ctx = ctxRef.value;
  if (!canvas || !ctx) return;

  const w = size.value.width;
  const h = size.value.height;
  if (!w || !h) return;

  ctx.fillStyle = 'rgba(13,13,13,1)';
  ctx.fillRect(0, 0, w, h);

  const spacingBase = Math.max(18, density.value);
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.0016 * speed.value);
  const pulse2 = 0.5 + 0.5 * Math.sin(time * 0.0011 * speed.value + 1.2);
  const drift = (time * 0.018 * speed.value) % spacingBase;
  const driftY = (time * 0.012 * speed.value) % spacingBase;
  const blueColor = primaryColor.value;
  const pinkColor = secondaryColor.value;
  const limeColor = '#7dff3c';

  ctx.lineWidth = 1;

  for (let x = -spacingBase; x <= w + spacingBase; x += spacingBase) {
    const linePulse = 0.35 + 0.65 * Math.sin((x * 0.04) + time * 0.0022 * speed.value);
    const alpha = 0.06 + linePulse * 0.16 + pulse * 0.05;

    ctx.beginPath();
    ctx.strokeStyle = rgbaString(blueColor, alpha);
    ctx.moveTo(x + drift, 0);
    ctx.lineTo(x + drift, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = rgbaString(blueColor, alpha * 0.28);
    ctx.lineWidth = 3;
    ctx.moveTo(x + drift, 0);
    ctx.lineTo(x + drift, h);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  for (let y = -spacingBase; y <= h + spacingBase; y += spacingBase) {
    const linePulse = 0.35 + 0.65 * Math.sin((y * 0.045) + time * 0.0018 * speed.value + 0.8);
    const alpha = 0.05 + linePulse * 0.15 + pulse2 * 0.05;

    ctx.beginPath();
    ctx.strokeStyle = rgbaString(pinkColor, alpha);
    ctx.moveTo(0, y + driftY);
    ctx.lineTo(w, y + driftY);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = rgbaString(pinkColor, alpha * 0.24);
    ctx.lineWidth = 3;
    ctx.moveTo(0, y + driftY);
    ctx.lineTo(w, y + driftY);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  const accentEvery = Math.max(3, Math.round(110 / spacingBase));
  let xi = 0;
  for (let x = -spacingBase; x <= w + spacingBase; x += spacingBase) {
    let yi = 0;
    for (let y = -spacingBase; y <= h + spacingBase; y += spacingBase) {
      if ((xi + yi) % accentEvery === 0) {
        const px = x + drift;
        const py = y + driftY;
        const glow = 0.3 + 0.7 * Math.sin(time * 0.003 * speed.value + (xi * 0.7) + (yi * 0.45));
        const radius = 1.1 + glow * 1.8;

        ctx.beginPath();
        ctx.fillStyle = rgbaString(limeColor, 0.18 + glow * 0.22);
        ctx.arc(px, py, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = rgbaString(limeColor, 0.65 + glow * 0.25);
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      yi += 1;
    }
    xi += 1;
  }

  const sweepX = ((time * 0.08 * speed.value) % (w + 220)) - 110;
  const sweepY = ((time * 0.05 * speed.value) % (h + 220)) - 110;

  const gradV = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
  gradV.addColorStop(0, 'rgba(0,0,0,0)');
  gradV.addColorStop(0.5, rgbaString(blueColor, 0.08 + pulse * 0.08));
  gradV.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradV;
  ctx.fillRect(sweepX - 80, 0, 160, h);

  const gradH = ctx.createLinearGradient(0, sweepY - 60, 0, sweepY + 60);
  gradH.addColorStop(0, 'rgba(0,0,0,0)');
  gradH.addColorStop(0.5, rgbaString(pinkColor, 0.06 + pulse2 * 0.07));
  gradH.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradH;
  ctx.fillRect(0, sweepY - 60, w, 120);

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function animate(time) {
  phase.value = time;
  drawGrid(time);
  animationFrame.value = requestAnimationFrame(animate);
}

onMounted(() => {
  window.__paramSetters = window.__paramSetters || {};
  window.__paramSetters['primaryColor'] = (v) => { primaryColor.value = v; };
  window.__paramSetters['secondaryColor'] = (v) => { secondaryColor.value = v; };
  window.__paramSetters['speed'] = (v) => { speed.value = Number(v); };
  window.__paramSetters['density'] = (v) => { density.value = Number(v); };

  resizeCanvas();

  if (canvasRef.value && canvasRef.value.parentElement) {
    resizeObserver.value = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.value.observe(canvasRef.value.parentElement);
  }

  animationFrame.value = requestAnimationFrame(animate);
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});

watch(primaryColor, (v) => {
  document.documentElement.style.setProperty('--primary', v);
}, { immediate: true });

watch(secondaryColor, (v) => {
  document.documentElement.style.setProperty('--secondary', v);
}, { immediate: true });

watch([speed, density], () => {
  if (density.value < 12) density.value = 12;
  if (density.value > 80) density.value = 80;
  if (speed.value < 0.1) speed.value = 0.1;
});
</script>

<style scoped>
.component-root {
  width: 100%;
  height: 100%;
  background: transparent;
}

.dark-component {
  background: transparent;
}

.component-root::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 217, 255, 0.03) 0%, rgba(0, 0, 0, 0) 18%, rgba(255, 43, 214, 0.03) 50%, rgba(0, 0, 0, 0) 82%, rgba(125, 255, 60, 0.03) 100%);
  animation: cyberShimmer 8s linear infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}

@keyframes cyberShimmer {
  0% {
    opacity: 0.35;
    transform: translateX(-2%);
  }
  50% {
    opacity: 0.55;
    transform: translateX(2%);
  }
  100% {
    opacity: 0.35;
    transform: translateX(-2%);
  }
}
</style>