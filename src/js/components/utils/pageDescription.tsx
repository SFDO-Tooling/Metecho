import React from 'react';
import { useTranslation } from 'react-i18next';

const PageDescription = ({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) => {
  const { t } = useTranslation();

  const descriptionHasTitle =
    description?.startsWith('<h1>') || description?.startsWith('<h2>');

  const renderedTitle = t('About {{title}}', { title });

  const renderedDescription = (
    <>
      {!descriptionHasTitle && (
        <h2
          className="slds-truncate slds-text-heading_small slds-m-bottom_small"
          title={renderedTitle}
        >
          {renderedTitle}
        </h2>
      )}
      <div
        className="markdown slds-text-longform"
        // This description is pre-cleaned by the API
        dangerouslySetInnerHTML={{
          __html: description,
        }}
      />
    </>
  );

  return (
    <div className="slds-m-bottom_x-large metecho-secondary-block">
      {image ? (
        <div className="slds-media container-fill-space">
          <div
            className="slds-media__figure
              slds-m-left_xx-small
              metecho-repo-image-wrapper"
          >
            <img src={image} alt={t('social image for {{title}}', { title })} />
          </div>
          <div
            className="slds-media__body
              slds-border_left
              slds-p-horizontal_small
              slds-grid
              slds-grid_vertical
              content-fill-height"
          >
            {renderedDescription}
          </div>
        </div>
      ) : (
        renderedDescription
      )}
    </div>
  );
};

export default PageDescription;
