import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useState } from 'react';

const ProjectForm = ({ productName }) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');

  const [projectCreateActive, setprojectCreateActive] = useState(false);

  const handleSubmit = () => {
    console.log({ name, description });
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

          <form onSumit={handleSubmit}>
            <Input
              id="base-id"
              label="Project Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Textarea
              aria-describedby="error-1"
              id="text-area-error"
              name="required-textarea-error"
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
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

export default ProjectForm;
