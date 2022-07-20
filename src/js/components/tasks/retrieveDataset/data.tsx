import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import classNames from 'classnames';
import { chain, isEmpty, sortBy, toLower } from 'lodash';
import React, { ChangeEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { DatasetCommit } from '@/js/components/tasks/retrieveDataset';
import {
  BooleanObject,
  ModalCard,
} from '@/js/components/tasks/retrieveMetadata';
import { UseFormProps } from '@/js/components/utils';
import { Changeset, DatasetSchema } from '@/js/store/orgs/reducer';
import {
  getSchemaForChangeset,
  mergeChangesets,
  splitChangeset,
} from '@/js/utils/helpers';

interface Props {
  schema: DatasetSchema;
  inputs: DatasetCommit;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
}

const SchemaList = ({
  type,
  heading,
  schema,
  checkedChanges,
  errors,
  handleSelectGroup,
  handleChange,
  className,
  ...props
}: {
  type: 'all' | 'selected';
  heading: string;
  schema: DatasetSchema;
  checkedChanges?: Changeset;
  errors?: string;
  handleSelectGroup?: (thisGroup: Changeset, checked: boolean) => void;
  handleChange?: ({
    groupName,
    change,
    checked,
  }: {
    groupName: string;
    change: string;
    checked: boolean;
  }) => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  const schemaPairs = chain(schema)
    .toPairs()
    .sortBy([(pair) => pair[1].label.toLowerCase(), (pair) => pair[0]])
    .value();

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  return (
    <form
      className={classNames(
        'slds-form',
        'slds-size_1-of-1',
        'slds-large-size_1-of-2',
        'slds-p-horizontal_small',
        'has-checkboxes',
        className,
      )}
      data-form="task-retrieve-changes"
      {...props}
    >
      <ModalCard noBodyPadding>
        <div
          className="slds-m-left_xx-small
            slds-p-left_x-large
            slds-p-right_medium"
        >
          <h2 className="slds-text-heading_medium slds-p-vertical_medium">
            {heading}
          </h2>
          {errors ? (
            <p className="slds-text-color_error slds-p-bottom_x-small">
              {errors}
            </p>
          ) : null}
          <div className="form-grid-three slds-p-bottom_x-small">
            <span>
              <strong>{t('Label')}</strong>
            </span>
            <span>
              <strong>{t('Developer Name')}</strong>
            </span>
            <span>
              <strong>{t('# of Records')}</strong>
            </span>
          </div>
        </div>
        {schemaPairs.map(([groupName, groupSchema], index) => {
          const uniqueGroupName = `${type}-${groupName}`;
          const fields = Object.keys(groupSchema.fields);
          const fieldSchemaPairs = chain(groupSchema.fields)
            .toPairs()
            .sortBy([(pair) => pair[1].label.toLowerCase(), (pair) => pair[0]])
            .value();
          const handleSelectThisGroup = (
            event: ChangeEvent<HTMLInputElement>,
            { checked }: { checked: boolean },
          ) => handleSelectGroup?.({ [groupName]: fields }, checked);
          let checkedChildren = 0;
          for (const field of fields) {
            if (checkedChanges?.[groupName]?.includes(field)) {
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
                title={groupSchema.label}
                panelContentActions={
                  <div className="form-grid-three">
                    {type === 'all' ? (
                      <Checkbox
                        labels={{ label: groupSchema.label }}
                        checked={checkedChildren === fields.length}
                        indeterminate={Boolean(
                          checkedChildren && checkedChildren !== fields.length,
                        )}
                        onChange={handleSelectThisGroup}
                      />
                    ) : (
                      <span
                        className="slds-text-body_regular
                          slds-p-top_xxx-small"
                      >
                        {groupSchema.label}
                      </span>
                    )}
                    <span
                      className="slds-text-body_regular
                        slds-p-top_xxx-small"
                    >
                      {groupName}
                    </span>
                    <span
                      className="slds-text-body_regular
                        slds-p-top_xxx-small"
                    >
                      {groupSchema.count}
                    </span>
                  </div>
                }
                summary=""
              >
                {fieldSchemaPairs.map(([fieldName, fieldSchema]) => (
                  <div
                    key={`${uniqueGroupName}-${fieldName}`}
                    className="form-grid-three"
                  >
                    {type === 'all' ? (
                      <Checkbox
                        labels={{ label: fieldSchema.label }}
                        className="metecho-nested-checkboxes"
                        checked={Boolean(
                          checkedChanges?.[groupName]?.includes(fieldName),
                        )}
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>,
                          { checked }: { checked: boolean },
                        ) =>
                          handleChange?.({
                            groupName,
                            change: fieldName,
                            checked,
                          })
                        }
                      />
                    ) : (
                      <span
                        className="slds-text-body_regular
                          slds-p-top_xxx-small
                          metecho-nested-checkboxes"
                      >
                        {fieldSchema.label}
                      </span>
                    )}
                    <span
                      className="slds-text-body_regular
                        slds-p-top_xxx-small"
                    >
                      {fieldName}
                    </span>
                  </div>
                ))}
              </AccordionPanel>
            </Accordion>
          );
        })}
      </ModalCard>
    </form>
  );
};

const RemovingList = ({
  changes,
  className,
  ...props
}: {
  changes: Changeset;
  className?: string;
}) => {
  const { t } = useTranslation();
  const [expandedPanels, setExpandedPanels] = useState<BooleanObject>({});

  const type = 'removing';

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  return (
    <form
      className={classNames(
        'slds-form',
        'slds-size_1-of-1',
        'slds-p-top_large',
        'slds-p-horizontal_large',
        'has-checkboxes',
        className,
      )}
      data-form="task-retrieve-changes"
      // @@@
      style={{ height: 'unset' }}
      {...props}
    >
      <ModalCard noBodyPadding>
        <div
          className="slds-m-left_xx-small
            slds-p-left_x-large
            slds-p-right_medium"
        >
          <h2 className="slds-text-heading_medium slds-p-vertical_medium">
            {t('Outdated Data To Remove')}
          </h2>
          <p className="slds-text-color_error slds-p-bottom_x-small">
            <Trans i18nKey="outdatedSchemaWarning">
              The Dataset you selected contains Fields that no longer exist in
              this Dev Org. If you continue, the following Data will be removed
              from this Dataset.
            </Trans>
          </p>
        </div>
        {chain(Object.keys(changes))
          .sortBy(toLower)
          .map((groupName, index) => {
            const uniqueGroupName = `${type}-${groupName}`;
            const fields = sortBy(changes[groupName], toLower);

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
                      <span
                        className="slds-text-body_regular
                          slds-p-top_xxx-small"
                      >
                        {groupName}
                      </span>
                    </div>
                  }
                  summary=""
                >
                  {fields.map((fieldName) => (
                    <div
                      key={`${uniqueGroupName}-${fieldName}`}
                      className="form-grid"
                    >
                      <span
                        className="slds-text-body_regular
                          slds-p-top_xxx-small
                          metecho-nested-checkboxes"
                      >
                        {fieldName}
                      </span>
                    </div>
                  ))}
                </AccordionPanel>
              </Accordion>
            );
          })
          .value()}
      </ModalCard>
    </form>
  );
};

