function LavaLampFlowShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#cc2200');
  const [secondaryColor, setSecondaryColor] = React.useState('#ffbb00');
  const [speed, setSpeed] = React.useState(1);
  const [scale, setScale] = React.useState(1);

  const [blobCount, setBlobCount] = React.useState(6);
  const [glowIntensity, setGlowIntensity] = React.useState(0.0);
  const [offsetX, setOffsetX] = React.useState(0.0);
  const [offsetY, setOffsetY] = React.useState(0.0);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = (v) => { setPrimaryColor(v); if(matRef.current){ var c=new THREE.Color(v); matRef.current.uniforms.uPrimary.value.set(c.r,c.g,c.b); }};
    window.__paramSetters['secondaryColor'] = (v) => { setSecondaryColor(v); if(matRef.current){ var c=new THREE.Color(v); matRef.current.uniforms.uSecondary.value.set(c.r,c.g,c.b); }};
    window.__paramSetters['speed'] = (v) => { setSpeed(Number(v)); if(matRef.current) matRef.current.uniforms.uSpeed.value=Number(v); };
    window.__paramSetters['scale'] = (v) => { setScale(Number(v)); if(matRef.current) matRef.current.uniforms.uScale.value=Number(v); };
    window.__paramSetters['blobCount'] = (v) => { setBlobCount(Number(v)); if(matRef.current) matRef.current.uniforms.uBlobCount.value=Number(v); };
    window.__paramSetters['glowIntensity'] = (v) => { setGlowIntensity(Number(v)); if(matRef.current) matRef.current.uniforms.uGlow.value=Number(v); };
    window.__paramSetters['offsetX'] = (v) => { setOffsetX(Number(v)); if(matRef.current) matRef.current.uniforms.uOffsetX.value=Number(v); };
    window.__paramSetters['offsetY'] = (v) => { setOffsetY(Number(v)); if(matRef.current) matRef.current.uniforms.uOffsetY.value=Number(v); };
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
        uScale: { value: 1.0 },
        uBlobCount: { value: 6 },
        uGlow: { value: 0.0 },
        uOffsetX: { value: 0.0 },
        uOffsetY: { value: 0.0 }
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
        'uniform float uBlobCount;',
        'uniform float uGlow;',
        'uniform float uOffsetX;',
        'uniform float uOffsetY;',
        'void main() {',
        '  vec2 uv = vUv;',
        '  vec2 p = (vUv - 0.5 + vec2(uOffsetX, uOffsetY)) / uScale + 0.5;',
        '  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);',
        '  float t = uTime;',
        '  float tilt = 2.8623399733;',
        '  mat2 rot = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));',
        '  vec2 centered = (p - 0.5) * aspect;',
        '  vec2 rp = rot * centered;',
        '  float field = 0.0;',
        '  for (int i = 0; i < 15; i++) {',
        '    if (i >= int(uBlobCount)) break;',
        '    float fi = float(i);',
        '    float phaseA = fi * 1.413 + 0.7;',
        '    float phaseB = fi * 2.173 + 1.9;',
        '    float phaseC = fi * 0.917 + 2.4;',
        '    float freq = 0.35 + fi * 0.045;',
        '    vec2 base = vec2(',
        '      -0.28 + 0.11 * fi,',
        '      sin(fi * 0.8) * 0.18',
        '    );',
        '    vec2 drift = vec2(',
        '      0.16 * sin(t * freq + phaseA) + 0.06 * sin(t * (freq * 1.7) + phaseC),',
        '      0.20 * cos(t * (freq * 0.7) + phaseB) + 0.05 * cos(t * (freq * 1.3) + phaseA)',
        '    );',
        '    vec2 c = rot * (base + drift);',
        '    float r = 0.17 + 0.025 * sin(t * (freq * 0.9) + phaseB);',
        '    float d = length(rp - c);',
        '    field += (r * r) / max(d * d, 0.0008);',
        '  }',
        '  float w1 = sin((p.x * 3.2 + p.y * 1.4) * uScale + t * 0.35) * 0.5 + 0.5;',
        '  float w2 = cos((p.y * 4.1 - p.x * 1.8) * uScale + t * 0.28 + 1.3) * 0.5 + 0.5;',
        '  float w3 = sin((p.x + p.y) * 5.0 * uScale + t * 0.22 + 2.1) * 0.5 + 0.5;',
        '  float w4 = cos(length((p - 0.5) * 2.0) * 6.0 * uScale - t * 0.31 + 0.8) * 0.5 + 0.5;',
        '  float organic = (w1 * 0.3 + w2 * 0.25 + w3 * 0.25 + w4 * 0.2);',
        '  float blobMask = smoothstep(1.9, 2.35, field + organic * 0.65);',
        '  float rim = smoothstep(1.7, 2.0, field + organic * 0.5) - smoothstep(2.0, 2.3, field + organic * 0.5);',
        '  vec3 lavaMix = mix(uPrimary, uSecondary, smoothstep(0.2, 0.85, organic));',
        '  vec3 col = vec3(0.02, 0.01, 0.01);',
        '  col += lavaMix * blobMask * 0.95;',
        '  col += mix(uSecondary, uPrimary, organic) * rim * (0.35 + uGlow);',
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
export default LavaLampFlowShader;