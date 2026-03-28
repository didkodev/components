export default function PixelArtShader331897() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    colorA: '#ff4d6d',
    colorB: '#7c3aed',
    pixelSize: 18,
    flow: 1.64,
    intensity: 0.97,
    invert: false
  });

  var [, setTick] = React.useState(0);

  // Create a smooth color mix helper
  function mixColor(a, b, t) {
    var ar = parseInt(a.slice(1, 3), 16);
    var ag = parseInt(a.slice(3, 5), 16);
    var ab = parseInt(a.slice(5, 7), 16);

    var br = parseInt(b.slice(1, 3), 16);
    var bg = parseInt(b.slice(3, 5), 16);
    var bb = parseInt(b.slice(5, 7), 16);

    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var b2 = Math.round(ab + (bb - ab) * t);

    return 'rgb(' + r + ',' + g + ',' + b2 + ')';
  }

  // Create a deterministic pseudo noise function from seed-inspired constants
  function noiseValue(x, y, t) {
    var v =
      Math.sin(x * 0.19 + t * 0.8) +
      Math.cos(y * 0.23 - t * 0.6) +
      Math.sin((x + y) * 0.11 + t * 1.2) +
      Math.cos(Math.sqrt(x * x + y * y) * 0.09 - t * 0.9);
    return v * 0.25 + 0.5;
  }

  // Resize the canvas to device pixels
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  // Draw the animated pixel art effect
  function draw(time) {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    var width = canvas.width;
    var height = canvas.height;
    var p = paramsRef.current;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pixel = Math.max(6, Math.floor(p.pixelSize * dpr));
    var cols = Math.ceil(width / pixel);
    var rows = Math.ceil(height / pixel);
    var t = time * 0.001 * SPEED * p.flow;

    ctx.clearRect(0, 0, width, height);

    // Paint a dark base layer
    ctx.fillStyle = 'rgba(8,8,12,1)';
    ctx.fillRect(0, 0, width, height);

    // Render chunky pixel diamonds based on animated field values
    for (var gy = 0; gy < rows; gy++) {
      for (var gx = 0; gx < cols; gx++) {
        var px = gx * pixel;
        var py = gy * pixel;
        var cx = gx - cols * 0.5;
        var cy = gy - rows * 0.5;

        var radial = Math.sqrt(cx * cx + cy * cy) * 0.18;
        var field =
          noiseValue(gx + 33, gy + 18, t) +
          Math.sin((cx - cy) * 0.34 + t * 1.4) * 0.25 +
          Math.cos(radial - t * 2.2) * 0.25;

        var v = Math.max(0, Math.min(1, field * (0.7 + p.intensity * 0.8)));
        if (p.invert) {
          v = 1 - v;
        }

        var stepped = Math.floor(v * 5) / 4;
        var sizeFactor = 0.25 + stepped * 0.9;
        var diamondSize = pixel * sizeFactor;
        var ox = px + pixel * 0.5;
        var oy = py + pixel * 0.5;

        ctx.fillStyle = mixColor(p.colorA, p.colorB, stepped);

        ctx.beginPath();
        ctx.moveTo(ox, oy - diamondSize * 0.5);
        ctx.lineTo(ox + diamondSize * 0.5, oy);
        ctx.lineTo(ox, oy + diamondSize * 0.5);
        ctx.lineTo(ox - diamondSize * 0.5, oy);
        ctx.closePath();
        ctx.fill();

        if (stepped > 0.5) {
          ctx.fillStyle = mixColor(p.colorB, p.colorA, stepped * 0.5);
          ctx.fillRect(
            ox - diamondSize * 0.12,
            oy - diamondSize * 0.12,
            Math.max(1, diamondSize * 0.24),
            Math.max(1, diamondSize * 0.24)
          );
        }
      }
    }
  }

  // Run the animation loop continuously
  function animate(time) {
    draw(time);
    frameRef.current = window.requestAnimationFrame(animate);
  }

  // Register editable params for host environment
  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.PixelArtShader331897 = {
      colorA: function (value) {
        paramsRef.current.colorA = value;
        setTick(function (n) {
          return n + 1;
        });
      },
      colorB: function (value) {
        paramsRef.current.colorB = value;
        setTick(function (n) {
          return n + 1;
        });
      },
      pixelSize: function (value) {
        paramsRef.current.pixelSize = value;
        setTick(function (n) {
          return n + 1;
        });
      },
      flow: function (value) {
        paramsRef.current.flow = value;
        setTick(function (n) {
          return n + 1;
        });
      },
      intensity: function (value) {
        paramsRef.current.intensity = value;
        setTick(function (n) {
          return n + 1;
        });
      },
      invert: function (value) {
        paramsRef.current.invert = value;
        setTick(function (n) {
          return n + 1;
        });
      }
    };
  }

  React.useEffect(function () {
    setupRenderer();
    registerParams();

    // Observe layout changes for responsive fullscreen rendering
    if (canvasRef.current) {
      resizeObserverRef.current = new ResizeObserver(function () {
        setupRenderer();
      });
      resizeObserverRef.current.observe(canvasRef.current);
    }

    frameRef.current = window.requestAnimationFrame(animate);

    return function () {
      window.cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

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