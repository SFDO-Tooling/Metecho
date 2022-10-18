import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ModalCard } from '@/js/components/tasks/retrieveMetadata';
import { OmnistudioCommit } from '@/js/components/tasks/retrieveOmnistudio';
import { UseFormProps } from '@/js/components/utils';

interface Props {
  inputs: OmnistudioCommit;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const CommitMessageForm = ({ inputs, errors, handleInputChange }: Props) => {
  const { t } = useTranslation();
  const inputEl = useRef<HTMLInputElement | null>(null);

  return (
    <form className="slds-form slds-p-around_large">
      <button type="submit" disabled hidden />
      <ModalCard
        heading={
          <>
            <abbr className="slds-required" title="required">
              *
            </abbr>
            {t('Jobfile YAML Path')}
          </>
        }
      >
        <Input
          inputRef={(ref: HTMLInputElement) => (inputEl.current = ref)}
          placeholder={t('Jobfile YAML Path')}
          name="yaml_path"
          value={inputs.yaml_path}
          required
          aria-required
          // errorText={
          //   existingDatasetSelected
          //     ? t('Dataset name cannot match existing dataset.')
          //     : undefined
          // }
          onChange={handleInputChange}
        />
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
    </form>
  );
};

export default CommitMessageForm;
