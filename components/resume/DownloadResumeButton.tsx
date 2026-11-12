"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";

/**
 * Opens the browser's print dialog, where "Save as PDF" saves the resume. The print stylesheet in
 * app/globals.css prints only the A4 sheet, and the page title becomes the suggested file name.
 */
export default function DownloadResumeButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 border border-line bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      <PhosphorIcon name="download-simple" size={16} />
      Download PDF
    </button>
  );
}
