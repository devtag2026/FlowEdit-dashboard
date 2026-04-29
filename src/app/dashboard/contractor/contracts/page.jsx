"use client";
import { useEffect, useState } from "react";
import { fetchContractorContracts, signContract, fetchOnboardingSteps } from "@/lib/queries/earnings";
import { downloadFile } from "@/lib/utils/download";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, PenLine, FileX, Loader2 } from "lucide-react";
import Loader from "@/components/common/Loader";
import OnboardingSteps from "@/components/resources/OnboardingSteps";

function statusColor(status) {
  if (status === "signed" || status === "active") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "expired") return "bg-gray-100 text-gray-600";
  return "bg-blue-100 text-blue-700";
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export default function Contracts() {
  const [contracts, setContracts]   = useState([]);
  const [steps, setSteps]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingSteps, setLoadingSteps] = useState(true);
  const [error, setError]           = useState(null);
  const [signingId, setSigningId]   = useState(null);

  useEffect(() => {
    fetchContractorContracts()
      .then(setContracts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetchOnboardingSteps()
      .then(setSteps)
      .catch(console.error)
      .finally(() => setLoadingSteps(false));
  }, []);

  const handleSign = async (contractId) => {
    setSigningId(contractId);
    try {
      const updated = await signContract(contractId);
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? { ...c, status: updated.status, signed_at: updated.signed_at }
            : c
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSigningId(null);
    }
  };

  const handleDownload = (url, title) => {
    const filename = `${(title || "contract").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    downloadFile(url, filename);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader />
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-2 px-3 md:px-8 md:py-5 pb-10 space-y-6">

      {/* Onboarding Progress */}
      <Card className="bg-tertiary rounded-xl md:rounded-3xl">
        <CardContent>
          <h2 className="text-accent font-semibold md:font-bold text-xl md:text-2xl mb-2">
            Onboarding Progress
          </h2>
          {loadingSteps ? (
            <div className="flex justify-center py-6"><Loader /></div>
          ) : (
            <OnboardingSteps steps={steps} />
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {contracts.length === 0 && !error ? (
        <Card className="bg-tertiary rounded-xl md:rounded-3xl">
          <CardContent className="flex flex-col items-center text-center py-16 gap-4">
            <FileX className="w-10 h-10 text-accent/20" />
            <div>
              <h2 className="text-lg font-semibold text-accent">No contracts yet</h2>
              <p className="text-accent/50 text-sm mt-1">
                Your contracts will appear here once they have been uploaded by FlowEdit admin.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        contracts.map((contract) => (
          <Card key={contract.id} className="bg-tertiary rounded-xl md:rounded-3xl">
            <CardContent className="flex flex-col space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-accent font-bold text-xl md:text-2xl">
                  {contract.title || "Contractor Agreement"}
                </h1>
                <Badge className={`${statusColor(contract.status)} border-0 py-1.5 px-4 rounded-full font-bold text-sm capitalize`}>
                  Status: {contract.status || "pending"}
                </Badge>
              </div>

              {/* Signed date */}
              {contract.signed_at && (
                <p className="text-sm text-accent/50">
                  Signed on {formatDate(contract.signed_at)}
                </p>
              )}

              {/* Description */}
              <p className="text-slate-700 md:px-2 text-justify text-sm md:text-base leading-relaxed">
                This Contractor Agreement outlines the terms and conditions between
                FlowEdit and the contractor for services rendered. The agreement
                includes provisions for project scope, payment terms, intellectual
                property rights, confidentiality obligations, and termination
                clauses. Both parties agree to maintain professional standards and
                meet all deadlines as specified in individual project briefs.
              </p>

              <p className="text-slate-700 md:px-2 text-justify text-sm md:text-base leading-relaxed">
                The contractor agrees to provide high-quality work that meets or
                exceeds client expectations, while FlowEdit commits to timely
                payment for completed projects and providing necessary resources and
                access to tools. This agreement is effective from the signing date
                and remains active unless terminated by either party with
                appropriate notice.
              </p>

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                {contract.file_url ? (
                  <>
                    <a
                      href={contract.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-primary px-6 py-3 rounded-full shadow-lg text-base font-medium text-white hover:bg-primary/90 hover:shadow-xl transition-all"
                    >
                      <FileText className="w-4 h-4 md:w-5 md:h-5" />
                      View Contract (PDF)
                    </a>
                    <button
                      onClick={() => handleDownload(contract.file_url, contract.title)}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-primary rounded-full font-bold text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Download className="w-4 h-4 md:w-5 md:h-5" />
                      Download Contract
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-accent/40 italic">
                    Contract file not yet uploaded.
                  </p>
                )}

                {/* Sign button — only shown if not already signed */}
                {contract.status !== "signed" && (
                  <button
                    onClick={() => handleSign(contract.id)}
                    disabled={signingId === contract.id}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {signingId === contract.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <PenLine className="w-4 h-4" />
                        Sign Contract
                      </>
                    )}
                  </button>
                )}
              </div>

            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
