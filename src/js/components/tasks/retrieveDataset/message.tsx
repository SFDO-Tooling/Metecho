import Icon from '@salesforce/design-system-react/components/icon';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DatasetCommit } from '@/js/components/tasks/retrieveDataset';
import { SchemaList } from '@/js/components/tasks/retrieveDataset/data';
import { ModalCard } from '@/js/components/tasks/retrieveMetadata';
import { UseFormProps } from '@/js/components/utils';
import { DatasetSchema } from '@/js/store/orgs/reducer';

interface Props {
  selectedSchema: DatasetSchema;
  inputs: DatasetCommit;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const CommitMessageForm = ({
  selectedSchema,
  inputs,
  errors,
  handleInputChange,
}: Props) => {
  const { t } = useTranslation();

  return (
    <form className="slds-form slds-p-around_large">
      <button type="submit" style={{ display: 'none' }} disabled hidden />
      <ModalCard>
        <Icon category="utility" name="open_folder" size="small" />
        <code className="slds-p-left_x-small v-align-center">
          {inputs.dataset_name}
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
      <SchemaList
        className="slds-m-top_medium"
        type="selected"
        heading={t('Selected Data')}
        schema={selectedSchema}
      />
    </form>
  );
};

export default CommitMessageForm;
