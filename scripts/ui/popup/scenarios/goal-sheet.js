// scripts/ui/popup/scenarios/goal-sheet.js

import { t } from "../../../i18n.js";
import { formatAmount2 } from "../../../core/format.js";
import { parseMoneyInput } from "../money-input.js";
import { createOverlayAndContainer, bindOverlayClose, makeCloseAll } from "./state.js";
import { attachMoneyEditUX, attachPercentEditUX, showInlineError } from "./_ux.js";

function parseNumber(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function openGoalScenarioSheet({ fromClose, onBack } = {}) {
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
      <h2 class="ff-popup__title ff-scenarios-title-center">${t("ui_scenarios_goal_title")}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body ff-scenario-body">
      <div class="ff-scenario-form">

        <label class="ff-scenario-label" for="ffGoalTarget">${t("ui_goal_target_amount")}</label>
        <input id="ffGoalTarget" class="ff-input" type="text" inputmode="decimal" placeholder="${t("common.amount_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffGoalMonths">${t("ui_goal_duration_months")}</label>
        <input id="ffGoalMonths" class="ff-input" type="text" inputmode="numeric" placeholder="${t("ui_goal_months_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffGoalRate">${t("ui_goal_rate_label")}</label>
        <div class="ff-scenario-percent-row">
          <input id="ffGoalRate" class="ff-input" type="text" inputmode="decimal" placeholder="${t("ui_percent_placeholder")}" value="">
          <div class="ff-scenario-percent">%</div>
        </div>

        <div class="ff-inline-error" id="ffScenarioInlineError" aria-live="polite">
          <span class="ff-inline-error__icon">!</span>
          <span class="ff-inline-error__text"></span>
        </div>

        <div class="ff-scenario-result" id="ffGoalResult" style="display:none;"></div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer ff-scenario-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffGoalCalc">${t("ui_scenarios_calculate")}</button>
      <button type="button" class="ff-btn ff-btn--secondary ff-btn--full" id="ffGoalBack">${t("common.back")}</button>
    </div>
  `;

  const inpTarget = container.querySelector("#ffGoalTarget");
  const inpMonths = container.querySelector("#ffGoalMonths");
  const inpRate = container.querySelector("#ffGoalRate");
  const resultBox = container.querySelector("#ffGoalResult");

  attachMoneyEditUX(inpTarget);
  attachPercentEditUX(inpRate);

  const calcBtn = container.querySelector("#ffGoalCalc");
  const backBtn = container.querySelector("#ffGoalBack");

  const doCalc = () => {
    showInlineError(container, "");
    if (resultBox) resultBox.style.display = "none";

    const target = parseMoneyInput(inpTarget?.value);
    const months = parseNumber(inpMonths?.value);
    const rateY = parseNumber(inpRate?.value) ?? 0;

    if (!target || target <= 0) {
      showInlineError(container, t("ui_scenario_error_target"));
      inpTarget?.setAttribute("aria-invalid", "true");
      return;
    }
    inpTarget?.removeAttribute("aria-invalid");

    if (!months || months <= 0) {
      showInlineError(container, t("ui_scenario_error_months"));
      inpMonths?.setAttribute("aria-invalid", "true");
      return;
    }
    inpMonths?.removeAttribute("aria-invalid");

    if (rateY < 0) {
      showInlineError(container, t("ui_scenario_error_rate"));
      inpRate?.setAttribute("aria-invalid", "true");
      return;
    }
    inpRate?.removeAttribute("aria-invalid");

    const n = Math.round(months);
    const r = rateY / 100 / 12;
    let pmt = 0;
    if (r === 0) pmt = target / n;
    else pmt = target * r / (Math.pow(1 + r, n) - 1);

    const contrib = pmt * n;
    const interestGain = target - contrib;

    if (resultBox) {
      resultBox.innerHTML = `
        <div class="ff-scenario-result-grid">
          <div class="ff-scenario-result-item">
            <div class="ff-scenario-result-label">${t("ui_goal_monthly_save")}</div>
            <div class="ff-scenario-result-value">${formatAmount2(pmt)}</div>
          </div>
          <div class="ff-scenario-result-item">
            <div class="ff-scenario-result-label">${t("ui_goal_interest_gain")}</div>
            <div class="ff-scenario-result-value">${formatAmount2(interestGain)}</div>
          </div>
        </div>
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
