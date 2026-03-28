export default function PixelArtShader() {
  const rootRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const frameRef = React.useRef(0);
  const sizeRef = React.useRef({ width: 300, height: 300, dpr: 1 });
  const timeRef = React.useRef(0);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let running = true;
    let observer = null;

    function resize() {
      const rect = root.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const width = Math.max(240, Math.floor(rect.width));
      const height = Math.max(240, Math.floor(rect.height));
      sizeRef.current = { width: width, height: height, dpr: dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }

    observer = new ResizeObserver(function () {
      resize();
    });
    observer.observe(root);
    resize();

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function hsl(h, s, l) {
      return "hsl(" + h + ", " + s + "%, " + l + "%)";
    }

    function draw(now) {
      if (!running) return;
      timeRef.current = now * 0.001;
      var t = timeRef.current;
      var width = sizeRef.current.width;
      var height = sizeRef.current.height;

      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);

      var cols = 54;
      var rows = 36;
      var cellW = width / cols;
      var cellH = height / rows;
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.8);
      var driftX = Math.sin(t * 0.33) * 0.7;
      var driftY = Math.cos(t * 0.27) * 0.6;
      var intensity = 0.2;
      var speed = 0.75;

      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var nx = x / cols - 0.5;
          var ny = y / rows - 0.5;

          var r = Math.sqrt(nx * nx + ny * ny);
          var a = Math.atan2(ny, nx);

          var wave1 =
            Math.sin((x * 0.55 + t * 2.2 * speed) + driftX) *
            Math.cos((y * 0.45 - t * 1.8 * speed) + driftY);

          var wave2 =
            Math.sin(r * 24 - t * 2.7 * speed + a * 6) *
            0.7;

          var wave3 =
            Math.cos((x + y) * 0.28 + t * 1.4 * speed) *
            Math.sin((x - y) * 0.22 - t * 1.1 * speed) *
            0.8;

          var v = wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.2;
          v += (0.18 + intensity) * Math.exp(-r * 4.5) * Math.sin(t * 2 + r * 18);
          v = clamp(v, -1, 1);

          var q = Math.floor((v + 1) * 3.5);
          var glow = Math.max(0, v) * (0.35 + pulse * 0.25);

          var hueBase = lerp(200, 320, (x + y) / (cols + rows));
          var hue = hueBase + Math.sin(t + x * 0.08 + y * 0.05) * 16;
          var sat = 70 + q * 5;
          var light = 14 + q * 8 + glow * 18;

          if (q <= 1) {
            ctx.fillStyle = hsl(hue - 25, 65, 10 + q * 4);
          } else if (q === 2) {
            ctx.fillStyle = hsl(hue, sat, light);
          } else if (q === 3) {
            ctx.fillStyle = hsl(hue + 12, sat + 6, light + 6);
          } else if (q === 4) {
            ctx.fillStyle = hsl(hue + 24, sat + 8, light + 10);
          } else if (q === 5) {
            ctx.fillStyle = hsl(hue + 36, 92, 62 + glow * 10);
          } else {
            ctx.fillStyle = hsl(hue + 48, 96, 76);
          }

          var px = Math.floor(x * cellW);
          var py = Math.floor(y * cellH);
          var pw = Math.ceil(cellW);
          var ph = Math.ceil(cellH);

          ctx.fillRect(px, py, pw, ph);

          if (q >= 4) {
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.fillRect(px, py, Math.max(1, Math.floor(pw * 0.35)), Math.max(1, Math.floor(ph * 0.35)));
          }

          if (q >= 5 && ((x + y + Math.floor(t * 8)) % 5 === 0)) {
            ctx.fillStyle = "rgba(255,255,255,0.14)";
            ctx.fillRect(
              px + Math.max(1, Math.floor(pw * 0.55)),
              py + Math.max(1, Math.floor(ph * 0.55)),
              Math.max(1, Math.floor(pw * 0.18)),
              Math.max(1, Math.floor(ph * 0.18))
            );
          }
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (var gy = 0; gy <= rows; gy++) {
        var yy = Math.floor(gy * cellH) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(width, yy);
        ctx.stroke();
      }
      for (var gx = 0; gx <= cols; gx++) {
        var xx = Math.floor(gx * cellW) + 0.5;
        ctx.beginPath();
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, height);
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return function () {
      running = false;
      if (observer) observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "520px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, #11131a 0%, #090a0f 55%, #030407 100%)",
        borderRadius: "20px",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.45)"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}