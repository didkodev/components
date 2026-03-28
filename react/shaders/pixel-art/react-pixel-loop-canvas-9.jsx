export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var containerRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var sizeRef = React.useRef({ width: 1, height: 1, dpr: 1 });
  var timeRef = React.useRef(0);

  var [params, setParams] = React.useState({
    colorA: '#2d6cdf',
    colorB: '#7a2cff',
    colorC: '#12b0a8',
    pixelSize: 18,
    warp: 0.95,
    speed: 1.25
  });

  // Clamp helper for parameter safety
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Mix two hex colors
  function mixHex(a, b, t) {
    function hexToRgb(hex) {
      var clean = hex.replace('#', '');
      return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16)
      };
    }
    function rgbToHex(rgb) {
      var r = clamp(Math.round(rgb.r), 0, 255).toString(16).padStart(2, '0');
      var g = clamp(Math.round(rgb.g), 0, 255).toString(16).padStart(2, '0');
      var b = clamp(Math.round(rgb.b), 0, 255).toString(16).padStart(2, '0');
      return '#' + r + g + b;
    }
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    return rgbToHex({
      r: ca.r + (cb.r - ca.r) * t,
      g: ca.g + (cb.g - ca.g) * t,
      b: ca.b + (cb.b - ca.b) * t
    });
  }

  // Build a five-step gradient palette from the three color params
  function buildPalette() {
    return [
      params.colorA,
      mixHex(params.colorA, params.colorB, 0.5),
      params.colorB,
      mixHex(params.colorB, params.colorC, 0.5),
      params.colorC
    ];
  }

  // Responsive canvas setup with ResizeObserver
  function setupRenderer() {
    var canvas = canvasRef.current;
    var container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    function resizeCanvas() {
      var rect = container.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
        dpr: dpr
      };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }

    resizeCanvas();

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resizeCanvas();
    });

    resizeObserverRef.current.observe(container);
  }

  // Register param setters for external controls
  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.PixelArtShader = function (next) {
      setParams(function (prev) {
        return {
          colorA: next.colorA !== undefined ? next.colorA : prev.colorA,
          colorB: next.colorB !== undefined ? next.colorB : prev.colorB,
          colorC: next.colorC !== undefined ? next.colorC : prev.colorC,
          pixelSize: next.pixelSize !== undefined ? next.pixelSize : prev.pixelSize,
          warp: next.warp !== undefined ? next.warp : prev.warp,
          speed: next.speed !== undefined ? next.speed : prev.speed
        };
      });
    };
  }

  // Draw a looping pixel-art plasma field with block quantization
  function draw() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    var palette = buildPalette();
    var width = sizeRef.current.width;
    var height = sizeRef.current.height;
    var dpr = sizeRef.current.dpr;
    var pixel = clamp(Math.floor(params.pixelSize), 8, 40);
    var cols = Math.ceil(width / pixel);
    var rows = Math.ceil(height / pixel);
    var t = timeRef.current * params.speed * SPEED;
    var warp = clamp(params.warp, 0, 1.4);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Fill the background with the darkest palette tone
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, width, height);

    // Draw quantized blocks that animate in a retro plasma pattern
    for (var y = 0; y < rows; y += 1) {
      for (var x = 0; x < cols; x += 1) {
        var nx = x / Math.max(1, cols);
        var ny = y / Math.max(1, rows);

        var wave1 =
          Math.sin(nx * 8.0 + t * 1.1) +
          Math.cos(ny * 9.5 - t * 1.3);

        var wave2 =
          Math.sin((nx + ny) * 10.0 - t * 0.9) +
          Math.cos(Math.sqrt((nx - 0.5) * (nx - 0.5) + (ny - 0.5) * (ny - 0.5)) * 16.0 - t * 1.6);

        var wave3 =
          Math.sin((nx * 12.0 + ny * 6.0) + t * 0.7) * warp +
          Math.cos((ny * 13.0 - nx * 5.0) - t * 1.4) * warp;

        var value = (wave1 * 0.35 + wave2 * 0.4 + wave3 * 0.25) * 0.5 + 0.5;
        var index = clamp(Math.floor(value * palette.length), 0, palette.length - 1);

        var flicker = Math.sin((x * 0.7 + y * 0.5) + t * 2.2) * 0.08;
        var altIndex = clamp(Math.floor((value + flicker) * palette.length), 0, palette.length - 1);

        ctx.fillStyle = palette[(index + altIndex) % palette.length];
        ctx.fillRect(x * pixel, y * pixel, pixel + 1, pixel + 1);
      }
    }

    // Overlay sparse larger blocks for extra pixel-art geometry variation
    var bigPixel = pixel * 2;
    var offsetX = (Math.sin(t * 0.5) * 0.5 + 0.5) * pixel;
    var offsetY = (Math.cos(t * 0.4) * 0.5 + 0.5) * pixel;

    for (var by = -1; by < Math.ceil(height / bigPixel) + 1; by += 1) {
      for (var bx = -1; bx < Math.ceil(width / bigPixel) + 1; bx += 1) {
        var px = bx * bigPixel + offsetX;
        var py = by * bigPixel + offsetY;
        var nnx = px / Math.max(1, width);
        var nny = py / Math.max(1, height);
        var pulse =
          Math.sin(nnx * 14.0 - t * 1.2) *
          Math.cos(nny * 11.0 + t * 0.8);

        if (pulse > 0.42) {
          var glowIndex = clamp(Math.floor(((pulse + 1) * 0.5) * (palette.length - 1)), 0, palette.length - 1);
          ctx.globalAlpha = 0.22 + pulse * 0.16;
          ctx.fillStyle = palette[glowIndex];
          ctx.fillRect(px, py, bigPixel, bigPixel);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // Animation loop
  function animate() {
    frameRef.current = window.requestAnimationFrame(animate);
    timeRef.current += 0.016 * (0.6 + params.speed * 0.8);
    draw();
  }

  React.useEffect(function () {
    setupRenderer();
    registerParams();
    animate();

    return function () {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (window.__paramSetters && window.__paramSetters.PixelArtShader) {
        delete window.__paramSetters.PixelArtShader;
      }
    };
  }, []);

  React.useEffect(function () {
    draw();
  }, [params]);

  return React.createElement(
    'div',
    {
      ref: containerRef,
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