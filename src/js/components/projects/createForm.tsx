import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { ThunkDispatch } from '@/store';
import { createObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { Product } from '@/store/products/reducer';
import { ApiError } from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface Props extends RouteComponentProps {
  product: Product;
  startOpen?: boolean;
}

const ProjectForm = ({ product, startOpen = false, history }: Props) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const fields = ['name', 'description'];
  const dispatch = useDispatch<ThunkDispatch>();

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      setIsOpen(true);
      e.preventDefault();
    }
  };
  const closeForm = () => {
    setIsOpen(false);
  };
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    { value }: { value: string },
  ) => {
    setName(value);
  };
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    dispatch(
      createObject({
        objectType: OBJECT_TYPES.PROJECT,
        data: {
          name,
          description,
          product: product.id,
        },
      }),
    )
      .then(action => {
        const {
          type,
          payload: { object, objectType },
        } = action;
        if (
          type === 'CREATE_OBJECT_SUCCEEDED' &&
          objectType === OBJECT_TYPES.PROJECT &&
          object &&
          object.slug
        ) {
          const url = routes.project_detail(product.slug, object.slug);
          history.push(url);
        }
      })
      .catch((err: ApiError) => {
        const newErrors =
          err.body && typeof err.body === 'object' ? err.body : {};
        if (
          fields.filter(field => newErrors[field] && newErrors[field].length)
            .length
        ) {
          setErrors(newErrors);
        } else if (err.response && err.response.status === 400) {
          // If no inline errors to show, fallback to default global error toast
          dispatch(addError(err.message));
        }
      });
  };

  return (
    <form onSubmit={handleSubmit} className="slds-form slds-m-bottom--large">
      {isOpen && (
        <>
          <h2 className="slds-text-heading_medium">
            {i18n.t('Create a New Project for')} {product.name}
          </h2>
          <Input
            id="project-name"
            label={i18n.t('Project Name')}
            className="slds-form-element_stacked"
            name="name"
            value={name}
            required
            aria-required
            maxLength="50"
            errorText={
              errors.name && errors.name.length && errors.name.join(', ')
            }
            onChange={handleNameChange}
          />
          <Textarea
            id="project-description"
            label={i18n.t('Description')}
            classNameContainer="slds-form-element_stacked"
            name="description"
            value={description}
            errorText={
              errors.description &&
              errors.description.length &&
              errors.description[0]
            }
            onChange={handleDescriptionChange}
          />
        </>
      )}
      <div className={classNames({ 'slds-m-top--medium': isOpen })}>
        <Button
          label={isOpen ? i18n.t('Create Project') : i18n.t('Create a Project')}
          className={classNames({
            'slds-size_full hide-separator': !isOpen,
            'show-separator': isOpen,
          })}
          variant="brand"
          type="submit"
          onClick={submitClicked}
        />
        <span className="vertical-separator slds-m-left--large"></span>
        {isOpen && (
          <Button
            label={i18n.t('Close Form')}
            className="slds-p-left--medium slds-p-right--medium"
            variant="base"
            onClick={closeForm}
          />
        )}
      </div>
    </form>
  );
};

export default withRouter(ProjectForm);
