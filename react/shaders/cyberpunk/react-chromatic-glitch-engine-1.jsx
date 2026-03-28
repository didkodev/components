function CyberpunkLoader() {
  const [primaryColor, setPrimaryColor] = React.useState('#00F0FF');
  const [secondaryColor, setSecondaryColor] = React.useState('#FF00FF');
  const [speed, setSpeed] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const stateRef = React.useRef({
    bars: [
      { y: 0, color: '#00F0FF', label: 'COMPILING SHADERS', progress: 0, glitchOffset: 0, flickerPhase: 0, scanPhase: 0 },
      { y: 0, color: '#FF00FF', label: 'STREAMING DATA', progress: 0, glitchOffset: 0, flickerPhase: 1.2, scanPhase: 0.7 },
      { y: 0, color: '#00FF41', label: 'LOADING ASSETS', progress: 0, glitchOffset: 0, flickerPhase: 2.4, scanPhase: 1.4 }
    ],
    time: 0,
    glitchBlocks: []
  });

  const propsRef = React.useRef({ primaryColor, secondaryColor, speed, intensity });

  React.useEffect(() => {
    propsRef.current = { primaryColor, secondaryColor, speed, intensity };
  }, [primaryColor, secondaryColor, speed, intensity]);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['secondaryColor'] = setSecondaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
    window.__paramSetters['intensity'] = (v) => setIntensity(Number(v));
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    });
    resizeObserver.observe(canvas.parentElement);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const drawBar = (ctx, x, y, w, h, color, progress, glitchOffset, flicker, label, scanPhase, time, intensity) => {
      const rgb = hexToRgb(color);
      const alpha = flicker;

      ctx.save();

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * intensity;

      // Background track
      ctx.fillStyle = 'rgba(10,14,39,0.9)';
      ctx.fillRect(x, y, w, h);

      // Track border
      ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.3 * alpha) + ')';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Filled progress
      const fillW = w * progress;
      if (fillW > 0) {
        const grad = ctx.createLinearGradient(x, y, x + fillW, y);
        grad.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.15 * alpha) + ')');
        grad.addColorStop(0.7, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.4 * alpha) + ')');
        grad.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.9 * alpha) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, fillW, h);
      }

      // Scan line moving across bar
      const scanX = x + (w * ((Math.sin(time * 1.5 + scanPhase) * 0.5 + 0.5)));
      const scanGrad = ctx.createLinearGradient(scanX - 20, y, scanX + 20, y);
      scanGrad.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
      scanGrad.addColorStop(0.5, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.8 * alpha) + ')');
      scanGrad.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(scanX - 20, y, 40, h);

      // Horizontal glitch lines
      const numLines = Math.floor(4 + intensity * 2);
      for (let i = 0; i < numLines; i++) {
        const lineY = y + (h / numLines) * i + (h / numLines) * 0.5;
        const lineAlpha = (Math.sin(time * 3 + i * 1.7 + scanPhase) * 0.3 + 0.5) * alpha * 0.6;
        ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + lineAlpha + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + glitchOffset, lineY);
        ctx.lineTo(x + fillW + glitchOffset, lineY);
        ctx.stroke();
      }

      // Top edge bright line
      ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.9 * alpha) + ')';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8 * intensity;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + fillW, y);
      ctx.stroke();

      // Corner brackets
      const bSize = 6;
      ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.8 * alpha) + ')';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      // TL
      ctx.beginPath(); ctx.moveTo(x, y + bSize); ctx.lineTo(x, y); ctx.lineTo(x + bSize, y); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(x + w - bSize, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bSize); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(x, y + h - bSize); ctx.lineTo(x, y + h); ctx.lineTo(x + bSize, y + h); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(x + w - bSize, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bSize); ctx.stroke();

      ctx.shadowBlur = 0;

      // Label text
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.7 * alpha) + ')';
      ctx.fillText(label, x + 2, y - 4);

      // Percentage
      const pct = Math.floor(progress * 100);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.9 * alpha) + ')';
      ctx.fillText(pct + '%', x + w - 28, y - 4);

      // CRT color fringe
      if (intensity > 0.5) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255,0,0,0.04)';
        ctx.fillRect(x + 1, y, fillW, h);
        ctx.fillStyle = 'rgba(0,0,255,0.04)';
        ctx.fillRect(x - 1, y, fillW, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();
    };

    const drawGlitchBlock = (ctx, block) => {
      ctx.save();
      ctx.globalAlpha = block.alpha;
      ctx.fillStyle = block.color;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.restore();
    };

    const spawnGlitchBlock = (w, h, bars) => {
      const bar = bars[Math.floor(Math.random() * bars.length)];
      const bx = w * 0.1 + Math.random() * w * 0.8 * Math.random();
      return {
        x: bx,
        y: bar.y + Math.random() * 14,
        w: 20 + Math.random() * 60,
        h: 2 + Math.random() * 6,
        color: bar.color,
        alpha: 0.15 + Math.random() * 0.25,
        life: 0,
        maxLife: 0.08 + Math.random() * 0.12
      };
    };

    let lastTime = 0;
    const animate = (timestamp) => {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      const { speed: spd, intensity: inten, primaryColor: pc, secondaryColor: sc } = propsRef.current;
      const state = stateRef.current;
      state.time += dt * spd;

      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#0A0E27';
      ctx.fillRect(0, 0, W, H);

      // Scanline overlay
      for (let ly = 0; ly < H; ly += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, ly, W, 1);
      }

      const barH = 14;
      const barW = W * 0.8;
      const barX = W * 0.1;
      const totalH = 3 * barH + 2 * 22;
      const startY = (H - totalH) / 2 + 10;

      // Update bar colors from params
      state.bars[0].color = pc;
      state.bars[1].color = sc;

      state.bars.forEach((bar, i) => {
        bar.y = startY + i * (barH + 22);
        bar.progress = (bar.progress + dt * spd * (0.12 + i * 0.04)) % 1;
        const flickerT = state.time * (1.5 + i * 0.3) + bar.flickerPhase;
        bar.flicker = 0.65 + 0.35 * Math.abs(Math.sin(flickerT * 3.14));
        if (Math.random() < 0.03 * spd * inten) {
          bar.glitchOffset = (Math.random() - 0.5) * 8 * inten;
        } else {
          bar.glitchOffset *= 0.85;
        }
      });

      // Spawn glitch blocks
      if (Math.random() < 0.15 * spd * inten) {
        state.glitchBlocks.push(spawnGlitchBlock(W, H, state.bars));
      }

      // Update and draw glitch blocks
      state.glitchBlocks = state.glitchBlocks.filter(b => {
        b.life += dt * spd;
        b.alpha *= 0.85;
        if (b.life < b.maxLife) {
          drawGlitchBlock(ctx, b);
          return true;
        }
        return false;
      });

      // Draw bars
      state.bars.forEach((bar) => {
        drawBar(ctx, barX, bar.y, barW, barH, bar.color, bar.progress, bar.glitchOffset, bar.flicker, bar.label, bar.scanPhase, state.time, inten);
      });

      // Status text
      ctx.save();
      const statusAlpha = 0.4 + 0.3 * Math.sin(state.time * 2.5);
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(0,240,255,' + statusAlpha + ')';
      ctx.textAlign = 'center';
      const dots = '.'.repeat((Math.floor(state.time * 2) % 3) + 1);
      ctx.fillText('PROCESSING' + dots, W / 2, startY + 3 * barH + 2 * 22 + 18);
      ctx.textAlign = 'left';
      ctx.restore();

      // Vignette
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="component-root dark-component" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: 'transparent' }}>
      <style>{
        '@keyframes flicker{0%,100%{opacity:1}50%{opacity:0.85}}'
      }</style>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, display: 'block' }}
      />
    </div>
  );
}
export default CyberpunkLoader;