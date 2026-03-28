export default function CosmosShaderCanvas() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const frameRef = React.useRef(0);
  const glRef = React.useRef(null);
  const programRef = React.useRef(null);
  const bufferRef = React.useRef(null);
  const resizeObserverRef = React.useRef(null);

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", {
        antialias: true,
        alpha: false,
        premultipliedAlpha: false
      }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) return;
    glRef.current = gl;

    var vertexSource = [
      "attribute vec2 aPosition;",
      "void main() {",
      "  gl_Position = vec4(aPosition, 0.0, 1.0);",
      "}"
    ].join("\n");

    var fragmentSource = [
      "precision highp float;",
      "uniform vec2 uResolution;",
      "uniform float uTime;",
      "",
      "float hash21(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",
      "",
      "mat2 rot(float a) {",
      "  float s = sin(a);",
      "  float c = cos(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float starField(vec2 uv, float density, float twinkle) {",
      "  vec2 gv = fract(uv * density) - 0.5;",
      "  vec2 id = floor(uv * density);",
      "  float n = hash21(id);",
      "  vec2 offs = vec2(hash21(id + 1.7), hash21(id + 4.3)) - 0.5;",
      "  float d = length(gv - offs * 0.55);",
      "  float star = smoothstep(0.06, 0.0, d);",
      "  float pulse = 0.55 + 0.45 * sin(uTime * twinkle + n * 20.0);",
      "  return star * pulse * step(0.82, n);",
      "}",
      "",
      "float nebula(vec2 p) {",
      "  float t = uTime * 0.11;",
      "  float v = 0.0;",
      "  float a = 0.55;",
      "  p *= 1.2;",
      "  for (int i = 0; i < 6; i++) {",
      "    p = abs(p) / dot(p, p) - 0.72;",
      "    p *= rot(0.65 + float(i) * 0.23 + t * 0.09);",
      "    v += a * exp(-length(p) * 1.25);",
      "    a *= 0.72;",
      "  }",
      "  return v;",
      "}",
      "",
      "float spiralBands(vec2 p) {",
      "  float r = length(p);",
      "  float a = atan(p.y, p.x);",
      "  float arms = cos(a * 7.0 - r * 12.0 + uTime * 2.7);",
      "  float ring = sin(r * 30.0 - uTime * 4.5);",
      "  float core = exp(-r * 3.8);",
      "  return smoothstep(0.35, 1.0, arms * 0.5 + 0.5) * core + 0.18 * ring * core;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uResolution.xy;",
      "  vec2 p = uv * 2.0 - 1.0;",
      "  p.x *= uResolution.x / uResolution.y;",
      "",
      "  vec2 q = p;",
      "  q *= rot(uTime * 0.17);",
      "",
      "  float warp = nebula(q * 1.15);",
      "  vec2 flow = vec2(",
      "    sin(q.y * 4.5 + uTime * 1.6),",
      "    cos(q.x * 5.1 - uTime * 1.3)",
      "  ) * (0.09 + warp * 0.14);",
      "",
      "  vec2 sp = q + flow;",
      "  float bands = spiralBands(sp);",
      "",
      "  float s1 = starField(q + flow * 0.5 + vec2(uTime * 0.07, -uTime * 0.03), 14.0, 4.0);",
      "  float s2 = starField(q * 1.8 - flow + vec2(-uTime * 0.11, uTime * 0.06), 26.0, 6.0);",
      "  float s3 = starField(q * 3.3 + flow * 1.7 + vec2(uTime * 0.18, uTime * 0.14), 48.0, 8.0);",
      "",
      "  float radial = exp(-length(p) * 1.9);",
      "  float glow = warp * 0.9 + bands * 1.25 + radial * 0.35;",
      "",
      "  vec3 deep = vec3(0.02, 0.01, 0.07);",
      "  vec3 violet = vec3(0.22, 0.08, 0.42);",
      "  vec3 magenta = vec3(0.72, 0.18, 0.62);",
      "  vec3 cyan = vec3(0.10, 0.72, 0.95);",
      "  vec3 gold = vec3(1.0, 0.72, 0.30);",
      "",
      "  vec3 col = deep;",
      "  col += violet * smoothstep(0.05, 0.85, warp);",
      "  col += magenta * smoothstep(0.15, 1.1, bands + warp * 0.35) * 0.8;",
      "  col += cyan * pow(max(glow, 0.0), 1.35) * 0.85;",
      "  col += gold * pow(max(bands, 0.0), 2.2) * 0.35;",
      "",
      "  float stars = s1 * 0.6 + s2 * 0.95 + s3 * 1.25;",
      "  col += vec3(stars);",
      "",
      "  float vignette = smoothstep(1.55, 0.3, length(p));",
      "  col *= vignette;",
      "  col = pow(col, vec3(0.9));",
      "",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function makeShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vertexShader = makeShader(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

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

    var aPosition = gl.getAttribLocation(program, "aPosition");
    var uResolution = gl.getUniformLocation(program, "uResolution");
    var uTime = gl.getUniformLocation(program, "uTime");

    function resize() {
      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resize();
    });
    resizeObserverRef.current.observe(wrap);
    resize();

    var start = performance.now();

    function render(now) {
      var time = (now - start) * 0.001 * 1.35;
      resize();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frameRef.current = requestAnimationFrame(render);
    }

    frameRef.current = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: wrapRef,
      className: "dark-component",
      style: {
        position: "relative",
        width: "100%",
        height: "680px",
        overflow: "hidden",
        borderRadius: "24px",
        background:
          "radial-gradient(circle at 50% 50%, rgba(36,16,72,0.35) 0%, rgba(8,6,20,1) 48%, rgba(2,2,8,1) 100%)",
        boxShadow:
          "inset 0 0 80px rgba(120,80,255,0.12), 0 20px 60px rgba(0,0,0,0.45)"
      }
    },
    React.createElement("canvas", {
      ref: canvasRef,
      style: {
        width: "100%",
        height: "100%",
        display: "block"
      }
    }),
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.08))"
        }
      }
    )
  );
}