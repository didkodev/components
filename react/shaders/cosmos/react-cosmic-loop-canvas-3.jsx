export default function CosmosShader() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl");

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
      "uniform float u_intensity;",
      "",
      "float hash21(vec2 p) {",
      "  p = fract(p * vec2(123.34, 345.45));",
      "  p += dot(p, p + 34.345);",
      "  return fract(p.x * p.y);",
      "}",
      "",
      "mat2 rot(float a) {",
      "  float s = sin(a);",
      "  float c = cos(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float starfield(vec2 uv, float t) {",
      "  vec2 gv = fract(uv) - 0.5;",
      "  vec2 id = floor(uv);",
      "  float n = hash21(id);",
      "  float sparkle = 0.002 / max(length(gv), 0.001);",
      "  sparkle *= smoothstep(0.98, 1.0, n);",
      "  sparkle *= 0.5 + 0.5 * sin(t * 2.0 + n * 20.0);",
      "  return sparkle;",
      "}",
      "",
      "float nebula(vec2 p, float t) {",
      "  float acc = 0.0;",
      "  float amp = 0.55;",
      "  for (int i = 0; i < 6; i++) {",
      "    p *= rot(0.55 + float(i) * 0.23);",
      "    p += vec2(sin(t * 0.13 + float(i) * 1.7), cos(t * 0.11 + float(i) * 1.3)) * 0.18;",
      "    acc += amp / (abs(p.x * p.y) + 0.23);",
      "    p = p * 1.35 + 0.27;",
      "    amp *= 0.62;",
      "  }",
      "  return acc;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);",
      "  float t = u_time * 0.55;",
      "",
      "  vec2 p = uv;",
      "  float r = length(p);",
      "  float a = atan(p.y, p.x);",
      "",
      "  p *= rot(t * 0.12);",
      "  p += vec2(sin(a * 6.0 + t) * 0.08, cos(a * 5.0 - t * 0.7) * 0.08);",
      "",
      "  float n = nebula(p * 1.8, t) * 0.18;",
      "  float arms = sin(a * 6.0 - r * 11.0 + t * 1.6) * 0.5 + 0.5;",
      "  float ring = exp(-r * 2.8);",
      "  float core = exp(-r * 11.0);",
      "  float vortex = pow(max(0.0, 1.0 - r), 2.0) * arms * ring;",
      "",
      "  vec3 c1 = vec3(0.03, 0.01, 0.08);",
      "  vec3 c2 = vec3(0.10, 0.05, 0.24);",
      "  vec3 c3 = vec3(0.32, 0.10, 0.58);",
      "  vec3 c4 = vec3(0.12, 0.45, 0.92);",
      "  vec3 c5 = vec3(0.95, 0.35, 0.82);",
      "",
      "  vec3 col = mix(c1, c2, smoothstep(0.0, 0.7, n));",
      "  col = mix(col, c3, smoothstep(0.25, 0.95, vortex + n * 0.4));",
      "  col = mix(col, c4, smoothstep(0.45, 1.2, vortex * 1.2));",
      "  col += c5 * core * 0.9;",
      "",
      "  vec2 suv = uv * 10.0 + vec2(t * 0.15, -t * 0.07);",
      "  float stars = 0.0;",
      "  stars += starfield(suv, t);",
      "  stars += starfield(suv * 1.7 + 13.7, t * 1.2) * 0.7;",
      "  stars += starfield(suv * 2.9 - 7.3, t * 1.4) * 0.45;",
      "",
      "  float haze = exp(-r * 1.4) * 0.25;",
      "  col += vec3(0.12, 0.18, 0.35) * haze;",
      "  col += vec3(stars);",
      "  col *= 0.9 + u_intensity * 0.35;",
      "",
      "  float vignette = smoothstep(1.45, 0.2, r);",
      "  col *= vignette;",
      "",
      "  col = pow(col, vec3(0.85));",
      "  gl_FragColor = vec4(col, 1.0);",
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
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");

    let rafId = 0;
    let start = performance.now();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const observer = new ResizeObserver(function () {
      resize();
    });
    observer.observe(container);
    resize();

    function render(now) {
      const elapsed = (now - start) * 0.001;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform1f(intensityLocation, 0.4);

      gl.clearColor(0.01, 0.01, 0.03, 1);
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

  return React.createElement(
    "div",
    {
      ref: containerRef,
      className: "dark-component",
      style: {
        width: "100%",
        height: "100%",
        minHeight: "520px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(26,18,60,0.35), rgba(4,5,18,1) 65%, rgba(1,1,8,1) 100%)",
        borderRadius: "24px",
        boxShadow: "inset 0 0 80px rgba(110,70,255,0.12), 0 20px 60px rgba(0,0,0,0.45)"
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
    React.createElement("div", {
      style: {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), rgba(255,255,255,0.0) 38%), radial-gradient(circle at 30% 20%, rgba(95,140,255,0.08), rgba(0,0,0,0) 30%), radial-gradient(circle at 70% 75%, rgba(255,90,220,0.08), rgba(0,0,0,0) 28%)"
      }
    })
  );
}