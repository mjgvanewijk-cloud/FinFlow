// scripts/year/year.js

// Public entry for the Year module.
// This file stays small and stable: it wires UI entry points and delegates
// the Year Settings menu logic to dedicated modules.

import { currentYear } from "../core/state/index.js";
import { t } from "../i18n.js";

import { showTable, setOnDataChangedCallback } from "./year-settings-helpers.js";
import { openYearSettingsSheet } from "./year-settings-sheet.js";
import { CALCULATOR_SVG, GEAR_SVG } from "../ui/components/icons.js";
import { openErrorPopup } from "../ui/popup/error-popup.js";

export function initYearModule(onChange) {
  setOnDataChangedCallback(onChange);
  setupHeaderButtons();
  showTable();
}

function setupHeaderButtons() {
  const settingsBtn = document.getElementById("settingsBtn");
  const scenariosBtn = document.getElementById("scenariosBtn");

  if (settingsBtn && !settingsBtn.innerHTML) {
    settingsBtn.innerHTML = GEAR_SVG;
  }

  if (scenariosBtn && !scenariosBtn.innerHTML) {
    scenariosBtn.innerHTML = CALCULATOR_SVG;
  }

  if (scenariosBtn) {
    const lbl = t("ui_scenarios_nav_label");
    scenariosBtn.setAttribute("aria-label", lbl);
    scenariosBtn.setAttribute("title", lbl);
    scenariosBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Lazy-load scenarios to avoid boot failure on iOS when the module graph
      // is stale/cached or a single scenarios file fails to load.
      try {
        const mod = await import("../ui/popup/scenarios/index.js");
        mod.openScenariosSheet();
      } catch (err) {
        try { console.error("[FinFlow] scenarios sheet failed to load", err); } catch (_) {}

        // Use existing error sheet (same UI language via i18n where possible).
        const title = (typeof t === "function" && t("common.error")) || "Fout";
        const msg =
          (typeof t === "function" && t("messages.scenarios_load_failed")) ||
          "Rekenmodellen konden niet worden geladen. Sluit Safari volledig en open opnieuw. Helpt dat niet: wis websitegegevens voor GitHub Pages.";
        try { openErrorPopup(title, msg); } catch (_) { alert(title + "

" + msg); }
      }
    };
  }

  if (!settingsBtn) return;

  settingsBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openYearSettingsSheet(currentYear);
  };
}

export { openYearSettingsSheet, currentYear };