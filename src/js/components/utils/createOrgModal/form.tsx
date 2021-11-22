import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Textarea from '@salesforce/design-system-react/components/textarea';
import { t } from 'i18next';
import React, { useCallback, useState } from 'react';

import SelectFlowType from '@/js/components/tasks/selectFlowType';
import { UseFormProps } from '@/js/components/utils';
import { OrgData } from '@/js/components/utils/createOrgModal';
import { Project } from '@/js/store/projects/reducer';

interface Props {
  project: Project;
  inputs: OrgData;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const CreateOrgForm = ({
  project,
  inputs,
  errors,
  handleInputChange,
}: Props) => {
  const [isExpanded, setExpanded] = useState(false);

  const handlePanelToggle = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <form className="slds-form slds-p-around_large">
      <Textarea
        id="create-org-description"
        label={t('Description')}
        classNameContainer="slds-form-element_stacked slds-p-left_none"
        placeholder={t('Optional notes about this Scratch Org')}
        className="metecho-textarea"
        name="description"
        value={inputs.description}
        errorText={errors.description}
        onChange={handleInputChange}
      />
      <Accordion>
        <AccordionPanel
          expanded={isExpanded}
          id="advanced"
          onTogglePanel={handlePanelToggle}
          title={t('Advanced Options')}
          summary={
            <span className="slds-text-body_regular">
              {t('Advanced Options')}
            </span>
          }
        >
          <SelectFlowType
            orgConfigs={project.org_config_names || []}
            orgConfigHelp={t(
              'CumulusCI Projects can set up different kinds of Org environments. Which one would you like to work on for this Org?',
            )}
            projectId={project.id}
            value={inputs.org_config_name}
            errors={errors.org_config_name}
            isLoading={project.currently_fetching_org_config_names}
            handleSelect={handleInputChange}
          />
        </AccordionPanel>
      </Accordion>
    </form>
  );
};
export default CreateOrgForm;
