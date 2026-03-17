/* ===== DOM References ===== */
const urlInput = document.getElementById('urlInput');
const urlCount = document.getElementById('urlCount');
const clearBtn = document.getElementById('clearBtn');
const extractBtn = document.getElementById('extractBtn');
const btnText = document.getElementById('btnText');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const resultCount = document.getElementById('resultCount');

/* ===== URL Parsing ===== */
function getUrls() {
  return urlInput.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function isValidTwitterUrl(url) {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

/* ===== UI Updates ===== */
function updateUrlCount() {
  const urls = getUrls();
  const valid = urls.filter(isValidTwitterUrl).length;
  if (urls.length === 0) {
    urlCount.textContent = '0 个链接';
  } else if (valid === urls.length) {
    urlCount.textContent = `${valid} 个有效链接`;
  } else {
    urlCount.textContent = `${urls.length} 行 · ${valid} 个有效链接`;
  }
  extractBtn.disabled = valid === 0;
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

const LOADING_MSGS = [
  '解析视频链接...',
  '连接 X 服务器...',
  '提取视频格式...',
  '获取下载地址...',
];
let _loadingTimer = null;

function setLoading(loading) {
  if (loading) {
    extractBtn.classList.add('loading');
    extractBtn.disabled = true;
    let msgIdx = 0;
    btnText.textContent = LOADING_MSGS[0];
    _loadingTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
      btnText.textContent = LOADING_MSGS[msgIdx];
    }, 1800);
    extractBtn.querySelector('.btn-icon').innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>`;
  } else {
    clearInterval(_loadingTimer);
    extractBtn.classList.remove('loading');
    btnText.textContent = '解析视频';
    extractBtn.querySelector('.btn-icon').innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>`;
    updateUrlCount();
  }
}

/* ===== Skeleton Loader ===== */
function showSkeletons(count) {
  resultsContainer.innerHTML = '';
  resultsSection.classList.remove('hidden');
  for (let i = 0; i < count; i++) {
    resultsContainer.insertAdjacentHTML(
      'beforeend',
      `<div class="skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line medium"></div>
          <div class="skeleton skeleton-line long"></div>
        </div>
      </div>`
    );
  }
}

/* ===== Card Rendering ===== */
let _cselCounter = 0;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderVideoCard(result) {
  const cselId = `csel-${++_cselCounter}`;
  const qualityItems = result.qualities
    .map((q, i) =>
      `<div class="csel-option${i === 0 ? ' selected' : ''}" data-index="${i}" onclick="selectQuality(this)" role="option" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="-1">${escapeHtml(q.label)}</div>`
    )
    .join('');
  const firstLabel = escapeHtml(result.qualities[0]?.label || '');

  const thumbAlt = escapeHtml(result.author) + ' 的视频缩略图';
  const thumbnail = result.thumbnail
    ? `<img src="${escapeHtml(result.thumbnail)}" alt="${thumbAlt}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'thumb-placeholder\\'><svg aria-hidden=\\'true\\' viewBox=\\'0 0 24 24\\' width=\\'32\\' height=\\'32\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'2\\' y=\\'2\\' width=\\'20\\' height=\\'20\\' rx=\\'4\\'/><polygon points=\\'10,8 16,12 10,16\\'/></svg></div>'" />`
    : `<div class="thumb-placeholder"><svg aria-hidden="true" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="4"/><polygon points="10,8 16,12 10,16"/></svg></div>`;

  const handleText = result.screenName ? `@${escapeHtml(result.screenName)}` : '';

  return `
    <div class="video-card" data-tweet-id="${escapeHtml(result.tweetId)}" data-qualities='${JSON.stringify(result.qualities).replace(/'/g, '&#39;')}'>
      <div class="card-thumb-row">
        <div class="card-thumbnail">
          ${thumbnail}
          <div class="play-overlay" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
              <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)"/>
              <polygon points="10,8 18,12 10,16" fill="white"/>
            </svg>
          </div>
        </div>
        <div class="card-info">
          <div class="card-author">
            <span class="author-name">${escapeHtml(result.author)}</span>
            <span class="author-handle">${handleText}</span>
          </div>
          ${result.text ? `<div class="card-text">${escapeHtml(result.text)}</div>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <div class="csel" data-value="0">
          <button class="csel-trigger" onclick="toggleCsel(this)" type="button"
                  aria-haspopup="listbox" aria-expanded="false" aria-controls="${cselId}">
            <span class="csel-label">${firstLabel}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="csel-dropdown hidden" role="listbox" id="${cselId}">${qualityItems}</div>
        </div>
        <div class="dl-btn-group">
          <button class="btn-download" onclick="downloadVideo(this)">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载
          </button>
        </div>
      </div>
    </div>`;

}

function renderErrorCard(result) {
  return `
    <div class="error-card">
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <div class="error-card-content">
        <div class="error-card-url">${escapeHtml(result.url)}</div>
        <div class="error-card-msg">${escapeHtml(result.error)}</div>
      </div>
    </div>`;
}

function renderResults(results) {
  resultsContainer.innerHTML = '';
  const successCount = results.filter((r) => !r.error).length;
  const totalCount = results.length;

  resultCount.textContent =
    successCount === totalCount
      ? `共 ${totalCount} 个`
      : `${successCount} 成功 / ${totalCount - successCount} 失败`;

  if (results.length === 0) {
    resultsSection.classList.add('hidden');
    return;
  }

  resultsSection.classList.remove('hidden');
  results.forEach((result) => {
    if (result.error) {
      resultsContainer.insertAdjacentHTML('beforeend', renderErrorCard(result));
    } else {
      resultsContainer.insertAdjacentHTML('beforeend', renderVideoCard(result));
    }
  });

  // Apply stagger index for card entrance animation
  resultsContainer.querySelectorAll('.video-card, .error-card').forEach((card, i) => {
    card.style.setProperty('--i', i);
  });
}

/* ===== Download Helpers ===== */
function formatSpeed(bytesPerSec) {
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

function formatEta(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

const ICON_DL     = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const ICON_PLAY   = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
const ICON_PAUSE  = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
const ICON_STOP   = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
const ICON_SAVE   = `<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 17l4 4 4-4m-4-5v9"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`;

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/* ===== DownloadTask: Fetch streaming with pause/resume/cancel ===== */
class DownloadTask {
  constructor(url) {
    this.url = url;
    this.chunks = [];           // Uint8Array[]
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.state = 'idle';        // idle|downloading|paused|done|error|cancelled
    this.blob = null;
    this._ctrl = null;

    // Callbacks (set by caller)
    this.onprogress = null;
    this.onstatechange = null;
    this.ondone = null;
    this.onerror = null;
  }

  async _fetch(offset = 0) {
    const headers = {};
    if (offset > 0) headers['Range'] = `bytes=${offset}-`;

    this._ctrl = new AbortController();
    let response;
    try {
      response = await fetch(this.url, { headers, signal: this._ctrl.signal });
    } catch (e) {
      if (e.name !== 'AbortError') { this.state = 'error'; this.onerror?.(e.message); }
      return;
    }

    if (!response.ok && response.status !== 206) {
      this.state = 'error';
      const msg = response.status === 403 ? '无权限下载此视频'
                : response.status === 404 ? '视频已失效或被删除'
                : '下载失败，请稍后重试';
      this.onerror?.(msg);
      return;
    }

    const cl = response.headers.get('content-length');
    if (cl) this.totalBytes = parseInt(cl) + offset;

    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        this.chunks.push(value);
        this.downloadedBytes += value.byteLength;
        this.onprogress?.(this.downloadedBytes, this.totalBytes);
      }
    } catch (e) {
      if (e.name !== 'AbortError') { this.state = 'error'; this.onerror?.(e.message); }
      return;
    }

    this.blob = new Blob(this.chunks, { type: 'video/mp4' });
    this.state = 'done';
    this.ondone?.(this.blob);
  }

  start() {
    this.state = 'downloading';
    this.onstatechange?.('downloading');
    this._fetch(0);
  }

  pause() {
    if (this.state !== 'downloading') return;
    this.state = 'paused';
    this._ctrl?.abort();
    this.onstatechange?.('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'downloading';
    this.onstatechange?.('downloading');
    this._fetch(this.downloadedBytes);
  }

  cancel() {
    if (this.state === 'done' || this.state === 'cancelled') return;
    this.state = 'cancelled';
    this._ctrl?.abort();
    this.chunks = [];
    this.downloadedBytes = 0;
    this.onstatechange?.('cancelled');
  }
}

/* ===== Task registry ===== */
const downloadTasks = new WeakMap();

/* ===== Button group state management ===== */
function setButtons(card, state) {
  const group = card.querySelector('.dl-btn-group');

  switch (state) {
    case 'downloading':
      group.innerHTML = `
        <button class="btn-sm btn-pause" onclick="pauseDownload(this)">${ICON_PAUSE} 暂停</button>
        <button class="btn-sm btn-stop"  onclick="cancelDownload(this)">${ICON_STOP} 停止</button>`;
      break;
    case 'paused':
      group.innerHTML = `
        <button class="btn-sm btn-resume" onclick="resumeDownload(this)">${ICON_PLAY} 继续</button>
        <button class="btn-sm btn-stop"   onclick="cancelDownload(this)">${ICON_STOP} 停止</button>`;
      break;
    case 'done':
      if (isMobile()) {
        group.innerHTML = `
          <button class="btn-sm btn-play" onclick="saveToPhotos(this)">${ICON_SAVE} 存到相册</button>
          <button class="btn-sm btn-download" onclick="downloadVideo(this)">${ICON_DL} 重新下载</button>`;
      } else {
        group.innerHTML = `
          <button class="btn-sm btn-play" onclick="playBlob(this)">${ICON_PLAY} 播放</button>
          <button class="btn-sm btn-download" onclick="downloadVideo(this)">${ICON_DL} 重新下载</button>`;
      }
      break;
    default: // idle / cancelled / error
      group.innerHTML = `
        <button class="btn-download" onclick="downloadVideo(this)">${ICON_DL} 下载</button>`;
  }
}

/* ===== Control button handlers ===== */
window.pauseDownload = function (btn) {
  downloadTasks.get(btn.closest('.video-card'))?.pause();
};

window.resumeDownload = function (btn) {
  downloadTasks.get(btn.closest('.video-card'))?.resume();
};

window.cancelDownload = function (btn) {
  const card = btn.closest('.video-card');
  const task = downloadTasks.get(card);
  if (!task) return;
  task.cancel();
  const pb = card.querySelector('.download-progress');
  if (pb) pb.style.display = 'none';
};

window.playBlob = function (btn) {
  const task = downloadTasks.get(btn.closest('.video-card'));
  if (!task?.blob) return;
  const u = URL.createObjectURL(task.blob);
  window.open(u, '_blank');
  setTimeout(() => URL.revokeObjectURL(u), 120000);
};

window.saveToPhotos = async function (btn) {
  const task = downloadTasks.get(btn.closest('.video-card'));
  if (!task?.blob) return;
  const filename = task.filename || `twitter_video_${Date.now()}.mp4`;
  const file = new File([task.blob], filename, { type: 'video/mp4' });

  const fallback = () => {
    const u = URL.createObjectURL(task.blob);
    const a = Object.assign(document.createElement('a'), { href: u, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(u), 10000);
  };

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
    } catch (e) {
      if (e.name !== 'AbortError') fallback();
    }
  } else {
    fallback();
  }
};


