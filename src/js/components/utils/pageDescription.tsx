import VisualPicker from '@salesforce/design-system-react/components/visual-picker';
import VisualPickerLink from '@salesforce/design-system-react/components/visual-picker/link';
import React from 'react';

const PageDescription = ({
  title,
  description,
  image,
}: {
  title: string | null;
  description: string | null;
  image?: string;
}) => {
  const descriptionHasTitle =
    description?.startsWith('<h1>') || description?.startsWith('<h2>');
  return (
    <>
      {image ? (
        <VisualPicker
          size="large"
          className="slds-text-link_reset
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
        >
          <VisualPickerLink
            icon={<img src={image} alt={`image for ${title}`} />}
            title={descriptionHasTitle ? null : title}
            className="page-description"
            description={
              description && (
                <div
                  className="markdown"
                  // This description is pre-cleaned by the API
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                />
              )
            }
          ></VisualPickerLink>
        </VisualPicker>
      ) : (
        <div className="slds-text-longform">
          {!descriptionHasTitle && (
            <h2 className="slds-text-heading_medium">{title}</h2>
          )}
          {/* This description is pre-cleaned by the API */}
          {description && (
            <p
              className="markdown"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      )}
    </>
  );
};

export default PageDescription;
