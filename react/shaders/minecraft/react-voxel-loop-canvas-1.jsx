export default function MinecraftShader() {
  var canvasRef = React.useRef(null);
  var animFrameRef = React.useRef(null);
  var startTimeRef = React.useRef(Date.now());
  var paramsRef = React.useRef({
    speed: 0.6,
    blockSize: 32,
    glowIntensity: 1.3,
    colorShift: 0.5,
    fogDensity: 0.7,
    waveAmp: 1.0
  });

  React.useEffect(function() {
    // Register param setters for external control
    window.__paramSetters = {
      speed: function(v) { paramsRef.current.speed = parseFloat(v); },
      blockSize: function(v) { paramsRef.current.blockSize = parseFloat(v); },
      glowIntensity: function(v) { paramsRef.current.glowIntensity = parseFloat(v); },
      colorShift: function(v) { paramsRef.current.colorShift = parseFloat(v); },
      fogDensity: function(v) { paramsRef.current.fogDensity = parseFloat(v); },
      waveAmp: function(v) { paramsRef.current.waveAmp = parseFloat(v); }
    };

    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // ResizeObserver for responsive canvas
    var resizeObserver = new ResizeObserver(function(entries) {
      for (var entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvas.parentElement || canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Noise helper - simple pseudo-random
    function hash(x, y) {
      var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }

    // Smooth noise interpolation
    function smoothNoise(x, y) {
      var ix = Math.floor(x);
      var iy = Math.floor(y);
      var fx = x - ix;
      var fy = y - iy;
      // Smoothstep
      var ux = fx * fx * (3.0 - 2.0 * fx);
      var uy = fy * fy * (3.0 - 2.0 * fy);
      var a = hash(ix, iy);
      var b = hash(ix + 1, iy);
      var c = hash(ix, iy + 1);
      var d = hash(ix + 1, iy + 1);
      return a + (b - a) * ux + (c - a) * uy + (d - b - c + a) * ux * uy;
    }

    // Fractal brownian motion
    function fbm(x, y, octaves) {
      var val = 0.0;
      var amp = 0.5;
      var freq = 1.0;
      for (var i = 0; i < octaves; i++) {
        val += smoothNoise(x * freq, y * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
      }
      return val;
    }

    // Lerp helper
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    // Color from gradient - deep teal/green/gold Minecraft palette
    function getBlockColor(type, brightness, glow) {
      var r, g, b;
      if (type === 0) {
        // Stone/dirt - dark grey-brown
        r = Math.floor(lerp(40, 110, brightness));
        g = Math.floor(lerp(30, 85, brightness));
        b = Math.floor(lerp(20, 70, brightness));
      } else if (type === 1) {
        // Grass - deep green with glow
        r = Math.floor(lerp(10, 60, brightness) + glow * 20);
        g = Math.floor(lerp(60, 160, brightness) + glow * 40);
        b = Math.floor(lerp(10, 40, brightness) + glow * 10);
      } else if (type === 2) {
        // Diamond/ice - cyan teal glow
        r = Math.floor(lerp(0, 30, brightness) + glow * 30);
        g = Math.floor(lerp(80, 200, brightness) + glow * 55);
        b = Math.floor(lerp(80, 220, brightness) + glow * 55);
      } else if (type === 3) {
        // Gold ore - amber
        r = Math.floor(lerp(80, 230, brightness) + glow * 25);
        g = Math.floor(lerp(50, 160, brightness) + glow * 10);
        b = Math.floor(lerp(0, 20, brightness));
      } else {
        // Lava/nether - deep red-orange
        r = Math.floor(lerp(100, 240, brightness) + glow * 15);
        g = Math.floor(lerp(10, 80, brightness) + glow * 5);
        b = Math.floor(lerp(0, 10, brightness));
      }
      return [
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b))
      ];
    }

    // Main animation loop
    function animate() {
      var p = paramsRef.current;
      var t = (Date.now() - startTimeRef.current) / 1000.0;
      var time = t * p.speed;

      var W = canvas.width;
      var H = canvas.height;

      // Use ImageData for pixel-level rendering
      var imageData = ctx.createImageData(W, H);
      var data = imageData.data;

      var blockSz = Math.floor(p.blockSize);
      if (blockSz < 4) blockSz = 4;

      // Render each pixel
      for (var py = 0; py < H; py++) {
        for (var px = 0; px < W; px++) {
          // Block-quantize coordinates (Minecraft pixelated look)
          var bx = Math.floor(px / blockSz) * blockSz;
          var by = Math.floor(py / blockSz) * blockSz;

          // Normalized block coordinates
          var nx = bx / W;
          var ny = by / H;

          // Scrolling wave offset
          var scrollX = time * 0.15;
          var scrollY = time * 0.08;
          var waveOffset = Math.sin(nx * 6.28 + time * 1.2) * 0.04 * p.waveAmp;

          // FBM terrain noise
          var terrain = fbm(nx * 3.0 + scrollX, ny * 2.0 + scrollY + waveOffset, 5);

          // Color shift cycling
          var cs = p.colorShift + time * 0.05;
          var shiftedTerrain = terrain + cs;

          // Determine block type from noise layers
          var layerNoise = smoothNoise(nx * 5.0 + scrollX * 0.5, ny * 3.0 + scrollY * 0.5);
          var blockType;
          if (terrain < 0.25) {
            blockType = 0; // stone/dirt
          } else if (terrain < 0.42) {
            blockType = 1; // grass
          } else if (terrain < 0.58) {
            // Animated color shift between types
            blockType = Math.floor(((shiftedTerrain * 7.0) % 3) + 2);
          } else if (terrain < 0.72) {
            blockType = 2; // diamond/ice
          } else {
            blockType = 4; // lava
          }

          // Brightness from noise + animated pulse
          var brightness = terrain * 0.7 + 0.15 + Math.sin(time * 2.0 + nx * 8.0) * 0.08;
          brightness = Math.max(0.0, Math.min(1.0, brightness));

          // Glow on bright blocks
          var glow = 0.0;
          if (blockType === 2 || blockType === 3 || blockType === 4) {
            glow = (Math.sin(time * 3.0 + nx * 12.0 + ny * 8.0) * 0.5 + 0.5) * p.glowIntensity;
          }

          // Block edge darkening (pixelated border)
          var edgeX = (px % blockSz) / blockSz;
          var edgeY = (py % blockSz) / blockSz;
          var edgeFactor = 1.0;
          var edgeW = 1.5 / blockSz;
          if (edgeX < edgeW || edgeX > (1.0 - edgeW) || edgeY < edgeW || edgeY > (1.0 - edgeW)) {
            edgeFactor = 0.55;
          }

          // Fog/depth effect
          var fogAmt = fbm(nx * 1.5 + time * 0.07, ny * 1.5 + time * 0.05, 3);
          var fog = fogAmt * p.fogDensity * 0.5;

          // Get color
          var col = getBlockColor(blockType, brightness * edgeFactor, glow);

          // Apply fog (darken towards dark blue-green)
          var fr = Math.floor(col[0] * (1.0 - fog) + 5 * fog);
          var fg = Math.floor(col[1] * (1.0 - fog) + 20 * fog);
          var fb = Math.floor(col[2] * (1.0 - fog) + 30 * fog);

          // Scanline subtle effect for atmosphere
          var scanline = 1.0 - (py % 2) * 0.04;

          var idx = (py * W + px) * 4;
          data[idx]     = Math.min(255, Math.max(0, Math.floor(fr * scanline)));
          data[idx + 1] = Math.min(255, Math.max(0, Math.floor(fg * scanline)));
          data[idx + 2] = Math.min(255, Math.max(0, Math.floor(fb * scanline)));
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Overlay: draw subtle HUD-style vignette
      var grad = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return function() {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return React.createElement('div', {
    className: 'dark-component',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#0d0d0d'
    }
  },
    React.createElement('canvas', {
      ref: canvasRef,
      style: {
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated'
      }
    })
  );
}