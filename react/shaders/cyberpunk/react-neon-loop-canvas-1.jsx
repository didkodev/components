function CyberpunkGridShader() {
  const [primaryColor, setPrimaryColor] = React.useState('#00ff41');
  const [secondaryColor, setSecondaryColor] = React.useState('#ffffff');
  const [speed, setSpeed] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['secondaryColor'] = setSecondaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
    window.__paramSetters['intensity'] = (v) => setIntensity(Number(v));
  }, []);

  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const stateRef = React.useRef({ primaryColor, secondaryColor, speed, intensity });

  React.useEffect(() => {
    stateRef.current = { primaryColor, secondaryColor, speed, intensity };
  }, [primaryColor, secondaryColor, speed, intensity]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    resize();

    let time = 0;

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    }

    function drawNoise(ctx, w, h, t, intens) {
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const n = Math.sin(x * 0.1 + t * 2.3) * Math.cos(y * 0.13 - t * 1.7) * Math.sin((x + y) * 0.05 + t);
          const val = n > (0.85 - intens * 0.2) ? Math.floor((n - 0.85 + intens * 0.2) * 255 * 3) : 0;
          const i = (y * w + x) * 4;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
          data[i + 3] = 180;
          const i2 = (y * w + x + 1) * 4;
          data[i2] = val; data[i2+1] = val; data[i2+2] = val; data[i2+3] = 180;
          const i3 = ((y+1) * w + x) * 4;
          if (i3 + 3 < data.length) { data[i3] = val; data[i3+1] = val; data[i3+2] = val; data[i3+3] = 180; }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function draw() {
      const { primaryColor, secondaryColor, speed, intensity } = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      time += 0.016 * speed;

      const pc = hexToRgb(primaryColor);
      const sc = hexToRgb(secondaryColor);

      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, w, h);

      const cellSize = Math.max(8, Math.floor(20 / intensity));
      const cols = Math.ceil(w / cellSize) + 2;
      const rows = Math.ceil(h / cellSize) + 2;

      ctx.lineWidth = 1;
      for (let ix = 0; ix <= cols; ix++) {
        const warpX = Math.sin(ix * 0.3 + time * 1.1) * 4 * intensity;
        const warpY = Math.cos(ix * 0.2 - time * 0.8) * 3 * intensity;
        const x = ix * cellSize + warpX;
        const alpha = 0.08 + 0.12 * Math.abs(Math.sin(ix * 0.5 + time));
        ctx.strokeStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(x, warpY);
        ctx.lineTo(x + Math.sin(time * 0.5) * 6 * intensity, h + warpY);
        ctx.stroke();
      }

      for (let iy = 0; iy <= rows; iy++) {
        const warpX = Math.sin(iy * 0.25 + time * 0.9) * 5 * intensity;
        const warpY = Math.cos(iy * 0.35 - time * 1.2) * 3 * intensity;
        const y = iy * cellSize + warpY;
        const alpha = 0.08 + 0.12 * Math.abs(Math.cos(iy * 0.4 + time));
        ctx.strokeStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(warpX, y);
        ctx.lineTo(w + warpX, y + Math.cos(time * 0.7) * 4 * intensity);
        ctx.stroke();
      }

      for (let iy = 0; iy <= rows; iy++) {
        for (let ix = 0; ix <= cols; ix++) {
          const wx = Math.sin(ix * 0.3 + time * 1.1) * 4 * intensity;
          const wy = Math.cos(iy * 0.35 - time * 1.2) * 3 * intensity;
          const x = ix * cellSize + wx;
          const y = iy * cellSize + wy;
          const flicker = Math.sin(ix * 13.7 + iy * 7.3 + time * 5.1);
          if (flicker > 0.7) {
            const dotAlpha = (flicker - 0.7) / 0.3 * intensity;
            ctx.fillStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + Math.min(1, dotAlpha) + ')';
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }
      }

      const numDiag = Math.floor(5 * intensity);
      for (let d = 0; d < numDiag; d++) {
        const progress = ((time * speed * 0.4 + d / numDiag) % 1);
        const x1 = progress * w * 1.5 - w * 0.25;
        const lineAlpha = Math.sin(progress * Math.PI) * 0.6;
        ctx.strokeStyle = 'rgba(' + sc.r + ',' + sc.g + ',' + sc.b + ',' + lineAlpha + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x1 - h * 0.4, h);
        ctx.stroke();
      }

      const numScans = Math.floor(3 + intensity * 2);
      for (let s = 0; s < numScans; s++) {
        const scanPhase = (time * speed * 0.3 + s / numScans) % 1;
        const sy = scanPhase * (h + 40) - 20;
        const scanH = 2 + Math.floor(intensity * 2);
        const scanAlpha = Math.sin(scanPhase * Math.PI) * 0.35 * intensity;
        ctx.fillStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + scanAlpha + ')';
        ctx.fillRect(0, sy, w, scanH);

        ctx.fillStyle = 'rgba(' + sc.r + ',' + sc.g + ',' + sc.b + ',' + (scanAlpha * 0.5) + ')';
        ctx.fillRect(0, sy + scanH, w, 1);
      }

      const numGlitch = Math.floor(2 + intensity * 3);
      for (let g = 0; g < numGlitch; g++) {
        const glitchSeed = Math.sin(time * 11.3 + g * 77.7);
        if (glitchSeed > (0.6 - intensity * 0.1)) {
          const gy = Math.abs(Math.sin(time * 3.1 + g * 13.3)) * h;
          const gh = 1 + Math.floor(Math.random() * 3 * intensity);
          const gw = 10 + Math.floor(Math.abs(Math.sin(time * 7.2 + g)) * w * 0.4);
          const gx = Math.abs(Math.sin(time * 5.7 + g * 9.1)) * (w - gw);
          const gAlpha = (glitchSeed - 0.6) / 0.4 * intensity * 0.8;
          ctx.fillStyle = 'rgba(' + pc.r + ',' + pc.g + ',' + pc.b + ',' + Math.min(1, gAlpha) + ')';
          ctx.fillRect(gx, gy, gw, gh);
        }
      }

      const numVertGlitch = Math.floor(1 + intensity * 2);
      for (let v = 0; v < numVertGlitch; v++) {
        const vs = Math.sin(time * 8.3 + v * 31.1);
        if (vs > 0.65) {
          const vx = Math.abs(Math.sin(time * 4.1 + v * 17.3)) * w;
          const vw = 1;
          const vAlpha = (vs - 0.65) / 0.35 * intensity * 0.6;
          ctx.fillStyle = 'rgba(' + sc.r + ',' + sc.g + ',' + sc.b + ',' + Math.min(1, vAlpha) + ')';
          ctx.fillRect(vx, 0, vw, h);
        }
      }

      for (let sy2 = 0; sy2 < h; sy2 += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, sy2, w, 2);
      }

      const vigR = Math.max(w, h) * 0.75;
      const vigGrad = ctx.createRadialGradient(w/2, h/2, vigR * 0.3, w/2, h/2, vigR);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="component-root dark-component" style={{width:'100%',height:'100%',position:'absolute',top:0,left:0,background:'transparent',overflow:'hidden'}}>
      <style>{
        '@keyframes flicker{0%,100%{opacity:1}92%{opacity:0.97}95%{opacity:0.85}97%{opacity:0.99}}' +
        '.cyberpunk-canvas{animation:flicker 4s infinite;image-rendering:pixelated;}'
      }</style>
      <canvas
        ref={canvasRef}
        className="cyberpunk-canvas"
        style={{width:'100%',height:'100%',position:'absolute',top:0,left:0,display:'block'}}
      />
    </div>
  );
}
export default CyberpunkGridShader;