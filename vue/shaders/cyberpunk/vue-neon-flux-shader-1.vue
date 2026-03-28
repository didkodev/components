<template>
  <div class="component-root dark-component w-full h-full flex items-center justify-center overflow-visible bg-transparent">
    <div
      ref="cardRef"
      class="relative w-[min(88vw,720px)] h-[min(62vh,420px)] rounded-none overflow-hidden"
      :style="cardShellStyle"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
      @mousemove="handleMove"
    >
      <canvas ref="canvasRef" class="absolute inset-0 w-full h-full block"></canvas>

      <div class="absolute inset-0 pointer-events-none" :style="overlayGridStyle"></div>
      <div class="absolute inset-0 pointer-events-none" :style="scanlineStyle"></div>
      <div class="absolute inset-0 pointer-events-none" :style="glowFrameStyle"></div>

      <div class="relative z-10 h-full w-full flex flex-col justify-between p-6 md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-[10px] tracking-[0.45em] uppercase opacity-80 mb-3" :style="eyebrowStyle">Didko.dev // Shader Card</div>
            <h2 class="text-2xl md:text-4xl font-semibold leading-tight max-w-[12ch]" :style="titleStyle">
              {{ title }}
            </h2>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="text-[10px] uppercase tracking-[0.28em]" :style="badgeStyle">LIVE</div>
            <div class="text-[10px] uppercase tracking-[0.24em] opacity-70" :style="subtleTextStyle">WebGL Feel</div>
          </div>
        </div>

        <div class="flex items-end justify-between gap-6">
          <div class="max-w-[420px]">
            <p class="text-sm md:text-base leading-relaxed opacity-90" :style="descriptionStyle">
              {{ description }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span v-for="tag in tags" :key="tag" class="text-[10px] uppercase tracking-[0.18em] px-3 py-1" :style="tagStyle">
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="shrink-0">
            <button type="button" class="px-4 py-2 text-xs uppercase tracking-[0.24em] transition-all duration-300" :style="buttonStyle">
              Open Preview
            </button>
          </div>
        </div>
      </div>

      <div class="absolute -top-px left-6 right-6 h-px pointer-events-none" :style="topAccentLineStyle"></div>
      <div class="absolute top-6 bottom-6 -right-px w-px pointer-events-none" :style="sideAccentLineStyle"></div>
      <div class="absolute bottom-5 left-5 w-16 h-16 pointer-events-none" :style="cornerStyleA"></div>
      <div class="absolute top-5 right-5 w-16 h-16 pointer-events-none" :style="cornerStyleB"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const primaryColor = ref('#00eaff');
const secondaryColor = ref('#ff2bd6');
const speed = ref(1);
const intensity = ref(1.15);
const title = ref('Cyber Signal');
const description = ref('A reactive neon shader panel for Didko.dev dashboards, blending magenta, cyan, and acid accents into a clean hover-driven cyberpunk surface.');

const canvasRef = ref(null);
const cardRef = ref(null);
const isHovering = ref(true);
const hoverPower = ref(0);
const pointerX = ref(0.5);
const pointerY = ref(0.5);

const tags = ref(['cyberpunk', 'neon', 'shader', 'dashboard']);

let ctx = null;
let animationId = 0;
let resizeObserver = null;
let startTime = 0;
let width = 0;
let height = 0;
let dpr = 1;

const acidColor = ref('#a6ff00');

onMounted(() => {
  window.__paramSetters = window.__paramSetters || {};
  window.__paramSetters['primaryColor'] = (v) => { primaryColor.value = v; };
  window.__paramSetters['secondaryColor'] = (v) => { secondaryColor.value = v; };
  window.__paramSetters['speed'] = (v) => { speed.value = Number(v); };
  window.__paramSetters['intensity'] = (v) => { intensity.value = Number(v); };
  window.__paramSetters['title'] = (v) => { title.value = v; };
  window.__paramSetters['description'] = (v) => { description.value = v; };

  setupCanvas();
  animate();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (resizeObserver) resizeObserver.disconnect();
});

watch(primaryColor, (v) => {
  document.documentElement.style.setProperty('--primary', v);
}, { immediate: true });

watch(secondaryColor, (v) => {
  document.documentElement.style.setProperty('--secondary', v);
}, { immediate: true });

watch(acidColor, (v) => {
  document.documentElement.style.setProperty('--acid', v);
}, { immediate: true });

const rootShadow = computed(() => {
  return '0 0 0 1px rgba(255,255,255,0.04), 0 0 24px rgba(0,0,0,0.48), 0 0 60px rgba(0,0,0,0.36)';
});

const cardShellStyle = computed(() => {
  const border = '1px solid rgba(255,255,255,0.08)';
  const glowA = '0 0 28px rgba(0,234,255,0.12)';
  const glowB = '0 0 42px rgba(255,43,214,0.1)';
  const bg = 'linear-gradient(135deg, rgba(8,8,10,0.92), rgba(13,13,18,0.88))';
  const clip = 'polygon(0 18px, 18px 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)';
  const tiltX = String((pointerY.value - 0.5) * -6);
  const tiltY = String((pointerX.value - 0.5) * 8);
  const scale = isHovering.value ? '1.01' : '1';
  const transformValue = 'perspective(1200px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(' + scale + ')';
  return {
    background: bg,
    border: border,
    boxShadow: rootShadow.value + ', ' + glowA + ', ' + glowB,
    clipPath: clip,
    transform: transformValue,
    transition: 'transform 220ms ease, box-shadow 260ms ease, border-color 260ms ease',
    transformStyle: 'preserve-3d'
  };
});

const titleStyle = computed(() => {
  return {
    color: '#eef7ff',
    textShadow: '0 0 10px rgba(255,255,255,0.08), 0 0 20px rgba(255,43,214,0.12)'
  };
});

const descriptionStyle = computed(() => {
  return {
    color: 'rgba(222,232,255,0.84)'
  };
});

const subtleTextStyle = computed(() => {
  return {
    color: 'rgba(180,205,255,0.6)'
  };
});

const eyebrowStyle = computed(() => {
  return {
    color: primaryColor.value
  };
});

const badgeStyle = computed(() => {
  return {
    color: secondaryColor.value,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 10px',
    background: 'rgba(13,13,13,0.34)',
    boxShadow: '0 0 18px rgba(255,43,214,0.16)'
  };
});

const tagStyle = computed(() => {
  return {
    color: primaryColor.value,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    boxShadow: 'inset 0 0 14px rgba(0,234,255,0.06)'
  };
});

const buttonStyle = computed(() => {
  const glow = isHovering.value ? '0 0 16px rgba(0,234,255,0.2), inset 0 0 16px rgba(255,43,214,0.08)' : '0 0 0 rgba(0,0,0,0)';
  return {
    color: '#eff8ff',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(135deg, rgba(0,234,255,0.08), rgba(255,43,214,0.08))',
    boxShadow: glow,
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
  };
});

const overlayGridStyle = computed(() => {
  const alpha = isHovering.value ? '0.16' : '0.1';
  return {
    backgroundImage: 'linear-gradient(rgba(255,255,255,' + alpha + ') 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,' + alpha + ') 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    mixBlendMode: 'screen',
    opacity: '0.32',
    animation: 'gridShift 10s linear infinite'
  };
});

const scanlineStyle = computed(() => {
  return {
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0.02) 100%)',
    backgroundSize: '100% 6px',
    opacity: isHovering.value ? '0.18' : '0.12',
    mixBlendMode: 'soft-light',
    animation: 'scanMove 8s linear infinite'
  };
});

