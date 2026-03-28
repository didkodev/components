function CyberpunkWaveBackground() {
  const canvasRef = React.useRef(null);
  const animationRef = React.useRef(null);
  const timeRef = React.useRef(0);
  const hoverRef = React.useRef(false);
  const intensityRef = React.useRef(1);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const waves = [
      { color: '#00ffff', glow: '#00ffff', freq: 0.012, amp: 45, speed: 0.018, offset: 0, yBase: 0.25, width: 2.5 },
      { color: '#ff00aa', glow: '#ff00aa', freq: 0.009, amp: 60, speed: 0.014, offset: 2.1, yBase: 0.38, width: 1.8 },
      { color: '#aaff00', glow: '#aaff00', freq: 0.015, amp: 35, speed: 0.022, offset: 4.3, yBase: 0.52, width: 2.0 },
      { color: '#ff00ff', glow: '#ff00ff', freq: 0.011, amp: 50, speed: 0.016, offset: 1.5, yBase: 0.65, width: 1.5 },
      { color: '#00ffff', glow: '#00ffff', freq: 0.008, amp: 70, speed: 0.011, offset: 3.7, yBase: 0.78, width: 3.0 },
      { color: '#ff0066', glow: '#ff0066', freq: 0.014, amp: 40, speed: 0.019, offset: 5.9, yBase: 0.88, width: 1.2 },
    ];

    const scanLines = Array.from({ length: 8 }, (_, i) => ({
      y: Math.random(),
      speed: 0.0002 + Math.random() * 0.0003,
      opacity: 0.03 + Math.random() * 0.05,
    }));

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement);

    const drawWave = (wave, t, w, h, intensity) => {
      const segments = 200;
      const dx = w / segments;
      const glowSize = (8 + intensity * 12) * (wave.width / 2);
      const alpha = 0.7 + intensity * 0.3;

      ctx.shadowBlur = glowSize;
      ctx.shadowColor = wave.glow;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = wave.width + intensity * 1.5;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = i * dx;
        const amp = wave.amp * (1 + intensity * 0.6);
        const y = h * wave.yBase
          + Math.sin(x * wave.freq + t * wave.speed * (1 + intensity * 1.5) + wave.offset) * amp
          + Math.sin(x * wave.freq * 0.5 + t * wave.speed * 0.7 + wave.offset * 1.3) * amp * 0.4
          + Math.sin(x * wave.freq * 2.1 + t * wave.speed * 1.4 + wave.offset * 0.7) * amp * 0.15;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.shadowBlur = glowSize * 2.5;
      ctx.lineWidth = (wave.width + intensity * 1.5) * 0.4;
      ctx.globalAlpha = 0.25 + intensity * 0.2;
      ctx.stroke();
    };

    const drawGrid = (t, w, h, intensity) => {
      const gridSpacing = 80;
      ctx.globalAlpha = 0.04 + intensity * 0.03;
      ctx.strokeStyle = '#00ffff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.5;

      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    const drawScanLines = (t, w, h) => {
      scanLines.forEach(line => {
        line.y = (line.y + line.speed) % 1;
        const y = line.y * h;
        ctx.globalAlpha = line.opacity;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(0, y, w, 1.5);
      });
    };

    const drawVignette = (w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const drawChromatic = (t, w, h, intensity) => {
      if (intensity < 0.3) return;
      const x = Math.sin(t * 0.02) * w * 0.008 * intensity;
      ctx.globalAlpha = 0.04 * intensity;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff00aa';
      ctx.fillRect(x, 0, w, h);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-x, 0, w, h);
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      const target = hoverRef.current ? 1.0 : 0.0;
      intensityRef.current += (target - intensityRef.current) * 0.04;
      const intensity = intensityRef.current;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, w, h);

      drawGrid(timeRef.current, w, h, intensity);
      drawChromatic(timeRef.current, w, h, intensity);

      waves.forEach(wave => {
        drawWave(wave, timeRef.current, w, h, intensity);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      drawScanLines(timeRef.current, w, h);
      drawVignette(w, h);

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, []);

  const handleMouseEnter = () => {
    hoverRef.current = true;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
    setIsHovered(false);
  };

  return (
    <div
      className="component-root dark-component"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: 'transparent',
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <style>{
        '@keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.85} 94%{opacity:1} 97%{opacity:0.9} 98%{opacity:1} }' +
        '.cyber-canvas { animation: flicker 4s infinite; display: block; }'
      }</style>
      <canvas
        ref={canvasRef}
        className="cyber-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default CyberpunkWaveBackground;