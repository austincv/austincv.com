// ─── CARD BUILDER ─────────────────────────────────────────────
function buildCardInner(role) {
  return `
    <div class="card-inner" style="--accent:${role.accent}">
      <div class="card-top-stripe"></div>
      <div class="card-label">ID · ${role.company.toUpperCase()}</div>
      <img class="card-photo" src="${role.headshot}" alt="Austin Chungath Vincent"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-photo-placeholder" style="display:none">👤</div>
      <div class="card-name">Austin<br>Chungath Vincent</div>
      <div class="card-title">${role.title}</div>
      <div class="card-divider"></div>
      <img class="card-logo-horizontal" src="${role.logo}" alt="${role.company} logo">
      <div class="card-dates">${role.dates}</div>
    </div>`;
}

// ─── DESKTOP ──────────────────────────────────────────────────
function desktopInit(roles) {
  const ac       = new AbortController();
  const { signal } = ac;

  const card3d     = document.getElementById('card3d');
  const cardFront  = document.getElementById('cardFront');
  const cardShadow = document.getElementById('cardShadow');
  const lpEyebrow  = document.getElementById('lpEyebrow');
  const lpHeadline = document.getElementById('lpHeadline');
  const lpSub      = document.getElementById('lpSub');
  const leftPanel  = document.getElementById('leftPanel');
  const rightTrack = document.getElementById('rightTrack');

  let currentRole = 0;
  let animating   = false;

  // Ensure we start at the top when (re-)entering desktop view
  window.scrollTo(0, 0);

  // Create role sections dynamically
  roles.forEach((_, i) => {
    const sec = document.createElement('div');
    sec.className = 'role-section';
    sec.dataset.role = i;
    rightTrack.appendChild(sec);
  });
  const sections = rightTrack.querySelectorAll('.role-section');

  // Build scroll nav
  const nav = document.createElement('nav');
  nav.className = 'scroll-nav';
  nav.setAttribute('aria-label', 'Jump to role');
  roles.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'scroll-nav-item';
    item.innerHTML = `<span class="scroll-nav-dot"></span>`;
    item.addEventListener('click', () => sections[i].scrollIntoView({ behavior: 'smooth' }), { signal });
    nav.appendChild(item);
  });
  document.body.appendChild(nav);

  function updateNav(idx) {
    nav.querySelectorAll('.scroll-nav-item').forEach((item, i) => {
      item.classList.toggle('active', i === idx);
      if (i === idx) item.style.setProperty('--nav-accent', roles[idx].accent);
    });
  }

  // Populate initial card and left panel
  cardFront.innerHTML = buildCardInner(roles[0]);
  lpEyebrow.textContent  = roles[0].eyebrow;
  lpHeadline.innerHTML   = roles[0].headline.replace(/\n/g, '<br>');
  lpSub.textContent      = roles[0].sub;
  document.documentElement.style.setProperty('--current-accent', roles[0].accent);
  updateNav(0);

  setTimeout(() => leftPanel.classList.add('visible'), 200);

  function updateLeft(role) {
    leftPanel.classList.remove('visible');
    setTimeout(() => {
      lpEyebrow.textContent = role.eyebrow;
      lpHeadline.innerHTML  = role.headline.replace(/\n/g, '<br>');
      lpSub.textContent     = role.sub;
      document.documentElement.style.setProperty('--current-accent', role.accent);
      leftPanel.classList.add('visible');
    }, 280);
  }

  // ── IDLE SWING + MOUSE TILT ────────────────────────────────
  let swingPhase = 0;
  let mouseNX = 0.5;
  let mouseNY = 0.5;
  let tiltX = 0, tiltY = 0;

  document.addEventListener('mousemove', e => {
    mouseNX = e.clientX / window.innerWidth;
    mouseNY = e.clientY / window.innerHeight;
  }, { signal });

  document.addEventListener('mouseleave', () => { mouseNX = 0.5; mouseNY = 0.5; }, { signal });

  function animTick() {
    swingPhase += 0.007;
    const swingDeg = Math.sin(swingPhase) * 2 - 1;

    if (!animating) {
      const targetTY =  (mouseNX * 2 - 1) * 18;
      const targetTX = -(mouseNY * 2 - 1) * 12;
      tiltX += (targetTX - tiltX) * 0.09;
      tiltY += (targetTY - tiltY) * 0.09;

      const t = `perspective(600px) rotate(${swingDeg}deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      card3d.style.transform     = t;
      cardShadow.style.transform = t;
    }

    // Shadow always updates — no blink during flip
    const sdx  = -tiltY * 2.0;
    const sdy  =  tiltX * 1.2 + 28;
    const blur =  60 + Math.abs(tiltX) * 2.0 + Math.abs(tiltY) * 2.0;
    const alph =  0.28 + Math.abs(tiltX) * 0.010 + Math.abs(tiltY) * 0.010;
    cardShadow.style.boxShadow =
      `${sdx.toFixed(1)}px ${sdy.toFixed(1)}px ${blur.toFixed(0)}px rgba(0,0,0,${alph.toFixed(3)})`;

    rafId = requestAnimationFrame(animTick);
  }

  let rafId = requestAnimationFrame(animTick);

  // ── CARD FLIP ──────────────────────────────────────────────
  // Rotates to exactly 90° (card is edge-on, zero width — invisible to the
  // viewer), swaps the content, then rotates in from -90° to 0°.
  // The viewer sees a clean 180° arc with no fading and no CSS 3D quirks.
  function rotateTo(idx) {
    if (idx === currentRole || animating) return;
    const prevRole = currentRole;
    animating = true;
    currentRole = idx;

    updateNav(idx);

    const dir        = idx > prevRole ? 1 : -1;
    const newContent = buildCardInner(roles[idx]);

    // Phase 1: rotate out to edge-on (90°)
    const edgeOut = `perspective(600px) rotateY(${dir * 90}deg) rotate(-1deg)`;
    card3d.style.transition     = 'transform 0.2s cubic-bezier(0.4, 0, 1, 1)';
    card3d.style.transform      = edgeOut;
    cardShadow.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 1, 1)';
    cardShadow.style.transform  = edgeOut;

    setTimeout(() => {
      // Swap content while card is edge-on — invisible to viewer
      cardFront.innerHTML = newContent;

      // Phase 2: start from the opposite edge (-90°) and rotate in to 0°
      const edgeIn = `perspective(600px) rotateY(${-dir * 90}deg) rotate(-1deg)`;
      card3d.style.transition     = 'none';
      card3d.style.transform      = edgeIn;
      cardShadow.style.transition = 'none';
      cardShadow.style.transform  = edgeIn;
      void card3d.offsetWidth;

      card3d.style.transition     = 'transform 0.28s cubic-bezier(0, 0, 0.2, 1)';
      card3d.style.transform      = 'perspective(600px) rotateY(0deg) rotate(-2deg)';
      cardShadow.style.transition = 'transform 0.28s cubic-bezier(0, 0, 0.2, 1)';
      cardShadow.style.transform  = 'perspective(600px) rotateY(0deg) rotate(-2deg)';

      updateLeft(roles[idx]);

      setTimeout(() => {
        swingPhase = Math.PI + Math.PI / 6;
        tiltX      = 0;
        tiltY      = 0;
        animating  = false;
        const rest = 'perspective(600px) rotate(-2deg) rotateX(0deg) rotateY(0deg)';
        card3d.style.transition     = '';
        card3d.style.transform      = rest;
        cardShadow.style.transition = '';
        cardShadow.style.transform  = rest;
      }, 290);
    }, 200);
  }

  // ── SCROLL DETECTION ───────────────────────────────────────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.role);
        if (idx !== currentRole) rotateTo(idx);
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  // ── DESTROY ────────────────────────────────────────────────
  return function destroy() {
    ac.abort();
    cancelAnimationFrame(rafId);
    observer.disconnect();
    nav.remove();
    rightTrack.innerHTML       = '';
    leftPanel.classList.remove('visible');
    cardFront.innerHTML        = '';
    cardShadow.removeAttribute('style');
    card3d.removeAttribute('style');
  };
}

// ─── MOBILE ───────────────────────────────────────────────────
function mobileInit(roles) {
  const ac       = new AbortController();
  const { signal } = ac;

  const swipeArea      = document.getElementById('mobileSwipeArea');
  const progress       = document.getElementById('mobileProgress');
  const mobileHeader   = document.getElementById('mobileHeader');
  const mobileEyebrow  = document.getElementById('mobileEyebrow');
  const mobileHeadline = document.getElementById('mobileHeadline');

  const total = roles.length;
  let current  = 0;
  let animating = false;

  let swingPhase = 0;
  let tiltX = 0, tiltY = 0;
  let touchNX = 0.5, touchNY = 0.5;
  let rafId;

  // ── SCALE ────────────────────────────────────────────────────
  // Card is always 260×412px (identical to desktop). Scale it down to fit
  // the available swipe area so proportions are pixel-identical to desktop.
  const CARD_W = 260, CARD_H = 412;
  const computeScale = () => Math.min(
    1,
    (swipeArea.offsetHeight * 0.90) / CARD_H,
    (swipeArea.offsetWidth  * 0.88) / CARD_W
  );
  // On iOS Safari the mq `change` event can fire before the CSS layout has
  // settled (offsetHeight is still 0).  Start with whatever we get and let
  // animTick self-correct on the first frame that has real dimensions.
  let cardScale = computeScale();
  let sc = `scale(${cardScale.toFixed(4)})`;

  // ── BUILD ────────────────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'mobile-card';
  card.innerHTML = buildCardInner(roles[0]);
  swipeArea.appendChild(card);

  roles.forEach(() => {
    const dot = document.createElement('div');
    dot.className = 'mobile-progress-dot';
    progress.appendChild(dot);
  });

  // ── META ─────────────────────────────────────────────────────
  function updateMeta(animate) {
    progress.querySelectorAll('.mobile-progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    document.documentElement.style.setProperty('--current-accent', roles[current].accent);

    if (animate) {
      mobileHeader.classList.remove('visible');
      setTimeout(() => {
        mobileEyebrow.textContent  = roles[current].eyebrow;
        mobileHeadline.innerHTML = roles[current].headline.replace(/\n/g, '<br>');
        mobileHeader.classList.add('visible');
      }, 280);
    } else {
      mobileEyebrow.textContent  = roles[current].eyebrow;
      mobileHeadline.innerHTML = roles[current].headline.replace(/\n/g, '<br>');
    }
  }

  // ── FLIP ─────────────────────────────────────────────────────
  function flipTo(idx, axis = 'Y') {
    idx = Math.max(0, Math.min(total - 1, idx));
    if (idx === current || animating) return;
    const dir = idx > current ? -1 : 1;
    animating = true;
    current   = idx;

    // For rotateY: dir=-1 (next) exits right-edge-forward → card goes left  ✓
    // For rotateX: dir=-1 (next) must exit top-edge-away  → card goes up   ✓
    //   rotateX physics are mirror-flipped vs rotateY, so negate the angle.
    const rot     = (deg) => axis === 'X' ? `rotateX(${-deg}deg)` : `rotateY(${deg}deg)`;
    const rotZero = axis === 'X' ? 'rotateX(0deg)' : 'rotateY(0deg)';

    // Phase 1: rotate out to edge-on
    card.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 1, 1)';
    card.style.transform  = `translateX(calc(-50%)) translateY(-50%) ${sc} perspective(600px) ${rot(dir * 90)} rotate(-1deg)`;

    setTimeout(() => {
      // Swap content while edge-on — invisible to viewer
      card.innerHTML = buildCardInner(roles[idx]);

      // Snap to opposite edge then rotate in.
      // Keep the same function list (perspective · rotX/Y · rotateZ) so the
      // browser interpolates per-function rather than decomposing matrices —
      // matrix decomposition can produce a visible wobble mid-transition.
      card.style.transition = 'none';
      card.style.transform  = `translateX(calc(-50%)) translateY(-50%) ${sc} perspective(600px) ${rot(-dir * 90)} rotate(-1deg)`;
      void card.offsetWidth;

      card.style.transition = 'transform 0.28s cubic-bezier(0, 0, 0.2, 1)';
      card.style.transform  = `translateX(calc(-50%)) translateY(-50%) ${sc} perspective(600px) ${rotZero} rotate(-2deg)`;

      updateMeta(true);

      setTimeout(() => {
        swingPhase = Math.PI + Math.PI / 6;
        tiltX      = 0;
        tiltY      = 0;
        animating  = false;
        card.style.transition = '';
        card.style.transform  = `translateX(calc(-50%)) translateY(-50%) ${sc} perspective(600px) rotate(-2deg) rotateX(0deg) rotateY(0deg)`;
      }, 290);
    }, 200);
  }

  // ── SWING + TILT ─────────────────────────────────────────────
  let _lastH = 0, _lastW = 0;

  function animTick() {
    // Re-derive scale whenever layout dimensions change (handles iOS Safari
    // orientation-change timing: the mq `change` event fires before the
    // viewport has fully settled, so the first measurement can be wrong).
    if (!animating) {
      const h = swipeArea.offsetHeight, w = swipeArea.offsetWidth;
      if (h !== _lastH || w !== _lastW) {
        _lastH = h; _lastW = w;
        if (h > 0 && w > 0) {
          cardScale = computeScale();
          sc = `scale(${cardScale.toFixed(4)})`;
        }
      }
    }

    swingPhase += 0.007;
    const swingDeg = Math.sin(swingPhase) * 2 - 1;

    if (!animating) {
      const targetTY =  (touchNX * 2 - 1) * 18;
      const targetTX = -(touchNY * 2 - 1) * 12;
      tiltX += (targetTX - tiltX) * 0.09;
      tiltY += (targetTY - tiltY) * 0.09;

      card.style.transition = 'none';
      card.style.transform  = `translateX(calc(-50%)) translateY(-50%) ${sc} perspective(600px) rotate(${swingDeg.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
    }

    rafId = requestAnimationFrame(animTick);
  }

  // ── GESTURE DETECTION ────────────────────────────────────────
  let startX = 0, startY = 0;

  swipeArea.addEventListener('touchstart', e => {
    startX  = e.touches[0].clientX;
    startY  = e.touches[0].clientY;
    touchNX = startX / window.innerWidth;
    touchNY = startY / window.innerHeight;
  }, { passive: true, signal });

  swipeArea.addEventListener('touchmove', e => {
    touchNX = e.touches[0].clientX / window.innerWidth;
    touchNY = e.touches[0].clientY / window.innerHeight;
  }, { passive: true, signal });

  swipeArea.addEventListener('touchend', e => {
    touchNX = 0.5; touchNY = 0.5;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      flipTo(current + (dx < 0 ? 1 : -1));
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30) {
      // Vertical swipe — swipe up (scroll down) = next card, swipe down = prev card
      flipTo(current + (dy < 0 ? 1 : -1), 'X');
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // Tap — left half = prev, right half = next
      const mid = swipeArea.getBoundingClientRect().left + swipeArea.offsetWidth / 2;
      flipTo(current + (startX < mid ? -1 : 1));
    }
  }, { signal });

  swipeArea.addEventListener('touchcancel', () => { touchNX = 0.5; touchNY = 0.5; }, { signal });

  // Mouse (for desktop testing)
  let mouseStartX = 0;
  swipeArea.addEventListener('mousedown', e => { mouseStartX = e.clientX; e.preventDefault(); }, { signal });
  swipeArea.addEventListener('click', e => {
    const dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > 30) {
      flipTo(current + (dx < 0 ? 1 : -1));
    } else {
      const mid = swipeArea.getBoundingClientRect().left + swipeArea.offsetWidth / 2;
      flipTo(current + (e.clientX < mid ? -1 : 1));
    }
  }, { signal });

  // ── INIT ─────────────────────────────────────────────────────
  updateMeta(false);
  setTimeout(() => mobileHeader.classList.add('visible'), 200);
  rafId = requestAnimationFrame(animTick);

  // ── DESTROY ──────────────────────────────────────────────────
  return function destroy() {
    ac.abort();
    cancelAnimationFrame(rafId);
    swipeArea.innerHTML        = '';
    progress.innerHTML         = '';
    mobileHeader.classList.remove('visible');
    mobileEyebrow.textContent  = '';
    mobileHeadline.textContent = '';
  };
}

// ─── BOOTSTRAP ────────────────────────────────────────────────
const mq = window.matchMedia('(max-width: 768px)');

function preloadImages(roles) {
  roles.forEach(role => {
    [role.headshot, role.logo].forEach(src => {
      if (src) { const img = new Image(); img.src = src; }
    });
  });
}

fetch('data/roles.json')
  .then(res => res.json())
  .then(roles => {
    preloadImages(roles);
    let destroy = mq.matches ? mobileInit(roles) : desktopInit(roles);

    mq.addEventListener('change', e => {
      destroy();
      destroy = e.matches ? mobileInit(roles) : desktopInit(roles);
    });
  })
  .catch(err => console.error('Failed to load roles.json:', err));