const glowFrameStyle = computed(() => {
  const glow = 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 30px rgba(0,234,255,0.08), inset 0 0 50px rgba(255,43,214,0.06)';
  const opacityValue = isHovering.value ? '1' : '0.84';
  return {
    boxShadow: glow,
    opacity: opacityValue
  };
});

const topAccentLineStyle = computed(() => {
  return {
    background: 'linear-gradient(90deg, transparent, ' + primaryColor.value + ', ' + secondaryColor.value + ', transparent)',
    boxShadow: '0 0 18px ' + primaryColor.value
  };
});

const sideAccentLineStyle = computed(() => {
  return {
    background: 'linear-gradient(180deg, transparent, ' + secondaryColor.value + ', ' + acidColor.value + ', transparent)',
    boxShadow: '0 0 18px ' + secondaryColor.value
  };
});

const cornerStyleA = computed(() => {
  return {
    borderLeft: '2px solid ' + primaryColor.value,
    borderBottom: '2px solid ' + primaryColor.value,
    boxShadow: '0 0 12px rgba(0,234,255,0.22)'
  };
});

const cornerStyleB = computed(() => {
  return {
    borderTop: '2px solid ' + secondaryColor.value,
    borderRight: '2px solid ' + secondaryColor.value,
    boxShadow: '0 0 12px rgba(255,43,214,0.22)'
  };
});

