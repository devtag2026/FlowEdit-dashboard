"use client";
import { useEffect, useState } from "react";
import { fetchContractorEarnings, earningsSummary, formatCurrency } from "@/lib/queries/earnings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import {
  DollarSign, Euro, PoundSterling,
  TrendingUp, Clock, CheckCircle2, ArrowDownLeft, ReceiptText,
} from "lucide-react";

function getCurrencyIcon(currency) {
  const c = (currency || "").toLowerCase();
  if (c === "eur") return Euro;
  if (c === "gbp") return PoundSterling;
  return DollarSign;
}

function currencyBadgeStyle(currency) {
  const c = (currency || "").toLowerCase();
  if (c === "eur") return "bg-blue-50 text-blue-600";
  if (c === "gbp") return "bg-purple-50 text-purple-600";
  return "bg-green-50 text-green-600";
}

function statusStyles(status) {
  if (status === "paid")    return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "failed")  return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function Payout({ profile }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    fetchContractorEarnings()
      .then(setPayments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader /></div>;
  if (error)   return <div className="py-8 text-center text-red-500 text-sm">{error}</div>;

  const { total, paid, pending, count } = earningsSummary(payments);
  const currency = payments[0]?.currency || "usd";
  const CurrIcon = getCurrencyIcon(currency);

  const stats = [
    { label: "Paid Out",     value: formatCurrency(paid,    currency), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50"  },
    { label: "Pending",      value: formatCurrency(pending, currency), icon: Clock,        color: "text-amber-600", bg: "bg-amber-50"  },
    { label: "Transactions", value: count,                             icon: ReceiptText,  color: "text-blue-600",  bg: "bg-blue-50"   },
  ];

  return (
    <div className="space-y-5 mt-6">

      {/* Hero — lifetime earnings */}
      <Card className="bg-tertiary rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <CurrIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs text-accent/50 font-semibold uppercase tracking-widest mb-1">
                  Total Earned
                </p>
                <p className="text-4xl md:text-5xl font-bold text-accent leading-none">
                  {formatCurrency(total, currency)}
                </p>
                <p className="text-sm text-accent/45 mt-2">
                  Lifetime earnings processed via admin payouts
                </p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start md:self-auto ${currencyBadgeStyle(currency)}`}>
              <CurrIcon className="w-3 h-3" />
              {currency.toUpperCase()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-tertiary rounded-2xl">
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-accent/55 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-accent">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment history */}
      <Card className="bg-tertiary rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-accent/8 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-accent text-lg">Payment History</h2>
              <p className="text-xs text-accent/45 mt-0.5">
                {count} completed transaction{count !== 1 ? "s" : ""}
              </p>
            </div>
            {count > 0 && <ArrowDownLeft className="w-5 h-5 text-green-500" />}
          </div>

          {payments.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent/20" />
              </div>
              <div>
                <p className="font-semibold text-accent/60">No payments yet</p>
                <p className="text-sm text-accent/40 mt-1">
                  Payments from admin will appear here once processed.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent/8 text-left bg-accent/[0.02]">
                      <th className="px-6 py-3 text-xs text-accent/45 font-semibold uppercase tracking-wide">Description</th>
                      <th className="px-6 py-3 text-xs text-accent/45 font-semibold uppercase tracking-wide">Amount</th>
                      <th className="px-6 py-3 text-xs text-accent/45 font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-6 py-3 text-xs text-accent/45 font-semibold uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-accent/[0.03] transition-colors ${i < payments.length - 1 ? "border-b border-accent/5" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <CurrIcon className="w-3.5 h-3.5 text-primary/70" />
                            </div>
                            <span className="text-sm text-accent font-medium">
                              {p.description || "Payment"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-accent">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusStyles(p.status)} border-0 capitalize rounded-full px-3 py-1 text-xs font-semibold`}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/50">
                          {formatDate(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-accent/8">
                {payments.map((p) => (
                  <div key={p.id} className="px-4 py-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CurrIcon className="w-3.5 h-3.5 text-primary/70" />
                        </div>
                        <p className="text-sm font-medium text-accent truncate">
                          {p.description || "Payment"}
                        </p>
                      </div>
                      <Badge className={`${statusStyles(p.status)} border-0 capitalize text-xs rounded-full px-2.5 py-0.5 shrink-0`}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pl-[2.625rem]">
                      <p className="text-base font-bold text-accent">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-accent/45">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
