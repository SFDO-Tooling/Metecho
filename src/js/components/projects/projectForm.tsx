/* eslint-disable @typescript-eslint/camelcase */
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import { createProject } from '@/store/projects/actions';
import { Project } from '@/store/projects/reducer';

interface Props {
  productName: string;
  productSlug: string;
  doCreateProject(newProject: Project): Promise<any>;
}

const ProjectForm = ({ productName, doCreateProject }: Props) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [projectCreateActive, setprojectCreateActive] = useState(false);
  const [hasName, setHasName] = useState(true);

  const handleSubmit = () => {
    if (name === '' && hasName) {
      setHasName(false);
      return;
    }
    // check if project (name) exists?
    doCreateProject({ name, description });
  };
  const formControl = () => {
    if (projectCreateActive) {
      handleSubmit();
      return;
    }
    setprojectCreateActive(!projectCreateActive);
  };

  return (
    <>
      {projectCreateActive && (
        <>
          <h1>Create a Project for {productName}</h1>

          <form onSubmit={handleSubmit}>
            <Input
              id="project-name"
              label="Project Name"
              required
              errorText={hasName ? null : 'Project name is required.'}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
            <Textarea
              aria-describedby="error-1"
              id="project-description"
              name="required-textarea-error"
              label="Description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
          </form>
        </>
      )}

      <Button
        label={i18n.t('Create a Project')}
        className="slds-size_full slds-p-vertical_xx-small"
        variant="brand"
        onClick={formControl}
      />
    </>
  );
};

// @todo can i use connect if I dont need the state?  just to create an action.
// const select = (appState: AppState) => ({
//   state: appState,
// });

const actions = {
  doCreateProject: createProject,
};
const WrappedProjectForm = connect(
  () => {},
  actions,
)(ProjectForm);

export default WrappedProjectForm;
