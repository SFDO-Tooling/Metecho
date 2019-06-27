import Avatar from '@salesforce/design-system-react/components/avatar';
import Icon from '@salesforce/design-system-react/components/icon';
import React from 'react';

import { Product } from '@/store/products/reducer';

const ProductIcon = ({ product }: { product: Product }) => {
  const { name, icon, color } = product;
  if (icon && icon.type === 'url' && icon.url) {
    // Custom icon at provided URL
    return (
      <Avatar
        variant="entity"
        label={name}
        imgSrc={icon.url}
        imgAlt={name}
        title={name}
      />
    );
  }
  if (icon && icon.type === 'slds' && icon.category && icon.name) {
    // Custom SLDS svg icon
    return (
      <span className="slds-avatar slds-avatar_medium">
        <Icon
          assistiveText={{ label: name }}
          category={icon.category}
          name={icon.name}
        />
      </span>
    );
  }
  if (color) {
    // Standard entity icon (initials) with custom color
    return (
      <div style={{ '--custom-color': color }}>
        <Avatar variant="entity" label={name} />
      </div>
    );
  }
  // Standard entity icon (initials)
  return <Avatar variant="entity" label={name} />;
};

export default ProductIcon;
