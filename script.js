const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 30);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealItems = document.querySelectorAll('.reveal');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced) {
  revealItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const isSmall = window.matchMedia('(max-width: 680px)').matches;
    const fromLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
    const dx = isSmall ? 0 : (fromLeft ? -72 : 72);
    const dy = isSmall ? 18 : 26;
    item.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    item.style.transitionDelay = `${(index % 3) * 70}ms`;
  });
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.style.transform = 'translate3d(0, 0, 0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => {
    item.classList.add('is-visible');
    item.style.transform = 'translate3d(0, 0, 0)';
  });
}

const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
const projectList = document.querySelector('.project-list');
filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;

    filters.forEach((button) => {
      const isActive = button === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    projectList?.classList.add('is-filtered');
    projects.forEach((project) => {
      const shouldShow = project.dataset.category === selected;
      project.classList.toggle('is-hidden', !shouldShow);
    });
  });
});

// Some portfolio previews run inside a sandbox that blocks links with
// target="_blank". Open dashboards in a new tab when possible and fall back
// to the current page so the visitor is never left with a button that appears
// to do nothing.
document.querySelectorAll('.project-link').forEach((link) => {
  const projectTitle = link.closest('.project-card')?.querySelector('.project-meta span')?.textContent?.trim();
  const linkLabel = link.textContent.replace(/\s+/g, ' ').trim();

  link.setAttribute('aria-label', `${linkLabel}${projectTitle ? `, ${projectTitle}` : ''}; abre em nova aba`);

  link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    try {
      const dashboardWindow = window.open(link.href, '_blank');

      if (dashboardWindow) {
        dashboardWindow.opener = null;
        return;
      }
    } catch (error) {
      // The same-tab fallback below also covers sandbox security errors.
    }

    window.location.assign(link.href);
  });
});

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

// ===== fundo: rede neural =====
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const isMobile = window.matchMedia('(max-width: 680px)').matches;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dpr, nodes = [], raf;
  let mx = -9999, my = -9999;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = isMobile ? 22 : Math.min(90, Math.round((w * h) / 22000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.9 + .9
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < (isMobile ? 12000 : 18000)) {
          const o = 1 - d2 / (isMobile ? 12000 : 18000);
          ctx.strokeStyle = `rgba(90,170,255,${o * .28})`;
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dmx = a.x - mx, dmy = a.y - my;
      const dm = (mx > -1000) ? Math.hypot(dmx, dmy) : 9999;
      const boost = dm < 260 ? 1 - dm / 260 : 0;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * (1 + boost * 2.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${120 + boost * 60},${200 + boost * 50},255,${0.5 + boost * 0.5})`;
      ctx.fill();
      if (boost > 0) {
        const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 22 * (1 + boost));
        glow.addColorStop(0, `rgba(41,215,255,${boost * .5})`);
        glow.addColorStop(1, 'rgba(41,215,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(a.x, a.y, 22 * (1 + boost), 0, Math.PI * 2); ctx.fill();
      }
    }

    // conexões do site até o cursor
    if (!isMobile && mx > -1000) {
      for (let k = 0; k < nodes.length; k++) {
        const n = nodes[k];
        const dx = n.x - mx, dy = n.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 360) {
          const o = 1 - d / 360;
          const grad = ctx.createLinearGradient(mx, my, n.x, n.y);
          grad.addColorStop(0, `rgba(41,215,255,${o * .55})`);
          grad.addColorStop(1, `rgba(168,85,247,${o * .18})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, 110);
      g.addColorStop(0, 'rgba(41,215,255,.30)');
      g.addColorStop(1, 'rgba(41,215,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mx, my, 110, 0, Math.PI * 2); ctx.fill();
    }

    if (isMobile) {
      raf = setTimeout(() => requestAnimationFrame(draw), 42);
    } else {
      raf = requestAnimationFrame(draw);
    }
  };

  resize();
  window.addEventListener('resize', resize);
  if (reduce) {
    draw(); cancelAnimationFrame(raf);
  } else {
    draw();
  }
})();

