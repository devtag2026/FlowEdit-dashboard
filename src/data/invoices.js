const invoices = [
  {
    id: "#001",
    plan: "Pro Plan (Monthly)",
    date: "11/1/2023",
    amount: "$999.00",
    status: "Paid",
  },
  {
    id: "#002",
    plan: "Pro Plan (Monthly)",
    date: "11/1/2023",
    amount: "$999.00",
    status: "Paid",
  },
  {
    id: "#003",
    plan: "Pro Plan (Monthly)",
    date: "11/1/2023",
    amount: "$999.00",
    status: "Paid",
  },
  {
    id: "#004",
    plan: "Pro Plan (Monthly)",
    date: "11/1/2023",
    amount: "$999.00",
    status: "Paid",
  },
];

export const getInvoices = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...invoices]);
    }, 500);
  });
};

export const downloadAllInvoices = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      alert(`Invoices Downloaded Successfully!`);
      resolve({ success: true });
    }, 500);
  });
};

export const downloadInvoice = (invoice) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      alert(`Invoice ${invoice.id} downloaded`);
      resolve({ success: true });
    }, 500);
  });
};
