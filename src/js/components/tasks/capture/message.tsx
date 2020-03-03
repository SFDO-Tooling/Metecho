import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Icon from '@salesforce/design-system-react/components/icon';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';

import {
  BooleanObject,
  CommitData,
  ModalCard,
} from '@/components/tasks/capture';
import { UseFormProps } from '@/components/utils/useForm';

interface Props {
  inputs: CommitData;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const CommitMessageForm = ({ inputs, errors, handleInputChange }: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  return (
    <form className="slds-form slds-p-around_large">
      <ModalCard>
        <pre>
          <Icon category="utility" name="open_folder" size="small" />
          <span className="slds-p-left_x-small v-align-center">
            {inputs.target_directory}
          </span>
        </pre>
      </ModalCard>
      <ModalCard
        heading={
          <>
            <abbr className="slds-required" title="required">
              *
            </abbr>
            {i18n.t('Commit Message')}
          </>
        }
      >
        <Textarea
          id="commit-message"
          className="ms-textarea"
          assistiveText={{ label: i18n.t('Commit Message') }}
          name="commit_message"
          value={inputs.commit_message}
          required
          aria-required
          errorText={errors.commit_message}
          onChange={handleInputChange}
        />
      </ModalCard>
      <ModalCard heading={i18n.t('Selected Changes')} noBodyPadding>
        <div data-form="task-capture">
          {Object.keys(inputs.changes)
            .sort()
            .map((groupName, index) => {
              const children = inputs.changes[groupName];
              const handleThisPanelToggle = () => handlePanelToggle(groupName);
              return (
                <Accordion
                  key={groupName}
                  className="light-bordered-row grow-inner-item"
                >
                  <AccordionPanel
                    expanded={Boolean(expandedPanels[groupName])}
                    key={`${groupName}-panel`}
                    id={`group-${index}`}
                    onTogglePanel={handleThisPanelToggle}
                    title={groupName}
                    summary={
                      <span className="form-grid slds-text-body_regular">
                        <span>{groupName}</span>
                        <span>({children.length})</span>
                      </span>
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
      </ModalCard>
    </form>
  );
};

export default CommitMessageForm;
