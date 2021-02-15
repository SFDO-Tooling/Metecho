import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

export type Tour = {
  header: string;
  tag: string;
  linkText: string;
};
const LandingModal = ({
  isOpen,
  runTour,
  onRequestClose,
}: {
  isOpen: boolean;
  runTour: (type: string) => void;
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
      tag: `${i18n.t('Browse available tasks; give your input')}`,
      linkText: `${i18n.t('Start Help Walkthrough')}`,
    },
    {
      header: `${i18n.t('I want to Plan')}`,
      tag: `${i18n.t('Create a task or an epic; add your work')}`,
      linkText: `${i18n.t('Start Plan Walkthrough')}`,
    },
  ];
  const run = () => {
    runTour('plan');
  };
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      size="large"
      contentStyle={{ height: '80vh' }}
    >
      <div className="slds-p-around_large slds-text-align_center">
        <header className="slds-text-heading_small slds-m-bottom_medium">
          Hello! What can Metecho help you do today?
        </header>
        <p>Click on a box below to discover what&apos;s possible.</p>
      </div>
      <div className="slds-grid ">
        {tours.map(({ header, tag, linkText }, idx) => (
          <div
            className="slds-col slds-size_1-of-1 slds-large-size_1-of-3 slds-p-bottom_x-large slds-p-around_xx-large"
            key={idx}
          >
            <Card
              className="tour-card"
              bodyClassName="slds-card__body_inner"
              /* @@@ todo add actual illustrations */
              header={<div>Icon goes here</div>}
              footer={
                <div className="slds-path__link" onClick={run}>
                  {linkText}
                </div>
              }
            >
              <p className="slds-text-heading_medium">{header}</p>
              <p>{tag}</p>
            </Card>
          </div>
        ))}
      </div>
      <div className="slds-text-align_center">
        <Trans i18nKey="metechoTourHelper">
          Review these walkthroughs anytime you need them or <br />
          take a self-guided tour when you gave specific questions.
        </Trans>
      </div>
    </Modal>
  );
};

export default LandingModal;