// ===== cursor com halo =====
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-halo';
  document.body.appendChild(dot);
  let cx = -100, cy = -100, tx = -100, ty = -100;
  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; dot.classList.add('is-on'); }, { passive: true });
  window.addEventListener('mouseleave', () => dot.classList.remove('is-on'));
  const loop = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
})();

// ===== partículas nos botões =====
(() => {
  const buttons = document.querySelectorAll('.button');
  if (!buttons.length) return;
  const spawn = (btn, x, y, count = 10) => {
    const rect = btn.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'btn-particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 46;
      p.style.left = `${x - rect.left}px`;
      p.style.top = `${y - rect.top}px`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--sz', `${1 + Math.random() * 2.4}px`);
      p.style.setProperty('--hue', Math.random() > .5 ? '190' : '280');
      btn.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  };
  buttons.forEach((btn) => {
    let last = 0;
    btn.addEventListener('mouseenter', (e) => spawn(btn, e.clientX, e.clientY, 16));
    btn.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      spawn(btn, e.clientX, e.clientY, 4);
    });
  });
})();

// ===== mini chat da Tifa (demo) =====
(() => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const body = document.getElementById('chat-body');
  const suggest = document.getElementById('chat-suggest');
  if (!form || !body) return;

  const replies = [
    { k: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'e ai'], r: 'Oi! Que bom te ver por aqui 😊 Posso te contar sobre bots de atendimento, sites, painéis e automações com IA. O que te interessa?' },
    { k: ['bot', 'whatsapp', 'zap', 'atendimento', 'instagram', 'telegram', 'discord', 'facebook'], r: 'Faço bots para WhatsApp, Instagram, Telegram, Discord, Facebook e TikTok: respondem dúvidas, qualificam contatos e passam para uma pessoa quando precisa. Já coloquei dois no ar rodando 24 horas.' },
    { k: ['site', 'website', 'landing', 'página', 'pagina'], r: 'Sim! Desenvolvo sites e painéis administrativos sob medida, com login, banco de dados e relatórios — do design à publicação.' },
    { k: ['prazo', 'tempo', 'quanto tempo', 'demora', 'entrega'], r: 'Depende do tamanho: uma automação simples sai em poucos dias; um sistema com painel e integrações costuma levar de 2 a 6 semanas. Sempre com etapa de teste antes de entregar.' },
    { k: ['preço', 'preco', 'valor', 'custa', 'custo', 'quanto'], r: 'Cada projeto é orçado pelo escopo, sem surpresa no meio do caminho. Me chama no LinkedIn que o Evandro te passa uma proposta na hora.' },
    { k: ['app', 'aplicativo', 'mobile', 'celular'], r: 'Também faço aplicativos. A ideia é entregar o mesmo produto no site, no app e no bot, tudo conversando com o mesmo banco de dados.' },
    { k: ['dashboard', 'painel', 'monitoramento', 'social listening', 'metricas', 'métricas', 'tempo real', 'analytics'], r: 'Faço dashboards e monitoramento em tempo real — inclusive de redes sociais: volume de menções, sentimento, tendências e alertas para agir na hora.' },
    { k: ['ia', 'inteligência', 'inteligencia', 'agente', 'llm', 'rag', 'automação', 'automacao'], r: 'Trabalho com agentes de IA conectados à tua base de conhecimento (RAG), automações e agentes que executam tarefas sozinhos. Nada vai para produção sem auditoria.' },
    { k: ['contato', 'orçamento', 'orcamento', 'falar', 'reunião', 'reuniao'], r: 'Fala com o Evandro pelo LinkedIn: linkedin.com/in/evandro-tavares-154679330 — ele responde rápido 😉' },
    { k: ['obrigado', 'valeu', 'obrigada'], r: 'Por nada! Se quiser, deixa uma mensagem que o Evandro continua a conversa contigo.' }
  ];

  const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const scroll = () => { body.scrollTop = body.scrollHeight; };

  const add = (text, who) => {
    const el = document.createElement('div');
    el.className = `msg ${who}`;
    el.innerHTML = `<p></p><time>${now()}</time>`;
    el.querySelector('p').textContent = text;
    body.appendChild(el);
    scroll();
    return el;
  };

  const answer = (text) => {
    const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hit = replies.find((r) => r.k.some((k) => clean.includes(k)));
    if (hit) return hit.r;
    return 'Boa pergunta! Nesta demo eu respondo só sobre bots, sites, apps, IA, prazo e contato. Me pergunta uma dessas — ou fala direto com o Evandro no LinkedIn 😊';
  };

  const respond = (text) => {
    const typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    scroll();
    setTimeout(() => {
      typing.remove();
      add(answer(text), 'bot');
    }, 750 + Math.random() * 550);
  };

  const send = (text) => {
    const value = text.trim();
    if (!value) return;
    add(value, 'user');
    input.value = '';
    respond(value);
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

  suggest?.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => send(btn.dataset.ask || btn.textContent));
  });
})();




