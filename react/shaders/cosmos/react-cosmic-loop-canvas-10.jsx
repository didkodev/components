export default function CosmosShaderCanvas() {
  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var rafRef = React.useRef(0);
  var roRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var stateRef = React.useRef({
    width: 1,
    height: 1,
    dpr: 1,
    start: 0,
    time: 0,
    pointerX: 0.5,
    pointerY: 0.5
  });

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", {
        antialias: true,
        alpha: true,
        premultipliedAlpha: true
      }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) return;
    glRef.current = gl;

    var vertexSrc = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    var fragmentSrc = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "uniform vec2 u_pointer;",
      "",
      "float hash11(float p) {",
      "  p = fract(p * 0.1031);",
      "  p *= p + 33.33;",
      "  p *= p + p;",
      "  return fract(p);",
      "}",
      "",
      "float hash21(vec2 p) {",
      "  vec3 p3 = fract(vec3(p.xyx) * 0.1031);",
      "  p3 += dot(p3, p3.yzx + 33.33);",
      "  return fract((p3.x + p3.y) * p3.z);",
      "}",
      "",
      "mat2 rot(float a) {",
      "  float s = sin(a);",
      "  float c = cos(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float starField(vec2 uv, float t) {",
      "  vec2 gv = fract(uv) - 0.5;",
      "  vec2 id = floor(uv);",
      "  float n = hash21(id);",
      "  vec2 offs = vec2(hash21(id + 3.1), hash21(id + 7.2)) - 0.5;",
      "  vec2 p = gv - offs * 0.55;",
      "  float d = length(p);",
      "  float star = smoothstep(0.08, 0.0, d);",
      "  float flare = 0.0;",
      "  flare += smoothstep(0.22, 0.0, abs(p.x) * 0.7 + d * 0.35);",
      "  flare += smoothstep(0.22, 0.0, abs(p.y) * 0.7 + d * 0.35);",
      "  star *= step(0.82, n);",
      "  flare *= step(0.93, n);",
      "  float tw = 0.45 + 0.55 * sin(t * (2.5 + n * 9.0) + n * 40.0);",
      "  return star * (0.6 + 1.4 * tw) + flare * tw * 0.7;",
      "}",
      "",
      "float nebula(vec2 p, float t) {",
      "  float a = 0.0;",
      "  float f = 1.0;",
      "  float w = 0.55;",
      "  for (int i = 0; i < 6; i++) {",
      "    a += w * sin(p.x * f + t * 0.7) * cos(p.y * f - t * 0.5);",
      "    p = rot(1.05) * p * 1.35 + vec2(1.7, -1.2);",
      "    f *= 1.38;",
      "    w *= 0.58;",
      "  }",
      "  return a;",
      "}",
      "",
      "float spiral(vec2 p, float t) {",
      "  float r = length(p);",
      "  float ang = atan(p.y, p.x);",
      "  float arms = cos(ang * 6.0 - r * 9.0 + t * 2.4);",
      "  float ring = exp(-r * 2.2);",
      "  float core = exp(-r * 9.0);",
      "  return max(0.0, arms) * ring + core * 1.5;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);",
      "  vec2 puv = u_pointer * 2.0 - 1.0;",
      "  float t = u_time * 0.9;",
      "",
      "  vec2 p = uv;",
      "  p += puv * 0.18;",
      "  p *= rot(t * 0.08 + 0.2 * puv.x);",
      "",
      "  float warp = nebula(p * 1.35, t * 0.9);",
      "  vec2 q = p;",
      "  q += 0.14 * vec2(sin(warp + t), cos(warp * 1.2 - t * 0.7));",
      "",
      "  float g1 = spiral(q * vec2(1.0, 0.92), t);",
      "  float g2 = spiral((rot(1.0472) * q) * 1.28 + vec2(0.35, -0.18), -t * 0.7);",
      "  float cloud = nebula(q * 2.0 + vec2(0.0, t * 0.12), t * 0.6);",
      "  cloud = 0.5 + 0.5 * cloud;",
      "",
      "  float stars = 0.0;",
      "  stars += starField((uv + vec2(t * 0.06, 0.0)) * 10.0, t);",
      "  stars += 0.7 * starField((uv + vec2(t * 0.03, -t * 0.02)) * 18.0, t + 4.0);",
      "  stars += 0.45 * starField((uv + vec2(-t * 0.015, t * 0.01)) * 28.0, t + 9.0);",
      "",
      "  vec3 c0 = vec3(0.02, 0.01, 0.08);",
      "  vec3 c1 = vec3(0.18, 0.03, 0.32);",
      "  vec3 c2 = vec3(0.04, 0.38, 0.72);",
      "  vec3 c3 = vec3(0.82, 0.22, 0.95);",
      "  vec3 c4 = vec3(0.95, 0.72, 0.28);",
      "",
      "  vec3 col = c0;",
      "  col += c1 * smoothstep(0.18, 0.95, cloud) * 0.9;",
      "  col += c2 * pow(max(g1, 0.0), 1.15) * 1.2;",
      "  col += c3 * pow(max(g2, 0.0), 1.3) * 1.05;",
      "  col += c4 * exp(-length(q) * 7.5) * 0.85;",
      "  col += vec3(stars) * 1.2;",
      "",
      "  float vignette = smoothstep(1.55, 0.25, length(uv));",
      "  col *= vignette;",
      "  col = pow(col, vec3(0.82));",
      "",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function compile(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vs = compile(gl.VERTEX_SHADER, vertexSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    var aPosition = gl.getAttribLocation(program, "a_position");
    var uResolution = gl.getUniformLocation(program, "u_resolution");
    var uTime = gl.getUniformLocation(program, "u_time");
    var uPointer = gl.getUniformLocation(program, "u_pointer");

    programRef.current = program;
    bufferRef.current = buffer;
    uniformsRef.current = {
      aPosition: aPosition,
      uResolution: uResolution,
      uTime: uTime,
      uPointer: uPointer
    };

    function resize() {
      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));

      stateRef.current.width = width;
      stateRef.current.height = height;
      stateRef.current.dpr = dpr;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
      }
      gl.viewport(0, 0, width, height);
    }

    roRef.current = new ResizeObserver(function () {
      resize();
    });
    roRef.current.observe(wrap);
    resize();

    function onPointerMove(e) {
      var rect = wrap.getBoundingClientRect();
      var x = (e.clientX - rect.left) / Math.max(1, rect.width);
      var y = (e.clientY - rect.top) / Math.max(1, rect.height);
      stateRef.current.pointerX = Math.max(0, Math.min(1, x));
      stateRef.current.pointerY = 1 - Math.max(0, Math.min(1, y));
    }

    function onPointerLeave() {
      stateRef.current.pointerX += (0.5 - stateRef.current.pointerX) * 0.08;
      stateRef.current.pointerY += (0.5 - stateRef.current.pointerY) * 0.08;
    }

    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerleave", onPointerLeave);

    function renderFrame(ts) {
      if (!stateRef.current.start) stateRef.current.start = ts;
      stateRef.current.time = (ts - stateRef.current.start) * 0.001;

      stateRef.current.pointerX += (0.5 - stateRef.current.pointerX) * 0.002;
      stateRef.current.pointerY += (0.5 - stateRef.current.pointerY) * 0.002;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolution, stateRef.current.width, stateRef.current.height);
      gl.uniform1f(uTime, stateRef.current.time * 1.45);
      gl.uniform2f(uPointer, stateRef.current.pointerX, stateRef.current.pointerY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(renderFrame);
    }

    rafRef.current = requestAnimationFrame(renderFrame);

    return function () {
      cancelAnimationFrame(rafRef.current);
      if (roRef.current) roRef.current.disconnect();
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);

      if (glRef.current) {
        if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
        if (programRef.current) gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: wrapRef,
      className: "dark-component",
      style: {
        width: "100%",
        height: "680px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(26,10,52,1) 0%, rgba(6,8,20,1) 48%, rgba(2,3,10,1) 100%)",
        borderRadius: "24px",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.45), 0 0 80px rgba(114,58,255,0.18)"
      }
    },
    React.createElement("canvas", {
      ref: canvasRef,
      style: {
        display: "block",
        width: "100%",
        height: "100%"
      }
    }),
    React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: [
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.0) 18%)",
          "radial-gradient(circle at 20% 18%, rgba(140,80,255,0.16), rgba(140,80,255,0) 32%)",
          "radial-gradient(circle at 78% 28%, rgba(0,180,255,0.12), rgba(0,180,255,0) 28%)",
          "radial-gradient(circle at 50% 82%, rgba(255,80,180,0.10), rgba(255,80,180,0) 30%)"
        ].join(",")
      }
    })
  );
}