const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.bajajauto.com/en-np/bikes', { waitUntil: 'domcontentloaded' });
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => src.includes('bikes'));
  });
  console.log([...new Set(images)].join('\n'));
  await browser.close();
})();
