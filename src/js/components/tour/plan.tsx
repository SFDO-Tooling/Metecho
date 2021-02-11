import React, { useState } from 'react';
import Joyride, { EVENTS } from 'react-joyride';

// @@@ todo ypes for this, doesnt extend joyride
interface Props {
  joyride: {
    callback?: (data: any) => void;
  };
  handleCallback: (data: any) => void;
  run: boolean;
}

// @@@ todo types for steps
const tourElements = [
  {
    target: '.create-epic',
    content: 'This is my awesome feature!',
  },
];

const PlanTour = (props: Props) => {
  const [steps, setSteps] = useState(tourElements);
  //   const [run, setRun] = useState(false);

  //   const handleClickStart = (e) => {
  //     e.preventDefault();

  //     setRun(true);
  //   };
  //  @@ todo types

  return (
    <Joyride
      steps={steps}
      continuous={true}
      showSkipButton={true}
      run={props.run}
      locale={{
        last: 'End tour',
        skip: 'Close tour',
      }}
      callback={props.handleCallback}
    />
  );
};

export default PlanTour;
