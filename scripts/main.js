// scripts/main.js
import { initI18n, t } from "./i18n.js";
import { ensureTestActivationOrBlock } from "./core/state/test-license-gate.js";

import { undo, redo, canUndo, canRedo, enableHistory } from "./core/history/index.js";

// 1. Welkomstzaken via de centrale facade
import { openWelcomeOverlay, setupWelcomeStartHandler } from "./wizard/welcome.js";

// 2. Jaar & Maand modules
import { initYearModule } from "./year/year.js"; 
import { renderYear } from "./year/year-render.js";
import { changeYear, initYearEvents } from "./year/year-events.js";
import { initMonthModule } from "./month/month.js";

// 3. Core Engine
import { resetCaches } from "./core/engine/index.js";

// 4. State & Categorieën
import { initCategoriesModule, setCategoriesChangeHandler } from "./core/state/categories.js";
import { ensureSystemSavingAccount } from "./core/state/saving-accounts-data.js";

// 5. Overige modules
import { initBackupModule } from "./backup.js";
import { attachEscapeToClose, openConfirmPopup, openAppSettingsSheet } from "./ui/popups.js";
import { maybeShowSavingsDowngradeNotice } from "./core/state/premium-downgrade-savings-ui.js";
import { maybeHandleTrialExpiryDowngrade } from "./core/state/premium-trial-expiry-downgrade.js";

// Passieve context-help (wolkje + highlights bij idle)
import { initHelpCloud } from "./ui/helpcloud/index.js";

// ============================================================
// iOS/Safari diagnostics (only shows when boot fails)
// - Prevents the "black screen + only nav-pill" symptom from being silent
// - Does NOT change normal behavior when boot succeeds
// ============================================================

function showFatalBootOverlay(title, details) {
  try {
    // Avoid double overlays
    const existing = document.getElementById("ffFatalBootOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "ffFatalBootOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999";
    overlay.style.background = "rgba(0,0,0,.72)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.webkitBackdropFilter = "blur(10px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "16px";

    const card = document.createElement("div");
    card.style.width = "min(560px, 100%)";
    card.style.background = "rgba(28,28,30,.98)";
    card.style.border = "1px solid rgba(255,255,255,.14)";
    card.style.borderRadius = "18px";
    card.style.boxShadow = "0 18px 40px rgba(0,0,0,.45)";
    card.style.padding = "16px";
    card.style.color = "#fff";
    card.style.fontFamily = "-apple-system, system-ui, Segoe UI, Roboto, Arial";

    const h = document.createElement("div");
    h.style.fontSize = "16px";
    h.style.fontWeight = "800";
    h.style.marginBottom = "10px";
    h.textContent = title || "FinFlow kon niet starten";

    const p = document.createElement("pre");
    p.style.whiteSpace = "pre-wrap";
    p.style.wordBreak = "break-word";
    p.style.fontSize = "12px";
    p.style.lineHeight = "1.35";
    p.style.opacity = "0.92";
    p.style.margin = "0";
    p.textContent = String(details || "Onbekende fout");

    const hint = document.createElement("div");
    hint.style.marginTop = "12px";
    hint.style.fontSize = "12px";
    hint.style.opacity = "0.85";
    hint.textContent = "Tip: sluit Safari volledig (app switcher) en open opnieuw. Als dit blijft: wis Safari websitegegevens voor mjgvanewijk-cloud.github.io.";

    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(hint);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  } catch (_) {}
}

// Show runtime failures on-screen (iPhone Safari often hides console)
try {
  window.addEventListener("error", (e) => {
    const msg = e?.error?.stack || e?.message || String(e);
    showFatalBootOverlay("FinFlow runtime error", msg);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = e?.reason?.stack || e?.reason?.message || String(e?.reason || e);
    showFatalBootOverlay("FinFlow promise error", msg);
  });
} catch (_) {}

/**
 * Centraal beheer van data-wijzigingen.
 */
function handleDataChanged() {
    resetCaches();
    renderYear();
    // Undo/redo availability can change when data changes (snapshots, commit flows, etc.)
    try { window.__ffNavHistoryControls?.refresh?.(); } catch {}
}

// ============================================================
// NAV-PILL Undo/Redo controls
// - One source of truth: history canUndo/canRedo
// - One renderer: sets disabled + a dedicated CSS class
// - Safe boot-lock: starts grey on every boot; unlocks on first user intent
//   OR immediately when history becomes undo/redo-able (first snapshot)
// ============================================================

function createNavHistoryControls() {
  const getButtons = () => ({
    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
  });

  // Always start locked: both buttons grey on boot (clean start OR start with data).
  let locked = true;

  const setEnabled = (btn, enabled) => {
    if (!btn) return;
    const on = !!enabled;
    btn.disabled = !on;
    btn.classList.toggle("is-disabled", !on);
    btn.setAttribute("aria-disabled", on ? "false" : "true");
    if (on) btn.removeAttribute("tabindex");
    else btn.setAttribute("tabindex", "-1");
  };

  const renderLocked = () => {
    const { undoBtn, redoBtn } = getButtons();
    setEnabled(undoBtn, false);
    setEnabled(redoBtn, false);
  };

  const renderLive = () => {
    const { undoBtn, redoBtn } = getButtons();
    setEnabled(undoBtn, canUndo());
    setEnabled(redoBtn, canRedo());
  };

  const refresh = () => {
    // If we are locked but history becomes actionable (first snapshot, undo, redo), unlock immediately.
    const u = !!canUndo();
    const r = !!canRedo();
    if (locked && (u || r)) locked = false;

    if (locked) renderLocked();
    else renderLive();
  };

  const unlock = () => {
    if (!locked) return;
    // Single source of truth for "real user intent".
    // We set a dedicated flag that the history layer can rely on.
    // This prevents any boot/init storage mutations from accidentally
    // enabling Undo on a clean start.
    try { window.__finflowHistoryUserIntent = true; } catch {}
    locked = false;
    refresh();
  };

  const init = () => {
    // Expose for debugging / cross-module refreshes (kept minimal)
    try { window.__ffNavHistoryControls = { refresh, unlock }; } catch {}

    // Default: no user intent yet.
    // (We intentionally do NOT reuse __finflowUserInteracted here because
    // it can be true due to earlier sessions / edge cases.)
    try { window.__finflowHistoryUserIntent = false; } catch {}

    // Initial paint: grey.
    refresh();

    // React to history changes.
    window.addEventListener("finflow-history-changed", refresh);

    // First real user intent: unlock even if history is still empty (stays grey, but future history will go blue).
    window.addEventListener("pointerdown", unlock, { capture: true, once: true });
    window.addEventListener("keydown", unlock, { capture: true, once: true });
  };

  return { init, refresh, unlock };
}




function showUndoRedoInfo(_res, op) {
  const titleKey = op === "redo" ? "history.redo_title" : "history.undo_title";
  const msgKey = op === "redo" ? "history.redo_msg" : "history.undo_msg";

  // Simpel: altijd dezelfde oranje melding, geen details/what/reasoning.
  setTimeout(() => {
    openConfirmPopup({
      variant: "warning",
      title: t(titleKey),
      message: t(msgKey),
      confirmLabel: t("common.close"),
      cancelLabel: null,
      hideCancel: true,
    });
  }, 0);
}


function setupUndoRedoUI() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  // Centralized state/renderer (replaces scattered disabled/color toggling).
  const controls = createNavHistoryControls();
  controls.init();

  if (undoBtn) {
    undoBtn.setAttribute("aria-label", t("common.undo"));
    undoBtn.setAttribute("title", t("common.undo"));
    undoBtn.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Button state is controlled by the nav-history controls.
  if (undoBtn.disabled || !canUndo()) return;
  const res = undo();
  if (res) {
    handleDataChanged();
    showUndoRedoInfo(res, "undo");
  }
};
  }

  if (redoBtn) {
    redoBtn.setAttribute("aria-label", t("common.redo"));
    redoBtn.setAttribute("title", t("common.redo"));
    redoBtn.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (redoBtn.disabled || !canRedo()) return;
  const res = redo();
  if (res) {
    handleDataChanged();
    showUndoRedoInfo(res, "redo");
  }
};
  }
}

