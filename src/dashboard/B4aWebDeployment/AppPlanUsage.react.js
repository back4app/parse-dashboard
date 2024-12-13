import React from 'react'

const AppPlanUsage = (props) => {
  const { hours } = props;
  const usagePercentage = (hours / 600) * 100;

  let progressBarColour = 'bg-light-blue', hourTextColor = 'text-light-blue';
  if (usagePercentage >= 80 && usagePercentage <= 99) {
    progressBarColour = 'bg-alert-yellow';
    hourTextColor = 'text-alert-yellow';
  } else if (usagePercentage >= 100) {
    progressBarColour = 'bg-error-red'
    hourTextColor = 'text-error-red'
  }

  return <>
    <div className="text-sm mb-[0.375rem] w-full flex gap-6">
      <span>Build + Running hours</span>
      <span className={`${hourTextColor}`}>{hours} <span className="text-light-grey">/ 600 hours</span></span>
    </div>
    <div className="w-full bg-dark-grey rounded-full h-1.5">
      <div className={`${progressBarColour} h-1.5 rounded-full max-w-full`} style={{ width: `${usagePercentage}%`}}></div>
    </div>
  </>
}

export default AppPlanUsage;
