"use client";

import { Icon } from "@/components/teacher/icons";
import { sBtnDark } from "./ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={sBtnDark + " print:hidden"}>
      <Icon name="printer" className="h-4 w-4" /> Print or save as PDF
    </button>
  );
}
