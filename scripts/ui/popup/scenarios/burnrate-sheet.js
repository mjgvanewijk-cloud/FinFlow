// scripts/ui/popup/scenarios/burnrate-sheet.js

import { t } from "../../../i18n.js";
import { parseMoneyInput } from "../money-input.js";
import { createOverlayAndContainer, bindOverlayClose, makeCloseAll } from "./state.js";
import { attachMoneyEditUX, attachPercentEditUX, showInlineError } from "./ux.js";

function parseNumber(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function openBurnrateScenarioSheet({ fromClose, onBack } = {}) {
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
      <h2 class="ff-popup__title ff-scenarios-title-center">${t("ui_burnrate_title")}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body ff-scenario-body">
      <div class="ff-scenario-form">

        <label class="ff-scenario-label" for="ffBurnBalance">${t("ui_burnrate_balance_label")}</label>
        <input id="ffBurnBalance" class="ff-input" type="text" inputmode="decimal" placeholder="${t("common.amount_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffBurnMonthly">${t("ui_burnrate_monthly_label")}</label>
        <input id="ffBurnMonthly" class="ff-input" type="text" inputmode="decimal" placeholder="${t("common.amount_placeholder")}" value="">

        <label class="ff-scenario-label" for="ffBurnRate">${t("ui_burnrate_rate_label")}</label>
        <div class="ff-scenario-percent-row">
          <input id="ffBurnRate" class="ff-input" type="text" inputmode="decimal" placeholder="${t("ui_percent_placeholder")}" value="">
          <div class="ff-scenario-percent">%</div>
        </div>

        <div class="ff-inline-error" id="ffScenarioInlineError" aria-live="polite">
          <span class="ff-inline-error__icon">!</span>
          <span class="ff-inline-error__text"></span>
        </div>

        <div class="ff-scenario-result" id="ffBurnResult" style="display:none;"></div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer ff-scenario-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffBurnCalc">${t("ui_scenarios_calculate")}</button>
      <button type="button" class="ff-btn ff-btn--secondary ff-btn--full" id="ffBurnBack">${t("common.back")}</button>
    </div>
  `;

  const inpBalance = container.querySelector("#ffBurnBalance");
  const inpMonthly = container.querySelector("#ffBurnMonthly");
  const inpRate = container.querySelector("#ffBurnRate");
  const resultBox = container.querySelector("#ffBurnResult");

  attachMoneyEditUX(inpBalance);
  attachMoneyEditUX(inpMonthly);
  attachPercentEditUX(inpRate);

  const calcBtn = container.querySelector("#ffBurnCalc");
  const backBtn = container.querySelector("#ffBurnBack");

  const doCalc = () => {
    showInlineError(container, "");
    if (resultBox) resultBox.style.display = "none";

    const balance0 = parseMoneyInput(inpBalance?.value);
    const monthly = parseMoneyInput(inpMonthly?.value);
    const rateY = parseNumber(inpRate?.value) ?? 0;

    if (!balance0 || balance0 <= 0) {
      showInlineError(container, t("ui_scenario_error_balance"));
      inpBalance?.setAttribute("aria-invalid", "true");
      return;
    }
    inpBalance?.removeAttribute("aria-invalid");

    if (!monthly || monthly <= 0) {
      showInlineError(container, t("ui_scenario_error_monthly"));
      inpMonthly?.setAttribute("aria-invalid", "true");
      return;
    }
    inpMonthly?.removeAttribute("aria-invalid");

    if (rateY < 0) {
      showInlineError(container, t("ui_scenario_error_rate"));
      inpRate?.setAttribute("aria-invalid", "true");
      return;
    }
    inpRate?.removeAttribute("aria-invalid");

    const r = rateY / 100 / 12;
    let bal = balance0;
    let months = 0;
    const maxMonths = 1200; // 100 jaar safeguard
    while (bal > 0 && months < maxMonths) {
      bal = bal * (1 + r) - monthly;
      months += 1;
    }

    const msg = t("ui_burnrate_result", { months: String(months) });
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="ff-scenario-result-label">${t("ui_burnrate_result_label")}</div>
        <div class="ff-scenario-result-value">${msg}</div>
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
