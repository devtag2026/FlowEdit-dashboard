"use client";

import { CreditCard, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../common/Button";
import { useState, useEffect } from "react";
import BillingEditModal from "./EditModal/EditModal";

const PaymentDetail = ({ profile }) => {
  const [billing, setBilling] = useState({
    companyName:  "",
    billingEmail: "",
    address:      "",
    city:         "",
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fill from profile — webhook wrote address/city there at checkout time
  useEffect(() => {
    if (profile) {
      setBilling({
        companyName:  profile.name    || "",
        billingEmail: profile.email   || "",
        address:      profile.address || "",
        city:         profile.city    || "",
      });
    }
  }, [profile]);

  // Fetch payment methods — only API call needed
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!profile?.stripe_customer_id) return;
      try {
        setLoadingPayment(true);
        const res = await fetch(
          `/api/stripe/payment-methods?customer_id=${profile.stripe_customer_id}`
        );
        if (!res.ok) throw new Error("Failed to fetch payment methods");
        const data = await res.json();
        setPaymentMethods(data || []);
      } catch (err) {
        console.error("Payment methods fetch error:", err);
      } finally {
        setLoadingPayment(false);
      }
    };
    fetchPaymentMethods();
  }, [profile?.stripe_customer_id]);

  return (
    <>
      {/* Payment Methods */}
      <section className="max-w-5xl mx-auto bg-tertiary rounded-lg md:rounded-3xl p-4 md:p-6 mb-6 text-accent">

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Payment Methods</h3>
            <p className="text-slate-600 text-sm">
              Manage your credit cards and billing preferences.
            </p>
          </div>

          {loadingPayment ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary w-6 h-6" />
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between gap-3 bg-white rounded-2xl p-4 flex-wrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg shadow shrink-0">
                      <CreditCard className="text-blue-700 w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm capitalize truncate">
                        {pm.brand} ending in {pm.last4}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expires {pm.exp_month}/{pm.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pm.isDefault && (
                      <span className="text-slate-600 font-medium px-2 py-1 rounded-lg bg-slate-200 text-xs">
                        Default
                      </span>
                    )}
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 hover:bg-gray-100 transition-colors">
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-500 text-sm">
              {profile?.stripe_customer_id
                ? "No payment methods on file."
                : "Complete a checkout to see your payment methods here."}
            </div>
          )}

          {/* <button className="flex items-center justify-center w-full bg-white text-accent border-2 border-dashed rounded-xl p-4 gap-2 border-slate-300 font-semibold hover:border-primary transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Add New Payment Method
          </button> */}
        </div>
      </section>

      {/* Billing Address */}
      <section className="max-w-5xl mx-auto bg-tertiary rounded-lg md:rounded-3xl p-4 md:p-6 text-accent">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-1">Billing Address</h3>
            <p className="text-slate-600 text-sm">
              This address appears on your monthly invoices.
            </p>
          </div>
          {/* <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 w-10 h-10 flex items-center justify-center border-2 border-slate-300 rounded-lg text-accent hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button> */}
        </div>

        {/* <BillingEditModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          billing={billing}
          onSave={(updated) => setBilling(updated)}
        /> */}

        {/* Grid — each cell handles long text with break-words */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:bg-white md:p-6 rounded-2xl">
          {[
            { label: "Company Name",  value: billing.companyName  },
            { label: "Billing Email", value: billing.billingEmail },
            // { label: "Address",       value: billing.address      },
            // { label: "City / State",  value: billing.city         },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <p className="text-xs md:text-sm text-accent/70 mb-1 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-700 break-words">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default PaymentDetail;
