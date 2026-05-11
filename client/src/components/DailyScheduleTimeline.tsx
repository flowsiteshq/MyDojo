import { useState } from "react";

interface ScheduleStep {
  time: string;
  ampm: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  bgColor: string;
}

const steps: ScheduleStep[] = [
  {
    time: "8:00",
    ampm: "AM",
    label: "DROP OFF",
    desc: "Campers arrive, check in, and get ready for an awesome day!",
    icon: "🚗",
    color: "#e53e3e",
    bgColor: "#e53e3e",
  },
  {
    time: "9:00",
    ampm: "AM",
    label: "MARTIAL ARTS TRAINING",
    desc: "Build confidence, focus, and strength with expert instruction.",
    icon: "🥋",
    color: "#dd6b20",
    bgColor: "#dd6b20",
  },
  {
    time: "11:00",
    ampm: "AM",
    label: "GAMES & CHALLENGES",
    desc: "Fun games and challenges that encourage teamwork and leadership.",
    icon: "🏆",
    color: "#38a169",
    bgColor: "#38a169",
  },
  {
    time: "12:00",
    ampm: "PM",
    label: "LUNCH TIME",
    desc: "Recharge with a healthy lunch and relax with friends.",
    icon: "🍕",
    color: "#319795",
    bgColor: "#319795",
  },
  {
    time: "1:00",
    ampm: "PM",
    label: "TEAM ACTIVITIES",
    desc: "Collaborate, create, and have fun with exciting team activities.",
    icon: "⭐",
    color: "#3182ce",
    bgColor: "#3182ce",
  },
  {
    time: "3:00",
    ampm: "PM",
    label: "PICK UP",
    desc: "Campers wrap up the day and get picked up with big smiles!",
    icon: "🏠",
    color: "#d69e2e",
    bgColor: "#d69e2e",
  },
];

export function DailyScheduleTimeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-900">
          A DAY AT{" "}
          <span style={{ color: "#e53e3e" }}>SUMMER CAMP</span>
        </h2>
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:block relative">
        {/* Dashed line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "52px",
            height: "3px",
            backgroundImage:
              "repeating-linear-gradient(to right, #1a1a1a 0, #1a1a1a 12px, transparent 12px, transparent 24px)",
            zIndex: 0,
          }}
        />
        {/* Arrow at end */}
        <div
          className="absolute"
          style={{
            top: "40px",
            right: "-8px",
            width: 0,
            height: 0,
            borderTop: "14px solid transparent",
            borderBottom: "14px solid transparent",
            borderLeft: "20px solid #d69e2e",
            zIndex: 1,
          }}
        />

        {/* Steps */}
        <div className="grid grid-cols-6 gap-2 relative z-10">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center cursor-pointer group"
              onMouseEnter={() => setActiveStep(i)}
              onMouseLeave={() => setActiveStep(null)}
            >
              {/* Circle icon */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform duration-200 group-hover:scale-110 border-4 border-white"
                style={{
                  background: step.bgColor,
                  transform: activeStep === i ? "scale(1.12)" : "scale(1)",
                  boxShadow:
                    activeStep === i
                      ? `0 8px 30px ${step.bgColor}88`
                      : "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <span style={{ fontSize: "2rem" }}>{step.icon}</span>
              </div>

              {/* Time */}
              <div className="mt-3 text-center">
                <span
                  className="text-xl font-black"
                  style={{ color: step.color }}
                >
                  {step.time}
                </span>
                <span
                  className="text-xs font-bold ml-0.5"
                  style={{ color: step.color }}
                >
                  {step.ampm}
                </span>
              </div>

              {/* Label */}
              <div className="mt-1 text-center">
                <p className="text-sm font-black uppercase text-gray-900 leading-tight">
                  {step.label}
                </p>
              </div>

              {/* Description — shown on hover */}
              <div
                className="mt-2 text-center overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: activeStep === i ? "80px" : "0px",
                  opacity: activeStep === i ? 1 : 0,
                }}
              >
                <p className="text-xs text-gray-500 leading-snug px-1">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Timeline — vertical */}
      <div className="md:hidden relative pl-10">
        {/* Vertical dashed line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, #1a1a1a 0, #1a1a1a 8px, transparent 8px, transparent 16px)",
          }}
        />

        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 cursor-pointer"
              onClick={() =>
                setActiveStep(activeStep === i ? null : i)
              }
            >
              {/* Circle icon — positioned over the line */}
              <div
                className="absolute -left-1 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white shadow-md"
                style={{
                  background: step.bgColor,
                  marginLeft: "-1px",
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="ml-8 pb-2">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span
                    className="text-lg font-black"
                    style={{ color: step.color }}
                  >
                    {step.time}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: step.color }}
                  >
                    {step.ampm}
                  </span>
                </div>
                <p className="font-black uppercase text-sm text-gray-900 leading-tight">
                  {step.label}
                </p>
                <p
                  className="text-xs text-gray-500 mt-1 leading-snug overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: activeStep === i ? "60px" : "0px",
                    opacity: activeStep === i ? 1 : 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
