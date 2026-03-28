export default function PixelArtShader790802() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var roRef = React.useRef(null);
  var stateRef = React.useRef({
    time: 0,
    width: 0,
    height: 0,
    dpr: 1,
    params: {
      pixelSize: 18,
      flowSpeed: 1.6,
      intensity: 0.22,
      colorA: '#1a1033',
      colorB: '#ff6a3d',
      invert: false
    }
  });

  var forceUpdateRef = React.useRef(0);
  var setTick = React.useState(0)[1];

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelSize = function(v) {
      stateRef.current.params.pixelSize = Math.max(6, Math.min(48, v));
      setTick(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.flowSpeed = function(v) {
      stateRef.current.params.flowSpeed = Math.max(0.2, Math.min(3, v));
      setTick(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.intensity = function(v) {
      stateRef.current.params.intensity = Math.max(0.05, Math.min(0.9, v));
      setTick(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.colorA = function(v) {
      stateRef.current.params.colorA = v;
      setTick(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.colorB = function(v) {
      stateRef.current.params.colorB = v;
      setTick(function(n) {
        return n + 1;
      });
    };
    window.__paramSetters.invert = function(v) {
      stateRef.current.params.invert = !!v;
      setTick(function(n) {
        return n + 1;
      });
    };
  }

  function hexToRgb(hex) {
    var clean = (hex || '').replace('#', '');
    var full = clean.length === 3
      ? clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2)
      : clean;
    var num = parseInt(full || '000000', 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hash(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7 + 790.802) * 43758.5453123;
    return n - Math.floor(n);
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = wrap.getBoundingClientRect();
    var w = Math.max(1, Math.floor(rect.width));
    var h = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    stateRef.current.width = w;
    stateRef.current.height = h;
    stateRef.current.dpr = dpr;
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

    var st = stateRef.current;
    var p = st.params;
    var w = st.width;
    var h = st.height;
    var dpr = st.dpr;
    var t = st.time * p.flowSpeed * SPEED;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);

    var a = hexToRgb(p.colorA);
    var b = hexToRgb(p.colorB);

    var px = Math.max(6, Math.floor(p.pixelSize));
    var cols = Math.ceil(w / px);
    var rows = Math.ceil(h / px);

    var bandAmp = 0.12 + p.intensity * 0.8;
    var swirlAmp = 0.25 + p.intensity * 1.2;
    var pulse = 0.5 + 0.5 * Math.sin(t * 0.9);

    for (var gy = 0; gy < rows; gy++) {
      for (var gx = 0; gx < cols; gx++) {
        var nx = cols <= 1 ? 0 : gx / (cols - 1);
        var ny = rows <= 1 ? 0 : gy / (rows - 1);

        var cx = nx - 0.5;
        var cy = ny - 0.5;
        var dist = Math.sqrt(cx * cx + cy * cy);

        var wave1 = Math.sin(nx * 10.0 + t * 1.4);
        var wave2 = Math.cos(ny * 13.0 - t * 1.1);
        var rings = Math.sin(dist * 24.0 - t * 2.2);
        var diag = Math.sin((nx + ny) * 14.0 + t * 1.7);
        var noise = hash(gx + Math.floor(t * 3.0), gy + Math.floor(t * 2.0));

        var field = 0.0;
        field += wave1 * 0.23;
        field += wave2 * 0.19;
        field += rings * swirlAmp * 0.22;
        field += diag * bandAmp * 0.18;
        field += (noise - 0.5) * p.intensity * 0.6;
        field += pulse * 0.12 - dist * 0.55;

        var q = 0;
        if (field > 0.28) {
          q = 3;
        } else if (field > 0.04) {
          q = 2;
        } else if (field > -0.18) {
          q = 1;
        }

        var mixT = q / 3;
        if (p.invert) {
          mixT = 1 - mixT;
        }

        var rr = Math.floor(lerp(a.r, b.r, mixT));
        var gg = Math.floor(lerp(a.g, b.g, mixT));
        var bb = Math.floor(lerp(a.b, b.b, mixT));

        var edge = smoothstep(0.42, 0.0, Math.abs(field));
        var shade = 0.72 + edge * 0.32 + noise * 0.08;
        rr = Math.floor(clamp(rr * shade, 0, 255));
        gg = Math.floor(clamp(gg * shade, 0, 255));
        bb = Math.floor(clamp(bb * shade, 0, 255));

        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
        ctx.fillRect(gx * px, gy * px, px, px);

        if (q >= 2) {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(gx * px, gy * px + px - 2, px, 2);
        }

        if (q === 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(gx * px + px - 2, gy * px, 2, px);
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var overlay = ctx.createLinearGradient(0, 0, 0, canvas.height);
    overlay.addColorStop(0, 'rgba(0,0,0,0.10)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function animate() {
    stateRef.current.time += 0.016 * stateRef.current.params.flowSpeed;
    draw();
    frameRef.current = requestAnimationFrame(animate);
  }

  React.useEffect(function() {
    registerParams();
    setupRenderer();

    if (wrapRef.current) {
      roRef.current = new ResizeObserver(function() {
        setupRenderer();
      });
      roRef.current.observe(wrapRef.current);
    }

    frameRef.current = requestAnimationFrame(animate);

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