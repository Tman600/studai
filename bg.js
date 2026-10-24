/* The background: contour lines off a slowly shifting height field, drawn the
   way a survey sheet draws them - thin grey lines, every fifth one heavier.
   No colour and no glow; it should read as paper, not as an effect. */
(function(){
  const canvas = document.createElement('canvas');
  canvas.className = 'contours';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELL = 14;          // css px per grid cell; smaller is smoother and slower
  const SCALE = 0.0021;     // how wide the hills are
  const SPEED = 0.000028;   // how fast the land drifts, per millisecond
  const STEP = 0.07;        // height between contour lines
  const FRAME_MS = 50;      // it moves slowly, so 20 frames a second is plenty

  const MINOR = 'rgba(245,245,240,0.055)';
  const INDEX = 'rgba(245,245,240,0.11)';

  // 3D gradient noise (Perlin's improved noise): x and y are the map, z is time
  const perm = new Uint8Array(512);
  (function(){
    const p = Array.from({ length:256 }, (_, i) => i);
    for(let i = 255; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for(let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y, z){
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y, z){
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z),         grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z),     grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w);
  }

  // marching squares: which cell edges a line crosses, for each corner pattern.
  // Edges are 0 top, 1 right, 2 bottom, 3 left; corners a b / d c, a = 8.
  const SEGMENTS = [
    [], [3,2], [2,1], [3,1], [0,1], [0,3,2,1], [0,2], [0,3],
    [0,3], [0,2], [0,1,3,2], [0,1], [3,1], [2,1], [3,2], []
  ];

  let w = 0, h = 0, cols = 0, rows = 0, field = new Float32Array(0);

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    field = new Float32Array(cols * rows);
  }

  function sample(t){
    for(let j = 0; j < rows; j++){
      for(let i = 0; i < cols; i++){
        const x = i * CELL * SCALE, y = j * CELL * SCALE;
        field[j * cols + i] = noise(x, y, t) + 0.35 * noise(x * 2.3 + 17, y * 2.3 + 5, t * 1.4);
      }
    }
  }

  function edgePoint(edge, x0, y0, a, b, c, d, level){
    switch(edge){
      case 0: return [x0 + CELL * (level - a) / (b - a), y0];
      case 1: return [x0 + CELL, y0 + CELL * (level - b) / (c - b)];
      case 2: return [x0 + CELL * (level - d) / (c - d), y0 + CELL];
      default: return [x0, y0 + CELL * (level - a) / (d - a)];
    }
  }

  function draw(t){
    sample(t);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    let lo = Infinity, hi = -Infinity;
    for(let k = 0; k < field.length; k++){
      if(field[k] < lo) lo = field[k];
      if(field[k] > hi) hi = field[k];
    }

    // levels sit on fixed heights, so a line keeps its place as the land moves
    // under it instead of every line sliding at once
    const first = Math.ceil(lo / STEP), last = Math.floor(hi / STEP);
    for(const heavy of [false, true]){
      ctx.strokeStyle = heavy ? INDEX : MINOR;
      ctx.beginPath();
      for(let n = first; n <= last; n++){
        if((n % 5 === 0) !== heavy) continue;
        const level = n * STEP;
        for(let j = 0; j < rows - 1; j++){
          for(let i = 0; i < cols - 1; i++){
            const a = field[j * cols + i],       b = field[j * cols + i + 1];
            const d = field[(j + 1) * cols + i], c = field[(j + 1) * cols + i + 1];
            const k = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
            const seg = SEGMENTS[k];
            if(seg.length === 0) continue;
            const x0 = i * CELL, y0 = j * CELL;
            for(let s = 0; s < seg.length; s += 2){
              const p = edgePoint(seg[s], x0, y0, a, b, c, d, level);
              const q = edgePoint(seg[s + 1], x0, y0, a, b, c, d, level);
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(q[0], q[1]);
            }
          }
        }
      }
      ctx.stroke();
    }
  }

  const start = performance.now() - Math.random() * 1e6;
  let last = 0;
  function frame(now){
    if(now - last >= FRAME_MS){
      last = now;
      draw((now - start) * SPEED);
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if(still) draw((performance.now() - start) * SPEED);
  });

  if(still){
    draw((performance.now() - start) * SPEED);
  } else {
    requestAnimationFrame(frame);
  }
})();
