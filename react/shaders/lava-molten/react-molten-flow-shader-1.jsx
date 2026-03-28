export default function LavaMoltenShader() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });

    if (!gl) return;

    const vertexSource = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    const fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "",
      "float hash(vec2 p) {",
      "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
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
      "vec3 palette(float t) {",
      "  vec3 c1 = vec3(0.05, 0.01, 0.00);",
      "  vec3 c2 = vec3(0.38, 0.04, 0.00);",
      "  vec3 c3 = vec3(0.95, 0.24, 0.02);",
      "  vec3 c4 = vec3(1.00, 0.62, 0.08);",
      "  vec3 c5 = vec3(1.00, 0.92, 0.55);",
      "  vec3 col = mix(c1, c2, smoothstep(0.00, 0.25, t));",
      "  col = mix(col, c3, smoothstep(0.18, 0.52, t));",
      "  col = mix(col, c4, smoothstep(0.45, 0.82, t));",
      "  col = mix(col, c5, smoothstep(0.78, 1.00, t));",
      "  return col;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv - 0.5;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float time = u_time * 0.38;",
      "",
      "  vec2 q = p * 3.8;",
      "  q.y += time * 1.15;",
      "  q.x += sin(q.y * 1.6 + time * 0.9) * 0.22;",
      "",
      "  float n1 = fbm(q + vec2(0.0, -time * 0.55));",
      "  float n2 = fbm(q * 1.8 - vec2(time * 0.25, time * 0.9));",
      "  float n3 = fbm((q + vec2(n1, n2)) * 2.2);",
      "",
      "  float flow = n1 * 0.55 + n2 * 0.30 + n3 * 0.40;",
      "  float veins = 1.0 - abs(sin((p.y * 7.0 - flow * 4.8 + time * 1.6) * 1.2));",
      "  veins = pow(clamp(veins, 0.0, 1.0), 3.2);",
      "",
      "  float core = smoothstep(0.20, 0.88, flow + veins * 0.35);",
      "  float glow = smoothstep(0.52, 1.04, flow + veins * 0.6);",
      "",
      "  float crustNoise = fbm(p * 6.5 + vec2(time * 0.08, -time * 0.18));",
      "  float crust = smoothstep(0.42, 0.72, crustNoise - core * 0.28);",
      "",
      "  vec3 lava = palette(clamp(core + glow * 0.25, 0.0, 1.0));",
      "  vec3 darkRock = vec3(0.03, 0.02, 0.02);",
      "  vec3 ember = vec3(1.0, 0.5, 0.1) * glow * 0.35;",
      "",
      "  vec3 color = mix(lava, darkRock, crust * 0.72);",
      "  color += ember;",
      "",
      "  float vignette = 1.0 - dot(p * 0.72, p * 0.72);",
      "  color *= 0.58 + 0.55 * clamp(vignette, 0.0, 1.0);",
      "",
      "  color = pow(color, vec3(0.92));",
      "  gl_FragColor = vec4(color, 1.0);",
      "}"
    ].join("\n");

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

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
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    let width = 0;
    let height = 0;
    let rafId = 0;
    let startTime = performance.now();

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const observer = new ResizeObserver(function () {
      resize();
    });
    observer.observe(container);
    resize();

    function render(now) {
      const t = (now - startTime) * 0.001;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, t);

      gl.clearColor(0.01, 0.005, 0.005, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "640px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, #1a0500 0%, #090203 55%, #020102 100%)",
        borderRadius: "20px",
        boxShadow: "0 0 40px rgba(255,90,20,0.12), inset 0 0 60px rgba(0,0,0,0.45)"
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