import Radio from '@salesforce/design-system-react/components/radio';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import { t } from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import { CommitData, ModalCard } from '@/js/components/tasks/capture';
import { UseFormProps } from '@/js/components/utils';
import { TargetDirectories } from '@/js/store/orgs/reducer';

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
  const keys = [
    'source' as const,
    'pre' as const,
    'post' as const,
    'config' as const,
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
  const headings = {
    source: t('Package Directories'),
    pre: t('Pre-Install Directories'),
    post: t('Post-Install Directories'),
    config: t('Optional Configuration Directories'),
  };
  const help = {
    source: (
      <Trans i18nKey="targetDirectorySourceInfo">
        Package Directories hold the main metadata components of the package you
        are building. These components will be deployed as an unmanaged package
        during development, but installed as a managed or unlocked package in
        production.
      </Trans>
    ),
    pre: (
      <Trans i18nKey="targetDirectoryPreInfo">
        Pre-Install Directories are for unmanaged metadata components that
        should always be deployed prior to deploying or installing the package.
      </Trans>
    ),
    post: (
      <Trans i18nKey="targetDirectoryPostInfo">
        Post-Install Directories are for unmanaged metadata components that
        should always be deployed after deploying or installing the package.
      </Trans>
    ),
    config: (
      <Trans i18nKey="targetDirectoryConfigInfo">
        Optional Configuration Directories are for additional sets of metadata
        components that will only be deployed on demand.
      </Trans>
    ),
  };

  return (
    <form className="slds-form slds-p-around_large">
      <ModalCard>
        {Array.from(orderedDirectories, ([key, dirs], idx) => {
          const hasErrors = Boolean(errors.target_directory);
          const isLast = idx === orderedDirectories.size - 1;
          return (
            <fieldset
              key={`${key}-${idx}`}
              className={classNames('slds-form-element slds-p-bottom_x-small', {
                'slds-has-error': hasErrors,
              })}
            >
              <legend className="slds-form-element__legend slds-form-element__label">
                <span className="slds-p-right_xx-small">{headings[key]}</span>
                <Tooltip
                  content={help[key]}
                  position="overflowBoundaryElement"
                  align="top left"
                  dialogClassName="modal-tooltip"
                />
              </legend>
              <div className="slds-form-element__control">
                {dirs.map((dir, dirIdx) => (
                  <Radio
                    key={`${key}-${dirIdx}`}
                    id={`${key}-${dirIdx}`}
                    labels={{ label: dir }}
                    checked={inputs.target_directory === dir}
                    value={dir}
                    name="target_directory"
                    aria-describedby={
                      hasErrors ? 'target_directory-error' : undefined
                    }
                    onChange={handleInputChange}
                  />
                ))}
              </div>
              {hasErrors && isLast && (
                <div
                  id="target_directory-error"
                  className="slds-form-element__help"
                >
                  {errors.target_directory}
                </div>
              )}
            </fieldset>
          );
        })}
      </ModalCard>
    </form>
  );
};

export default TargetDirectoriesForm;
