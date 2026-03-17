const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function extractTweetId(url) {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseResolutionFromUrl(url) {
  const match = url.match(/\/(\d+)x(\d+)\//);
  if (match) return `${match[1]}x${match[2]}`;
  return null;
}

function getQualityLabel(bitrate, url) {
  const resolution = parseResolutionFromUrl(url);
  if (resolution) {
    const height = parseInt(resolution.split('x')[1]);
    if (height >= 720) return `高清 ${resolution}`;
    if (height >= 480) return `标准 ${resolution}`;
    return `流畅 ${resolution}`;
  }
  if (bitrate >= 2000000) return '高清 720p+';
  if (bitrate >= 800000) return '标准 480p';
  return '流畅 360p';
}

// Compute the token required by the Syndication API.
// Source: https://github.com/vercel/react-tweet (packages/react-tweet/src/api/fetch-tweet.ts)
function computeSyndicationToken(tweetId) {
  return ((Number(tweetId) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

// Primary: Twitter Syndication API (no auth required, medium reliability)
async function fetchViaSyndication(tweetId) {
  const token = computeSyndicationToken(tweetId);
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=${token}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://platform.twitter.com/',
      'Origin': 'https://platform.twitter.com',
    },
    timeout: 15000,
  });

  const data = response.data;
  if (!data || data.notFound || data.tombstone) return null;
  return { source: 'syndication', data };
}

// Fallback: FxTwitter API (https://github.com/FixTweet/FxTwitter, no auth required, high reliability)
async function fetchViaFxTwitter(tweetId) {
  const url = `https://api.fxtwitter.com/i/status/${tweetId}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    timeout: 15000,
  });

  const tweet = response.data?.tweet;
  if (!tweet) return null;
  return { source: 'fxtwitter', data: tweet };
}

// Normalise results from both sources into a common shape:
// { author, screenName, text, thumbnail, variants: [{url, bitrate, content_type}] }
function normaliseResult(result, tweetUrl) {
  if (result.source === 'syndication') {
    const d = result.data;
    const mediaDetails = d.mediaDetails || [];
    const videoMedia = mediaDetails.find(
      (m) => m.type === 'video' || m.type === 'animated_gif'
    );
    if (!videoMedia) return null;

    return {
      author: d.user?.name || '未知用户',
      screenName: d.user?.screen_name || '',
      text: d.text || '',
      thumbnail: videoMedia.media_url_https || videoMedia.media_url || '',
      variants: videoMedia.video_info?.variants || [],
    };
  }

  if (result.source === 'fxtwitter') {
    const t = result.data;
    const media = t.media;
    const videos = media?.videos;
    if (!videos || videos.length === 0) return null;

    // FxTwitter returns a single best-quality video per resolution group;
    // reconstruct variants from all returned videos
    const variants = videos.map((v) => ({
      url: v.url,
      bitrate: v.bitrate || 0,
      content_type: 'video/mp4',
    }));

    return {
      author: t.author?.name || '未知用户',
      screenName: t.author?.screen_name || '',
      text: t.text || '',
      thumbnail: videos[0]?.thumbnail_url || '',
      variants,
    };
  }

  return null;
}

async function fetchTweetData(tweetId) {
  // Try primary source first
  try {
    const result = await fetchViaSyndication(tweetId);
    if (result) {
      const normalised = normaliseResult(result);
      if (normalised) return normalised;
    }
  } catch (err) {
    console.log(`[syndication] failed for ${tweetId}: ${err.message}`);
  }

  // Fall back to FxTwitter
  console.log(`[fxtwitter] trying fallback for ${tweetId}`);
  const result = await fetchViaFxTwitter(tweetId);
  if (!result) return null;
  return normaliseResult(result);
}

// POST /api/extract - extract video info from tweet URLs
app.post('/api/extract', async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: '请提供有效的推文链接' });
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      const trimmed = url.trim();
      if (!trimmed) return null;

      const tweetId = extractTweetId(trimmed);
      if (!tweetId) {
        return { url: trimmed, error: '无效的链接格式，请确保是 X/Twitter 推文链接' };
      }

      try {
        const tweet = await fetchTweetData(tweetId);

        if (!tweet) {
          return { url: trimmed, error: '找不到该推文，可能已被删除或不含视频' };
        }

        const variants = tweet.variants
          .filter((v) => v.content_type === 'video/mp4' && v.url)
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        if (variants.length === 0) {
          return { url: trimmed, error: '该推文不包含可下载的视频' };
        }

        const qualities = variants.map((v) => ({
          label: getQualityLabel(v.bitrate || 0, v.url),
          bitrate: v.bitrate || 0,
          url: v.url,
        }));

        return {
          url: trimmed,
          tweetId,
          author: tweet.author,
          screenName: tweet.screenName,
          text: tweet.text,
          thumbnail: tweet.thumbnail ? `${tweet.thumbnail}?format=jpg&name=medium` : '',
          qualities,
        };
      } catch (err) {
        if (err.response?.status === 404) {
          return { url: trimmed, error: '推文不存在或已被删除' };
        }
        if (err.response?.status === 403) {
          return { url: trimmed, error: '无法访问该推文（可能是私有账号或受保护的推文）' };
        }
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          return { url: trimmed, error: '请求超时，请稍后重试' };
        }
        console.error(`Error fetching tweet ${tweetId}:`, err.message);
        return { url: trimmed, error: '视频解析失败，请稍后重试' };
      }
    })
  );

  const filtered = results.filter(Boolean);
  res.json({ results: filtered });
});

// GET /api/download - proxy video download
app.get('/api/download', async (req, res) => {
  const { url, filename } = req.query;

  if (!url) {
    return res.status(400).json({ error: '缺少视频链接参数' });
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'video.twimg.com') {
      return res.status(403).json({ error: '不允许的视频来源' });
    }
  } catch {
    return res.status(400).json({ error: '无效的视频链接' });
  }

  try {
    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://twitter.com/',
      'Origin': 'https://twitter.com',
    };

    // Forward Range header so pause/resume works
    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range;
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: upstreamHeaders,
      timeout: 60000,
    });

    const safeFilename = (filename || `twitter_video_${Date.now()}.mp4`).replace(
      /[^a-zA-Z0-9_\-.]/g,
      '_'
    );

    // Forward partial-content status and range headers
    res.status(response.status);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: '视频流传输失败' });
      }
    });
  } catch (err) {
    console.error('Download proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '视频下载失败，请稍后重试' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Twitter Video Downloader running at http://localhost:${PORT}`);
});
