import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import i18n from 'i18next';
import { cloneDeep, without } from 'lodash';
import React, { useState } from 'react';

import {
  BooleanObject,
  CommitData,
  IgnoredChangesData,
  ModalCard,
} from '@/components/tasks/capture';
import { UseFormProps } from '@/components/utils/useForm';
import { Changeset } from '@/store/orgs/reducer';

interface Props {
  changeset: Changeset;
  ignoredChanges: Changeset;
  inputs: CommitData;
  ignoredInputs: IgnoredChangesData;
  errors: UseFormProps['errors'];
  ignoredErrors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
  setIgnoredInputs: UseFormProps['setInputs'];
  ignoredSuccess: boolean;
}

const ChangesForm = ({
  changeset,
  ignoredChanges,
  inputs,
  ignoredInputs,
  errors,
  ignoredErrors,
  setInputs,
  setIgnoredInputs,
  ignoredSuccess,
}: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  // remove ignored changes from list
  const filteredChanges: Changeset = {};
  for (const groupName of Object.keys(changeset)) {
    if (ignoredChanges[groupName]?.length) {
      const filtered = without(
        changeset[groupName],
        ...ignoredChanges[groupName],
      );
      if (filtered.length) {
        filteredChanges[groupName] = filtered;
      }
    } else {
      filteredChanges[groupName] = changeset[groupName];
    }
  }

  const totalChanges = Object.values(filteredChanges).flat().length;
  const changesChecked = Object.values(inputs.changes).flat().length;
  const allChangesChecked = Boolean(
    totalChanges && changesChecked === totalChanges,
  );
  const noChangesChecked = !changesChecked;

  const totalIgnored = Object.values(ignoredChanges).flat().length;
  const ignoredChecked = Object.values(ignoredInputs.ignored_changes).flat()
    .length;
  const allIgnoredChecked = Boolean(
    totalIgnored && ignoredChecked === totalIgnored,
  );
  const noIgnoredChecked = !ignoredChecked;

  const setChanges = (changes: Changeset) => {
    setInputs({ ...inputs, changes });
  };
  const setIgnored = (ignored: Changeset) => {
    setIgnoredInputs({
      ...ignoredInputs,
      ignored_changes: ignored,
    });
  };

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  const handleSelectGroup = (
    type: 'changes' | 'ignored',
    groupName: string,
    checked: boolean,
  ) => {
    let inputsSet, changesSet, action;
    if (type === 'changes') {
      inputsSet = inputs.changes;
      changesSet = filteredChanges;
      action = setChanges;
    } else {
      inputsSet = ignoredInputs.ignored_changes;
      changesSet = ignoredChanges;
      action = setIgnored;
    }
    const newCheckedItems = cloneDeep(inputsSet);
    if (checked) {
      newCheckedItems[groupName] = [...changesSet[groupName]];
    } else {
      Reflect.deleteProperty(newCheckedItems, groupName);
    }
    action(newCheckedItems);
  };

  const handleChange = (
    type: 'changes' | 'ignored',
    {
      groupName,
      change,
      checked,
    }: {
      groupName: string;
      change: string;
      checked: boolean;
    },
  ) => {
    let inputsSet, action;
    if (type === 'changes') {
      inputsSet = inputs.changes;
      action = setChanges;
    } else {
      inputsSet = ignoredInputs.ignored_changes;
      action = setIgnored;
    }
    const newCheckedItems = cloneDeep(inputsSet);
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
    action(newCheckedItems);
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    if (checked) {
      const allChanges = cloneDeep(filteredChanges);
      setChanges(allChanges);
    } else {
      setChanges({});
    }
  };

  const handleSelectAllIgnored = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    if (checked) {
      const allChanges = cloneDeep(ignoredChanges);
      setIgnored(allChanges);
    } else {
      setIgnored({});
    }
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
                label: `${i18n.t('Select All Changes')}`,
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
          {Object.keys(filteredChanges)
            .sort()
            .map((groupName, index) => {
              const uniqueGroupName = `change-${groupName}`;
              const children = filteredChanges[groupName];
              const handleThisPanelToggle = () =>
                handlePanelToggle(uniqueGroupName);
              const handleSelectThisGroup = (
                event: React.ChangeEvent<HTMLInputElement>,
                { checked }: { checked: boolean },
              ) => handleSelectGroup('changes', groupName, checked);
              let checkedChildren = 0;
              for (const child of children) {
                if (inputs.changes[groupName]?.includes(child)) {
                  checkedChildren = checkedChildren + 1;
                }
              }

              return (
                <Accordion key={uniqueGroupName} className="light-bordered-row">
                  <AccordionPanel
                    expanded={Boolean(expandedPanels[uniqueGroupName])}
                    key={`${uniqueGroupName}-panel`}
                    id={`group-${index}`}
                    onTogglePanel={handleThisPanelToggle}
                    title={groupName}
                    panelContentActions={
                      <div className="form-grid">
                        <Checkbox
                          labels={{ label: groupName }}
                          checked={checkedChildren === children.length}
                          indeterminate={Boolean(
                            checkedChildren &&
                              checkedChildren !== children.length,
                          )}
                          onChange={handleSelectThisGroup}
                        />
                        <span
                          className="slds-text-body_regular
                            slds-p-top_xxx-small"
                        >
                          ({children.length})
                        </span>
                      </div>
                    }
                    summary=""
                  >
                    {children.sort().map((change) => (
                      <Checkbox
                        key={`${uniqueGroupName}-${change}`}
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
                        ) =>
                          handleChange('changes', {
                            groupName,
                            change,
                            checked,
                          })
                        }
                      />
                    ))}
                  </AccordionPanel>
                </Accordion>
              );
            })}
        </>
      </ModalCard>
      {totalIgnored > 0 && (
        <ModalCard noBodyPadding>
          <>
            <div
              className={classNames(
                'form-grid',
                'slds-m-left_xx-small',
                'slds-p-left_x-large',
                'slds-p-vertical_x-small',
                'slds-p-right_medium',
                {
                  'success-highlight': ignoredSuccess,
                },
              )}
            >
              <div>
                <Checkbox
                  id="select-all-ignored"
                  labels={{
                    label: i18n.t('Select All Ignored Changes'),
                  }}
                  className="slds-float_left"
                  checked={allIgnoredChecked}
                  indeterminate={Boolean(
                    !allIgnoredChecked && !noIgnoredChecked,
                  )}
                  errorText={ignoredErrors.ignored_changes}
                  onChange={handleSelectAllIgnored}
                />
                <Tooltip
                  content={i18n.t(
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
            {Object.keys(ignoredChanges)
              .sort()
              .map((groupName, index) => {
                const uniqueGroupName = `ignored-${groupName}`;
                const children = ignoredChanges[groupName];
                const handleThisPanelToggle = () =>
                  handlePanelToggle(uniqueGroupName);
                const handleSelectThisGroup = (
                  event: React.ChangeEvent<HTMLInputElement>,
                  { checked }: { checked: boolean },
                ) => handleSelectGroup('ignored', groupName, checked);
                let checkedChildren = 0;
                for (const child of children) {
                  if (
                    ignoredInputs.ignored_changes[groupName]?.includes(child)
                  ) {
                    checkedChildren = checkedChildren + 1;
                  }
                }

                return (
                  <Accordion
                    key={uniqueGroupName}
                    className="light-bordered-row"
                  >
                    <AccordionPanel
                      expanded={Boolean(expandedPanels[uniqueGroupName])}
                      key={`${uniqueGroupName}-panel`}
                      id={`group-${index}`}
                      onTogglePanel={handleThisPanelToggle}
                      title={groupName}
                      panelContentActions={
                        <div className="form-grid">
                          <Checkbox
                            labels={{ label: groupName }}
                            checked={checkedChildren === children.length}
                            indeterminate={Boolean(
                              checkedChildren &&
                                checkedChildren !== children.length,
                            )}
                            onChange={handleSelectThisGroup}
                          />
                          <span
                            className="slds-text-body_regular
                            slds-p-top_xxx-small"
                          >
                            ({children.length})
                          </span>
                        </div>
                      }
                      summary=""
                    >
                      {children.sort().map((change) => (
                        <Checkbox
                          key={`${uniqueGroupName}-${change}`}
                          labels={{
                            label: change,
                          }}
                          className="slds-p-left_xx-large"
                          name="ignored_changes"
                          checked={Boolean(
                            ignoredInputs.ignored_changes[groupName]?.includes(
                              change,
                            ),
                          )}
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>,
                            { checked }: { checked: boolean },
                          ) =>
                            handleChange('ignored', {
                              groupName,
                              change,
                              checked,
                            })
                          }
                        />
                      ))}
                    </AccordionPanel>
                  </Accordion>
                );
              })}
          </>
        </ModalCard>
      )}
    </form>
  );
};

export default ChangesForm;
