import { Styles } from 'react-joyride';

import PopoverHeader from '~img/popover-header.png';

const tourStyles: Styles = {
  options: {
    arrowColor: '#032e61',
    backgroundColor: '#032e61',
    textColor: '#ffffff',
    primaryColor: '#0070d2',
  },
  buttonBack: {
    border: '1px solid #dddbda',
    borderRadius: '.25rem',
    color: '#ecebea',
    fontSize: '13px',
  },
  buttonNext: {
    fontSize: '13px',
  },
  buttonSkip: {
    border: '1px solid #0070d2',
    fontSize: '13px',
  },
  tooltip: {
    padding: '0',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipContent: {
    fontSize: '.8125rem',
    padding: '1rem',
  },
  tooltipTitle: {
    backgroundColor: '#164a85',
    backgroundImage: `url(${PopoverHeader})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom',
    backgroundSize: 'contain',
    borderBottom: '1px solid #ffffff',
    fontSize: '1.25rem',
    fontWeight: 300,
    padding: '0.75rem 1rem',
    textShadow: '0 0 4px #032e61',
  },
  tooltipFooter: {
    margin: 0,
    padding: '1rem',
  },
};

export default tourStyles;
