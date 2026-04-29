import { Check } from "lucide-react";
import { Button } from "./../common/Button";

const PlanCard = ({ plan }) => {
  return (
    <div
      className={`relative bg-tertiary rounded-2xl md:rounded-3xl p-6 flex flex-col transition-all duration-300
        ${plan.highlighted
          ? "shadow-xl ring-2 ring-primary"
          : "hover:shadow-md"}`}
    >
      {plan.highlighted && (
        <span className="inline-flex items-center gap-1 self-center mb-3 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
          <Check size={10} /> Your Plan
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
            <span className="h-4 w-4 flex items-center justify-center rounded-full bg-primary/10">
              <Check size={10} className="text-primary" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {plan.buttonText && (
        <Button
          onClick={plan.onClick}
          disabled={plan.buttonDisabled}
          className={`rounded-lg py-2 transition
            ${plan.highlighted
              ? "bg-primary/10 text-primary font-semibold"
              : "bg-white text-accent hover:bg-slate-100"}
            ${plan.buttonDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {plan.buttonText}
        </Button>
      )}
    </div>
  );
};

export default PlanCard;
