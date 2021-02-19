import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import backpackSvg from '!raw-loader!~img/backpack-lg.svg';
import mapSvg from '!raw-loader!~img/map-lg.svg';
import seesawSvg from '!raw-loader!~img/seesaw-lg.svg';
import { Illustration } from '~js/components/utils';

export type TourType = 'play' | 'plan' | 'help';
export interface Tour {
  header: string;
  tag: string;
  linkText: string;
  type: TourType;
  icon: string;
  disabled?: boolean;
}

const LandingModal = ({
  isOpen,
  runTour,
  onRequestClose,
}: {
  isOpen: boolean;
  runTour: (type: TourType) => void;
  onRequestClose: () => void;
}) => {
  const tours: Tour[] = [
    {
      header: i18n.t('I want to Play'),
      tag: i18n.t('Make a scratch org to view project & play.'),
      linkText: i18n.t('Start Play Walkthrough'),
      type: 'play',
      icon: seesawSvg,
      disabled: true,
    },
    {
      header: i18n.t('I want to Help'),
      tag: i18n.t('Browse available tasks; give your input.'),
      linkText: i18n.t('Start Help Walkthrough'),
      type: 'help',
      icon: backpackSvg,
      disabled: true,
    },
    {
      header: i18n.t('I want to Plan'),
      tag: i18n.t('Create a task or an epic; add your work.'),
      linkText: i18n.t('Start Plan Walkthrough'),
      type: 'plan',
      icon: mapSvg,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      assistiveText={{ closeButton: i18n.t('Close') }}
      size="large"
    >
      <div className="slds-p-around_x-large">
        <div className="slds-text-align_center slds-p-bottom_small">
          <p className="slds-text-heading_small slds-p-bottom_x-small">
            <strong>
              {i18n.t('Hello! What can Metecho help you do today?')}
            </strong>
          </p>
          <p>{i18n.t('Click on a box below to discover what’s possible.')}</p>
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
                  <p className="slds-text-heading_medium slds-p-vertical_x-small">
                    {header}
                  </p>
                  <p>{tag}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
        <div className="slds-align_absolute-center">
          <p className="slds-small-size_2-of-5 slds-text-align_center">
            <Trans i18nKey="tourHelp">
              Review these walkthroughs anytime you need them, or take a
              self-guided tour when you have specific questions.
            </Trans>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default LandingModal;
