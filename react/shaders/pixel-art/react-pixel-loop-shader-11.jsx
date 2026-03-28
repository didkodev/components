export default function PixelArtShaderLoop() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    let raf = 0;
    let ro = null;
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const intensity = 0.35;
    const speed = 0.0032;
    const gridBase = 18;
    const noiseScale = 0.06 + intensity * 0.04;
    const pulse = 0.22 + intensity * 0.5;

    function hexToRgb(hex) {
      const h = hex.replace("#", "");
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16)
      };
    }

    const paletteHex = ["#120914", "#3a0f6b", "#7b2cbf", "#c77dff", "#80ffdb"];
    const palette = paletteHex.map(hexToRgb);

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function smoothstep(a, b, x) {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    }

    function valueNoise(x, y, t) {
      const v =
        Math.sin(x * 1.73 + t * 0.9) +
        Math.cos(y * 1.37 - t * 1.1) +
        Math.sin((x + y) * 0.91 - t * 0.7) +
        Math.cos(Math.sqrt(x * x + y * y) * 1.15 + t * 0.5);
      return v * 0.25;
    }

    function samplePalette(v) {
      const n = palette.length - 1;
      const s = clamp(v, 0, 0.9999) * n;
      const i = Math.floor(s);
      const f = s - i;
      const a = palette[i];
      const b = palette[Math.min(n, i + 1)];
      return {
        r: Math.round(lerp(a.r, b.r, f)),
        g: Math.round(lerp(a.g, b.g, f)),
        b: Math.round(lerp(a.b, b.b, f))
      };
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(320, Math.floor(rect.height));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }

    function draw(time) {
      const t = time * speed;
      ctx.fillStyle = "#07070a";
      ctx.fillRect(0, 0, width, height);

      const cols = Math.max(22, Math.floor(width / gridBase));
      const rows = Math.max(14, Math.floor(height / gridBase));
      const cellW = width / cols;
      const cellH = height / rows;

      for (let gy = 0; gy < rows; gy += 1) {
        for (let gx = 0; gx < cols; gx += 1) {
          const nx = (gx - cols * 0.5) * noiseScale;
          const ny = (gy - rows * 0.5) * noiseScale;

          const a = valueNoise(nx * 1.8, ny * 1.8, t);
          const b = Math.sin((gx * 0.42) + t * 1.6) * 0.5 + 0.5;
          const c = Math.cos((gy * 0.37) - t * 1.25) * 0.5 + 0.5;

          const radialX = gx / cols - 0.5;
          const radialY = gy / rows - 0.5;
          const radial = Math.sqrt(radialX * radialX + radialY * radialY);
          const ring = Math.sin(radial * 18 - t * 2.4) * 0.5 + 0.5;

          let v = 0.34 + a * 0.32 + b * 0.18 + c * 0.12 + ring * pulse * 0.32;
          v = smoothstep(0.12, 0.88, v);

          const levels = 6;
          v = Math.floor(v * levels) / (levels - 1);

          const col = samplePalette(v);
          ctx.fillStyle = "rgb(" + col.r + "," + col.g + "," + col.b + ")";
          ctx.fillRect(
            Math.floor(gx * cellW),
            Math.floor(gy * cellH),
            Math.ceil(cellW) + 1,
            Math.ceil(cellH) + 1
          );

          if (v > 0.78) {
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.fillRect(
              Math.floor(gx * cellW),
              Math.floor(gy * cellH),
              Math.max(1, Math.floor(cellW * 0.35)),
              Math.max(1, Math.floor(cellH * 0.35))
            );
          }
        }
      }

      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(wrap);
    raf = requestAnimationFrame(draw);

    return function () {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: wrapRef,
      className: "dark-component",
      style: {
        width: "100%",
        height: "100%",
        minHeight: "560px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, #140818 0%, #09070d 55%, #040406 100%)",
        borderRadius: "20px",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.45)"
      }
    },
    React.createElement("canvas", {
      ref: canvasRef,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    }),
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: "16px",
          bottom: "14px",
          color: "rgba(255,255,255,0.72)",
          fontFamily: "monospace",
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "6px 8px",
          background: "rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          pointerEvents: "none"
        }
      },
      "Pixel Art Shader"
    )
  );
}