import React from 'react';

import PathItem from '@/js/components/path/pathItem';

interface PathProps {
  steps: string[];
  activeIdx?: number;
  isCompleted?: boolean;
  isLost?: boolean;
  label?: string;
}

const Path = ({ steps, activeIdx, isCompleted, isLost, label }: PathProps) => (
  <div className="slds-region_small">
    <div className="slds-path">
      <div className="slds-grid slds-path__track">
        <ul
          className="slds-path__nav"
          role="listbox"
          aria-orientation="horizontal"
          aria-label={label}
        >
          {steps.map((step, idx) => (
            <PathItem
              key={idx}
              steps={steps}
              idx={idx}
              activeIdx={activeIdx}
              isCompleted={isCompleted}
              isLost={isLost}
            />
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default Path;
