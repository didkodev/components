export default function PixelArtShader589062() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var roRef = React.useRef(null);
  var stateRef = React.useRef({
    width: 1,
    height: 1,
    time: 0,
    params: {
      colorA: '#ff4d6d',
      colorB: '#7c3aed',
      colorC: '#00c2ff',
      pixelSize: 18,
      intensity: 0.62,
      swirl: 0.85
    }
  });

  var forceUpdate = React.useState(0)[1];

  function setupRenderer() {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    var rect = wrap.getBoundingClientRect();
    var width = Math.max(1, Math.floor(rect.width));
    var height = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    stateRef.current.width = width;
    stateRef.current.height = height;

    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
  }

  function hexToRgb(hex) {
    var clean = (hex || '#000000').replace('#', '');
    var full = clean.length === 3
      ? clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2)
      : clean;
    var num = parseInt(full, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function mixColor(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  function colorString(c) {
    return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
  }

  function draw() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var width = stateRef.current.width;
    var height = stateRef.current.height;
    var t = stateRef.current.time;
    var params = stateRef.current.params;

    var colorA = hexToRgb(params.colorA);
    var colorB = hexToRgb(params.colorB);
    var colorC = hexToRgb(params.colorC);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(8,8,12)';
    ctx.fillRect(0, 0, width, height);

    var pixel = Math.max(6, Math.floor(params.pixelSize));
    var cols = Math.ceil(width / pixel);
    var rows = Math.ceil(height / pixel);
    var cx = cols * 0.5;
    var cy = rows * 0.5;

    for (var y = 0; y < rows; y += 1) {
      for (var x = 0; x < cols; x += 1) {
        var nx = (x - cx) / Math.max(1, cols);
        var ny = (y - cy) / Math.max(1, rows);
        var dist = Math.sqrt(nx * nx + ny * ny);
        var angle = Math.atan2(ny, nx);

        var wave1 = Math.sin((nx * 14.0 + t * 0.25 * SPEED) + Math.cos(ny * 6.0));
        var wave2 = Math.cos((ny * 15.0 - t * 0.22 * SPEED) + Math.sin(nx * 8.0));
        var ring = Math.sin(dist * 26.0 - t * 0.3 * SPEED + angle * params.swirl * 4.0);
        var checker = ((x + y + Math.floor(t * 2.0)) % 2 === 0 ? 1 : -1) * 0.15;

        var field = wave1 * 0.35 + wave2 * 0.3 + ring * (0.35 + params.intensity * 0.45) + checker;
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.4 * SPEED + dist * 18.0);
        var val = 0.5 + 0.5 * Math.sin(field * 3.2 + pulse * 2.0);

        var c1 = mixColor(colorA, colorB, Math.max(0, Math.min(1, val)));
        var c2 = mixColor(c1, colorC, Math.max(0, Math.min(1, dist * 1.8 + pulse * 0.25)));

        var glow = 0.75 + pulse * 0.25;
        var finalColor = {
          r: Math.max(0, Math.min(255, Math.round(c2.r * glow))),
          g: Math.max(0, Math.min(255, Math.round(c2.g * glow))),
          b: Math.max(0, Math.min(255, Math.round(c2.b * glow)))
        };

        ctx.fillStyle = colorString(finalColor);
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel);

        if (pixel > 10) {
          var shade = {
            r: Math.max(0, Math.floor(finalColor.r * 0.72)),
            g: Math.max(0, Math.floor(finalColor.g * 0.72)),
            b: Math.max(0, Math.floor(finalColor.b * 0.72))
          };
          ctx.fillStyle = colorString(shade);
          ctx.fillRect(x * pixel, y * pixel + pixel - 2, pixel, 2);
          ctx.fillRect(x * pixel + pixel - 2, y * pixel, 2, pixel);
        }
      }
    }

    var grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function animate() {
    var last = performance.now();

    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stateRef.current.time += dt * (0.35 + stateRef.current.params.intensity * 0.2);
      draw();
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
  }

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.colorA = function(v) {
      stateRef.current.params.colorA = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.colorB = function(v) {
      stateRef.current.params.colorB = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.colorC = function(v) {
      stateRef.current.params.colorC = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.pixelSize = function(v) {
      stateRef.current.params.pixelSize = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.intensity = function(v) {
      stateRef.current.params.intensity = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.swirl = function(v) {
      stateRef.current.params.swirl = v;
      forceUpdate(function(n) {
        return n + 1;
      });
    };
  }

  React.useEffect(function() {
    setupRenderer();
    registerParams();
    animate();

    roRef.current = new ResizeObserver(function() {
      setupRenderer();
    });

    if (wrapRef.current) {
      roRef.current.observe(wrapRef.current);
    }

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (roRef.current) {
        roRef.current.disconnect();
      }
    };
  }, []);

  return React.createElement(
    'div',
    {
      ref: wrapRef,
      className: 'dark-component',
      style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0d0d', overflow: 'hidden' }
    },
    React.createElement('canvas', {
      ref: canvasRef,
      style: { width: '100%', height: '100%', display: 'block' }
    })
  );
}