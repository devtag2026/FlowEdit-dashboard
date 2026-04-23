export const workflowSteps = [
  {
    id: "submitted",
    label: "Submitted",
    roles: [{ name: "Sarah Mitchell", role: "Client", color: "bg-[#5C6BC0]" }],
  },
  {
    id: "processing",
    label: "Processing",
    roles: [
      {
        name: "James Chen",
        role: "Offline Editor",
        color: "bg-[#EF5350]",
        options: ["James Chen", "Maria Kim", "Robert Brown"],
      },
      {
        name: "Alex Lopez",
        role: "Primary Editor",
        color: "bg-[#26A69A]",
        options: ["Alex Lopez", "Sarah Park", "David Wong"],
      },
      {
        name: "Lucas Johnson",
        role: "Finishing Editor",
        color: "bg-[#AB47BC]",
        options: ["Taylor Davis", "Emma Martinez", "Lucas Johnson"],
      },
    ],
  },
  {
    id: "review",
    label: "Review",
    roles: [
      {
        name: "Admin",
        role: "Primary Reviewer",
        color: "bg-[#FFA726]",
        options: ["Admin", "John Smith", "Alice Cooper"],
      },
      { name: "Sarah Mitchell", role: "Client", color: "bg-[#5C6BC0]" },
    ],
  },
  {
    id: "revision",
    label: "Revision",
    roles: [
      { name: "Taylor Davis", role: "Finishing Editor", color: "bg-[#AB47BC]" },
    ],
  },
  {
    id: "completed",
    label: "Completed",
    roles: [
      { name: "Taylor Davis", role: "Finishing Editor", color: "bg-[#AB47BC]" },
    ],
  },
  {
    id: "published",
    label: "Published",
    roles: [{ name: "Admin", role: "Reviewer", color: "bg-[#FFA726]" }],
  },
];
