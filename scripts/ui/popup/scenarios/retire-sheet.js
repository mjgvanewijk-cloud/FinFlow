// scripts/ui/popup/scenarios/retire-sheet.js

import { t } from "../../../i18n.js";
import { formatAmount2 } from "../../../core/format.js";
import { parseMoneyInput } from "../money-input.js";
import { createOverlayAndContainer, bindOverlayClose, makeCloseAll } from "./state.js";
import { attachMoneyEditUX, attachPercentEditUX, showInlineError } from "./ux.js";

function parseNumber(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function openRetireScenarioSheet({ fromClose, onBack } = {}) {
  // Close parent sheet first (menu)
  try { fromClose?.(); } catch (_) {}

  const { overlay, container, prevOverflow } = createOverlayAndContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--scenarios ff-scenarios-sheet ff-scenario-sheet"
  );
  const closeAll = makeCloseAll({ overlay, prevOverflow });
  bindOverlayClose(overlay, closeAll);
  document.body.appendChild(overlay);
  overlay.appendChild(container);

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title ff-scenarios-title-center">${t("ui_retire_title")}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body ff-scenario-body">
      <div class="ff-scenario-form">

        <label class="ff-scenario-label" for="ffRetireMonthly">${t("ui_retire_monthly_label")}</label>
        <input id="ffRetireMonthly" class="ff-input" type="text" inputmode="decimal" placeholder="${t("common.amount_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffRetireYears">${t("ui_retire_years_label")}</label>
        <input id="ffRetireYears" class="ff-input" type="text" inputmode="numeric" placeholder="${t("ui_retire_years_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffRetireRate">${t("ui_retire_rate_label")}</label>
        <div class="ff-scenario-percent-row">
          <input id="ffRetireRate" class="ff-input" type="text" inputmode="decimal" placeholder="${t("ui_percent_placeholder")}" value="">
          <div class="ff-scenario-percent">%</div>
        </div>

        <div class="ff-inline-error" id="ffScenarioInlineError" aria-live="polite">
          <span class="ff-inline-error__icon">!</span>
          <span class="ff-inline-error__text"></span>
        </div>

        <div class="ff-scenario-result" id="ffRetireResult" style="display:none;"></div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer ff-scenario-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffRetireCalc">${t("ui_scenarios_calculate")}</button>
      <button type="button" class="ff-btn ff-btn--secondary ff-btn--full" id="ffRetireBack">${t("common.back")}</button>
    </div>
  `;

  const inpMonthly = container.querySelector("#ffRetireMonthly");
  const inpYears = container.querySelector("#ffRetireYears");
  const inpRate = container.querySelector("#ffRetireRate");
  const resultBox = container.querySelector("#ffRetireResult");

  attachMoneyEditUX(inpMonthly);
  attachPercentEditUX(inpRate);

  const calcBtn = container.querySelector("#ffRetireCalc");
  const backBtn = container.querySelector("#ffRetireBack");

  const doCalc = () => {
    showInlineError(container, "");
    if (resultBox) resultBox.style.display = "none";

    const monthly = parseMoneyInput(inpMonthly?.value);
    const years = parseNumber(inpYears?.value);
    const rateY = parseNumber(inpRate?.value) ?? 0;

    if (!monthly || monthly <= 0) {
      showInlineError(container, t("ui_scenario_error_monthly"));
      inpMonthly?.setAttribute("aria-invalid", "true");
      return;
    }
    inpMonthly?.removeAttribute("aria-invalid");

    if (!years || years <= 0) {
      showInlineError(container, t("ui_scenario_error_years"));
      inpYears?.setAttribute("aria-invalid", "true");
      return;
    }
    inpYears?.removeAttribute("aria-invalid");

    if (rateY < 0) {
      showInlineError(container, t("ui_scenario_error_rate"));
      inpRate?.setAttribute("aria-invalid", "true");
      return;
    }
    inpRate?.removeAttribute("aria-invalid");

    const n = Math.round(years * 12);
    const r = rateY / 100 / 12;
    let pv = 0;
    if (r === 0) pv = monthly * n;
    else pv = monthly * (1 - Math.pow(1 + r, -n)) / r;

    const pvTxt = formatAmount2(pv);
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="ff-scenario-result-label">${t("ui_retire_target_label")}</div>
        <div class="ff-scenario-result-value">${pvTxt}</div>
      `;
      resultBox.style.display = "block";
    }
  };

  if (calcBtn) calcBtn.onclick = (e) => { e?.preventDefault?.(); doCalc(); };
  if (backBtn) backBtn.onclick = (e) => {
    e?.preventDefault?.();
    closeAll();
    // Retour naar het menu "Rekenmodellen" (scenarios) i.p.v. sluiten naar de app
    try { setTimeout(() => onBack?.(), 0); } catch (_) {}
  };
}
