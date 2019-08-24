import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

const mockList = {
  'Apex Classes': [{ id: '1', name: 'Class 1' }],
  'Custom Objects': [{ id: '1', name: 'Custom objects' }],
  'Class others': [{ id: '1', name: 'Class others' }],
  FooBars: [{ id: '1', name: 'FooBars' }],
  Feefitfum: [{ id: '1', name: 'Feefitfum' }],
  Whatchamacallit: [{ id: '1', name: 'Whatchamacallit' }],
  'Loopy ': [{ id: '1', name: 'Loopy' }],
};

const CaptureModal = ({ isOpen }) => {
  const handleCaptureChanges = () => console.log('handle action');
  const [expandedPanels, setExpandedPanels] = useState(new Set());

  const id = 1;
  const handlePanelToggle = id => {
    if (expandedPanels.has(id)) {
      setExpandedPanels(expandedPanels.delete(id));
    } else {
      setExpandedPanels(expandedPanels.add(id));
      console.log(expandedPanels);
    }
  };
  return (
    <Modal
      heading={i18n.t('Select the changes you wish to capture')}
      isOpen={isOpen}
      size="large"
      align="top"
    >
      <form className="slds-p-around_large" onSubmit={handleCaptureChanges}>
        <Checkbox
          assistiveText={{
            label: `${i18n.t('Select All')}`,
          }}
          id="checkbox-example"
          labels={{
            label: `${i18n.t('Select All')}`,
          }}
          onChange={e => {
            console.log('onChange ', e.target);
          }}
        />
        {Object.keys(mockList).map((item, idx) => {
          const panelId = `${item}-${idx}`;

          return (
            <Accordion key={idx} className="" id="base-example-accordion">
              <AccordionPanel
                expanded={expandedPanels.has(panelId)}
                id={id}
                onTogglePanel={() => handlePanelToggle(panelId)}
                summary={
                  <Checkbox
                    key={`${item}-${idx}`}
                    assistiveText={{
                      label: item,
                    }}
                    id="checkbox-example"
                    label
                    labels={{
                      label: item,
                    }}
                    onChange={e => {
                      console.log('onChange ', e.target);
                    }}
                  />
                }
              >
                {mockList[item].map((list: any) => (
                  <Checkbox
                    key={`${list}-${idx}`}
                    assistiveText={{
                      label: list.name,
                    }}
                    id="checkbox-example"
                    label
                    labels={{
                      label: list.name,
                    }}
                    onChange={e => {
                      console.log('onChange ', e.target);
                    }}
                  />
                ))}
              </AccordionPanel>
            </Accordion>
          );
        })}
      </form>
    </Modal>
  );
};

export default CaptureModal;