function handleMove(event) {
  const el = cardRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  pointerX.value = Math.max(0, Math.min(1, x));
  pointerY.value = Math.max(0, Math.min(1, y));
}

function setupCanvas() {
  const canvas = canvasRef.value;
  const host = cardRef.value;
  if (!canvas || !host) return;

  ctx = canvas.getContext('2d');

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });

  if (host.parentElement) {
    resizeObserver.observe(host.parentElement);
  }
  resizeObserver.observe(host);
  resizeCanvas();
}

function resizeCanvas() {
  const canvas = canvasRef.value;
  const host = cardRef.value;
  if (!canvas || !host) return;

  const rect = host.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = String(width) + 'px';
  canvas.style.height = String(height) + 'px';

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function hexToRgb(hex) {
  let value = hex.replace('#', '');
  if (value.length === 3) {
    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
  }
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbaFromHex(hex, alpha) {
  const c = hexToRgb(hex);
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
}

function drawBackground(t) {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(13,13,13,1)';
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, 'rgba(8,8,12,1)');
  grad.addColorStop(1, 'rgba(14,14,18,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  drawPlasma(t);
  drawVeins(t);
  drawPulseCore(t);
  drawNoiseRidges(t);
  drawHudHighlights(t);
  vignette();
}

function drawPlasma(t) {
  const cell = 18;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const hoverMix = 0.3 + hoverPower.value * 0.9;
  const px = pointerX.value * width;
  const py = pointerY.value * height;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cx = x * cell + cell * 0.5;
      const cy = y * cell + cell * 0.5;

      const nx = cx / width;
      const ny = cy / height;

      const waveA = Math.sin(nx * 8 + t * 1.4) * 0.5 + 0.5;
      const waveB = Math.sin(ny * 10 - t * 1.2) * 0.5 + 0.5;
      const waveC = Math.sin((nx + ny) * 12 + t * 1.8) * 0.5 + 0.5;

      const dx = cx - px;
      const dy = cy - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pointerGlow = Math.max(0, 1 - dist / (Math.min(width, height) * 0.55));

      const energy = (waveA * 0.35 + waveB * 0.3 + waveC * 0.35) * (0.6 + pointerGlow * hoverMix);
      const alpha = Math.max(0, energy - 0.42) * 0.22 * intensity.value;

      if (alpha > 0.004) {
        const mixSelector = Math.sin(nx * 16 - ny * 11 + t * 2.2);
        if (mixSelector > 0.25) {
          ctx.fillStyle = rgbaFromHex(primaryColor.value, alpha);
        } else if (mixSelector < -0.2) {
          ctx.fillStyle = rgbaFromHex(secondaryColor.value, alpha);
        } else {
          ctx.fillStyle = rgbaFromHex(acidColor.value, alpha * 0.9);
        }
        ctx.fillRect(x * cell, y * cell, cell + 1, cell + 1);
      }
    }
  }
}

