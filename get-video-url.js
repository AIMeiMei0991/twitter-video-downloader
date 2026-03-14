const puppeteer = require('puppeteer');

async function getVideoUrl(tweetUrl) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // 导航到推文页面
    await page.goto(tweetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // 等待视频元素加载
    await page.waitForSelector('video', { timeout: 30000 });
    
    // 获取视频URL
    const videoUrl = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        return video.src;
      }
      return null;
    });
    
    await browser.close();
    
    if (videoUrl) {
      console.log('Video URL found:', videoUrl);
      return videoUrl;
    } else {
      console.log('No video found');
      return null;
    }
  } catch (error) {
    console.error('Error getting video URL:', error.message);
    return null;
  }
}

// 测试脚本
if (require.main === module) {
  const tweetUrl = 'https://x.com/MadeshiaPramod/status/2032329364856324269';
  getVideoUrl(tweetUrl).then(url => {
    if (url) {
      console.log('Final video URL:', url);
    } else {
      console.log('Failed to get video URL');
    }
  });
}

module.exports = getVideoUrl;