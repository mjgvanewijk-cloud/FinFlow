// scripts/ui/popup/scenarios/state.js

import { createPopupOverlay, createPopupContainer } from "../overlay.js";

export function createOverlayAndContainer(containerClass) {
  const overlay = createPopupOverlay("ff-overlay-center");
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer(containerClass);
  try {
    if (container && container.dataset) container.dataset.ffHelpContext = "mute";
  } catch (_) {}

  return { overlay, container, prevOverflow };
}

export function bindOverlayClose(overlay, closeAll) {
  overlay.__ff_onCancel = closeAll;
  overlay.onclick = (e) => {
    if (e && e.target === overlay) closeAll();
  };
}

export function makeCloseAll({ overlay, prevOverflow }) {
  return () => {
    try {
      document.body.style.overflow = prevOverflow || "";
    } catch (_) {}
    try {
      if (overlay && overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    } catch (_) {}
    try {
      overlay?.remove();
    } catch (_) {}
  };
}
