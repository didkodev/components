function CyberpunkNoiseBackground() {
  const [primaryColor, setPrimaryColor] = React.useState('#00ff88');
  const [secondaryColor, setSecondaryColor] = React.useState('#ff00ff');
  const [speed, setSpeed] = React.useState(1);
  const [density, setDensity] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['secondaryColor'] = setSecondaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
    window.__paramSetters['density'] = (v) => setDensity(Number(v));
  }, []);

  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const timeRef = React.useRef(0);
  const paramsRef = React.useRef({ primaryColor, secondaryColor, speed, density });

  React.useEffect(() => {
    paramsRef.current = { primaryColor, secondaryColor, speed, density };
  }, [primaryColor, secondaryColor, speed, density]);

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    };

    const observer = new ResizeObserver(() => { resize(); });
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    resize();

    const limeColor = { r: 204, g: 255, b: 0 };

    function noise(x, y, t) {
      const val = Math.sin(x * 127.1 + y * 311.7 + t * 74.3) * 43758.5453;
      return val - Math.floor(val);
    }

    function noise2(x, y, t) {
      const val = Math.sin(x * 269.5 + y * 183.3 + t * 51.7) * 31415.9265;
      return val - Math.floor(val);
    }

    function noise3(x, y, t) {
      const val = Math.cos(x * 93.7 + y * 421.1 + t * 33.9) * 27182.8182;
      return val - Math.floor(val);
    }

    function draw(timestamp) {
      const { primaryColor: pc, secondaryColor: sc, speed: sp, density: dn } = paramsRef.current;
      const p = hexToRgb(pc);
      const s = hexToRgb(sc);

      const w = canvas.width;
      const h = canvas.height;

      timeRef.current += 0.012 * sp;
      const t = timeRef.current;

      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, w, h);

      const pixelStep = Math.max(1, Math.round(2 / dn));
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
      const pulse2 = 0.5 + 0.5 * Math.sin(t * 0.87 + 1.5);

      for (let y = 0; y < h; y += pixelStep) {
        for (let x = 0; x < w; x += pixelStep) {
          const nx = x / w;
          const ny = y / h;

          const n1 = noise(nx * 80 * dn, ny * 80 * dn, t);
          const n2 = noise2(nx * 120 * dn, ny * 120 * dn, t * 0.7);
          const n3 = noise3(nx * 60 * dn, ny * 60 * dn, t * 1.1);

          const combined = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

          let r = 10, g = 14, b = 39, a = 0;

          if (combined > 0.72) {
            const intensity = (combined - 0.72) / 0.28;
            const colorChoice = n2;
            if (colorChoice < 0.33) {
              r = p.r;
              g = p.g;
              b = p.b;
              a = intensity * 220 * (0.6 + 0.4 * pulse);
            } else if (colorChoice < 0.66) {
              r = s.r;
              g = s.g;
              b = s.b;
              a = intensity * 200 * (0.6 + 0.4 * pulse2);
            } else {
              r = limeColor.r;
              g = limeColor.g;
              b = limeColor.b;
              a = intensity * 180 * (0.5 + 0.5 * pulse);
            }
          } else if (combined > 0.60) {
            const intensity = (combined - 0.60) / 0.12;
            r = 15; g = 20; b = 50;
            a = intensity * 80;
          }

          if (a > 0) {
            for (let py = 0; py < pixelStep && y + py < h; py++) {
              for (let px2 = 0; px2 < pixelStep && x + px2 < w; px2++) {
                const idx = ((y + py) * w + (x + px2)) * 4;
                data[idx] = Math.min(255, r);
                data[idx + 1] = Math.min(255, g);
                data[idx + 2] = Math.min(255, b);
                data[idx + 3] = Math.min(255, a);
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const scanlineAlpha = 0.04 + 0.02 * pulse;
      for (let sy = 0; sy < h; sy += 4) {
        ctx.fillStyle = 'rgba(0,0,0,' + scanlineAlpha + ')';
        ctx.fillRect(0, sy, w, 2);
      }

      const flickerAlpha = Math.random() * 0.03;
      ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + flickerAlpha + ')';
      ctx.fillRect(0, 0, w, h);

      if (Math.random() > 0.985) {
        const glitchY = Math.random() * h;
        const glitchH2 = 1 + Math.random() * 3;
        const glitchX = (Math.random() - 0.5) * 8;
        ctx.drawImage(canvas, 0, glitchY, w, glitchH2, glitchX, glitchY, w, glitchH2);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="component-root dark-component"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        background: '#0a0e27',
        overflow: 'hidden'
      }}
    >
      <style>{
        '@keyframes vignettePulse{0%{opacity:0.6}50%{opacity:0.85}100%{opacity:0.6}}' +
        '@keyframes borderFlicker{0%{opacity:0.4}25%{opacity:0.7}50%{opacity:0.3}75%{opacity:0.8}100%{opacity:0.4}}'
      }</style>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)',
          pointerEvents: 'none',
          animation: 'vignettePulse 4s ease-in-out infinite'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: '1px solid rgba(0,255,136,0.15)',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          animation: 'borderFlicker 3s step-start infinite'
        }}
      />
    </div>
  );
}
export default CyberpunkNoiseBackground;