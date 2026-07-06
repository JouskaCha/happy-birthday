/* =========================================================================
   COVER.JS — Orkestrasi animasi amplop premium
   Tempel <script src="cover.js"></script> SETELAH script utama yang
   mendefinisikan goToPage() dan playCurrentSong(), supaya kedua fungsi
   itu bisa langsung dipanggil dari sini.
   ========================================================================= */

(function initCover(){
  'use strict';

  var scene    = document.getElementById('coverScene');
  var canvas   = document.getElementById('coverBgCanvas');
  var envelope = document.getElementById('envelope');
  var seal     = document.getElementById('envelopeSeal');

  if(!scene || !envelope) return; // section cover tidak ditemukan, aman berhenti

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hasOpened = false;

  /* ---------------------------------------------------------------------
     Fallback aman: jika goToPage/playCurrentSong BELUM didefinisikan
     (misal saat cover.html dibuka berdiri sendiri untuk pratinjau),
     buat stub supaya tidak error. Jika fungsi asli sudah ada di project
     kamu (dimuat sebelum file ini), stub ini TIDAK akan menimpanya.
  --------------------------------------------------------------------- */
  window.goToPage = window.goToPage || function(pageId){
    console.log('[cover.js] goToPage("' + pageId + '") — belum terhubung ke project.');
  };
  window.playCurrentSong = window.playCurrentSong || function(){
    console.log('[cover.js] playCurrentSong() — belum terhubung ke project.');
  };

  /* =======================================================================
     1. CANVAS AMBIENT — bokeh, sparkle, kelopak melayang tipis
     ======================================================================= */
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var petals = [];
  var sparkles = [];
  var bokehs = [];
  var burstStrength = 0; // naik saat amplop dibuka, lalu turun pelan
  var rafId = null;

  var PALETTE = ['#c98a94', '#e7b8bf', '#d9b48f', '#f3d2d8'];

  function resize(){
    var rect = scene.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max){ return min + Math.random() * (max - min); }

  function makePetal(){
    return {
      x: rand(0, W),
      y: rand(-H, H),
      size: rand(4, 9),
      speedY: rand(0.25, 0.6),
      speedX: rand(-0.25, 0.25),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.008, 0.02),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.015, 0.015),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)]
    };
  }

  function makeSparkle(){
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.6, 1.8),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.02, 0.05)
    };
  }

  function makeBokeh(){
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(22, 48),
      speedY: rand(0.06, 0.15),
      opacity: rand(0.05, 0.12)
    };
  }

  function seedParticles(){
    var petalCount = W < 500 ? 10 : 18;
    var sparkleCount = W < 500 ? 18 : 30;
    var bokehCount = 6;
    petals = [];
    sparkles = [];
    bokehs = [];
    for(var i = 0; i < petalCount; i++) petals.push(makePetal());
    for(var j = 0; j < sparkleCount; j++) sparkles.push(makeSparkle());
    for(var k = 0; k < bokehCount; k++) bokehs.push(makeBokeh());
  }

  function drawPetal(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size / 1.7, p.size, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.55 + burstStrength * 0.25;
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(s, t){
    var twinkle = 0.4 + 0.6 * Math.sin(t * s.speed + s.phase);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff6e8';
    ctx.globalAlpha = Math.max(0, twinkle) * (0.5 + burstStrength * 0.5);
    ctx.fill();
  }

  function drawBokeh(b){
    var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, 'rgba(217,180,143,' + (b.opacity + burstStrength * 0.06) + ')');
    grad.addColorStop(1, 'rgba(217,180,143,0)');
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick(t){
    ctx.clearRect(0, 0, W, H);

    bokehs.forEach(function(b){
      b.y -= b.speedY;
      if(b.y < -b.r) b.y = H + b.r;
      drawBokeh(b);
    });

    sparkles.forEach(function(s){ drawSparkle(s, t); });

    var speedMul = 1 + burstStrength * 1.8;
    petals.forEach(function(p){
      p.sway += p.swaySpeed;
      p.y += p.speedY * speedMul;
      p.x += p.speedX * speedMul + Math.sin(p.sway) * 0.4;
      p.rotation += p.rotSpeed;

      if(p.y > H + 15){ p.y = -15; p.x = rand(0, W); }
      if(p.x > W + 15) p.x = -15;
      if(p.x < -15) p.x = W + 15;

      drawPetal(p);
    });

    if(burstStrength > 0){
      burstStrength = Math.max(0, burstStrength - 0.0025);
    }

    rafId = requestAnimationFrame(tick);
  }

  function startAmbient(){
    resize();
    seedParticles();
    if(!prefersReducedMotion){
      rafId = requestAnimationFrame(tick);
    } else {
      // Tetap gambar satu frame statis, tanpa animasi berkelanjutan
      tick(0);
      cancelAnimationFrame(rafId);
    }
  }

  window.addEventListener('resize', function(){
    clearTimeout(window.__cvResizeTimer);
    window.__cvResizeTimer = setTimeout(function(){
      resize();
      seedParticles();
    }, 150);
  });

  /* =======================================================================
     2. SEKUENS PEMBUKAAN AMPLOP
     ======================================================================= */
  function triggerPetalBurst(){
    burstStrength = 1;
    // tambah kelopak ekstra sesaat untuk efek "beterbangan"
    var extra = W < 500 ? 10 : 16;
    for(var i = 0; i < extra; i++){
      var p = makePetal();
      p.y = rand(H * 0.3, H * 0.6);
      p.speedY = rand(0.6, 1.3);
      petals.push(p);
    }
  }

  function openEnvelope(){
    if(hasOpened) return;
    hasOpened = true;

    envelope.setAttribute('aria-disabled', 'true');
    envelope.classList.add('envelope--opened');
    envelope.tabIndex = -1;

    // Getaran halus di perangkat yang mendukung (progressive enhancement, aman jika tidak ada)
    if(navigator.vibrate){
      try{ navigator.vibrate(12); }catch(e){ /* diabaikan */ }
    }

    // Mulai musik SEGERA (dalam gesture klik/keydown) demi kebijakan autoplay browser.
    // Dibungkus try/catch supaya kegagalan musik tidak menghentikan animasi visual amplop.
    try{
      window.playCurrentSong();
    }catch(e){
      console.warn('[cover] playCurrentSong gagal, animasi tetap lanjut:', e);
    }

    var fastForward = prefersReducedMotion;
    var t = fastForward ? {
      seal: 0, sealOpen: 40, open: 60, rise: 90, blur: 100, glow: 110,
      burst: 120, fadeStart: 260, fadeDone: 380
    } : {
      seal: 0, sealOpen: 150, open: 250, rise: 550, blur: 700, glow: 780,
      burst: 850, fadeStart: 2150, fadeDone: 2950
    };

    // 1. Seal ditekan
    seal.classList.add('envelope__seal--pressed');

    // 2. Seal "terbuka" (memudar / retak)
    setTimeout(function(){
      seal.classList.remove('envelope__seal--pressed');
      seal.classList.add('envelope__seal--opened');
    }, t.sealOpen);

    // 3. Flap amplop terbuka (rotateX)
    setTimeout(function(){
      scene.classList.add('cover-scene--open');
    }, t.open);

    // 4. Surat naik & sedikit membesar
    setTimeout(function(){
      scene.classList.add('cover-scene--rising');
    }, t.rise);

    // 5. Background blur halus
    setTimeout(function(){
      scene.classList.add('cover-scene--blur');
    }, t.blur);

    // 6. Glow lembut muncul
    setTimeout(function(){
      scene.classList.add('cover-scene--glow');
    }, t.glow);

    // 7. Kelopak bunga beterbangan
    setTimeout(function(){
      triggerPetalBurst();
    }, t.burst);

    // 8. Fade menuju halaman pertama
    setTimeout(function(){
      scene.classList.add('cover-scene--fade-out');
    }, t.fadeStart);

    setTimeout(function(){
      window.goToPage('1');
      if(rafId) cancelAnimationFrame(rafId);
    }, t.fadeDone);
  }

  /* =======================================================================
     3. EVENT LISTENERS — klik di amplop ATAU cap lilin, dan keyboard Enter
     ======================================================================= */
  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
      e.preventDefault();
      openEnvelope();
    }
  });

  /* =======================================================================
     4. INIT
     ======================================================================= */
  startAmbient();

})();