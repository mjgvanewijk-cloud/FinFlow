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
          // FIX: Gebruik een direct relatief pad als string. 
          // Dit is veel betrouwbaarder voor iOS Safari op GitHub Pages dan de URL-constructor.
          // We behouden 'popup' (enkelvoud) omdat 'popups' eerder niet werkte.
          const mod = await import("../ui/popup/scenarios/index.js");
          
          if (mod && mod.openScenariosSheet) {
            mod.openScenariosSheet();
          } else {
            throw new Error("openScenariosSheet not found in module");
          }
        } catch (err) {
          console.error("[Scenarios] failed to load", err);
          // De alert blijft, maar we weten nu dat het import-proces zelf verbeterd is.
          alert("FinFlow: rekenmodellen konden niet laden. Controleer of het bestand 'scripts/ui/popup/scenarios/index.js' op GitHub staat.");
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
