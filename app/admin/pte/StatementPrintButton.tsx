"use client";

export default function StatementPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 print:hidden"
    >
      Download PDF
    </button>
  );
}
