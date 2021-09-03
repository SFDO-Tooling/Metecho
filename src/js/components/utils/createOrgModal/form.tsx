import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
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
        label={i18n.t('Description')}
        classNameContainer="slds-form-element_stacked slds-p-left_none"
        placeholder={i18n.t('Optional notes about this Scratch Org')}
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
          title={i18n.t('Advanced Options')}
          summary={
            <span className="slds-text-body_regular">
              {i18n.t('Advanced Options')}
            </span>
          }
        >
          <SelectFlowType
            orgConfigs={project.org_config_names || []}
            orgConfigHelp={i18n.t(
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
