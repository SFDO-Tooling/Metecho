import Icon from '@salesforce/design-system-react/components/icon';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React from 'react';
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

  return (
    <form className="slds-form slds-p-around_large">
      <button type="submit" disabled hidden />
      <ModalCard>
        <Icon category="utility" name="open_folder" size="small" />
        <code className="slds-p-left_x-small v-align-center">
          {inputs.yaml_path}
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
    </form>
  );
};

export default CommitMessageForm;
