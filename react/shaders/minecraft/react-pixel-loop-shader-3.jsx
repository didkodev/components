export default function MinecraftShaderLoop() {
  var SPEED = 1.0;
  var COUNT = 5;
  var MAX_PARAMS = 6;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var paramsRef = React.useRef({
    colorA: '#2f7d32',
    colorB: '#5bbf4a',
    colorC: '#3a6fb6',
    blockSize: 0.076,
    motion: 0.42,
    intensity: 0.76
  });

  var [, setTick] = React.useState(0);

  // Register external parameter setters
  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.MinecraftShaderLoop = function(next) {
      paramsRef.current = Object.assign({}, paramsRef.current, next || {});
      setTick(function(v) {
        return v + 1;
      });
    };
  }

  // Convert hex color to normalized rgb
  function hexToRgb(hex) {
    var safe = hex || '#000000';
    var value = safe.replace('#', '');
    if (value.length === 3) {
      value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
    }
    var num = parseInt(value, 16);
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

  // Build and link the shader program
  function createProgram(gl) {
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
      'uniform float u_blockSize;',
      'uniform float u_motion;',
      'uniform float u_intensity;',
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
      '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
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
      '  vec2 uv = v_uv;',
      '  vec2 aspectUv = (uv - 0.5) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);',
      '  float px = max(u_blockSize, 0.01);',
      '  vec2 grid = floor((aspectUv + 0.5) / px);',
      '  vec2 cellUv = fract((aspectUv + 0.5) / px);',
      '',
      '  float t = u_time * (0.25 + u_motion * 1.2);',
      '  float terrain = fbm(grid * 0.11 + vec2(0.0, t * 0.35));',
      '  float caves = fbm(grid * 0.23 - vec2(t * 0.55, t * 0.18));',
      '  float ridges = abs(fbm(grid * 0.17 + vec2(t * 0.12, -t * 0.07)) * 2.0 - 1.0);',
      '',
      '  float heightMask = smoothstep(0.18, 0.82, terrain);',
      '  float caveMask = smoothstep(0.28, 0.78, caves);',
      '  float grassMask = smoothstep(0.58, 0.9, terrain + ridges * 0.25);',
      '',
      '  vec3 dirt = mix(u_colorA, u_colorB, clamp(terrain * 1.15, 0.0, 1.0));',
      '  vec3 grass = mix(u_colorB, u_colorC, clamp(grassMask + ridges * 0.2, 0.0, 1.0));',
      '  vec3 stone = mix(u_colorC, u_colorA, clamp(caves * 0.7, 0.0, 1.0));',
      '',
      '  float layerPick = step(0.46, terrain) + step(0.68, terrain);',
      '  vec3 col = dirt;',
      '  col = mix(col, stone, step(1.0, layerPick));',
      '  col = mix(col, grass, step(2.0, layerPick));',
      '',
      '  float checker = mod(grid.x + grid.y, 2.0);',
      '  col *= 0.9 + 0.1 * checker;',
      '',
      '  float topLight = smoothstep(0.72, 1.0, cellUv.y);',
      '  float leftShade = smoothstep(0.0, 0.18, cellUv.x);',
      '  float edge = max(',
      '    smoothstep(0.0, 0.05, cellUv.x) * (1.0 - smoothstep(0.95, 1.0, cellUv.x)),',
      '    smoothstep(0.0, 0.05, cellUv.y) * (1.0 - smoothstep(0.95, 1.0, cellUv.y))',
      '  );',
      '',
      '  float pulse = 0.5 + 0.5 * sin(t * 1.4 + terrain * 6.2831);',
      '  float sparkle = smoothstep(0.86, 0.98, hash(grid + floor(t * 2.0))) * pulse;',
      '',
      '  col += topLight * 0.08 * u_intensity;',
      '  col -= leftShade * 0.06 * u_intensity;',
      '  col *= 0.92 + 0.08 * caveMask;',
      '  col += sparkle * 0.18 * u_intensity;',
      '  col *= 0.72 + 0.28 * heightMask;',
      '  col = mix(col * 0.75, col, edge);',
      '',
      '  float vignette = smoothstep(1.2, 0.15, length(aspectUv));',
      '  col *= 0.55 + 0.45 * vignette;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  // Setup the WebGL renderer
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) {
      return;
    }

    var program = createProgram(gl);
    if (!program) {
      return;
    }

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

    glRef.current = gl;
    programRef.current = program;
    bufferRef.current = buffer;
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      blockSize: gl.getUniformLocation(program, 'u_blockSize'),
      motion: gl.getUniformLocation(program, 'u_motion'),
      intensity: gl.getUniformLocation(program, 'u_intensity')
    };
  }

  // Resize canvas using ResizeObserver
  function setupResizeObserver() {
    if (!wrapRef.current || !canvasRef.current) {
      return;
    }

    function applySize() {
      var canvas = canvasRef.current;
      var wrap = wrapRef.current;
      var gl = glRef.current;
      if (!canvas || !wrap || !gl) {
        return;
      }

      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resizeObserverRef.current = new ResizeObserver(function() {
      applySize();
    });

    resizeObserverRef.current.observe(wrapRef.current);
    applySize();
  }

  // Draw a frame
  function draw(timeSeconds) {
    var gl = glRef.current;
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    var canvas = canvasRef.current;
    var params = paramsRef.current;

    if (!gl || !program || !uniforms || !canvas) {
      return;
    }

    var cA = hexToRgb(params.colorA);
    var cB = hexToRgb(params.colorB);
    var cC = hexToRgb(params.colorC);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, timeSeconds * SPEED);
    gl.uniform3f(uniforms.colorA, cA[0], cA[1], cA[2]);
    gl.uniform3f(uniforms.colorB, cB[0], cB[1], cB[2]);
    gl.uniform3f(uniforms.colorC, cC[0], cC[1], cC[2]);
    gl.uniform1f(uniforms.blockSize, params.blockSize);
    gl.uniform1f(uniforms.motion, params.motion);
    gl.uniform1f(uniforms.intensity, params.intensity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Start the animation loop
  function animate(startTime) {
    function loop(now) {
      var elapsed = (now - startTime) * 0.001 * (0.65 + 0.35 * 0.2);
      draw(elapsed);
      frameRef.current = window.requestAnimationFrame(loop);
    }

    frameRef.current = window.requestAnimationFrame(loop);
  }

  // Initialize renderer, params and observers
  React.useEffect(function() {
    registerParams();
    setupRenderer();
    setupResizeObserver();
    animate(performance.now());

    return function() {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      var gl = glRef.current;
      if (gl && bufferRef.current) {
        gl.deleteBuffer(bufferRef.current);
      }
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }

      if (window.__paramSetters && window.__paramSetters.MinecraftShaderLoop) {
        delete window.__paramSetters.MinecraftShaderLoop;
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