import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import { cloneDeep, isEmpty, omit } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

import {
  BooleanObject,
  CommitData,
  ModalCard,
} from '@/components/tasks/capture';
import { UseFormProps } from '@/components/utils/useForm';
import { Changeset } from '@/store/orgs/reducer';

interface Props {
  changeset: Changeset;
  inputs: CommitData;
  ignoredChangeset: Changeset;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
}

const ChangesForm = ({
  changeset,
  inputs,
  errors,
  setInputs,
  ignoredChangeset,
}: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});
  const [success, setSuccess] = useState(false);

  // remove changes from list that are ignored
  const filteredChangest: Changeset = omit(
    changeset,
    Object.keys(ignoredChangeset),
  );
  const totalChanges = Object.values(filteredChangest).flat().length;
  const changesChecked = Object.values(inputs.changes).flat().length;
  const allChangesChecked = changesChecked === totalChanges;
  const noChangesChecked = !changesChecked;

  const totalIgnored = Object.values(ignoredChangeset).flat().length;
  const ignoredChecked = Object.values(inputs.ignored_changes).flat().length;
  const allIgnoredChecked = ignoredChecked === totalIgnored;
  const noIgnoredChecked = !ignoredChecked;

  const setChanges = (changes: Changeset) => {
    setInputs({ ...inputs, changes });
  };
  const setIgnored = (ignored_changes: Changeset) => {
    setInputs({
      ...inputs,
      ignored_changes,
    });
  };
  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  const handleSelectGroup = (
    set: Changeset,
    groupName: string,
    checked: boolean,
  ) => {
    const newCheckedItems = cloneDeep(set);
    let changeGroup, action;
    if (set === inputs.changes) {
      changeGroup = changeset;
      action = setChanges(newCheckedItems);
    } else {
      changeGroup = ignoredChangeset;
      action = setIgnored(newCheckedItems);
    }
    if (checked) {
      newCheckedItems[groupName] = [...changeGroup[groupName]];
    } else {
      Reflect.deleteProperty(newCheckedItems, groupName);
    }
    return action;
  };

  const handleChange = (
    set: Changeset,
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
    const newCheckedItems = cloneDeep(set);
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
    if (set === inputs.changes) {
      setChanges(newCheckedItems);
    } else {
      setIgnored(newCheckedItems);
    }
  };

  const handleSelectAllChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    if (checked && totalChanges) {
      const allChanges = cloneDeep(changeset);
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
      const allChanges = cloneDeep(ignoredChangeset);
      setIgnored(allChanges);
    } else {
      setIgnored({});
    }
  };
  const successTimeout = useRef<NodeJS.Timeout | null>(null);
  const clearSuccessTimeout = () => {
    if (typeof successTimeout.current === 'number') {
      clearTimeout(successTimeout.current);
      successTimeout.current = null;
    }
  };
  /* check for when new changes are ignored*/
  const ignoredChanges = useRef(ignoredChangeset);
  useEffect(() => {
    const prevValue = ignoredChanges.current;
    const value = ignoredChangeset;
    if (value !== prevValue) {
      // show highlight when new changes are ignored
      if (totalIgnored > Object.values(prevValue).flat().length) {
        setSuccess(true);
      }
      // close the accodion if ignored list is emptied
      if (isEmpty(value)) {
        handlePanelToggle('allIgnored');
      }
    }
    successTimeout.current = setTimeout(() => {
      setSuccess(false);
    }, 2000);
    return () => clearSuccessTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignoredChangeset]);

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
              id="select-all"
              labels={{
                label: `${i18n.t('Select All Changes')}`,
              }}
              checked={totalChanges && allChangesChecked}
              indeterminate={Boolean(!allChangesChecked && !noChangesChecked)}
              errorText={errors.changes}
              onChange={handleSelectAllChange}
            />
            <span className="slds-text-body_regular slds-p-top_xxx-small">
              ({totalChanges})
            </span>
          </div>
          {Object.keys(filteredChangest)
            .sort()
            .map((groupName, index) => {
              const children = filteredChangest[groupName];
              const handleThisPanelToggle = () => handlePanelToggle(groupName);
              const handleSelectThisGroup = (
                event: React.ChangeEvent<HTMLInputElement>,
                { checked }: { checked: boolean },
              ) => handleSelectGroup(inputs.changes, groupName, checked);
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
                        ) =>
                          handleChange(inputs.changes, {
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
          {/* ignored changes panel, changesets are 
          placed here after they are ignored */}
          <Accordion
            key="allIgnored"
            className={classNames('light-bordered-row', {
              'success-highlight': success,
            })}
          >
            <AccordionPanel
              expanded={Boolean(expandedPanels.allIgnored)}
              key="allIgnored-panel"
              id="group-ignored"
              onTogglePanel={() => handlePanelToggle('allIgnored')}
              title="allIgnored"
              panelContentActions={
                <div className="form-grid">
                  <Checkbox
                    labels={{
                      label: i18n.t(
                        'All ignored - Changes placed here will remain ignored until you un-ignore them.',
                      ),
                    }}
                    checked={!isEmpty(ignoredChangeset) && allIgnoredChecked}
                    indeterminate={Boolean(
                      !allIgnoredChecked && !noIgnoredChecked,
                    )}
                    onChange={handleSelectAllIgnored}
                  />
                  <span
                    className="slds-text-body_regular
                            slds-p-top_xxx-small"
                  >
                    ({totalIgnored})
                  </span>
                </div>
              }
              summary=""
            >
              {/* inner accordian for each changeset */}
              {Object.keys(ignoredChangeset)
                .sort()
                .map((groupName, index) => {
                  const ignoredChildren = ignoredChangeset[groupName];
                  const identifier = `ignored-child-${index}`;
                  let checkedChildren = 0;
                  for (const child of ignoredChildren) {
                    if (inputs.ignored_changes[groupName]?.includes(child)) {
                      checkedChildren = checkedChildren + 1;
                    }
                  }
                  return (
                    <Accordion key={identifier}>
                      <AccordionPanel
                        expanded={Boolean(expandedPanels[identifier])}
                        key={identifier}
                        id={identifier}
                        onTogglePanel={() => handlePanelToggle(identifier)}
                        title="ignoredChildren"
                        panelContentActions={
                          <Checkbox
                            labels={{ label: groupName }}
                            name="ignored_changes"
                            checked={
                              allIgnoredChecked ||
                              checkedChildren === ignoredChildren.length
                            }
                            indeterminate={
                              Boolean(checkedChildren) && !allIgnoredChecked
                            }
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>,
                              { checked }: { checked: boolean },
                            ) =>
                              handleSelectGroup(
                                inputs.ignored_changes,
                                groupName,
                                checked,
                              )
                            }
                          />
                        }
                        summary=""
                      >
                        {/* children of ignored changesets */}
                        {ignoredChildren.sort().map((change, idx) => (
                          <Checkbox
                            key={`ignored-grandchild-${idx}`}
                            labels={{ label: change }}
                            className="slds-p-left_xx-large"
                            name="ignored_changes"
                            checked={Boolean(
                              inputs.ignored_changes[groupName]?.includes(
                                change,
                              ),
                            )}
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>,
                              { checked }: { checked: boolean },
                            ) =>
                              handleChange(inputs.ignored_changes, {
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
            </AccordionPanel>
          </Accordion>
        </>
      </ModalCard>
    </form>
  );
};

export default ChangesForm;
