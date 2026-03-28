export default function LavaMoltenShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", { antialias: true, alpha: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var raf = 0;
    var resizeObserver = null;
    var startTime = performance.now();
    var mouseX = 0.5;
    var mouseY = 0.5;
    var targetMouseX = 0.5;
    var targetMouseY = 0.5;

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
      "  f = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
      "}",
      "",
      "float fbm(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);",
      "  for (int i = 0; i < 6; i++) {",
      "    v += a * noise(p);",
      "    p = m * p;",
      "    a *= 0.52;",
      "  }",
      "  return v;",
      "}",
      "",
      "float ridge(float x) {",
      "  return 1.0 - abs(x * 2.0 - 1.0);",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv * 2.0 - 1.0;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.42;",
      "  float flowSpeed = 1.15;",
      "  float heat = 0.92;",
      "",
      "  vec2 q = p;",
      "  q.y += t * flowSpeed;",
      "  q.x += sin(q.y * 2.6 + t * 0.9) * 0.18;",
      "  q += (u_mouse - 0.5) * 0.55;",
      "",
      "  float n1 = fbm(q * 2.2);",
      "  float n2 = fbm(q * 4.3 + vec2(0.0, -t * 1.6));",
      "  float n3 = fbm(q * 8.0 + vec2(t * 0.6, -t * 2.2));",
      "",
      "  float rivers = n1 * 0.65 + n2 * 0.28 + n3 * 0.07;",
      "  rivers = smoothstep(0.22, 0.92, rivers);",
      "",
      "  float crack = ridge(fbm(q * 3.5 + n2 * 1.2));",
      "  crack = pow(clamp(crack, 0.0, 1.0), 2.7);",
      "",
      "  float molten = rivers * 0.78 + crack * 0.45;",
      "  molten += smoothstep(0.55, 1.0, n2) * 0.22;",
      "",
      "  float glow = pow(clamp(molten, 0.0, 1.0), 2.2);",
      "  float core = pow(clamp(molten * 1.18 - 0.08, 0.0, 1.0), 5.0);",
      "  float embers = pow(max(0.0, n3 - 0.68) / 0.32, 3.0) * 0.35;",
      "",
      "  vec3 rock = vec3(0.03, 0.01, 0.015);",
      "  rock += vec3(0.10, 0.03, 0.02) * pow(n1, 2.2);",
      "",
      "  vec3 lava1 = vec3(0.45, 0.03, 0.01);",
      "  vec3 lava2 = vec3(0.95, 0.24, 0.02);",
      "  vec3 lava3 = vec3(1.00, 0.68, 0.10);",
      "  vec3 lava4 = vec3(1.00, 0.93, 0.62);",
      "",
      "  vec3 col = rock;",
      "  col = mix(col, lava1, smoothstep(0.18, 0.42, glow));",
      "  col = mix(col, lava2, smoothstep(0.34, 0.63, glow * heat));",
      "  col = mix(col, lava3, smoothstep(0.58, 0.84, glow * heat));",
      "  col = mix(col, lava4, smoothstep(0.82, 1.0, core));",
      "",
      "  col += embers * vec3(1.0, 0.45, 0.12);",
      "",
      "  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.35;",
      "  vignette = clamp(vignette, 0.0, 1.0);",
      "  col *= vignette + 0.18;",
      "",
      "  float pulse = 0.94 + 0.06 * sin(u_time * 1.4 + n1 * 8.0);",
      "  col *= pulse;",
      "",
      "  col = pow(col, vec3(0.92));",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function createShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(vsSource, fsSource) {
      var vs = createShader(gl.VERTEX_SHADER, vsSource);
      var fs = createShader(gl.FRAGMENT_SHADER, fsSource);
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

    var program = createProgram(vertexSource, fragmentSource);
    if (!program) return;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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

    var positionLocation = gl.getAttribLocation(program, "a_position");
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var timeLocation = gl.getUniformLocation(program, "u_time");
    var mouseLocation = gl.getUniformLocation(program, "u_mouse");

    function resize() {
      var rect = wrap.getBoundingClientRect();
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function onPointerMove(e) {
      var rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / Math.max(1, rect.width);
      targetMouseY = 1 - (e.clientY - rect.top) / Math.max(1, rect.height);
    }

    function render(now) {
      resize();

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (now - startTime) * 0.001);
      gl.uniform2f(mouseLocation, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      raf = requestAnimationFrame(render);
    }

    canvas.addEventListener("pointermove", onPointerMove);

    resizeObserver = new ResizeObserver(function () {
      resize();
    });
    resizeObserver.observe(wrap);

    raf = requestAnimationFrame(render);

    return function () {
      canvas.removeEventListener("pointermove", onPointerMove);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(raf);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "560px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "24px",
        background: "radial-gradient(circle at 50% 50%, #1b0502 0%, #090204 55%, #020102 100%)",
        boxShadow: "inset 0 0 80px rgba(255,90,0,0.08), 0 20px 60px rgba(0,0,0,0.45)"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 20%, rgba(255,180,80,0.07), transparent 40%), radial-gradient(circle at 50% 100%, rgba(255,60,0,0.08), transparent 45%)"
        }}
      />
    </div>
  );
}