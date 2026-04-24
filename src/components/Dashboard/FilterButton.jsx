"use client";
const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
      active
        ? "bg-primary text-white font-medium font-onest shadow-md"
        : "bg-white font-medium text-accent font-onest hover:bg-accent/5"
    }`}
  >
    {children}
  </button>
);
export default FilterButton;
