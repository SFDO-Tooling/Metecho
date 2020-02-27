import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Card from '@salesforce/design-system-react/components/card';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';

import { CommitData } from '@/components/tasks/capture';
import { BooleanObject } from '@/components/tasks/capture/changes';

interface Props {
  inputs: CommitData;
  errors: {
    [key: string]: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CommitMessageForm = ({ inputs, errors, handleInputChange }: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  // const totalChanges = Object.values(changeset).flat().length;
  // const changesChecked = Object.values(inputs.changes).flat().length;

  return (
    <form className="slds-form slds-p-around_large">
      <Card
        className="slds-card_boundary"
        heading={
          <>
            <abbr className="slds-required" title="required">
              *
            </abbr>
            {i18n.t('Commit Message')}
          </>
        }
      >
        <hr className="slds-m-vertical_none" />
        <Textarea
          id="commit-message"
          className="ms-textarea"
          classNameContainer="slds-p-horizontal_medium slds-m-vertical_medium"
          assistiveText={{ label: i18n.t('Commit Message') }}
          name="commit_message"
          value={inputs.commit_message}
          required
          aria-required
          maxLength="50"
          errorText={errors.commit_message}
          onChange={handleInputChange}
        />
      </Card>
      <Card className="slds-card_boundary" heading={i18n.t('Directory')}>
        <hr className="slds-m-vertical_none" />
        <div className="slds-p-horizontal_medium slds-m-vertical_medium">
          {inputs.target_directory}
        </div>
      </Card>
      <Card className="slds-card_boundary" heading={i18n.t('Selected Changes')}>
        <hr className="slds-m-vertical_none" />
        <div className="slds-p-horizontal_medium slds-m-vertical_medium">
          {Object.keys(inputs.changes)
            .sort()
            .map((groupName, index) => {
              const children = inputs.changes[groupName];
              const handleThisPanelToggle = () => handlePanelToggle(groupName);
              return (
                <Accordion key={groupName} className="light-bordered-row">
                  <AccordionPanel
                    expanded={Boolean(expandedPanels[groupName])}
                    key={`${groupName}-panel`}
                    id={`group-${index}`}
                    onTogglePanel={handleThisPanelToggle}
                    title={groupName}
                    summary={
                      <div className="form-grid">
                        {groupName}
                        <span className="slds-text-body_regular">
                          ({children.length})
                        </span>
                      </div>
                    }
                  >
                    {children.sort().map((change) => (
                      <div
                        key={`${groupName}-${change}`}
                        className="slds-p-left_xx-large"
                      >
                        {change}
                      </div>
                    ))}
                  </AccordionPanel>
                </Accordion>
              );
            })}
        </div>
      </Card>
    </form>
  );
};

export default CommitMessageForm;
