import React, { useEffect, useRef, useState } from "react";

interface CircleProgressProps {
  working_hour: number;
  time: any;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  working_hour,
  time,
}) => {
  const { c_time, hrs, mins, secs } = time;
  const elapsed_seconds = Number(hrs) * 3600 + Number(mins) * 60 + Number(secs);
  
  // Calculate percentage with rounding to prevent floating point issues
  let value = Math.min(100, 
    Math.round((elapsed_seconds / working_hour) * 100 * 100) / 100
  );

  const [progressClass, setProgressClass] = useState<string>("");
  const circleRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!circleRef.current || !leftRef.current || !rightRef.current) return;

    const percentageToDegrees = (percentage: number) => (percentage / 100) * 360;

    // Reset rotations first
    rightRef.current.style.transform = 'rotate(0deg)';
    leftRef.current.style.transform = 'rotate(0deg)';

    if (value > 0) {
      if (value <= 50) {
        rightRef.current.style.transform = `rotate(${percentageToDegrees(value)}deg)`;
      } else {
        rightRef.current.style.transform = "rotate(180deg)";
        leftRef.current.style.transform = `rotate(${percentageToDegrees(value - 50)}deg)`;
      }
    }

    // Force complete closure at 100%
    if (value >= 100) {
      rightRef.current.style.transform = "rotate(180deg)";
      leftRef.current.style.transform = "rotate(180deg)";
      setProgressClass("border-secondary");
    } else if (value >= 80) {
      setProgressClass("border-info");
    } else if (value >= 50) {
      setProgressClass("border-success");
    } else if (value >= 25) {
      setProgressClass("border-warning");
    } else {
      setProgressClass("border-danger");
    }
  }, [value]);

  return (
    <div
      className="attendance-circle-progress attendance-progress mx-auto mb-3"
      data-value={value}
      ref={circleRef}
    >
      <span className="progress-left">
        <span className={`progress-bar ${progressClass}`} ref={leftRef} />
      </span>
      <span className="progress-right">
        <span className={`progress-bar ${progressClass}`} ref={rightRef} />
      </span>
      <div className="total-work-hours text-center w-100">
        <span className="fs-13 d-block mb-1">Total Hours</span>
        <h6>{c_time}</h6>
      </div>
    </div>
  );
};

export default CircleProgress;