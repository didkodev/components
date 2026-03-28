function AuroraShader() {
  const mountRef = React.useRef(null);
  const rendererRef = React.useRef(null);
  const materialRef = React.useRef(null);
  const animRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#00ff87');
  const [secondaryColor, setSecondaryColor] = React.useState('#0066ff');
  const [speed, setSpeed] = React.useState(1);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = function(v) {
      setPrimaryColor(v);
      if (materialRef.current) {
        var c = new THREE.Color(v);
        materialRef.current.uniforms.uPrimaryColor.value.set(c.r, c.g, c.b);
      }
    };
    window.__paramSetters['secondaryColor'] = function(v) {
      setSecondaryColor(v);
      if (materialRef.current) {
        var c = new THREE.Color(v);
        materialRef.current.uniforms.uSecondaryColor.value.set(c.r, c.g, c.b);
      }
    };
    window.__paramSetters['speed'] = function(v) {
      setSpeed(Number(v));
      if (materialRef.current) materialRef.current.uniforms.uSpeed.value = Number(v);
    };
    window.__paramSetters['scale'] = function(v) {
      setScale(Number(v));
      if (materialRef.current) materialRef.current.uniforms.uScale.value = Number(v);
    };
  }, []);

  React.useEffect(() => {
    var container = mountRef.current;
    if (!container) return;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    var pc = new THREE.Color(primaryColor);
    var sc = new THREE.Color(secondaryColor);

    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uPrimaryColor: { value: new THREE.Vector3(pc.r, pc.g, pc.b) },
        uSecondaryColor: { value: new THREE.Vector3(sc.r, sc.g, sc.b) },
        uSpeed: { value: speed },
        uScale: { value: scale }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec2 uResolution;',
        'uniform vec3 uPrimaryColor;',
        'uniform vec3 uSecondaryColor;',
        'uniform float uSpeed;',
        'uniform float uScale;',
        'varying vec2 vUv;',

        'float hash(float n) {',
        '  return fract(sin(n) * 43758.5453123);',
        '}',

        'float noise(vec2 p) {',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  float a = hash(i.x + i.y * 57.0);',
        '  float b = hash(i.x + 1.0 + i.y * 57.0);',
        '  float c = hash(i.x + (i.y + 1.0) * 57.0);',
        '  float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);',
        '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
        '}',

        'float fbm(vec2 p) {',
        '  float val = 0.0;',
        '  float amp = 0.5;',
        '  float freq = 1.0;',
        '  for (int i = 0; i < 5; i++) {',
        '    val += amp * noise(p * freq);',
        '    amp *= 0.5;',
        '    freq *= 2.1;',
        '  }',
        '  return val;',
        '}',

        'void main() {',
        '  vec2 uv = vUv;',
        '  float t = uTime * 0.18;',
        '  float scl = uScale * 0.7;',

        '  vec3 purple = vec3(0.467, 0.0, 1.0);',
        '  vec3 accent = mix(uPrimaryColor, vec3(0.0, 0.8, 0.4), 0.3);',

        // Layer 1: base curtain bands
        '  float cx = uv.x * 3.5 * scl;',
        '  float wave1 = sin(cx + t * 0.7) * 0.18 + sin(cx * 1.3 - t * 0.5) * 0.12;',
        '  float band1 = smoothstep(0.0, 0.55, uv.y + wave1) * smoothstep(1.0, 0.45, uv.y + wave1 * 0.6);',

        // Layer 2: secondary curtain offset
        '  float cx2 = uv.x * 2.8 * scl + 1.5;',
        '  float wave2 = sin(cx2 * 0.9 - t * 0.6) * 0.2 + cos(cx2 * 1.6 + t * 0.4) * 0.1;',
        '  float band2 = smoothstep(0.0, 0.6, uv.y + wave2 + 0.05) * smoothstep(1.05, 0.5, uv.y + wave2 * 0.8);',

        // Layer 3: flowing noise curtain
        '  vec2 noiseCoord = vec2(uv.x * 2.0 * scl + t * 0.25, uv.y * 1.5 + t * 0.1);',
        '  float fbmVal = fbm(noiseCoord);',
        '  float wave3 = (fbmVal - 0.5) * 0.35;',
        '  float band3 = smoothstep(0.05, 0.65, uv.y + wave3) * smoothstep(1.0, 0.35, uv.y + wave3 * 1.2);',

        // Vertical fading shimmer streaks
        '  float streakX = uv.x * 5.5 * scl;',
        '  float streak1 = sin(streakX + t * 1.1) * 0.5 + 0.5;',
        '  streak1 = pow(streak1, 4.0) * 0.6;',
        '  float streakFade = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.7, uv.y);',
        '  float streaks = streak1 * streakFade;',

        // Glow layer along curtain edges
        '  float glowX = uv.x * 4.0 * scl;',
        '  float glowWave = sin(glowX * 1.2 + t * 0.8) * 0.15 + cos(glowX * 0.7 - t * 0.6) * 0.1;',
        '  float glowBand = exp(-pow((uv.y - 0.5 + glowWave) * 3.5, 2.0));',
        '  glowBand *= 0.5 + 0.5 * sin(glowX + t * 1.3);',

        // opacity variation for depth
        '  float opacityVar = 0.7 + 0.3 * sin(uv.x * 6.0 * scl + t * 0.4) * cos(uv.y * 3.0 + t * 0.3);',

        // Combine colors
        '  vec3 dark = vec3(0.02, 0.02, 0.06);',
        '  vec3 col = dark;',

        '  col = mix(col, uPrimaryColor, band1 * 0.55 * opacityVar);',
        '  col = mix(col, uSecondaryColor, band2 * 0.5 * opacityVar);',
        '  col = mix(col, purple, band3 * 0.45 * opacityVar);',
        '  col += accent * streaks * 0.35;',
        '  col += uPrimaryColor * glowBand * 0.22;',
        '  col += uSecondaryColor * glowBand * 0.15 * sin(t * 0.9 + uv.x * 3.14);',

        // Subtle vertical gradient base
        '  float vertGrad = smoothstep(1.0, 0.0, uv.y);',
        '  col = mix(col, dark, vertGrad * 0.4);',
        '  col = mix(col, dark, (1.0 - uv.y) * 0.3);',

        // Top glow
        '  float topGlow = smoothstep(0.4, 1.0, uv.y) * 0.25;',
        '  col += uPrimaryColor * topGlow * (0.5 + 0.5 * sin(uv.x * 5.0 * scl + t));',

        // Clamp and gamma
        '  col = clamp(col, 0.0, 1.0);',
        '  col = pow(col, vec3(0.88));',

        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    materialRef.current = material;

    var geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    var ro = new ResizeObserver(function() {
      var w = container.clientWidth;
      var h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    });
    ro.observe(container);

    var clock = new THREE.Clock();
    function animate() {
      animRef.current = requestAnimationFrame(animate);
      material.uniforms.uTime.value += clock.getDelta() * material.uniforms.uSpeed.value;
      renderer.render(scene, camera);
    }
    animate();

    return function() {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return React.createElement('div', {
    ref: mountRef,
    className: 'component-root dark-component',
    style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }
  });
}
export default AuroraShader;