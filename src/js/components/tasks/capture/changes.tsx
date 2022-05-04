import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BooleanObject,
  CommitData,
  ModalCard,
} from '@/js/components/tasks/capture';
import { UseFormProps } from '@/js/components/utils';
import { Changeset } from '@/js/store/orgs/reducer';
import { mergeChangesets, splitChangeset } from '@/js/utils/helpers';

interface Props {
  changeset: Changeset;
  ignoredChanges: Changeset;
  inputs: CommitData;
  changesChecked: Changeset;
  ignoredChecked: Changeset;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
  ignoredSuccess: boolean;
}

const ChangesList = ({
  type,
  allChanges,
  checkedChanges,
  expandedPanels,
  handlePanelToggle,
  handleSelectGroup,
  handleChange,
}: {
  type: 'changes' | 'ignored';
  allChanges: Changeset;
  checkedChanges: Changeset;
  expandedPanels: BooleanObject;
  handlePanelToggle: (groupName: string) => void;
  handleSelectGroup: (
    groupType: 'changes' | 'ignored',
    groupName: string,
    checked: boolean,
  ) => void;
  handleChange: ({
    groupName,
    change,
    checked,
  }: {
    groupName: string;
    change: string;
    checked: boolean;
  }) => void;
}) => (
  <>
    {Object.keys(allChanges)
      .sort()
      .map((groupName, index) => {
        const uniqueGroupName = `${type}-${groupName}`;
        const children = allChanges[groupName];
        const handleSelectThisGroup = (
          event: React.ChangeEvent<HTMLInputElement>,
          { checked }: { checked: boolean },
        ) => handleSelectGroup(type, groupName, checked);
        let checkedChildren = 0;
        for (const child of children) {
          if (checkedChanges[groupName]?.includes(child)) {
            checkedChildren = checkedChildren + 1;
          }
        }

        return (
          <Accordion key={uniqueGroupName} className="light-bordered-row">
            <AccordionPanel
              expanded={Boolean(expandedPanels[uniqueGroupName])}
              key={`${uniqueGroupName}-panel`}
              id={`${type}-group-${index}`}
              onTogglePanel={() => handlePanelToggle(uniqueGroupName)}
              title={groupName}
              panelContentActions={
                <div className="form-grid">
                  <Checkbox
                    labels={{ label: groupName }}
                    checked={checkedChildren === children.length}
                    indeterminate={Boolean(
                      checkedChildren && checkedChildren !== children.length,
                    )}
                    onChange={handleSelectThisGroup}
                  />
                  <span className="slds-text-body_regular slds-p-top_xxx-small">
                    ({children.length})
                  </span>
                </div>
              }
              summary=""
            >
              {children.sort().map((change) => (
                <Checkbox
                  key={`${uniqueGroupName}-${change}`}
                  labels={{ label: change }}
                  className="metecho-nested-checkboxes"
                  name="changes"
                  checked={Boolean(checkedChanges[groupName]?.includes(change))}
                  onChange={(
                    event: React.ChangeEvent<HTMLInputElement>,
                    { checked }: { checked: boolean },
                  ) => handleChange({ groupName, change, checked })}
                />
              ))}
            </AccordionPanel>
          </Accordion>
        );
      })}
  </>
);

