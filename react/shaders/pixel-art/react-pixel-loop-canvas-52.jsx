export default function PixelArtShader880021() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    let raf = 0;
    let ro = null;

    const state = {
      width: 0,
      height: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      cols: 0,
      rows: 0,
      cell: 0,
      time: 0,
      start: performance.now()
    };

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      state.width = Math.max(320, rect.width);
      state.height = Math.max(320, rect.height);
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);

      const baseCell = 10;
      const intensityScale = 1 + 21 / 40;
      state.cell = Math.max(6, Math.floor(baseCell / intensityScale + 2));
      state.cols = Math.max(24, Math.floor(state.width / state.cell));
      state.rows = Math.max(24, Math.floor(state.height / state.cell));

      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      canvas.style.width = state.width + 'px';
      canvas.style.height = state.height + 'px';

      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }

    function mix(a, b, t) {
      return a + (b - a) * t;
    }

    function smoothstep(a, b, x) {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    }

    function fract(x) {
      return x - Math.floor(x);
    }

    function hash(x, y) {
      const n = Math.sin(x * 127.1 + y * 311.7 + 880021 * 0.0001) * 43758.5453123;
      return fract(n);
    }

    function palette(t) {
      const c1 = [20, 30, 80];
      const c2 = [80, 40, 170];
      const c3 = [255, 80, 140];
      const c4 = [255, 200, 90];

      const tt = clamp(t, 0, 1);
      let a;
      let b;
      let k;

      if (tt < 0.33) {
        a = c1;
        b = c2;
        k = tt / 0.33;
      } else if (tt < 0.66) {
        a = c2;
        b = c3;
        k = (tt - 0.33) / 0.33;
      } else {
        a = c3;
        b = c4;
        k = (tt - 0.66) / 0.34;
      }

      return [
        Math.floor(mix(a[0], b[0], k)),
        Math.floor(mix(a[1], b[1], k)),
        Math.floor(mix(a[2], b[2], k))
      ];
    }

    function drawPixel(px, py, rgb) {
      ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      ctx.fillRect(
        Math.floor(px * state.cell),
        Math.floor(py * state.cell),
        state.cell + 1,
        state.cell + 1
      );
    }

    function frame(now) {
      state.time = (now - state.start) * 0.001;

      const speed = 0.35;
      const amp = 0.21 * 1.8;

      ctx.fillStyle = 'rgb(5,7,14)';
      ctx.fillRect(0, 0, state.width, state.height);

      for (let y = 0; y < state.rows; y += 1) {
        for (let x = 0; x < state.cols; x += 1) {
          const nx = x / Math.max(1, state.cols - 1);
          const ny = y / Math.max(1, state.rows - 1);

          const gx = nx * 2 - 1;
          const gy = ny * 2 - 1;

          const angle = Math.atan2(gy, gx);
          const radius = Math.sqrt(gx * gx + gy * gy);

          const waveA =
            Math.sin(gx * 8.5 + state.time * speed * 1.7) *
            Math.cos(gy * 7.0 - state.time * speed * 1.3);

          const waveB =
            Math.sin(radius * 18.0 - state.time * speed * 2.2 + angle * 4.0) *
            0.5 +
            0.5;

          const mosaic =
            hash(
              Math.floor((x + state.time * 2) * 0.75),
              Math.floor((y - state.time * 1.5) * 0.75)
            ) * 0.22;

          const rings = 0.5 + 0.5 * Math.sin(24.0 * radius - state.time * speed * 3.0);
          const burst = 0.5 + 0.5 * Math.cos(angle * 8.0 + state.time * speed * 1.8);

          let v =
            waveA * 0.32 +
            waveB * 0.28 +
            rings * 0.22 +
            burst * 0.12 +
            mosaic +
            amp * 0.08;

          v = 0.5 + 0.5 * v;

          const vignette = 1 - smoothstep(0.45, 1.15, radius);
          v *= 0.7 + vignette * 0.55;

          const quant = 7;
          v = Math.floor(clamp(v, 0, 0.9999) * quant) / (quant - 1);

          const rgb = palette(v);
          drawPixel(x, y, rgb);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(wrap);

    raf = requestAnimationFrame(frame);

    return function () {
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="dark-component"
      style={{
        width: '100%',
        height: '720px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgb(4,6,12) 0%, rgb(10,10,22) 100%)'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}