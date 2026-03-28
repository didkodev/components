export default function PixelArtShader185898() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    pixelSize: 18,
    flowSpeed: 1.55,
    intensity: 0.98,
    colorA: '#ff4d6d',
    colorB: '#7c3aed',
    colorC: '#00d4ff'
  });

  var forceRender = React.useState(0)[1];

  function registerParams() {
    window.__paramSetters = {
      pixelSize: function(v) {
        paramsRef.current.pixelSize = v;
      },
      flowSpeed: function(v) {
        paramsRef.current.flowSpeed = v;
      },
      intensity: function(v) {
        paramsRef.current.intensity = v;
      },
      colorA: function(v) {
        paramsRef.current.colorA = v;
      },
      colorB: function(v) {
        paramsRef.current.colorB = v;
      },
      colorC: function(v) {
        paramsRef.current.colorC = v;
      }
    };
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
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function fract(x) {
    return x - Math.floor(x);
  }

  function noise(x, y) {
    var v = Math.sin(x * 127.1 + y * 311.7 + 185898 * 0.0001) * 43758.5453123;
    return fract(v);
  }

  function fbm(x, y, t) {
    var n = 0;
    var amp = 0.5;
    var freq = 1.0;
    var i;
    for (i = 0; i < 4; i++) {
      n += noise(x * freq + t * 0.15 * freq, y * freq - t * 0.09 * freq) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return n;
  }

  function setupRenderer(canvas) {
    var ctx = canvas.getContext('2d', { alpha: false });
    return ctx;
  }

  function draw(ctx, canvas, time) {
    var width = canvas.width;
    var height = canvas.height;
    var params = paramsRef.current;

    var pixel = Math.max(6, Math.floor(params.pixelSize));
    var cols = Math.ceil(width / pixel);
    var rows = Math.ceil(height / pixel);

    var c1 = hexToRgb(params.colorA);
    var c2 = hexToRgb(params.colorB);
    var c3 = hexToRgb(params.colorC);

    ctx.fillStyle = 'rgb(8,8,12)';
    ctx.fillRect(0, 0, width, height);

    var y;
    for (y = 0; y < rows; y++) {
      var x;
      for (x = 0; x < cols; x++) {
        var nx = x / cols - 0.5;
        var ny = y / rows - 0.5;

        var angle = Math.atan2(ny, nx);
        var dist = Math.sqrt(nx * nx + ny * ny);

        var swirl = Math.sin(angle * 8.0 + time * 1.2 * params.flowSpeed + dist * 18.0) * 0.5 + 0.5;
        var field = fbm(
          nx * (4.0 + params.intensity * 2.5) + swirl * 0.8,
          ny * (4.0 + params.intensity * 2.5) - swirl * 0.8,
          time * SPEED * params.flowSpeed
        );

        var bands = Math.floor((field + swirl * 0.6) * (5 + Math.floor(params.intensity * 7)));
        var quant = bands / (5 + Math.floor(params.intensity * 7));
        var pulse = Math.sin(time * 2.2 * params.flowSpeed + dist * 22.0 - angle * 4.0) * 0.5 + 0.5;
        var glow = smoothstep(0.25, 0.95, quant * 0.8 + pulse * 0.35);

        var mid = mixColor(c1, c2, clamp(quant, 0, 1));
        var fin = mixColor(mid, c3, clamp(glow * params.intensity, 0, 1));

        var vignette = 1.0 - smoothstep(0.15, 0.75, dist);
        var brightness = 0.35 + glow * 0.75 + vignette * 0.2;

        var rr = Math.floor(clamp(fin.r * brightness, 0, 255));
        var gg = Math.floor(clamp(fin.g * brightness, 0, 255));
        var bb = Math.floor(clamp(fin.b * brightness, 0, 255));

        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
        ctx.fillRect(x * pixel, y * pixel, pixel - 1, pixel - 1);
      }
    }
  }

  function animate(ctx, canvas) {
    var start = performance.now();

    function loop(now) {
      var t = ((now - start) / 1000) * SPEED;
      draw(ctx, canvas, t);
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
  }

  React.useEffect(function() {
    registerParams();

    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = setupRenderer(canvas);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      forceRender(function(n) {
        return n + 1;
      });
    }

    resize();

    resizeObserverRef.current = new ResizeObserver(function() {
      resize();
    });

    resizeObserverRef.current.observe(canvas);
    animate(ctx, canvas);

    return function() {
      cancelAnimationFrame(frameRef.current);
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