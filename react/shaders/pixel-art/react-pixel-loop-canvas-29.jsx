export default function PixelArtShader113497() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var startTimeRef = React.useRef(0);
  var sizeRef = React.useRef({ width: 1, height: 1, dpr: 1 });

  var [params, setParams] = React.useState({
    colorA: '#4f46e5',
    colorB: '#0891b2',
    colorC: '#16a34a',
    pixelSize: 26,
    speed: 1.4,
    intensity: 0.97
  });

  // Compile a shader from source
  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  // Create and link the shader program
  function createProgram(gl) {
    var vertexSource = [
      'attribute vec2 aPosition;',
      'void main() {',
      '  gl_Position = vec4(aPosition, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision highp float;',
      'uniform vec2 uResolution;',
      'uniform float uTime;',
      'uniform vec3 uColorA;',
      'uniform vec3 uColorB;',
      'uniform vec3 uColorC;',
      'uniform float uPixelSize;',
      'uniform float uSpeed;',
      'uniform float uIntensity;',
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
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 pixelCoord = floor(frag / uPixelSize) * uPixelSize;',
      '  vec2 uv = pixelCoord / uResolution;',
      '  vec2 centered = uv - 0.5;',
      '  centered.x *= uResolution.x / uResolution.y;',
      '',
      '  float t = uTime * uSpeed * 0.55;',
      '  float grid = 11.0 + uIntensity * 18.0;',
      '',
      '  vec2 p = centered * grid;',
      '  float angle = atan(p.y, p.x);',
      '  float radius = length(p);',
      '',
      '  float bands = sin(radius * 3.2 - t * 2.6);',
      '  float wave = sin((p.x + p.y) * 1.8 + t * 1.7);',
      '  float swirl = sin(angle * 6.0 + radius * 2.5 - t * 1.9);',
      '  float field = fbm(p * 0.9 + vec2(t * 0.35, -t * 0.22));',
      '',
      '  float pattern = bands * 0.34 + wave * 0.26 + swirl * 0.24 + field * 1.1;',
      '  pattern += sin(p.x * 4.0 - t * 1.2) * 0.12;',
      '  pattern += cos(p.y * 4.8 + t * 1.4) * 0.12;',
      '',
      '  float steps = 6.0 + floor(uIntensity * 8.0);',
      '  float q = floor((pattern * 0.5 + 0.5) * steps) / steps;',
      '',
      '  vec3 col = mix(uColorA, uColorB, smoothstep(0.12, 0.55, q));',
      '  col = mix(col, uColorC, smoothstep(0.58, 0.95, q));',
      '',
      '  float cellMask = step(0.12, fract(pixelCoord.x / uPixelSize)) * step(0.12, fract(pixelCoord.y / uPixelSize));',
      '  float vignette = 1.0 - smoothstep(0.45, 1.15, length(centered) * 1.2);',
      '  float sparkle = step(0.985, hash(floor(pixelCoord / uPixelSize) + floor(t * 3.0))) * 0.18 * uIntensity;',
      '',
      '  col *= 0.7 + vignette * 0.45;',
      '  col *= 0.9 + cellMask * 0.1;',
      '  col += sparkle;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  // Convert a hex color to normalized RGB
  function hexToRgb(hex) {
    var clean = hex.replace('#', '');
    var value = parseInt(clean, 16);
    return [
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255
    ];
  }

  // Initialize the WebGL renderer
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

    var program = createProgram(gl);
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
      speed: gl.getUniformLocation(program, 'uSpeed'),
      intensity: gl.getUniformLocation(program, 'uIntensity')
    };

    startTimeRef.current = performance.now();
  }

  // Resize the canvas to match the container
  function resizeCanvas() {
    var canvas = canvasRef.current;
    var gl = glRef.current;
    if (!canvas || !gl) return;

    var parent = canvas.parentElement;
    var rect = parent.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var width = Math.max(1, Math.floor(rect.width * dpr));
    var height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, width, height);
      sizeRef.current = { width: width, height: height, dpr: dpr };
    }
  }

  // Draw the current frame
  function draw(now) {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) return;

    var elapsed = (now - startTimeRef.current) * 0.001;
    var rgbA = hexToRgb(params.colorA);
    var rgbB = hexToRgb(params.colorB);
    var rgbC = hexToRgb(params.colorC);

    gl.useProgram(program);
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(uniformsRef.current.resolution, sizeRef.current.width, sizeRef.current.height);
    gl.uniform1f(uniformsRef.current.time, elapsed);
    gl.uniform3f(uniformsRef.current.colorA, rgbA[0], rgbA[1], rgbA[2]);
    gl.uniform3f(uniformsRef.current.colorB, rgbB[0], rgbB[1], rgbB[2]);
    gl.uniform3f(uniformsRef.current.colorC, rgbC[0], rgbC[1], rgbC[2]);
    gl.uniform1f(uniformsRef.current.pixelSize, params.pixelSize);
    gl.uniform1f(uniformsRef.current.speed, params.speed * SPEED);
    gl.uniform1f(uniformsRef.current.intensity, params.intensity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Run the continuous animation loop
  function animate(now) {
    resizeCanvas();
    draw(now);
    frameRef.current = requestAnimationFrame(animate);
  }

  // Register live-edit params for the host environment
  function registerParams() {
    window.__paramSetters = {
      colorA: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorA: value });
        });
      },
      colorB: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorB: value });
        });
      },
      colorC: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorC: value });
        });
      },
      pixelSize: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { pixelSize: value });
        });
      },
      speed: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { speed: value });
        });
      },
      intensity: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { intensity: value });
        });
      }
    };
  }

  // Initialize WebGL, observers, and animation once
  React.useEffect(function () {
    setupRenderer();
    registerParams();
    resizeCanvas();

    var canvas = canvasRef.current;
    var parent = canvas ? canvas.parentElement : null;

    if (parent) {
      resizeObserverRef.current = new ResizeObserver(function () {
        resizeCanvas();
      });
      resizeObserverRef.current.observe(parent);
    }

    frameRef.current = requestAnimationFrame(animate);

    return function () {
      cancelAnimationFrame(frameRef.current);

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      var gl = glRef.current;
      if (gl) {
        if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
        if (programRef.current) gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  return React.createElement(
    'div',
    {
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