/* ===== Download Handler ===== */
window.downloadVideo = async function (btn) {
  const card = btn.closest('.video-card');
  const existingTask = downloadTasks.get(card);
  if (existingTask?.state === 'downloading' || existingTask?.state === 'paused') return;

  const qualitiesRaw = card.dataset.qualities;
  const tweetId = card.dataset.tweetId;
  let qualities;
  try { qualities = JSON.parse(qualitiesRaw); } catch {
    alert('无法读取视频信息，请重新解析'); return;
  }

  const chosen = qualities[parseInt(card.querySelector('.csel').dataset.value, 10)];
  if (!chosen) return;

  const filename = `twitter_${tweetId}_${chosen.label.replace(/\s+/g, '_')}.mp4`;
  const downloadUrl = `/api/download?url=${encodeURIComponent(chosen.url)}&filename=${encodeURIComponent(filename)}`;

  // --- 进度条 ---
  let progressBar = card.querySelector('.download-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'download-progress';
    progressBar.innerHTML = `
      <div class="progress-track"><div class="progress-fill"></div></div>
      <div class="progress-meta">
        <span class="progress-pct">0%</span>
        <span class="progress-speed"></span>
        <span class="progress-eta"></span>
        <span class="progress-size"></span>
      </div>`;
    card.querySelector('.card-actions').insertAdjacentElement('afterend', progressBar);
  }
  const fill  = progressBar.querySelector('.progress-fill');
  const pct   = progressBar.querySelector('.progress-pct');
  const speed = progressBar.querySelector('.progress-speed');
  const eta   = progressBar.querySelector('.progress-eta');
  const size  = progressBar.querySelector('.progress-size');

  fill.style.width = '0%';
  fill.classList.remove('progress-fill--done', 'progress-fill--error');
  pct.textContent   = '0%';
  speed.textContent = '';
  eta.textContent   = '';
  size.textContent  = '';
  progressBar.style.display = 'block';

  // --- 创建任务 ---
  const task = new DownloadTask(downloadUrl);
  task.filename = filename;
  downloadTasks.set(card, task);

  // 速度追踪（EMA）
  let lastLoaded = 0, lastTime = performance.now(), smoothed = 0;

  task.onprogress = (loaded, total) => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    if (dt >= 0.4) {
      const raw = (loaded - lastLoaded) / dt;
      smoothed = smoothed === 0 ? raw : 0.35 * raw + 0.65 * smoothed;
      lastLoaded = loaded; lastTime = now;
      speed.textContent = smoothed > 0 ? formatSpeed(smoothed) : '';
      if (total > 0 && smoothed > 0) {
        eta.textContent  = formatEta((total - loaded) / smoothed);
        size.textContent = `${formatSize(loaded)} / ${formatSize(total)}`;
      } else {
        size.textContent = formatSize(loaded);
      }
    }
    if (total > 0) {
      const p = Math.round((loaded / total) * 100);
      fill.style.width = `${p}%`;
      pct.textContent  = `${p}%`;
    }
  };

  task.onstatechange = (state) => {
    setButtons(card, state);
    if (state === 'paused') {
      speed.textContent = '';
      eta.textContent   = '已暂停';
    }
  };

  task.ondone = (blob) => {
    fill.style.width = '100%';
    fill.classList.add('progress-fill--done');
    pct.textContent   = '100%';
    speed.textContent = '';
    eta.textContent   = '';

    const checkSvg = `<svg aria-hidden="true" class="check-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--success)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline class="check-path" points="2,8 6,12 14,4"/></svg>`;

    if (isMobile()) {
      size.innerHTML = `完成，点击存到相册&nbsp;${checkSvg}`;
    } else {
      // Desktop: trigger browser download immediately
      const u = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: u, download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(u), 10000);
      size.innerHTML = `下载完成&nbsp;${checkSvg}`;
    }

    setButtons(card, 'done');
  };

  task.onerror = (msg) => {
    fill.classList.add('progress-fill--error');
    pct.textContent   = '失败';
    speed.textContent = '';
    eta.textContent   = '';
    size.textContent  = msg;
    setButtons(card, 'idle');
  };

  setButtons(card, 'downloading');
  task.start();
};

