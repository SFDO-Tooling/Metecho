/* eslint-disable @typescript-eslint/camelcase */
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { ObjectsActionType, postObject } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface Props extends RouteComponentProps {
  product: Product;
  doPostObject: ObjectsActionType;
}

const ProjectForm = ({ product, doPostObject }: Props) => {
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
      content: { name, description, product: product.id },
    })
      .then(() => {
        // @todo - do the success-redirect
      })
      .catch(err => {
        console.log(err.body);
        // @todo - store error in component state for per-field inline display
      });
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
          <h1>Create a Project for {product.name}</h1>

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

const actions = {
  doPostObject: postObject,
};
const WrappedProjectForm = connect(
  null,
  actions,
)(ProjectForm);

export default withRouter(WrappedProjectForm);
