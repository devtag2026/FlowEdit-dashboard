"use client";
import AccessTools from "@/components/resources/AccessTools";
// import LearningCatalog from "@/components/resources/LearningCatalog";
import OnboardingSteps from "@/components/resources/OnboardingSteps";
import Policies from "@/components/resources/Policies";
import TabNavigation from "@/components/common/TabNavigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchOnboardingSteps,
  fetchPolicies,
  // fetchLearningCatalog,
  fetchResourceTools,
} from "@/lib/queries/earnings";
import Loader from "@/components/common/Loader";
import React, { useState, useEffect } from "react";

const Resources = () => {
  const [activeTab, setActiveTab]             = useState("access");
  const [steps, setSteps]                     = useState([]);
  const [policies, setPolicies]               = useState([]);
  // const [catalog, setCatalog]                 = useState(null);
  const [accesses, setAccesses]               = useState(null);
  const [tools, setTools]                     = useState(null);
  const [loadingSteps, setLoadingSteps]       = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  // const [loadingCatalog, setLoadingCatalog]   = useState(false);
  const [loadingTools, setLoadingTools]       = useState(true);

  useEffect(() => {
    fetchOnboardingSteps()
      .then(setSteps)
      .catch((err) => console.error("Failed to load onboarding steps:", err))
      .finally(() => setLoadingSteps(false));

    fetchResourceTools()
      .then((data) => {
        setAccesses(data.filter((r) => r.type === "access"));
        setTools(data.filter((r) => r.type === "tool"));
      })
      .catch((err) => console.error("Failed to load resource tools:", err))
      .finally(() => setLoadingTools(false));
  }, []);

  useEffect(() => {
    if (activeTab === "policy" && policies.length === 0) {
      setLoadingPolicies(true);
      fetchPolicies()
        .then(setPolicies)
        .catch((err) => console.error("Failed to load policies:", err))
        .finally(() => setLoadingPolicies(false));
    }

    // if (activeTab === "catalog" && catalog === null) {
    //   setLoadingCatalog(true);
    //   fetchLearningCatalog()
    //     .then(setCatalog)
    //     .catch((err) => console.error("Failed to load catalog:", err))
    //     .finally(() => setLoadingCatalog(false));
    // }
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-secondary px-4 py-5 pb-4 space-y-8">

      <Card className="bg-tertiary">
        <CardContent>
          <h1 className="text-accent font-semibold md:font-bold text-xl md:text-3xl mb-2">
            Onboarding Progress
          </h1>
          {loadingSteps ? (
            <div className="flex justify-center py-6"><Loader /></div>
          ) : (
            <OnboardingSteps steps={steps} />
          )}
        </CardContent>
      </Card>

      <TabNavigation
        tabs={[
          { label: "Access & Tools",   value: "access"  },
          // { label: "Learning Catalog", value: "catalog" },
          { label: "Policies",         value: "policy"  },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        buttonClassName="text-xs"
      />

      {activeTab === "access" && (
        loadingTools ? (
          <div className="flex justify-center py-10"><Loader /></div>
        ) : (
          <AccessTools accesses={accesses} tools={tools} />
        )
      )}

      {/* activeTab === "catalog" — Learning Catalog disabled
      {activeTab === "catalog" && (
        loadingCatalog ? (
          <div className="flex justify-center py-10"><Loader /></div>
        ) : (
          <LearningCatalog catalog={catalog} />
        )
      )} */}

      {activeTab === "policy" && (
        loadingPolicies ? (
          <div className="flex justify-center py-10"><Loader /></div>
        ) : (
          <Policies policies={policies} />
        )
      )}
    </main>
  );
};

export default Resources;
