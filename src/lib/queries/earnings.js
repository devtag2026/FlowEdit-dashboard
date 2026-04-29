
import { getSupabaseClient, getUser } from "../supabase/client";
const supabase = getSupabaseClient()

export async function fetchMyPayments() {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("contractor_payments")
    .select("*")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchEarningsSummary() {
  const payments = await fetchMyPayments();
  const paid = payments.filter((p) => p.status === "paid");
  const now = new Date();
  const thisMonth = paid.filter((p) => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisYear = paid.filter(
    (p) => new Date(p.created_at).getFullYear() === now.getFullYear()
  );
  return {
    thisMonth:     thisMonth.reduce((sum, p) => sum + p.amount, 0),
    yearToDate:    thisYear.reduce((sum, p) => sum + p.amount, 0),
    totalProjects: paid.length,
    currency:      payments[0]?.currency || "gbp",
  };
}

export async function fetchContractorPayments(contractorId) {
  const { data, error } = await supabase
    .from("contractor_payments")
    .select("*")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchConnectStatus(profileId) {
  const res = await fetch(`/api/stripe/connect/status?profileId=${profileId}`);
  if (!res.ok) throw new Error("Failed to fetch connect status");
  return res.json();
}

export async function startConnectOnboarding({ profileId, email }) {
  const res = await fetch("/api/stripe/connect", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ profileId, email }),
  });
  if (!res.ok) throw new Error("Failed to start onboarding");
  return res.json();
}

export async function createPayment({ contractorId, adminId, amount, currency, description }) {
  const res = await fetch("/api/stripe/payout", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ contractorId, adminId, amount, currency, description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create payment");
  return data;
}

export async function fetchContractorContracts() {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("contractor_documents")
    .select("id, title, file_url, status, signed_at, created_at")
    .eq("contractor_id", user.id)
    .eq("type", "contract")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function signContract(contractId) {
  const { data, error } = await supabase
    .from("contractor_documents")
    .update({
      status:    "signed",
      signed_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .select("id, status, signed_at");

  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Unable to sign contract. Check your permissions.");
  return data[0];
}

const AUTO_COMPLETE_KEYS = ["start", "account", "profile"];


const EXPECTED_STEPS = [
  { step_key: "start",    label: "Start"    },
  { step_key: "account",  label: "Account"  },
  { step_key: "profile",  label: "Profile"  },
  { step_key: "contract", label: "Contract" },
  { step_key: "signed",   label: "Signed"   },
];

// Always returns all 5 steps in order, filling missing DB rows with completed: false
function mergeWithExpected(data) {
  const dbMap = new Map((data || []).map(s => [s.step_key, s]));
  return EXPECTED_STEPS.map((expected, idx) =>
    dbMap.get(expected.step_key) ?? { id: `fallback-${idx}`, ...expected, completed: false }
  );
}

export async function fetchOnboardingSteps() {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const [{ data, error }, { data: contracts }] = await Promise.all([
    supabase
      .from("onboarding_steps")
      .select("id, step_key, label, completed, completed_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("contractor_documents")
      .select("id, status")
      .eq("contractor_id", user.id)
      .eq("type", "contract"),
  ]);

  if (error) throw error;

  const steps = mergeWithExpected(data);

  // Persist start/account/profile as complete if they aren't already (fire-and-forget)
  const incompleteBaseIds = steps
    .filter(s => AUTO_COMPLETE_KEYS.includes(s.step_key) && !s.completed && !String(s.id).startsWith("fallback"))
    .map(s => s.id);

  if (incompleteBaseIds.length > 0) {
    supabase
      .from("onboarding_steps")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .in("id", incompleteBaseIds)
      .then(() => {})
      .catch(() => {});
  }

  const hasContracts  = (contracts || []).length > 0;
  const allSigned     = hasContracts && (contracts || []).every(c => c.status === "signed");

  return steps.map(s => {
    if (AUTO_COMPLETE_KEYS.includes(s.step_key)) return { ...s, completed: true };
    if (s.step_key === "contract") return { ...s, completed: hasContracts };
    if (s.step_key === "signed")   return { ...s, completed: allSigned };
    return s;
  });
}

export async function fetchOnboardingStepsByContractorId(contractorId) {
  const { data, error } = await supabase
    .from("onboarding_steps")
    .select("id, step_key, label, completed, completed_at")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const steps = mergeWithExpected(data);

  // Force start/account/profile as completed — contractor exists in the system
  return steps.map(s =>
    AUTO_COMPLETE_KEYS.includes(s.step_key) ? { ...s, completed: true } : s
  );
}

export async function fetchPolicies() {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("contractor_documents")
    .select("id, title, file_url, status, created_at")
    .eq("contractor_id", user.id)
    .eq("type", "policy")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}


export async function fetchLearningCatalog() {
  const { data, error } = await supabase
    .from("learning_catalog")
    .select("id, category, title, description, time, thumbnail, status, checklists")
    .order("id", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return data.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export async function fetchResourceTools() {
  const { data, error } = await supabase
    .from("resource_tools")
    .select("id, type, title, status")
    .order("type")
    .order("id");

  if (error) throw error;
  return data || [];
}

export function formatCurrency(amountPence, currency = "gbp") {
  return new Intl.NumberFormat("en-GB", {
    style:    "currency",
    currency: currency.toUpperCase(),
  }).format(amountPence / 100);
}

export function earningsSummary(payments) {
  const paid    = payments.filter((p) => p.status === "paid");
  const pending = payments.filter((p) => p.status === "pending");
  return {
    total:   paid.reduce((s, p) => s + p.amount, 0),
    paid:    paid.reduce((s, p) => s + p.amount, 0),
    pending: pending.reduce((s, p) => s + p.amount, 0),
    count:   paid.length,
  };
}

export async function fetchContractorEarnings() {
  return fetchMyPayments();
}