// ===== compartilhar =====
(() => {
  const btn = document.getElementById('share-btn');
  const modal = document.getElementById('share-modal');
  if (!btn || !modal) return;
  const feedback = document.getElementById('share-feedback');
  const url = 'https://portfolio.programer.site/';
  const text = 'Portfolio do Evandro Tavares - bots, paineis, apps e automacoes com IA.';
  const canNative = typeof navigator.share === 'function';

  const schemes = {
    whatsapp: `whatsapp://send?text=${encodeURIComponent(text + ' ' + url)}`,
    telegram: `tg://msg_url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    facebook: `fb://share?link=${encodeURIComponent(url)}`,
    x: `twitter://post?message=${encodeURIComponent(text + ' ' + url)}`,
    linkedin: `linkedin://shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
  };
  const webs = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  };

  const say = (msg) => {
    if (!feedback) return;
    feedback.textContent = msg;
    setTimeout(() => { feedback.textContent = ''; }, 2600);
  };

  const nativeShare = async () => {
    if (!canNative) return false;
    try {
      await navigator.share({ title: 'Evandro Tavares | Full Stack & IA', url });
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') return true;
      return false;
    }
  };

  const openApp = (kind) => {
    const proceedWeb = () => { if (webs[kind]) window.open(webs[kind], '_blank'); };
    if (!schemes[kind]) { proceedWeb(); return; }
    const start = Date.now();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = schemes[kind];
    document.body.appendChild(iframe);
    setTimeout(() => {
      iframe.remove();
      if (Date.now() - start < 1600 && !document.hidden) proceedWeb();
    }, 1200);
  };

  const open = () => { modal.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; };

  let busy = false;
  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (canNative) { await nativeShare(); } else { open(); }
    } finally {
      setTimeout(() => { busy = false; }, 700);
    }
  });

  modal.querySelector('.share-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  modal.querySelectorAll('[data-share]').forEach((el) => {
    el.removeAttribute('href');
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const kind = el.dataset.share;

      if (kind === 'native') {
        const ok = await nativeShare();
        if (!ok) say('Compartilhamento do sistema indisponivel');
        return;
      }

      if (kind === 'copy') {
        try { await navigator.clipboard.writeText(url); say('Link copiado!'); }
        catch (err) { say('Copie: ' + url); }
        return;
      }

      if (kind === 'instagram') {
        const ok = await nativeShare();
        if (ok) return;
        try { await navigator.clipboard.writeText(url); } catch (err) {}
        say('Link copiado - cole no Instagram');
        return;
      }

      if (canNative) { const ok = await nativeShare(); if (ok) return; }
      openApp(kind);
    });
  });
})();
