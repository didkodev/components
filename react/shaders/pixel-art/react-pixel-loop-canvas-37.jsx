export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var animationRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    pixelSize: 18,
    speed: 1.55,
    intensity: 0.76,
    warp: 0.68,
    colorA: '#2b2f77',
    colorB: '#b337a4'
  });

  var [, setTick] = React.useState(0);

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    var h = (hex || '#000000').replace('#', '');
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    var num = parseInt(h, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.floor(rect.width * dpr));
      canvas.height = Math.max(2, Math.floor(rect.height * dpr));
    }

    resizeCanvas();

    resizeObserverRef.current = new ResizeObserver(function() {
      resizeCanvas();
    });

    resizeObserverRef.current.observe(canvas);
  }

  function draw() {
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
    var time = frameRef.current * 0.016 * p.speed * SPEED;

    ctx.clearRect(0, 0, width, height);

    var rgbA = hexToRgb(p.colorA);
    var rgbB = hexToRgb(p.colorB);

    var basePixel = Math.max(6, Math.floor(p.pixelSize * ((width + height) / 1400)));
    var cols = Math.ceil(width / basePixel);
    var rows = Math.ceil(height / basePixel);

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var nx = x / Math.max(1, cols - 1);
        var ny = y / Math.max(1, rows - 1);

        var gx = nx * 2 - 1;
        var gy = ny * 2 - 1;

        var radial = Math.sqrt(gx * gx + gy * gy);
        var angle = Math.atan2(gy, gx);

        var swirl = Math.sin(angle * 6 + time * 1.8 + radial * 10 * p.warp);
        var waveX = Math.sin(nx * 12 + time * 1.3 + gy * 8 * p.warp);
        var waveY = Math.cos(ny * 10 - time * 1.1 + gx * 7 * p.warp);
        var checker = ((x + y + Math.floor(time * 2)) % 2 === 0) ? 1 : -1;

        var value = 0.5
          + swirl * 0.22 * p.intensity
          + waveX * 0.18 * p.intensity
          + waveY * 0.18 * p.intensity
          + checker * 0.08;

        value = clamp(value, 0, 1);

        var glow = clamp(1 - radial * 0.9, 0, 1);
        var t = clamp(value * 0.8 + glow * 0.2, 0, 1);

        var r = Math.floor(mix(rgbA.r, rgbB.r, t));
        var g = Math.floor(mix(rgbA.g, rgbB.g, t));
        var b = Math.floor(mix(rgbA.b, rgbB.b, t));

        var pulse = 0.82 + 0.18 * Math.sin(time * 2.4 + x * 0.35 + y * 0.18);
        r = Math.floor(clamp(r * pulse, 0, 255));
        g = Math.floor(clamp(g * pulse, 0, 255));
        b = Math.floor(clamp(b * pulse, 0, 255));

        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(x * basePixel, y * basePixel, basePixel + 1, basePixel + 1);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function animate() {
    frameRef.current += 1;
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};

    window.__paramSetters.pixelSize = function(value) {
      paramsRef.current.pixelSize = value;
      setTick(function(v) {
        return v + 1;
      });
    };

    window.__paramSetters.speed = function(value) {
      paramsRef.current.speed = value;
    };

    window.__paramSetters.intensity = function(value) {
      paramsRef.current.intensity = value;
    };

    window.__paramSetters.warp = function(value) {
      paramsRef.current.warp = value;
    };

    window.__paramSetters.colorA = function(value) {
      paramsRef.current.colorA = value;
      setTick(function(v) {
        return v + 1;
      });
    };

    window.__paramSetters.colorB = function(value) {
      paramsRef.current.colorB = value;
      setTick(function(v) {
        return v + 1;
      });
    };
  }

  React.useEffect(function() {
    setupRenderer();
    registerParams();
    animate();

    return function() {
      cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current && canvasRef.current) {
        resizeObserverRef.current.unobserve(canvasRef.current);
      }
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
        display: 'block',
        imageRendering: 'pixelated'
      }
    })
  );
}