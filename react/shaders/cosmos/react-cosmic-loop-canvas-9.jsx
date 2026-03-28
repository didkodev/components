export default function CosmosShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });

    if (!gl) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 1;
    var height = 1;
    var raf = 0;
    var start = performance.now();
    var mouseX = 0.5;
    var mouseY = 0.5;
    var intensity = 0.54;
    var speed = 1.55;

    var vertexSource = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    var fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "uniform vec2 u_mouse;",
      "",
      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 345.45));",
      "  p += dot(p, p + 34.345);",
      "  return fract(p.x * p.y);",
      "}",
      "",
      "float noise(vec2 p) {",
      "  vec2 i = floor(p);",
      "  vec2 f = fract(p);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;",
      "}",
      "",
      "float fbm(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);",
      "  for (int i = 0; i < 6; i++) {",
      "    v += a * noise(p);",
      "    p = m * p;",
      "    a *= 0.5;",
      "  }",
      "  return v;",
      "}",
      "",
      "vec3 palette(float t) {",
      "  vec3 a = vec3(0.03, 0.01, 0.08);",
      "  vec3 b = vec3(0.18, 0.05, 0.28);",
      "  vec3 c = vec3(0.2, 0.45, 0.9);",
      "  vec3 d = vec3(0.95, 0.35, 0.85);",
      "  vec3 e = vec3(0.95, 0.8, 0.3);",
      "  float x = clamp(t, 0.0, 1.0);",
      "  vec3 col = mix(a, b, smoothstep(0.0, 0.25, x));",
      "  col = mix(col, c, smoothstep(0.2, 0.55, x));",
      "  col = mix(col, d, smoothstep(0.45, 0.8, x));",
      "  col = mix(col, e, smoothstep(0.75, 1.0, x));",
      "  return col;",
      "}",
      "",
      "float starField(vec2 uv, float s) {",
      "  vec2 gv = fract(uv * s) - 0.5;",
      "  vec2 id = floor(uv * s);",
      "  float n = hash(id);",
      "  float star = smoothstep(0.06, 0.0, length(gv - vec2(n - 0.5, fract(n * 17.31) - 0.5) * 0.35));",
      "  star *= step(0.985, n);",
      "  return star;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);",
      "  vec2 m = (u_mouse - 0.5) * 2.0;",
      "",
      "  float t = u_time * 0.22;",
      "  float r = length(p);",
      "  float a = atan(p.y, p.x);",
      "",
      "  float swirl = sin(a * 4.0 - r * 7.0 + t * 3.0) * 0.35;",
      "  vec2 q = p;",
      "  q += normalize(p + 0.0001) * swirl * 0.25;",
      "  q += m * 0.18;",
      "",
      "  float nebA = fbm(q * 2.2 + vec2(t * 0.7, -t * 0.35));",
      "  float nebB = fbm((q + vec2(3.1, -1.7)) * 3.4 - vec2(t * 0.45, t * 0.55));",
      "  float ring = sin(r * 16.0 - t * 5.0 + nebA * 4.0) * 0.5 + 0.5;",
      "  float cloud = smoothstep(0.22, 0.92, mix(nebA, nebB, 0.5) + ring * 0.22 - r * 0.28);",
      "  float filaments = pow(max(0.0, 1.0 - abs(sin(a * 6.0 + nebB * 5.5 - t * 2.4))), 6.0);",
      "  cloud += filaments * 0.2;",
      "",
      "  vec3 col = palette(cloud);",
      "",
      "  float stars = 0.0;",
      "  stars += starField(uv + vec2(t * 0.01, 0.0), 26.0);",
      "  stars += starField(uv * 1.4 - vec2(t * 0.015, t * 0.01), 42.0) * 0.8;",
      "  stars += starField(uv * 2.1 + vec2(0.0, t * 0.02), 70.0) * 0.55;",
      "  stars *= 1.0 + 0.45 * sin(u_time * 2.3 + uv.x * 20.0 + uv.y * 14.0);",
      "",
      "  float core = exp(-r * 3.6) * (0.7 + 0.3 * sin(t * 4.0));",
      "  vec3 coreCol = vec3(0.9, 0.7, 1.0) * core + vec3(0.2, 0.6, 1.0) * core * 0.8;",
      "",
      "  col += coreCol;",
      "  col += vec3(1.0) * stars;",
      "  col *= 0.9 + cloud * 0.55;",
      "",
      "  float vignette = smoothstep(1.35, 0.2, r);",
      "  col *= vignette;",
      "  col += vec3(0.01, 0.015, 0.03);",
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

    var vs = compile(gl.VERTEX_SHADER, vertexSource);
    var fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

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

    var positionLoc = gl.getAttribLocation(program, "a_position");
    var timeLoc = gl.getUniformLocation(program, "u_time");
    var resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    var mouseLoc = gl.getUniformLocation(program, "u_mouse");

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      var rect = wrap.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    var ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(wrap);

    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / Math.max(1, rect.width);
      mouseY = 1 - (e.clientY - rect.top) / Math.max(1, rect.height);
    }

    function onTouch(e) {
      if (!e.touches || !e.touches.length) return;
      var rect = canvas.getBoundingClientRect();
      mouseX = (e.touches[0].clientX - rect.left) / Math.max(1, rect.width);
      mouseY = 1 - (e.touches[0].clientY - rect.top) / Math.max(1, rect.height);
    }

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("touchmove", onTouch, { passive: true });

    resize();

    function frame(now) {
      var t = ((now - start) / 1000) * speed;
      gl.useProgram(program);
      gl.uniform1f(timeLoc, t + intensity * 0.5);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(
        mouseLoc,
        mouseX * (0.85 + intensity * 0.35),
        mouseY * (0.85 + intensity * 0.35)
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return function () {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("touchmove", onTouch);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "720px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(36,20,64,0.35) 0%, rgba(10,8,22,1) 45%, rgba(3,4,10,1) 100%)",
        borderRadius: "24px",
        boxShadow: "inset 0 0 80px rgba(120,80,255,0.12), 0 20px 60px rgba(0,0,0,0.45)"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}