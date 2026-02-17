// scripts/ui/popup/scenarios/index.js

import { t } from "../../../i18n.js";
import { isPremiumActiveForUI, openPremiumTrialPopup } from "../../../core/state/premium.js";

import { createOverlayAndContainer, bindOverlayClose, makeCloseAll } from "./state.js";
import { renderScenariosMenu } from "./menu-render.js";

import { openRetireScenarioSheet } from "./retire-sheet.js";
import { openBurnrateScenarioSheet } from "./burnrate-sheet.js";
import { openGoalScenarioSheet } from "./goal-sheet.js";

export function openScenariosSheet() {
  // Premium wall aanwezig, maar (in jouw testversie) zal dit doorgaans direct doorgaan
  // doordat premium.active = true gezet is.
  if (!isPremiumActiveForUI()) {
    openPremiumTrialPopup(
      () => {
        try { openScenariosSheet(); } catch (_) {}
      },
      {
        title: t("messages.premium_scenarios_title"),
        topText: t("messages.premium_scenarios_top"),
      }
    );
    return;
  }

  const { overlay, container, prevOverflow } = createOverlayAndContainer(
    "ff-month-category-sheet ff-month-category-card ff-month-category-sheet--scenarios ff-scenarios-sheet"
  );

  const closeAll = makeCloseAll({ overlay, prevOverflow });
  bindOverlayClose(overlay, closeAll);

  document.body.appendChild(overlay);
  overlay.appendChild(container);

  renderScenariosMenu(container, {
    onClose: closeAll,
    onOpenRetire: () => openRetireScenarioSheet({ fromClose: closeAll, onBack: () => openScenariosSheet() }),
    onOpenBurnrate: () => openBurnrateScenarioSheet({ fromClose: closeAll, onBack: () => openScenariosSheet() }),
    onOpenGoal: () => openGoalScenarioSheet({ fromClose: closeAll, onBack: () => openScenariosSheet() }),
  });
}
