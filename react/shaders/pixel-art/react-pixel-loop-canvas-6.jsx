export default function PixelArtShader758556() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var rafRef = React.useRef(0);
  var roRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformRef = React.useRef({});
  var startRef = React.useRef(0);
  var sizeRef = React.useRef({ width: 1, height: 1, dpr: 1 });

  var [params, setParams] = React.useState({
    colorA: '#2a1a5e',
    colorB: '#0f6bd9',
    colorC: '#19c37d',
    pixelSize: 22,
    warp: 0.56,
    speed: 1.05
  });

  // Register parameter setters for external control
  React.useEffect(function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['colorA'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorA: v }); });
    };
    window.__paramSetters['colorB'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorB: v }); });
    };
    window.__paramSetters['colorC'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorC: v }); });
    };
    window.__paramSetters['pixelSize'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { pixelSize: Number(v) }); });
    };
    window.__paramSetters['warp'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { warp: Number(v) }); });
    };
    window.__paramSetters['speed'] = function(v) {
      setParams(function(p) { return Object.assign({}, p, { speed: Number(v) }); });
    };
  }, []);

  // Convert hex color to normalized rgb
  function hexToRgb(hex) {
    var safe = (hex || '#000000').replace('#', '');
    var full = safe.length === 3
      ? safe.charAt(0) + safe.charAt(0) + safe.charAt(1) + safe.charAt(1) + safe.charAt(2) + safe.charAt(2)
      : safe;
    var num = parseInt(full, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  // Compile a shader
  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Link shader program
  function createProgram(gl, vertexSource, fragmentSource) {
    var vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  // Setup WebGL renderer and geometry
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    var vertexSource = [
      'attribute vec2 a_position;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_position * 0.5 + 0.5;',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_pixelSize;',
      'uniform float u_warp;',
      'uniform float u_speed;',
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
      '    v += a * noise(p);',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 minRes = vec2(min(u_resolution.x, u_resolution.y));',
      '  vec2 uv = gl_FragCoord.xy / minRes.x;',
      '  vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / minRes.x;',
      '',
      '  float px = max(4.0, u_pixelSize);',
      '  vec2 grid = floor(gl_FragCoord.xy / px) * px;',
      '  vec2 puv = (grid - 0.5 * u_resolution.xy) / minRes.x;',
      '',
      '  float t = u_time * u_speed * 0.55;',
      '  float radial = length(puv);',
      '  float angle = atan(puv.y, puv.x);',
      '',
      '  float bands = sin(angle * 6.0 + t * 1.7 + radial * 8.0 * (0.5 + u_warp));',
      '  float swirl = cos(radial * 18.0 - t * 2.2 + bands * 1.6);',
      '  float field = fbm(puv * (4.0 + u_warp * 5.0) + vec2(t * 0.7, -t * 0.45));',
      '',
      '  float diamonds = abs(fract((puv.x + puv.y + t * 0.15) * 6.0) - 0.5) + abs(fract((puv.x - puv.y - t * 0.12) * 6.0) - 0.5);',
      '  float shape = smoothstep(0.42, 0.08, diamonds + field * 0.18 - u_warp * 0.08);',
      '',
      '  float pulse = 0.5 + 0.5 * sin(t * 2.0 + radial * 16.0 + field * 4.0);',
      '  float layer = mix(swirl * 0.5 + 0.5, shape, 0.55 + 0.25 * pulse);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, smoothstep(0.18, 0.72, layer));',
      '  col = mix(col, u_colorC, smoothstep(0.62, 0.95, field + pulse * 0.25));',
      '',
      '  float vignette = smoothstep(1.25, 0.15, length(centered));',
      '  float scan = 0.92 + 0.08 * sin(gl_FragCoord.y * 0.18 + t * 4.0);',
      '  float poster = floor(col.r * 4.0) / 4.0;',
      '  poster += floor(col.g * 4.0) / 4.0;',
      '  poster += floor(col.b * 4.0) / 4.0;',
      '  col = mix(col, vec3(poster / 3.0), 0.18);',
      '  col *= vignette * scan;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) return;

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

    gl.useProgram(program);

    var positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    programRef.current = program;
    bufferRef.current = buffer;
    uniformRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      warp: gl.getUniformLocation(program, 'u_warp'),
      speed: gl.getUniformLocation(program, 'u_speed')
    };
  }

  // Draw the current frame
  function draw(now) {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) return;

    var width = sizeRef.current.width;
    var height = sizeRef.current.height;

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);

    var cA = hexToRgb(params.colorA);
    var cB = hexToRgb(params.colorB);
    var cC = hexToRgb(params.colorC);

    gl.uniform2f(uniformRef.current.resolution, width, height);
    gl.uniform1f(uniformRef.current.time, now);
    gl.uniform3f(uniformRef.current.colorA, cA[0], cA[1], cA[2]);
    gl.uniform3f(uniformRef.current.colorB, cB[0], cB[1], cB[2]);
    gl.uniform3f(uniformRef.current.colorC, cC[0], cC[1], cC[2]);
    gl.uniform1f(uniformRef.current.pixelSize, params.pixelSize);
    gl.uniform1f(uniformRef.current.warp, params.warp);
    gl.uniform1f(uniformRef.current.speed, params.speed * SPEED);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Run the animation loop continuously
  function animate(ts) {
    if (!startRef.current) startRef.current = ts;
    var now = (ts - startRef.current) * 0.001;
    draw(now);
    rafRef.current = window.requestAnimationFrame(animate);
  }

  // Keep the canvas in sync with container size
  React.useEffect(function setupResizeObserver() {
    if (!wrapRef.current || !canvasRef.current) return;

    function resize() {
      var rect = wrapRef.current.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      sizeRef.current = { width: width, height: height, dpr: dpr };
      if (canvasRef.current.width !== width) canvasRef.current.width = width;
      if (canvasRef.current.height !== height) canvasRef.current.height = height;
      canvasRef.current.style.width = rect.width + 'px';
      canvasRef.current.style.height = rect.height + 'px';
    }

    resize();
    roRef.current = new ResizeObserver(function () {
      resize();
    });
    roRef.current.observe(wrapRef.current);

    return function () {
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
  }, []);

  // Initialize renderer once
  React.useEffect(function initRenderer() {
    setupRenderer();
    rafRef.current = window.requestAnimationFrame(animate);

    return function () {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      var gl = glRef.current;
      if (gl) {
        if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
        if (programRef.current) gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  // Root fullscreen shader container
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
        display: 'block',
        imageRendering: 'pixelated'
      }
    })
  );
}