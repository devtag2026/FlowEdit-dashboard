import { Check } from "lucide-react";
import { Button } from "./../common/Button";

const PlanCard = ({ plan }) => {
  return (
    <div
      className={`relative bg-tertiary rounded-2xl md:rounded-3xl p-4 md:p-4 flex flex-col transition-all duration-300
        ${plan.highlighted ? "shadow-xl scale-100" : "scale-97"}`}
    >
      {plan.highlighted && (
        <span className="text-xs absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white md:text-sm px-4 py-2 rounded-lg shadow">
          Current Plan
        </span>
      )}

      <h3 className="text-xl text-center font-semibold text-slate-600 mb-1">
        {plan.title}
      </h3>

      <div className="my-3 text-center">
        <span className="text-4xl font-bold text-accent">{plan.price}</span>
        <span className="text-slate-600"> / month</span>
      </div>

      <p className="text-center text-sm text-slate-600 mb-10">
        {plan.description}
      </p>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-3 text-accent text-sm"
          >
            <span
              className={`h-4 w-4 flex items-center justify-center rounded-full
          ${plan.highlighted ? "bg-slate-300" : "bg-white"}`}
            >
              <Check size={10} className="text-slate-600" />
            </span>

            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={plan.onClick}
        disabled={plan.buttonDisabled}
        className={`rounded-lg py-2 transition
          ${plan.highlighted ? "bg-tertiary text-slate-400 shadow-xl" : "bg-white text-accent"}
          ${plan.buttonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100"}`}
      >
        {plan.buttonText}
      </Button>
    </div>
  );
};

export default PlanCard;
