// ────────────────────────────────────────────────────────────────────────────
// Agent Desk — Phase Desk-1
//
// A lightweight kanban-style task board that lives in the sidebar panel.
// Tasks are persisted to localStorage and have four status columns:
//   inbox  → 예정
//   doing  → 진행 중
//   review → 검토 필요
//   done   → 완료
//
// Each task carries: id, title, description, status, priority, timestamps.
// Frontend-only — no backend changes. Designed to extend in later phases:
//   Desk-2: session linkage
//   Desk-3: cron / artifact connections
//   Desk-4: AI "next best move" recommendations
//
// Storage:
//   localStorage["hermes-desk-tasks"] = JSON.stringify([{...task}, ...])
// ────────────────────────────────────────────────────────────────────────────

const _DESK_KEY = 'hermes-desk-tasks';
const _DESK_COLS = [
  {id: 'inbox',  label: '예정',   accent: 'var(--muted)'},
  {id: 'doing',  label: '진행 중', accent: 'var(--blue, #82aaff)'},
  {id: 'review', label: '검토',   accent: 'var(--gold, #f0c75b)'},
  {id: 'done',   label: '완료',   accent: 'var(--success, #6fcf97)'},
];

let _deskFilter = '';                    // search term
let _deskExpanded = new Set();           // expanded task ids (show description)

