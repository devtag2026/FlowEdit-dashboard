"use client";
import { useMemo, useState } from "react";
import { FileText, Search, X, ExternalLink } from "lucide-react";
import EmptyPolicy from "./EmptyPolicy";

const filters = [
  { label: "All",      value: "all" },
  { label: "Legal",    value: "legal" },
  { label: "Editorial",value: "editorial" },
  { label: "Privacy",  value: "privacy" },
];

// Accepts real policies from DB via props
// Falls back to empty state if none
export default function Policies({ policies = [] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchesFilter = activeFilter === "all" || p.category === activeFilter;
      const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [policies, activeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search policies..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-accent/20 bg-tertiary text-accent text-sm focus:outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-accent/40" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === f.value
                  ? "bg-primary text-white"
                  : "bg-tertiary text-accent border border-accent/20 hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Cards */}
      {filtered.length === 0 ? (
        <EmptyPolicy />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((policy) => (
            <div
              key={policy.id}
              className="bg-tertiary rounded-2xl p-5 flex items-start gap-4 border border-accent/10"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-accent text-sm mb-1 truncate">
                  {policy.title}
                </h3>
                {policy.created_at && (
                  <p className="text-xs text-accent/50">
                    Added {new Date(policy.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                )}
              </div>
              {policy.file_url && (
<a
                  href={policy.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/70 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
