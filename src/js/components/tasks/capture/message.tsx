import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Icon from '@salesforce/design-system-react/components/icon';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import { t } from 'i18next';
import React, { useState } from 'react';

import {
  BooleanObject,
  CommitData,
  ModalCard,
} from '@/js/components/tasks/capture';
import { UseFormProps } from '@/js/components/utils';

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
        <Icon category="utility" name="open_folder" size="small" />
        <code className="slds-p-left_x-small v-align-center">
          {inputs.target_directory}
        </code>
      </ModalCard>
      <ModalCard
        heading={
          <>
            <abbr className="slds-required" title="required">
              *
            </abbr>
            {t('Commit Message')}
          </>
        }
      >
        <Textarea
          id="commit-message"
          className="metecho-textarea"
          assistiveText={{ label: t('Commit Message') }}
          name="commit_message"
          value={inputs.commit_message}
          required
          aria-required
          errorText={errors.commit_message}
          onChange={handleInputChange}
        />
      </ModalCard>
      <ModalCard heading={t('Selected Changes')} noBodyPadding>
        <div data-form="task-capture">
          {Object.keys(inputs.changes)
            .sort()
            .map((groupName, index) => (
              <Accordion
                key={groupName}
                className={classNames('grow-inner-item', {
                  'light-bordered-row': index > 0,
                })}
              >
                <AccordionPanel
                  expanded={Boolean(expandedPanels[groupName])}
                  key={`${groupName}-panel`}
                  id={`group-${index}`}
                  onTogglePanel={() => handlePanelToggle(groupName)}
                  title={groupName}
                  summary={
                    <span className="form-grid slds-text-body_regular">
                      <span>{groupName}</span>
                      <span>({inputs.changes[groupName].length})</span>
                    </span>
                  }
                >
                  {inputs.changes[groupName].sort().map((change) => (
                    <div
                      key={`${groupName}-${change}`}
                      className="slds-p-left_xx-large"
                    >
                      {change}
                    </div>
                  ))}
                </AccordionPanel>
              </Accordion>
            ))}
        </div>
      </ModalCard>
    </form>
  );
};

export default CommitMessageForm;
