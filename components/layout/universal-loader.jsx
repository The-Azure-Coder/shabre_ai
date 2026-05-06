"use client";

import { Icon } from "@/lib/icons";

export function UniversalLoader({ label = "Loading..." }) {
  return (
    <main className="universal-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="universal-loading-card">
        <div className="universal-loading-mark">
          <Icon name="repeat" className="loader-spin" />
        </div>
        <strong>SmartReview AI</strong>
        <span>{label}</span>
      </div>
    </main>
  );
}
