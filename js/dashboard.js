// Cores intercaladas a 120° no espectro — consecutivos ficam sempre muito diferentes
const PALETTE = [
  { bg: '#FEE2E2', text: '#991B1B' }, // red
  { bg: '#DCFCE7', text: '#166534' }, // green
  { bg: '#DBEAFE', text: '#1E40AF' }, // blue
  { bg: '#FFEDD5', text: '#9A3412' }, // orange
  { bg: '#CCFBF1', text: '#134E4A' }, // teal
  { bg: '#F3E8FF', text: '#6B21A8' }, // purple
  { bg: '#FEF9C3', text: '#713F12' }, // yellow
  { bg: '#CFFAFE', text: '#155E75' }, // cyan
  { bg: '#E0E7FF', text: '#3730A3' }, // indigo
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#A7F3D0', text: '#064E3B' }, // emerald
  { bg: '#FCE7F3', text: '#9D174D' }, // pink
  { bg: '#ECFCCB', text: '#3F6212' }, // lime
  { bg: '#E0F2FE', text: '#075985' }, // sky
  { bg: '#EDE9FE', text: '#5B21B6' }, // violet
];

let injectedStyle = null;

function injectBadgeStyles(categorias) {
  if (injectedStyle) injectedStyle.remove();
  injectedStyle = document.createElement('style');
  injectedStyle.textContent = categorias.map((cat, i) => {
    const { bg, text } = PALETTE[i % PALETTE.length];
    return `.badge.${CSS.escape(cat)} { background: ${bg}; color: ${text}; }`;
  }).join('\n');
  document.head.appendChild(injectedStyle);
}

let allData = [];
let activeFilter = 'Todos';
let sortCol = 'data';
let sortDir = 1;

function parseDate(s) {
  const [d, m, y] = s.split('/');
  return new Date(+y, +m - 1, +d);
}

function isoToDisplay(s) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function fmt(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v < 0 ? '- ' : '+ ') + abs;
}

function populateHeader(meta) {
  const [y, m] = meta.periodo.inicio.split('-');
  const period = new Date(+y, +m - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const periodCap = period.charAt(0).toUpperCase() + period.slice(1);

  document.getElementById('titular-name').textContent = meta.titular;
  document.getElementById('period-badge').textContent = periodCap;
  document.getElementById('footer-period').textContent =
    `Gerado por Claude · Uso pessoal · Dados de ${isoToDisplay(meta.periodo.inicio)} a ${isoToDisplay(meta.periodo.fim)}`;
  document.title = `Extrato — ${meta.titular} — ${periodCap}`;
}

function filtered() {
  let rows = activeFilter === 'Todos' ? [...allData] : allData.filter(d => d.cat === activeFilter);
  rows.sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol === 'data') { av = parseDate(av); bv = parseDate(bv); }
    if (av < bv) return -sortDir;
    if (av > bv) return sortDir;
    return 0;
  });
  return rows;
}

function renderSummary(rows) {
  const bal = rows.filter(d => d.cat !== 'Investimento');
  const ent = bal.filter(d => d.val > 0).reduce((a, d) => a + d.val, 0);
  const sai = bal.filter(d => d.val < 0).reduce((a, d) => a + d.val, 0);
  const total = bal.reduce((a, d) => a + d.val, 0);
  document.getElementById('summary').innerHTML = `
    <div class="card">
      <div class="card-label">Entradas</div>
      <div class="card-value pos">${ent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="card">
      <div class="card-label">Saídas</div>
      <div class="card-value neg">${Math.abs(sai).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="card">
      <div class="card-label">Saldo do período</div>
      <div class="card-value ${total >= 0 ? 'pos' : 'neg'}">${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, signDisplay: 'always' })}</div>
    </div>
    <div class="card">
      <div class="card-label">Lançamentos</div>
      <div class="card-value neutral">${rows.length}</div>
    </div>
  `;
}

