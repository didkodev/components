export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    pixelSize: 18,
    speed: 1.44,
    intensity: 0.83,
    colorA: '#ff5f6d',
    colorB: '#845ef7',
    invert: false
  });

  var forceRender = React.useState(0);
  var setTick = forceRender[1];

  function registerParams() {
    window.__paramSetters = {
      pixelSize: function(value) {
        paramsRef.current.pixelSize = value;
      },
      speed: function(value) {
        paramsRef.current.speed = value;
      },
      intensity: function(value) {
        paramsRef.current.intensity = value;
      },
      colorA: function(value) {
        paramsRef.current.colorA = value;
      },
      colorB: function(value) {
        paramsRef.current.colorB = value;
      },
      invert: function(value) {
        paramsRef.current.invert = value;
      }
    };
  }

  function hexToRgb(hex) {
    var safe = (hex || '#000000').replace('#', '');
    var full = safe.length === 3
      ? safe.charAt(0) + safe.charAt(0) + safe.charAt(1) + safe.charAt(1) + safe.charAt(2) + safe.charAt(2)
      : safe;
    var num = parseInt(full, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function setupRenderer(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
    return ctx;
  }

  function draw(ctx, canvas, time) {
    if (!ctx) {
      return;
    }

    var width = canvas.width;
    var height = canvas.height;
    var p = paramsRef.current;
    var rgbA = hexToRgb(p.colorA);
    var rgbB = hexToRgb(p.colorB);

    var cell = Math.max(6, Math.floor(p.pixelSize * (window.devicePixelRatio || 1)));
    var cols = Math.ceil(width / cell);
    var rows = Math.ceil(height / cell);

    ctx.clearRect(0, 0, width, height);

    for (var y = 0; y < rows; y += 1) {
      for (var x = 0; x < cols; x += 1) {
        var nx = cols <= 1 ? 0 : x / (cols - 1);
        var ny = rows <= 1 ? 0 : y / (rows - 1);

        var wave1 = Math.sin((nx * 8.0 + time * p.speed * 0.7) * Math.PI);
        var wave2 = Math.cos((ny * 10.0 - time * p.speed * 0.9) * Math.PI);
        var radialX = nx - 0.5;
        var radialY = ny - 0.5;
        var dist = Math.sqrt(radialX * radialX + radialY * radialY);
        var ripple = Math.sin((dist * 20.0 - time * p.speed * 2.2) * Math.PI);
        var diag = Math.sin(((nx + ny) * 7.0 + time * p.speed * 0.5) * Math.PI);

        var value = 0.0;
        value += wave1 * 0.32;
        value += wave2 * 0.24;
        value += ripple * (0.28 + p.intensity * 0.18);
        value += diag * 0.16;
        value += smoothstep(0.7, 0.0, dist) * 0.22;
        value = value * 0.5 + 0.5;

        var poster = Math.floor(value * (3 + Math.floor(p.intensity * 5))) / (2 + Math.floor(p.intensity * 5));
        var dither = (((x + y * 3) % 4) / 4 - 0.375) * 0.18;
        var shade = clamp(poster + dither * p.intensity, 0, 1);

        if (p.invert) {
          shade = 1 - shade;
        }

        var r = Math.floor(mix(rgbA.r, rgbB.r, shade) * 255);
        var g = Math.floor(mix(rgbA.g, rgbB.g, shade) * 255);
        var b = Math.floor(mix(rgbA.b, rgbB.b, shade) * 255);

        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    var glowAlpha = 0.06 + p.intensity * 0.08;
    var edgeA = Math.floor(mix(rgbA.r, rgbB.r, 0.35) * 255);
    var edgeB = Math.floor(mix(rgbA.g, rgbB.g, 0.65) * 255);
    var edgeC = Math.floor(mix(rgbA.b, rgbB.b, 0.5) * 255);
    ctx.strokeStyle = 'rgba(' + edgeA + ',' + edgeB + ',' + edgeC + ',' + glowAlpha + ')';
    ctx.lineWidth = Math.max(1, Math.floor(cell * 0.08));

    for (var gx = 0; gx < cols; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(gx * cell + 0.5, 0);
      ctx.lineTo(gx * cell + 0.5, height);
      ctx.stroke();
    }

    for (var gy = 0; gy < rows; gy += 1) {
      ctx.beginPath();
      ctx.moveTo(0, gy * cell + 0.5);
      ctx.lineTo(width, gy * cell + 0.5);
      ctx.stroke();
    }
  }

  function animate() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var now = performance.now() * 0.001 * SPEED;
    draw(ctx, canvas, now);
    frameRef.current = requestAnimationFrame(animate);
  }

  React.useEffect(function() {
    registerParams();

    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setupRenderer(canvas);

    resizeObserverRef.current = new ResizeObserver(function() {
      setupRenderer(canvas);
      setTick(function(v) {
        return v + 1;
      });
    });

    resizeObserverRef.current.observe(canvas);

    frameRef.current = requestAnimationFrame(animate);

    return function() {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
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
        display: 'block'
      }
    })
  );
}