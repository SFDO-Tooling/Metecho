import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Search from '@salesforce/design-system-react/components/input/search';
import classNames from 'classnames';
import { chain, debounce, isEmpty, map, sortBy, toLower } from 'lodash';
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { EmptyIllustration } from '@/js/components/404';
import { DatasetCommit } from '@/js/components/tasks/retrieveDataset';
import {
  BooleanObject,
  ModalCard,
} from '@/js/components/tasks/retrieveMetadata';
import { UseFormProps } from '@/js/components/utils';
import { Changeset, DatasetSchema } from '@/js/store/orgs/reducer';
import {
  filterSchema,
  mergeChangesets,
  sortSchema,
  splitChangeset,
} from '@/js/utils/helpers';

interface Props {
  schema: DatasetSchema;
  selectedSchema: DatasetSchema;
  outdatedChangeset: Changeset;
  noChanges: boolean;
  inputs: DatasetCommit;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
}

const SCHEMA_SIZE_LIMIT = 50;

const SearchForm = ({
  setSearch,
}: {
  setSearch: Dispatch<SetStateAction<string>>;
}) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>('');

  const debouncedSearch = useMemo(() => debounce(setSearch, 150), [setSearch]);

  const handleSearch = (
    event: ChangeEvent<HTMLInputElement>,
    { value }: { value: string },
  ) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    setSearch('');
  };

  const searchLabel = t('Search for products or fields');

  return (
    <Search
      className="slds-text-body_regular slds-m-bottom_small"
      assistiveText={{ label: searchLabel }}
      placeholder={searchLabel}
      value={searchValue}
      clearable={Boolean(searchValue)}
      onChange={handleSearch}
      onClear={clearSearch}
    />
  );
};

export const SchemaList = ({
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
  const [filteredSchema, setFilteredSchema] = useState(schema);
  const [search, setSearch] = useState<string>('');

  let truncated = false;
  let sortedSchema = sortSchema(filteredSchema);
  const noSchema = isEmpty(filteredSchema);
  if (sortedSchema.length > SCHEMA_SIZE_LIMIT) {
    sortedSchema = sortedSchema.slice(0, SCHEMA_SIZE_LIMIT);
    truncated = true;
  }

  const handlePanelToggle = (groupName: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [groupName]: !expandedPanels[groupName],
    });
  };

  // Update schema when search term changes
  useEffect(() => {
    setFilteredSchema(
      search ? filterSchema(schema, search.toLowerCase()) : schema,
    );
  }, [schema, search]);

  let emptyHeading =
    type === 'all' ? t('No data available to retrieve') : t('No data selected');
  let emptyMsg =
    type === 'all'
      ? null
      : t(
          'Choose objects or fields from the left panel to add them to this dataset.',
        );
  if (search) {
    emptyHeading = t('No data found');
    emptyMsg = t(
      'Change or remove your search term above to view additional data.',
    );
  }

  const paddingClasses =
    'slds-m-left_xx-small slds-p-horizontal_medium slds-p-right_medium';

  return (
    <div
      className={classNames('has-checkboxes', className)}
      data-form="task-retrieve-changes"
      {...props}
    >
      <ModalCard
        heading={
          <div className="slds-m-left_xx-small">
            <SearchForm setSearch={setSearch} />
            <p>{heading}</p>
          </div>
        }
        noBodyPadding
      >
        {errors ? (
          <p
            className={classNames(
              'slds-text-color_error',
              'slds-p-top_x-small',
              paddingClasses,
            )}
          >
            {errors}
          </p>
        ) : null}
        {noSchema ? (
          <EmptyIllustration heading={emptyHeading} message={emptyMsg} />
        ) : (
          <>
            <div
              className="form-grid-three
                slds-m-left_xx-small
                slds-p-left_x-large
                slds-p-right_medium
                slds-p-vertical_x-small"
            >
              <span>
                <strong>{t('Label')}</strong>
              </span>
              <span>
                <strong>{t('Developer Name')}</strong>
              </span>
              <span>
                <strong>{t('Records')}</strong>
              </span>
            </div>
            <div className="this-could-scroll">
              {sortedSchema.map(([groupName, groupSchema], index) => {
                const uniqueGroupName = `${type}-${groupName}`;
                const fields = map(groupSchema.fields, (pair) => pair[0]);
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
                  <Accordion
                    key={uniqueGroupName}
                    className="light-bordered-row"
                  >
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
                                checkedChildren &&
                                  checkedChildren !== fields.length,
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
                      {groupSchema.fields.map(([fieldName, fieldSchema]) => (
                        <div
                          key={`${uniqueGroupName}-${fieldName}`}
                          className="form-grid-three"
                        >
                          {type === 'all' ? (
                            <Checkbox
                              labels={{ label: fieldSchema.label }}
                              className="metecho-nested-checkboxes"
                              checked={Boolean(
                                checkedChanges?.[groupName]?.includes(
                                  fieldName,
                                ),
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
                                metecho-nested-items"
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
              {truncated ? (
                <>
                  <hr className="slds-m-vertical_none" />
                  <p
                    className={classNames(
                      'slds-p-vertical_x-small',
                      paddingClasses,
                    )}
                  >
                    {t(
                      'Only the first {{limit}} objects are displayed. To narrow the list, enter a search term above.',
                      { limit: SCHEMA_SIZE_LIMIT },
                    )}
                  </p>
                </>
              ) : null}
            </div>
          </>
        )}
      </ModalCard>
    </div>
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
    <div
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
      <ModalCard
        heading={
          <span className="slds-m-left_xx-small">
            {t('Existing Data To Remove')}
          </span>
        }
        noBodyPadding
      >
        <p
          className="slds-text-color_error
            slds-m-left_xx-small
            slds-p-horizontal_medium
            slds-p-vertical_x-small"
        >
          <Trans i18nKey="outdatedSchemaWarning">
            The dataset you selected contains fields that no longer exist in
            this Dev Org. If you continue, the following data will be removed
            from this dataset.
          </Trans>
        </p>
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
    </div>
  );
};

const DataForm = ({
  schema,
  selectedSchema,
  outdatedChangeset,
  noChanges,
  inputs,
  errors,
  setInputs,
}: Props) => {
  const { t } = useTranslation();

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

  const classes =
    'slds-form slds-size_1-of-1 slds-large-size_1-of-2 slds-p-horizontal_small';

  return (
    <>
      {!isEmpty(outdatedChangeset) && (
        <RemovingList changes={outdatedChangeset} />
      )}
      <div className="slds-p-around_large slds-grid slds-grid_pull-padded-small">
        <SchemaList
          className={classes}
          type="all"
          heading={t('Data Options')}
          schema={schema}
          checkedChanges={inputs.dataset_definition}
          errors={errors.dataset_definition}
          handleSelectGroup={handleSelectGroup}
          handleChange={handleChange}
        />
        <SchemaList
          className={classes}
          type="selected"
          heading={t('Selected Data')}
          schema={selectedSchema}
          errors={
            noChanges && !isEmpty(selectedSchema)
              ? t('Selected data matches existing dataset.')
              : undefined
          }
        />
      </div>
    </>
  );
};

export default DataForm;
