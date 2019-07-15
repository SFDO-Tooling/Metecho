/* eslint-disable @typescript-eslint/camelcase */
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import { ObjectsActionType, postObject } from '@/store/actions';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface Props {
  productName: string;
  productSlug: string;
  doPostObject: ObjectsActionType;
}

const ProjectForm = ({ productName, productSlug, doPostObject }: Props) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [projectCreateActive, setprojectCreateActive] = useState(false);
  const [hasName, setHasName] = useState(true);

  const handleSubmit = () => {
    if (name === '' && hasName) {
      setHasName(false);
      return;
    }
    doPostObject({
      objectType: OBJECT_TYPES.PROJECT,
      content: { name, description, commit_message: '', release_notes: '' },
    }).finally(() => (
      // display errors i.e. if project (name) exists?
      <Redirect to={routes.project_detail(productSlug, productName)} /> // @todo, this isn't redirecting...
    ));
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
  doPostObject: postObject,
};
const WrappedProjectForm = connect(
  () => {},
  actions,
)(ProjectForm);

export default withRouter(WrappedProjectForm);