/* ===== Custom Select ===== */
window.toggleCsel = function (trigger) {
  const csel = trigger.closest('.csel');
  const dropdown = csel.querySelector('.csel-dropdown');
  const isOpen = !dropdown.classList.contains('hidden');
  // Close all open dropdowns first
  document.querySelectorAll('.csel-dropdown:not(.hidden)').forEach((d) => {
    d.classList.add('hidden');
    const t = d.closest('.csel').querySelector('.csel-trigger');
    d.closest('.csel').classList.remove('open');
    t.setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    dropdown.classList.remove('hidden');
    csel.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    // Move focus to the currently selected option
    const focused = dropdown.querySelector('.csel-option.selected') || dropdown.querySelector('.csel-option');
    focused?.focus();
  }
};

window.selectQuality = function (option, returnFocus = true) {
  const dropdown = option.closest('.csel-dropdown');
  const csel = option.closest('.csel');
  const trigger = csel.querySelector('.csel-trigger');
  dropdown.querySelectorAll('.csel-option').forEach((o) => {
    o.classList.remove('selected');
    o.setAttribute('aria-selected', 'false');
  });
  option.classList.add('selected');
  option.setAttribute('aria-selected', 'true');
  csel.dataset.value = option.dataset.index;
  csel.querySelector('.csel-label').textContent = option.textContent;
  dropdown.classList.add('hidden');
  csel.classList.remove('open');
  trigger.setAttribute('aria-expanded', 'false');
  if (returnFocus) trigger.focus();
};

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.csel')) {
    document.querySelectorAll('.csel-dropdown:not(.hidden)').forEach((d) => {
      d.classList.add('hidden');
      d.closest('.csel').querySelector('.csel-trigger').setAttribute('aria-expanded', 'false');
      d.closest('.csel').classList.remove('open');
    });
  }
});

