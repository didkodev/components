export default function LavaMoltenShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });

    if (!gl) return;

    let frameId = 0;
    let resizeObserver = null;
    let startTime = performance.now();
    let width = 1;
    let height = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const vertexSource = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}",
    ].join("\n");

    const fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "",
      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
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
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv - 0.5;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.38;",
      "",
      "  vec2 q = p * 3.4;",
      "  q.y += t * 0.9;",
      "  q.x += sin(q.y * 1.8 + t * 0.7) * 0.22;",
      "",
      "  float n1 = fbm(q + vec2(0.0, t * 0.4));",
      "  float n2 = fbm(q * 1.7 - vec2(t * 0.25, 0.0));",
      "  float veins = fbm(q * 2.8 + vec2(n1 * 0.8, n2 * 0.6));",
      "",
      "  float flow = n1 * 0.65 + n2 * 0.45 + veins * 0.55;",
      "  flow += sin((p.y + flow * 0.2) * 9.0 - t * 3.0) * 0.06;",
      "",
      "  float cracks = smoothstep(0.46, 0.88, flow);",
      "  float molten = smoothstep(0.18, 0.92, flow + p.y * 0.18 + 0.15);",
      "  float glow = pow(max(molten, 0.0), 2.4);",
      "  float edge = smoothstep(0.55, 1.0, cracks);",
      "",
      "  vec3 deep = vec3(0.08, 0.02, 0.01);",
      "  vec3 rock = vec3(0.22, 0.06, 0.02);",
      "  vec3 hot = vec3(0.88, 0.20, 0.03);",
      "  vec3 hotter = vec3(1.00, 0.48, 0.05);",
      "  vec3 core = vec3(1.00, 0.86, 0.28);",
      "",
      "  vec3 col = mix(deep, rock, cracks * 0.9);",
      "  col = mix(col, hot, smoothstep(0.26, 0.62, molten));",
      "  col = mix(col, hotter, smoothstep(0.48, 0.82, molten + veins * 0.14));",
      "  col = mix(col, core, smoothstep(0.74, 1.02, glow + edge * 0.18));",
      "",
      "  float embers = pow(max(noise(q * 7.0 + t * 0.8) - 0.78, 0.0) * 4.5, 2.0);",
      "  col += vec3(1.0, 0.45, 0.08) * embers * 0.22;",
      "",
      "  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 0.9;",
      "  col *= vignette;",
      "  col += glow * vec3(0.18, 0.05, 0.01);",
      "",
      "  col = pow(col, vec3(0.92));",
      "  gl_FragColor = vec4(col, 1.0);",
      "}",
    ].join("\n");

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, vertexSource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, "a_position");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render(now) {
      const time = (now - startTime) * 0.001;
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameId = requestAnimationFrame(render);
    }

    resizeObserver = new ResizeObserver(function () {
      resize();
    });
    resizeObserver.observe(wrap);
    resize();
    frameId = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
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
        borderRadius: "20px",
        background:
          "radial-gradient(circle at 50% 50%, rgba(80,20,6,0.45) 0%, rgba(18,6,4,1) 60%, rgba(6,3,3,1) 100%)",
        boxShadow:
          "inset 0 0 80px rgba(255,120,20,0.08), 0 20px 60px rgba(0,0,0,0.45)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 120%, rgba(255,180,60,0.08), rgba(0,0,0,0) 45%), linear-gradient(180deg, rgba(255,120,20,0.05), rgba(0,0,0,0) 35%, rgba(0,0,0,0.18) 100%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}