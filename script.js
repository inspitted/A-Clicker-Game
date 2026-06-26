/* ══════════════════════════════════════════════════
   VOID PROTOCOL — script.js
   Story Clicker Game · Full Game Logic
   Features: Click, Shop, Lore, Save/Load, Animations
   ══════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────────
// SECTION 1: GAME DATA DEFINITIONS
// ─────────────────────────────────────────────────

/**
 * Clicker upgrades — 6 tiers from 50 to 1,000,000 Insights.
 * basePrice: starting cost of first purchase
 * bonus: Insights added to clickMultiplier
 * priceScale: multiplier applied to price each time it is bought
 */
const UPGRADES = [
  { name: 'Rusty Key',              icon: '🗝',  basePrice: 50,       bonus: 2,     priceScale: 1.5, desc: 'A corroded key. To what door?' },
  { name: 'Decoder Ring',           icon: '🔵',  basePrice: 500,      bonus: 10,    priceScale: 1.5, desc: 'The symbols align just slightly.' },
  { name: 'Magnifying Glass',       icon: '🔎',  basePrice: 5000,     bonus: 50,    priceScale: 1.5, desc: 'You see things that were always there.' },
  { name: 'The Forbidden Journal',  icon: '📓',  basePrice: 50000,    bonus: 250,   priceScale: 1.5, desc: 'Its pages smell of burnt time.' },
  { name: 'Glitch in the System',   icon: '⚡',  basePrice: 250000,   bonus: 1500,  priceScale: 1.5, desc: 'Reality stutters. You keep clicking.' },
  { name: 'The Ultimate Truth',     icon: '◈',   basePrice: 1000000,  bonus: 10000, priceScale: 1.5, desc: 'REALITY BREAK. You are the anomaly.' },
];

/**
 * Story chapters — 4 lore unlocks.
 * Each contains a cost and multi-line story text (psychological thriller).
 */
const CHAPTERS = [
  {
    title:  'The Missing Page',
    icon:   '📄',
    cost:   100,
    lore: `You found it in your own handwriting — but you don't remember writing it.
A page torn from a journal you've never owned. The ink is still wet.
It reads: "They redact what they cannot explain. I am what they cannot explain."
At the bottom, a single instruction: KEEP CLICKING.`,
  },
  {
    title:  'Whispers in the Static',
    icon:   '📻',
    cost:   2000,
    lore: `Between frequencies — in the space where no signal should exist — a voice.
It knows your name. It knew it before you did.
"The Insights you gather are not knowledge," it whispers.
"They are permission slips. Permission to see what was always in the room with you."
You turn off the radio. The voice continues.`,
  },
  {
    title:  'The Mirrored Persona',
    icon:   '🪞',
    cost:   25000,
    lore: `The face in the mirror blinked three seconds after you did.
Not an error. Not fatigue. An acknowledgment.
The reflection leaned forward and mouthed two words you couldn't hear.
But you understood them completely.
You have been the observer and the observed all along.
There is no mirror.`,
  },
  {
    title:  'Waking Up',
    icon:   '∅',
    cost:   500000,
    lore: `It ends the same way it began: with you clicking.
But now you know the button was never a button.
It was a question — asked a thousand times — and every click was your answer.
The Insights were never points. They were memories.
Yours. Extracted. Catalogued.

You were the experiment.
VOID PROTOCOL is complete.

// Thank you for participating.
// Your data has been preserved.
// You may now rest. //`,
  },
];

// ─────────────────────────────────────────────────
// SECTION 2: GAME STATE
// ─────────────────────────────────────────────────

/**
 * Central game state object.
 * All fields here are persisted to / loaded from localStorage.
 */
let state = {
  insights:         0,           // Current Insights (points)
  clickMultiplier:  1,           // Insights earned per click
  upgradePrices:    UPGRADES.map(u => u.basePrice), // Current price of each upgrade
  upgradeBought:    new Array(UPGRADES.length).fill(0), // Times each upgrade purchased
  chaptersUnlocked: new Array(CHAPTERS.length).fill(false), // Unlock flags
};

// ─────────────────────────────────────────────────
// SECTION 3: DOM REFERENCES
// ─────────────────────────────────────────────────

const counterEl    = document.getElementById('counter');
const perClickEl   = document.getElementById('per-click');
const mysteryBtn   = document.getElementById('mystery-btn');
const upgradeList  = document.getElementById('upgrade-list');
const chapterList  = document.getElementById('chapter-list');
const loreLog      = document.getElementById('lore-log');
const saveStatus   = document.getElementById('save-status');

// ─────────────────────────────────────────────────
// SECTION 4: SAVE / LOAD (localStorage)
// ─────────────────────────────────────────────────

const SAVE_KEY = 'void_protocol_save_v1';

/**
 * saveGame()
 * Serializes the current game state to JSON and stores it in localStorage.
 * Called: manually via [ SAVE ] button, after each purchase, every 10 seconds.
 */
