// scripts/ui/popup/scenarios/_ux.js

import { parseMoneyInput } from "../money-input.js";

/**
 * UX helper:
 * - value > 0: caret achter laatste decimaal
 * - value == 0: maak input leeg
 */
export function attachMoneyEditUX(input) {
  if (!input) return;

  const apply = () => {
    try {
      const n = parseMoneyInput(input.value);
      if (n === 0) input.value = "";
    } catch (_) {}

    // caret naar einde (ook bij first tap op iOS)
    try {
      const len = (input.value || "").length;
      input.setSelectionRange(len, len);
    } catch (_) {}
  };

  // iPhone/Safari: first tap sometimes delays selection -> schedule
  input.addEventListener("focus", () => {
    apply();
    setTimeout(apply, 0);
  });
  input.addEventListener("click", () => {
    apply();
    setTimeout(apply, 0);
  });
}

export function attachPercentEditUX(input) {
  if (!input) return;
  const apply = () => {
    try {
      const raw = String(input.value || "").trim();
      const n = raw === "" ? null : Number(String(raw).replace(",", "."));
      if (n === 0) input.value = "";
    } catch (_) {}
    try {
      const len = (input.value || "").length;
      input.setSelectionRange(len, len);
    } catch (_) {}
  };
  input.addEventListener("focus", () => {
    apply();
    setTimeout(apply, 0);
  });
  input.addEventListener("click", () => {
    apply();
    setTimeout(apply, 0);
  });
}

export function showInlineError(container, msg) {
  const box = container?.querySelector?.("#ffScenarioInlineError");
  if (!box) return;
  if (!msg) {
    box.style.display = "none";
    box.querySelector(".ff-inline-error__text").textContent = "";
    return;
  }
  box.style.display = "flex";
  box.querySelector(".ff-inline-error__text").textContent = msg;
}
