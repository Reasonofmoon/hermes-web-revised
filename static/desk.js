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
let _autoSessionCards = [];              // Phase Desk-2: sessions surfaced as cards
let _showAutoSessions = true;            // toggle visibility of auto-surfaced sessions
let _autoCronCards    = [];              // Phase Desk-3: cron jobs surfaced as cards
let _showAutoCrons    = true;            // toggle visibility of auto-surfaced cron jobs
let _autoOrchestratorCards = [];         // Phase Desk-4: Codex delegated runs
let _showAutoOrchestrator = true;        // toggle visibility of orchestrator records

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
  const manualTasks = _loadDeskTasks();
  // Filter out auto-session cards whose sessionId already exists as a
  // manual task — once promoted, the manual task takes ownership.
  const promotedSids = new Set(manualTasks.map(t => t.sessionId).filter(Boolean));
  const sessionCards = _autoSessionCards.filter(c => !promotedSids.has(c.sessionId));

  // Search filter applies to BOTH kinds.
  const matchesSearch = (item) =>
    !_deskFilter ||
    (item.title || '').toLowerCase().includes(_deskFilter) ||
    (item.description || '').toLowerCase().includes(_deskFilter);

  const filteredManual   = manualTasks.filter(matchesSearch);
  const filteredSessions = sessionCards.filter(matchesSearch);

  // Phase Desk-3: cron cards filtered by search too
  const filteredCrons = _autoCronCards.filter(matchesSearch);

  // Bucket by status. Manual tasks first (user-owned), then session, cron, orchestration.
  const byStatus = {};
  for(const c of _DESK_COLS) byStatus[c.id] = {manual: [], session: [], cron: [], orchestration: []};
  for(const t of filteredManual){
    const status = t.status && byStatus[t.status] ? t.status : 'inbox';
    byStatus[status].manual.push(t);
  }
  for(const c of filteredSessions){
    const status = byStatus[c.status] ? c.status : 'inbox';
    byStatus[status].session.push(c);
  }
  for(const c of filteredCrons){
    const status = byStatus[c.status] ? c.status : 'inbox';
    byStatus[status].cron.push(c);
  }
  for(const c of _autoOrchestratorCards.filter(matchesSearch)){
    const status = byStatus[c.status] ? c.status : 'inbox';
    byStatus[status].orchestration.push(c);
  }
  // Sort each group: high priority first, then newest first.
  const sortByPrioThenTime = (a, b) => {
    const pa = a.priority === 'high' ? 0 : (a.priority === 'low' ? 2 : 1);
    const pb = b.priority === 'high' ? 0 : (b.priority === 'low' ? 2 : 1);
    if(pa !== pb) return pa - pb;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  };
  for(const k of Object.keys(byStatus)){
    byStatus[k].manual.sort(sortByPrioThenTime);
    byStatus[k].session.sort(sortByPrioThenTime);
    byStatus[k].cron.sort(sortByPrioThenTime);
    byStatus[k].orchestration.sort(sortByPrioThenTime);
  }

  // Empty state — only when there are zero manual tasks, zero session cards, AND zero cron.
  if(!manualTasks.length && !sessionCards.length && !_autoCronCards.length && !_autoOrchestratorCards.length){
    root.innerHTML = `
      <div class="desk-empty">
        <h4>아직 작업이 없습니다</h4>
        <p>위의 <b>+ 새 작업</b> 버튼으로 첫 작업을 만들어 보세요.</p>
        <p style="margin-top:8px;font-size:11px">
        예: <em>"5차시 영어 강의안 작성"</em>, <em>"학생 영작 첨삭 5건"</em>,
        <em>"이번 주 학습 자료 PR 리뷰"</em></p>
        <p style="margin-top:8px;font-size:10px;opacity:.7">
        세션이 생기면 자동으로 카드로 등장합니다 (Phase Desk-2).</p>
      </div>`;
    return;
  }

  const autoToggle = `
    <div class="desk-auto-toggle">
      <label>
        <input type="checkbox" ${_showAutoSessions ? 'checked' : ''}
               onchange="toggleAutoSessions()">
        자동 세션 카드 (${_autoSessionCards.length}개)
      </label>
      <label>
        <input type="checkbox" ${_showAutoCrons ? 'checked' : ''}
               onchange="toggleAutoCrons()">
        예약 작업 카드 (${_autoCronCards.length}개)
      </label>
      <label>
        <input type="checkbox" ${_showAutoOrchestrator ? 'checked' : ''}
               onchange="toggleAutoOrchestrator()">
        Codex 위임 (${_autoOrchestratorCards.length}개)
      </label>
    </div>`;

  root.innerHTML = autoToggle + _DESK_COLS.map(c => {
    const bucket = byStatus[c.id] || {manual: [], session: [], cron: [], orchestration: []};
    const total = bucket.manual.length + bucket.session.length + bucket.cron.length + bucket.orchestration.length;
    return `
      <section class="desk-column" data-status="${c.id}">
        <header class="desk-col-header" style="--col-accent:${c.accent}">
          <span class="desk-col-label">${c.label}</span>
          <span class="desk-col-count">${total}</span>
        </header>
        <div class="desk-col-body">
          ${total === 0
            ? `<div class="desk-col-empty">비어 있음</div>`
            : bucket.manual.map(t => _renderTaskCard(t)).join('')
              + bucket.session.map(c => _renderSessionCard(c)).join('')
              + bucket.cron.map(c => _renderCronCard(c)).join('')
              + bucket.orchestration.map(c => _renderOrchestratorCard(c)).join('')}
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

// ── Phase Desk-2: surface existing Hermes sessions as cards ───────────────
//
// Status mapping rules (deterministic, no model call):
//   - INFLIGHT[sid] active stream → doing  (진행 중)
//   - pinned + has messages       → review (검토 필요)
//   - archived                    → done   (완료)
//   - messages.length === 0       → skipped (empty new session, too noisy)
//   - other active sessions       → inbox  (예정 — work to return to)

async function loadAutoSessionCards(){
  if(!_showAutoSessions){
    _autoSessionCards = [];
    return;
  }
  try{
    let sessions;
    // Prefer the cache populated by sessions.js (avoids extra API call)
    if(typeof _allSessions !== 'undefined' && Array.isArray(_allSessions) && _allSessions.length){
      sessions = _allSessions;
    } else if(typeof window.api === 'function'){
      const data = await window.api('/api/sessions');
      sessions = data && data.sessions || [];
    } else {
      const r = await fetch(new URL('/api/sessions', location.origin).href, {credentials:'include'});
      const data = await r.json();
      sessions = data && data.sessions || [];
    }
    // Map sessions → status. INFLIGHT is a global from messages.js.
    const inflight = (typeof INFLIGHT !== 'undefined') ? INFLIGHT : {};
    _autoSessionCards = sessions
      .filter(s => s && (s.messages_count > 0 || (Array.isArray(s.messages) && s.messages.length > 0)
                                              || s.pinned || s.archived))
      .map(s => {
        let status = 'inbox';
        if(inflight[s.session_id])      status = 'doing';
        else if(s.archived)             status = 'done';
        else if(s.pinned)               status = 'review';
        // else default 'inbox'
        return {
          _kind: 'session',                          // mark as auto card
          id: 'session_' + s.session_id,
          sessionId: s.session_id,
          title: s.title || 'Untitled',
          description: '',
          status,
          priority: s.pinned ? 'high' : 'normal',
          createdAt: (s.created_at || 0) * 1000,
          updatedAt: (s.updated_at || s.created_at || 0) * 1000,
          messageCount: s.messages_count || (Array.isArray(s.messages) ? s.messages.length : 0),
          model: s.model || '',
          profile: s.profile || '',
        };
      });
  }catch(e){
    console.warn('[desk] auto-surface failed:', e.message);
    _autoSessionCards = [];
  }
}

function toggleAutoSessions(){
  _showAutoSessions = !_showAutoSessions;
  if(_showAutoSessions){
    loadAutoSessionCards().then(() => renderDeskBoard());
  } else {
    _autoSessionCards = [];
    renderDeskBoard();
  }
}

// Click a session card → load that session and switch back to chat panel
function openSessionFromCard(sid, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof window.loadSession === 'function'){
    window.loadSession(sid);
  }
  if(typeof window.switchPanel === 'function'){
    window.switchPanel('chat');
  }
}

// Promote an auto session card into a real task (so the user can edit it,
// change priority/status freely without touching the underlying session).
function promoteSessionToTask(sid, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  const card = _autoSessionCards.find(c => c.sessionId === sid);
  if(!card) return;
  const list = _loadDeskTasks();
  // Avoid duplicate promotion
  if(list.find(t => t.sessionId === sid)){
    if(typeof window.showToast === 'function') window.showToast('이미 task 로 등록됨');
    return;
  }
  list.unshift({
    id:          'task_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    title:       card.title,
    description: '세션 #' + sid.slice(0, 8) + ' 에서 promote — 메시지 ' + card.messageCount + '개',
    status:      card.status,
    priority:    card.priority,
    sessionId:   sid,
    createdAt:   Date.now(),
    updatedAt:   null,
  });
  _saveDeskTasks(list);
  renderDeskBoard();
  if(typeof window.showToast === 'function') window.showToast('Task 로 등록됨 — 자유롭게 편집 가능');
}

// ── Phase Desk-3: surface scheduled (cron) jobs as cards ──────────────────
//
// Status mapping (deterministic):
//   - last_status === 'error'            → review (검토 필요, 빨강 보더)
//   - !enabled || state === 'paused'     → done   (완료/일시중지, 회색)
//   - next_run within 24h                → doing  (진행 중, 가까운 실행)
//   - other active scheduled             → inbox  (예정)

async function loadAutoCronCards(){
  if(!_showAutoCrons){
    _autoCronCards = [];
    return;
  }
  try{
    let jobs;
    if(typeof window.api === 'function'){
      const data = await window.api('/api/crons');
      jobs = data && data.jobs || [];
    } else {
      const r = await fetch(new URL('/api/crons', location.origin).href, {credentials:'include'});
      const data = await r.json();
      jobs = data && data.jobs || [];
    }
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    _autoCronCards = jobs.map(j => {
      let status = 'inbox';
      if(j.last_status === 'error')               status = 'review';
      else if(j.enabled === false || j.state === 'paused') status = 'done';
      else if(j.next_run_at && (j.next_run_at - now) < dayMs && j.next_run_at > now) status = 'doing';
      // else 'inbox'
      return {
        _kind: 'cron',
        id: 'cron_' + j.id,
        jobId: j.id,
        title: j.name || '(이름 없음)',
        description: (j.prompt || '').slice(0, 200),
        schedule: j.schedule_display || (j.schedule && j.schedule.expression) || '',
        status,
        priority: j.last_status === 'error' ? 'high' : 'normal',
        deliver: j.deliver || 'local',
        enabled: j.enabled !== false,
        state: j.state || 'active',
        lastStatus: j.last_status || '',
        nextRunAt: j.next_run_at || 0,
        lastRunAt: j.last_run_at || 0,
        createdAt: j.created_at || 0,
        updatedAt: j.last_run_at || j.created_at || 0,
      };
    });
  }catch(e){
    console.warn('[desk] cron surface failed:', e.message);
    _autoCronCards = [];
  }
}

function toggleAutoCrons(){
  _showAutoCrons = !_showAutoCrons;
  if(_showAutoCrons){
    loadAutoCronCards().then(() => renderDeskBoard());
  } else {
    _autoCronCards = [];
    renderDeskBoard();
  }
}

// Quick actions delegate to the existing cron functions on window
// (defined in panels.js). After the action, we refresh.
async function cronCardRun(jobId, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof window.cronRun === 'function'){
    await window.cronRun(jobId);
    setTimeout(() => loadAutoCronCards().then(() => renderDeskBoard()), 500);
  }
}
async function cronCardPause(jobId, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof window.cronPause === 'function'){
    await window.cronPause(jobId);
    setTimeout(() => loadAutoCronCards().then(() => renderDeskBoard()), 300);
  }
}
async function cronCardResume(jobId, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof window.cronResume === 'function'){
    await window.cronResume(jobId);
    setTimeout(() => loadAutoCronCards().then(() => renderDeskBoard()), 300);
  }
}
// Card click → switch to the Tasks (cron) panel and scroll to job
function openCronCard(jobId, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof window.switchPanel === 'function') window.switchPanel('tasks');
  setTimeout(() => {
    const el = document.getElementById('cron-' + jobId);
    if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
  }, 200);
}

function _formatCronTime(ms){
  if(!ms) return '';
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  if(abs < 60_000)        return diff > 0 ? '곧' : '방금';
  if(abs < 3_600_000)     return Math.floor(abs/60_000) + (diff > 0 ? '분 후' : '분 전');
  if(abs < 86_400_000)    return Math.floor(abs/3_600_000) + (diff > 0 ? '시간 후' : '시간 전');
  return Math.floor(abs/86_400_000) + (diff > 0 ? '일 후' : '일 전');
}

function _renderCronCard(c){
  const isPaused = c.state === 'paused' || !c.enabled;
  const isError  = c.lastStatus === 'error';
  const nextLine = c.nextRunAt
    ? `다음 ${_formatCronTime(c.nextRunAt)}`
    : (isPaused ? '일시중지됨' : '예정 없음');
  const deliverIcon = c.deliver === 'telegram' ? '📣' : (c.deliver === 'discord' ? '💬' : '📂');
  return `
    <div class="desk-card desk-cron-card ${isError ? 'cron-error' : ''} ${isPaused ? 'cron-paused' : ''}"
         onclick="openCronCard('${c.jobId}')"
         title="클릭하여 예약 작업 패널에서 열기">
      <div class="desk-card-header">
        <span class="desk-cron-marker" title="자동 surface된 cron 카드">&#9201;</span>
        <div class="desk-card-title">${_escDesk(c.title)}</div>
        <span class="desk-cron-deliver" title="배달 채널: ${_escDesk(c.deliver)}">${deliverIcon}</span>
      </div>
      <div class="desk-card-meta">
        <span>${_escDesk(c.schedule || '스케줄 없음')}</span>
        <span>${nextLine}</span>
      </div>
      <div class="desk-cron-actions">
        ${isPaused
          ? `<button class="desk-cron-btn" onclick="cronCardResume('${c.jobId}', event)" title="재개">▶</button>`
          : `<button class="desk-cron-btn" onclick="cronCardPause('${c.jobId}', event)" title="일시중지">❚❚</button>`}
        <button class="desk-cron-btn run" onclick="cronCardRun('${c.jobId}', event)" title="지금 실행">⟳</button>
      </div>
    </div>`;
}

function _renderSessionCard(c){
  const isInflight = c.status === 'doing';
  const modelLabel = c.model ? c.model.split('/').pop() : '';
  return `
    <div class="desk-card desk-session-card ${isInflight ? 'inflight' : ''}"
         onclick="openSessionFromCard('${c.sessionId}')"
         title="클릭하여 세션 열기">
      <div class="desk-card-header">
        <span class="desk-session-marker" title="자동 surface된 세션 카드">↻</span>
        <div class="desk-card-title">${_escDesk(c.title)}</div>
        <button class="desk-card-promote" onclick="promoteSessionToTask('${c.sessionId}', event)"
                title="Task 로 등록하여 자유롭게 편집">↑</button>
      </div>
      <div class="desk-card-meta">
        <span>${c.messageCount > 0 ? c.messageCount + '개 메시지' : '빈 세션'}${modelLabel ? ' · ' + _escDesk(modelLabel) : ''}</span>
        <span>${_formatTaskTime(c.updatedAt || c.createdAt)}</span>
      </div>
    </div>`;
}

// ── Phase Desk-4: surface Codex orchestrator task records ────────────────
async function loadAutoOrchestratorCards(){
  if(!_showAutoOrchestrator){
    _autoOrchestratorCards = [];
    return;
  }
  try{
    const data = typeof window.api === 'function'
      ? await window.api('/api/orchestrator/tasks?limit=30')
      : await (await fetch(new URL('/api/orchestrator/tasks?limit=30', location.origin).href, {credentials:'include'})).json();
    _autoOrchestratorCards = (data.tasks || []).map(t => {
      let status = 'inbox';
      if(t.status === 'done') status = 'done';
      else if(t.status === 'error' || t.status === 'cancelled') status = 'review';
      else if(t.status === 'running') status = 'doing';
      return {
        _kind: 'orchestrator',
        id: 'orch_' + t.task_id,
        taskId: t.task_id,
        sessionId: t.session_id,
        title: (t.mode ? '[' + t.mode + '] ' : '') + (t.task || 'Codex delegated task'),
        description: (t.assistant_text || '').slice(0, 260),
        status,
        priority: status === 'review' ? 'high' : 'normal',
        profile: t.profile || '',
        model: t.model || '',
        createdAt: (t.created_at || 0) * 1000,
        updatedAt: (t.created_at || 0) * 1000,
      };
    });
  }catch(e){
    console.warn('[desk] orchestrator surface failed:', e.message);
    _autoOrchestratorCards = [];
  }
}

function toggleAutoOrchestrator(){
  _showAutoOrchestrator = !_showAutoOrchestrator;
  if(_showAutoOrchestrator){
    loadAutoOrchestratorCards().then(() => renderDeskBoard());
  } else {
    _autoOrchestratorCards = [];
    renderDeskBoard();
  }
}

function openOrchestratorCard(sessionId, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(sessionId && typeof window.loadSession === 'function') window.loadSession(sessionId);
  if(typeof window.switchPanel === 'function') window.switchPanel('chat');
}

function _renderOrchestratorCard(c){
  return `
    <div class="desk-card desk-orchestrator-card"
         onclick="openOrchestratorCard('${_escDesk(c.sessionId)}', event)"
         title="Codex가 Hermes/Grok에 위임한 작업">
      <div class="desk-card-header">
        <span class="desk-orchestrator-marker" title="Codex delegated run">◇</span>
        <div class="desk-card-title">${_escDesk(c.title)}</div>
      </div>
      <div class="desk-card-meta">
        <span>${_escDesk(c.profile || 'profile')}</span>
        <span>${_formatTaskTime(c.updatedAt || c.createdAt)}</span>
      </div>
      ${c.description ? `<div class="desk-card-desc">${_escDesk(c.description).replace(/\n/g, '<br>')}</div>` : ''}
    </div>`;
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
// Phase Desk-2 — session auto-surface
window.loadAutoSessionCards  = loadAutoSessionCards;
window.toggleAutoSessions    = toggleAutoSessions;
window.openSessionFromCard   = openSessionFromCard;
window.promoteSessionToTask  = promoteSessionToTask;
// Phase Desk-3 — cron auto-surface + quick actions
window.loadAutoCronCards     = loadAutoCronCards;
window.toggleAutoCrons       = toggleAutoCrons;
window.openCronCard          = openCronCard;
window.cronCardRun           = cronCardRun;
window.cronCardPause         = cronCardPause;
window.cronCardResume        = cronCardResume;
// Phase Desk-4 — Codex orchestration records
window.loadAutoOrchestratorCards = loadAutoOrchestratorCards;
window.toggleAutoOrchestrator = toggleAutoOrchestrator;
window.openOrchestratorCard = openOrchestratorCard;
