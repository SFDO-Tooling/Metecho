import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

import { useForm, pluralize } from '@/components/utils';
import { OBJECT_TYPES } from '@/utils/constants';
const mockList = {
  ApexClasses: [{ id: '1', name: 'Class 1' }, { id: '2', name: 'Class 2' }],
  CustomObjects: [{ id: '2', name: 'Custom objects' }],
  ClassOthers: [{ id: '3', name: 'Class others' }],
  FooBars: [{ id: '4', name: 'Foo Bars' }],
  Feefitfum: [{ id: '5', name: 'Fee fitfum' }],
  'Whatcha macallit': [{ id: '6', name: 'Whatchamacallit' }],
  'Loopy ': [{ id: '7', name: 'Loopy Looo' }],
};

interface Props {
  isOpen: boolean;
}
const CaptureModal = ({ isOpen }: Props) => {
  const [expandedPanels, setExpandedPanels] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [checkboxes, setCheckBoxes] = useState(mockList);
  const [selectAllChanges, setSelectAllChanges] = useState(false);

  const handlePanelToggle = (id: string) => {
    setExpandedPanels({ ...checkedItems, [id]: !expandedPanels[id] });
  };

  const onSuccess = (action: AnyAction) => {
    console.log('success');
  };
  const handleChange = (event: React.BaseSyntheticEvent, value: string) => {
    setCheckedItems({ ...checkedItems, [value]: event.target.checked });
    if (value === 'select-all') {
      setCheckedItems({});
      setSelectAllChanges(!selectAllChanges);
    }
  };
  const {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: { changes: [], message: '' },
    objectType: OBJECT_TYPES.TASK,
    onSuccess,
  });
  // length of top level checkboxes
  const totalChanges = Object.entries(checkboxes).flat().length;

  return (
    <Modal
      heading={i18n.t('Select the changes you wish to capture')}
      isOpen={isOpen}
      size="small"
      align="top"
    >
      <form className="slds-p-around_large" onSubmit={handleSubmit}>
        <div className="slds-grid">
          <Checkbox
            className="slds-col slds-size_1-of-3"
            assistiveText={{
              label: `${i18n.t('Select All')}`,
            }}
            id="select-all"
            labels={{
              label: `${i18n.t('Select All')}`,
            }}
            onChange={(e: any) => handleChange(e, 'select-all')}
          />
          <span className="slds-col slds-size_1-of-3">{`(${totalChanges} ${pluralize(
            totalChanges,
            'change',
          )})`}</span>
        </div>
        {Object.keys(checkboxes).map((item, idx) => {
          const panelId = `${item}-${idx}`;
          const count: number = checkboxes[item].map((list, idx) => idx + 1)
            .length;

          return (
            <Accordion key={idx} className="" id="base-example-accordion">
              <AccordionPanel
                expanded={
                  selectAllChanges ? selectAllChanges : expandedPanels[panelId]
                }
                id={panelId}
                onTogglePanel={() => handlePanelToggle(panelId)}
                summary={
                  <div className="slds-grid">
                    <Checkbox
                      key={`${item}-${idx}`}
                      assistiveText={{
                        label: item,
                      }}
                      id={panelId}
                      label
                      labels={{
                        label: item,
                      }}
                      onChange={(e: any) => handleChange(e, item)}
                      name="changes"
                      checked={
                        selectAllChanges ? selectAllChanges : checkedItems[item]
                      }
                      className="slds-col"
                    />
                    <span className="slds-col">{`(${count} ${pluralize(
                      count,
                      'change',
                    )} )`}</span>
                  </div>
                }
              >
                {checkboxes[item].map((list: any) => {
                  const checked =
                    selectAllChanges ||
                    checkedItems[item] ||
                    checkedItems[list.name];
                  const id = `${list.name}-${idx}`;
                  return (
                    <Checkbox
                      key={id}
                      assistiveText={{
                        label: list.name,
                      }}
                      id={id}
                      label
                      labels={{
                        label: list.name,
                      }}
                      onChange={e => handleChange(e, list.name)}
                      checked={checked && checked}
                    />
                  );
                })}
              </AccordionPanel>
            </Accordion>
          );
        })}
        <Input
          id="commit-message"
          label={i18n.t('Commit Message')}
          className="slds-form-element_stacked slds-p-left_none"
          name="name"
          value={inputs.message}
          required
          aria-required
          maxLength="50"
          errorText={errors.message}
          onChange={handleInputChange}
        />
      </form>
    </Modal>
  );
};

export default CaptureModal;
