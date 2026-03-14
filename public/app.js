

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

function setLoading(loading) {
  if (loading) {
    extractBtn.classList.add('loading');
    extractBtn.disabled = true;
    btnText.textContent = '解析中...';
    extractBtn.querySelector('.btn-icon').innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>`;
  } else {
    extractBtn.classList.remove('loading');
    btnText.textContent = '解析视频';
    extractBtn.querySelector('.btn-icon').innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
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
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderVideoCard(result) {
  const qualityItems = result.qualities
    .map((q, i) =>
      `<div class="csel-option${i === 0 ? ' selected' : ''}" data-index="${i}" onclick="selectQuality(this)">${escapeHtml(q.label)}</div>`
    )
    .join('');
  const firstLabel = escapeHtml(result.qualities[0]?.label || '');

  const thumbnail = result.thumbnail
    ? `<img src="${escapeHtml(result.thumbnail)}" alt="缩略图" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'thumb-placeholder\\'><svg viewBox=\\'0 0 24 24\\' width=\\'32\\' height=\\'32\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'2\\' y=\\'2\\' width=\\'20\\' height=\\'20\\' rx=\\'4\\'/><polygon points=\\'10,8 16,12 10,16\\'/></svg></div>'" />`
    : `<div class="thumb-placeholder"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="4"/><polygon points="10,8 16,12 10,16"/></svg></div>`;

  const handleText = result.screenName ? `@${escapeHtml(result.screenName)}` : '';

  return `
    <div class="video-card" data-tweet-id="${escapeHtml(result.tweetId)}" data-qualities='${JSON.stringify(result.qualities).replace(/'/g, '&#39;')}'>
      <div class="card-thumb-row">
        <div class="card-thumbnail">
          ${thumbnail}
          <div class="play-overlay">
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
          <button class="csel-trigger" onclick="toggleCsel(this)" type="button">
            <span class="csel-label">${firstLabel}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="csel-dropdown hidden">${qualityItems}</div>
        </div>
        <div class="dl-btn-group">
          <button class="btn-download" onclick="downloadVideo(this)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
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
      <div class="error-icon">
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

const ICON_DL     = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const ICON_PLAY   = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
const ICON_PAUSE  = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
const ICON_STOP   = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;

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
      this.onerror?.(`下载失败 (HTTP ${response.status})`);
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
  const task  = downloadTasks.get(card);

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
      group.innerHTML = `
        <button class="btn-sm btn-download" onclick="downloadVideo(this)">${ICON_DL} 重新下载</button>`;
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
    size.textContent  = '下载完成 ✓';

    const u = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: u, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(u), 10000);

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
    d.closest('.csel').classList.remove('open');
  });
  if (!isOpen) {
    dropdown.classList.remove('hidden');
    csel.classList.add('open');
  }
};

window.selectQuality = function (option) {
  const dropdown = option.closest('.csel-dropdown');
  const csel = option.closest('.csel');
  dropdown.querySelectorAll('.csel-option').forEach((o) => o.classList.remove('selected'));
  option.classList.add('selected');
  csel.dataset.value = option.dataset.index;
  csel.querySelector('.csel-label').textContent = option.textContent;
  dropdown.classList.add('hidden');
  csel.classList.remove('open');
};

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.csel')) {
    document.querySelectorAll('.csel-dropdown:not(.hidden)').forEach((d) => {
      d.classList.add('hidden');
      d.closest('.csel').classList.remove('open');
    });
  }
});

/* ===== Extract Handler ===== */
async function extractVideos() {
  hideError();
  const urls = getUrls().filter(isValidTwitterUrl);

  if (urls.length === 0) {
    showError('未检测到有效的 X/Twitter 链接，请检查链接格式');
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
      throw new Error(data.error || `服务器错误 (${response.status})`);
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
urlInput.addEventListener('paste', () => setTimeout(updateUrlCount, 0));

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  updateUrlCount();
  hideError();
  resultsSection.classList.add('hidden');
});

extractBtn.addEventListener('click', extractVideos);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    extractVideos();
  }
});

/* ===== Init ===== */
updateUrlCount();
