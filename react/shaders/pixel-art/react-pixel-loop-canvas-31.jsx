export default function PixelArtShader602903() {
  var SPEED = 1.0;
  var COUNT = 5;

  var rootRef = React.useRef(null);
  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var paramsRef = React.useRef({
    colorA: '#2d1b69',
    colorB: '#00a6fb',
    colorC: '#7cf29c',
    pixelSize: 18,
    flow: 1.85,
    intensity: 0.3
  });

  // Create shader source
  function createShaderSource() {
    var vertexShader = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentShader = [
      'precision mediump float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_pixelSize;',
      'uniform float u_flow;',
      'uniform float u_intensity;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 345.45));',
      '  p += dot(p, p + 34.345);',
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
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  float minRes = min(u_resolution.x, u_resolution.y);',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 pixel = floor(frag / u_pixelSize) * u_pixelSize;',
      '  vec2 puv = pixel / u_resolution.xy;',
      '',
      '  vec2 centered = (pixel - 0.5 * u_resolution.xy) / minRes;',
      '  float t = u_time * u_flow;',
      '',
      '  float radial = length(centered);',
      '  float angle = atan(centered.y, centered.x);',
      '',
      '  float n1 = noise(puv * 8.0 + vec2(t * 0.35, -t * 0.22));',
      '  float n2 = noise(centered * 6.0 + vec2(cos(angle * 3.0 + t * 0.4), sin(angle * 2.0 - t * 0.3)));',
      '  float bands = sin(radial * 22.0 - t * 3.5 + n1 * 2.5);',
      '  float swirl = sin(angle * 6.0 + t * 2.2 + n2 * 3.14159);',
      '  float pulse = sin(t * 1.7 + radial * 18.0);',
      '',
      '  float field = bands * 0.5 + swirl * 0.35 + pulse * 0.15;',
      '  field += (n1 - 0.5) * 0.8 * u_intensity;',
      '  field += (n2 - 0.5) * 0.6 * u_intensity;',
      '',
      '  float step1 = smoothstep(-0.55, -0.05, field);',
      '  float step2 = smoothstep(0.0, 0.55, field);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, step1);',
      '  col = mix(col, u_colorC, step2);',
      '',
      '  float vignette = smoothstep(1.25, 0.15, radial);',
      '  col *= 0.65 + 0.35 * vignette;',
      '',
      '  float grid = step(0.92, fract(frag.x / u_pixelSize)) + step(0.92, fract(frag.y / u_pixelSize));',
      '  col *= 1.0 - 0.08 * grid;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    return { vertexShader: vertexShader, fragmentShader: fragmentShader };
  }

  // Convert hex color to normalized rgb
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

  // Compile shader
  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Create and link program
  function createProgram(gl, vsSource, fsSource) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
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

  // Setup renderer
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    var source = createShaderSource();
    var program = createProgram(gl, source.vertexShader, source.fragmentShader);
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

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      flow: gl.getUniformLocation(program, 'u_flow'),
      intensity: gl.getUniformLocation(program, 'u_intensity')
    };

    glRef.current = gl;
    programRef.current = program;
    bufferRef.current = buffer;
  }

  // Resize canvas with device pixel ratio
  function resizeCanvas() {
    var canvas = canvasRef.current;
    var root = rootRef.current;
    var gl = glRef.current;
    if (!canvas || !root || !gl) return;

    var rect = root.getBoundingClientRect();
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

  // Push current params to uniforms
  function updateUniforms(time) {
    var gl = glRef.current;
    var u = uniformsRef.current;
    var canvas = canvasRef.current;
    var p = paramsRef.current;
    if (!gl || !u || !canvas) return;

    var rgbA = hexToRgb(p.colorA);
    var rgbB = hexToRgb(p.colorB);
    var rgbC = hexToRgb(p.colorC);

    gl.uniform2f(u.resolution, canvas.width, canvas.height);
    gl.uniform1f(u.time, time);
    gl.uniform3f(u.colorA, rgbA[0], rgbA[1], rgbA[2]);
    gl.uniform3f(u.colorB, rgbB[0], rgbB[1], rgbB[2]);
    gl.uniform3f(u.colorC, rgbC[0], rgbC[1], rgbC[2]);
    gl.uniform1f(u.pixelSize, p.pixelSize);
    gl.uniform1f(u.flow, p.flow * SPEED);
    gl.uniform1f(u.intensity, p.intensity);
  }

  // Draw frame
  function draw(time) {
    var gl = glRef.current;
    if (!gl) return;
    updateUniforms(time);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Animation loop
  function animate(startTime) {
    var begin = startTime || performance.now();

    function loop(now) {
      resizeCanvas();
      draw((now - begin) * 0.001);
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
  }

  // Register live params
  function registerParams() {
    window.__paramSetters = {
      colorA: function(value) {
        paramsRef.current.colorA = value;
      },
      colorB: function(value) {
        paramsRef.current.colorB = value;
      },
      colorC: function(value) {
        paramsRef.current.colorC = value;
      },
      pixelSize: function(value) {
        paramsRef.current.pixelSize = value;
      },
      flow: function(value) {
        paramsRef.current.flow = value;
      },
      intensity: function(value) {
        paramsRef.current.intensity = value;
      }
    };
  }

  // Initialize renderer, params, resize observer, and animation
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

    animate();

    return function() {
      cancelAnimationFrame(frameRef.current);

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
        display: 'block',
        width: '100%',
        height: '100%'
      }
    })
  );
}