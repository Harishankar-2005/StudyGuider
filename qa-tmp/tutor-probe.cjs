// TEMP QA probe — AI Tutor bottom layout: chat panel end, input/send row,
// footer spacing, at desktop + short + mobile viewports, empty and seeded.
// Deleted after verification. Not part of the app.
const puppeteer = require("puppeteer-core");
const fs = require("node:fs");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:5174/tutor";
const OUT = path.join(__dirname, "shots5");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gotoWithRetry(page, url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 8000 });
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("dev server never came up");
}

const CASES = [
  { name: "tutor-1280", w: 1280, h: 800, seed: false },
  { name: "tutor-1280-short", w: 1280, h: 600, seed: false },
  { name: "tutor-1280-seeded", w: 1280, h: 800, seed: true },
  { name: "tutor-360", w: 360, h: 800, seed: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  try {
    for (const c of CASES) {
      const page = await browser.newPage();
      await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1 });
      await gotoWithRetry(page, BASE);
      await page.waitForSelector(".chat-shell", { timeout: 20000 });
      if (c.seed) {
        // Send two messages via suggestion chips to populate the log.
        for (let i = 0; i < 2; i++) {
          await page.evaluate(() => {
            const chip = document.querySelector(".suggestions .chip");
            if (chip) chip.click();
          });
          await sleep(1600);
        }
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await sleep(600);
      const geom = await page.evaluate(() => {
        const r = (el) => {
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return { y: Math.round(b.y), bottom: Math.round(b.bottom), h: Math.round(b.height) };
        };
        const cs = (el, props) => {
          const s = getComputedStyle(el);
          const o = {};
          for (const p of props) o[p] = s[p];
          return o;
        };
        const shell = document.querySelector(".chat-shell");
        const input = document.querySelector(".chat-input");
        const send = document.querySelector(".send-btn");
        const footer = document.querySelector(".footer");
        const sr = r(shell), fr = r(footer), ir = r(input);
        return {
          viewportH: window.innerHeight,
          shell: sr,
          shellStyle: cs(shell, ["minHeight", "maxHeight", "overflow", "paddingBottom"]),
          inputRow: ir,
          sendBtn: r(send),
          footer: fr,
          gapShellToFooter: fr.y - sr.bottom,
          overlap: fr.y < sr.bottom,
          inputVisible: ir.bottom <= window.innerHeight && ir.y >= 0,
          sendVisible: send ? r(send).bottom <= window.innerHeight && r(send).y >= 0 : null,
          msgCount: document.querySelectorAll(".msg-row").length,
        };
      });
      console.log(c.name, JSON.stringify(geom));
      await page.screenshot({ path: path.join(OUT, `${c.name}-bottom.png`) });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("PROBE FAILED:", e.message);
  process.exit(1);
});
