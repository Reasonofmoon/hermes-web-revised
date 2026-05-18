// Image prompt templates imported from Reasonofmoon/image-prompt-gen-templator
// and Reasonofmoon/image-prompt-builder.

const IMAGE_PROMPT_TEMPLATES = [
  {
    id: 'builder-custom',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: Custom Build',
    aspect: 'landscape',
    prompt: '[Purpose] [PURPOSE]\n\n[Core brief] [BRIEF]\n\n[Required elements] [REQUIRED_ELEMENTS]\n\n[Context / environment] [CONTEXT]\n\n[Style / rendering] [STYLE]\n\n[Composition / framing] [COMPOSITION]\n\n[Light / material / color] [LIGHTING]\n\n[Layout / spatial relationships] [LAYOUT]\n\n[Text rules] [TEXT_RULES]\n\n[Constraints / bans / fixed details] no watermark, no unwanted logo, no extra text unless requested\n\n[Output] high quality',
  },
  {
    id: 'readmaster-seedling',
    source: 'image-prompt-gen-templator',
    category: 'Character',
    title: 'Read Master Seedling',
    aspect: 'portrait',
    prompt: 'girl young child age 8 character, wearing navy academy uniform with red bow tie, curious expression, reading-book pose, in library, soft-natural lighting, watercolor style, 85mm portrait lens, seed 42 --no text, watermark, extra fingers, low quality, deformed hands',
  },
  {
    id: 'readmaster-explorer',
    source: 'image-prompt-gen-templator',
    category: 'Character',
    title: 'Read Master Explorer',
    aspect: 'portrait',
    prompt: 'girl preteen age 11 character, wearing navy academy uniform with red bow tie, focused expression, adventuring pose, in starlit-forest, volumetric lighting, studio-ghibli style, 35mm environmental lens, seed 42 --no text, watermark, extra fingers, low quality, deformed hands',
  },
  {
    id: 'readmaster-voyager',
    source: 'image-prompt-gen-templator',
    category: 'Character',
    title: 'Read Master Voyager',
    aspect: 'portrait',
    prompt: 'teenager age 14 girl character, wearing navy academy uniform with red bow tie, confident expression, teaching pose, in starship-cabin, magical-glow lighting, pixar-3d style, 85mm portrait lens, seed 42 --no text, watermark, extra fingers, low quality, deformed hands',
  },
  {
    id: 'notebook-minimal',
    source: 'image-prompt-gen-templator',
    category: 'Infographic',
    title: 'NotebookLM Minimal Card',
    aspect: 'portrait',
    prompt: 'educational infographic about "[TOPIC]" for middle school students, Korean labels, single-focus layout, A4 portrait, flat-design illustrations, pastel palette, bold-sans-serif typography, icon-based visualization, minimal complexity, seed 101 --no photorealistic, cluttered, gibberish text, blurry',
  },
  {
    id: 'notebook-moderate',
    source: 'image-prompt-gen-templator',
    category: 'Infographic',
    title: 'NotebookLM Study Sheet',
    aspect: 'portrait',
    prompt: 'educational infographic about "[TOPIC]" for middle school students, Korean labels, grid-4 layout, A4 portrait, flat-design illustrations, education palette, bold-sans-serif typography, chart-heavy visualization, moderate complexity, seed 101 --no photorealistic, cluttered, gibberish text, blurry',
  },
  {
    id: 'notebook-detailed',
    source: 'image-prompt-gen-templator',
    category: 'Infographic',
    title: 'NotebookLM Detailed Poster',
    aspect: 'portrait',
    prompt: 'educational infographic about "[TOPIC]" for high school students, Korean labels, vertical-scroll layout, A4 portrait, flat-design illustrations, corporate palette, bold-sans-serif typography, statistical visualization, detailed complexity, seed 101 --no photorealistic, cluttered, gibberish text, blurry',
  },
  {
    id: 'nexus-stellar',
    source: 'image-prompt-gen-templator',
    category: 'Cinematic',
    title: 'Nexus STELLAR',
    aspect: 'landscape',
    prompt: '[SUBJECT], wide shot, transcendent-awe mood, volumetric-god-rays lighting, wide-cosmic-vista, stellar-cyan palette, painterly-brushstrokes, 35mm environmental, 16:9 cinematic, seed 777 --no text, watermark, extra fingers, low quality, flat lighting',
  },
  {
    id: 'nexus-sovereign',
    source: 'image-prompt-gen-templator',
    category: 'Cinematic',
    title: 'Nexus SOVEREIGN',
    aspect: 'portrait',
    prompt: '[SUBJECT], medium shot, commanding-regal mood, rim-light-gold lighting, hero-shot-portrait, sovereign-gold palette, hyperreal-render, 85mm bokeh, 4:5 portrait, seed 777 --no text, watermark, extra fingers, low quality, flat lighting',
  },
  {
    id: 'nexus-arcana',
    source: 'image-prompt-gen-templator',
    category: 'Cinematic',
    title: 'Nexus ARCANA',
    aspect: 'landscape',
    prompt: '[SUBJECT], medium shot, enigmatic-mystical mood, magical-glow lighting, dutch-angle-tilt, arcana-violet palette, painterly-brushstrokes, 85mm bokeh, 16:9 cinematic, seed 777 --no text, watermark, extra fingers, low quality, flat lighting',
  },
  {
    id: 'panel-webtoon',
    source: 'image-prompt-gen-templator',
    category: 'Comic',
    title: 'Panel Architect Webtoon',
    aspect: 'portrait',
    prompt: '[SUBJECT], setup rising climax resolution, korean webtoon vertical, clean digital ink, soft cel-shaded palette, 4-panel grid (2x2 grid), wide to close pacing, no text, pure visual, 9:16 vertical webtoon, seed 808 --no blurry text, inconsistent character, cut-off panels, low detail',
  },
  {
    id: 'panel-noir',
    source: 'image-prompt-gen-templator',
    category: 'Comic',
    title: 'Panel Architect Noir',
    aspect: 'landscape',
    prompt: '[SUBJECT], conflict then resolution, noir high-contrast ink, heavy shadow blocks, monochrome black-white palette, 4-panel grid (2x2 grid), dynamic action angles, no text, pure visual, 16:9 landscape page, seed 808 --no blurry text, inconsistent character, cut-off panels, low detail',
  },
  {
    id: 'builder-cinematic',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: Cinematic Poster',
    aspect: 'landscape',
    prompt: '[Purpose] Cinematic movie poster\n\n[Core brief] [BRIEF]\n\n[Required elements] [REQUIRED_ELEMENTS]\n\n[Context / environment] [CONTEXT]\n\n[Style / rendering] 35mm film still, anamorphic lens, shallow depth of field, photorealistic\n\n[Composition / framing] [COMPOSITION]\n\n[Light / material / color] [LIGHTING]\n\n[Text rules] No text in image\n\n[Constraints / bans / fixed details] no watermark, no extra people, no plastic skin, no airbrushing',
  },
  {
    id: 'builder-product',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: Product Shot',
    aspect: 'square',
    prompt: '[Purpose] Catalog product shot\n\n[Core brief] [PRODUCT]\n\n[Required elements] [REQUIRED_ELEMENTS]\n\n[Style / rendering] Studio lighting, macro lens, commercial photography\n\n[Composition / framing] Product isolated in center, hero angle\n\n[Light / material / color] Softbox lighting, clean reflections, neutral background\n\n[Constraints / bans / fixed details] no watermark, brand-safe, clean edges',
  },
  {
    id: 'builder-ui',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: UI Mockup',
    aspect: 'landscape',
    prompt: '[Purpose] UI Mockup for mobile app\n\n[Core brief] [APP_OR_SCREEN]\n\n[Required elements] [MODULES]\n\n[Style / rendering] Clean vector style, flat design, modern SaaS aesthetic\n\n[Layout / spatial relationships] Screen hierarchy, readable modules, balanced negative space\n\n[Text rules] Use realistic but minimal UI text only where necessary\n\n[Constraints / bans / fixed details] no decorative clutter, no watermarks, realistic UI patterns',
  },
  {
    id: 'builder-infographic',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: Infographic',
    aspect: 'portrait',
    prompt: '[Purpose] Educational infographic\n\n[Core brief] [TOPIC]\n\n[Required elements] [KEY_POINTS]\n\n[Style / rendering] Simplified vector illustrations, clear visual hierarchy\n\n[Layout / spatial relationships] Labeled modules, arrows for reading order, balanced spacing\n\n[Text rules] Legible sans-serif font for labels\n\n[Constraints / bans / fixed details] no decorative clutter, accurate proportions',
  },
  {
    id: 'builder-kakao-emoticon',
    source: 'image-prompt-builder',
    category: 'Prompt Builder',
    title: 'Prompt Builder: Kakao Emoticon',
    aspect: 'square',
    prompt: '[Purpose] KakaoTalk emoticon sticker set concept\n\n[Core brief] [CHARACTER] expressing [EMOTION]\n\n[Required elements] cute mascot character, clear silhouette, expressive face, simple pose, sticker-ready composition\n\n[Context / environment] transparent or plain background, Korean messenger emoticon mood\n\n[Style / rendering] clean digital illustration, soft cel shading, rounded shapes, high readability at small size\n\n[Composition / framing] centered full-body character, generous padding, no cropped limbs\n\n[Light / material / color] warm friendly palette, subtle highlights, crisp outline\n\n[Text rules] no readable text unless specifically requested\n\n[Constraints / bans / fixed details] no watermark, no logo, no cluttered background, no extra characters, no malformed hands\n\n[Output] 1:1 square sticker image',
  },
];

