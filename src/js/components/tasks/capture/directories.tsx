import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { CommitData, ModalCard } from '@/components/tasks/capture';
import { UseFormProps } from '@/components/utils/useForm';
import { TargetDirectories } from '@/store/orgs/reducer';

interface Props {
  directories: TargetDirectories;
  inputs: CommitData;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const TargetDirectoriesForm = ({
  directories,
  inputs,
  errors,
  handleInputChange,
}: Props) => {
  const headings = {
    source: i18n.t('Package Directories'),
    pre: i18n.t('Pre-Install Directories'),
    post: i18n.t('Post-Install Directories'),
    config: i18n.t('Optional Configuration Directories'),
  };
  const keys = [
    'source' as 'source',
    'pre' as 'pre',
    'post' as 'post',
    'config' as 'config',
  ];
  const orderedDirectories = new Map<
    'source' | 'pre' | 'post' | 'config',
    string[]
  >();
  keys.forEach((key) => {
    if (directories[key]?.length) {
      orderedDirectories.set(key, directories[key] as string[]);
    }
  });

  return (
    <form className="slds-form slds-p-around_large">
      <div className="slds-form-element__help slds-p-bottom_small">
        <Trans i18nKey="targetDirectoryInfo">
          Here’s an explanation of what each type of directory is. The Package
          Directories are this and the Pre-Install and Post-Install Directories
          are different. The Optional Configuration Directories are something
          else entirely.
        </Trans>
      </div>
      <ModalCard>
        {Array.from(orderedDirectories, ([key, dirs], idx) => {
          const hasErrors = Boolean(errors.target_directory);
          const isLast = idx === orderedDirectories.size - 1;
          const err = hasErrors ? ' ' : undefined;
          return (
            <div key={`${key}-${idx}`} className="slds-p-bottom_x-small">
              <RadioGroup
                labels={{
                  label: headings[key],
                  error: isLast ? errors.target_directory : err,
                }}
                name="target_directory"
                onChange={handleInputChange}
              >
                {dirs.map((dir, dirIdx) => (
                  <Radio
                    key={`${key}-${dirIdx}`}
                    id={`${key}-${dirIdx}`}
                    labels={{ label: dir }}
                    checked={inputs.target_directory === dir}
                    value={dir}
                    name="target_directory"
                  />
                ))}
              </RadioGroup>
            </div>
          );
        })}
      </ModalCard>
    </form>
  );
};

export default TargetDirectoriesForm;
