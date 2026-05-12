// ────────────────────────────────────────────────────────────────────────────
// Artifact-First Panel (MVP-1, frontend-only)
//
// Extracts notable outputs (markdown notes, large code blocks, [ARTIFACT]-tagged
// content) from assistant responses and accumulates them in a per-session
// localStorage gallery. The user opens a slide-in side panel from the topbar.
//
// Heuristics for auto-extraction (any one is enough):
//   1. Explicit marker: response contains [ARTIFACT] ... [/ARTIFACT] or
//      [ARTIFACT type=note title="..."] start tag.
//   2. Markdown note: starts with "# Title" + body ≥ 200 chars.
//   3. Large code block: a fenced ``` block with ≥ 30 lines OR an explicit
//      language tag and ≥ 200 chars.
//
// Storage: localStorage key "hermes-artifacts:<session_id>" → JSON array.
// Each artifact: {id, type, title, content, language, createdAt, sessionId}.
//
// No backend changes. Reset by clearing localStorage or via the panel UI.
// ────────────────────────────────────────────────────────────────────────────

const _ART_STORAGE_PREFIX = 'hermes-artifacts:';
const _ART_MIN_NOTE_CHARS = 200;
const _ART_MIN_CODE_LINES = 30;
const _ART_MIN_CODE_CHARS = 200;
const _ART_MAX_TITLE = 80;

let _currentArtifactId = null;  // currently previewed artifact

// ── Storage helpers ─────────────────────────────────────────────────────────
function _artStorageKey(sessionId){
  return _ART_STORAGE_PREFIX + (sessionId || 'default');
}

function _loadArtifacts(sessionId){
  try{
    const raw = localStorage.getItem(_artStorageKey(sessionId));
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){
    return [];
  }
}

function _saveArtifacts(sessionId, list){
  try{
    localStorage.setItem(_artStorageKey(sessionId), JSON.stringify(list));
  }catch(e){
    console.warn('[artifacts] save failed:', e.message);
  }
}

function _currentSessionId(){
  return (window.S && window.S.session && window.S.session.session_id) || null;
}

// ── Extraction ──────────────────────────────────────────────────────────────

