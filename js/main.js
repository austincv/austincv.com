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
      <img class="card-logo-horizontal" src="${role.logoHorizontal}" alt="${role.company} logo">
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
  const mobileEyebrow  = document.getElementById('mobileEyebrow');
  const mobileHeadline = document.getElementById('mobileHeadline');

  let current = 0;
  let slotW   = 0;

  // ── BUILD ────────────────────────────────────────────────────
  const cards = roles.map(role => {
    const el = document.createElement('div');
    el.className = 'mobile-card';
    el.innerHTML = buildCardInner(role);
    swipeArea.appendChild(el);
    return el;
  });

  const total = roles.length;

  cards.forEach(() => {
    const dot = document.createElement('div');
    dot.className = 'mobile-progress-dot';
    progress.appendChild(dot);
  });

  // ── POSITION ────────────────────────────────────────────────
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
    mobileEyebrow.textContent  = roles[current].eyebrow;
    mobileHeadline.textContent = roles[current].headline.replace(/\n/g, ' ');
    document.documentElement.style.setProperty('--current-accent', roles[current].accent);
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
    placeCards(0, 'none');
  }

  function onMove(x) {
    if (!dragging) return;
    offsetX = resistEnd(x - startX);
    placeCards(offsetX, 'none');
    const now = performance.now();
    const dt  = now - lastT;
    if (dt > 0) flickVel = ((x - lastX) / dt) * 16;
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
      placeCards(0, 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)');
    } else if (Math.abs(flickVel) > 3) {
      goTo(current + (flickVel < 0 ? 1 : -1));
    } else if (Math.abs(offsetX) > slotW * 0.25) {
      goTo(current + (offsetX < 0 ? 1 : -1));
    } else {
      placeCards(0, 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)');
    }
  }

  // Touch
  swipeArea.addEventListener('touchstart',  e => onStart(e.touches[0].clientX), { passive: true, signal });
  swipeArea.addEventListener('touchmove',   e => onMove(e.touches[0].clientX),  { passive: true, signal });
  swipeArea.addEventListener('touchend',    () => onEnd(), { signal });
  swipeArea.addEventListener('touchcancel', () => onEnd(), { signal });

  // Mouse (for desktop testing)
  swipeArea.addEventListener('mousedown', e => { onStart(e.clientX); e.preventDefault(); }, { signal });
  window.addEventListener('mousemove',    e => onMove(e.clientX),  { signal });
  window.addEventListener('mouseup',      () => onEnd(),           { signal });

  // ── INIT ─────────────────────────────────────────────────────
  requestAnimationFrame(() => {
    slotW = swipeArea.offsetWidth;
    placeCards(0, 'none');
    updateMeta();
  });

  const ro = new ResizeObserver(() => {
    slotW = swipeArea.offsetWidth;
    placeCards(0, 'none');
  });
  ro.observe(swipeArea);

  // ── DESTROY ──────────────────────────────────────────────────
  return function destroy() {
    ac.abort();
    ro.disconnect();
    swipeArea.innerHTML        = '';
    progress.innerHTML         = '';
    mobileEyebrow.textContent  = '';
    mobileHeadline.textContent = '';
  };
}

// ─── BOOTSTRAP ────────────────────────────────────────────────
const mq = window.matchMedia('(max-width: 768px)');

fetch('data/roles.json')
  .then(res => res.json())
  .then(roles => {
    let destroy = mq.matches ? mobileInit(roles) : desktopInit(roles);

    mq.addEventListener('change', e => {
      destroy();
      destroy = e.matches ? mobileInit(roles) : desktopInit(roles);
    });
  })
  .catch(err => console.error('Failed to load roles.json:', err));
