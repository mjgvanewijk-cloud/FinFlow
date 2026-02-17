// scripts/ui/popup/scenarios-sheet.js

import { t } from "../../i18n.js";
import { isPremiumActiveForUI, openPremiumTrialPopup } from "../../core/state/premium.js";
import { openActionSheet } from "./action-sheet.js";

function openScenarioInfoSheet(kind) {
  const defs = {
    retire: { title: t("ui_retire_title"), subtitle: t("scenarios.retire_desc") },
    burnrate: { title: t("ui_burnrate_title"), subtitle: t("scenarios.burnrate_desc") },
    goal: { title: t("scenarios.goal_title"), subtitle: t("scenarios.goal_desc") },
  };
  const def = defs[kind] || defs.goal;
  openActionSheet({
    title: def.title,
    subtitle: `${def.subtitle}<br><br><strong>${t("scenarios.coming_soon_title")}</strong><br>${t("scenarios.coming_soon_body")}`,
    actions: [],
    closeLabel: t("common.close"),
  });
}

function openScenariosSheetInternal() {
  openActionSheet({
    title: t("scenarios.sheet_title"),
    subtitle: t("scenarios.sheet_subtitle"),
    actions: [
      { label: t("scenarios.option_retire"), onClick: () => openScenarioInfoSheet("retire") },
      { label: t("scenarios.option_burnrate"), onClick: () => openScenarioInfoSheet("burnrate") },
      { label: t("scenarios.option_goal"), onClick: () => openScenarioInfoSheet("goal") },
    ],
    closeLabel: t("common.close"),
  });
}

export function openScenariosSheet() {
  // Soft premium wall: always show that this is a Premium feature.
  if (isPremiumActiveForUI()) {
    openScenariosSheetInternal();
    return;
  }
  openPremiumTrialPopup(() => {
    openScenariosSheetInternal();
  }, {
    title: t("scenarios.premium_gate_title"),
    topText: t("scenarios.premium_gate_top"),
  });
}
