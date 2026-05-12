// ────────────────────────────────────────────────────────────────────────────
// Artifact-First Panel — MVP-2
//
// MVP-1: auto-extract (markdown notes, fenced code, [ARTIFACT] markers),
//        per-session localStorage, slide-in panel, preview modal,
//        .md download / clipboard copy / single export.
//
// MVP-2 (this file):
//   • Inline edit mode in preview modal (textarea) with revision history.
//   • Revision history (max 10 per artifact), restore previous versions.
//   • Multi-format export: .md (default), .html, .txt, browser-print (PDF).
//   • Manual "save as artifact" button on every assistant bubble (added
//     by ui.js renderMessages → calls window.saveMsgAsArtifact(button)).
//   • Bidirectional jump: card → original message; message ⊕ → preview.
//   • Search filter at panel top (title + content + snippet).
//
// Storage shape (versioned):
//   localStorage["hermes-artifacts:<session_id>"] = JSON.stringify([
//     {
//       id, type, title, content, language, createdAt, updatedAt,
//       sessionId, messageIndex, _msgKey, _snippet,
//       revisions: [{content, savedAt}, ...]   // newest first, max 10
//     }, ...
//   ])
//
// No backend changes. All data is local.
// ────────────────────────────────────────────────────────────────────────────

const _ART_STORAGE_PREFIX = 'hermes-artifacts:';
const _ART_MIN_NOTE_CHARS = 200;
const _ART_MIN_CODE_LINES = 30;
const _ART_MIN_CODE_CHARS = 200;
const _ART_MAX_TITLE      = 80;
const _ART_MAX_REVISIONS  = 10;

let _currentArtifactId = null;   // currently previewed artifact
let _editMode          = false;  // is the modal in edit mode?
let _searchTerm        = '';     // panel search filter

