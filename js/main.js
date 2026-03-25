// ─── CARD BUILDER ─────────────────────────────────────────────
function buildCardInner(role) {
  const bars = [2,3,1,4,2,3,1,2,4,1,3,2,1,4,2,3,1,2].map(w =>
    `<span style="width:${w * 2}px"></span>`).join('');

  const logoHtml = role.logo
    ? `<img src="${role.logo}" alt="${role.company} logo" onerror="this.parentElement.innerHTML='${role.icon}'">`
    : role.icon;

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
      <div class="card-company-row">
        <div class="card-company-icon">${logoHtml}</div>
        <div class="card-company-name">${role.company}</div>
      </div>
      <div class="card-barcode">${bars}</div>
      <div class="card-dates">${role.dates}</div>
    </div>`;
}

// ─── HELPERS ──────────────────────────────────────────────────
function extractYears(dates) {
  const years = dates.match(/\d{4}/g);
  if (!years) return dates;
  return years.length >= 2 && years[0] !== years[years.length - 1]
    ? years[0] + '–' + years[years.length - 1]
    : years[0];
}

// ─── DESKTOP ──────────────────────────────────────────────────
function desktopInit(roles) {
  const card3d    = document.getElementById('card3d');
  const cardFront = document.getElementById('cardFront');
  const lpEyebrow  = document.getElementById('lpEyebrow');
  const lpHeadline = document.getElementById('lpHeadline');
  const lpSub      = document.getElementById('lpSub');
  const leftPanel  = document.getElementById('leftPanel');

  let currentRole = 0;
  let animating   = false;

  // Populate role sections
  const sections = document.querySelectorAll('.role-section');
  sections.forEach((sec, i) => { sec.dataset.role = i; });

  // Build scroll nav
  const nav = document.createElement('nav');
  nav.className = 'scroll-nav';
  nav.setAttribute('aria-label', 'Jump to role');
  roles.forEach((role, i) => {
    const item = document.createElement('div');
    item.className = 'scroll-nav-item';
    item.innerHTML = `<span class="scroll-nav-year">${extractYears(role.dates)}</span><span class="scroll-nav-dot"></span>`;
    item.addEventListener('click', () => sections[i].scrollIntoView({ behavior: 'smooth' }));
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
  updateNav(0);

  setTimeout(() => leftPanel.classList.add('visible'), 200);

  function updateLeft(role) {
    leftPanel.classList.remove('visible');
    setTimeout(() => {
      lpEyebrow.textContent = role.eyebrow;
      lpHeadline.innerHTML  = role.headline.replace(/\n/g, '<br>');
      lpSub.textContent     = role.sub;
      leftPanel.classList.add('visible');
    }, 280);
  }

  // ── IDLE SWING + MOUSE TILT ────────────────────────────────
  // Both are composed into a single transform each frame so they
  // don't fight each other (CSS animations can't mix with JS transforms).

  let swingPhase = 0;         // drives sinusoidal idle sway
  let mouseNX = 0.5;          // normalised mouse X [0..1]
  let mouseNY = 0.5;          // normalised mouse Y [0..1]
  let tiltX = 0, tiltY = 0;  // current interpolated tilt (degrees)

  // Mouse tracking — normalised across the full viewport
  document.addEventListener('mousemove', e => {
    mouseNX = e.clientX / window.innerWidth;
    mouseNY = e.clientY / window.innerHeight;
  });

  // Reset tilt gracefully when cursor leaves the window
  document.addEventListener('mouseleave', () => { mouseNX = 0.5; mouseNY = 0.5; });

  function animTick() {
    // Idle swing: gentle sinusoidal rock (-3° … +1°)
    swingPhase += 0.007;
    const swingDeg = Math.sin(swingPhase) * 2 - 1;

    if (!animating) {
      // Only interpolate tilt when not flipping — prevents tilt from racing
      // ahead during a flip and jumping when animTick resumes.
      const targetTY =  (mouseNX * 2 - 1) * 18;
      const targetTX = -(mouseNY * 2 - 1) * 12;
      tiltX += (targetTX - tiltX) * 0.09;
      tiltY += (targetTY - tiltY) * 0.09;

      card3d.style.transform =
        `perspective(600px) rotate(${swingDeg}deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

      // Shadow shifts opposite to tilt direction (light from top-left)
      const sdx   = -tiltY * 2.0;
      const sdy   =  tiltX * 1.2 + 28;
      const blur  =  60 + Math.abs(tiltX) * 2.0 + Math.abs(tiltY) * 2.0;
      const alpha =  0.28 + Math.abs(tiltX) * 0.010 + Math.abs(tiltY) * 0.010;
      card3d.style.filter =
        `drop-shadow(${sdx.toFixed(1)}px ${sdy.toFixed(1)}px ${blur.toFixed(0)}px rgba(0,0,0,${alpha.toFixed(3)}))`;
    }

    requestAnimationFrame(animTick);
  }

  animTick();

  // ── CARD FLIP ──────────────────────────────────────────────
  function rotateTo(idx) {
    if (idx === currentRole || animating) return;
    animating = true;
    currentRole = idx;

    updateNav(idx);

    // Flip direction: scrolling down (higher idx) → card exits right, enters from left.
    // Scrolling up (lower idx) → card exits left, enters from right.
    const dir    = idx > currentRole ? 1 : -1;
    const exitY  =  dir * 28;   // e.g. +28 going forward, -28 going backward
    const enterY = -dir * 28;   // opposite side to appear from

    // Phase 1: tilt + fade out — use same perspective as animTick (600px)
    card3d.style.transition = 'transform 0.2s cubic-bezier(0.4,0,1,1), opacity 0.2s ease-in';
    card3d.style.transform  = `perspective(600px) rotateY(${exitY}deg) rotate(-1deg)`;
    card3d.style.opacity    = '0';

    setTimeout(() => {
      cardFront.innerHTML = buildCardInner(roles[idx]);

      card3d.style.transition = 'none';
      card3d.style.transform  = `perspective(600px) rotateY(${enterY}deg) rotate(-1deg)`;
      card3d.style.opacity    = '0';
      void card3d.offsetWidth;

      // Phase 2: tilt back in + fade in
      card3d.style.transition = 'transform 0.28s cubic-bezier(0,0,0.2,1), opacity 0.24s ease-out';
      card3d.style.transform  = 'perspective(600px) rotateY(0deg) rotate(-2deg)';
      card3d.style.opacity    = '1';

      updateLeft(roles[idx]);

      setTimeout(() => {
        // Sync state so the first animTick frame is identical to the flip's last frame.
        // swingDeg = sin(phase)*2−1 = −2  →  sin(phase) = −0.5  →  phase = 7π/6
        swingPhase = Math.PI + Math.PI / 6;
        tiltX = 0;
        tiltY = 0;
        animating = false;
        card3d.style.transition = '';
        card3d.style.opacity    = '';
        // Set transform explicitly so there is no blank frame before animTick fires.
        card3d.style.transform  = 'perspective(600px) rotate(-2deg) rotateX(0deg) rotateY(0deg)';
      }, 290);
    }, 210);
  }

  // ── SCROLL DETECTION ───────────────────────────────────────
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = window.innerHeight;
      let activeIdx = 0;
      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < vh * 0.5) activeIdx = i;
      });
      if (activeIdx !== currentRole) rotateTo(activeIdx);
    });
  });
}

