import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import React, { ChangeEvent, RefObject, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import {
  BooleanObject,
  MetadataCommit,
  ModalCard,
} from '@/js/components/tasks/retrieveMetadata';
import { SpinnerWrapper, UseFormProps } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { Changeset } from '@/js/store/orgs/reducer';
import apiFetch from '@/js/utils/api';
import { mergeChangesets, splitChangeset } from '@/js/utils/helpers';

interface Props {
  changeset: Changeset;
  ignoredChanges: Changeset;
  inputs: MetadataCommit;
  changesChecked: Changeset;
  ignoredChecked: Changeset;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
  ignoredSuccess: boolean;
  hasmetadatachanges: boolean;
  metadatachanges: Changeset;
  id: string;
  refreshing: boolean;
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
          event: ChangeEvent<HTMLInputElement>,
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
                    checked={
                      checkedChildren === children.length &&
                      children.length !== 0
                    }
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
                    event: ChangeEvent<HTMLInputElement>,
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
  metadatachanges,
  hasmetadatachanges,
  id,
  refreshing,
}: Props) => {
  const { t } = useTranslation();
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});
  const dispatch = useDispatch<ThunkDispatch>();
  // remove ignored changes from full list
  const { remaining: filteredChanges } = splitChangeset(
    changeset,
    ignoredChanges,
  );
  const { remaining: filteredmetadata } = splitChangeset(
    metadatachanges,
    ignoredChanges,
  );

  const { remaining: filteredchecked } = splitChangeset(
    filteredChanges,
    changesChecked,
  );

  const totalmetadatachanges = Object.values(filteredmetadata).flat().length;
  const totalChanges = Object.values(filteredChanges).flat().length;

  const numberChangesChecked = Object.values(filteredchecked).flat().length;
  const allChangesChecked = Boolean(totalChanges && numberChangesChecked === 0);

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

  const handlemetadataToggle = async (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
    const metadata_type = groupName.match(/changes-(.+)/)?.[1];
    if (expandedPanels[groupName] === undefined) {
      await apiFetch({
        url: window.api_urls.scratch_org_listmetadata(id),
        dispatch,
        opts: {
          method: 'POST',
          body: JSON.stringify({
            desired_type: metadata_type,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
    }
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

  const handleSelectMetadataGroup = (
    type: 'changes' | 'ignored',
    groupName: string,
    checked: boolean,
  ) => {
    const changes = filteredmetadata;
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
    event: ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    updateChecked(filteredChanges, checked);
  };

  const handleSelectAllIgnored = (
    event: ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    updateChecked(ignoredChanges, checked);
  };

  interface CheckboxRefType {
    input?: HTMLElement | null;
  }
  const checkboxRef: RefObject<CheckboxRefType> = React.createRef();
  useEffect(() => {
    checkboxRef.current?.input?.focus();
  }, [checkboxRef]);

  return (
    <form
      className="slds-form slds-p-around_large has-checkboxes"
      data-form="task-retrieve-changes"
    >
      <button type="submit" disabled hidden />
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
                errorText={errors.changes}
                onChange={handleSelectAllChange}
                ref={checkboxRef}
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
      {hasmetadatachanges && (
        <ModalCard noBodyPadding>
          <>
            <div
              className="form-grid
                 slds-m-left_xx-small
                 slds-p-left_x-large
                 slds-p-vertical_x-small
                 slds-p-right_medium"
            >
              Non-Source-Trackable
              {refreshing ? (
                <SpinnerWrapper size="small" variant="brand"></SpinnerWrapper>
              ) : (
                <span className="slds-text-body_regular slds-p-top_xxx-small">
                  ({totalmetadatachanges})
                </span>
              )}
            </div>
            <ChangesList
              type="changes"
              allChanges={filteredmetadata}
              checkedChanges={changesChecked}
              expandedPanels={expandedPanels}
              handlePanelToggle={handlemetadataToggle}
              handleSelectGroup={handleSelectMetadataGroup}
              handleChange={handleChange}
            />
          </>
        </ModalCard>
      )}
    </form>
  );
};

export default ChangesForm;
