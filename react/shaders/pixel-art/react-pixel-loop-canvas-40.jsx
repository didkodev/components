export default function PixelArtShaderLoop() {
  var SPEED = 1.0;
  var COUNT = 5;

  var rootRef = React.useRef(null);
  var canvasRef = React.useRef(null);
  var rafRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var startTimeRef = React.useRef(0);
  var paramsRef = React.useRef({
    pixelSize: 18,
    speed: 1.8,
    intensity: 0.91,
    warp: 0.75,
    colorA: '#2f6bff',
    colorB: '#ff2f92'
  });

  // Register external parameter setters
  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelArtShaderLoop = function(next) {
      paramsRef.current = Object.assign({}, paramsRef.current, next || {});
    };
  }

  // Create and compile a shader
  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  // Create program and buffers
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
      'uniform float u_speed;',
      'uniform float u_intensity;',
      'uniform float u_warp;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',

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
      '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
      '}',

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

      'void main() {',
      '  vec2 frag = v_uv * u_resolution;',
      '  float px = max(2.0, u_pixelSize);',
      '  vec2 pixelCoord = floor(frag / px) * px;',
      '  vec2 uv = pixelCoord / u_resolution;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= u_resolution.x / max(1.0, u_resolution.y);',

      '  float t = u_time * u_speed;',
      '  float angle = atan(p.y, p.x);',
      '  float radius = length(p);',

      '  float swirl = sin(angle * 6.0 + t * 1.4) * 0.2 * u_warp;',
      '  float rings = sin(radius * 18.0 - t * 2.8);',
      '  vec2 q = p;',
      '  q += vec2(cos(angle * 3.0 + t), sin(angle * 5.0 - t)) * swirl;',
      '  q += vec2(sin(radius * 10.0 - t * 1.5), cos(radius * 12.0 + t * 1.2)) * 0.08 * u_warp;',

      '  float field = fbm(q * (3.0 + u_intensity * 4.0) + vec2(t * 0.35, -t * 0.22));',
      '  float blobs = smoothstep(0.45, 0.75, field + rings * 0.18);',
      '  float checker = step(0.5, fract((floor(pixelCoord.x / px) + floor(pixelCoord.y / px)) * 0.5));',
      '  float pulse = 0.5 + 0.5 * sin(t * 2.0 + radius * 14.0);',
      '  float mixField = clamp(blobs * 0.75 + checker * 0.15 + pulse * 0.2 * u_intensity, 0.0, 1.0);',

      '  float edge = smoothstep(0.15, 0.85, abs(rings));',
      '  vec3 color = mix(u_colorA, u_colorB, mixField);',
      '  color *= 0.55 + 0.45 * edge;',
      '  color += mix(u_colorA, u_colorB, 1.0 - mixField) * 0.18 * pulse * u_intensity;',

      '  float vignette = 1.0 - smoothstep(0.4, 1.35, radius);',
      '  color *= 0.45 + vignette * 0.85;',

      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

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
    bufferRef.current = buffer;

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      warp: gl.getUniformLocation(program, 'u_warp'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB')
    };
  }

  // Convert hex color to normalized rgb
  function hexToRgb(hex) {
    var value = (hex || '').replace('#', '');
    if (value.length === 3) {
      value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
    }
    var intVal = parseInt(value || '000000', 16);
    return [
      ((intVal >> 16) & 255) / 255,
      ((intVal >> 8) & 255) / 255,
      (intVal & 255) / 255
    ];
  }

  // Resize canvas with observer
  function setupResizeObserver() {
    if (!rootRef.current || !canvasRef.current) return;

    var canvas = canvasRef.current;
    var gl = glRef.current;

    function resize() {
      var rect = rootRef.current.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        if (gl) {
          gl.viewport(0, 0, width, height);
        }
      }
    }

    resize();

    var ro = new ResizeObserver(function() {
      resize();
    });
    ro.observe(rootRef.current);
    resizeObserverRef.current = ro;
  }

  // Draw one frame
  function draw(now) {
    var gl = glRef.current;
    var program = programRef.current;
    var canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    var p = paramsRef.current;
    var time = (now - startTimeRef.current) * 0.001;

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var colorA = hexToRgb(p.colorA);
    var colorB = hexToRgb(p.colorB);

    gl.uniform2f(uniformsRef.current.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniformsRef.current.time, time * SPEED);
    gl.uniform1f(uniformsRef.current.pixelSize, p.pixelSize);
    gl.uniform1f(uniformsRef.current.speed, p.speed);
    gl.uniform1f(uniformsRef.current.intensity, p.intensity);
    gl.uniform1f(uniformsRef.current.warp, p.warp);
    gl.uniform3f(uniformsRef.current.colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniformsRef.current.colorB, colorB[0], colorB[1], colorB[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Run animation loop
  function animate(now) {
    if (!startTimeRef.current) startTimeRef.current = now;
    draw(now);
    rafRef.current = requestAnimationFrame(animate);
  }

  React.useEffect(function() {
    registerParams();
    setupRenderer();
    setupResizeObserver();
    rafRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      var gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      if (gl && bufferRef.current) {
        gl.deleteBuffer(bufferRef.current);
      }
    };
  }, []);

  return React.createElement(
    'div',
    {
      ref: rootRef,
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