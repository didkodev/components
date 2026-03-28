function AuroraCurtainShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#00ff87');
  const [secondaryColor, setSecondaryColor] = React.useState('#7700ff');
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
        '  vec2 p = uv * uScale;',
        '  float t = uTime;',
        '  float drift = t * 0.22;',
        '  float curtain1 = sin(p.x * 2.4 + sin(p.y * 1.6 + drift * 0.7) * 1.2 - drift);',
        '  float curtain2 = cos(p.x * 4.1 - p.y * 1.1 + drift * 0.8 + 1.3);',
        '  float curtain3 = sin((p.x * 1.8 + p.y * 2.6) + drift * 0.55 + 2.1);',
        '  float curtain4 = cos((p.x - 0.5) * 6.0 + sin(p.y * 3.2 + drift) * 1.4 - drift * 1.1);',
        '  float waveA = curtain1 * 0.5 + 0.5;',
        '  float waveB = curtain2 * 0.5 + 0.5;',
        '  float waveC = curtain3 * 0.5 + 0.5;',
        '  float waveD = curtain4 * 0.5 + 0.5;',
        '  float verticalFade = smoothstep(1.05, 0.15, uv.y);',
        '  float band1 = smoothstep(0.25, 0.9, waveA * 0.55 + waveC * 0.45) * verticalFade;',
        '  float band2 = smoothstep(0.3, 0.95, waveB * 0.6 + waveD * 0.4) * verticalFade;',
        '  float band3 = smoothstep(0.35, 0.98, mix(waveA, waveB, 0.5) + waveC * 0.25) * verticalFade * 0.85;',
        '  float glow = smoothstep(0.45, 1.0, band1 + band2 + band3);',
        '  vec3 col = vec3(0.02, 0.02, 0.02);',
        '  col += uPrimary * band1 * 0.55;',
        '  col += uSecondary * band2 * 0.5;',
        '  col += mix(uPrimary, uSecondary, waveC) * band3 * 0.45;',
        '  col += mix(uSecondary, uPrimary, waveD) * glow * 0.22;',
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
export default AuroraCurtainShader;