function saveGame() {
  try {
    const payload = {
      insights:         state.insights,
      clickMultiplier:  state.clickMultiplier,
      upgradePrices:    state.upgradePrices,
      upgradeBought:    state.upgradeBought,
      chaptersUnlocked: state.chaptersUnlocked,
      savedAt:          Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));

    // Flash save confirmation
    saveStatus.textContent = '✓ SAVED';
    saveStatus.style.opacity = '1';
    setTimeout(() => { saveStatus.style.opacity = '0'; }, 1800);
  } catch (e) {
    console.error('[VOID PROTOCOL] Save failed:', e);
  }
}

/**
 * loadGame()
 * Reads the save from localStorage and merges it into state.
 * Called once on DOMContentLoaded. Falls back to defaults if no save exists.
 */
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return; // No save — use defaults

    const saved = JSON.parse(raw);

    // Merge saved values safely (validate types to avoid corruption)
    if (typeof saved.insights        === 'number') state.insights         = saved.insights;
    if (typeof saved.clickMultiplier === 'number') state.clickMultiplier  = saved.clickMultiplier;
    if (Array.isArray(saved.upgradePrices))    state.upgradePrices    = saved.upgradePrices;
    if (Array.isArray(saved.upgradeBought))    state.upgradeBought    = saved.upgradeBought;
    if (Array.isArray(saved.chaptersUnlocked)) state.chaptersUnlocked = saved.chaptersUnlocked;

    console.info('[VOID PROTOCOL] Save loaded. Insights:', state.insights);
  } catch (e) {
    console.error('[VOID PROTOCOL] Load failed — starting fresh:', e);
  }
}

/**
 * resetGame()
 * Clears localStorage and resets state to defaults. Asks for confirmation.
 */
function resetGame() {
  if (!confirm('ERASE ALL PROGRESS?\nThis cannot be undone.')) return;
  localStorage.removeItem(SAVE_KEY);
  state.insights         = 0;
  state.clickMultiplier  = 1;
  state.upgradePrices    = UPGRADES.map(u => u.basePrice);
  state.upgradeBought    = new Array(UPGRADES.length).fill(0);
  state.chaptersUnlocked = new Array(CHAPTERS.length).fill(false);
  updateCounter();
  renderShop();
  renderLore();
}

// ─────────────────────────────────────────────────
// SECTION 5: CORE CLICK LOGIC
// ─────────────────────────────────────────────────

/**
 * handleClick(event)
 * Fired when the mystery button is tapped/clicked.
 * Adds insights, triggers animations, updates UI.
 */
function handleClick(e) {
  state.insights += state.clickMultiplier;
  updateCounter();
  renderShopAffordability();

  // Button press scale animation
  mysteryBtn.classList.add('clicked');
  setTimeout(() => mysteryBtn.classList.remove('clicked'), 130);

  // Counter bump animation
  counterEl.classList.add('bump');
  setTimeout(() => counterEl.classList.remove('bump'), 110);

  // Score pop-up floating text
  spawnScorePop(e.clientX, e.clientY, state.clickMultiplier);

  // Ripple at click position
  spawnRipple(e.clientX, e.clientY);
}

/**
 * updateCounter()
 * Refreshes the main counter display and per-click label.
 */
function updateCounter() {
  counterEl.textContent  = formatNumber(state.insights);
  perClickEl.textContent = `+${formatNumber(state.clickMultiplier)} per click`;
}

// ─────────────────────────────────────────────────
// SECTION 6: SHOP — UPGRADES
// ─────────────────────────────────────────────────

/**
 * renderShop()
 * Builds the full upgrade list and chapter list in the DOM.
 * Called once on load, and after each purchase.
 */
function renderShop() {
  // ── Clicker Upgrades ──
  upgradeList.innerHTML = UPGRADES.map((upg, i) => {
    const price    = state.upgradePrices[i];
    const count    = state.upgradeBought[i];
    const canAfford = state.insights >= price;
    const cls      = canAfford ? 'affordable' : 'cant-afford';

    return `
    <li class="shop-item ${cls}">
      <div class="shop-item-info">
        <div class="shop-item-name">${upg.icon} ${upg.name}${count > 0 ? ` <small style="color:#666">×${count}</small>` : ''}</div>
        <div class="shop-item-effect">+${formatNumber(upg.bonus)} Insights/click</div>
        <div class="shop-item-cost">Cost: ${formatNumber(price)} Insights</div>
      </div>
      <button class="shop-buy-btn" onclick="buyUpgrade(${i})" ${canAfford ? '' : 'disabled'}>
        BUY
      </button>
    </li>`;
  }).join('');

  // ── Story Chapter Unlocks ──
  chapterList.innerHTML = CHAPTERS.map((ch, i) => {
    const unlocked  = state.chaptersUnlocked[i];
    const canAfford = !unlocked && state.insights >= ch.cost;
    const cls       = unlocked ? 'chapter unlocked' : (canAfford ? 'chapter affordable' : 'chapter cant-afford');
    const btnLabel  = unlocked ? 'UNLOCKED' : 'UNLOCK';
    const btnClass  = unlocked ? 'chapter-btn' : 'chapter-btn';

    return `
    <li class="shop-item ${cls}">
      <div class="shop-item-info">
        <div class="shop-item-name">${ch.icon} ${ch.title}</div>
        <div class="shop-item-effect">Story Chapter</div>
        <div class="shop-item-cost">${unlocked ? 'Already read' : `Cost: ${formatNumber(ch.cost)} Insights`}</div>
      </div>
      <button class="shop-buy-btn ${btnClass}" onclick="unlockChapter(${i})" ${unlocked || !canAfford ? 'disabled' : ''}>
        ${btnLabel}
      </button>
    </li>`;
  }).join('');
}