window.handleDataChanged = handleDataChanged;

function updateStaticUI() {
    // IMPORTANT (iPhone/Safari + GitHub Pages): localStorage can contain
    // corrupted/partial JSON strings after upgrades or storage pressure.
    // Never JSON.parse the raw string here; use the hardened loader.
    let settings = {};
    try {
      // loadSettings() already provides defaults + safe parse.
      settings = (typeof loadSettings === "function" ? loadSettings() : {}) || {};
    } catch (_) {
      settings = {};
    }
    const isPremium = settings.isPremium === true;

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        let key = el.getAttribute('data-i18n');
        if (key === 'common.app_title' && isPremium) key = 'common.app_title_premium';

        const translation = t(key);
        if (translation) el.textContent = translation;
    });
}

window.addEventListener('premium-activated', () => {
    handleDataChanged();
    updateStaticUI();
});

function setupNavPill() {
    const zoneLeft = document.getElementById("navZoneLeft");
    const zoneCenter = document.getElementById("navZoneCenter");
    const zoneRight = document.getElementById("navZoneRight");
    const pill = document.getElementById("yearNavPill");

    function flash(side) {
        if (!pill) return null;
        const className = side === 'left' ? 'highlight-left' : 'highlight-right';
        pill.classList.add(className);
        setTimeout(() => pill.classList.remove(className), 160);
    }

    if (zoneLeft) zoneLeft.onclick = () => { flash('left'); changeYear(-1); };
    if (zoneRight) zoneRight.onclick = () => { flash('right'); changeYear(1); };
    if (zoneCenter) {
        zoneCenter.onclick = (e) => {
            if (e) e.stopPropagation();
            return;
        };
    }
}