function renderTable(rows) {
  const tbody = document.getElementById('tbody');
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhum lançamento encontrado.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(d => `
    <tr>
      <td class="mono">${d.data}</td>
      <td>${d.simpl}${d.parcelaAtual != null ? ` <span class="parcela">{${d.parcelaAtual}/${d.parcelaTotal}}</span>` : ''}</td>
      <td class="orig-cell">${d.orig}</td>
      <td><span class="badge ${d.cat}">${d.cat}</span></td>
      <td class="val ${d.cat === 'Investimento' ? 'inv' : (d.val < 0 ? 'neg' : 'pos')}">${d.cat === 'Investimento' ? Math.abs(d.val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmt(d.val)}</td>
      <td class="origem-cell">${d.origem}</td>
    </tr>
  `).join('');
}

function render() {
  const rows = filtered();
  renderSummary(rows);
  renderTable(rows);
}

function buildFilters(cats) {
  const filtersEl = document.getElementById('filters');
  filtersEl.innerHTML = '';
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (c === 'Todos' ? ' active' : '');
    btn.textContent = c;
    btn.onclick = () => {
      activeFilter = c;
      document.querySelectorAll('#filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    };
    filtersEl.appendChild(btn);
  });
}

function initSort() {
  document.querySelectorAll('thead th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) sortDir *= -1;
      else { sortCol = col; sortDir = 1; }
      document.querySelectorAll('thead th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
      render();
    });
  });
}

let currentFolder = null;

function loadFile(file) {
  activeFilter = 'Todos';

  fetch(`data/${currentFolder}/${file}`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(({ meta, categorias_validas, lancamentos }) => {
      allData = lancamentos.map(l => ({
        data:          isoToDisplay(l.data),
        orig:          l.nome_original,
        simpl:         l.nome_simplificado,
        cat:           l.categoria,
        val:           l.valor,
        origem:        l.origem,
        parcelaAtual:  l.parcela_atual  ?? null,
        parcelaTotal:  l.parcelas_total ?? null,
      }));

      const catsInData = new Set(allData.map(d => d.cat));
      const extra = [...catsInData].filter(c => !categorias_validas.includes(c));
      const allCats = [...categorias_validas, ...extra];
      const cats = ['Todos', ...allCats.filter(c => catsInData.has(c))];

      injectBadgeStyles(allCats);
      populateHeader(meta);
      buildFilters(cats);
      render();
    })
    .catch(() => {
      document.getElementById('tbody').innerHTML =
        '<tr><td colspan="6" class="empty">Erro ao carregar dados. Abra via servidor local (ex: <code>npx serve</code>).</td></tr>';
    });
}

function buildMonthSelector(arquivos, activeFile) {
  const monthsEl = document.getElementById('months');
  monthsEl.innerHTML = '';
  arquivos.forEach(({ label, file }) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (file === activeFile ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      document.querySelectorAll('#months .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadFile(file);
    };
    monthsEl.appendChild(btn);
  });
}

function loadPerson(folder) {
  currentFolder = folder;

  fetch(`data/${folder}/manifest.json`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(({ arquivos }) => {
      const latest = arquivos[arquivos.length - 1].file;
      buildMonthSelector(arquivos, latest);
      loadFile(latest);
    });
}

function buildPersonSelector(pessoas, activeFolder) {
  const pessoasEl = document.getElementById('pessoas');
  pessoas.forEach(({ label, folder }) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (folder === activeFolder ? ' active' : '');
    btn.textContent = label;
    btn.onclick = () => {
      document.querySelectorAll('#pessoas .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPerson(folder);
    };
    pessoasEl.appendChild(btn);
  });
}

initSort();

fetch('data/manifest.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(({ pessoas }) => {
    const first = pessoas[0];
    buildPersonSelector(pessoas, first.folder);
    loadPerson(first.folder);
  })
  .catch(() => {
    document.getElementById('tbody').innerHTML =
      '<tr><td colspan="6" class="empty">Erro ao carregar dados. Abra via servidor local (ex: <code>npx serve</code>).</td></tr>';
  });
