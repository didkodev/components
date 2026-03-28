export default function MinecraftShaderLoop() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var paramsRef = React.useRef({
    colorA: '#2a9d8f',
    colorB: '#588157',
    blockScale: 18,
    pulse: 0.35,
    glow: 0.22,
    warp: true
  });

  var [, setTick] = React.useState(0);

  React.useEffect(function () {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var gl = setupRenderer(canvas);
    if (!gl) {
      return;
    }

    glRef.current = gl;

    registerParams();
    resizeCanvas();

    var observer = new ResizeObserver(function () {
      resizeCanvas();
    });

    observer.observe(canvas);
    resizeObserverRef.current = observer;

    animate();

    return function () {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
      if (glRef.current && bufferRef.current) {
        glRef.current.deleteBuffer(bufferRef.current);
      }
    };
  }, []);

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.colorA = function (value) {
      paramsRef.current.colorA = value;
      setTick(function (n) {
        return n + 1;
      });
    };
    window.__paramSetters.colorB = function (value) {
      paramsRef.current.colorB = value;
      setTick(function (n) {
        return n + 1;
      });
    };
    window.__paramSetters.blockScale = function (value) {
      paramsRef.current.blockScale = value;
      setTick(function (n) {
        return n + 1;
      });
    };
    window.__paramSetters.pulse = function (value) {
      paramsRef.current.pulse = value;
      setTick(function (n) {
        return n + 1;
      });
    };
    window.__paramSetters.glow = function (value) {
      paramsRef.current.glow = value;
      setTick(function (n) {
        return n + 1;
      });
    };
    window.__paramSetters.warp = function (value) {
      paramsRef.current.warp = value;
      setTick(function (n) {
        return n + 1;
      });
    };
  }

  function hexToRgb(hex) {
    var safe = (hex || '#000000').replace('#', '');
    var normalized = safe.length === 3
      ? safe.charAt(0) + safe.charAt(0) + safe.charAt(1) + safe.charAt(1) + safe.charAt(2) + safe.charAt(2)
      : safe;
    var intVal = parseInt(normalized, 16);
    return [
      ((intVal >> 16) & 255) / 255,
      ((intVal >> 8) & 255) / 255,
      (intVal & 255) / 255
    ];
  }

  function setupRenderer(canvas) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) {
      return null;
    }

    var vertexSource = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision highp float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform float u_blockScale;',
      'uniform float u_pulse;',
      'uniform float u_glow;',
      'uniform float u_warp;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',
      '',
      'float noise(vec2 p) {',
      '  vec2 i = floor(p);',
      '  vec2 f = fract(p);',
      '  float a = hash(i);',
      '  float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0));',
      '  float d = hash(i + vec2(1.0, 1.0));',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      '',
      'float fbm(vec2 p) {',
      '  float v = 0.0;',
      '  float a = 0.5;',
      '  for (int i = 0; i < 4; i++) {',
      '    v += noise(p) * a;',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  vec2 p = uv;',
      '  p.x *= u_resolution.x / u_resolution.y;',
      '',
      '  float t = u_time * 1.8;',
      '  float warpAmt = u_warp > 0.5 ? 1.0 : 0.0;',
      '  vec2 drift = vec2(sin(t * 0.25), cos(t * 0.22)) * 0.15;',
      '  vec2 world = p + drift;',
      '',
      '  float w = fbm(world * 1.8 + vec2(t * 0.08, -t * 0.06));',
      '  world += warpAmt * (vec2(w - 0.5, fbm(world * 2.2 - t * 0.07) - 0.5) * 0.22);',
      '',
      '  float scale = max(4.0, u_blockScale);',
      '  vec2 gridUv = world * scale;',
      '  vec2 cell = floor(gridUv);',
      '  vec2 local = fract(gridUv);',
      '',
      '  float terrain = fbm(cell * 0.12 + vec2(0.0, t * 0.12));',
      '  float ore = step(0.82, hash(cell * 1.73 + floor(t * 0.2)));',
      '  float edge = max(step(0.92, local.x), step(0.92, local.y));',
      '  float bevel = smoothstep(0.0, 0.12, local.x) * smoothstep(0.0, 0.12, local.y);',
      '  bevel *= smoothstep(0.0, 0.12, 1.0 - local.x) * smoothstep(0.0, 0.12, 1.0 - local.y);',
      '',
      '  float checker = mod(cell.x + cell.y, 2.0);',
      '  float pulse = sin(t * 1.4 + terrain * 6.2831) * 0.5 + 0.5;',
      '  float raise = u_pulse * pulse * (0.35 + 0.65 * terrain);',
      '',
      '  vec3 base = mix(u_colorA, u_colorB, terrain);',
      '  base = mix(base * 0.78, base * 1.18, checker * 0.18 + bevel * 0.22 + raise);',
      '',
      '  vec3 oreColor = mix(u_colorB, u_colorA, 0.65) * 1.35;',
      '  base = mix(base, oreColor, ore * 0.55);',
      '',
      '  float shadow = 1.0 - edge * 0.18;',
      '  base *= shadow;',
      '',
      '  float emissive = ore * pulse * u_glow * 1.8;',
      '  base += oreColor * emissive;',
      '',
      '  float vignette = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.2, 1.0)));',
      '  base *= vignette;',
      '',
      '  gl_FragColor = vec4(base, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      blockScale: gl.getUniformLocation(program, 'u_blockScale'),
      pulse: gl.getUniformLocation(program, 'u_pulse'),
      glow: gl.getUniformLocation(program, 'u_glow'),
      warp: gl.getUniformLocation(program, 'u_warp')
    };

    programRef.current = program;
    bufferRef.current = buffer;

    return gl;
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    var gl = glRef.current;
    if (!canvas || !gl) {
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.floor(canvas.clientWidth * dpr);
    var height = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(time) {
    var gl = glRef.current;
    if (!gl) {
      return;
    }

    var params = paramsRef.current;
    var a = hexToRgb(params.colorA);
    var b = hexToRgb(params.colorB);

    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programRef.current);

    gl.uniform2f(uniformsRef.current.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniformsRef.current.time, time * SPEED);
    gl.uniform3f(uniformsRef.current.colorA, a[0], a[1], a[2]);
    gl.uniform3f(uniformsRef.current.colorB, b[0], b[1], b[2]);
    gl.uniform1f(uniformsRef.current.blockScale, params.blockScale);
    gl.uniform1f(uniformsRef.current.pulse, params.pulse * 0.04);
    gl.uniform1f(uniformsRef.current.glow, params.glow * 0.04);
    gl.uniform1f(uniformsRef.current.warp, params.warp ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate() {
    var start = performance.now();

    function loop(now) {
      var elapsed = (now - start) * 0.001 * 1.9;
      draw(elapsed);
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
  }

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