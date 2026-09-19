/**
 * Shared Playwright helpers for Adamas e2e / smoke tests.
 */

/** Prevent the welcome wizard from blocking clicks. Call before page.goto. */
async function seedWelcomeSeen(page) {
  await page.addInitScript(() => {
    try {
      const raw = localStorage.getItem('appSettings');
      const s = raw ? JSON.parse(raw) : {};
      s.hasSeenWelcome = true;
      localStorage.setItem('appSettings', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  });
}

/** Force-dismiss welcome if it still appears (defensive). */
async function dismissWelcomeOverlay(page) {
  await page.evaluate(() => {
    const o = document.getElementById('welcome-overlay');
    if (o) {
      o.classList.remove('active');
      o.setAttribute('aria-hidden', 'true');
      o.inert = true;
    }
    document.body.classList.remove('welcome-open');
    try {
      const raw = localStorage.getItem('appSettings');
      const s = raw ? JSON.parse(raw) : {};
      s.hasSeenWelcome = true;
      localStorage.setItem('appSettings', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  });
}

module.exports = { seedWelcomeSeen, dismissWelcomeOverlay };