const DataForm = ({ schema, inputs, errors, setInputs }: Props) => {
  const { t } = useTranslation();

  const { matchedSchema, unmatched } = getSchemaForChangeset(
    schema,
    inputs.dataset_definition,
  );

  const setChanges = (dataset_definition: Changeset) => {
    setInputs({ ...inputs, dataset_definition });
  };

  const updateChecked = (dataset_definition: Changeset, checked: boolean) => {
    if (checked) {
      setChanges(
        mergeChangesets(inputs.dataset_definition, dataset_definition),
      );
    } else {
      const { remaining } = splitChangeset(
        inputs.dataset_definition,
        dataset_definition,
      );
      setChanges(remaining);
    }
  };

  const handleSelectGroup = (thisGroup: Changeset, checked: boolean) => {
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

  return (
    <>
      {!isEmpty(unmatched) && <RemovingList changes={unmatched} />}
      <div className="slds-p-around_large slds-grid slds-grid_pull-padded-small">
        <SchemaList
          type="all"
          heading={t('Data Options')}
          schema={schema}
          checkedChanges={inputs.dataset_definition}
          errors={errors.dataset_definition}
          handleSelectGroup={handleSelectGroup}
          handleChange={handleChange}
        />
        <SchemaList
          type="selected"
          heading={t('Selected Data')}
          schema={matchedSchema}
        />
      </div>
    </>
  );
};

export default DataForm;
