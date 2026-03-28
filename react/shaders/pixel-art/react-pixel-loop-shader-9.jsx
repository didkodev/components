export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var rafRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var stateRef = React.useRef({
    time: 0,
    width: 1,
    height: 1,
    dpr: 1,
    params: {
      colorA: '#6a4cff',
      colorB: '#00c2a8',
      colorC: '#ff7a18',
      pixelSize: 22,
      motion: 1.15,
      contrast: 0.78
    }
  });

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

  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });

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
      'precision mediump float;',
      'varying vec2 v_uv;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_pixelSize;',
      'uniform float u_motion;',
      'uniform float u_contrast;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 345.45));',
      '  p += dot(p, p + 34.23);',
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
      '  v += noise(p) * a;',
      '  p *= 2.02;',
      '  a *= 0.5;',
      '  v += noise(p) * a;',
      '  p *= 2.03;',
      '  a *= 0.5;',
      '  v += noise(p) * a;',
      '  p *= 2.01;',
      '  a *= 0.5;',
      '  v += noise(p) * a;',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 pixel = max(vec2(2.0), vec2(u_pixelSize));',
      '  vec2 snapped = (floor(frag / pixel) + 0.5) * pixel;',
      '  vec2 uv = snapped / u_resolution.xy;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= u_resolution.x / u_resolution.y;',
      '',
      '  float t = u_time * (0.35 + u_motion * 0.9);',
      '',
      '  float radial = length(p);',
      '  float angle = atan(p.y, p.x);',
      '',
      '  float band1 = sin((p.x * 7.0 + p.y * 5.0) + t * 1.8);',
      '  float band2 = cos(radial * 14.0 - t * 2.4 + angle * 3.0);',
      '  float swirl = sin(angle * 6.0 + radial * 18.0 - t * 2.0);',
      '',
      '  vec2 flow = vec2(',
      '    fbm(p * 2.8 + vec2(t * 0.45, -t * 0.22)),',
      '    fbm(p * 2.8 + vec2(-t * 0.25, t * 0.38))',
      '  );',
      '',
      '  float cells = fbm(p * 4.5 + flow * 1.6 + vec2(t * 0.2, -t * 0.14));',
      '  float stripes = 0.5 + 0.5 * band1;',
      '  float rings = 0.5 + 0.5 * band2;',
      '  float spark = 0.5 + 0.5 * swirl;',
      '',
      '  float mixField = cells * 0.45 + stripes * 0.25 + rings * 0.2 + spark * 0.1;',
      '  mixField = smoothstep(0.18, 0.88, mixField);',
      '',
      '  float steps = 5.0 + floor(u_contrast * 5.0);',
      '  mixField = floor(mixField * steps) / steps;',
      '',
      '  vec3 grad1 = mix(u_colorA, u_colorB, mixField);',
      '  vec3 grad2 = mix(u_colorB, u_colorC, 0.5 + 0.5 * sin(t + radial * 10.0));',
      '  vec3 color = mix(grad1, grad2, 0.35 + 0.35 * rings);',
      '',
      '  float edgeX = abs(fract(frag.x / pixel.x) - 0.5);',
      '  float edgeY = abs(fract(frag.y / pixel.y) - 0.5);',
      '  float grid = smoothstep(0.48, 0.18, max(edgeX, edgeY));',
      '',
      '  float vignette = smoothstep(1.3, 0.2, radial);',
      '  float boost = mix(0.7, 1.45, u_contrast);',
      '',
      '  color *= (0.8 + 0.2 * grid) * vignette * boost;',
      '  color = pow(color, vec3(0.92));',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) return;

    programRef.current = program;
    gl.useProgram(program);

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
      motion: gl.getUniformLocation(program, 'u_motion'),
      contrast: gl.getUniformLocation(program, 'u_contrast')
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
      gl.viewport(0, 0, width, height);
    }

    stateRef.current.width = width;
    stateRef.current.height = height;
    stateRef.current.dpr = dpr;
  }

  function draw() {
    var gl = glRef.current;
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    if (!gl || !program || !uniforms) return;

    var params = stateRef.current.params;
    var cA = hexToRgb(params.colorA);
    var cB = hexToRgb(params.colorB);
    var cC = hexToRgb(params.colorC);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, stateRef.current.width, stateRef.current.height);
    gl.uniform1f(uniforms.time, stateRef.current.time);
    gl.uniform3f(uniforms.colorA, cA[0], cA[1], cA[2]);
    gl.uniform3f(uniforms.colorB, cB[0], cB[1], cB[2]);
    gl.uniform3f(uniforms.colorC, cC[0], cC[1], cC[2]);
    gl.uniform1f(uniforms.pixelSize, params.pixelSize);
    gl.uniform1f(uniforms.motion, params.motion);
    gl.uniform1f(uniforms.contrast, params.contrast);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    stateRef.current.time = now * 0.001 * SPEED;
    draw();
    rafRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = {
      colorA: function (value) {
        stateRef.current.params.colorA = value;
      },
      colorB: function (value) {
        stateRef.current.params.colorB = value;
      },
      colorC: function (value) {
        stateRef.current.params.colorC = value;
      },
      pixelSize: function (value) {
        stateRef.current.params.pixelSize = value;
      },
      motion: function (value) {
        stateRef.current.params.motion = value;
      },
      contrast: function (value) {
        stateRef.current.params.contrast = value;
      }
    };
  }

  React.useEffect(function () {
    setupRenderer();
    resizeCanvas();
    registerParams();

    if (wrapRef.current) {
      resizeObserverRef.current = new ResizeObserver(function () {
        resizeCanvas();
      });
      resizeObserverRef.current.observe(wrapRef.current);
    }

    rafRef.current = requestAnimationFrame(animate);

    return function () {
      cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (glRef.current) {
        var gl = glRef.current;
        if (programRef.current) {
          gl.deleteProgram(programRef.current);
        }
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
        display: 'block',
        width: '100%',
        height: '100%'
      }
    })
  );
}