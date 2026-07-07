"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "./../common/Button";
import { fetchStripeInvoices } from "@/lib/queries/billing";
import { useEffect, useState } from "react";
import Loader from "../common/Loader";

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStripeInvoices();
        setInvoices(
          Array.isArray(data)
            ? data.map((item) => ({
                id:          item.number || item.id || "--",
                plan:        item.subscription_plan || "Unknown",
                date:        item.created
                               ? new Date(item.created * 1000).toLocaleDateString()
                               : "--",
                amount:      item.amount_paid
                               ? `$${(item.amount_paid / 100).toFixed(2)}`
                               : item.total
                               ? `$${(item.total / 100).toFixed(2)}`
                               : "$0.00",
                status:      item.status || "unknown",
                downloadUrl: item.hosted_invoice_url || null,
              }))
            : []
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load invoices. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto mt-8 rounded-2xl bg-tertiary p-8 text-center">
        <p className="text-accent/60 text-sm">{error}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="max-w-5xl mx-auto mt-8 rounded-2xl bg-tertiary p-8 text-center">
        <p className="text-accent/60 text-sm">No invoices found.</p>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto overflow-hidden md:rounded-3xl mt-4">

      {/* Header */}
      <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:p-8 md:bg-tertiary">
        <div>
          <h2 className="text-accent text-xl font-bold md:text-2xl mb-1">
            Billing History
          </h2>
          <p className="text-slate-600 text-sm md:text-base">
            Download previous invoices and receipts.
          </p>
        </div>
        <Button className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow text-sm font-medium text-accent hover:bg-gray-300 shrink-0">
          <Download size={16} />
          Download All
        </Button>
      </div>

      {/* Desktop table — use a real table for proper column alignment */}
      <div className="hidden md:block bg-tertiary overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-white">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[30%]">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[20%]">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[15%]">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[15%]">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[12%]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase text-slate-600 w-[8%]">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-slate-500 shrink-0" />
                    <span className="text-sm font-medium text-accent truncate">
                      {invoice.id}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-accent capitalize truncate block">
                    {invoice.plan}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-accent whitespace-nowrap">
                    {invoice.date}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-accent whitespace-nowrap">
                    {invoice.amount}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full whitespace-nowrap capitalize">
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {invoice.downloadUrl ? (
                    <a
                      href={invoice.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 hover:bg-white transition-colors"
                    >
                      <Download size={14} className="text-accent" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 opacity-40 cursor-not-allowed"
                    >
                      <Download size={14} className="text-accent" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 p-2">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-tertiary rounded-xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-slate-500 shrink-0" />
                <p className="text-sm font-semibold text-accent truncate">{invoice.id}</p>
              </div>
              <p className="text-sm font-bold text-accent whitespace-nowrap shrink-0">
                {invoice.amount}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">{invoice.date}</span>
                <span className="text-xs text-slate-500 capitalize">{invoice.plan}</span>
                <span className="inline-block px-2 py-0.5 text-xs font-semibold text-green-600 bg-green-100 rounded-full capitalize">
                  {invoice.status}
                </span>
              </div>
              {invoice.downloadUrl ? (
                <a
                  href={invoice.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow text-xs font-medium text-accent shrink-0"
                >
                  <Download size={12} />
                  Download
                </a>
              ) : (
                <span className="text-xs text-slate-400">No download</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Invoice;