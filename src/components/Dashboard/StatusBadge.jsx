"use client";

const statusConfig = {
  submitted: { label: "Submitted", style: "bg-blue-100 text-blue-700 border-blue-700" },
  in_progress: { label: "In Progress", style: "bg-yellow-100 text-yellow-700 border-yellow-700" },
  review: { label: "Review", style: "bg-primary/10 text-primary border-primary" },
  completed: { label: "Completed", style: "bg-green-100 text-green-700 border-green-700" },
  ready_to_post: { label: "Ready to Post", style: "bg-orange-100 text-orange-700 border-orange-700" },
  posted: { label: "Posted", style: "bg-emerald-100 text-emerald-800 border-emerald-800" },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, style: "bg-gray-100 text-gray-700 border-gray-700" };

  return (
    <div
      className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${config.style}`}
    >
      {config.label}
    </div>
  );
};

export const ActionButton = ({ icon: Icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white hover:bg-accent/5 border border-accent/10 transition-colors cursor-pointer"
    aria-label={label}
  >
    <Icon className="w-4 h-4 text-accent" />
  </button>
);
