export default function PixelArtShader523614() {
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
  var sizeRef = React.useRef({ width: 1, height: 1, dpr: 1 });
  var timeRef = React.useRef(0);

  var [params, setParams] = React.useState({
    colorA: '#3a0ca3',
    colorB: '#00b4d8',
    colorC: '#f72585',
    pixelSize: 18,
    warp: 0.42,
    contrast: 1.14
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

  // Setup renderer and shader program
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

    var vertexSource = [
      'attribute vec2 aPosition;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = aPosition * 0.5 + 0.5;',
      '  gl_Position = vec4(aPosition, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision mediump float;',
      'varying vec2 vUv;',
      'uniform vec2 uResolution;',
      'uniform float uTime;',
      'uniform vec3 uColorA;',
      'uniform vec3 uColorB;',
      'uniform vec3 uColorC;',
      'uniform float uPixelSize;',
      'uniform float uWarp;',
      'uniform float uContrast;',

      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',

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

      'vec3 gradientColor(float t) {',
      '  vec3 ab = mix(uColorA, uColorB, smoothstep(0.0, 0.55, t));',
      '  vec3 bc = mix(uColorB, uColorC, smoothstep(0.45, 1.0, t));',
      '  return mix(ab, bc, smoothstep(0.25, 0.85, t));',
      '}',

      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  float px = max(4.0, uPixelSize);',
      '  vec2 snapped = (floor(frag / px) + 0.5) * px;',
      '  vec2 uv = snapped / uResolution.xy;',
      '  vec2 centered = uv - 0.5;',
      '  centered.x *= uResolution.x / uResolution.y;',

      '  float t = uTime * 0.42;',
      '  float r = length(centered);',
      '  float a = atan(centered.y, centered.x);',

      '  float rings = sin(r * 18.0 - t * 3.2);',
      '  float arms = sin(a * 6.0 + t * 2.4 + r * 10.0);',
      '  float swirl = sin((centered.x + centered.y) * 8.0 + t * 1.8);',
      '  float warpField = noise(centered * 7.0 + vec2(t * 0.7, -t * 0.45));',
      '  float field = rings * 0.45 + arms * 0.35 + swirl * 0.2;',
      '  field += (warpField - 0.5) * uWarp * 1.8;',

      '  float blocks = noise(floor((centered + 1.5) * 12.0 + vec2(t * 1.4, t * 0.8)));',
      '  field += (blocks - 0.5) * 0.65;',

      '  float quantized = floor((field * 0.5 + 0.5) * 6.0) / 5.0;',
      '  quantized = clamp((quantized - 0.5) * uContrast + 0.5, 0.0, 1.0);',

      '  vec3 color = gradientColor(quantized);',

      '  float grid = step(0.92, fract(frag.x / px)) + step(0.92, fract(frag.y / px));',
      '  color *= 1.0 - min(grid, 1.0) * 0.18;',

      '  float vignette = smoothstep(1.15, 0.15, r);',
      '  color *= 0.55 + 0.45 * vignette;',

      '  gl_FragColor = vec4(color, 1.0);',
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

    var positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      colorA: gl.getUniformLocation(program, 'uColorA'),
      colorB: gl.getUniformLocation(program, 'uColorB'),
      colorC: gl.getUniformLocation(program, 'uColorC'),
      pixelSize: gl.getUniformLocation(program, 'uPixelSize'),
      warp: gl.getUniformLocation(program, 'uWarp'),
      contrast: gl.getUniformLocation(program, 'uContrast')
    };
  }

  // Draw the animated pixel-art frame
  function draw() {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) return;

    gl.viewport(0, 0, sizeRef.current.width, sizeRef.current.height);
    gl.useProgram(program);

    var rgbA = hexToRgb(params.colorA);
    var rgbB = hexToRgb(params.colorB);
    var rgbC = hexToRgb(params.colorC);

    gl.uniform2f(uniformsRef.current.resolution, sizeRef.current.width, sizeRef.current.height);
    gl.uniform1f(uniformsRef.current.time, timeRef.current);
    gl.uniform3f(uniformsRef.current.colorA, rgbA[0], rgbA[1], rgbA[2]);
    gl.uniform3f(uniformsRef.current.colorB, rgbB[0], rgbB[1], rgbB[2]);
    gl.uniform3f(uniformsRef.current.colorC, rgbC[0], rgbC[1], rgbC[2]);
    gl.uniform1f(uniformsRef.current.pixelSize, params.pixelSize);
    gl.uniform1f(uniformsRef.current.warp, params.warp);
    gl.uniform1f(uniformsRef.current.contrast, params.contrast);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Animate continuously for looping shader motion
  function animate() {
    timeRef.current += 0.016 * SPEED * 1.6;
    draw();
    frameRef.current = window.requestAnimationFrame(animate);
  }

  // Register editable parameters for host integration
  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.colorA = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorA: v }); });
    };
    window.__paramSetters.colorB = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorB: v }); });
    };
    window.__paramSetters.colorC = function(v) {
      setParams(function(p) { return Object.assign({}, p, { colorC: v }); });
    };
    window.__paramSetters.pixelSize = function(v) {
      setParams(function(p) { return Object.assign({}, p, { pixelSize: Number(v) }); });
    };
    window.__paramSetters.warp = function(v) {
      setParams(function(p) { return Object.assign({}, p, { warp: Number(v) }); });
    };
    window.__paramSetters.contrast = function(v) {
      setParams(function(p) { return Object.assign({}, p, { contrast: Number(v) }); });
    };
  }

  // Handle responsive canvas resizing with ResizeObserver
  React.useEffect(function() {
    setupRenderer();
    registerParams();

    function resizeCanvas() {
      var canvas = canvasRef.current;
      var wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));

      sizeRef.current = { width: width, height: height, dpr: dpr };
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }

    resizeCanvas();

    roRef.current = new ResizeObserver(function() {
      resizeCanvas();
    });

    if (wrapRef.current) {
      roRef.current.observe(wrapRef.current);
    }

    frameRef.current = window.requestAnimationFrame(animate);

    return function() {
      window.cancelAnimationFrame(frameRef.current);
      if (roRef.current) roRef.current.disconnect();
      var gl = glRef.current;
      if (gl) {
        if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
        if (programRef.current) gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  // Redraw immediately on parameter changes
  React.useEffect(function() {
    draw();
  }, [params]);

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
        display: 'block',
        width: '100%',
        height: '100%'
      }
    })
  );
}