// Keyboard navigation for quality select
resultsContainer.addEventListener('keydown', (e) => {
  const trigger = e.target.closest('.csel-trigger');
  const option  = e.target.closest('.csel-option');

  if (trigger) {
    const csel = trigger.closest('.csel');
    const dropdown = csel.querySelector('.csel-dropdown');
    const isOpen = csel.classList.contains('open');

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCsel(trigger);
    } else if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      toggleCsel(trigger);
    } else if (isOpen && e.key === 'Escape') {
      e.preventDefault();
      dropdown.classList.add('hidden');
      csel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }

  if (option) {
    const dropdown = option.closest('.csel-dropdown');
    const csel     = option.closest('.csel');
    const trigger  = csel.querySelector('.csel-trigger');
    const options  = Array.from(dropdown.querySelectorAll('.csel-option'));
    const idx      = options.indexOf(option);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      options[Math.min(idx + 1, options.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx === 0) {
        dropdown.classList.add('hidden');
        csel.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      } else {
        options[idx - 1]?.focus();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectQuality(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dropdown.classList.add('hidden');
      csel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    } else if (e.key === 'Tab') {
      // Close dropdown and let browser handle natural tab order
      dropdown.classList.add('hidden');
      csel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    } else if (e.key === 'Home') {
      e.preventDefault();
      options[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      options[options.length - 1]?.focus();
    }
  }
});

/* ===== Extract Handler ===== */
async function extractVideos() {
  hideError();
  const urls = getUrls().filter(isValidTwitterUrl);

  if (urls.length === 0) {
    showError('请粘贴有效的 X/Twitter 视频链接');
    return;
  }

  setLoading(true);
  showSkeletons(Math.min(urls.length, 3));

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || '服务器暂时不可用，请稍后重试');
    }

    const data = await response.json();
    renderResults(data.results || []);
  } catch (err) {
    resultsSection.classList.add('hidden');
    showError(err.message || '请求失败，请检查网络连接后重试');
  } finally {
    setLoading(false);
  }
}

