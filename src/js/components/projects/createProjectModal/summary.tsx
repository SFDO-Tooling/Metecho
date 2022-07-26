import React from 'react';
import { useTranslation } from 'react-i18next';

import GitHubUserAvatar from '@/js/components/githubUsers/avatar';
import UserCards from '@/js/components/githubUsers/cards';
import { ModalCard } from '@/js/components/tasks/capture';
import { Dependency } from '@/js/store/projects/reducer';
import { GitHubOrg, GitHubUser } from '@/js/store/user/reducer';

interface Props {
  name: string;
  selectedOrg?: GitHubOrg;
  selectedCollaborators: GitHubUser[];
  selectedDeps: Dependency[];
}

const CreateProjectSummary = ({
  name,
  selectedOrg,
  selectedCollaborators,
  selectedDeps,
}: Props) => {
  const { t } = useTranslation();

  return (
    <form className="slds-form slds-p-around_large">
      <h2 className="slds-text-heading_small slds-m-bottom_medium">
        {t('Project Name: “{{project_name}}”', {
          project_name: name,
        })}
      </h2>
      <div className="slds-m-bottom_medium">
        <h2 className="slds-text-heading_small slds-m-bottom_x-small">
          {t('GitHub Organization')}
        </h2>
        <div
          className="slds-button
            slds-size_full
            slds-p-around_xx-small
            collaborator-button
            is-assigned"
          title={selectedOrg?.name}
        >
          <GitHubUserAvatar org={selectedOrg} />
          <span className="collaborator-username">{selectedOrg?.name}</span>
        </div>
      </div>
      {selectedCollaborators.length ? (
        <div className="slds-m-bottom_medium">
          <h2 className="slds-text-heading_small slds-m-bottom_x-small">
            {t('Project Collaborators')}
          </h2>
          <UserCards users={selectedCollaborators} twoColumn />
        </div>
      ) : /* istanbul ignore next */ null}
      {selectedDeps.length ? (
        <ModalCard heading={t('Project Dependencies')}>
          <ul className="slds-list_dotted">
            {selectedDeps.map((dep) => (
              <li key={dep.id}>{dep.name}</li>
            ))}
          </ul>
        </ModalCard>
      ) : /* istanbul ignore next */ null}
    </form>
  );
};

export default CreateProjectSummary;
