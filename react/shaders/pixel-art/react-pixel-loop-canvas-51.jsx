export default function PixelArtShaderLoop() {
  const canvasRef = React.useRef(null)
  const wrapRef = React.useRef(null)

  React.useEffect(function () {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    })
    if (!gl) return

    const vertexSource = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n')

    const fragmentSource = [
      'precision mediump float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      '',
      'float hash(vec2 p) {',
      '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
      '}',
      '',
      'float noise(vec2 p) {',
      '  vec2 i = floor(p);',
      '  vec2 f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  float a = hash(i);',
      '  float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0));',
      '  float d = hash(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      '',
      'mat2 rot(float a) {',
      '  float s = sin(a);',
      '  float c = cos(a);',
      '  return mat2(c, -s, s, c);',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 res = u_resolution;',
      '',
      '  float pixelSize = 7.0;',
      '  vec2 gridRes = floor(res / pixelSize);',
      '  vec2 cell = floor(frag / pixelSize);',
      '  vec2 uv = (cell + 0.5) / gridRes;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= res.x / res.y;',
      '',
      '  float t = u_time * 0.68;',
      '',
      '  vec2 q = p;',
      '  q *= rot(0.35 * sin(t * 0.8));',
      '',
      '  float radial = length(q);',
      '  float angle = atan(q.y, q.x);',
      '',
      '  float bands = sin(angle * 9.0 + t * 1.8 + radial * 12.0);',
      '  float rings = sin(radial * 28.0 - t * 3.6);',
      '  float swirl = sin((q.x + q.y) * 10.0 + t * 2.2);',
      '',
      '  float n1 = noise(q * 6.0 + vec2(t * 0.9, -t * 0.5));',
      '  float n2 = noise(q * 11.0 - vec2(t * 0.4, t * 0.7));',
      '',
      '  float field = 0.0;',
      '  field += bands * 0.34;',
      '  field += rings * 0.28;',
      '  field += swirl * 0.18;',
      '  field += (n1 - 0.5) * 0.55;',
      '  field += (n2 - 0.5) * 0.35;',
      '  field += (0.42 - radial) * 1.2;',
      '',
      '  float levels = 6.0;',
      '  float poster = floor((field * 0.5 + 0.5) * levels) / levels;',
      '  poster = clamp(poster, 0.0, 1.0);',
      '',
      '  vec3 c1 = vec3(0.05, 0.02, 0.12);',
      '  vec3 c2 = vec3(0.18, 0.04, 0.42);',
      '  vec3 c3 = vec3(0.04, 0.52, 0.85);',
      '  vec3 c4 = vec3(0.98, 0.28, 0.62);',
      '  vec3 c5 = vec3(1.00, 0.80, 0.22);',
      '',
      '  vec3 color = c1;',
      '  color = mix(color, c2, smoothstep(0.08, 0.22, poster));',
      '  color = mix(color, c3, smoothstep(0.22, 0.42, poster));',
      '  color = mix(color, c4, smoothstep(0.42, 0.70, poster));',
      '  color = mix(color, c5, smoothstep(0.70, 1.00, poster));',
      '',
      '  float checker = mod(cell.x + cell.y, 2.0);',
      '  color *= 0.92 + 0.08 * checker;',
      '',
      '  vec2 inCell = fract(frag / pixelSize);',
      '  float edge = min(min(inCell.x, inCell.y), min(1.0 - inCell.x, 1.0 - inCell.y));',
      '  float border = smoothstep(0.02, 0.12, edge);',
      '  color *= 0.72 + 0.28 * border;',
      '',
      '  float vignette = smoothstep(1.5, 0.2, length(p));',
      '  color *= vignette;',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n')

    function compile(type, source) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
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
    )

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')

    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const rect = wrap.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const ro = new ResizeObserver(function () {
      resize()
    })
    ro.observe(wrap)
    resize()

    const start = performance.now()

    function frame(now) {
      const t = (now - start) / 1000

      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform1f(timeLocation, t)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return function () {
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="dark-component"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '540px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #05030a 0%, #090611 100%)',
        borderRadius: '20px',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 18px 60px rgba(0,0,0,0.45)'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  )
}