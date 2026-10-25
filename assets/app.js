// Guide Legion 7.3.5 : routage par hash (#/classe/spe) et rendu à partir des fichiers JSON de data/.
(function () {
  const app = document.getElementById('app');
  const ICON_URL = 'https://wow.zamimg.com/images/wow/icons/large/';

  // Icônes d'interface (traits simples, 24x24)
  const SVG = {
    tank: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/>',
    heal: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
    dps: '<path d="M14.5 3H21v6.5L10 20.5 6.5 17zM4 16l4 4-2 2-4-4z"/>',
    stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M12 7v10M8 11h8"/>',
    talents: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>',
    artifact: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18M15 3l-3 18"/>',
    raid: '<path d="M3 21V9l3-2v3l3-2v3l3-2 3 2V8l3 2V7l3 2v12z"/><path d="M10 21v-5h4v5"/>',
    key: '<circle cx="8" cy="15" r="5"/><path d="M11.5 11.5L21 2M17 6l3 3M15 8l2 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    spark: '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    versa: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 7v10M7.5 9.5l9 5M16.5 9.5l-9 5"/>',
    logo: '<path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'
  };
  const svg = (name, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]}</svg>`;
  const svgFill = (name, size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SVG[name]}</svg>`;

  const ROLES = { tank: 'Tank', heal: 'Soin', dps: 'DPS' };
  const MODES = { raid: ['Raid', 'raid'], mm: ['Mythique+', 'key'] };
  const TABS = { stats: ['Statistiques', 'stats'], gear: ['Équipement BiS', 'gear'], talents: ['Talents', 'talents'], artifact: ['Arme prodigieuse', 'artifact'] };
  const STAT_STYLE = {
    'Intelligence': ['#a98bff', 'spark'], 'Force': ['#ff6b6b', 'spark'], 'Agilité': ['#f0c457', 'spark'],
    'Critique': ['#ff5d73', 'target'], 'Hâte': ['#f0c457', 'bolt'], 'Maîtrise': ['#5aa9ff', 'star'], 'Polyvalence': ['#3ecf8e', 'versa']
  };
  const RELIC_COLORS = {
    'Sacré': '#f6d365', 'Vie': '#3ecf8e', 'Ombre': '#8e5cff', 'Feu': '#ff7a3d', 'Givre': '#6fd3ff',
    'Arcanes': '#ff7ad9', 'Fer': '#a7adb8', 'Sang': '#e0314b', 'Tempête': '#4c8dff', 'Gangrène': '#9be22d'
  };

  let classes = null;
  const specCache = {};
  const view = { tab: 'stats', mode: 'raid', role: 'all', q: '' };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wowhead = (name) => 'https://fr.wowhead.com/search?q=' + encodeURIComponent(name);
  const initials = (s) => s.split(/[\s'-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Icône de jeu : les initiales restent visibles si l'image ne charge pas.
  const icon = (name, label, color) => `
    <span class="ic"${color ? ` style="--cc:${color}"` : ''}>${esc(initials(label))}${name ? `<img src="${ICON_URL}${name}.jpg" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
  const roleIcon = (role) => `<span class="role-ic role-${role}" title="${ROLES[role]}">${svgFill(role, 13)}</span>`;

  async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  async function loadSpec(classId, specId) {
    const key = classId + '-' + specId;
    if (!(key in specCache)) {
      specCache[key] = await loadJSON('data/specs/' + key + '.json').catch(() => null);
    }
    return specCache[key];
  }

  function renderClassGrid() {
    const q = norm(view.q.trim());
    const cards = classes.map((c) => {
      const specs = c.specs.filter((s) => (view.role === 'all' || s.role === view.role) &&
        (!q || norm(c.name).includes(q) || norm(s.name).includes(q)));
      if (!specs.length) return '';
      return `
        <article class="class-card" style="--cc:${c.color}">
          <div class="class-head">
            ${icon(c.icon, c.name, c.color)}
            <div>
              <div class="class-name">${esc(c.name)}</div>
              <div class="class-count">${c.specs.length} spécialisations</div>
            </div>
          </div>
          <ul class="spec-list">
            ${specs.map((s) => `
              <li><a class="spec-link" href="#/${c.id}/${s.id}">
                ${icon(s.icon, s.name, c.color)}
                <span class="name">${esc(s.name)}</span>
                ${s.ready ? '<span class="ready" title="Guide disponible"></span>' : ''}
                ${roleIcon(s.role)}
              </a></li>`).join('')}
          </ul>
        </article>`;
    }).join('');
    return cards || '<p class="no-result">Aucune spé ne correspond à ta recherche.</p>';
  }

  function renderHome() {
    document.title = 'Guide Legion 7.3.5';
    const roles = [['all', 'Toutes', null], ['tank', 'Tank', 'tank'], ['heal', 'Soin', 'heal'], ['dps', 'DPS', 'dps']];
    app.innerHTML = `
      <section class="hero">
        <h1>Guide des classes<br>Legion 7.3.5</h1>
        <p>Statistiques, équipement BiS, talents et arme prodigieuse pour les 36 spés, en raid et en Mythique+.</p>
        <div class="filters">
          <label class="search">${svg('search')}<input type="search" placeholder="Rechercher une classe ou une spé" value="${esc(view.q)}" aria-label="Rechercher"></label>
          <div class="seg" role="group" aria-label="Filtrer par rôle">
            ${roles.map(([k, l, ic]) => `<button data-role="${k}" aria-pressed="${view.role === k}">${ic ? `<span class="role-${ic}">${svgFill(ic, 13)}</span>` : ''}${l}</button>`).join('')}
          </div>
        </div>
      </section>
      <div class="class-grid">${renderClassGrid()}</div>`;

    const grid = app.querySelector('.class-grid');
    app.querySelector('.search input').addEventListener('input', (e) => { view.q = e.target.value; grid.innerHTML = renderClassGrid(); });
    app.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => {
      view.role = b.dataset.role;
      app.querySelectorAll('[data-role]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      grid.innerHTML = renderClassGrid();
    }));
  }

  function renderStats(data) {
    const list = data.stats[view.mode] || [];
    if (!list.length) return `<p class="empty-state">${svg('info')}Pas encore de priorité pour ce mode.</p>`;
    return `
      <h2 class="panel-title">${svg('stats')}Priorité des statistiques</h2>
      <div class="stats">
        ${list.map((s, i) => {
          const [color, ic] = STAT_STYLE[s.stat] || ['#888', 'star'];
          return `
          <div class="stat" style="--sc:${color}">
            <span class="stat-rank">${i + 1}</span>
            <span class="stat-icon" style="background:${color}">${svg(ic, 20)}</span>
            <div class="stat-body">
              <div class="stat-name">${esc(s.stat)}</div>
              <div class="stat-bar" role="img" aria-label="Poids ${s.weight}"><span style="width:${s.weight}%"></span></div>
            </div>
            <span class="stat-value">${s.weight}</span>
          </div>`;
        }).join('')}
      </div>
      ${data.stats.tips ? `<div class="tips">${data.stats.tips.map((t) => `<div class="tip">${svg('info')}<span>${esc(t)}</span></div>`).join('')}</div>` : ''}`;
  }

  function renderGear(data) {
    const list = data.gear[view.mode] || [];
    if (!list.length) return `<p class="empty-state">${svg('info')}Pas encore de liste BiS pour ce mode.</p>`;
    return `
      <h2 class="panel-title">${svg('gear')}Équipement BiS</h2>
      <div class="gear">
        ${list.map((g) => {
          const todo = g.quality === 'todo';
          const name = todo ? `<span class="gear-name">${esc(g.item)}</span>`
            : `<a class="gear-name" href="${wowhead(g.item)}" target="_blank" rel="noopener">${esc(g.item)}</a>`;
          return `
          <div class="gear-item ${g.quality || 'epic'}">
            <span class="slot-ic">${svg(g.quality === 'legendary' ? 'star' : 'gear', 20)}</span>
            <div class="gear-text">
              <div class="gear-slot">${esc(g.slot)}</div>
              ${name}
              <div class="gear-source">${esc(g.source)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function renderTalents(data) {
    const build = data.talents.builds[view.mode];
    if (!build) return `<p class="empty-state">${svg('info')}Pas encore de template pour ce mode.</p>`;
    return `
      <h2 class="panel-title">${svg('talents')}Template de talents</h2>
      <div class="talents">
        ${data.talents.tiers.map((t, i) => `
          <div class="tier">
            <span class="tier-level">${t.level}</span>
            ${t.options.map((o, j) => {
              const picked = build.picks[i] === j;
              return `<div class="talent${picked ? ' picked' : ''}">
                ${icon(o.icon, o.name)}<span>${esc(o.name)}</span>
                ${picked ? `<span class="check">${svg('check', 14)}</span>` : ''}
              </div>`;
            }).join('')}
          </div>`).join('')}
      </div>
      ${build.note ? `<p class="note">${svg('info')}${esc(build.note)}</p>` : ''}`;
  }

  function renderArtifact(data) {
    const a = data.artifact;
    return `
      <div class="artifact-head">
        ${icon(a.icon, a.name)}
        <div>
          <h2>${esc(a.name)}</h2>
          <p>Capacité : ${esc(a.ability)}</p>
        </div>
      </div>
      <div class="artifact-cols">
        <div>
          <h3 class="panel-title">${svg('artifact')}Reliques</h3>
          <div class="relics">
            ${a.relics.map((r) => `<div class="relic"><span class="gem" style="--gc:${RELIC_COLORS[r] || '#999'}"></span>${esc(r)}</div>`).join('')}
          </div>
          <h3 class="panel-title" style="margin-top:24px">${svg('spark')}Creuset de Lumen-Néant</h3>
          <div class="chips">${a.crucible.map((t) => `<span class="chip">${svg('star', 13)}${esc(t)}</span>`).join('')}</div>
        </div>
        <div>
          <h3 class="panel-title">${svg('talents')}Ordre des traits</h3>
          <ol class="path">${a.priority.map((t, i) => `<li><span class="node">${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
        </div>
      </div>`;
  }

  const RENDER = { stats: renderStats, gear: renderGear, talents: renderTalents, artifact: renderArtifact };

  async function renderSpec(classId, specId) {
    const cls = classes.find((c) => c.id === classId);
    const spec = cls && cls.specs.find((s) => s.id === specId);
    if (!spec) return renderHome();
    document.title = spec.name + ' ' + cls.name + ' · Guide Legion';

    const data = await loadSpec(classId, specId);
    const hero = `
      <a class="back" href="#/">${svg('back')}Toutes les classes</a>
      <section class="spec-hero" style="--cc:${cls.color}">
        ${icon(spec.icon, spec.name, cls.color)}
        <div class="spec-hero-text">
          <div class="spec-kicker">${icon(cls.icon, cls.name, cls.color)}${esc(cls.name)}</div>
          <h1>${esc(spec.name)}</h1>
          ${data ? `<p>${esc(data.summary)}</p>` : ''}
          <div class="pills">
            <span class="pill"><span class="role-${spec.role}">${svgFill(spec.role, 12)}</span>${ROLES[spec.role]}</span>
            <span class="pill">Patch 7.3.5</span>
            ${data && data.status === 'exemple' ? `<span class="pill draft">${svg('info', 12)}Données d'exemple</span>` : ''}
          </div>
        </div>
      </section>`;

    if (!data) {
      app.innerHTML = hero + `<div class="panel" style="margin-top:20px"><p class="empty-state">${svg('info')}Cette spé n'est pas encore rédigée.</p></div>`;
      return;
    }

    const showModes = view.tab !== 'artifact';
    app.innerHTML = `${hero}
      <div class="toolbar">
        <div class="seg" role="tablist">
          ${Object.entries(TABS).map(([k, [l, ic]]) => `<button role="tab" data-tab="${k}" aria-selected="${view.tab === k}">${svg(ic)}<span class="lbl">${l}</span></button>`).join('')}
        </div>
        ${showModes ? `<div class="seg" role="group" aria-label="Contenu">
          ${Object.entries(MODES).map(([k, [l, ic]]) => `<button data-mode="${k}" aria-pressed="${view.mode === k}">${svg(ic)}<span class="lbl">${l}</span></button>`).join('')}
        </div>` : ''}
      </div>
      <section class="panel" role="tabpanel">${RENDER[view.tab](data)}</section>`;

    app.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { view.tab = b.dataset.tab; renderSpec(classId, specId); }));
    app.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { view.mode = b.dataset.mode; renderSpec(classId, specId); }));
  }

  async function route() {
    if (!classes) classes = (await loadJSON('data/classes.json')).classes;
    const [, classId, specId] = location.hash.replace(/^#/, '').split('/');
    if (classId && specId) renderSpec(classId, specId);
    else renderHome();
    window.scrollTo(0, 0);
  }

  document.querySelector('.brand-logo').innerHTML = svgFill('logo', 16);
  window.addEventListener('hashchange', route);
  route().catch(() => { app.innerHTML = '<p class="empty-state">Impossible de charger les données.</p>'; });
})();
