export default function PixelArtShader641103() {
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(0);
  const startRef = React.useRef(0);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });

  React.useEffect(function () {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    let mounted = true;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      sizeRef.current = { width: width, height: height, dpr: dpr };
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
    }

    const observer = new ResizeObserver(function () {
      resizeCanvas();
    });

    observer.observe(canvas);
    resizeCanvas();

    const mechanic = 6;
    const geometry = 4;
    const speedDigit = 1;
    const intensityValue = 3;
    const speed = 0.2 + speedDigit * 0.08;
    const intensity = 0.3 + intensityValue * 0.08;

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function draw(now) {
      if (!mounted) return;
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) * 0.001 * speed;

      const width = sizeRef.current.width;
      const height = sizeRef.current.height;
      const dpr = sizeRef.current.dpr;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);

      const cell = Math.max(8, Math.floor(Math.min(width, height) / 28));
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = x / Math.max(1, cols - 1);
          const ny = y / Math.max(1, rows - 1);

          let v = 0;

          if (mechanic === 6) {
            const cx = nx - 0.5;
            const cy = ny - 0.5;
            const ang = Math.atan2(cy, cx);
            const dist = Math.sqrt(cx * cx + cy * cy);

            if (geometry === 4) {
              const diamond = Math.abs(cx) + Math.abs(cy);
              v =
                Math.sin(ang * 6 + t * 2.6) * 0.45 +
                Math.cos(diamond * 18 - t * 3.4) * 0.35 +
                Math.sin((cx - cy) * 14 + t * 1.8) * 0.2;
              v -= dist * (1.2 - intensity * 0.4);
            } else {
              v = Math.sin(dist * 20 - t * 4);
            }
          }

          const q = Math.floor(clamp((v + 1) * 2.5, 0, 4));

          let fill = "#120914";
          if (q === 0) fill = "#120914";
          if (q === 1) fill = "#3a145e";
          if (q === 2) fill = "#7a2cff";
          if (q === 3) fill = "#27d3ff";
          if (q === 4) fill = "#fff07a";

          context.fillStyle = fill;
          context.fillRect(x * cell, y * cell, cell, cell);
        }
      }

      context.fillStyle = "rgba(255,255,255,0.05)";
      for (let gy = 0; gy <= rows; gy += 1) {
        context.fillRect(0, gy * cell, width, 1);
      }
      for (let gx = 0; gx <= cols; gx += 1) {
        context.fillRect(gx * cell, 0, 1, height);
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return function () {
      mounted = false;
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return React.createElement(
    "div",
    {
      className: "dark-component",
      style: {
        width: "100%",
        height: "100%",
        minHeight: "480px",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(8,6,20,1) 0%, rgba(15,10,34,1) 100%)",
        borderRadius: "20px"
      }
    },
    React.createElement("canvas", {
      ref: canvasRef,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    })
  );
}