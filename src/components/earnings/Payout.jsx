"use client";
import { useEffect, useState } from "react";
import { fetchContractorEarnings, earningsSummary, formatCurrency } from "@/lib/queries/earnings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";

function statusColor(status) {
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

// ✅ Accepts profile as prop — no internal getUser() call
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500 text-sm">{error}</div>
    );
  }

  const { total, paid, pending, count } = earningsSummary(payments);

  return (
    <div className="space-y-6 mt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-tertiary rounded-2xl">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Total Earned</p>
              <p className="text-xl font-bold text-accent">{formatCurrency(total)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-tertiary rounded-2xl">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Paid Out</p>
              <p className="text-xl font-bold text-accent">{formatCurrency(paid)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-tertiary rounded-2xl">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Pending</p>
              <p className="text-xl font-bold text-accent">{formatCurrency(pending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments table */}
      <Card className="bg-tertiary rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-accent/10">
            <h2 className="font-semibold text-accent">Payment History</h2>
            <p className="text-xs text-accent/50">
              {count} transaction{count !== 1 ? "s" : ""}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp className="w-8 h-8 text-accent/20 mx-auto mb-3" />
              <p className="text-accent/50 text-sm">No payments yet.</p>
              <p className="text-accent/40 text-xs mt-1">
                Payments from admin will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-accent/10 text-left">
                      <th className="px-6 py-3 text-xs text-accent/50 font-semibold uppercase">Description</th>
                      <th className="px-6 py-3 text-xs text-accent/50 font-semibold uppercase">Amount</th>
                      <th className="px-6 py-3 text-xs text-accent/50 font-semibold uppercase">Status</th>
                      <th className="px-6 py-3 text-xs text-accent/50 font-semibold uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-accent/5 hover:bg-accent/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-accent">
                          {p.description || "Payment"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-accent">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusColor(p.status)} border-0 capitalize`}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/60">
                          {formatDate(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-accent/10">
                {payments.map((p) => (
                  <div key={p.id} className="px-4 py-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-accent">
                        {p.description || "Payment"}
                      </p>
                      <Badge className={`${statusColor(p.status)} border-0 capitalize text-xs`}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-bold text-accent">
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-accent/50">{formatDate(p.created_at)}</p>
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
