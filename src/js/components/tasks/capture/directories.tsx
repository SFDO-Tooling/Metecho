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
      <div className="slds-form-element__help slds-p-bottom_small slds-text-longform">
        {orderedDirectories.has('source') && (
          <p>
            <Trans i18nKey="targetDirectorySourceInfo">
              Package Directories hold the main metadata components of the
              package you are building. These components will be deployed as an
              unmanaged package during development, but installed as a managed
              or unlocked package in production.
            </Trans>
          </p>
        )}
        {orderedDirectories.has('pre') && (
          <p>
            <Trans i18nKey="targetDirectoryPreInfo">
              Pre-Install Directories are for unmanaged metadata components that
              should always be deployed prior to deploying or installing the
              package.
            </Trans>
          </p>
        )}
        {orderedDirectories.has('post') && (
          <p>
            <Trans i18nKey="targetDirectoryPostInfo">
              Post-Install Directories are for unmanaged metadata components
              that should always be deployed after deploying or installing the
              package.
            </Trans>
          </p>
        )}
        {orderedDirectories.has('config') && (
          <p>
            <Trans i18nKey="targetDirectoryConfigInfo">
              Optional Configuration Directories are for additional sets of
              metadata components that will only be deployed on demand.
            </Trans>
          </p>
        )}
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
