/* Padající zlaté vločky v pozadí. Každá má tvar sněhové vločky a při pádu se otáčí, naklání a kolébá.
   Plátno nereaguje na kliknutí, vypne se při „omezení pohybu“ v systému a zastaví při skryté záložce. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'flakes';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var COLORS = [[212, 191, 146], [201, 168, 92], [188, 150, 70], [154, 120, 56]]; // od světlé po tmavší zlatou
  var w = 0, h = 0, dpr = 1, flakes = [], last = 0, running = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function make(startAnywhere) {
    var c = COLORS[Math.floor(Math.random() * COLORS.length)];
    var size = rand(3, 7.5);
    return {
      x: rand(0, w),
      y: startAnywhere ? rand(-20, h) : rand(-30, -8),
      size: size,
      speed: rand(22, 52) * (0.7 + size / 12),   // větší padají o trochu rychleji
      swayAmp: rand(10, 34), swaySpeed: rand(0.5, 1.3), swayPhase: rand(0, 6.28),
      rot: rand(0, 6.28), rotSpeed: rand(-1.6, 1.6),   // otáčení v rovině
      flip: rand(0, 6.28), flipSpeed: rand(1.2, 3.2),  // převracení kolem vodorovné osy (třpyt)
      skew: rand(0.5, 1.1),                            // poměr stran střípku
      alpha: rand(0.55, 0.9),
      c: c
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var want = Math.max(14, Math.min(44, Math.round(w / 38)));
    while (flakes.length < want) flakes.push(make(true));
    if (flakes.length > want) flakes.length = want;
  }

  function draw(f) {
    var tilt = Math.cos(f.flip);                      // −1…1, vločka se při pádu naklání
    var scaleY = 0.62 + 0.38 * tilt;                  // 0,24…1: tvar zůstane poznatelný, jen se zplošťuje
    var shine = 0.65 + 0.35 * Math.abs(tilt);         // při naklonění se zatřpytí
    var light = tilt > 0 ? 1 : 0.85;
    ctx.save();
    ctx.translate(f.x + Math.sin(f.swayPhase) * f.swayAmp, f.y);
    ctx.rotate(f.rot);
    ctx.scale(1, scaleY);
    ctx.globalAlpha = Math.min(1, f.alpha * shine + 0.1);
    ctx.strokeStyle = "rgb(" + Math.round(f.c[0] * light) + "," + Math.round(f.c[1] * light) + "," + Math.round(f.c[2] * light) + ")";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(0.9, f.size * 0.22);
    var r = f.size * 1.25;                            // poloměr vločky
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {                     // šest ramen, každé s dvojicí větviček
      var ang = k * Math.PI / 3, ca = Math.cos(ang), sa = Math.sin(ang);
      ctx.moveTo(0, 0);
      ctx.lineTo(ca * r, sa * r);
      var bx = ca * r * 0.58, by = sa * r * 0.58, bl = r * 0.34;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang + 0.85) * bl, by + Math.sin(ang + 0.85) * bl);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang - 0.85) * bl, by + Math.sin(ang - 0.85) * bl);
    }
    ctx.stroke();
    ctx.restore();
  }

  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.speed * dt;
      f.swayPhase += f.swaySpeed * dt;
      f.rot += f.rotSpeed * dt;
      f.flip += f.flipSpeed * dt;
      if (f.y - f.size * 2 > h) flakes[i] = f = make(false);
      draw(f);
    }
    requestAnimationFrame(frame);
  }

  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  start();
})();
