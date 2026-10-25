// Guide Legion 7.3.5 : routage par hash (#/classe/spe) et rendu à partir des fichiers JSON de data/.
(function () {
  const app = document.getElementById('app');
  const ROLES = { tank: 'Tank', heal: 'Soin', dps: 'DPS' };
  const MODES = { raid: 'Raid (Antorus)', mm: 'Mythique+' };
  const TABS = { stats: 'Statistiques', gear: 'Équipement BiS', talents: 'Talents', artifact: 'Arme prodigieuse' };

  let classes = null;
  const specCache = {};
  const view = { tab: 'stats', mode: 'raid' };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wowhead = (name) => 'https://fr.wowhead.com/search?q=' + encodeURIComponent(name);

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

  function renderHome() {
    document.title = 'Guide Legion 7.3.5';
    app.innerHTML = `
      <section class="intro">
        <h1>Choisis ta classe</h1>
        <p>Statistiques, équipement BiS, talents et arme prodigieuse pour chaque spé, en raid et en Mythique+.</p>
      </section>
      <div class="class-grid">
        ${classes.map((c) => `
          <article class="class-card" style="--class-color:${c.color}">
            <span class="class-name">${esc(c.name)}</span>
            <ul class="spec-list">
              ${c.specs.map((s) => `
                <li><a class="spec-link" href="#/${c.id}/${s.id}">
                  <span>${esc(s.name)}</span><span class="role">${ROLES[s.role]}</span>
                </a></li>`).join('')}
            </ul>
          </article>`).join('')}
      </div>`;
  }

  function renderStats(data) {
    const list = data.stats[view.mode] || [];
    if (!list.length) return '<p class="empty-state">Pas encore de priorité pour ce mode.</p>';
    return `
      ${list.map((s, i) => `
        <div class="stat-row">
          <span class="stat-rank">${i + 1}</span>
          <span>${esc(s.stat)}</span>
          <div class="stat-bar" role="img" aria-label="${esc(s.stat)} : ${s.weight}"><span style="width:${s.weight}%"></span></div>
        </div>`).join('')}
      ${data.stats.tips ? `<ul class="tips">${data.stats.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`;
  }

  function renderGear(data) {
    const list = data.gear[view.mode] || [];
    if (!list.length) return '<p class="empty-state">Pas encore de liste BiS pour ce mode.</p>';
    return `<div class="gear-grid">
      ${list.map((g) => {
        const todo = g.item.startsWith('À compléter');
        const cls = todo ? 'todo' : g.source === 'Légendaire' ? 'legendary' : '';
        const name = todo ? `<span class="gear-name todo">${esc(g.item)}</span>`
          : `<a class="gear-name ${cls}" href="${wowhead(g.item)}" target="_blank" rel="noopener">${esc(g.item)}</a>`;
        return `<div class="gear-item">
          <div class="gear-slot">${esc(g.slot)}</div>
          ${name}
          <div class="gear-source">${esc(g.source)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderTalents(data) {
    const build = data.talents.builds[view.mode];
    if (!build) return '<p class="empty-state">Pas encore de template pour ce mode.</p>';
    return `
      <div class="talent-grid">
        ${data.talents.tiers.map((t, i) => `
          <div class="talent-row">
            <span class="talent-level">${t.level}</span>
            ${t.options.map((o, j) => `<div class="talent${build.picks[i] === j ? ' picked' : ''}">${esc(o)}</div>`).join('')}
          </div>`).join('')}
      </div>
      ${build.note ? `<p class="note">${esc(build.note)}</p>` : ''}`;
  }

  function renderArtifact(data) {
    const a = data.artifact;
    return `
      <h2>${esc(a.name)}</h2>
      <div class="artifact-cols">
        <div>
          <h3>Reliques</h3>
          <div class="relics">${a.relics.map((r) => `<div class="relic">${esc(r)}</div>`).join('')}</div>
          <h3 style="margin-top:16px">Creuset de Lumen-Néant</h3>
          <ul class="trait-list">${a.crucible.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>Ordre des traits</h3>
          <ol class="trait-list">${a.priority.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
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
    const header = `
      <a class="back" href="#/">← Toutes les classes</a>
      <div class="spec-head" style="--class-color:${cls.color}">
        <span class="class-name">${esc(cls.name)}</span>
        <h1>${esc(spec.name)}</h1>
        <span class="role">${ROLES[spec.role]}</span>
        ${data && data.status === 'exemple' ? '<span class="badge-draft">Données d\'exemple</span>' : ''}
      </div>`;

    if (!data) {
      app.innerHTML = header + '<div class="panel"><p class="empty-state">Cette spé n\'est pas encore rédigée.</p></div>';
      return;
    }

    const showModes = view.tab !== 'artifact';
    app.innerHTML = `${header}
      <p class="spec-summary">${esc(data.summary)}</p>
      <div class="toolbar">
        <div class="tabs" role="tablist">
          ${Object.entries(TABS).map(([k, v]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${view.tab === k}">${v}</button>`).join('')}
        </div>
        ${showModes ? `<div class="modes">
          ${Object.entries(MODES).map(([k, v]) => `<button class="mode" data-mode="${k}" aria-pressed="${view.mode === k}">${v}</button>`).join('')}
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

  window.addEventListener('hashchange', route);
  route().catch(() => { app.innerHTML = '<p class="empty-state">Impossible de charger les données.</p>'; });
})();
