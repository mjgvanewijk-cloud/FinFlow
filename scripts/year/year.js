// scripts/year/year.js
//
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

/**
 * Resolve the absolute URL to the scenarios module in a way that works on:
 * - GitHub Pages project sites (https://<user>.github.io/<repo>/...)
 * - localhost/dev servers
 * - iOS Safari (strict module resolution + caching quirks)
 */
function getScenariosModuleUrl() {
  const { origin, pathname } = window.location;

  // GitHub Pages project site path is usually "/<repo>/..."
  // We take the first path segment as base if present.
  const seg = (pathname || "/").split("/").filter(Boolean)[0];
  const base = seg ? `/${seg}/` : "/";

  return `${origin}${base}scripts/ui/popup/scenarios/index.js`;
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
        // Robust: build an absolute URL that is correct under "/FinFlow/".
        const url = getScenariosModuleUrl();
        const mod = await import(url);
        mod.openScenariosSheet();
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
