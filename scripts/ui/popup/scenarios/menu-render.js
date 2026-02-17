// scripts/ui/popup/scenarios/menu-render.js

import { t } from "../../../i18n.js";

export function renderScenariosMenu(container, { onClose, onOpenRetire, onOpenBurnrate, onOpenGoal } = {}) {
  const title = t("ui_scenarios_title");
  const intro = t("ui_scenarios_intro");

  container.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title ff-scenarios-title-center">${title}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body ff-scenario-body">
      <div class="ff-scenarios-intro">${intro}</div>

      <div class="ff-settings-list ff-scenarios-list">
        <button type="button" class="ff-settings-row ff-scenarios-row" id="ffScenarioRetire">
          <div class="ff-scenarios-row-text">
            <div class="ff-scenarios-row-title">${t("ui_retire_title")}</div>
            <div class="ff-scenarios-row-sub">${t("ui_scenarios_retire_sub")}</div>
          </div>
          <div class="ff-settings-chev" aria-hidden="true">›</div>
        </button>

        <button type="button" class="ff-settings-row ff-scenarios-row" id="ffScenarioBurnrate">
          <div class="ff-scenarios-row-text">
            <div class="ff-scenarios-row-title">${t("ui_burnrate_title")}</div>
            <div class="ff-scenarios-row-sub">${t("ui_scenarios_burn_sub")}</div>
          </div>
          <div class="ff-settings-chev" aria-hidden="true">›</div>
        </button>

        <button type="button" class="ff-settings-row ff-scenarios-row" id="ffScenarioGoal">
          <div class="ff-scenarios-row-text">
            <div class="ff-scenarios-row-title">${t("ui_scenarios_goal_title")}</div>
            <div class="ff-scenarios-row-sub">${t("ui_scenarios_goal_sub")}</div>
          </div>
          <div class="ff-settings-chev" aria-hidden="true">›</div>
        </button>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" class="ff-btn ff-btn--primary" id="ffScenariosClose">
        ${t("common.close")}
      </button>
    </div>
  `;

  const closeBtn = container.querySelector("#ffScenariosClose");
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      if (e) e.preventDefault();
      try { onClose?.(); } catch (_) {}
    };
  }

  const btnRetire = container.querySelector("#ffScenarioRetire");
  if (btnRetire) {
    btnRetire.onclick = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      try { onOpenRetire?.(); } catch (_) {}
    };
  }

  const btnBurn = container.querySelector("#ffScenarioBurnrate");
  if (btnBurn) {
    btnBurn.onclick = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      try { onOpenBurnrate?.(); } catch (_) {}
    };
  }

  const btnGoal = container.querySelector("#ffScenarioGoal");
  if (btnGoal) {
    btnGoal.onclick = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      try { onOpenGoal?.(); } catch (_) {}
    };
  }
}
