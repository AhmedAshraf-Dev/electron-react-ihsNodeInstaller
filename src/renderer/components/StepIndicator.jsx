import React, { useContext, useEffect, useState } from "react";
import {
  getStepByKey,
  getStepIndexByKey,
} from "../hooks/AppHooks/setup/constants";
import { LanguageContext } from "../context/Language";

export const StepIndicator = ({
  currentStep,
  handlePreviousStep = () => {},
  steps = [],
}) => {
  const { localization } = useContext(LanguageContext);
  const currentIndex = getStepIndexByKey(currentStep?.key);

  const arrayIndex = steps.findIndex((s) => s.key === currentStep?.key);
  const [isRtl, setIsRtl] = useState(false);

  // Auto-detect document direction
  useEffect(() => {
    const checkDir = () => {
      const dir = document.documentElement.dir || document.body.dir;
      setIsRtl(dir === "rtl");
    };

    checkDir();
    const observer = new MutationObserver(checkDir);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });

    return () => observer.disconnect();
  }, []);
  // const currentIndex = arrayIndex !== -1 ? arrayIndex : (getStepByKey(currentStep?.key) ?? 0);

  return (
    <div className="w-full overflow-hidden">
      <div className="flex w-full items-start px-1 py-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <React.Fragment key={step.id || step.key || index}>
              {/* Step */}
              <div className="flex shrink-0 flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                flex h-8 w-8 min-h-8 min-w-8
                items-center justify-center
                rounded-full
                border-2
                text-xs font-semibold
                transition-all duration-300
                sm:h-8 sm:w-8
                ${
                  isActive
                    ? "border-[var(--base-accent)] bg-[var(--base-accent)] text-[var(--base-bg)]"
                    : isCompleted
                      ? "border-[var(--base-primary)] bg-[var(--base-primary)] text-[var(--base-bg)]"
                      : "border-[var(--base-border-color)] bg-[var(--base-bg)] text-[var(--base-text-color)]"
                }
              `}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>

                {/* Label */}
                <span
                  className={`
                mt-2
                max-w-[65px]
                text-center
                text-[9px]
                leading-tight
                transition-all duration-300
                sm:max-w-[90px]
                sm:text-[10px]
                md:max-w-[140px]
                md:text-xs
                ${
                  isActive
                    ? "font-semibold text-[var(--base-accent)] opacity-100"
                    : isCompleted
                      ? "font-medium text-[var(--base-primary)] opacity-100"
                      : "font-medium text-[var(--base-text-color)] opacity-50"
                }
              `}
                >
                  {localization?.setup?.steps?.[step.key] || step.label}
                </span>
              </div>

              {/* Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                mt-4
                h-0.5
                min-w-[6px]
                flex-1
                transition-colors duration-300
                sm:mx-1 sm:min-w-[10px]
                md:mx-2
                ${
                  index < currentIndex
                    ? "bg-[var(--base-primary)]"
                    : "bg-[var(--base-border-color)]"
                }
              `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
