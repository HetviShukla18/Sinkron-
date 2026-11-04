/* Run against a local production server: npm run build && npm start -- -p 3100 */
/* Layout regression checks only: npm run qa:layout (QA_URL defaults to localhost:3100). */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const WebSocket = require('next/dist/compiled/ws');
const axe = require('axe-core');

const base = process.env.QA_URL || 'http://localhost:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('QA_URL must point to a local test server.');
const browserPath = [process.env.QA_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file => file && fs.existsSync(file));
if (!browserPath) throw new Error('Set QA_CHROME_PATH to a Chromium browser executable.');
fs.mkdirSync('.preview', { recursive: true });
const report = { checks: [], accessibility: [], runtimeErrors: [], consoleErrors: [], badResponses: [], pages: [] };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function check(name, passed, detail) {
  report.checks.push({ name, passed: Boolean(passed), ...(detail ? { detail } : {}) });
  if (!passed) console.error('FAIL: ' + name);
}

const browserProcess = spawn(browserPath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  ...(process.env.QA_NO_SANDBOX === '1' ? ['--no-sandbox', '--disable-gpu'] : []),
  '--disable-extensions', '--disable-sync', '--remote-debugging-port=9229', '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${path.resolve('.preview/qa-chrome')}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });

(async () => {
  let target;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { target = (await (await fetch('http://127.0.0.1:9229/json')).json()).find(tab => tab.type === 'page'); } catch {}
    if (target) break;
    await sleep(250);
  }
  if (!target) throw new Error('Browser did not start.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.once('open', resolve));
  let nextId = 0;
  let context = '';
  const pending = new Map();
  ws.on('message', bytes => {
    const message = JSON.parse(String(bytes));
    if (message.id) {
      const task = pending.get(message.id);
      if (task) {
        pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message));
        else task.resolve(message.result);
      }
    } else if (message.method === 'Runtime.exceptionThrown') {
      report.runtimeErrors.push({ context, message: message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text });
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      report.consoleErrors.push({ context, message: message.params.args.map(arg => arg.value || arg.description).join(' ') });
    } else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400 && !message.params.response.url.includes('/api/enquiry')) {
      report.badResponses.push({ context, url: message.params.response.url, status: message.params.response.status });
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  };
  const until = async expression => {
    for (let attempt = 0; attempt < 70; attempt++) { if (await evaluate(expression)) return; await sleep(100); }
    throw new Error('Timed out: ' + expression);
  };
  const navigate = async route => {
    await send('Page.navigate', { url: base + route });
    await until(`location.pathname===${JSON.stringify(new URL(base + route).pathname)}&&document.readyState==='complete'`);
    await sleep(300);
  };
  const viewport = async (width, height = 900) => send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width < 701, deviceScaleFactor: 1 });
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`.preview/qa-${name}.png`, Buffer.from(result.data, 'base64'));
  };
  const auditAccessibility = async label => {
    if (!(await evaluate("typeof window.axe==='object'"))) await evaluate(axe.source);
    const violations = await evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}).then(result=>result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})))");
    report.accessibility.push({ context: label, violations });
    check(`${label}: accessibility audit`, violations.length === 0, violations.map(item => item.id));
    return violations;
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.qaMetrics = { lcp: 0, cls: 0, longTaskMs: 0 };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.qaMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.qaMetrics.longTaskMs += Math.max(0, entry.duration - 50); }).observe({ type: 'longtask', buffered: true });
  ` });
  const routes = ['/', '/about', '/products', '/applications', '/contact'];
  const links = new Set();

  if (process.env.QA_LAYOUT_ONLY === '1' || process.argv.includes('--layout-only')) {
    const auditLayout = async label => {
      const state = await evaluate(`(() => {
        const root = document.documentElement;
        const bounds = element => {
          const rect = element.getBoundingClientRect();
          return { element: element.tagName.toLowerCase() + '.' + element.className,
            left: rect.left, right: rect.right, width: rect.width };
        };
        const visible = element => element.getClientRects().length &&
          !element.closest('.honeypot, .skip-link, .table-scroll, nextjs-portal');
        const containers = [...document.querySelectorAll('.site-container, .home-hero-copy, .home-about-grid, .trust-strip')].map(bounds);
        const grid = containers[0];
        const elements = [...document.body.querySelectorAll('*')].filter(visible);
        return {
          viewport: root.clientWidth, width: root.scrollWidth,
          misaligned: containers.filter(rect => Math.abs(rect.left - grid.left) > .5 || Math.abs(rect.width - grid.width) > .5),
          outside: elements.map(bounds).filter(rect => rect.left < -.5 || rect.right > root.clientWidth + .5),
          overflowing: elements.filter(element =>
            element.matches('main, header, footer, section, article, aside, nav, form, fieldset, div, h1, h2, h3, p, a, li, label') && element.clientWidth > 0 &&
            getComputedStyle(element).overflowX === 'visible' && element.scrollWidth > element.clientWidth + 1).map(bounds),
        };
      })()`);
      report.pages.push({ context: label, ...state });
      check(`${label}: no horizontal page overflow`, state.width <= state.viewport, state);
      check(`${label}: shared centered content grid`, state.misaligned.length === 0, state.misaligned);
      check(`${label}: elements stay inside the viewport`, state.outside.length === 0, state.outside);
      check(`${label}: content fits its containers`, state.overflowing.length === 0, state.overflowing);
    };

    for (const width of [320, 360, 390, 600, 601, 700, 701, 768, 820, 821, 1024, 1025, 1280, 1440, 1920, 2560]) {
      await viewport(width);
      for (const route of routes) {
        context = `${width} ${route}`;
        await navigate(route);
        await evaluate("document.fonts.ready.then(() => { document.querySelectorAll('img').forEach(image => image.loading = 'eager'); })");
        await until("[...document.images].every(image => image.complete)");
        check(`${context}: all images load`, await evaluate("[...document.images].every(image => image.naturalWidth > 0)"));
        await auditLayout(context);
        if (route === '/products') {
          await evaluate("document.querySelectorAll('.technical-disclosure').forEach(details => details.open = true)");
          await auditLayout(context + ' expanded specifications');
          check(`${context}: specifications scroll inside their own panels`, await evaluate("[...document.querySelectorAll('.table-scroll')].every(panel => { panel.scrollLeft = panel.scrollWidth; return panel.scrollWidth <= panel.clientWidth || panel.scrollLeft > 0; })"));
        }
        if (width <= 1024) {
          await evaluate("document.querySelector('.menu-button').click()");
          await until("!!document.querySelector('#mobile-navigation')");
          await auditLayout(context + ' open navigation');
          await evaluate("document.querySelector('.menu-button').click()");
        }
        if ([390, 768, 1440].includes(width)) await screenshot(`layout-${width}-${route.slice(1) || 'home'}`);
      }
      // A short page must use the same horizontal grid as a page with a scrollbar.
      const before = await evaluate("document.querySelector('.header-inner').getBoundingClientRect().toJSON()");
      await evaluate("document.querySelector('main').style.display = 'none'; document.querySelector('footer').style.display = 'none'");
      const after = await evaluate("document.querySelector('.header-inner').getBoundingClientRect().toJSON()");
      check(`${width}: scrollbar changes do not shift the page`, Math.abs(before.x - after.x) < .5 && Math.abs(before.width - after.width) < .5);
      console.log(JSON.stringify({ width, failed: report.checks.filter(item => !item.passed).length }));
    }
    check('No JavaScript runtime errors', report.runtimeErrors.length === 0, report.runtimeErrors);
    check('No browser console errors', report.consoleErrors.length === 0, report.consoleErrors);
    check('No failed page or asset responses', report.badResponses.length === 0, report.badResponses);
    fs.writeFileSync('.preview/qa-layout-report.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(item => !item.passed).length, report: '.preview/qa-layout-report.json' }));
    await send('Browser.close'); ws.close();
    if (report.checks.some(item => !item.passed)) process.exitCode = 1;
    return;
  }

  for (const width of [1440, 390]) {
    await viewport(width);
    for (const route of routes) {
      context = `${width} ${route}`;
      await navigate(route);
      await evaluate("document.querySelectorAll('img').forEach(image=>image.loading='eager')");
      await sleep(400);
      const state = await evaluate(`({
        title:document.title, headings:document.querySelectorAll('h1').length,
        width:document.documentElement.scrollWidth, viewport:document.documentElement.clientWidth,
        images:[...document.images].map(image=>({src:image.currentSrc,alt:image.getAttribute('alt'),broken:image.complete&&!image.naturalWidth})),
        links:[...document.querySelectorAll('a[href]')].map(a=>a.href),
        description:document.querySelector('meta[name="description"]')?.content,
        canonical:document.querySelector('link[rel="canonical"]')?.href,
        language:document.documentElement.lang,
        viewportMeta:document.querySelector('meta[name="viewport"]')?.content,
        metrics:window.qaMetrics,
        text:document.body.innerText,
      })`);
      report.pages.push({ context, title: state.title, width: state.width, metrics: state.metrics });
      check(`${context}: one primary heading`, state.headings === 1);
      check(`${context}: SEO title, description, language and viewport`, state.title.includes('Sinkron') && state.description?.length > 30 && state.language === 'en' && state.viewportMeta?.includes('width=device-width'));
      check(`${context}: canonical matches the page`, state.canonical === 'https://www.sinkronmeters.com' + (route === '/' ? '/' : route));
      check(`${context}: header, footer and active navigation`, await evaluate("!!document.querySelector('header') && !!document.querySelector('footer') && document.querySelectorAll('.desktop-nav a').length===5 && document.querySelectorAll('.footer-links a').length===5 && document.querySelector('.desktop-nav [aria-current=page]')?.pathname===location.pathname"));
      check(`${context}: WhatsApp click-to-chat is visible and correctly configured`, await evaluate(`(() => {
        const link = document.querySelector('.floating-whatsapp');
        if (!link) return false;
        const url = new URL(link.href), rect = link.getBoundingClientRect();
        return url.origin === 'https://wa.me' && /^\\/\\d{7,15}$/.test(url.pathname) && !!url.searchParams.get('text') &&
          link.target === '_blank' && link.rel.includes('noopener') && !!link.getAttribute('aria-label') &&
          rect.width >= 44 && rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
      })()`));
      check(`${context}: no horizontal page overflow`, state.width <= state.viewport);
      check(`${context}: all images load`, state.images.every(image => !image.broken));
      check(`${context}: all images have alternatives`, state.images.every(image => image.alt !== null));
      check(`${context}: no broken text encoding`, !/[\u00c2\u00c3]|\u00e2\u20ac/.test(state.text));
      for (const href of state.links) if (new URL(href).origin === new URL(base).origin) links.add(href);
      const result = await auditAccessibility(context);
      if (route === '/') {
        check(`${context}: product photos match their labels`, await evaluate("[...document.querySelectorAll('.product-card')].every(card=>{const slug=new URL(card.querySelector('a').href).hash.slice(1);return card.querySelector('img').currentSrc.includes('/'+slug+'-')})"));
        await evaluate("document.querySelector('picture source').remove()");
        await until("document.images[0].currentSrc.endsWith('.webp')&&document.images[0].complete&&document.images[0].naturalWidth>0");
        check(`${context}: WebP fallback works`, true);
      }
      await screenshot(`${width}-${route.slice(1) || 'home'}`);
      console.log(JSON.stringify({ context, accessibility: result.map(v => v.id), overflow: state.width > state.viewport }));
    }
  }

  if (process.env.QA_PRIMARY_ONLY === '1') {
    fs.writeFileSync('.preview/qa-report.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(item => !item.passed).length, accessibilityPages: report.accessibility.length }));
    await send('Browser.close'); ws.close();
    if (report.checks.some(item => !item.passed)) process.exitCode = 1;
    return;
  }

  for (const href of links) {
    const url = new URL(href);
    const response = await fetch(url.href);
    check(`Internal link: ${url.pathname + url.search}`, response.status === 200);
    if (url.hash) {
      const html = await response.text();
      const found = await evaluate(`!!new DOMParser().parseFromString(${JSON.stringify(html)},'text/html').getElementById(${JSON.stringify(decodeURIComponent(url.hash.slice(1)))})`);
      check(`Anchor target: ${url.pathname + url.hash}`, found);
    }
  }
  const robots = await fetch(base + '/robots.txt');
  check('Robots publishes the sitemap', robots.ok && (await robots.text()).includes('Sitemap: https://www.sinkronmeters.com/sitemap.xml'));
  const sitemap = await fetch(base + '/sitemap.xml');
  const sitemapBody = await sitemap.text();
  check('Sitemap includes all five canonical pages', sitemap.ok && routes.every(route => sitemapBody.includes(`<loc>https://www.sinkronmeters.com${route === '/' ? '' : route}</loc>`)));

  await viewport(390); await navigate('/products');
  await evaluate("document.querySelectorAll('.technical-disclosure').forEach(details=>details.open=true)");
  check('Expanded specifications remain inside the page', await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));
  await auditAccessibility('390 /products expanded specifications');

  for (const width of [320, 600, 768, 820, 1024, 1920, 2560]) {
    await viewport(width, width === 820 ? 375 : 900);
    for (const route of routes) {
      context = `${width} ${route}`; await navigate(route);
      check(`${context}: responsive width`, await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'));
      check(`${context}: navigation mode`, await evaluate(`getComputedStyle(document.querySelector(${width <= 1024 ? "'.menu-button'" : "'.desktop-nav'"})).display!=='none'`));
    }
  }

  await viewport(390); await navigate('/about'); context = 'Mobile menu';
  await evaluate("document.querySelector('.menu-button').click()"); await until("!!document.querySelector('#mobile-navigation')");
  await evaluate("document.querySelector('#mobile-navigation a[aria-current=page]').focus()");
  await auditAccessibility('390 /about open navigation');
  await viewport(1440); await sleep(200);
  check('Resizing to desktop closes the mobile menu', await evaluate("!document.querySelector('#mobile-navigation')"));
  check('Resize restores focus to visible navigation', await evaluate("document.activeElement.matches('.desktop-nav a')"));
  await viewport(390); await sleep(100);
  check('Mobile menu does not reopen after resizing back', await evaluate("!document.querySelector('#mobile-navigation')"));

  // Observe real playback and opacity interpolation, rather than only checking configuration.
  for (const width of [390, 768, 1280, 1920]) {
    context = `${width} hero playback`;
    await viewport(width); await navigate('/');
    await until("!!document.querySelector('.hero-image-slider')?.swiper?.autoplay.running");
    const before = await evaluate("document.querySelector('.home-hero-media').getBoundingClientRect().toJSON()");
    await evaluate("window.qaSlides=[];document.querySelector('.hero-image-slider').swiper.on('realIndexChange',swiper=>window.qaSlides.push({index:swiper.realIndex,time:performance.now()}));void 0");
    await until('window.qaSlides.length>=1');
    await sleep(250);
    check(`${context}: smooth fade and correct image crop`, await evaluate("(() => {const s=document.querySelector('.hero-image-slider').swiper;return s.params.effect==='fade'&&s.params.speed===900&&s.params.fadeEffect.crossFade&&[...s.slides].some(slide=>{const opacity=Number(getComputedStyle(slide).opacity);return opacity>0&&opacity<1})&&[...s.el.querySelectorAll('img')].every(image=>image.complete&&image.naturalWidth>0&&getComputedStyle(image).objectFit==='cover'&&getComputedStyle(image).objectPosition==='50% 50%')})()"));
    await until('window.qaSlides.length>=2');
    const playback = await evaluate('window.qaSlides');
    const interval = playback[1].time - playback[0].time;
    check(`${context}: autoplay changes slides every three seconds`, playback[0].index !== playback[1].index && interval >= 2700 && interval <= 3500, { intervalMs: Math.round(interval) });
    const after = await evaluate("document.querySelector('.home-hero-media').getBoundingClientRect().toJSON()");
    check(`${context}: no layout shift during autoplay`, ['x', 'y', 'width', 'height'].every(key => Math.abs(before[key] - after[key]) < .5) && await evaluate('window.qaMetrics.cls===0'));
  }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await evaluate("document.querySelector('.hero-image-slider').focus()");
  await until("document.querySelector('.hero-image-slider').matches(':focus-visible')&&!document.querySelector('.hero-image-slider').swiper.autoplay.running");
  const keyboardIndex = await evaluate("document.querySelector('.hero-image-slider').swiper.realIndex");
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  check('Hero supports keyboard arrows while autoplay is paused', await evaluate(`document.querySelector('.hero-image-slider').swiper.realIndex!==${keyboardIndex}`));
  await evaluate("document.querySelector('.hero-image-slider').blur()");
  await until("document.querySelector('.hero-image-slider').swiper.autoplay.running");
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await until("!document.querySelector('.hero-image-slider').swiper.autoplay.running&&document.querySelector('.hero-image-slider').swiper.params.speed===0");
  check('Reduced motion stops autoplay and fades', true);
  await send('Emulation.setEmulatedMedia', { features: [] });

  await viewport(390); await navigate('/contact');
  const focusFailures = [];
  for (let tab = 0; tab < 90; tab++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const focus = await evaluate("(() => {const e=document.activeElement,s=getComputedStyle(e);return {element:e.tagName,name:e.getAttribute('name')||e.getAttribute('aria-label')||e.textContent?.trim().slice(0,60),visible:e.matches(':focus-visible'),outlined:s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2,last:e.matches('.floating-whatsapp')}})()");
    if (!focus.visible || !focus.outlined) focusFailures.push(focus);
    if (focus.last) break;
  }
  check('Keyboard navigation has visible focus on all Contact controls', focusFailures.length === 0, focusFailures);

  context = 'Browser history and enquiry';
  await navigate('/contact?meter=single-jet&application=residential#enquiry-title');
  await until("document.querySelector('[name=meterType]')?.value==='Single-Jet'");
  check('Residential selection maps to Domestic', await evaluate("document.querySelector('[name=application]').value==='Domestic'"));
  await evaluate("window.originalFetch=window.fetch;window.qaRequests=0;window.enquiryMock=async()=>Response.json({error:'Please try again.'},{status:503});window.fetch=(input,options)=>{const url=typeof input==='string'?input:input.url||input.href;if(new URL(url,location.href).pathname==='/api/enquiry'&&(options?.method||input.method||'GET').toUpperCase()==='POST'){window.qaRequests++;return window.enquiryMock(input,options)}return window.originalFetch(input,options)};document.querySelector('form').requestSubmit()");
  check('Required fields prevent an empty enquiry', await evaluate("window.qaRequests===0&&document.activeElement.name==='name'"));
  await evaluate("document.querySelector('[name=name]').value='QA Test';document.querySelector('[name=email]').value='qa@example.com';document.querySelector('[name=phone]').value='abcdefghi';document.querySelector('form').requestSubmit()");
  check('Phone validation blocks letters before submission', await evaluate("window.qaRequests===0&&document.querySelector('[name=phone]').validity.customError&&document.activeElement.name==='phone'"));
  await evaluate("const phone=document.querySelector('[name=phone]');phone.value='1234567890';phone.dispatchEvent(new Event('input',{bubbles:true}))");
  check('Correcting the phone number clears its validation error', await evaluate("document.querySelector('[name=phone]').validity.valid"));
  await evaluate("document.querySelector('form').requestSubmit()");
  await until("!!document.querySelector('.form-error')");
  await auditAccessibility('390 /contact enquiry error');
  check('Error retains contact and selected meter', await evaluate("document.querySelector('[name=name]').value==='QA Test'&&document.querySelector('[name=meterType]').value==='Single-Jet'"));
  check('Error has phone and WhatsApp recovery', await evaluate("document.querySelectorAll('.form-recovery-links a').length===2"));
  await evaluate("window.enquiryMock=async()=>Response.json({ok:true});document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()");
  await until("!!document.querySelector('.enquiry-success-panel')");
  await auditAccessibility('390 /contact enquiry confirmation');
  check('Success removes the submitted form', await evaluate("!document.querySelector('form.enquiry-form')"));
  check('Duplicate submits send one enquiry request', await evaluate('window.qaRequests===2'));
  check('Confirmation is focused', await evaluate("document.activeElement===document.querySelector('.enquiry-success-panel')"));
  check('Success offers WhatsApp with the submitted details after the form resets', await evaluate(`(() => {
    const link = document.querySelector('.enquiry-success-actions a[href^="https://wa.me/"]');
    const contactLink = document.querySelector('.contact-channel[href^="https://wa.me/"]');
    if (!link || !contactLink) return false;
    const url = new URL(link.href), text = url.searchParams.get('text');
    return url.pathname === new URL(contactLink.href).pathname && link.target === '_blank' && link.rel.includes('noreferrer') &&
      text.includes('Name: QA Test') && text.includes('Phone: 1234567890') && text.includes('Email: qa@example.com') &&
      text.includes('Application: Domestic') && text.includes('Meter Type: Single-Jet') && !text.includes('Company:');
  })()`));
  await screenshot('mobile-confirmation');
  await evaluate("document.querySelector('.enquiry-success-actions button').click()");
  await until("!!document.querySelector('[name=name]')");
  check('A new enquiry clears customer details and retains the selected meter', await evaluate("document.querySelector('[name=name]').value===''&&document.querySelector('[name=meterType]').value==='Single-Jet'"));
  check('A new enquiry clears the previous WhatsApp link', await evaluate("!document.querySelector('.enquiry-success-actions a[href^=\"https://wa.me/\"]')"));
  await evaluate('window.fetch=window.originalFetch');

  context = 'Enquiry API error contracts';
  const apiCases = [
    { name: 'Malformed JSON returns 400', body: '{', type: 'application/json', status: 400 },
    { name: 'Unsupported format returns 415', body: '{}', type: 'text/plain', status: 415 },
    { name: 'Oversized body returns 413', body: JSON.stringify({ message: 'x'.repeat(20_000) }), type: 'application/json', status: 413 },
    { name: 'Honeypot is discarded without delivery', body: JSON.stringify({ website: 'qa-spam-field' }), type: 'application/json', status: 200 },
    { name: 'Invalid phone returns 400', body: JSON.stringify({ name: 'QA Test', phone: 'abcdefghi', email: 'qa@example.com' }), type: 'application/json', status: 400 },
  ];
  const rateKey = Date.now().toString(36);
  for (const item of apiCases) {
    // Isolate local QA rate-limit buckets; never submit a valid deliverable lead.
    const response = await fetch(base + '/api/enquiry', { method: 'POST', headers: { 'Content-Type': item.type, 'x-forwarded-for': `local-qa-${rateKey}-${item.name}` }, body: item.body });
    check(item.name, response.status === item.status);
  }

  const unknown = await fetch(base + '/qa-page-that-does-not-exist');
  check('Unknown routes return 404', unknown.status === 404);
  check('No JavaScript runtime errors', report.runtimeErrors.length === 0);
  check('No browser console errors', report.consoleErrors.length === 0, report.consoleErrors);
  check('No failed page or asset responses', report.badResponses.length === 0, report.badResponses);
  const failures = report.checks.filter(item => !item.passed);
  fs.writeFileSync('.preview/qa-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, failed: failures.length, accessibilityPages: report.accessibility.length, runtimeErrors: report.runtimeErrors.length, report: '.preview/qa-report.json' }));
  await send('Browser.close'); ws.close();
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); browserProcess.kill(); fs.writeFileSync('.preview/qa-report.json', JSON.stringify(report, null, 2)); process.exitCode = 1; });