/**
 * renderShopAffordability()
 * Lightweight pass — only updates disabled states without rebuilding DOM.
 */
function renderShopAffordability() {
  // Re-render fully (fast enough for click frequency)
  renderShop();
}

/**
 * buyUpgrade(index)
 * Deducts the cost, increases click multiplier, scales upgrade price by 1.5.
 */
function buyUpgrade(index) {
  const price = state.upgradePrices[index];
  if (state.insights < price) return; // Double-check

  state.insights         -= price;
  state.clickMultiplier  += UPGRADES[index].bonus;
  state.upgradePrices[index] = Math.round(price * UPGRADES[index].priceScale);
  state.upgradeBought[index]++;

  updateCounter();
  renderShop();
  saveGame(); // Auto-save on purchase
}

// ─────────────────────────────────────────────────
// SECTION 7: LORE CHAPTERS
// ─────────────────────────────────────────────────

/**
 * unlockChapter(index)
 * Deducts Insights and marks the chapter as unlocked.
 */
function unlockChapter(index) {
  const ch = CHAPTERS[index];
  if (state.chaptersUnlocked[index] || state.insights < ch.cost) return;

  state.insights -= ch.cost;
  state.chaptersUnlocked[index] = true;

  updateCounter();
  renderShop();
  renderLore();
  saveGame(); // Auto-save on unlock

  // Switch to Lore tab
  activateTab('panel-lore');
}

/**
 * renderLore()
 * Builds the Lore Log panel — showing unlocked chapters with full text,
 * and locked chapters as redacted placeholders.
 */
function renderLore() {
  loreLog.innerHTML = CHAPTERS.map((ch, i) => {
    const unlocked = state.chaptersUnlocked[i];
    const cls      = unlocked ? 'lore-chapter' : 'lore-chapter locked';
    const lockIcon = unlocked ? '▣' : '🔒';
    const body     = unlocked
      ? ch.lore.split('\n').map(line => `<p>${line || ' '}</p>`).join('')
      : '█ █████ ████ ██ █ ████████ ██████ █ ███ ██ ████ ███ █████ ████████.';

    return `
    <div class="${cls}">
      <div class="lore-chapter-header">
        <span class="lore-chapter-num">// CHAPTER ${i + 1}</span>
        <span class="lore-chapter-title">${ch.icon} ${ch.title}</span>
        <span class="lore-lock-icon">${lockIcon}</span>
      </div>
      <div class="lore-chapter-body">${body}</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────
// SECTION 8: VISUAL EFFECTS
// ─────────────────────────────────────────────────

/** spawnRipple(x, y) — Creates a DOM ripple element at pointer position */
function spawnRipple(x, y) {
  const el = document.createElement('div');
  el.className = 'ripple';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/** spawnScorePop(x, y, amount) — Floating +N score indicator */
function spawnScorePop(x, y, amount) {
  const el = document.createElement('div');
  el.className   = 'score-pop';
  el.textContent = `+${formatNumber(amount)}`;
  el.style.left  = (x - 10) + 'px';
  el.style.top   = (y - 10) + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ─────────────────────────────────────────────────
// SECTION 9: TAB NAVIGATION
// ─────────────────────────────────────────────────

/** activateTab(panelId) — Shows the target panel, hides others */
function activateTab(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(panelId).classList.add('active');
  document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('active');
}

// Wire up tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.panel));
});

// ─────────────────────────────────────────────────
// SECTION 10: UTILITY
// ─────────────────────────────────────────────────

/**
 * formatNumber(n)
 * Converts large numbers to readable suffixes: K, M, B
 */
function formatNumber(n) {
  n = Math.floor(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 10_000)        return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ─────────────────────────────────────────────────
// SECTION 11: INIT
// ─────────────────────────────────────────────────

/**
 * init()
 * Entry point — load save, wire events, render UI, start auto-save loop.
 */
function init() {
  // 1. Load saved game state from localStorage
  loadGame();

  // 2. Wire up the main click button
  mysteryBtn.addEventListener('click', handleClick);

  // 3. Render all UI elements
  updateCounter();
  renderShop();
  renderLore();

  // 4. Auto-save every 10 seconds
  setInterval(saveGame, 10_000);

  console.info('[VOID PROTOCOL] Initialized. Welcome back.');
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