// Try to pull a title from text. Falls back to first non-empty line truncated.
function _extractTitle(text, fallback){
  const lines = (text || '').split('\n');
  // Markdown H1/H2 first
  for(const ln of lines){
    const m = ln.match(/^#{1,2}\s+(.+?)\s*$/);
    if(m) return m[1].slice(0, _ART_MAX_TITLE);
  }
  // First non-empty line
  for(const ln of lines){
    const t = ln.trim();
    if(t) return t.slice(0, _ART_MAX_TITLE);
  }
  return fallback || '제목 없음';
}

function _firstSnippet(text, maxLen=120){
  const t = (text || '').replace(/```[\s\S]*?```/g, '').replace(/[#*`]/g, '').trim();
  return t.slice(0, maxLen);
}

// Extract artifacts from a single assistant message content string.
// Returns an array of {type, title, content, language}.
function extractArtifactsFromText(text){
  if(!text || typeof text !== 'string') return [];
  const found = [];

  // 1. Explicit [ARTIFACT] ... [/ARTIFACT] markers (case-insensitive)
  const markerRe = /\[ARTIFACT(?:\s+([^\]]*))?\]([\s\S]*?)\[\/ARTIFACT\]/gi;
  let m;
  while((m = markerRe.exec(text)) !== null){
    const attrs = m[1] || '';
    const body = (m[2] || '').trim();
    if(!body) continue;
    const titleMatch = attrs.match(/title\s*=\s*"([^"]+)"/i)
                    || attrs.match(/title\s*=\s*([^\s]+)/i);
    const typeMatch  = attrs.match(/type\s*=\s*([a-z]+)/i);
    found.push({
      type: (typeMatch && typeMatch[1].toLowerCase()) || 'marked',
      title: titleMatch ? titleMatch[1].slice(0, _ART_MAX_TITLE) : _extractTitle(body, '명시 산출물'),
      content: body,
      language: null
    });
  }

  // 2. Large fenced code blocks
  const codeRe = /```([\w+-]*)\n([\s\S]*?)```/g;
  while((m = codeRe.exec(text)) !== null){
    const lang = (m[1] || '').trim();
    const code = m[2] || '';
    const lineCount = code.split('\n').length;
    if(lineCount >= _ART_MIN_CODE_LINES || (lang && code.length >= _ART_MIN_CODE_CHARS)){
      const firstLine = code.split('\n').find(l => l.trim()) || '';
      const title = lang
        ? `${lang} · ${firstLine.slice(0, 40)}`
        : firstLine.slice(0, _ART_MAX_TITLE);
      found.push({
        type: 'code',
        title: title || '코드 블록',
        content: code,
        language: lang || null
      });
    }
  }

  // 3. Markdown note (whole-message): "# Title" near top + body ≥ 200 chars
  // Only if no explicit marker covered it.
  const stripped = text.trim();
  const startsWithH1 = /^#{1,2}\s+\S/.test(stripped);
  const bodyOnly = stripped.replace(/```[\s\S]*?```/g, '');
  if(startsWithH1 && bodyOnly.length >= _ART_MIN_NOTE_CHARS && found.every(f => f.type !== 'marked')){
    found.push({
      type: 'note',
      title: _extractTitle(stripped, '노트'),
      content: stripped,
      language: null
    });
  }

  return found;
}

// Hook called from messages.js after a stream completes.
// Walks the *new* assistant messages (those not yet processed for this session)
// and extracts artifacts. Stores them in localStorage. Re-renders panel.
function extractAndStoreArtifacts(messages, sessionId){
  if(!Array.isArray(messages) || !sessionId) return;
  const existing = _loadArtifacts(sessionId);
  const processedMsgKeys = new Set(existing.map(a => a._msgKey).filter(Boolean));
  let added = 0;

  for(let i = 0; i < messages.length; i++){
    const m = messages[i];
    if(!m || m.role !== 'assistant') continue;
    // Stringify content (could be string or array of parts)
    let text = '';
    if(typeof m.content === 'string') text = m.content;
    else if(Array.isArray(m.content)){
      text = m.content.map(p => (typeof p === 'string' ? p : (p && p.text) || '')).join('\n');
    }
    if(!text || text.length < 50) continue;
    const msgKey = `${sessionId}#${i}:${(m.timestamp || m._ts || 0)}`;
    if(processedMsgKeys.has(msgKey)) continue;

    const items = extractArtifactsFromText(text);
    if(!items.length){
      // Still mark the message as processed so we don't keep re-scanning
      processedMsgKeys.add(msgKey);
      continue;
    }
    for(const it of items){
      existing.push({
        id: 'art_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
        type: it.type,
        title: it.title,
        content: it.content,
        language: it.language || null,
        createdAt: Date.now(),
        sessionId,
        _msgKey: msgKey,
        _snippet: _firstSnippet(it.content)
      });
      added++;
    }
    processedMsgKeys.add(msgKey);
  }

  if(added > 0){
    _saveArtifacts(sessionId, existing);
    renderArtifactPanel();
    updateArtifactCount();
  }
}

// ── Panel UI ────────────────────────────────────────────────────────────────
function toggleArtifactPanel(){
  const panel = document.getElementById('artifactPanel');
  if(!panel) return;
  const isOpen = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if(isOpen){
    renderArtifactPanel();
  }
}

function _typeIcon(type){
  if(type === 'note')   return '📝';
  if(type === 'code')   return '💻';
  if(type === 'marked') return '🏷️';
  return '📄';
}

function _typeLabel(type){
  if(type === 'note')   return '노트';
  if(type === 'code')   return '코드';
  if(type === 'marked') return '명시';
  return '기타';
}

function _formatRelTime(ts){
  if(!ts) return '';
  const diff = Date.now() - ts;
  if(diff < 60_000)        return '방금';
  if(diff < 3_600_000)     return Math.floor(diff/60_000) + '분 전';
  if(diff < 86_400_000)    return Math.floor(diff/3_600_000) + '시간 전';
  return Math.floor(diff/86_400_000) + '일 전';
}

function renderArtifactPanel(){
  const list = document.getElementById('artifactList');
  if(!list) return;
  const sid = _currentSessionId();
  const items = _loadArtifacts(sid).slice().reverse();  // newest first

  if(!items.length){
    list.innerHTML = `
      <div class="artifact-empty">
        <h4>아직 산출물이 없습니다</h4>
        <p>대화에서 마크다운 노트(# 제목 + 200자 이상)나
        긴 코드 블록(30줄 이상)이 응답에 포함되면 자동으로 여기에 누적됩니다.</p>
        <p style="margin-top:8px;font-size:11px">
        명시적으로 보존하려면 응답 안에<br>
        <code>[ARTIFACT title="..."]내용[/ARTIFACT]</code> 마커를 쓰세요.</p>
      </div>`;
    return;
  }

  list.innerHTML = items.map(a => `
    <div class="artifact-card" data-id="${a.id}" onclick="previewArtifact('${a.id}')" title="클릭하여 미리보기">
      <div class="artifact-card-title">${_typeIcon(a.type)} ${escHtml(a.title)}</div>
      <div class="artifact-card-meta">
        <span>${_typeLabel(a.type)}${a.language ? ' · ' + escHtml(a.language) : ''}</span>
        <span>${_formatRelTime(a.createdAt)}</span>
      </div>
      ${a._snippet ? `<div class="artifact-card-snippet">${escHtml(a._snippet)}</div>` : ''}
    </div>
  `).join('');
}

function updateArtifactCount(){
  const badge = document.getElementById('artifactCount');
  if(!badge) return;
  const sid = _currentSessionId();
  const count = _loadArtifacts(sid).length;
  badge.textContent = count > 0 ? String(count) : '';
  badge.setAttribute('data-count', String(count));
}

// ── Preview modal ──────────────────────────────────────────────────────────
function previewArtifact(id){
  const sid = _currentSessionId();
  const list = _loadArtifacts(sid);
  const a = list.find(x => x.id === id);
  if(!a) return;
  _currentArtifactId = id;

  const overlay = document.getElementById('artifactPreviewOverlay');
  const titleEl = document.getElementById('artifactPreviewTitle');
  const bodyEl  = document.getElementById('artifactPreviewBody');
  if(!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = _typeIcon(a.type) + ' ' + a.title;

  // Render content: use renderMd() if available (defined in ui.js)
  if(typeof window.renderMd === 'function'){
    bodyEl.innerHTML = window.renderMd(a.content);
  } else {
    bodyEl.innerHTML = '<pre><code>' + escHtml(a.content) + '</code></pre>';
  }

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeArtifactPreview(){
  const overlay = document.getElementById('artifactPreviewOverlay');
  if(!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  _currentArtifactId = null;
}

function copyArtifact(){
  if(!_currentArtifactId) return;
  const sid = _currentSessionId();
  const a = _loadArtifacts(sid).find(x => x.id === _currentArtifactId);
  if(!a) return;
  try{
    navigator.clipboard.writeText(a.content);
    if(typeof window.showToast === 'function') window.showToast('클립보드에 복사됨');
  }catch(e){
    console.warn('[artifacts] copy failed:', e.message);
  }
}

function downloadArtifact(){
  if(!_currentArtifactId) return;
  const sid = _currentSessionId();
  const a = _loadArtifacts(sid).find(x => x.id === _currentArtifactId);
  if(!a) return;
  const safeTitle = (a.title || 'artifact').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
  const ext = a.type === 'code' && a.language ? a.language : 'md';
  const filename = `${safeTitle}.${ext}`;
  const blob = new Blob([a.content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function deleteCurrentArtifact(){
  if(!_currentArtifactId) return;
  if(!confirm('이 산출물을 삭제할까요? (다른 위치에 저장되지 않으면 복구할 수 없습니다)')) return;
  const sid = _currentSessionId();
  const list = _loadArtifacts(sid);
  const next = list.filter(x => x.id !== _currentArtifactId);
  _saveArtifacts(sid, next);
  closeArtifactPreview();
  renderArtifactPanel();
  updateArtifactCount();
}

function exportAllArtifacts(){
  const sid = _currentSessionId();
  const items = _loadArtifacts(sid);
  if(!items.length){
    if(typeof window.showToast === 'function') window.showToast('산출물이 없습니다');
    return;
  }
  const md = items.slice().reverse().map(a => {
    const header = `# ${a.title}\n\n*${_typeLabel(a.type)} · ${new Date(a.createdAt).toISOString()}*\n\n`;
    return header + a.content + '\n\n---\n';
  }).join('\n');
  const blob = new Blob([md], {type: 'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `hermes-artifacts-${stamp}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Utility: HTML-escape (independent of ui.js esc which may not be loaded yet)
function escHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ── Init ────────────────────────────────────────────────────────────────────
// Render panel + badge once DOM is ready and the rest of the app has booted.
function _initArtifacts(){
  updateArtifactCount();
  // ESC key closes the preview modal
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      const overlay = document.getElementById('artifactPreviewOverlay');
      if(overlay && overlay.classList.contains('open')) closeArtifactPreview();
    }
  });
  // Click outside modal closes it
  const overlay = document.getElementById('artifactPreviewOverlay');
  if(overlay){
    overlay.addEventListener('click', e => {
      if(e.target === overlay) closeArtifactPreview();
    });
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _initArtifacts);
} else {
  _initArtifacts();
}

// Expose to global so messages.js + inline onclick handlers can call.
window.extractAndStoreArtifacts = extractAndStoreArtifacts;
window.toggleArtifactPanel      = toggleArtifactPanel;
window.previewArtifact          = previewArtifact;
window.closeArtifactPreview     = closeArtifactPreview;
window.copyArtifact             = copyArtifact;
window.downloadArtifact         = downloadArtifact;
window.deleteCurrentArtifact    = deleteCurrentArtifact;
window.exportAllArtifacts       = exportAllArtifacts;
window.renderArtifactPanel      = renderArtifactPanel;
window.updateArtifactCount      = updateArtifactCount;
