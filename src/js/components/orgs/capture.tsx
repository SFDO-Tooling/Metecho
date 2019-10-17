import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import cloneDeep from 'lodash.clonedeep';
import React, { useRef, useState } from 'react';

import { LabelWithSpinner, useForm, useIsMounted } from '@/components/utils';
import { Changeset } from '@/store/orgs/reducer';
import { OBJECT_TYPES } from '@/utils/constants';
import { getOrgChildChanges, getOrgTotalChanges } from '@/utils/helpers';

interface Props {
  orgId: string;
  changeset: Changeset;
  isOpen: boolean;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Inputs {
  changes: Changeset;
  commit_message: string;
}

interface BooleanObject {
  [key: string]: boolean;
}

const CaptureModal = ({ orgId, changeset, isOpen, toggleModal }: Props) => {
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});
  const [capturingChanges, setCapturingChanges] = useState(false);
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setCapturingChanges(false);
      toggleModal(false);
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setCapturingChanges(false);
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/camelcase
    fields: { changes: {}, commit_message: '' },
    objectType: OBJECT_TYPES.COMMIT,
    url: window.api_urls.scratch_org_commit(orgId),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const setChanges = (changes: Changeset) => {
    setInputs({ ...(inputs as Inputs), changes });
  };

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  const handleSelectGroup = (groupName: string, checked: boolean) => {
    const newCheckedItems = cloneDeep((inputs as Inputs).changes);
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
    const newCheckedItems = cloneDeep((inputs as Inputs).changes);
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
      if (changes && changes.includes(change)) {
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

  const handleSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  const handleClose = () => {
    toggleModal(false);
    resetForm();
  };

  const submitChanges = (e: React.FormEvent<HTMLFormElement>) => {
    setCapturingChanges(true);
    handleSubmit(e);
  };

  const totalChanges = Object.values(changeset).flat().length;
  const changesChecked = Object.values((inputs as Inputs).changes).flat()
    .length;
  const allChangesChecked = changesChecked === totalChanges;
  const noChangesChecked = !changesChecked;

  return (
    <Modal
      isOpen={isOpen}
      size="medium"
      disableClose={capturingChanges}
      heading={i18n.t('Select the changes to capture')}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          disabled={capturingChanges}
          onClick={handleClose}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            capturingChanges ? (
              <LabelWithSpinner
                label={i18n.t('Capturing Selected Changes…')}
                variant="inverse"
              />
            ) : (
              i18n.t('Capture Selected Changes')
            )
          }
          variant="brand"
          onClick={handleSubmitClicked}
          disabled={!changesChecked || capturingChanges}
        />,
      ]}
      onRequestClose={handleClose}
    >
      <form
        className="slds-form"
        data-form="task-capture"
        onSubmit={submitChanges}
      >
        <div className="slds-scrollable_y slds-p-around_large">
          <div className="form-grid slds-p-around_x-small">
            <Checkbox
              id="select-all"
              labels={{
                label: `${i18n.t('Select All')}`,
              }}
              className="slds-p-left_none select-header-action-col"
              checked={allChangesChecked}
              indeterminate={Boolean(!allChangesChecked && !noChangesChecked)}
              errorText={errors.changes}
              onChange={handleSelectAllChange}
            />
            <span className="select-header-changes-col">
              ({getOrgTotalChanges(changeset)})
            </span>
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
                if (
                  (inputs as Inputs).changes[groupName] &&
                  (inputs as Inputs).changes[groupName].includes(child)
                ) {
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
                        <span className="slds-text-body_regular">
                          ({getOrgChildChanges(children.length)})
                        </span>
                      </div>
                    }
                    summary=""
                  >
                    {changeset[groupName].sort().map((change) => (
                      <Checkbox
                        key={`${groupName}-${change}`}
                        labels={{
                          label: change,
                        }}
                        className="slds-p-left_xx-large"
                        name="changes"
                        checked={Boolean(
                          (inputs as Inputs).changes[groupName] &&
                            (inputs as Inputs).changes[groupName].includes(
                              change,
                            ),
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
        </div>
        <Input
          id="commit-message"
          label={i18n.t('Commit Message')}
          className="slds-p-vertical_medium slds-p-horizontal_large"
          name="commit_message"
          value={(inputs as Inputs).commit_message}
          required
          aria-required
          maxLength="50"
          errorText={errors.commit_message}
          onChange={handleInputChange}
        />
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={!changesChecked || capturingChanges}
        />
      </form>
    </Modal>
  );
};

export default CaptureModal;