function drawVeins(t) {
  const lineCount = 8;
  const amp = 18 + hoverPower.value * 18;
  ctx.lineWidth = 1.2;
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < lineCount; i += 1) {
    const yBase = (height / (lineCount + 1)) * (i + 1);
    const offset = i * 0.7;

    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const nx = x / width;
      const py = Math.sin(nx * 10 + t * 1.8 + offset) * amp;
      const py2 = Math.sin(nx * 24 - t * 1.1 + offset * 2) * amp * 0.25;
      const y = yBase + py + py2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const strokeColor = i % 2 === 0 ? primaryColor.value : secondaryColor.value;
    ctx.strokeStyle = rgbaFromHex(strokeColor, 0.12 + hoverPower.value * 0.07);
    ctx.shadowBlur = 14 + hoverPower.value * 10;
    ctx.shadowColor = strokeColor;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
}

function drawPulseCore(t) {
  const x = width * (0.22 + pointerX.value * 0.56);
  const y = height * (0.24 + pointerY.value * 0.52);
  const pulse = 40 + Math.sin(t * 2.8) * 8 + hoverPower.value * 18;

  const grad1 = ctx.createRadialGradient(x, y, 0, x, y, pulse * 2.6);
  grad1.addColorStop(0, rgbaFromHex(secondaryColor.value, 0.22 * intensity.value));
  grad1.addColorStop(0.45, rgbaFromHex(primaryColor.value, 0.14 * intensity.value));
  grad1.addColorStop(0.72, rgbaFromHex(acidColor.value, 0.07 * intensity.value));
  grad1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  const grad2 = ctx.createRadialGradient(width * 0.82, height * 0.72, 0, width * 0.82, height * 0.72, pulse * 2.1);
  grad2.addColorStop(0, rgbaFromHex(primaryColor.value, 0.18 * intensity.value));
  grad2.addColorStop(0.55, rgbaFromHex(secondaryColor.value, 0.08 * intensity.value));
  grad2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, width, height);
}

function drawNoiseRidges(t) {
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 14) {
    const alpha = 0.02 + ((Math.sin(y * 0.08 + t * 3) * 0.5 + 0.5) * 0.03);
    ctx.strokeStyle = rgbaFromHex(acidColor.value, alpha);
    ctx.beginPath();
    for (let x = 0; x <= width; x += 12) {
      const offset = Math.sin(x * 0.032 + y * 0.02 + t * 1.6) * 3;
      const yy = y + offset;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawHudHighlights(t) {
  const sweepX = (t * 120 * speed.value) % (width + 180) - 90;
  const sweep = ctx.createLinearGradient(sweepX - 90, 0, sweepX + 90, 0);
  sweep.addColorStop(0, 'rgba(255,255,255,0)');
  sweep.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  sweep.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  ctx.strokeStyle = rgbaFromHex(primaryColor.value, 0.18);
  ctx.beginPath();
  ctx.moveTo(24, height - 42);
  ctx.lineTo(120, height - 42);
  ctx.lineTo(136, height - 58);
  ctx.stroke();

  ctx.strokeStyle = rgbaFromHex(secondaryColor.value, 0.18);
  ctx.beginPath();
  ctx.moveTo(width - 24, 42);
  ctx.lineTo(width - 120, 42);
  ctx.lineTo(width - 136, 58);
  ctx.stroke();
}

function vignette() {
  const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function animate(now) {
  if (!startTime) startTime = now || performance.now();
  const elapsed = ((now || performance.now()) - startTime) / 1000;
  const t = elapsed * Math.max(0.2, speed.value);

  hoverPower.value += ((isHovering.value ? 1 : 0) - hoverPower.value) * 0.08;

  drawBackground(t);

  animationId = requestAnimationFrame(animate);
}
</script>

<style scoped>
.component-root.dark-component {
  background: transparent;
}

@keyframes gridShift {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(36px, 36px, 0);
  }
}

@keyframes scanMove {
  0% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(12px);
  }
}
</style>