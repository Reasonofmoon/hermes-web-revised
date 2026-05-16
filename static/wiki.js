// LLM Wiki — profile-aware operating handbook for Codex/Hermes orchestration.

let _llmWikiData = null;
let _llmWikiSlug = 'overview';

async function loadLlmWiki(slug){
  if(slug) _llmWikiSlug = slug;
  const pagesEl = document.getElementById('llmWikiPages');
  const viewEl = document.getElementById('llmWikiView');
  if(!pagesEl || !viewEl) return;
  try{
    const data = await api('/api/llm-wiki?slug=' + encodeURIComponent(_llmWikiSlug));
    _llmWikiData = data;
    _llmWikiSlug = data.active && data.active.slug || _llmWikiSlug;
    pagesEl.innerHTML = (data.pages || []).map(p => `
      <button class="llm-wiki-page ${p.slug === _llmWikiSlug ? 'active' : ''}"
              onclick="loadLlmWiki('${esc(p.slug)}')"
              title="${esc(p.excerpt || '')}">
        <span>${esc(p.title || p.slug)}</span>
        <small>${esc(p.slug)}</small>
      </button>
    `).join('');
    const content = data.active && data.active.content || '';
    viewEl.innerHTML = content ? renderMd(content) : '<div class="memory-empty">아직 내용이 없습니다.</div>';
    closeLlmWikiEdit();
  }catch(e){
    viewEl.innerHTML = `<div style="color:var(--accent);font-size:12px">LLM Wiki 로드 실패: ${esc(e.message)}</div>`;
  }
}

function toggleLlmWikiEdit(){
  const form = document.getElementById('llmWikiEditForm');
  const content = document.getElementById('llmWikiEditContent');
  const slug = document.getElementById('llmWikiEditSlug');
  if(!form || !content || !_llmWikiData) return;
  const active = _llmWikiData.active || {};
  if(slug) slug.textContent = active.slug || _llmWikiSlug;
  content.value = active.content || '';
  form.style.display = form.style.display === 'none' || !form.style.display ? 'block' : 'none';
  if(form.style.display === 'block') content.focus();
}

function closeLlmWikiEdit(){
  const form = document.getElementById('llmWikiEditForm');
  const err = document.getElementById('llmWikiEditError');
  if(form) form.style.display = 'none';
  if(err){ err.style.display = 'none'; err.textContent = ''; }
}

async function submitLlmWikiSave(){
  const content = document.getElementById('llmWikiEditContent');
  const err = document.getElementById('llmWikiEditError');
  if(!content || !_llmWikiData) return;
  const slug = (_llmWikiData.active && _llmWikiData.active.slug) || _llmWikiSlug;
  try{
    await api('/api/llm-wiki/write', {
      method: 'POST',
      body: JSON.stringify({ slug, content: content.value || '' }),
    });
    closeLlmWikiEdit();
    await loadLlmWiki(slug);
    if(typeof showToast === 'function') showToast('LLM Wiki 저장됨');
  }catch(e){
    if(err){ err.textContent = e.message; err.style.display = 'block'; }
  }
}

window.loadLlmWiki = loadLlmWiki;
window.toggleLlmWikiEdit = toggleLlmWikiEdit;
window.closeLlmWikiEdit = closeLlmWikiEdit;
window.submitLlmWikiSave = submitLlmWikiSave;