function imageTemplateInstruction(template) {
  return [
    '반드시 image_generate 도구를 호출해 실제 이미지를 생성하라.',
    `템플릿: ${template.title} (${template.source})`,
    `Prompt:\n${template.prompt}`,
    `aspect_ratio: ${template.aspect}`,
    '생성 결과의 URL 또는 파일 경로를 짧게 보고하라.',
  ].join('\n\n');
}

function ensureImageTemplatePicker() {
  let modal = document.getElementById('imageTemplateModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'imageTemplateModal';
  modal.className = 'image-template-modal';
  modal.innerHTML = `
    <div class="image-template-dialog">
      <div class="image-template-head">
        <div>
          <div class="image-template-title">Grok Imagine Studio</div>
          <div class="image-template-subtitle">xai-oauth · grok-imagine-image-quality · grok-imagine-video</div>
        </div>
        <button class="image-template-close" onclick="closeImageTemplatePicker()" aria-label="닫기">&times;</button>
      </div>
      <div class="image-template-toolbar">
        <div class="image-template-mode" role="group" aria-label="생성 모드">
          <button id="imagineModeImage" class="active" onclick="setImagineMode('image')">Image</button>
          <button id="imagineModeVideo" onclick="setImagineMode('video')">Video</button>
        </div>
        <input id="imageTemplateSearch" type="search" placeholder="템플릿 검색..." oninput="renderImageTemplateList()">
        <select id="imageTemplateCategory" onchange="renderImageTemplateList()">
          <option value="">전체</option>
        </select>
        <select id="imageTemplateSelect" onchange="selectImageTemplate(this.value)"></select>
      </div>
      <div class="image-template-body">
        <div class="image-template-list" id="imageTemplateList"></div>
        <div class="image-template-preview">
          <div class="image-template-preview-title" id="imageTemplatePreviewTitle"></div>
          <textarea id="imageTemplatePreviewText"></textarea>
          <div class="image-template-controls">
            <label>Aspect <select id="imagineAspect"><option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="4:3">4:3</option><option value="3:4">3:4</option></select></label>
            <label>Resolution <select id="imagineResolution"><option value="1k">1k</option><option value="2k">2k</option><option value="720p">720p</option><option value="480p">480p</option></select></label>
            <label>Duration <input id="imagineDuration" type="number" min="1" max="15" value="5"></label>
          </div>
          <div class="image-template-actions">
            <button onclick="insertSelectedImageTemplate(false)">입력창에 넣기</button>
            <button class="primary" onclick="insertSelectedImageTemplate(true)">넣고 바로 전송</button>
            <button class="primary" id="btnImagineGenerate" onclick="generateImagineFromTemplate()">Generate</button>
          </div>
          <div class="image-template-result" id="imageTemplateResult"></div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const category = document.getElementById('imageTemplateCategory');
  [...new Set(IMAGE_PROMPT_TEMPLATES.map((t) => t.category))].sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    category.appendChild(opt);
  });
  return modal;
}

let selectedImageTemplateId = IMAGE_PROMPT_TEMPLATES[0].id;
let imagineMode = 'image';

function aspectValue(template) {
  const aspect = template?.aspect || 'square';
  if (aspect === 'landscape') return '16:9';
  if (aspect === 'portrait') return '9:16';
  if (aspect === 'square') return '1:1';
  return aspect;
}

function openImageTemplatePicker() {
  const modal = ensureImageTemplatePicker();
  modal.classList.add('open');
  renderImageTemplateList();
}

function closeImageTemplatePicker() {
  const modal = document.getElementById('imageTemplateModal');
  if (modal) modal.classList.remove('open');
}

function renderImageTemplateList() {
  const list = document.getElementById('imageTemplateList');
  if (!list) return;
  const search = (document.getElementById('imageTemplateSearch')?.value || '').trim().toLowerCase();
  const category = document.getElementById('imageTemplateCategory')?.value || '';
  const filtered = IMAGE_PROMPT_TEMPLATES.filter((t) => {
    const haystack = `${t.title} ${t.source} ${t.category} ${t.prompt}`.toLowerCase();
    return (!category || t.category === category) && (!search || haystack.includes(search));
  });
  if (!filtered.some((t) => t.id === selectedImageTemplateId) && filtered[0]) {
    selectedImageTemplateId = filtered[0].id;
  }
  list.innerHTML = filtered.map((t) => `
    <button class="image-template-item ${t.id === selectedImageTemplateId ? 'active' : ''}" onclick="selectImageTemplate('${t.id}')">
      <span>${esc(t.title)}</span>
      <small>${esc(t.category)} · ${esc(t.aspect)} · ${esc(t.source)}</small>
    </button>
  `).join('');
  const dropdown = document.getElementById('imageTemplateSelect');
  if (dropdown) {
    dropdown.innerHTML = IMAGE_PROMPT_TEMPLATES.map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');
    dropdown.value = selectedImageTemplateId;
  }
  updateImageTemplatePreview();
}

function selectImageTemplate(id) {
  selectedImageTemplateId = id;
  renderImageTemplateList();
}

function updateImageTemplatePreview() {
  const template = IMAGE_PROMPT_TEMPLATES.find((t) => t.id === selectedImageTemplateId) || IMAGE_PROMPT_TEMPLATES[0];
  const title = document.getElementById('imageTemplatePreviewTitle');
  const preview = document.getElementById('imageTemplatePreviewText');
  if (!template || !title || !preview) return;
  title.textContent = `${template.title} · ${template.aspect}`;
  preview.value = template.prompt;
  const aspect = document.getElementById('imagineAspect');
  if (aspect) aspect.value = aspectValue(template);
  syncImagineModeControls();
}

function insertSelectedImageTemplate(sendNow) {
  const preview = document.getElementById('imageTemplatePreviewText');
  const msg = document.getElementById('msg');
  if (!preview || !msg) return;
  const template = IMAGE_PROMPT_TEMPLATES.find((t) => t.id === selectedImageTemplateId) || IMAGE_PROMPT_TEMPLATES[0];
  msg.value = imageTemplateInstruction({ ...template, prompt: preview.value, aspect: aspectValue(template) });
  msg.dispatchEvent(new Event('input', { bubbles: true }));
  closeImageTemplatePicker();
  if (sendNow && typeof send === 'function') send();
}

function setImagineMode(mode) {
  imagineMode = mode === 'video' ? 'video' : 'image';
  syncImagineModeControls();
}

function syncImagineModeControls() {
  const imageBtn = document.getElementById('imagineModeImage');
  const videoBtn = document.getElementById('imagineModeVideo');
  const duration = document.getElementById('imagineDuration');
  const resolution = document.getElementById('imagineResolution');
  if (imageBtn) imageBtn.classList.toggle('active', imagineMode === 'image');
  if (videoBtn) videoBtn.classList.toggle('active', imagineMode === 'video');
  if (duration) duration.disabled = imagineMode !== 'video';
  if (resolution) {
    const values = imagineMode === 'video' ? ['720p', '480p'] : ['1k', '2k'];
    Array.from(resolution.options).forEach((option) => { option.hidden = !values.includes(option.value); });
    if (!values.includes(resolution.value)) resolution.value = values[0];
  }
}

async function ensureImagineSession() {
  if (!S.session && typeof newSession === 'function') {
    await newSession();
    if (typeof renderSessionList === 'function') await renderSessionList();
  }
  if (!S.session) throw new Error('세션을 만들 수 없습니다.');
  return S.session;
}

function renderImagineResult(result) {
  const box = document.getElementById('imageTemplateResult');
  if (!box) return;
  if (!result?.raw_url) {
    box.innerHTML = '';
    return;
  }
  const url = esc(result.raw_url);
  if (result.kind === 'video') {
    box.innerHTML = `<video controls src="${url}"></video><a href="${url}" target="_blank" rel="noopener">${url}</a>`;
  } else {
    box.innerHTML = `<img src="${url}" alt="Generated image"><a href="${url}" target="_blank" rel="noopener">${url}</a>`;
  }
}

async function generateImagineFromTemplate() {
  const promptEl = document.getElementById('imageTemplatePreviewText');
  const resultBox = document.getElementById('imageTemplateResult');
  const button = document.getElementById('btnImagineGenerate');
  if (!promptEl || !button) return;
  const prompt = promptEl.value.trim();
  if (!prompt) {
    if (resultBox) resultBox.textContent = 'Prompt is required.';
    return;
  }
  button.disabled = true;
  const original = button.textContent;
  button.textContent = imagineMode === 'video' ? 'Generating video...' : 'Generating image...';
  if (resultBox) resultBox.textContent = 'Generating...';
  try {
    const session = await ensureImagineSession();
    const body = {
      session_id: session.session_id,
      prompt,
      aspect_ratio: document.getElementById('imagineAspect')?.value || '1:1',
      resolution: document.getElementById('imagineResolution')?.value || (imagineMode === 'video' ? '720p' : '1k'),
    };
    if (imagineMode === 'video') body.duration = Number(document.getElementById('imagineDuration')?.value || 5);
    const result = await api(`/api/imagine/${imagineMode}`, { method: 'POST', body: JSON.stringify(body) });
    renderImagineResult(result);
    try {
      const data = await api(`/api/session?session_id=${encodeURIComponent(session.session_id)}`);
      S.session = data.session;
      S.messages = data.session.messages || [];
      renderMessages();
      await renderSessionList();
    } catch (e) {
      console.warn('[imagine] session refresh failed:', e.message);
    }
  } catch (e) {
    if (resultBox) resultBox.textContent = e.message || 'Generation failed.';
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeImageTemplatePicker();
});
