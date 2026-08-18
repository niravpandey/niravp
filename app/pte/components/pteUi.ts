export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const pteFocusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2";

export const pteChipClassName =
  "block cursor-pointer border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 peer-checked:border-blue-900 peer-checked:bg-blue-900 peer-checked:text-white peer-checked:hover:border-blue-900 peer-checked:hover:bg-blue-900 peer-checked:hover:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60";

export const pteChoiceClassName =
  "block cursor-pointer border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 peer-checked:border-blue-900 peer-checked:bg-blue-900 peer-checked:text-white peer-checked:hover:border-blue-900 peer-checked:hover:bg-blue-900 peer-checked:hover:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60";

export const pteIconChoiceClassName =
  "flex cursor-pointer items-center justify-center border border-gray-300 bg-white px-2 py-2 text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900 peer-checked:border-blue-900 peer-checked:bg-blue-900 peer-checked:text-white peer-checked:hover:border-blue-900 peer-checked:hover:bg-blue-900 peer-checked:hover:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-900 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60";

export const ptePrimaryButtonClassName = cx(
  "inline-flex items-center justify-center border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition-colors",
  "hover:border-blue-800 hover:bg-blue-800 hover:text-white",
  "disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100 disabled:hover:border-gray-300 disabled:hover:bg-gray-100 disabled:hover:text-gray-400",
  pteFocusRing,
);

export const pteAccentButtonClassName = cx(
  "inline-flex items-center justify-center border border-mauve-500 bg-mauve-500 px-4 py-2 text-sm font-semibold text-white transition-colors",
  "hover:border-mauve-600 hover:bg-mauve-600 hover:text-white",
  "disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100 disabled:hover:border-gray-300 disabled:hover:bg-gray-100 disabled:hover:text-gray-400",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mauve-500 focus-visible:ring-offset-2",
);

export const pteSecondaryButtonClassName = cx(
  "inline-flex items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors",
  "hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900",
  "disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-white disabled:text-gray-400 disabled:opacity-100 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-400",
  pteFocusRing,
);
