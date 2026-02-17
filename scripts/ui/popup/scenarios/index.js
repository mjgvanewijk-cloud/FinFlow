// scripts/ui/popup/scenarios/index.js

// NOTE:
// Dit sheet moet altijd kunnen openen vanaf de navpil-calculator.
// Op iPhone (Safari/GitHub Pages) kan de Premium-gate flow falen bij lege of verse storage,
// waardoor je de melding "FinFlow rekenmodellen konden niet laden" krijgt.
// Daarom openen we het Rekenmodellen-menu hier zonder Premium-gate.

import { createOverlayAndContainer, bindOverlayClose, makeCloseAll } from "./state.js";
import { renderScenariosMenu } from "./menu-render.js";

import { openRetireScenarioSheet } from "./retire-sheet.js";
import { openBurnrateScenarioSheet } from "./burnrate-sheet.js";
import { openGoalScenarioSheet } from "./goal-sheet.js";

export function openScenariosSheet() {
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