const ChangesForm = ({
  changeset,
  ignoredChanges,
  inputs,
  changesChecked,
  ignoredChecked,
  errors,
  setInputs,
  ignoredSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  // remove ignored changes from full list
  const { remaining: filteredChanges } = splitChangeset(
    changeset,
    ignoredChanges,
  );

  const totalChanges = Object.values(filteredChanges).flat().length;
  const numberChangesChecked = Object.values(changesChecked).flat().length;
  const allChangesChecked = Boolean(
    totalChanges && numberChangesChecked === totalChanges,
  );
  const noChangesChecked = !numberChangesChecked;

  const totalIgnored = Object.values(ignoredChanges).flat().length;
  const numberIgnoredChecked = Object.values(ignoredChecked).flat().length;
  const allIgnoredChecked = Boolean(
    totalIgnored && numberIgnoredChecked === totalIgnored,
  );
  const noIgnoredChecked = !numberIgnoredChecked;

  const setChanges = (changes: Changeset) => {
    setInputs({ ...inputs, changes });
  };

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  const updateChecked = (changes: Changeset, checked: boolean) => {
    if (checked) {
      setChanges(mergeChangesets(inputs.changes, changes));
    } else {
      const { remaining } = splitChangeset(inputs.changes, changes);
      setChanges(remaining);
    }
  };

  const handleSelectGroup = (
    type: 'changes' | 'ignored',
    groupName: string,
    checked: boolean,
  ) => {
    const changes = type === 'changes' ? filteredChanges : ignoredChanges;
    const thisGroup: Changeset = { [groupName]: changes[groupName] };
    updateChecked(thisGroup, checked);
  };

  const handleChange = ({
    groupName,
    change,
    checked,
  }: {
    groupName: string;
    change: string;
    checked: boolean;
  }) => {
    const thisChange: Changeset = { [groupName]: [change] };
    updateChecked(thisChange, checked);
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    updateChecked(filteredChanges, checked);
  };

  const handleSelectAllIgnored = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    updateChecked(ignoredChanges, checked);
  };

  return (
    <form
      className="slds-form slds-p-around_large has-checkboxes"
      data-form="task-capture"
    >
      <ModalCard>
        <Icon category="utility" name="open_folder" size="small" />
        <code className="slds-p-left_x-small v-align-center">
          {inputs.target_directory}
        </code>
      </ModalCard>
      {totalChanges > 0 && (
        <ModalCard noBodyPadding>
          <>
            <div
              className="form-grid
                slds-m-left_xx-small
                slds-p-left_x-large
                slds-p-vertical_x-small
                slds-p-right_medium"
            >
              <Checkbox
                id="select-all-changes"
                labels={{
                  label: t('All Changes'),
                }}
                checked={allChangesChecked}
                indeterminate={Boolean(!allChangesChecked && !noChangesChecked)}
                errorText={errors.changes}
                onChange={handleSelectAllChange}
              />
              <span className="slds-text-body_regular slds-p-top_xxx-small">
                ({totalChanges})
              </span>
            </div>
            <ChangesList
              type="changes"
              allChanges={filteredChanges}
              checkedChanges={changesChecked}
              expandedPanels={expandedPanels}
              handlePanelToggle={handlePanelToggle}
              handleSelectGroup={handleSelectGroup}
              handleChange={handleChange}
            />
          </>
        </ModalCard>
      )}
      {totalIgnored > 0 && (
        <ModalCard noBodyPadding>
          <Accordion
            className={classNames('accordion-no-padding', {
              'success-highlight': ignoredSuccess,
            })}
          >
            <AccordionPanel
              expanded={Boolean(expandedPanels['all-ignored'])}
              id="all-ignored"
              title={t('All Ignored Changes')}
              onTogglePanel={() => handlePanelToggle('all-ignored')}
              panelContentActions={
                <div className="form-grid">
                  <div>
                    <Checkbox
                      id="select-all-ignored"
                      labels={{
                        label: t('All Ignored Changes'),
                      }}
                      className="slds-float_left"
                      checked={allIgnoredChecked}
                      indeterminate={Boolean(
                        !allIgnoredChecked && !noIgnoredChecked,
                      )}
                      onChange={handleSelectAllIgnored}
                    />
                    <Tooltip
                      content={t(
                        'Changes placed here will remain ignored until you un-ignore them.',
                      )}
                      position="overflowBoundaryElement"
                      align="top left"
                      dialogClassName="modal-tooltip"
                    />
                  </div>
                  <span className="slds-text-body_regular slds-p-top_xxx-small">
                    ({totalIgnored})
                  </span>
                </div>
              }
              summary=""
            >
              <ChangesList
                type="ignored"
                allChanges={ignoredChanges}
                checkedChanges={ignoredChecked}
                expandedPanels={expandedPanels}
                handlePanelToggle={handlePanelToggle}
                handleSelectGroup={handleSelectGroup}
                handleChange={handleChange}
              />
            </AccordionPanel>
          </Accordion>
        </ModalCard>
      )}
    </form>
  );
};

export default ChangesForm;
