"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

type PteAdminSearchProps = {
  initialStudentQuery: string;
  initialInvoiceQuery: string;
  initialStatusFilter: string;
  statusFilters: Array<{ value: string; label: string }>;
  hasSearch: boolean;
};

export default function PteAdminSearch({
  initialStudentQuery,
  initialInvoiceQuery,
  initialStatusFilter,
  statusFilters,
  hasSearch,
}: PteAdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [studentQuery, setStudentQuery] = useState(initialStudentQuery);
  const [invoiceQuery, setInvoiceQuery] = useState(initialInvoiceQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const currentQueryString = searchParams.toString();

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(currentQueryString);
    const trimmedStudentQuery = studentQuery.trim();
    const trimmedInvoiceQuery = invoiceQuery.trim();

    params.delete("page");

    if (trimmedStudentQuery) {
      params.set("student", trimmedStudentQuery);
    } else {
      params.delete("student");
    }

    if (trimmedInvoiceQuery) {
      params.set("invoice", trimmedInvoiceQuery);
    } else {
      params.delete("invoice");
    }

    if (statusFilter) {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [currentQueryString, invoiceQuery, pathname, statusFilter, studentQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [nextHref, router]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_14rem_auto] lg:items-end">
      <label className="grid gap-1 text-sm font-semibold text-gray-800">
        Search students
        <input
          name="student"
          type="search"
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Name or email"
          className="border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-gray-800">
        Search invoices
        <input
          name="invoice"
          type="search"
          value={invoiceQuery}
          onChange={(event) => setInvoiceQuery(event.target.value)}
          placeholder="Invoice number"
          className="border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-gray-800">
        Quick filter
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
        >
          {statusFilters.map((filter) => (
            <option key={filter.value || "all"} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-16 text-sm font-semibold text-gray-400" aria-live="polite">
          {isPending ? "Searching..." : ""}
        </span>
        {hasSearch && (
          <Link href="/admin/pte" className="border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900">
            Clear
          </Link>
        )}
      </div>
    </div>
  );
}
