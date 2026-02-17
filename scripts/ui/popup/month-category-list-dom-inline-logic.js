// scripts/ui/popup/month-category-list-dom-inline-logic.js

import { parseMoneyInput } from "./money-input.js";

export function getSelectedScope(editor, radioName) {
  const r = editor.querySelector(`input[type="radio"][name="${radioName}"]:checked`);
  return r ? r.value : "only";
}

export function setSelectedScope(editor, radioName, scope) {
  const s = scope === "from" || scope === "year" || scope === "only" ? scope : "only";
  const r = editor.querySelector(`input[type="radio"][name="${radioName}"][value="${s}"]`);
  if (r) r.checked = true;
}

export function prepareForEdit(amountInput, preEditValue) {
  const currentVal = String(amountInput.value || preEditValue || "");
  const numRaw = parseMoneyInput(currentVal);
  const num = numRaw == null ? NaN : numRaw;

  // UX rule:
  // - If value is exactly 0 -> clear field immediately.
  // - Otherwise -> caret to end (behind last decimal).
  if (num === 0) {
    try { amountInput.value = ""; } catch (_) {}
    try { amountInput.setSelectionRange(0, 0); } catch (_) {}
    return "";
  }

  try {
    const len = currentVal.length;
    amountInput.setSelectionRange(len, len);
  } catch (_) {}
  return currentVal;
}