// ── Storage ────────────────────────────────────────────────────────────────
function _loadDeskTasks(){
  try{
    const raw = localStorage.getItem(_DESK_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function _saveDeskTasks(list){
  try{
    localStorage.setItem(_DESK_KEY, JSON.stringify(list));
  }catch(e){
    console.warn('[desk] save failed:', e.message);
    if(typeof window.showToast === 'function') window.showToast('저장 실패: ' + e.message);
  }
}

// ── CRUD ───────────────────────────────────────────────────────────────────
function newDeskTask(){
  const form = document.getElementById('deskNewForm');
  if(!form) return;
  form.style.display = 'block';
  const title = document.getElementById('deskNewTitle');
  if(title){ title.value = ''; title.focus(); }
  const desc = document.getElementById('deskNewDesc');
  if(desc) desc.value = '';
  const prio = document.getElementById('deskNewPriority');
  if(prio) prio.value = 'normal';
}

function cancelDeskTask(){
  const form = document.getElementById('deskNewForm');
  if(form) form.style.display = 'none';
}

function submitDeskTask(){
  const titleEl = document.getElementById('deskNewTitle');
  const descEl  = document.getElementById('deskNewDesc');
  const prioEl  = document.getElementById('deskNewPriority');
  const title   = (titleEl && titleEl.value || '').trim();
  if(!title){
    if(titleEl) titleEl.focus();
    if(typeof window.showToast === 'function') window.showToast('제목을 입력하세요');
    return;
  }
  const task = {
    id:          'task_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    title:       title.slice(0, 200),
    description: (descEl && descEl.value || '').trim().slice(0, 2000),
    status:      'inbox',
    priority:    (prioEl && prioEl.value) || 'normal',
    createdAt:   Date.now(),
    updatedAt:   null,
  };
  const list = _loadDeskTasks();
  list.unshift(task);                    // newest on top
  _saveDeskTasks(list);
  cancelDeskTask();
  renderDeskBoard();
  if(typeof window.showToast === 'function') window.showToast('작업 추가됨');
}

function moveDeskTask(id, newStatus){
  const list = _loadDeskTasks();
  const t = list.find(x => x.id === id);
  if(!t) return;
  if(!_DESK_COLS.find(c => c.id === newStatus)) return;
  t.status = newStatus;
  t.updatedAt = Date.now();
  _saveDeskTasks(list);
  renderDeskBoard();
}

function toggleDeskTaskPriority(id, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  const list = _loadDeskTasks();
  const t = list.find(x => x.id === id);
  if(!t) return;
  // Cycle: normal → high → low → normal
  t.priority = t.priority === 'normal' ? 'high' : (t.priority === 'high' ? 'low' : 'normal');
  t.updatedAt = Date.now();
  _saveDeskTasks(list);
  renderDeskBoard();
}

function deleteDeskTask(id, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(!confirm('이 작업을 삭제할까요?')) return;
  const list = _loadDeskTasks().filter(x => x.id !== id);
  _saveDeskTasks(list);
  _deskExpanded.delete(id);
  renderDeskBoard();
}

function toggleDeskTaskExpand(id){
  if(_deskExpanded.has(id)) _deskExpanded.delete(id);
  else _deskExpanded.add(id);
  renderDeskBoard();
}

function filterDeskTasks(term){
  _deskFilter = (term || '').trim().toLowerCase();
  renderDeskBoard();
}

// ── Rendering ──────────────────────────────────────────────────────────────
function _prioLabel(p){
  if(p === 'high') return '🔥';
  if(p === 'low')  return '⌄';
  return '·';
}

function _formatTaskTime(ts){
  if(!ts) return '';
  const diff = Date.now() - ts;
  if(diff < 60_000)     return '방금';
  if(diff < 3_600_000)  return Math.floor(diff/60_000) + '분 전';
  if(diff < 86_400_000) return Math.floor(diff/3_600_000) + '시간 전';
  return Math.floor(diff/86_400_000) + '일 전';
}

function _renderTaskCard(t){
  const isExpanded = _deskExpanded.has(t.id);
  const prio = t.priority || 'normal';
  // Build status switcher buttons (skip current status)
  const moveBtns = _DESK_COLS
    .filter(c => c.id !== t.status)
    .map(c => `<button class="desk-move-btn" onclick="event.stopPropagation();moveDeskTask('${t.id}','${c.id}')" title="${c.label}로 이동">→ ${c.label}</button>`)
    .join('');
  return `
    <div class="desk-card desk-prio-${prio} ${isExpanded ? 'expanded' : ''}" onclick="toggleDeskTaskExpand('${t.id}')">
      <div class="desk-card-header">
        <button class="desk-prio-toggle" onclick="toggleDeskTaskPriority('${t.id}', event)" title="우선순위 (보통 → 높음 → 낮음)">${_prioLabel(prio)}</button>
        <div class="desk-card-title">${_escDesk(t.title)}</div>
        <button class="desk-card-delete" onclick="deleteDeskTask('${t.id}', event)" title="삭제" aria-label="삭제">×</button>
      </div>
      <div class="desk-card-meta">
        <span>${_formatTaskTime(t.updatedAt || t.createdAt)}</span>
      </div>
      ${isExpanded ? `
        ${t.description ? `<div class="desk-card-desc">${_escDesk(t.description).replace(/\n/g, '<br>')}</div>` : ''}
        <div class="desk-card-actions">
          ${moveBtns}
        </div>
      ` : ''}
    </div>`;
}

function renderDeskBoard(){
  const root = document.getElementById('deskBoard');
  if(!root) return;
  const all = _loadDeskTasks();
  const filtered = _deskFilter
    ? all.filter(t =>
        (t.title || '').toLowerCase().includes(_deskFilter) ||
        (t.description || '').toLowerCase().includes(_deskFilter))
    : all;
  // Sort within each column: high priority first, then newest first
  const byStatus = {};
  for(const c of _DESK_COLS) byStatus[c.id] = [];
  for(const t of filtered){
    const status = t.status && byStatus[t.status] ? t.status : 'inbox';
    byStatus[status].push(t);
  }
  for(const k of Object.keys(byStatus)){
    byStatus[k].sort((a, b) => {
      const pa = a.priority === 'high' ? 0 : (a.priority === 'low' ? 2 : 1);
      const pb = b.priority === 'high' ? 0 : (b.priority === 'low' ? 2 : 1);
      if(pa !== pb) return pa - pb;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });
  }

  if(!all.length){
    root.innerHTML = `
      <div class="desk-empty">
        <h4>아직 작업이 없습니다</h4>
        <p>위의 <b>+ 새 작업</b> 버튼으로 첫 작업을 만들어 보세요.</p>
        <p style="margin-top:8px;font-size:11px">
        예: <em>"5차시 영어 강의안 작성"</em>, <em>"학생 영작 첨삭 5건"</em>,
        <em>"이번 주 학습 자료 PR 리뷰"</em>
        </p>
      </div>`;
    return;
  }

  root.innerHTML = _DESK_COLS.map(c => {
    const cards = byStatus[c.id] || [];
    return `
      <section class="desk-column" data-status="${c.id}">
        <header class="desk-col-header" style="--col-accent:${c.accent}">
          <span class="desk-col-label">${c.label}</span>
          <span class="desk-col-count">${cards.length}</span>
        </header>
        <div class="desk-col-body">
          ${cards.length === 0
            ? `<div class="desk-col-empty">비어 있음</div>`
            : cards.map(t => _renderTaskCard(t)).join('')}
        </div>
      </section>`;
  }).join('');
}

// HTML-escape helper (small, independent of ui.js)
function _escDesk(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ── Init ───────────────────────────────────────────────────────────────────
function _initDesk(){
  // Re-render after the DOM is ready in case the user landed on the Desk
  // panel directly via deep-link or bfcache restore.
  const panel = document.getElementById('panelDesk');
  if(panel && panel.classList.contains('active')) renderDeskBoard();

  // Wire keyboard: Enter on title submits when the new-task form is open
  const titleEl = document.getElementById('deskNewTitle');
  if(titleEl){
    titleEl.addEventListener('keydown', e => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        submitDeskTask();
      } else if(e.key === 'Escape'){
        cancelDeskTask();
      }
    });
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _initDesk);
} else {
  _initDesk();
}

// ── Global exposure ────────────────────────────────────────────────────────
window.newDeskTask           = newDeskTask;
window.cancelDeskTask        = cancelDeskTask;
window.submitDeskTask        = submitDeskTask;
window.moveDeskTask          = moveDeskTask;
window.toggleDeskTaskPriority = toggleDeskTaskPriority;
window.deleteDeskTask        = deleteDeskTask;
window.toggleDeskTaskExpand  = toggleDeskTaskExpand;
window.filterDeskTasks       = filterDeskTasks;
window.renderDeskBoard       = renderDeskBoard;
