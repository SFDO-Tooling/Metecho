import i18n from 'i18next';
import React from 'react';

import TourPopover from '~js/components/tour/popover';

const PageDescription = ({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) => {
  const descriptionHasTitle =
    description?.startsWith('<h1>') || description?.startsWith('<h2>');

  const renderedTitle = i18n.t('About {{title}}', { title });

  const renderedDescription = (
    <>
      {!descriptionHasTitle && (
        <>
          <h2
            className="slds-truncate slds-text-heading_small slds-m-bottom_small"
            title={renderedTitle}
          >
            {renderedTitle}
            <TourPopover
              align="top"
              heading={i18n.t('Metecho Project')}
              body={i18n.t(
                'This is the image, name, and description of the Project. Metecho Projects are equivalent to Repositories on GitHub.',
              )}
            />
          </h2>
        </>
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
            <img
              src={image}
              alt={i18n.t('social image for {{title}}', { title })}
            />
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
