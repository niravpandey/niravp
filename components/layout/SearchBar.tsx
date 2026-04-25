"use client";
import { useState } from "react";
import PhosphorIcon from "@/components/ui/PhosphorIcon";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  return (
<div className="flex items-center gap-2 border border-gray-300 px-3 py-1.5 w-3xl mx-auto focus-within:border-blue-500 transition-colors duration-150 mt-4">
      <PhosphorIcon name="magnifying-glass" size={16} className="text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none w-full"
      />
    </div>
  );
}
