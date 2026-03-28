export default function PixelArtShader() {
  // Constants based on seed: 753884
  // Mechanic 7: Wavy distortion
  // Geometry 5: Diagonal pixel grid
  // Color scheme 3: Gradient bands
  // Speed 8 -> fast
  // Intensity 84 -> high
  var SPEED = 1.8;
  var PIXEL_BASE = 14;
  var INTENSITY = 0.84;
  var COUNT = 5;

  // React state for params
  var colorAState = React.useState('#ff6b6b');
  var colorA = colorAState[0];
  var setColorA = colorAState[1];

  var colorBState = React.useState('#4dfff3');
  var colorB = colorBState[0];
  var setColorB = colorBState[1];

  var colorCState = React.useState('#9b5bff');
  var colorC = colorCState[0];
  var setColorC = colorCState[1];

  var pixelSizeState = React.useState(PIXEL_BASE);
  var pixelSize = pixelSizeState[0];
  var setPixelSize = pixelSizeState[1];

  var waveAmountState = React.useState(INTENSITY);
  var waveAmount = waveAmountState[0];
  var setWaveAmount = waveAmountState[1];

  var gradientBlendState = React.useState(0.6);
  var gradientBlend = gradientBlendState[0];
  var setGradientBlend = gradientBlendState[1];

  // Refs for canvas, animation and size
  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  var startTimeRef = React.useRef(null);

  // Register params for external controls
function registerParams() {
  if (!window.__paramSetters) {
    window.__paramSetters = {};
  }
  window.__paramSetters['colorA'] = function(v) { setColorA(v); };
  window.__paramSetters['colorB'] = function(v) { setColorB(v); };
  window.__paramSetters['colorC'] = function(v) { setColorC(v); };
  window.__paramSetters['pixelSize'] = function(v) { setPixelSize(v); };
  window.__paramSetters['waveAmount'] = function(v) { setWaveAmount(v); };
  window.__paramSetters['gradientBlend'] = function(v) { setGradientBlend(v); };
}

  // Setup 2D renderer
  function setupRenderer(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  // Draw one frame with pixelated waves
  function draw(ctx, time, width, height) {
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Compute pixel size and grid
    var basePx = Math.max(4, pixelSize);
    var diagScale = 1.0 + 0.3 * INTENSITY;
    var px = basePx * diagScale;
    var cols = Math.ceil(width / px) + 2;
    var rows = Math.ceil(height / px) + 2;

    // Precompute gradient direction (diagonal)
    var maxDiag = Math.sqrt(width * width + height * height);

    // Convert hex color to rgb array
    function hexToRgb(h) {
      var s = h.replace('#', '');
      if (s.length === 3) {
        s =
          s[0] +
          s[0] +
          s[1] +
          s[1] +
          s[2] +
          s[2];
      }
      var num = parseInt(s, 16);
      return [
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255
      ];
    }

    var ca = hexToRgb(colorA);
    var cb = hexToRgb(colorB);
    var cc = hexToRgb(colorC);

    // Helper: mix 2 colors
    function mix(a, b, t) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
      ];
    }

    // Time factors
    var t = time * 0.001 * SPEED;
    var waveStr = 25 * waveAmount;
    var waveFreq1 = 0.09;
    var waveFreq2 = 0.17;
    var bandFreq = 0.012;

    // Loop grid and draw pixelated squares
    for (var y = -1; y < rows; y++) {
      for (var x = -1; x < cols; x++) {
        var cx = x * px + px * 0.5;
        var cy = y * px + px * 0.5;

        // Diagonal coordinate
        var dx = cx - width * 0.5;
        var dy = cy - height * 0.5;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Wavy distortion mechanic
        var wave =
          Math.sin(dx * waveFreq1 + t * 2.1) +
          Math.cos(dy * waveFreq2 - t * 1.7);
        var radial =
          Math.sin(dist * 0.02 - t * 1.3);
        var wobble =
          Math.sin((dx + dy) * 0.01 + t * 2.5);

        var offsetX = waveStr * wave * 0.25 * waveAmount;
        var offsetY = waveStr * radial * 0.25 * waveAmount;

        var fx = cx + offsetX + wobble * 6 * waveAmount;
        var fy = cy + offsetY - wobble * 6 * waveAmount;

        // Diagonal gradient factor
        var diag = (fx + fy) / maxDiag;
        var bands =
          Math.sin((fx + fy) * bandFreq + t * 1.4 * SPEED * 0.7) * 0.5 +
          0.5;

        // Combine gradient bands
        var g1 = diag;
        var g2 = bands;

        // Interpolate colors in 3-band gradient
        var blend = gradientBlend;
        var t1 = g1 * (1.0 - blend) + g2 * blend;
        var cFinal;
        if (t1 < 0.5) {
          var tA = t1 * 2.0;
          cFinal = mix(ca, cb, tA);
        } else {
          var tB = (t1 - 0.5) * 2.0;
          cFinal = mix(cb, cc, tB);
        }

        // Add dither-like pixel noise based on grid indices
        var n =
          Math.sin((x * 37.0 + y * 57.0) * 0.45 + t * 3.1) * 0.5 +
          0.5;
        var n2 =
          Math.sin((x * 11.0 - y * 23.0) * 0.73 - t * 2.7) * 0.5 +
          0.5;
        var noise = (n + n2) * 0.5;

        var shade =
          0.7 + noise * 0.6 * INTENSITY;

        var r = Math.max(
          0,
          Math.min(255, cFinal[0] * shade)
        );
        var g = Math.max(
          0,
          Math.min(255, cFinal[1] * shade)
        );
        var b = Math.max(
          0,
          Math.min(255, cFinal[2] * shade)
        );

        ctx.fillStyle =
          'rgb(' +
          Math.round(r) +
          ', ' +
          Math.round(g) +
          ', ' +
          Math.round(b) +
          ')';

        // Slight perspective scaling for pixel size
        var depth =
          0.7 +
          0.3 *
            Math.sin(
              dist * 0.01 - t * 1.2
            ) *
            waveAmount;
        var s = px * depth;
        ctx.fillRect(
          fx - s * 0.5,
          fy - s * 0.5,
          s,
          s
        );
      }
    }
  }

  // Animation loop
  function animate() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var now = performance.now();
    if (!startTimeRef.current) {
      startTimeRef.current = now;
    }
    var elapsed = now - startTimeRef.current;

    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width = width;
      canvas.height = height;
    }

    draw(ctx, elapsed, width, height);

    frameRef.current = requestAnimationFrame(
      animate
    );
  }

  // Setup effects
  React.useEffect(function () {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var ctx = setupRenderer(canvas);

    // Initial size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    draw(
      ctx,
      0,
      canvas.width,
      canvas.height
    );

    // Start animation loop
    frameRef.current = requestAnimationFrame(
      animate
    );

    // Setup ResizeObserver
    if (window.ResizeObserver) {
      resizeObserverRef.current =
        new ResizeObserver(function () {
          if (!canvas) return;
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        });
      resizeObserverRef.current.observe(
        canvas
      );
    }

    // Register params globally
    registerParams();

    // Cleanup
    return function () {
      if (frameRef.current) {
        cancelAnimationFrame(
          frameRef.current
        );
      }
      if (
        resizeObserverRef.current &&
        resizeObserverRef.current.disconnect
      ) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Root element for fullscreen shader
  return React.createElement(
    'div',
    {
      className: 'dark-component',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0d0d0d',
        overflow: 'hidden'
      }
    },
    React.createElement('canvas', {
      ref: canvasRef,
      style: {
        width: '100%',
        height: '100%',
        display: 'block'
      }
    })
  );
}