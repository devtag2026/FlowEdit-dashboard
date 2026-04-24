import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import PayContractorModal from "@/components/earnings/PayContractorModal";
import { fetchOnboardingStepsByContractorId } from "@/lib/queries/earnings";

const STEP_LABELS = ["Start", "Account", "Profile", "Contract", "Signed"];

function stepLabel(step, index) {
  // Guard against UUIDs or empty labels stored in the DB
  if (!step.label || step.label.length > 20) return STEP_LABELS[index] ?? `Step ${index + 1}`;
  return step.label;
}

const ContractorDetail = ({ contractor, onBack, isMobile }) => {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState([]);

  useEffect(() => {
    if (!contractor?.id) return;
    fetchOnboardingStepsByContractorId(contractor.id)
      .then(setOnboardingSteps)
      .catch(console.error);
  }, [contractor?.id]);

  // const accessPermissions = [
  //   { id: 1, label: "Email",    active: true,  color: "bg-blue-500" },
  //   { id: 2, label: "Partner",  active: true,  color: "bg-purple-500" },
  //   { id: 3, label: "Frame.io", active: false, color: "bg-gray-300" },
  // ];

  // ── Mobile ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div className="bg-tertiary rounded-t-3xl p-4 pb-6 space-y-3">
          <div className="flex justify-center -mt-2 mb-1">
            <div className="w-12 h-1 bg-tertiary rounded-full" />
          </div>

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <Avatar className={`w-12 h-12 ${contractor.avatarColor}`}>
                <AvatarFallback className="text-tertiary text-base font-bold">
                  {contractor.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-accent">{contractor.name}</h2>
                <p className="text-xs text-accent">{contractor.email}</p>
              </div>
            </div>
            <Badge className={`${contractor.statusColor} border-0 px-2.5 py-0.5 text-xs`}>
              {contractor.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-tertiary rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-accent text-xs mb-1">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-accent">{contractor.projectsCompleted || "0"}</p>
              <p className="text-xs text-accent">Projects completed</p>
            </div>
            <div className="bg-tertiary rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-accent text-xs mb-1">
                <Clock className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-accent">{contractor.avgDeliveryTime || "--"}</p>
              <p className="text-xs text-accent">Avg. delivery time</p>
            </div>
            <div className="bg-tertiary rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-accent text-xs mb-1">
                <Edit className="w-3 h-3" />
              </div>
              <p className="text-base font-bold text-accent">{contractor.revisionRate || "--"}</p>
              <p className="text-xs text-accent">Revision rate</p>
            </div>
          </div>

          <div className="bg-tertiary rounded-xl p-3">
            <p className="text-xs font-semibold text-accent uppercase mb-2">Onboarding Progress</p>
            <div className="relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-tertiary" style={{ left: "5%", right: "5%" }}>
                <div className="h-full bg-primary" style={{ width: `${onboardingSteps.length ? (onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between relative">
                {onboardingSteps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${step.completed ? "bg-primary text-white" : "bg-tertiary border-2 border-gray-300 text-accent"}`}>
                      {step.completed ? "✓" : idx + 1}
                    </div>
                    <span className="text-xs text-accent">{stepLabel(step, idx)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* <div className="bg-tertiary rounded-xl p-3">
            <p className="text-xs font-semibold text-accent uppercase mb-2">Access & Permissions</p>
            <div className="flex gap-2">
              {accessPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${permission.active ? "bg-tertiary text-accent border border-tertiary" : "bg-tertiary text-accent"}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${permission.color}`} />
                  {permission.label}
                </div>
              ))}
            </div>
          </div> */}

          {/* Payment */}
          <div className="bg-tertiary rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-accent uppercase">Payment</p>
            <p className="text-xs text-accent/60">
              {contractor.stripeConnected
                ? "Stripe connected — payouts enabled."
                : "No Stripe account connected yet."}
            </p>
            <Button
              onClick={() => setPayModalOpen(true)}
              disabled={!contractor.stripeConnected}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white h-11 rounded-xl gap-2 font-semibold"
            >
              <DollarSign className="w-4 h-4" />
              Pay Contractor
            </Button>
          </div>
        </div>

        {payModalOpen && (
          <PayContractorModal
            contractor={contractor}
            onClose={() => setPayModalOpen(false)}
            onSuccess={() => {}}
          />
        )}
      </>
    );
  }

  // ── Desktop ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-tertiary rounded-3xl p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Avatar className={`w-16 h-16 ${contractor.avatarColor}`}>
              <AvatarFallback className="text-tertiary text-xl font-bold">
                {contractor.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-accent">{contractor.name}</h2>
              <p className="text-accent/60">{contractor.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={`${contractor.statusColor} border-0 px-4 py-1.5`}>
              {contractor.status}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-tertiary rounded-2xl p-6">
            <div className="flex items-center gap-2 text-accent/60 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Projects completed</span>
            </div>
            <h3 className="text-3xl font-bold text-accent mb-1">{contractor.projectsCompleted || "0"}</h3>
            <p className="text-xs text-accent/60">Total delivered</p>
          </div>
          <div className="bg-tertiary rounded-2xl p-6">
            <div className="flex items-center gap-2 text-accent/60 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Avg. delivery time</span>
            </div>
            <h3 className="text-3xl font-bold text-accent mb-1">{contractor.avgDeliveryTime || "--"}</h3>
            <p className="text-xs text-accent/60">Per project</p>
          </div>
          <div className="bg-tertiary rounded-2xl p-6">
            <div className="flex items-center gap-2 text-accent/60 text-sm mb-2">
              <Edit className="w-4 h-4" />
              <span>Revision rate</span>
            </div>
            <h3 className="text-3xl font-bold text-accent mb-1">{contractor.revisionRate || "--"}</h3>
            <p className="text-xs text-accent/60">Of all projects</p>
          </div>
        </div>

        {/* Onboarding */}
        <div className="bg-tertiary rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-accent/70 uppercase mb-4">Onboarding Progress</h4>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-accent/10" style={{ left: "2%", right: "2%" }}>
              <div className="h-full bg-primary rounded-full" style={{ width: `${onboardingSteps.length ? (onboardingSteps.filter(s => s.completed).length / onboardingSteps.length) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between relative">
              {onboardingSteps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${step.completed ? "bg-primary text-tertiary" : "bg-tertiary border-2 border-accent/20 text-accent/40"}`}>
                    {step.completed ? "✓" : idx + 1}
                  </div>
                  <span className="text-xs text-accent/60">{stepLabel(step, idx)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-tertiary rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-accent/70 uppercase mb-4">Payment</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-accent font-medium">
                {contractor.stripeConnected
                  ? "Stripe account connected — payouts are enabled."
                  : "No Stripe account connected yet."}
              </p>
              <p className="text-xs text-accent/50 mt-0.5">
                {contractor.projectsCompleted} project{contractor.projectsCompleted !== 1 ? "s" : ""} completed
              </p>
            </div>
            <Button
              onClick={() => setPayModalOpen(true)}
              disabled={!contractor.stripeConnected}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white gap-2 rounded-xl px-5 shrink-0"
            >
              <DollarSign className="w-4 h-4" />
              Pay Contractor
            </Button>
          </div>
        </div>
      </div>

      {payModalOpen && (
        <PayContractorModal
          contractor={contractor}
          onClose={() => setPayModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </>
  );
};

export default ContractorDetail;
