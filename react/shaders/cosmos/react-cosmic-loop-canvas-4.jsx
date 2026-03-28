export default function CosmosShaderCanvas() {
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
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
      "}",
      "",
      "float fbm(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  for (int i = 0; i < 6; i++) {",
      "    v += a * noise(p);",
      "    p = p * 2.03 + vec2(17.1, 9.7);",
      "    a *= 0.52;",
      "  }",
      "  return v;",
      "}",
      "",
      "mat2 rot(float a) {",
      "  float c = cos(a);",
      "  float s = sin(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float starField(vec2 uv, float depth) {",
      "  vec2 gv = uv * depth;",
      "  vec2 id = floor(gv);",
      "  vec2 f = fract(gv) - 0.5;",
      "  float m = 0.0;",
      "  for (int y = -1; y <= 1; y++) {",
      "    for (int x = -1; x <= 1; x++) {",
      "      vec2 offs = vec2(float(x), float(y));",
      "      vec2 cell = id + offs;",
      "      vec2 rnd = vec2(hash(cell), hash(cell + 23.17));",
      "      vec2 p = offs + rnd - 0.5;",
      "      float d = length(f - p);",
      "      float s = smoothstep(0.06, 0.0, d);",
      "      float tw = 0.55 + 0.45 * sin(u_time * 3.6 + hash(cell + 9.1) * 6.2831);",
      "      m += s * tw * step(0.86, hash(cell + 3.7));",
      "    }",
      "  }",
      "  return m;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);",
      "  vec2 p = uv;",
      "",
      "  float t = u_time * 0.42;",
      "  float r = length(p);",
      "  float a = atan(p.y, p.x);",
      "",
      "  p *= rot(0.35 * sin(t * 0.7));",
      "",
      "  float spiral = sin(a * 4.0 - r * 11.0 + t * 3.2);",
      "  float arms = smoothstep(-0.35, 0.85, spiral);",
      "",
      "  vec2 flow = vec2(",
      "    fbm(p * 2.6 + vec2(t * 0.28, -t * 0.19)),",
      "    fbm(p * 2.6 + vec2(-t * 0.21, t * 0.24) + 4.0)",
      "  );",
      "  vec2 q = p * 1.9 + (flow - 0.5) * 1.5;",
      "",
      "  float nebula = fbm(q * 1.8 + vec2(0.0, t * 0.18));",
      "  float dust = fbm(q * 4.4 - vec2(t * 0.12, 0.0));",
      "  float cloud = smoothstep(0.28, 0.95, nebula * 0.9 + arms * 0.42 - r * 0.38);",
      "",
      "  float ring = exp(-4.2 * abs(r - 0.42 - 0.05 * sin(a * 3.0 - t)));",
      "  float core = exp(-9.0 * r * r);",
      "",
      "  float starsA = starField(p * rot(0.08 * t), 11.0);",
      "  float starsB = starField((p + vec2(t * 0.015, -t * 0.01)) * rot(-0.12 * t), 23.0) * 0.7;",
      "  float starsC = starField((p * 1.5 - vec2(t * 0.03, 0.0)), 37.0) * 0.45;",
      "  float stars = starsA + starsB + starsC;",
      "",
      "  vec3 c1 = vec3(0.06, 0.02, 0.13);",
      "  vec3 c2 = vec3(0.18, 0.05, 0.36);",
      "  vec3 c3 = vec3(0.10, 0.42, 0.66);",
      "  vec3 c4 = vec3(0.86, 0.24, 0.74);",
      "  vec3 c5 = vec3(0.98, 0.66, 0.28);",
      "",
      "  vec3 col = mix(c1, c2, smoothstep(-0.9, 0.8, p.y + 0.2));",
      "  col = mix(col, c3, smoothstep(0.2, 0.95, nebula));",
      "  col = mix(col, c4, cloud * 0.75);",
      "  col += c5 * ring * 0.45;",
      "  col += vec3(1.0, 0.92, 0.84) * core * 1.25;",
      "  col += vec3(0.95, 0.98, 1.0) * stars * 1.1;",
      "",
      "  float vignette = smoothstep(1.45, 0.18, r);",
      "  col *= vignette;",
      "",
      "  col += 0.10 * vec3(dust * 0.8, dust * 0.35, dust) * cloud;",
      "  col = pow(col, vec3(0.82));",
      "",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function createShader(type, source) {
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

    function createProgram(vsSource, fsSource) {
      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return null;
      const program = gl.createProgram();
      if (!program) return null;
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

    const program = createProgram(vertexSource, fragmentSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");

    let raf = 0;
    let start = performance.now();

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(wrap);
    resize();

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const time = (now - start) * 0.001 * 1.36;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    raf = requestAnimationFrame(frame);

    return function () {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: wrapRef,
      className: "dark-component",
      style: {
        width: "100%",
        height: "720px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(35,16,72,0.35) 0%, rgba(8,8,18,1) 58%, rgba(2,2,8,1) 100%)",
        borderRadius: "20px",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset, 0 30px 80px rgba(0,0,0,0.45)"
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
        background:
          "radial-gradient(circle at 50% 55%, rgba(255,180,120,0.05), rgba(0,0,0,0) 28%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))"
      }
    })
  );
}