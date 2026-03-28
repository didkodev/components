export default function MinecraftShader399413() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    voxelScale: 22,
    tunnelDepth: 0.78,
    glowMix: 0.52,
    colorA: '#2f7d32',
    colorB: '#4a90e2',
    pulse: true
  });

  var stateRef = React.useRef({
    width: 1,
    height: 1,
    dpr: 1,
    time: 0
  });

  var dummyState = React.useState(0);

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.MinecraftShader399413 = {
      voxelScale: function (value) {
        paramsRef.current.voxelScale = value;
      },
      tunnelDepth: function (value) {
        paramsRef.current.tunnelDepth = value;
      },
      glowMix: function (value) {
        paramsRef.current.glowMix = value;
      },
      colorA: function (value) {
        paramsRef.current.colorA = value;
      },
      colorB: function (value) {
        paramsRef.current.colorB = value;
      },
      pulse: function (value) {
        paramsRef.current.pulse = value;
      }
    };
  }

  function hexToRgb(hex) {
    var safe = (hex || '#000000').replace('#', '');
    var full = safe.length === 3
      ? safe.charAt(0) + safe.charAt(0) + safe.charAt(1) + safe.charAt(1) + safe.charAt(2) + safe.charAt(2)
      : safe;
    var intVal = parseInt(full, 16);
    return {
      r: ((intVal >> 16) & 255) / 255,
      g: ((intVal >> 8) & 255) / 255,
      b: (intVal & 255) / 255
    };
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function fract(v) {
    return v - Math.floor(v);
  }

  function hash(ix, iy) {
    var x = ix * 127.1 + iy * 311.7 + 399413 * 0.001;
    return fract(Math.sin(x) * 43758.5453123);
  }

  function noise(x, y) {
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    var fx = x - ix;
    var fy = y - iy;

    var a = hash(ix, iy);
    var b = hash(ix + 1, iy);
    var c = hash(ix, iy + 1);
    var d = hash(ix + 1, iy + 1);

    var ux = fx * fx * (3 - 2 * fx);
    var uy = fy * fy * (3 - 2 * fy);

    return mix(mix(a, b, ux), mix(c, d, ux), uy);
  }

  function fbm(x, y) {
    var v = 0;
    var a = 0.5;
    var f = 1.0;
    var i;
    for (i = 0; i < 4; i += 1) {
      v += noise(x * f, y * f) * a;
      f *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var parent = canvas.parentElement;
    var bounds = parent.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    stateRef.current.width = Math.max(1, Math.floor(bounds.width));
    stateRef.current.height = Math.max(1, Math.floor(bounds.height));
    stateRef.current.dpr = dpr;

    canvas.width = Math.floor(stateRef.current.width * dpr);
    canvas.height = Math.floor(stateRef.current.height * dpr);
    canvas.style.width = stateRef.current.width + 'px';
    canvas.style.height = stateRef.current.height + 'px';
  }

  function draw() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var width = stateRef.current.width;
    var height = stateRef.current.height;
    var dpr = stateRef.current.dpr;
    var time = stateRef.current.time;
    var p = paramsRef.current;

    var colorA = hexToRgb(p.colorA);
    var colorB = hexToRgb(p.colorB);
    var img = ctx.createImageData(canvas.width, canvas.height);
    var data = img.data;

    var block = Math.max(6, Math.floor(p.voxelScale));
    var cols = Math.ceil(width / block);
    var rows = Math.ceil(height / block);

    var baseSpeed = 0.18 + 0.06 * SPEED;
    var zShift = time * baseSpeed * (0.7 + p.tunnelDepth);
    var pulseScale = p.pulse ? 0.85 + 0.15 * Math.sin(time * 1.6) : 1.0;
    var horizon = height * 0.52;

    var gx;
    var gy;
    for (gy = 0; gy < rows; gy += 1) {
      for (gx = 0; gx < cols; gx += 1) {
        var px = gx * block;
        var py = gy * block;

        var cx = px + block * 0.5;
        var cy = py + block * 0.5;

        var nx = (cx / width) * 2 - 1;
        var ny = (cy / height) * 2 - 1;

        var perspectiveY = (cy - horizon) / Math.max(40, height * 0.42);
        var depth = 1.0 / Math.max(0.16, perspectiveY + p.tunnelDepth * 0.22 + 0.24);

        var tunnelX = nx * depth * 2.8;
        var tunnelZ = depth + zShift;

        var worldX = tunnelX * 4.0;
        var worldY = tunnelZ * 2.0;

        var voxel = Math.floor(worldX * 2.0);
        var layer = Math.floor(worldY * 2.0);

        var n = fbm(voxel * 0.23 + 3.1, layer * 0.19 + 9.7);
        var ore = noise(voxel * 0.91 + 6.0, layer * 0.77 + 2.0);
        var edge = Math.abs(fract(worldX * 2.0) - 0.5) * 2.0;
        var band = Math.abs(fract(worldY * 2.0) - 0.5) * 2.0;

        var cubeMask = 1.0 - clamp(Math.max(edge, band) * 1.35, 0, 1);
        var terrain = clamp((n - 0.35) * 1.8, 0, 1);
        var cave = clamp((0.62 - n) * 2.2, 0, 1);
        var oreMask = clamp((ore - 0.72) * 4.0, 0, 1) * terrain;

        var radial = Math.sqrt(nx * nx + ny * ny * 0.8);
        var portal = clamp(1.0 - radial * 0.95, 0, 1);
        var glow = Math.pow(portal, 2.0) * p.glowMix * pulseScale;

        var gradT = clamp((cy / height) * 0.85 + 0.15 * Math.sin(time * 0.7 + nx * 2.4), 0, 1);
        var baseR = mix(colorA.r, colorB.r, gradT);
        var baseG = mix(colorA.g, colorB.g, gradT);
        var baseB = mix(colorA.b, colorB.b, gradT);

        var stone = 0.10 + terrain * 0.28 + cubeMask * 0.14;
        var dirt = 0.08 + terrain * 0.22 + (1.0 - cave) * 0.05;

        var r = baseR * (stone + glow * 0.9) + oreMask * 0.25 + portal * 0.05;
        var g = baseG * (stone + glow * 1.1) + oreMask * 0.18 + terrain * 0.05;
        var b = baseB * (dirt + glow * 1.4) + oreMask * 0.3 + cave * 0.04;

        var shade = 0.62 + 0.38 * cubeMask;
        var fog = clamp(1.0 - depth * 0.12, 0.2, 1.0);

        r = clamp(r * shade * fog, 0, 1);
        g = clamp(g * shade * fog, 0, 1);
        b = clamp(b * shade * fog, 0, 1);

        if (cy < horizon) {
          var skyT = clamp(cy / horizon, 0, 1);
          var skyGlow = Math.pow(1.0 - radial, 3.0) * 0.18 * p.glowMix;
          r = mix(baseB * 0.12, baseR * 0.28 + skyGlow, skyT);
          g = mix(baseB * 0.16, baseG * 0.32 + skyGlow, skyT);
          b = mix(baseAValue(colorA, colorB, gradT, 'b') * 0.22, baseB * 0.52 + skyGlow * 1.2, skyT);
        }

        var startY = Math.floor(py * dpr);
        var endY = Math.min(canvas.height, Math.floor((py + block) * dpr));
        var startX = Math.floor(px * dpr);
        var endX = Math.min(canvas.width, Math.floor((px + block) * dpr));

        var iy;
        var ix;
        for (iy = startY; iy < endY; iy += 1) {
          for (ix = startX; ix < endX; ix += 1) {
            var idx = (iy * canvas.width + ix) * 4;
            data[idx] = Math.floor(r * 255);
            data[idx + 1] = Math.floor(g * 255);
            data[idx + 2] = Math.floor(b * 255);
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  }

  function baseAValue(colorA, colorB, gradT, channel) {
    if (channel === 'r') {
      return mix(colorA.r, colorB.r, gradT);
    }
    if (channel === 'g') {
      return mix(colorA.g, colorB.g, gradT);
    }
    return mix(colorA.b, colorB.b, gradT);
  }

  function animate() {
    stateRef.current.time += 0.016 * (0.7 + SPEED * 0.6);
    draw();
    frameRef.current = requestAnimationFrame(animate);
  }

  React.useEffect(function () {
    registerParams();
    setupRenderer();

    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var parent = canvas.parentElement;

    resizeObserverRef.current = new ResizeObserver(function () {
      setupRenderer();
    });

    resizeObserverRef.current.observe(parent);
    frameRef.current = requestAnimationFrame(animate);

    return function () {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (window.__paramSetters && window.__paramSetters.MinecraftShader399413) {
        delete window.__paramSetters.MinecraftShader399413;
      }
    };
  }, []);

  return (
    <div
      className="dark-component"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0d0d' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}