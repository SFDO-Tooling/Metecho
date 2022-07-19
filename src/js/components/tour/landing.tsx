import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import backpackSvg from '@/img/backpack-lg.svg?raw';
import mapSvg from '@/img/map-lg.svg?raw';
import seesawSvg from '@/img/seesaw-lg.svg?raw';
import { Illustration } from '@/js/components/utils';
import { WALKTHROUGH_TYPES, WalkthroughType } from '@/js/utils/constants';

export interface Tour {
  header: string;
  tag: string;
  linkText: string;
  type: WalkthroughType;
  icon: string;
  disabled?: boolean;
}

const LandingModal = ({
  isOpen,
  runTour,
  onRequestClose,
}: {
  isOpen: boolean;
  runTour: (type: WalkthroughType) => void;
  onRequestClose: () => void;
}) => {
  const { t } = useTranslation();

  const tours: Tour[] = [
    {
      header: t('I want to Play'),
      tag: t('Make a Scratch Org to view the Project and play.'),
      linkText: t('Start Play Walkthrough'),
      type: WALKTHROUGH_TYPES.PLAY,
      icon: seesawSvg,
    },
    {
      header: t('I want to Help'),
      tag: t('Browse available Tasks; give your input.'),
      linkText: t('Start Help Walkthrough'),
      type: WALKTHROUGH_TYPES.HELP,
      icon: backpackSvg,
    },
    {
      header: t('I want to Plan'),
      tag: t('Create a Task or an Epic; add your work.'),
      linkText: t('Start Plan Walkthrough'),
      type: WALKTHROUGH_TYPES.PLAN,
      icon: mapSvg,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      dismissOnClickOutside={false}
      assistiveText={{ closeButton: t('Close') }}
      size="medium"
      className="metecho-transition-in"
    >
      <div className="slds-p-around_x-large">
        <div className="slds-text-align_center slds-p-bottom_small">
          <h2 className="slds-text-heading_small slds-p-bottom_x-small">
            <strong>{t('Hello! What can Metecho help you do today?')}</strong>
          </h2>
          <p>{t('Select a box below to discover what’s possible.')}</p>
        </div>
        <div className="slds-grid slds-wrap slds-p-bottom_small">
          {tours.map(({ header, tag, linkText, type, icon, disabled }, idx) => (
            <div
              className="slds-p-around_small
                slds-small-size_1-of-1
                slds-medium-size_1-of-3"
              key={idx}
            >
              <Card
                className="slds-card_boundary"
                bodyClassName="slds-card__body_inner"
                hasNoHeader
                footer={
                  <Button
                    label={linkText}
                    variant="link"
                    onClick={() => runTour(type)}
                    disabled={disabled}
                  />
                }
              >
                <Illustration svg={icon} />
                <div className="slds-text-align_center">
                  <h3 className="slds-text-heading_medium slds-p-vertical_x-small">
                    {header}
                  </h3>
                  <p>{tag}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
        <div className="slds-align_absolute-center">
          <p className="slds-small-size_3-of-5 slds-text-align_center">
            <Trans i18nKey="walkthroughHelp">
              Review these walkthroughs anytime you need them, or turn on the
              self-guided tour when you have specific questions.
            </Trans>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default LandingModal;
