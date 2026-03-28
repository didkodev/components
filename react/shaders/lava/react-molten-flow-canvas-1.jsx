function LavaFlowLoopingShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#ff0033');
  const [secondaryColor, setSecondaryColor] = React.useState('#ff7700');
  const [speed, setSpeed] = React.useState(1);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = function(v) {
      setPrimaryColor(v);
      if (matRef.current) { var c = new THREE.Color(v); matRef.current.uniforms.uPrimary.value.set(c.r, c.g, c.b); }
    };
    window.__paramSetters['secondaryColor'] = function(v) {
      setSecondaryColor(v);
      if (matRef.current) { var c = new THREE.Color(v); matRef.current.uniforms.uSecondary.value.set(c.r, c.g, c.b); }
    };
    window.__paramSetters['speed'] = function(v) {
      setSpeed(Number(v));
      if (matRef.current) matRef.current.uniforms.uSpeed.value = Number(v);
    };
    window.__paramSetters['scale'] = function(v) {
      setScale(Number(v));
      if (matRef.current) matRef.current.uniforms.uScale.value = Number(v);
    };
  }, []);

  React.useEffect(function() {
    var el = mountRef.current;
    if (!el) return;
    var scene = new THREE.Scene();
    var cam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    var renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    var pc = new THREE.Color(primaryColor);
    var sc = new THREE.Color(secondaryColor);
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
        uPrimary: { value: new THREE.Vector3(pc.r, pc.g, pc.b) },
        uSecondary: { value: new THREE.Vector3(sc.r, sc.g, sc.b) },
        uSpeed: { value: 1.0 },
        uScale: { value: 1.0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec2 uRes;',
        'uniform vec3 uPrimary;',
        'uniform vec3 uSecondary;',
        'uniform float uSpeed;',
        'uniform float uScale;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 uv = vUv;',
        '  vec2 centered = uv - 0.5;',
        '  float aspect = uRes.x / uRes.y;',
        '  centered.x *= aspect;',
        '  vec2 p = centered * uScale;',
        '  float t = uTime * 0.3;',
        '  float ang = radians(75.0);',
        '  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));',
        '  vec2 rp = rot * p;',
        '  float field = 0.0;',
        '  float glowField = 0.0;',
        '',
        '  for (int i = 0; i < 12; i++) {',
        '    float fi = float(i);',
        '    float phaseA = fi * 0.53 + 0.7;',
        '    float phaseB = fi * 0.81 + 1.9;',
        '    float freq = 0.55 + fi * 0.037;',
        '    vec2 base = vec2(',
        '      sin(fi * 1.37) * 0.28,',
        '      cos(fi * 1.11) * 0.22',
        '    );',
        '    vec2 drift = vec2(',
        '      sin(t * freq + phaseA),',
        '      cos(t * freq * 0.7 + phaseB)',
        '    ) * vec2(0.16, 0.12);',
        '    vec2 flow = rot * (base + drift);',
        '    float r = 0.15 + 0.035 * sin(fi * 1.91 + 0.4);',
        '    float d = length(rp - flow);',
        '    field += (r * r) / (d * d + 0.018);',
        '    glowField += (r * 0.6) / (d + 0.08);',
        '  }',
        '',
        '  float wave1 = sin((rp.x * 3.2 + rp.y * 1.4) + t * 0.9) * 0.5 + 0.5;',
        '  float wave2 = cos((rp.y * 4.1 - rp.x * 1.7) + t * 0.7 + 1.2) * 0.5 + 0.5;',
        '  float wave3 = sin((rp.x + rp.y) * 5.0 + t * 0.6 + 2.4) * 0.5 + 0.5;',
        '  float wave4 = cos(length(rp) * 6.5 - t * 0.8 + 0.9) * 0.5 + 0.5;',
        '',
        '  float blobMask = smoothstep(2.6, 4.8, field);',
        '  float rim = smoothstep(2.1, 2.9, field) - smoothstep(2.9, 4.4, field);',
        '  float glow = smoothstep(1.4, 3.2, glowField) * (1.0 - blobMask) + rim * 1.1;',
        '',
        '  float mixA = smoothstep(0.2, 0.8, wave1 * 0.3 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.2);',
        '  float mixB = smoothstep(0.15, 0.85, wave2 * 0.4 + wave4 * 0.6);',
        '',
        '  vec3 baseCol = vec3(0.02, 0.02, 0.02);',
        '  vec3 lavaCol = mix(uPrimary, uSecondary, mixA);',
        '  vec3 innerCol = mix(lavaCol, mix(uPrimary, uSecondary, mixB), 0.5);',
        '  vec3 col = baseCol;',
        '  col += innerCol * blobMask * 0.95;',
        '  col += mix(uPrimary, uSecondary, mixB) * glow * 0.75;',
        '  col += mix(uSecondary, uPrimary, wave3) * rim * 0.35;',
        '  col = clamp(col, 0.0, 1.0);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    matRef.current = mat;
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

    var ro = new ResizeObserver(function() {
      renderer.setSize(el.clientWidth, el.clientHeight);
      mat.uniforms.uRes.value.set(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    var t = 0;
    function loop() {
      animRef.current = requestAnimationFrame(loop);
      t += 0.016 * mat.uniforms.uSpeed.value;
      mat.uniforms.uTime.value = t;
      renderer.render(scene, cam);
    }
    loop();

    return function() {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return React.createElement('div', {
    ref: mountRef,
    className: 'component-root dark-component',
    style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }
  });
}
export default LavaFlowLoopingShader;