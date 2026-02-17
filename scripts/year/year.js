// scripts/year/year.js

// Public entry for the Year module.
// This file stays small and stable: it wires UI entry points and delegates
// the Year Settings menu logic to dedicated modules.

import { currentYear } from "../core/state/index.js";
import { t } from "../i18n.js";

import { showTable, setOnDataChangedCallback } from "./year-settings-helpers.js";
import { openYearSettingsSheet } from "./year-settings-sheet.js";
import { CALCULATOR_SVG, GEAR_SVG } from "../ui/components/icons.js";

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

    scenariosBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      (async () => {
        try {
          // FIX: Gebruik 'popups' (meervoud) en een direct relatief pad
          // Dit is veel robuuster voor iOS Safari op GitHub Pages
          const mod = await import("../ui/popups/scenarios/index.js");
          mod.openScenariosSheet();
        } catch (err) {
          console.error("[Scenarios] failed to load", err);
          // De i18n melding blijft behouden zoals je wenste
          alert("FinFlow: rekenmodellen konden niet laden. Controleer of de map 'scripts/ui/popups/scenarios/' bestaat.");
        }
      })();
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
