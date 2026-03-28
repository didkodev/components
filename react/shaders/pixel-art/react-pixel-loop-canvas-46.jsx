export default function PixelArtShader911686() {
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
    colorA: '#ff7a00',
    colorB: '#6a00ff',
    pixelSize: 18,
    speed: 1.1,
    intensity: 0.86,
    invert: false
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

  // Setup WebGL renderer and buffers
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
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform float u_pixelSize;',
      'uniform float u_speed;',
      'uniform float u_intensity;',
      'uniform float u_invert;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',
      '',
      'float box(vec2 p, vec2 b) {',
      '  vec2 d = abs(p) - b;',
      '  return max(d.x, d.y);',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  float px = max(4.0, u_pixelSize);',
      '  vec2 pixelCoord = floor(frag / px) * px;',
      '  vec2 uv = pixelCoord / u_resolution;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= u_resolution.x / max(u_resolution.y, 1.0);',
      '',
      '  float t = u_time * u_speed;',
      '  vec2 gid = floor(uv * 24.0);',
      '  float n = hash(gid);',
      '',
      '  vec2 cellUv = fract(uv * 24.0) - 0.5;',
      '  float waveX = sin((gid.x * 0.45) + t * 1.4 + n * 6.2831);',
      '  float waveY = cos((gid.y * 0.55) - t * 1.1 + n * 4.0);',
      '  vec2 offset = vec2(waveX, waveY) * 0.18 * u_intensity;',
      '',
      '  float shape1 = box(cellUv + offset, vec2(0.28 + 0.12 * sin(t + n * 5.0), 0.28));',
      '  float shape2 = length(cellUv - offset * 0.7) - (0.18 + 0.16 * (0.5 + 0.5 * cos(t * 1.7 + n * 8.0)));',
      '  float shapeMix = smoothstep(0.05, -0.05, min(shape1, shape2));',
      '',
      '  float band = 0.5 + 0.5 * sin(p.x * 4.0 + p.y * 3.0 + t);',
      '  float checker = mod(gid.x + gid.y, 2.0);',
      '  float glow = 0.5 + 0.5 * sin((gid.x + gid.y) * 0.35 + t * 2.0);',
      '',
      '  vec3 base = mix(u_colorA, u_colorB, band);',
      '  base = mix(base, mix(u_colorB, u_colorA, glow), 0.35 + 0.25 * checker * u_intensity);',
      '',
      '  float mask = shapeMix * (0.6 + 0.4 * glow);',
      '  vec3 color = base * (0.18 + mask * 1.25);',
      '',
      '  float grid = smoothstep(0.48, 0.4, abs(fract(uv.x * 24.0) - 0.5)) * 0.08 +',
      '               smoothstep(0.48, 0.4, abs(fract(uv.y * 24.0) - 0.5)) * 0.08;',
      '  color += base * grid * 0.35;',
      '',
      '  if (u_invert > 0.5) {',
      '    color = 1.0 - color;',
      '  }',
      '',
      '  color = pow(max(color, 0.0), vec3(0.9));',
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

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      invert: gl.getUniformLocation(program, 'u_invert')
    };
  }

  // Resize canvas with device pixel ratio support
  function resizeCanvas() {
    var canvas = canvasRef.current;
    var root = rootRef.current;
    var gl = glRef.current;
    if (!canvas || !root || !gl) return;

    var rect = root.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.floor(rect.width * dpr));
    var height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  // Draw a single frame
  function draw(time) {
    var gl = glRef.current;
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    if (!gl || !program || !uniforms) return;

    var p = paramsRef.current;
    var a = hexToRgb(p.colorA);
    var b = hexToRgb(p.colorB);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform3f(uniforms.colorA, a[0], a[1], a[2]);
    gl.uniform3f(uniforms.colorB, b[0], b[1], b[2]);
    gl.uniform1f(uniforms.pixelSize, p.pixelSize);
    gl.uniform1f(uniforms.speed, p.speed * SPEED);
    gl.uniform1f(uniforms.intensity, p.intensity);
    gl.uniform1f(uniforms.invert, p.invert ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Run the animation loop
  function animate(now) {
    if (!startTimeRef.current) startTimeRef.current = now;
    var elapsed = (now - startTimeRef.current) * 0.001;
    resizeCanvas();
    draw(elapsed);
    rafRef.current = requestAnimationFrame(animate);
  }

  // Register live-editable parameters
  function registerParams() {
    window.__paramSetters = {
      colorA: function(value) {
        paramsRef.current.colorA = value;
      },
      colorB: function(value) {
        paramsRef.current.colorB = value;
      },
      pixelSize: function(value) {
        paramsRef.current.pixelSize = value;
      },
      speed: function(value) {
        paramsRef.current.speed = value;
      },
      intensity: function(value) {
        paramsRef.current.intensity = value;
      },
      invert: function(value) {
        paramsRef.current.invert = value;
      }
    };

    window.__params = [
      { name: 'colorA', type: 'color', value: paramsRef.current.colorA },
      { name: 'colorB', type: 'color', value: paramsRef.current.colorB },
      { name: 'pixelSize', type: 'range', min: 6, max: 32, step: 1, value: paramsRef.current.pixelSize },
      { name: 'speed', type: 'range', min: 0.2, max: 2.2, step: 0.01, value: paramsRef.current.speed },
      { name: 'intensity', type: 'range', min: 0.1, max: 1.2, step: 0.01, value: paramsRef.current.intensity },
      { name: 'invert', type: 'toggle', value: paramsRef.current.invert }
    ];
  }

  React.useEffect(function() {
    setupRenderer();
    resizeCanvas();
    registerParams();

    if (rootRef.current) {
      resizeObserverRef.current = new ResizeObserver(function() {
        resizeCanvas();
      });
      resizeObserverRef.current.observe(rootRef.current);
    }

    rafRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.__paramSetters = {};
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
        display: 'block'
      }
    })
  );
}