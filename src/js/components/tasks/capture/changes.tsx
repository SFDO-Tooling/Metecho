import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import i18n from 'i18next';
import cloneDeep from 'lodash.clonedeep';
import React, { useState } from 'react';

import { CommitData } from '@/components/tasks/capture';
import { Changeset } from '@/store/orgs/reducer';

interface Props {
  changeset: Changeset;
  inputs: CommitData;
  errors: {
    [key: string]: string;
  };
  setInputs: React.Dispatch<
    React.SetStateAction<{
      [key: string]: any;
    }>
  >;
}

export interface BooleanObject {
  [key: string]: boolean;
}

const ChangesForm = ({ changeset, inputs, errors, setInputs }: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  const setChanges = (changes: Changeset) => {
    setInputs({ ...inputs, changes });
  };

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  const handleSelectGroup = (groupName: string, checked: boolean) => {
    const newCheckedItems = cloneDeep(inputs.changes);
    if (checked) {
      newCheckedItems[groupName] = [...changeset[groupName]];
    } else {
      Reflect.deleteProperty(newCheckedItems, groupName);
    }
    setChanges(newCheckedItems);
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
    const newCheckedItems = cloneDeep(inputs.changes);
    const changes = newCheckedItems[groupName];
    if (checked) {
      if (changes) {
        /* istanbul ignore else */
        if (!changes.includes(change)) {
          changes.push(change);
        }
      } else {
        newCheckedItems[groupName] = [change];
      }
    } else {
      /* istanbul ignore else */
      // eslint-disable-next-line no-lonely-if
      if (changes?.includes(change)) {
        changes.splice(changes.indexOf(change), 1);
      }
    }
    setChanges(newCheckedItems);
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    if (checked) {
      const allChanges = cloneDeep(changeset);
      setChanges(allChanges);
    } else {
      setChanges({});
    }
  };

  const totalChanges = Object.values(changeset).flat().length;
  const changesChecked = Object.values(inputs.changes).flat().length;
  const allChangesChecked = changesChecked === totalChanges;
  const noChangesChecked = !changesChecked;

  return (
    <form className="slds-form slds-p-around_large" data-form="task-capture">
      <div className="form-grid slds-p-around_x-small">
        <Checkbox
          id="select-all"
          labels={{
            label: `${i18n.t('Select All Changes')}`,
          }}
          className="slds-p-left_none select-header-action-col"
          checked={allChangesChecked}
          indeterminate={Boolean(!allChangesChecked && !noChangesChecked)}
          errorText={errors.changes}
          onChange={handleSelectAllChange}
        />
        <span className="select-header-changes-col">({totalChanges})</span>
      </div>
      {Object.keys(changeset)
        .sort()
        .map((groupName, index) => {
          const children = changeset[groupName];
          const handleThisPanelToggle = () => handlePanelToggle(groupName);
          const handleSelectThisGroup = (
            event: React.ChangeEvent<HTMLInputElement>,
            { checked }: { checked: boolean },
          ) => handleSelectGroup(groupName, checked);
          let checkedChildren = 0;
          for (const child of children) {
            if (inputs.changes[groupName]?.includes(child)) {
              checkedChildren = checkedChildren + 1;
            }
          }

          return (
            <Accordion key={groupName} className="light-bordered-row">
              <AccordionPanel
                expanded={Boolean(expandedPanels[groupName])}
                key={`${groupName}-panel`}
                id={`group-${index}`}
                onTogglePanel={handleThisPanelToggle}
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
                    <span className="slds-text-body_regular">
                      ({children.length})
                    </span>
                  </div>
                }
                summary=""
              >
                {children.sort().map((change) => (
                  <Checkbox
                    key={`${groupName}-${change}`}
                    labels={{
                      label: change,
                    }}
                    className="slds-p-left_xx-large"
                    name="changes"
                    checked={Boolean(
                      inputs.changes[groupName]?.includes(change),
                    )}
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
    </form>
  );
};

export default ChangesForm;