// ─── MOBILE ───────────────────────────────────────────────────
function mobileInit(roles) {
  const swipeArea = document.getElementById('mobileSwipeArea');
  const progress  = document.getElementById('mobileProgress');
  const eyebrow   = document.getElementById('mobileEyebrow');
  const desc      = document.getElementById('mobileDesc');
  const btnPrev   = document.getElementById('mPrev');
  const btnNext   = document.getElementById('mNext');

  const total = roles.length;
  let current = 0;
  let slotW   = 0; // viewport slot width — one card per slot

  // ── BUILD ────────────────────────────────────────────────────
  // Cards go directly into swipeArea, each absolutely positioned.
  const cards = roles.map(role => {
    const el = document.createElement('div');
    el.className = 'mobile-card';
    el.innerHTML = buildCardInner(role);
    swipeArea.appendChild(el);
    return el;
  });

  roles.forEach(() => {
    const dot = document.createElement('div');
    dot.className = 'mobile-progress-dot';
    progress.appendChild(dot);
  });

  // ── POSITION ────────────────────────────────────────────────
  // Each card's natural X offset from centre: (i - current) * slotW.
  // dragOffset adds a transient shift during a drag gesture.
  // transition: 'none' during drag; ease-out for snap; spring for end bounce.
  function placeCards(dragOffset, transition) {
    cards.forEach((card, i) => {
      const x = (i - current) * slotW + dragOffset;
      card.style.transition = transition;
      card.style.transform  = `translateX(calc(-50% + ${x.toFixed(1)}px)) translateY(-50%)`;
    });
  }

  // ── META ─────────────────────────────────────────────────────
  function updateMeta() {
    progress.querySelectorAll('.mobile-progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    eyebrow.textContent = roles[current].company + ' · ' + roles[current].dates;
    desc.textContent    = roles[current].sub;
  }

  // ── NAVIGATION ───────────────────────────────────────────────
  function goTo(idx) {
    current = Math.max(0, Math.min(total - 1, idx));
    placeCards(0, 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)');
    updateMeta();
  }

  // ── DRAG ─────────────────────────────────────────────────────
  let dragging = false;
  let startX   = 0;
  let offsetX  = 0;
  let lastX    = 0, lastT = 0, flickVel = 0;

  // Rubber-band resistance when pulling past the first or last card
  function resistEnd(raw) {
    if (current === 0         && raw > 0) return raw * 0.18;
    if (current === total - 1 && raw < 0) return raw * 0.18;
    return raw;
  }

  function onStart(x) {
    dragging = true;
    startX   = x;
    offsetX  = 0;
    flickVel = 0;
    lastX    = x;
    lastT    = performance.now();
    swipeArea.classList.add('dragging');
    placeCards(0, 'none'); // kill any running transition
  }

  function onMove(x) {
    if (!dragging) return;
    offsetX = resistEnd(x - startX);
    placeCards(offsetX, 'none');
    const now = performance.now();
    const dt  = now - lastT;
    if (dt > 0) flickVel = ((x - lastX) / dt) * 16; // px/frame @ 60 fps
    lastX = x;
    lastT = now;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    swipeArea.classList.remove('dragging');

    const atEnd = (current === 0 && offsetX > 0) ||
                  (current === total - 1 && offsetX < 0);

    if (atEnd) {
      // Spring back to centre
      placeCards(0, 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)');
    } else if (Math.abs(flickVel) > 3) {
      // Flick gesture — advance one card in the flick direction
      goTo(current + (flickVel < 0 ? 1 : -1));
    } else if (Math.abs(offsetX) > slotW * 0.25) {
      // Dragged past 25% threshold — commit to next/prev card
      goTo(current + (offsetX < 0 ? 1 : -1));
    } else {
      // Insufficient drag — snap back to centre
      placeCards(0, 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)');
    }
  }

  // Touch
  swipeArea.addEventListener('touchstart',  e => onStart(e.touches[0].clientX), { passive: true });
  swipeArea.addEventListener('touchmove',   e => onMove(e.touches[0].clientX),  { passive: true });
  swipeArea.addEventListener('touchend',    () => onEnd());
  swipeArea.addEventListener('touchcancel', () => onEnd());

  // Mouse (for desktop testing)
  swipeArea.addEventListener('mousedown',  e => { onStart(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove',     e => onMove(e.clientX));
  window.addEventListener('mouseup',       () => onEnd());

  // Buttons
  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  // ── INIT ─────────────────────────────────────────────────────
  requestAnimationFrame(() => {
    slotW = swipeArea.offsetWidth;
    placeCards(0, 'none');
    updateMeta();
  });
}

// ─── BOOTSTRAP ────────────────────────────────────────────────
fetch('data/roles.json')
  .then(res => res.json())
  .then(roles => {
    desktopInit(roles);
    mobileInit(roles);
  })
  .catch(err => console.error('Failed to load roles.json:', err));
