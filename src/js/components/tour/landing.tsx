import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import githubIcon from '~img/github.svg';

export type Tour = {
  header: string;
  tag: string;
  linkText: string;
};
const TourLandingModal = ({
  isOpen,
  onRequestClose,
}: {
  isOpen: boolean;
  onRequestClose: () => void;
}) => {
  const tours: Tour[] = [
    {
      header: `${i18n.t('I want to Play')}`,
      tag: `${i18n.t('Make a scratch org to view project & play')}`,
      linkText: `${i18n.t('Start Play Walkthrough')}`,
    },
    {
      header: `${i18n.t('I want to Help')}`,
      tag: `${i18n.t('Make a scratch org to view project & play')}`,
      linkText: `${i18n.t('Start Play Walkthrough')}`,
    },
    {
      header: `${i18n.t('I want to Plan')}`,
      tag: `${i18n.t('Make a scratch org to view project & play')}`,
      linkText: `${i18n.t('Start Play Walkthrough')}`,
    },
  ];
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} size="large">
      <div className="slds-p-vertical_medium slds-text-align_center">
        <Trans
          i18nKey="metechoWelcome"
          className="slds-text-heading_small slds-m-bottom_medium"
        >
          Hello! What can Metecho help you do today?
        </Trans>
        <Trans
          i18nKey="metechoTourIntro"
          className="slds-m-bottom_medium slds-p-around_large"
        >
          Click on a box below to discover what's possible.
        </Trans>
        <div className="slds-grid slds-gutters">
          {tours.map(({ header, tag, linkText }, idx) => (
            <div
              className="slds-col slds-size_1-of-3 slds-p-around_x-small"
              key={idx}
            >
              <Card
                bodyClassName="slds-card__body_inner"
                /* @@@ todo add actual illustrations */
                header={
                  <Icon
                    path={`${githubIcon}#github`}
                    size="xx-small"
                    className="icon-link slds-m-bottom_xx-small"
                  />
                }
                footer={<a className="slds-path__link">{linkText}</a>}
              >
                <p className="slds-text-heading_medium">{header}</p>
                <p>{tag}</p>
              </Card>
            </div>
          ))}
        </div>

        <div>
          <Trans i18nKey="metechoTourHelp">
            Review these walkthroughs anytime you need them or <br />
            take a self-guided tour when you gave specific questions.
          </Trans>
        </div>
      </div>
    </Modal>
  );
};

export default TourLandingModal;
