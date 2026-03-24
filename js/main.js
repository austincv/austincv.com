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
  document.querySelectorAll('.role-section').forEach((sec, i) => {
    sec.dataset.role = i;
  });

  // Populate initial card and left panel
  cardFront.innerHTML = buildCardInner(roles[0]);
  lpEyebrow.textContent  = roles[0].eyebrow;
  lpHeadline.innerHTML   = roles[0].headline.replace(/\n/g, '<br>');
  lpSub.textContent      = roles[0].sub;

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

  function setCardTransform(rotY, tilt) {
    card3d.style.transform = `perspective(900px) rotateY(${rotY}deg) rotate(${tilt}deg)`;
  }

  function rotateTo(idx) {
    if (idx === currentRole || animating) return;
    animating = true;
    currentRole = idx;

    card3d.classList.remove('swinging');
    card3d.style.transition = 'transform 0.28s cubic-bezier(0.4,0,1,1)';
    setCardTransform(90, -1);

    setTimeout(() => {
      cardFront.innerHTML = buildCardInner(roles[idx]);

      card3d.style.transition = 'none';
      setCardTransform(-90, -1);
      void card3d.offsetWidth;

      card3d.style.transition = 'transform 0.32s cubic-bezier(0,0,0.3,1)';
      setCardTransform(0, -2);

      updateLeft(roles[idx]);

      setTimeout(() => {
        animating = false;
        card3d.style.transition = '';
        card3d.style.transform  = '';
        card3d.classList.add('swinging');
      }, 340);
    }, 290);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const sections = document.querySelectorAll('.role-section');
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
  const stack    = document.getElementById('mobileCardStack');
  const progress = document.getElementById('mobileProgress');
  const eyebrow  = document.getElementById('mobileEyebrow');
  const desc     = document.getElementById('mobileDesc');
  const btnPrev  = document.getElementById('mPrev');
  const btnNext  = document.getElementById('mNext');

  let current = 0;
  const total  = roles.length;

  roles.forEach((role, i) => {
    const card = document.createElement('div');
    card.className = 'mobile-card';
    card.innerHTML = buildCardInner(role);
    card.dataset.idx = i;
    stack.appendChild(card);
  });

  roles.forEach(() => {
    const dot = document.createElement('div');
    dot.className = 'mobile-progress-dot';
    progress.appendChild(dot);
  });

  function getCardEl(idx) {
    return stack.querySelector(`[data-idx="${idx}"]`);
  }

  function updateUI() {
    roles.forEach((_, i) => {
      const el = getCardEl(i);
      el.className = 'mobile-card';
      if (i === current) el.classList.add('active');
      else if (i === current - 1) el.classList.add('behind-l');
      else if (i === current + 1) el.classList.add('behind-r');
      else el.classList.add(i < current ? 'prev' : 'next');
    });

    document.querySelectorAll('.mobile-progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });

    eyebrow.textContent = roles[current].company + ' · ' + roles[current].dates;
    desc.textContent    = roles[current].sub;
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(total - 1, idx));
    updateUI();
  }

  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  let startX = 0, startY = 0, isDragging = false;
  const THRESHOLD = 60;

  stack.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  stack.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      const card = getCardEl(current);
      card.style.transform = `translateX(${dx}px) scale(1)`;
      card.classList.add('dragging');
    }
  }, { passive: true });

  stack.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    const card = getCardEl(current);
    card.classList.remove('dragging');
    card.style.transform = '';
    if (dx < -THRESHOLD) goTo(current + 1);
    else if (dx > THRESHOLD) goTo(current - 1);
  });

  let mouseStart = 0, mouseDown = false;
  stack.addEventListener('mousedown', e => { mouseStart = e.clientX; mouseDown = true; });
  stack.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const card = getCardEl(current);
    card.style.transform = `translateX(${e.clientX - mouseStart}px) scale(1)`;
    card.classList.add('dragging');
  });
  stack.addEventListener('mouseup', e => {
    if (!mouseDown) return;
    mouseDown = false;
    const dx = e.clientX - mouseStart;
    const card = getCardEl(current);
    card.classList.remove('dragging');
    card.style.transform = '';
    if (dx < -THRESHOLD) goTo(current + 1);
    else if (dx > THRESHOLD) goTo(current - 1);
  });
  stack.addEventListener('mouseleave', () => {
    if (mouseDown) {
      mouseDown = false;
      const card = getCardEl(current);
      card.classList.remove('dragging');
      card.style.transform = '';
    }
  });

  updateUI();
}

// ─── BOOTSTRAP ────────────────────────────────────────────────
fetch('data/roles.json')
  .then(res => res.json())
  .then(roles => {
    desktopInit(roles);
    mobileInit(roles);
  })
  .catch(err => console.error('Failed to load roles.json:', err));
