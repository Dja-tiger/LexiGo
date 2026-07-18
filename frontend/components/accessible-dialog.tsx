"use client";

import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type ElementSnapshot = {
  hadInert: boolean;
  ariaHidden: string | null;
};

type BodySnapshot = {
  overflow: string;
  paddingRight: string;
};

const dialogStack: HTMLElement[] = [];
const elementSnapshots = new Map<HTMLElement, ElementSnapshot>();
let bodySnapshot: BodySnapshot | null = null;

function restoreElement(element: HTMLElement, snapshot: ElementSnapshot) {
  if (snapshot.hadInert) element.setAttribute("inert", "");
  else element.removeAttribute("inert");

  if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
  else element.setAttribute("aria-hidden", snapshot.ariaHidden);
}

function rememberElement(element: HTMLElement) {
  if (elementSnapshots.has(element)) return;
  elementSnapshots.set(element, {
    hadInert: element.hasAttribute("inert"),
    ariaHidden: element.getAttribute("aria-hidden"),
  });
}

function restoreBackground() {
  for (const [element, snapshot] of elementSnapshots) {
    if (element.isConnected) restoreElement(element, snapshot);
  }
  elementSnapshots.clear();
}

function lockBodyScroll() {
  if (bodySnapshot) return;
  bodySnapshot = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  };

  const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
}

function unlockBodyScroll() {
  if (!bodySnapshot) return;
  document.body.style.overflow = bodySnapshot.overflow;
  document.body.style.paddingRight = bodySnapshot.paddingRight;
  bodySnapshot = null;
}

function synchronizeModalIsolation() {
  restoreBackground();
  const topDialog = dialogStack.at(-1);
  if (!topDialog) {
    unlockBodyScroll();
    return;
  }

  lockBodyScroll();
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement) || child === topDialog) continue;
    if (child.matches("script, style, link")) continue;
    rememberElement(child);
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
}

function registerDialog(portalRoot: HTMLElement) {
  dialogStack.push(portalRoot);
  synchronizeModalIsolation();
  return () => {
    const index = dialogStack.lastIndexOf(portalRoot);
    if (index >= 0) dialogStack.splice(index, 1);
    synchronizeModalIsolation();
  };
}

function isTopDialog(portalRoot: HTMLElement) {
  return dialogStack.at(-1) === portalRoot;
}

function visibleFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.getAttribute("aria-hidden") === "true") return false;
    return element.getClientRects().length > 0;
  });
}

type AccessibleDialogProps = {
  open: boolean;
  labelledBy: string;
  describedBy?: string;
  className: string;
  backdropClassName: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
};

export function AccessibleDialog({
  open,
  labelledBy,
  describedBy,
  className,
  backdropClassName,
  initialFocusRef,
  onClose,
  children,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const root = document.createElement("div");
    root.dataset.accessibleDialogPortal = "true";
    document.body.append(root);
    setPortalRoot(root);
    const unregister = registerDialog(root);

    return () => {
      unregister();
      root.remove();
      setPortalRoot(null);

      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (!previousFocus?.isConnected) return;
      window.requestAnimationFrame(() => previousFocus.focus({ preventScroll: true }));
    };
  }, [open]);

  useEffect(() => {
    if (!open || !portalRoot) return;
    const frame = window.requestAnimationFrame(() => {
      const initialTarget = initialFocusRef?.current
        ?? visibleFocusableElements(dialogRef.current)[0]
        ?? dialogRef.current;
      initialTarget?.focus({ preventScroll: true });
    });

    const containProgrammaticFocus = (event: FocusEvent) => {
      if (!isTopDialog(portalRoot)) return;
      const target = event.target;
      if (target instanceof Node && dialogRef.current?.contains(target)) return;
      const initialTarget = initialFocusRef?.current
        ?? visibleFocusableElements(dialogRef.current)[0]
        ?? dialogRef.current;
      initialTarget?.focus({ preventScroll: true });
    };

    document.addEventListener("focusin", containProgrammaticFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("focusin", containProgrammaticFocus);
    };
  }, [initialFocusRef, open, portalRoot]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!portalRoot || !isTopDialog(portalRoot)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = visibleFocusableElements(dialogRef.current);
    if (controls.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus({ preventScroll: true });
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  if (!open || !portalRoot) return null;

  return createPortal(
    <div
      className={backdropClassName}
      role="presentation"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>,
    portalRoot,
  );
}
