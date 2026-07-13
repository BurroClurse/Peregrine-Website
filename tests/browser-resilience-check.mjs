// Manual integration check. Start `python3 serve.py`, launch Chrome with remote
// debugging on port 9222, then run this script. SITE_URL and CHROME_DEBUG_URL
// may override the defaults below.
const DEBUG = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const TARGET = process.env.SITE_URL || "http://localhost:8099/public/";

const profiles = [
  { name: "phone", width: 390, height: 844, dpr: 3, mobile: true },
  { name: "tablet", width: 768, height: 1024, dpr: 2, mobile: true },
  { name: "desktop", width: 1440, height: 900, dpr: 2, mobile: false },
  { name: "phone-script-failure", width: 390, height: 844, dpr: 3, mobile: true, blockScript: true },
];

async function openTarget() {
  const response = await fetch(`${DEBUG}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Cannot open Chrome target: ${response.status}`);
  return response.json();
}

async function closeTarget(id) {
  await fetch(`${DEBUG}/json/close/${id}`).catch(() => {});
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Map();

    ws.addEventListener("open", () => {
      const send = (method, params = {}) => new Promise((resolveCommand, rejectCommand) => {
        const id = nextId++;
        pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
        ws.send(JSON.stringify({ id, method, params }));
      });
      const on = (method, listener) => {
        const methodListeners = listeners.get(method) || [];
        methodListeners.push(listener);
        listeners.set(method, methodListeners);
      };
      const once = (method) => new Promise((resolveEvent) => {
        const listener = (params) => {
          const methodListeners = listeners.get(method) || [];
          listeners.set(method, methodListeners.filter((candidate) => candidate !== listener));
          resolveEvent(params);
        };
        on(method, listener);
      });
      resolve({ ws, send, on, once });
    });

    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const handler = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) handler.reject(new Error(`${message.error.code}: ${message.error.message}`));
        else handler.resolve(message.result);
        return;
      }
      for (const listener of listeners.get(message.method) || []) listener(message.params);
    });
    ws.addEventListener("error", reject);
  });
}

async function runProfile(profile) {
  const target = await openTarget();
  const cdp = await connect(target.webSocketDebuggerUrl);
  const failedRequests = [];

  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: profile.width,
      height: profile.height,
      deviceScaleFactor: profile.dpr,
      mobile: profile.mobile,
    });
    if (profile.mobile) {
      await cdp.send("Network.setUserAgentOverride", {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      });
    }
    if (profile.blockScript) {
      await cdp.send("Network.setBlockedURLs", { urls: ["*script.js*"] });
    }
    cdp.on("Network.responseReceived", (event) => {
      if (event.response.url.startsWith(new URL(TARGET).origin) && event.response.status >= 400) {
        failedRequests.push(`${event.response.status} ${event.response.url}`);
      }
    });

    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: TARGET });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, profile.blockScript ? 500 : 1600));

    const evaluated = await cdp.send("Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const selectors = [
            '.hero__title-brand',
            '.hero__device img',
            '#measure',
            '#features .section__head',
            '#drift',
            '#kit',
            '.footer'
          ];
          const results = [];
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && ${profile.blockScript ? "false" : "true"}) {
              element.scrollIntoView({ block: 'center' });
              await wait(1050);
            }
            const style = element ? getComputedStyle(element) : null;
            const rect = element ? element.getBoundingClientRect() : null;
            results.push({
              selector,
              exists: Boolean(element),
              visible: Boolean(element && rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01),
              opacity: style && style.opacity,
            });
          }
          scrollTo(0, 0);
          const brokenImages = Array.from(document.querySelectorAll(
            '.brand__logo,.hero__title-brand,.hero__device img'
          ))
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src);
          return {
            title: document.title,
            viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            visible: results,
            brokenImages,
            inlineStyles: Boolean(document.querySelector('style[data-peregrine-styles]')),
            externalProductionStylesheet: Boolean(document.querySelector('link[href^="styles.css"]')),
            readinessClasses: document.querySelectorAll('.pe-reveal-ready,.pe-anim-ready,.pe-ix-ready').length,
            runtimeLoaded: typeof window.__peInitInteractions === 'function',
          };
        })()
      `,
    });
    if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.text);
    const result = evaluated.result.value;
    const invisible = result.visible.filter((entry) => !entry.exists || !entry.visible);
    const problems = [];
    if (result.title !== "Peregrine — Dry-Fire Laser Trainer") problems.push("document title missing");
    if (result.horizontalOverflow) problems.push("horizontal viewport overflow");
    if (invisible.length) problems.push(`invisible essentials: ${invisible.map((entry) => entry.selector).join(", ")}`);
    if (result.brokenImages.length) problems.push(`broken images: ${result.brokenImages.join(", ")}`);
    if (!result.inlineStyles || result.externalProductionStylesheet) problems.push("production CSS is not self-contained");
    if (profile.blockScript && (result.runtimeLoaded || result.readinessClasses !== 0)) {
      problems.push("script-failure fallback depends on runtime readiness classes");
    }
    if (!profile.blockScript && !result.runtimeLoaded) problems.push("runtime did not initialize");
    if (failedRequests.length) problems.push(`network failures: ${failedRequests.join(", ")}`);
    return { ...profile, ...result, failedRequests, problems };
  } finally {
    cdp.ws.close();
    await closeTarget(target.id);
  }
}

const results = [];
for (const profile of profiles) results.push(await runProfile(profile));
console.log(JSON.stringify(results, null, 2));

const failures = results.filter((result) => result.problems.length);
if (failures.length) {
  throw new Error(failures.map((result) => `${result.name}: ${result.problems.join("; ")}`).join("\n"));
}
