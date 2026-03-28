export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var roRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var stateRef = React.useRef({
    time: 0,
    width: 1,
    height: 1,
    pixelSize: 28,
    flow: 0.95,
    contrast: 1.35,
    glow: 0.72,
    colorA: [0.12, 0.42, 0.95],
    colorB: [0.78, 0.18, 0.92],
    invert: false
  });

  var forceRender = React.useState(0)[1];

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

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
      'uniform float u_pixelSize;',
      'uniform float u_flow;',
      'uniform float u_contrast;',
      'uniform float u_glow;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform float u_invert;',
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
      '  for (int i = 0; i < 5; i++) {',
      '    v += noise(p) * a;',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 res = u_resolution;',
      '  float px = max(4.0, u_pixelSize);',
      '  vec2 grid = floor(v_uv * res / px) * px / res;',
      '  vec2 p = grid * 2.0 - 1.0;',
      '  p.x *= res.x / max(res.y, 1.0);',
      '',
      '  float t = u_time * (0.25 + u_flow * 1.35);',
      '  vec2 q = vec2(',
      '    fbm(p * 1.8 + vec2(t * 0.7, -t * 0.3)),',
      '    fbm(p * 1.8 + vec2(-t * 0.4, t * 0.6) + 4.0)',
      '  );',
      '',
      '  float bands = sin((p.x + q.x * 1.8) * 8.0 + t * 2.0) * 0.5 + 0.5;',
      '  float blobs = fbm(p * 3.2 + q * 2.5 + vec2(0.0, t * 0.9));',
      '  float rings = sin(length(p + q * 0.45) * 16.0 - t * 3.0) * 0.5 + 0.5;',
      '',
      '  float field = mix(blobs, bands, 0.4) + rings * 0.25;',
      '  field = pow(clamp(field, 0.0, 1.0), max(0.4, 1.6 - u_contrast * 0.45));',
      '',
      '  float steps = 6.0 + floor(u_contrast * 2.0);',
      '  field = floor(field * steps) / steps;',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, field);',
      '  float edge = smoothstep(0.18, 0.88, field) - smoothstep(0.72, 1.0, field);',
      '  col += mix(u_colorA, u_colorB, 0.5) * edge * u_glow * 0.45;',
      '',
      '  float checker = mod(floor(grid.x * res.x / px) + floor(grid.y * res.y / px), 2.0);',
      '  col *= 0.92 + checker * 0.08;',
      '',
      '  if (u_invert > 0.5) {',
      '    col = 1.0 - col;',
      '  }',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    programRef.current = program;

    var buffer = gl.createBuffer();
    bufferRef.current = buffer;
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

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      flow: gl.getUniformLocation(program, 'u_flow'),
      contrast: gl.getUniformLocation(program, 'u_contrast'),
      glow: gl.getUniformLocation(program, 'u_glow'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      invert: gl.getUniformLocation(program, 'u_invert')
    };
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    var gl = glRef.current;
    if (!canvas || !wrap || !gl) return;

    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.floor(rect.width * dpr));
    var height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      stateRef.current.width = width;
      stateRef.current.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw() {
    var gl = glRef.current;
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    if (!gl || !program || !uniforms) return;

    var s = stateRef.current;

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, s.width, s.height);
    gl.uniform1f(uniforms.time, s.time);
    gl.uniform1f(uniforms.pixelSize, s.pixelSize);
    gl.uniform1f(uniforms.flow, s.flow);
    gl.uniform1f(uniforms.contrast, s.contrast);
    gl.uniform1f(uniforms.glow, s.glow);
    gl.uniform3f(uniforms.colorA, s.colorA[0], s.colorA[1], s.colorA[2]);
    gl.uniform3f(uniforms.colorB, s.colorB[0], s.colorB[1], s.colorB[2]);
    gl.uniform1f(uniforms.invert, s.invert ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    stateRef.current.time = now * 0.001 * SPEED;
    draw();
    frameRef.current = requestAnimationFrame(animate);
  }

  function hexToRgb01(hex) {
    var clean = (hex || '#000000').replace('#', '');
    var full = clean.length === 3
      ? clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2)
      : clean;
    var num = parseInt(full, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelArtShader = {
      pixelSize: function(v) {
        stateRef.current.pixelSize = v;
        forceRender(function(n) { return n + 1; });
      },
      flow: function(v) {
        stateRef.current.flow = v;
        forceRender(function(n) { return n + 1; });
      },
      contrast: function(v) {
        stateRef.current.contrast = v;
        forceRender(function(n) { return n + 1; });
      },
      glow: function(v) {
        stateRef.current.glow = v;
        forceRender(function(n) { return n + 1; });
      },
      colorA: function(v) {
        stateRef.current.colorA = hexToRgb01(v);
        forceRender(function(n) { return n + 1; });
      },
      colorB: function(v) {
        stateRef.current.colorB = hexToRgb01(v);
        forceRender(function(n) { return n + 1; });
      }
    };
  }

  React.useEffect(function() {
    setupRenderer();
    resizeCanvas();
    registerParams();

    if (wrapRef.current) {
      roRef.current = new ResizeObserver(function() {
        resizeCanvas();
      });
      roRef.current.observe(wrapRef.current);
    }

    frameRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (roRef.current) roRef.current.disconnect();
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
      if (glRef.current && bufferRef.current) {
        glRef.current.deleteBuffer(bufferRef.current);
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
        display: 'block',
        imageRendering: 'pixelated'
      }
    })
  );
}