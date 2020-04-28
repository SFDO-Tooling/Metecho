import VisualPicker from '@salesforce/design-system-react/components/visual-picker';
import VisualPickerLink from '@salesforce/design-system-react/components/visual-picker/link';
import React from 'react';

const RepositoryDescription = ({
  title,
  description,
}: {
  title: string | null;
  description: string | null;
}) => (
  <VisualPicker
    size="large"
    className="slds-text-link_reset
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
  >
    <VisualPickerLink
      icon={
        <img
          src="https://via.placeholder.com/75"
          alt="Placeholder image till we get it from the API"
        />
      }
      title={title}
      className="page-description"
      description={
        description ? (
          <div
            className="markdown"
            // This description is pre-cleaned by the API
            dangerouslySetInnerHTML={{
              __html: description,
            }}
          />
        ) : null
      }
    ></VisualPickerLink>
  </VisualPicker>
);

export default RepositoryDescription;
