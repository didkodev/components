export default function PixelArtShader811937() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var paramsRef = React.useRef({
    colorA: '#2f6bff',
    colorB: '#7a2cff',
    colorC: '#ff4d8d',
    pixelSize: 18,
    motion: 1.45,
    intensity: 0.37
  });

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  function hexToRgb(hex) {
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

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

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
      'uniform float u_pixelSize;',
      'uniform float u_motion;',
      'uniform float u_intensity;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      '',
      'float hash(vec2 p) {',
      '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
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
      '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
      '}',
      '',
      'float fbm(vec2 p) {',
      '  float v = 0.0;',
      '  float a = 0.5;',
      '  for (int i = 0; i < 5; i++) {',
      '    v += a * noise(p);',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  float aspect = u_resolution.x / max(u_resolution.y, 1.0);',
      '',
      '  vec2 pixelGrid = vec2(max(4.0, u_pixelSize));',
      '  vec2 snapped = floor(gl_FragCoord.xy / pixelGrid) * pixelGrid + pixelGrid * 0.5;',
      '  vec2 puv = snapped / u_resolution.xy;',
      '  vec2 p = puv * 2.0 - 1.0;',
      '  p.x *= aspect;',
      '',
      '  float t = u_time * (0.15 + u_motion * 0.6);',
      '',
      '  float radial = length(p);',
      '  float angle = atan(p.y, p.x);',
      '',
      '  float swirl = sin(angle * 6.0 + t * 1.6 + radial * 8.0);',
      '  float wave = cos((p.x + p.y) * 7.0 - t * 1.2);',
      '  float field = fbm(vec2(',
      '    p.x * 2.3 + swirl * 0.55 + t * 0.7,',
      '    p.y * 2.3 + wave * 0.55 - t * 0.45',
      '  ));',
      '',
      '  float rings = sin(radial * (14.0 + u_intensity * 20.0) - t * 2.0 + field * 4.0);',
      '  float bands = sin(p.y * (10.0 + u_intensity * 18.0) + t * 1.4 + field * 3.0);',
      '  float cells = sin((p.x * 8.0 + field * 5.0) + t) * cos((p.y * 8.0 - field * 5.0) - t * 1.1);',
      '',
      '  float mixA = smoothstep(-0.9, 0.9, rings);',
      '  float mixB = smoothstep(-0.8, 0.8, bands + cells * 0.5);',
      '  float mixC = smoothstep(0.2, 0.95, field + radial * 0.2);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, mixA);',
      '  col = mix(col, u_colorC, mixB * 0.7 + mixC * 0.3);',
      '',
      '  float poster = floor((0.25 + field * 0.75 + mixA * 0.5 + mixB * 0.35) * 5.0) / 4.0;',
      '  col *= 0.65 + poster * 0.65;',
      '',
      '  float scan = 0.92 + 0.08 * sin((snapped.y / pixelGrid.y) * 1.5 + t * 2.0);',
      '  float vignette = smoothstep(1.35, 0.25, radial);',
      '  col *= scan * vignette;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    programRef.current = program;

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

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      motion: gl.getUniformLocation(program, 'u_motion'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC')
    };
  }

  function draw(time) {
    var gl = glRef.current;
    var program = programRef.current;
    var canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    var p = paramsRef.current;
    var cA = hexToRgb(p.colorA);
    var cB = hexToRgb(p.colorB);
    var cC = hexToRgb(p.colorC);

    gl.useProgram(program);
    gl.uniform2f(uniformsRef.current.resolution, width, height);
    gl.uniform1f(uniformsRef.current.time, time * 0.001 * SPEED);
    gl.uniform1f(uniformsRef.current.pixelSize, p.pixelSize);
    gl.uniform1f(uniformsRef.current.motion, p.motion);
    gl.uniform1f(uniformsRef.current.intensity, p.intensity);
    gl.uniform3f(uniformsRef.current.colorA, cA[0], cA[1], cA[2]);
    gl.uniform3f(uniformsRef.current.colorB, cB[0], cB[1], cB[2]);
    gl.uniform3f(uniformsRef.current.colorC, cC[0], cC[1], cC[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    draw(now);
    frameRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.colorA = function(value) {
      paramsRef.current.colorA = value;
    };
    window.__paramSetters.colorB = function(value) {
      paramsRef.current.colorB = value;
    };
    window.__paramSetters.colorC = function(value) {
      paramsRef.current.colorC = value;
    };
    window.__paramSetters.pixelSize = function(value) {
      paramsRef.current.pixelSize = value;
    };
    window.__paramSetters.motion = function(value) {
      paramsRef.current.motion = value;
    };
    window.__paramSetters.intensity = function(value) {
      paramsRef.current.intensity = value;
    };

    window.__params = [
      { name: 'colorA', type: 'color', value: paramsRef.current.colorA },
      { name: 'colorB', type: 'color', value: paramsRef.current.colorB },
      { name: 'colorC', type: 'color', value: paramsRef.current.colorC },
      { name: 'pixelSize', type: 'range', min: 6, max: 32, step: 1, value: paramsRef.current.pixelSize },
      { name: 'motion', type: 'range', min: 0.2, max: 2.5, step: 0.01, value: paramsRef.current.motion },
      { name: 'intensity', type: 'range', min: 0.05, max: 1.0, step: 0.01, value: paramsRef.current.intensity }
    ];
  }

  React.useEffect(function() {
    setupRenderer();
    registerParams();

    var observerTarget = wrapRef.current;
    if (observerTarget) {
      resizeObserverRef.current = new ResizeObserver(function() {
        draw(performance.now());
      });
      resizeObserverRef.current.observe(observerTarget);
    }

    frameRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (glRef.current) {
        var gl = glRef.current;
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
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