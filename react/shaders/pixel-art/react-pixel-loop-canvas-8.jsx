export default function PixelArtShader389579() {
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

  var [params, setParams] = React.useState({
    colorA: '#ff7a18',
    colorB: '#7a5cff',
    pixelSize: 18,
    flow: 1.15,
    warp: 0.79,
    blocks: 9
  });

  // Register external parameter setters
  React.useEffect(function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.PixelArtShader389579 = function(next) {
      setParams(function(prev) {
        return Object.assign({}, prev, next || {});
      });
    };
    return function cleanupParams() {
      if (window.__paramSetters) {
        delete window.__paramSetters.PixelArtShader389579;
      }
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

  // Build shader program and geometry
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

    var vertexShaderSource = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentShaderSource = [
      'precision highp float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform float u_pixelSize;',
      'uniform float u_flow;',
      'uniform float u_warp;',
      'uniform float u_blocks;',
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
      '    v += a * noise(p);',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  vec2 centered = uv - 0.5;',
      '  centered.x *= u_resolution.x / max(u_resolution.y, 1.0);',
      '',
      '  float px = max(2.0, u_pixelSize);',
      '  vec2 grid = floor(gl_FragCoord.xy / px) * px;',
      '  vec2 puv = grid / u_resolution.xy;',
      '  vec2 p = puv - 0.5;',
      '  p.x *= u_resolution.x / max(u_resolution.y, 1.0);',
      '',
      '  float t = u_time * (0.35 + u_flow * 0.8);',
      '  float rings = length(p) * (3.0 + u_blocks * 0.35);',
      '  float angle = atan(p.y, p.x);',
      '',
      '  float waveA = sin(rings * 4.0 - t * 2.0 + sin(angle * 3.0) * u_warp * 2.0);',
      '  float waveB = cos((p.x + p.y) * (6.0 + u_blocks) + t * 1.4);',
      '  float field = fbm(p * (3.0 + u_blocks * 0.4) + vec2(t * 0.4, -t * 0.3));',
      '  float mosaic = sin((floor(p.x * u_blocks * 3.0) + floor(p.y * u_blocks * 3.0)) * 0.7 + t * 1.1);',
      '',
      '  float v = 0.0;',
      '  v += waveA * 0.35;',
      '  v += waveB * 0.2;',
      '  v += field * 0.9;',
      '  v += mosaic * 0.25 * u_warp;',
      '',
      '  float bands = floor(v * 5.0) / 5.0;',
      '  float checker = mod(floor(puv.x * u_blocks * 12.0) + floor(puv.y * u_blocks * 12.0), 2.0);',
      '  float pulse = 0.5 + 0.5 * sin(t * 1.7 + rings * 6.0);',
      '  float mask = smoothstep(-0.6, 0.8, bands + checker * 0.12 + pulse * 0.15);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, clamp(mask, 0.0, 1.0));',
      '  col *= 0.55 + 0.45 * smoothstep(-0.8, 0.8, v);',
      '',
      '  float vignette = 1.0 - smoothstep(0.35, 0.95, length(centered) * 1.25);',
      '  col *= 0.55 + vignette * 0.45;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compileShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    var vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

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

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      flow: gl.getUniformLocation(program, 'u_flow'),
      warp: gl.getUniformLocation(program, 'u_warp'),
      blocks: gl.getUniformLocation(program, 'u_blocks')
    };
  }

  // Resize canvas with observer for fullscreen rendering
  function setupResizeObserver() {
    if (!rootRef.current || !canvasRef.current || !glRef.current) return;

    function resizeCanvas() {
      var canvas = canvasRef.current;
      var gl = glRef.current;
      var rect = rootRef.current.getBoundingClientRect();
      var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        gl.viewport(0, 0, width, height);
      }
    }

    resizeCanvas();

    resizeObserverRef.current = new ResizeObserver(function() {
      resizeCanvas();
    });
    resizeObserverRef.current.observe(rootRef.current);
  }

  // Draw one frame of the animated shader
  function draw(timeMs) {
    var gl = glRef.current;
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    var buffer = bufferRef.current;
    var canvas = canvasRef.current;
    if (!gl || !program || !buffer || !canvas) return;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var colorA = hexToRgb(params.colorA);
    var colorB = hexToRgb(params.colorB);
    var elapsed = (timeMs - startTimeRef.current) * 0.001 * SPEED;

    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform3f(uniforms.colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniforms.colorB, colorB[0], colorB[1], colorB[2]);
    gl.uniform1f(uniforms.pixelSize, params.pixelSize);
    gl.uniform1f(uniforms.flow, params.flow);
    gl.uniform1f(uniforms.warp, params.warp);
    gl.uniform1f(uniforms.blocks, params.blocks);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Run the perpetual animation loop
  function animate(timeMs) {
    if (!startTimeRef.current) {
      startTimeRef.current = timeMs;
    }
    draw(timeMs);
    rafRef.current = window.requestAnimationFrame(animate);
  }

  // Initialize renderer, observer and animation lifecycle
  React.useEffect(function init() {
    setupRenderer();
    setupResizeObserver();
    rafRef.current = window.requestAnimationFrame(animate);

    return function cleanup() {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Keep animation responsive to parameter updates
  React.useEffect(function refreshOnParams() {
    draw(performance.now());
  }, [params]);

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