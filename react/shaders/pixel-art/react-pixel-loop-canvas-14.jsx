export default function PixelArtShaderLoop() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var rafRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformRef = React.useRef({});
  var paramsRef = React.useRef({
    colorA: '#ff7a18',
    colorB: '#00c2ff',
    colorC: '#7cff6b',
    pixelSize: 29,
    motion: 0.45,
    density: 0.54
  });

  React.useEffect(function () {
    setupRenderer();
    registerParams();
    animate();

    return function () {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (glRef.current && bufferRef.current) {
        glRef.current.deleteBuffer(bufferRef.current);
      }
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, []);

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelArtShaderLoop = {
      colorA: function (value) {
        paramsRef.current.colorA = value;
      },
      colorB: function (value) {
        paramsRef.current.colorB = value;
      },
      colorC: function (value) {
        paramsRef.current.colorC = value;
      },
      pixelSize: function (value) {
        paramsRef.current.pixelSize = value;
      },
      motion: function (value) {
        paramsRef.current.motion = value;
      },
      density: function (value) {
        paramsRef.current.density = value;
      }
    };
  }

  function hexToRgb(hex) {
    var clean = (hex || '#000000').replace('#', '');
    var normalized = clean.length === 3
      ? clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2)
      : clean;
    var num = parseInt(normalized, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    var vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) {
      return;
    }

    glRef.current = gl;

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
      'uniform float uMotion;',
      'uniform float uDensity;',
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
      'float bands(vec2 p, float t) {',
      '  float v = 0.0;',
      '  v += sin(p.x * 1.8 + t * 0.9);',
      '  v += sin(p.y * 2.4 - t * 0.7);',
      '  v += sin((p.x + p.y) * 1.2 + t * 1.1);',
      '  return v / 3.0;',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  float px = max(4.0, uPixelSize);',
      '  vec2 pixelCoord = floor(frag / px) * px;',
      '  vec2 uv = pixelCoord / uResolution.xy;',
      '  vec2 centered = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 6.0;',
      '  float t = uTime * (0.25 + uMotion * 1.75);',
      '',
      '  vec2 flow = centered;',
      '  flow.x += sin(centered.y * 1.4 + t) * (0.35 + uMotion * 0.5);',
      '  flow.y += cos(centered.x * 1.7 - t * 1.3) * (0.25 + uMotion * 0.45);',
      '',
      '  float n = noise(flow * (1.5 + uDensity * 3.5) + vec2(t * 0.35, -t * 0.22));',
      '  float b = bands(flow * (1.2 + uDensity * 2.0), t);',
      '  float rings = sin(length(flow) * (3.0 + uDensity * 5.0) - t * 1.6);',
      '  float value = n * 0.5 + b * 0.3 + rings * 0.2;',
      '',
      '  float level = floor((value * 0.5 + 0.5) * 4.0) / 3.0;',
      '  vec3 col1 = mix(uColorA, uColorB, smoothstep(0.1, 0.55, level));',
      '  vec3 col2 = mix(col1, uColorC, smoothstep(0.55, 1.0, level));',
      '',
      '  float grid = step(0.92, fract(frag.x / px)) + step(0.92, fract(frag.y / px));',
      '  float sparkle = step(0.965, hash(floor(flow * 10.0 + t)));',
      '  vec3 color = col2;',
      '  color *= 0.88 + 0.12 * smoothstep(0.0, 1.0, level);',
      '  color += sparkle * 0.08 * uColorC;',
      '  color *= 1.0 - min(grid, 1.0) * 0.12;',
      '',
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

    uniformRef.current = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      colorA: gl.getUniformLocation(program, 'uColorA'),
      colorB: gl.getUniformLocation(program, 'uColorB'),
      colorC: gl.getUniformLocation(program, 'uColorC'),
      pixelSize: gl.getUniformLocation(program, 'uPixelSize'),
      motion: gl.getUniformLocation(program, 'uMotion'),
      density: gl.getUniformLocation(program, 'uDensity')
    };

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resizeCanvas();
    });
    resizeObserverRef.current.observe(canvas);
    resizeCanvas();
  }

  function draw() {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) {
      return;
    }

    var uniforms = uniformRef.current;
    var params = paramsRef.current;
    var rgbA = hexToRgb(params.colorA);
    var rgbB = hexToRgb(params.colorB);
    var rgbC = hexToRgb(params.colorC);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniforms.time, frameRef.current * 0.016 * SPEED);
    gl.uniform3f(uniforms.colorA, rgbA[0], rgbA[1], rgbA[2]);
    gl.uniform3f(uniforms.colorB, rgbB[0], rgbB[1], rgbB[2]);
    gl.uniform3f(uniforms.colorC, rgbC[0], rgbC[1], rgbC[2]);
    gl.uniform1f(uniforms.pixelSize, params.pixelSize);
    gl.uniform1f(uniforms.motion, params.motion);
    gl.uniform1f(uniforms.density, params.density);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate() {
    frameRef.current += 1;
    draw();
    rafRef.current = requestAnimationFrame(animate);
  }

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
        background: '#0d0d0d'
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