// ── Storage ─────────────────────────────────────────────────────────────────
function _artStorageKey(sessionId){
  return _ART_STORAGE_PREFIX + (sessionId || 'default');
}
function _loadArtifacts(sessionId){
  try{
    const raw = localStorage.getItem(_artStorageKey(sessionId));
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function _saveArtifacts(sessionId, list){
  try{
    localStorage.setItem(_artStorageKey(sessionId), JSON.stringify(list));
  }catch(e){
    console.warn('[artifacts] save failed:', e.message);
    if(typeof window.showToast === 'function') window.showToast('저장 실패: ' + e.message);
  }
}
function _currentSessionId(){
  return (window.S && window.S.session && window.S.session.session_id) || null;
}
function _getArtifact(id){
  if(!id) return null;
  const sid = _currentSessionId();
  return _loadArtifacts(sid).find(x => x.id === id) || null;
}
function _replaceArtifact(updated){
  const sid = _currentSessionId();
  const list = _loadArtifacts(sid).map(x => x.id === updated.id ? updated : x);
  _saveArtifacts(sid, list);
}

// ── Title / snippet helpers ─────────────────────────────────────────────────
function _extractTitle(text, fallback){
  const lines = (text || '').split('\n');
  for(const ln of lines){
    const m = ln.match(/^#{1,2}\s+(.+?)\s*$/);
    if(m) return m[1].slice(0, _ART_MAX_TITLE);
  }
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

// ── Extraction (unchanged from MVP-1) ───────────────────────────────────────
function extractArtifactsFromText(text){
  if(!text || typeof text !== 'string') return [];
  const found = [];

  // 1. Explicit markers
  const markerRe = /\[ARTIFACT(?:\s+([^\]]*))?\]([\s\S]*?)\[\/ARTIFACT\]/gi;
  let m;
  while((m = markerRe.exec(text)) !== null){
    const attrs = m[1] || '';
    const body  = (m[2] || '').trim();
    if(!body) continue;
    const titleMatch = attrs.match(/title\s*=\s*"([^"]+)"/i) || attrs.match(/title\s*=\s*([^\s]+)/i);
    const typeMatch  = attrs.match(/type\s*=\s*([a-z]+)/i);
    found.push({
      type:     (typeMatch && typeMatch[1].toLowerCase()) || 'marked',
      title:    titleMatch ? titleMatch[1].slice(0, _ART_MAX_TITLE) : _extractTitle(body, '명시 산출물'),
      content:  body,
      language: null
    });
  }

  // 2. Large fenced code blocks
  const codeRe = /```([\w+-]*)\n([\s\S]*?)```/g;
  while((m = codeRe.exec(text)) !== null){
    const lang  = (m[1] || '').trim();
    const code  = m[2] || '';
    const lines = code.split('\n').length;
    if(lines >= _ART_MIN_CODE_LINES || (lang && code.length >= _ART_MIN_CODE_CHARS)){
      const firstLine = code.split('\n').find(l => l.trim()) || '';
      const title = lang
        ? `${lang} · ${firstLine.slice(0, 40)}`
        : firstLine.slice(0, _ART_MAX_TITLE);
      found.push({
        type:     'code',
        title:    title || '코드 블록',
        content:  code,
        language: lang || null
      });
    }
  }

  // 3. Markdown note (whole-message)
  const stripped = text.trim();
  const startsWithH1 = /^#{1,2}\s+\S/.test(stripped);
  const bodyOnly = stripped.replace(/```[\s\S]*?```/g, '');
  if(startsWithH1 && bodyOnly.length >= _ART_MIN_NOTE_CHARS && found.every(f => f.type !== 'marked')){
    found.push({
      type:     'note',
      title:    _extractTitle(stripped, '노트'),
      content:  stripped,
      language: null
    });
  }

  return found;
}

function _newArtifact(item, sessionId, msgKey, messageIndex){
  return {
    id:           'art_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    type:         item.type,
    title:        item.title,
    content:      item.content,
    language:     item.language || null,
    createdAt:    Date.now(),
    updatedAt:    null,
    sessionId,
    messageIndex: (messageIndex != null ? messageIndex : null),
    _msgKey:      msgKey || null,
    _snippet:     _firstSnippet(item.content),
    revisions:    []
  };
}

// Hook called from messages.js after each stream completes.
function extractAndStoreArtifacts(messages, sessionId){
  if(!Array.isArray(messages) || !sessionId) return;
  const existing = _loadArtifacts(sessionId);
  const processedMsgKeys = new Set(existing.map(a => a._msgKey).filter(Boolean));
  let added = 0;

  for(let i = 0; i < messages.length; i++){
    const m = messages[i];
    if(!m || m.role !== 'assistant') continue;
    let text = '';
    if(typeof m.content === 'string') text = m.content;
    else if(Array.isArray(m.content)){
      text = m.content.map(p => (typeof p === 'string' ? p : (p && p.text) || '')).join('\n');
    }
    if(!text || text.length < 50) continue;
    const msgKey = `${sessionId}#${i}:${(m.timestamp || m._ts || 0)}`;
    if(processedMsgKeys.has(msgKey)) continue;

    const items = extractArtifactsFromText(text);
    processedMsgKeys.add(msgKey);
    if(!items.length) continue;
    for(const it of items){
      existing.push(_newArtifact(it, sessionId, msgKey, i));
      added++;
    }
  }

  if(added > 0){
    _saveArtifacts(sessionId, existing);
    renderArtifactPanel();
    updateArtifactCount();
  }
}

// Manual save: extract from a single assistant message bubble.
function saveMsgAsArtifact(btn){
  if(!btn) return;
  const row = btn.closest('.msg-row');
  if(!row){
    if(typeof window.showToast === 'function') window.showToast('메시지를 찾을 수 없습니다');
    return;
  }
  const sid = _currentSessionId();
  if(!sid){
    if(typeof window.showToast === 'function') window.showToast('세션 없음');
    return;
  }
  const msgIdx = parseInt(row.dataset.msgIdx || '-1', 10);
  const rawText = row.dataset.rawText || '';
  if(!rawText){
    if(typeof window.showToast === 'function') window.showToast('빈 메시지');
    return;
  }

  // Try heuristics first
  let items = extractArtifactsFromText(rawText);
  // If no heuristic matched, save the whole message as a "note" anyway
  if(!items.length){
    items = [{
      type:     'note',
      title:    _extractTitle(rawText, '응답 ' + (msgIdx >= 0 ? '#' + msgIdx : '')),
      content:  rawText,
      language: null
    }];
  }

  const existing = _loadArtifacts(sid);
  const msg = (window.S && window.S.messages && window.S.messages[msgIdx]) || {};
  const msgKey = `${sid}#${msgIdx}:${(msg.timestamp || msg._ts || Date.now()/1000)}.manual.${Date.now()}`;
  for(const it of items){
    existing.push(_newArtifact(it, sid, msgKey, msgIdx));
  }
  _saveArtifacts(sid, existing);
  renderArtifactPanel();
  updateArtifactCount();
  if(typeof window.showToast === 'function') window.showToast(`산출물에 저장됨 (${items.length}개)`);
}

// ── Panel UI ────────────────────────────────────────────────────────────────
function toggleArtifactPanel(){
  const panel = document.getElementById('artifactPanel');
  if(!panel) return;
  const isOpen = panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if(isOpen) renderArtifactPanel();
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
  if(diff < 60_000)     return '방금';
  if(diff < 3_600_000)  return Math.floor(diff/60_000) + '분 전';
  if(diff < 86_400_000) return Math.floor(diff/3_600_000) + '시간 전';
  return Math.floor(diff/86_400_000) + '일 전';
}

function _matchesSearch(a, term){
  if(!term) return true;
  const t = term.toLowerCase();
  return ((a.title||'').toLowerCase().includes(t))
      || ((a.content||'').toLowerCase().includes(t))
      || ((a._snippet||'').toLowerCase().includes(t));
}

function setArtifactSearch(term){
  _searchTerm = (term || '').trim();
  renderArtifactPanel();
}

function renderArtifactPanel(){
  const list = document.getElementById('artifactList');
  if(!list) return;
  const sid    = _currentSessionId();
  const allRaw = _loadArtifacts(sid);
  const items  = allRaw.slice().reverse().filter(a => _matchesSearch(a, _searchTerm));

  if(!items.length){
    if(_searchTerm){
      list.innerHTML = `
        <div class="artifact-empty">
          <h4>검색 결과 없음</h4>
          <p>"${escHtml(_searchTerm)}" 와 일치하는 산출물이 없습니다.</p>
          <p><a href="#" onclick="document.getElementById('artifactSearch').value='';setArtifactSearch('');return false">검색 지우기</a></p>
        </div>`;
    } else {
      list.innerHTML = `
        <div class="artifact-empty">
          <h4>아직 산출물이 없습니다</h4>
          <p>대화에서 마크다운 노트(# 제목 + 200자 이상)나
          긴 코드 블록(30줄 이상)이 응답에 포함되면 자동으로 누적됩니다.</p>
          <p style="margin-top:8px;font-size:11px">
          또는 어떤 응답이든 <b>💾</b> 버튼으로 직접 저장할 수 있고,<br>
          명시 마커도 가능합니다:<br>
          <code>[ARTIFACT title="..."]내용[/ARTIFACT]</code></p>
        </div>`;
    }
    return;
  }

  list.innerHTML = items.map(a => {
    const revCount = (a.revisions && a.revisions.length) || 0;
    const updated  = a.updatedAt ? ` · ${_formatRelTime(a.updatedAt)} 수정` : '';
    return `
      <div class="artifact-card" data-id="${a.id}" onclick="previewArtifact('${a.id}')" title="클릭하여 미리보기">
        <div class="artifact-card-title">${_typeIcon(a.type)} ${escHtml(a.title)}</div>
        <div class="artifact-card-meta">
          <span>${_typeLabel(a.type)}${a.language ? ' · ' + escHtml(a.language) : ''}${revCount ? ' · v' + (revCount+1) : ''}</span>
          <span>${_formatRelTime(a.createdAt)}${updated}</span>
        </div>
        ${a._snippet ? `<div class="artifact-card-snippet">${escHtml(a._snippet)}</div>` : ''}
        ${a.messageIndex != null ? `<button class="artifact-card-jump" onclick="event.stopPropagation();jumpToMessage('${a.id}')" title="원본 메시지로 이동">↗ 메시지로</button>` : ''}
      </div>
    `;
  }).join('');
}

function updateArtifactCount(){
  const badge = document.getElementById('artifactCount');
  if(!badge) return;
  const sid = _currentSessionId();
  const count = _loadArtifacts(sid).length;
  badge.textContent = count > 0 ? String(count) : '';
  badge.setAttribute('data-count', String(count));
}

// ── Preview modal (view + edit mode) ────────────────────────────────────────
function previewArtifact(id){
  const a = _getArtifact(id);
  if(!a) return;
  _currentArtifactId = id;
  _editMode = false;
  _renderPreview(a);
  const overlay = document.getElementById('artifactPreviewOverlay');
  if(overlay){
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function _renderPreview(a){
  const titleEl  = document.getElementById('artifactPreviewTitle');
  const bodyEl   = document.getElementById('artifactPreviewBody');
  const revWrap  = document.getElementById('artifactRevisionWrap');
  const editBtn  = document.getElementById('artifactEditBtn');
  const saveBtn  = document.getElementById('artifactSaveEditBtn');
  const cancelBtn= document.getElementById('artifactCancelEditBtn');
  if(!titleEl || !bodyEl) return;

  titleEl.textContent = _typeIcon(a.type) + ' ' + a.title;

  // Revision dropdown
  if(revWrap){
    if(a.revisions && a.revisions.length){
      const opts = a.revisions.map((r, i) =>
        `<option value="${i}">이전 v${a.revisions.length - i} · ${new Date(r.savedAt).toLocaleString()}</option>`
      ).join('');
      revWrap.style.display = 'inline-flex';
      revWrap.innerHTML = `
        <label style="font-size:11px;color:var(--muted);align-self:center">버전:</label>
        <select id="artifactRevisionSelect" onchange="viewArtifactRevision(this.value)">
          <option value="-1" selected>현재 (v${a.revisions.length + 1})</option>
          ${opts}
        </select>`;
    } else {
      revWrap.style.display = 'none';
      revWrap.innerHTML = '';
    }
  }

  if(_editMode){
    // Edit textarea
    bodyEl.innerHTML = `<textarea class="artifact-edit-textarea" id="artifactEditTextarea" spellcheck="false">${escHtml(a.content)}</textarea>`;
    if(editBtn)   editBtn.style.display = 'none';
    if(saveBtn)   saveBtn.style.display = '';
    if(cancelBtn) cancelBtn.style.display = '';
    setTimeout(() => {
      const ta = document.getElementById('artifactEditTextarea');
      if(ta) ta.focus();
    }, 30);
  } else {
    // Render markdown via ui.js renderMd if available
    if(typeof window.renderMd === 'function'){
      bodyEl.innerHTML = window.renderMd(a.content);
    } else {
      bodyEl.innerHTML = '<pre><code>' + escHtml(a.content) + '</code></pre>';
    }
    if(editBtn)   editBtn.style.display = '';
    if(saveBtn)   saveBtn.style.display = 'none';
    if(cancelBtn) cancelBtn.style.display = 'none';
  }
}

function closeArtifactPreview(){
  const overlay = document.getElementById('artifactPreviewOverlay');
  if(!overlay) return;
  if(_editMode){
    if(!confirm('편집 중인 내용이 있습니다. 닫으면 변경사항이 사라집니다. 계속할까요?')) return;
  }
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  _currentArtifactId = null;
  _editMode = false;
}

function enterEditMode(){
  if(!_currentArtifactId) return;
  _editMode = true;
  const a = _getArtifact(_currentArtifactId);
  if(a) _renderPreview(a);
}

function cancelEdit(){
  if(!_currentArtifactId) return;
  _editMode = false;
  const a = _getArtifact(_currentArtifactId);
  if(a) _renderPreview(a);
}

function saveEdit(){
  if(!_currentArtifactId) return;
  const ta = document.getElementById('artifactEditTextarea');
  if(!ta) return;
  const newContent = ta.value;
  const a = _getArtifact(_currentArtifactId);
  if(!a) return;
  if(newContent === a.content){
    _editMode = false;
    _renderPreview(a);
    return;
  }
  // Save current as a revision (newest first), trim to max
  const rev = {content: a.content, savedAt: a.updatedAt || a.createdAt};
  a.revisions = [rev, ...(a.revisions || [])].slice(0, _ART_MAX_REVISIONS);
  a.content   = newContent;
  a.updatedAt = Date.now();
  a._snippet  = _firstSnippet(newContent);
  // Title: if user changed the H1, follow it
  const newTitle = _extractTitle(newContent, a.title);
  if(newTitle && newTitle !== a.title) a.title = newTitle;
  _replaceArtifact(a);
  _editMode = false;
  _renderPreview(a);
  renderArtifactPanel();
  if(typeof window.showToast === 'function') window.showToast('저장됨 · 새 버전 생성');
}

function viewArtifactRevision(idxStr){
  const a = _getArtifact(_currentArtifactId);
  if(!a) return;
  const idx = parseInt(idxStr, 10);
  const bodyEl = document.getElementById('artifactPreviewBody');
  if(!bodyEl) return;
  let content;
  let isPast = false;
  if(idx === -1){
    content = a.content;
  } else if(a.revisions && a.revisions[idx]){
    content = a.revisions[idx].content;
    isPast = true;
  } else {
    return;
  }
  const banner = isPast
    ? `<div class="artifact-rev-banner">이전 버전을 보고 있습니다.
        <button onclick="restoreRevision(${idx})">이 버전으로 되돌리기</button></div>`
    : '';
  if(typeof window.renderMd === 'function'){
    bodyEl.innerHTML = banner + window.renderMd(content);
  } else {
    bodyEl.innerHTML = banner + '<pre><code>' + escHtml(content) + '</code></pre>';
  }
}

function restoreRevision(idx){
  const a = _getArtifact(_currentArtifactId);
  if(!a || !a.revisions || !a.revisions[idx]) return;
  if(!confirm('이 이전 버전으로 되돌릴까요? 현재 버전이 새 revision으로 보존됩니다.')) return;

  const targetContent = a.revisions[idx].content;
  const currentRev    = {content: a.content, savedAt: a.updatedAt || a.createdAt};

  // Build the new revision list: drop the promoted target, prepend the
  // current content as a new revision, cap to MAX.
  const next = a.revisions.slice();
  next.splice(idx, 1);          // remove target (it's now current)
  next.unshift(currentRev);     // current becomes newest revision
  a.revisions = next.slice(0, _ART_MAX_REVISIONS);

  a.content   = targetContent;
  a.updatedAt = Date.now();
  a._snippet  = _firstSnippet(targetContent);

  _replaceArtifact(a);
  _renderPreview(a);
  renderArtifactPanel();
  if(typeof window.showToast === 'function') window.showToast('이전 버전으로 복원됨');
}

// ── Actions: copy / download / export / delete / jump ──────────────────────
function copyArtifact(){
  const a = _getArtifact(_currentArtifactId);
  if(!a) return;
  try{
    navigator.clipboard.writeText(a.content);
    if(typeof window.showToast === 'function') window.showToast('클립보드에 복사됨');
  }catch(e){ console.warn('[artifacts] copy failed:', e.message); }
}

function _safeFilename(title){
  return (title || 'artifact').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
}

function _triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadArtifact(){ exportArtifactAs('md'); }

function exportArtifactAs(format){
  const a = _getArtifact(_currentArtifactId);
  if(!a) return;
  const base = _safeFilename(a.title);
  if(format === 'md'){
    _triggerDownload(new Blob([a.content], {type: 'text/markdown;charset=utf-8'}), base + '.md');
  } else if(format === 'txt'){
    // Strip markdown-ish markers for plain text
    const txt = a.content.replace(/^#{1,6}\s+/gm, '').replace(/```[\w-]*\n?/g, '').replace(/```/g, '').replace(/[*_`]/g, '');
    _triggerDownload(new Blob([txt], {type: 'text/plain;charset=utf-8'}), base + '.txt');
  } else if(format === 'html'){
    const body = typeof window.renderMd === 'function' ? window.renderMd(a.content) : ('<pre>' + escHtml(a.content) + '</pre>');
    const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${escHtml(a.title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;color:#222}
  h1,h2,h3{line-height:1.3} pre{background:#f5f5f7;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px}
  code{background:#f5f5f7;padding:2px 4px;border-radius:3px;font-size:.9em}
  blockquote{border-left:3px solid #ddd;margin:0;padding-left:14px;color:#666}
  hr{border:none;border-top:1px solid #eee;margin:24px 0}
</style></head>
<body><h1>${escHtml(a.title)}</h1>
<p style="color:#999;font-size:12px">생성: ${new Date(a.createdAt).toISOString()}${a.updatedAt ? ' · 최종 수정: ' + new Date(a.updatedAt).toISOString() : ''}</p>
<hr>
${body}
</body></html>`;
    _triggerDownload(new Blob([html], {type: 'text/html;charset=utf-8'}), base + '.html');
  } else if(format === 'print'){
    _openPrintWindow(a);
  }
}

function _openPrintWindow(a){
  const body = typeof window.renderMd === 'function' ? window.renderMd(a.content) : ('<pre>' + escHtml(a.content) + '</pre>');
  const w = window.open('', '_blank', 'width=820,height=900');
  if(!w){
    if(typeof window.showToast === 'function') window.showToast('팝업이 차단되었습니다. 허용 후 다시 시도해주세요.');
    return;
  }
  w.document.write(`<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${escHtml(a.title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.6;color:#222}
  h1,h2,h3{line-height:1.3} pre{background:#f5f5f7;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px;page-break-inside:avoid}
  code{background:#f5f5f7;padding:2px 4px;border-radius:3px;font-size:.9em}
  blockquote{border-left:3px solid #ddd;margin:0;padding-left:14px;color:#666}
  hr{border:none;border-top:1px solid #eee;margin:24px 0}
  @page{margin:18mm} @media print{ body{margin:0} }
</style></head>
<body>
<h1>${escHtml(a.title)}</h1>
<p style="color:#999;font-size:12px">${new Date(a.createdAt).toLocaleString()}${a.updatedAt ? ' · 수정 ' + new Date(a.updatedAt).toLocaleString() : ''}</p>
<hr>
${body}
<script>setTimeout(() => window.print(), 250);<\/script>
</body></html>`);
  w.document.close();
}

function deleteCurrentArtifact(){
  if(!_currentArtifactId) return;
  if(!confirm('이 산출물을 삭제할까요? (다른 위치에 저장되지 않으면 복구할 수 없습니다)')) return;
  const sid = _currentSessionId();
  const next = _loadArtifacts(sid).filter(x => x.id !== _currentArtifactId);
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
    const header = `# ${a.title}\n\n*${_typeLabel(a.type)} · ${new Date(a.createdAt).toISOString()}${a.updatedAt ? ' · 수정: ' + new Date(a.updatedAt).toISOString() : ''}*\n\n`;
    return header + a.content + '\n\n---\n';
  }).join('\n');
  _triggerDownload(new Blob([md], {type: 'text/markdown;charset=utf-8'}), `hermes-artifacts-${new Date().toISOString().slice(0,10)}.md`);
}

// ── Bidirectional jump ─────────────────────────────────────────────────────
function jumpToMessage(artifactId){
  const a = _getArtifact(artifactId);
  if(!a || a.messageIndex == null) return;
  closeArtifactPreview();
  // Close panel for visibility
  const panel = document.getElementById('artifactPanel');
  if(panel && panel.classList.contains('open')) toggleArtifactPanel();
  // Find the message row
  setTimeout(() => {
    const row = document.querySelector(`.msg-row[data-msg-idx="${a.messageIndex}"]`);
    if(!row){
      if(typeof window.showToast === 'function') window.showToast('원본 메시지를 찾을 수 없습니다 (세션이 다를 수도 있음)');
      return;
    }
    row.scrollIntoView({behavior: 'smooth', block: 'center'});
    row.classList.add('msg-flash');
    setTimeout(() => row.classList.remove('msg-flash'), 1600);
  }, 280);
}

// ── Utility ─────────────────────────────────────────────────────────────────
function escHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ── Init ────────────────────────────────────────────────────────────────────
function _initArtifacts(){
  updateArtifactCount();

  // Wire up search input (will exist in updated index.html)
  const search = document.getElementById('artifactSearch');
  if(search){
    search.addEventListener('input', e => setArtifactSearch(e.target.value));
  }

  // ESC closes modal
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

// ── Global exposure ────────────────────────────────────────────────────────
window.extractAndStoreArtifacts = extractAndStoreArtifacts;
window.toggleArtifactPanel      = toggleArtifactPanel;
window.previewArtifact          = previewArtifact;
window.closeArtifactPreview     = closeArtifactPreview;
window.copyArtifact             = copyArtifact;
window.downloadArtifact         = downloadArtifact;
window.exportArtifactAs         = exportArtifactAs;
window.deleteCurrentArtifact    = deleteCurrentArtifact;
window.exportAllArtifacts       = exportAllArtifacts;
window.renderArtifactPanel      = renderArtifactPanel;
window.updateArtifactCount      = updateArtifactCount;
window.saveMsgAsArtifact        = saveMsgAsArtifact;
window.enterEditMode            = enterEditMode;
window.cancelEdit               = cancelEdit;
window.saveEdit                 = saveEdit;
window.viewArtifactRevision     = viewArtifactRevision;
window.restoreRevision          = restoreRevision;
window.jumpToMessage            = jumpToMessage;
window.setArtifactSearch        = setArtifactSearch;