function setupMainSettingsButton() {
    const btn = document.getElementById("mainsettings");
    if (!btn) return;

    // Override the legacy dev-panel toggle (index.html) with the new Settings sheet.
    btn.onclick = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        openAppSettingsSheet();
    };
}

/**
 * DE NIEUWE OPSTART-MOTOR
 */
async function bootApp() {
    // Track first real user interaction (needed for clean-start history rules).
    // Must be independent from the booting flag: starting with data unlocks booting automatically,
    // but user-interaction should only flip on actual pointer/keyboard input.
    if (window.__finflowUserInteracted !== true) window.__finflowUserInteracted = false;
    if (!window.__FF_USER_INTERACT_LISTENERS__) {
        window.__FF_USER_INTERACT_LISTENERS__ = true;
        const markUser = () => {
            if (window.__finflowUserInteracted === true) return;
            window.__finflowUserInteracted = true;
            // Re-evaluate undo/redo when the first user interaction happens.
            try { window.__ffNavHistoryControls?.unlock?.(); } catch {}
        };
        window.addEventListener('pointerdown', markUser, { capture: true, once: true });
        window.addEventListener('keydown', markUser, { capture: true, once: true });
    }

    // Detect a *true* clean start BEFORE any init code writes defaults.
    const __isHardCleanStart =
      !localStorage.getItem('finflow_settings') &&
      !localStorage.getItem('finflow_history_v1');

    
    // History must be enabled before we unlock booting (otherwise first edits are not undoable).
    window.__finflowHistoryReady = false;

let __bootFinalized = false;
    const finalizeBoot = () => {
        if (__bootFinalized) return;
        __bootFinalized = true;

        const unlock = () => {
            if (window.__finflowBooting === false) return;
            window.__finflowBooting = false;
            try { window.__ffNavHistoryControls?.refresh?.(); } catch {}
            try { window.dispatchEvent(new CustomEvent("finflow-history-changed")); } catch {}
        };

        if (__isHardCleanStart) {
            // Clean start: keep booting=true until first real user input.
            window.addEventListener('pointerdown', unlock, { capture: true, once: true });
            window.addEventListener('keydown', unlock, { capture: true, once: true });
            try { window.__ffNavHistoryControls?.refresh?.(); } catch {}
            return;
        }

        // Start with data: keep booting=true until the first real user input,
        // but only allow unlock after history is enabled (otherwise first edits are not undoable).
        const armUnlockOnInput = () => {
            const unlockIfReady = () => {
                if (window.__finflowHistoryReady !== true) return;
                unlock();
            };
            window.addEventListener('pointerdown', unlockIfReady, { capture: true, once: true });
            window.addEventListener('keydown', unlockIfReady, { capture: true, once: true });
        };

        if (window.__finflowHistoryReady === true) {
            armUnlockOnInput();
        } else {
            const waitForHistory = () => {
                if (window.__finflowHistoryReady === true) return armUnlockOnInput();
                setTimeout(waitForHistory, 0);
            };
            waitForHistory();
        }
    };
    try {
        window.__finflowBooting = true;
        await initI18n('nl'); 
        updateStaticUI();

        // Testversie gate (device-bound activatiecode)
        const __ffLicenseOk = await ensureTestActivationOrBlock();
        if (!__ffLicenseOk) {
            window.__finflowBooting = false;
            return;
        }

        try {
            ensureSystemSavingAccount();
        } catch (e) {
            // Tekst aangepast naar i18n
            console.warn(t("errors.boot.system_account_failed"), e);
        }

        initYearModule(handleDataChanged);
        initYearEvents(handleDataChanged); 
        
        initMonthModule(handleDataChanged);
        initCategoriesModule();
        
        attachEscapeToClose();

        initBackupModule(handleDataChanged);
        setCategoriesChangeHandler(handleDataChanged);
        
        setupWelcomeStartHandler();
        initHelpCloud({ idleMs: 5000 });
        setupNavPill();
        setupMainSettingsButton();
        setupUndoRedoUI();

        handleDataChanged();
        // Never parse raw localStorage here; use hardened loader.
        const settings = loadSettings() || {};
        
        if (!settings.welcomeShown) {
            document.body.classList.add('wizard-active');
            // ... (UI logica voor wizard)
            openWelcomeOverlay(); 
        } else {
            maybeShowSavingsDowngradeNotice();
        }

        // Trial expiry: prompt + (optioneel) downgrade toepassen
        try { maybeHandleTrialExpiryDowngrade(); } catch (e) { console.warn('trial downgrade check failed', e); }

        // Eerst geschiedenis aanzetten (restore) en baseline borgen
        enableHistory({ reset: true });
        window.__finflowHistoryReady = true;
} catch (e) {
        // Tekst aangepast naar i18n
        console.error(t("errors.boot.critical_failed"), e.message, e.stack);
        // Also surface on-screen (prevents silent black screen on iPhone)
        showFatalBootOverlay(t("errors.boot.critical_failed"), e?.stack || e?.message || String(e));
    }
    finally {
        finalizeBoot();
    }
}

// Start de applicatie
bootApp();

     
