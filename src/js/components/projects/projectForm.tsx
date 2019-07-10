/* eslint-disable @typescript-eslint/camelcase */
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import { createProject } from '@/store/projects/actions';
import { Project } from '@/store/projects/reducer';

// productName type
interface Props {
  productName: string;
  productSlug: string;
  doCreateProject({ name, description }: Project): Promise<any>; // @todo here
}
// handleSubmit fn
// make api call to create project
const ProjectForm = ({ productName, doCreateProject }: Props) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [projectCreateActive, setprojectCreateActive] = useState(false);

  const handleSubmit = () => {
    //   @todo once api changes are made... //
    const newProject = {
      name,
      description,
      commit_message: '',
      pr_url: 'https://www.google.com',
      release_notes: 'release',
      slug: '84jfw',
      old_slugs: [],
    };

    doCreateProject(newProject);
    // @todo validate fields, redirect on success ?
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
              id="base-id"
              label="Project Name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
            <Textarea
              aria-describedby="error-1"
              id="text-area-error"
              name="required-textarea-error"
              label="Description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
              required
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