/* ===== Event Listeners ===== */
urlInput.addEventListener('input', updateUrlCount);
urlInput.addEventListener('paste', () => {
  setTimeout(() => {
    updateUrlCount();
    urlInput.classList.remove('url-input--pasted');
    void urlInput.offsetWidth; // force reflow to restart animation
    urlInput.classList.add('url-input--pasted');
  }, 0);
});

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  updateUrlCount();
  hideError();
  resultsSection.classList.add('hidden');
});

extractBtn.addEventListener('click', (e) => {
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple-effect';
  const rect = extractBtn.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  extractBtn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
  extractVideos();
});

// Ripple on any download button inside results
resultsContainer.addEventListener('click', (e) => {
  const dlBtn = e.target.closest('.btn-download');
  if (!dlBtn || dlBtn.disabled) return;
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple-effect';
  const rect = dlBtn.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  dlBtn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    extractVideos();
  }
});

/* ===== Init ===== */
updateUrlCount();

/* ===== Console Easter Egg ===== */
console.log(
  '%c  X 视频下载工具  ',
  'background:#1d9bf0;color:#fff;font-size:14px;font-weight:700;padding:4px 12px;border-radius:6px;letter-spacing:1px;'
);
console.log(
  '%c你发现了这里 👀  欢迎反馈建议！',
  'color:#8b90a7;font-size:11px;'
);
