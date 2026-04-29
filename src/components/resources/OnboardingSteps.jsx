"use client";

const OnboardingSteps = ({ steps }) => {
  const completedCount = steps.filter((s) => s.completed).length;

  // Progress line fills between first and last completed step
  const progressPercent =
    steps.length > 1
      ? Math.min((completedCount / (steps.length - 1)) * 100, 100)
      : 0;

  return (
    <div className="py-6">
      <div className="relative">
        {/* ── Background track ── */}
        <div className="absolute top-3 md:top-4 h-0.5 md:h-1 bg-gray-300"
          style={{ left: "2%", right: "2%" }}
        >
          {/* ── Filled progress ── */}
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── Steps ── */}
        <div className="flex justify-between relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[8px] md:text-xs font-bold mb-1 transition-all ${
                  step.completed
                    ? "bg-primary text-white"           // completed — filled purple
                    : "bg-white border-2 border-gray-300 text-gray-400" // incomplete — white circle
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <span className="text-[8px] md:text-xs text-accent text-center leading-tight">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSteps;
