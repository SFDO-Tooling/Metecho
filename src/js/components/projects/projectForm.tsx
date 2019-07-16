/* eslint-disable @typescript-eslint/camelcase */
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';
import useForm from 'react-hook-form';
import { connect } from 'react-redux';
import { RouteComponentProps, Redirect } from 'react-router-dom';
import { Product } from '@/store/products/reducer';
import { ObjectsActionType, postObject } from '@/store/actions';
import { Project } from '@/store/projects/reducer';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface Props extends RouteComponentProps {
  product: Product;
  doPostObject: ObjectsActionType;
}

const ProjectForm = ({ product, doPostObject }: Props) => {
  const [projectCreateActive, setprojectCreateActive] = useState(false);
  const { register, handleSubmit, setError, errors } = useForm({
    mode: 'onBlur',
  });
  const [postSucess, handleSuccess] = useState(false);

  const onSubmit = data => {
    doPostObject({
      objectType: OBJECT_TYPES.PROJECT,
      content: {
        name: data.name,
        description: data.description,
        product: product.id,
      },
    })
      .then(() => {
        handleSuccess(true);
      })
      .catch(err => {
        if ('name' in err.body) {
          setError('name', 'postError', err.body.name[0]);
        }
      });
  };

  const formControl = (data: Project) => {
    if (projectCreateActive) {
      if (data.name !== '') {
        setError('name', 'invalidName', 'This field is required.');
      }
      return;
    }

    setprojectCreateActive(true);
  };

  if (postSucess) {
    return <Redirect to={routes.project_detail(product.slug, name)} />;
  }
  return (
    <>
      {projectCreateActive && <h1>Create a Project for {product.name}</h1>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <>
          {projectCreateActive && (
            <>
              <Input
                id="project-name"
                label="Project Name"
                name="name"
                required
                errorText={errors.name && errors.name.message}
                inputRef={register({
                  required: true,
                })}
              />
              <Textarea
                id="project-description"
                label="Description"
                name="description"
                textareaRef={register}
              />
            </>
          )}
        </>
        <Button
          label={i18n.t('Create a Project')}
          className="slds-size_full slds-p-vertical_xx-small"
          variant="brand"
          type="submit"
          onClick={formControl}
        />
      </form>
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

export default WrappedProjectForm;
