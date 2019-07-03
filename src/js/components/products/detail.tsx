import React from 'react';
import DocumentTitle from 'react-document-title';
import i18n from 'i18next';
import { connect } from 'react-redux';
import { AppState } from '@/store';
import { Link } from 'react-router-dom';

import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';

import routes from '@/utils/routes';
import { Product } from '@/store/products/reducer';

import {
  selectProduct,
  selectProductSlug,
  // selectProductNotFound,
} from '@/store/products/selectors';

interface Props {
  product: Product;
  productSlug: string;
}
const ProductDetail = ({ product, productSlug }: Props) => {
  console.log();
  return (
    <DocumentTitle title={`${i18n.t(productSlug)} | ${i18n.t('MetaShare')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          iconAssistiveText={{ icon: 'User' }}
          iconCategory="standard"
          title={product.name}
          label="Erica Mitchell"
        />
        <div className="slds-p-around_large">
          <div className="slds-grid slds-gutters">
            <div className="slds-col slds-size_2-of-3 ">
              {/* @todo make into reusable component?  */}
              <BreadCrumb
                assistiveText={{ label: 'Two item breadcrumb' }}
                trail={[
                  <Link to={routes.home()}>Home</Link>,
                  <Link
                    className="slds-text-link_reset"
                    to={routes.product_detail(productSlug)}
                  >
                    {product.name}
                  </Link>,
                ]}
              />
            </div>
            <div className="slds-col slds-size_1-of-3">
              <h2 className="slds-m-top_large slds-m-bottom_small slds-text-heading_small">
                [{product.name}]
              </h2>
              <p
                className="markdown slds-p-bottom_small"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              <a href={product.repo_url}>Link to Github Repo</a>
            </div>
          </div>
        </div>
      </>
    </DocumentTitle>
  );
};

const select = (appState: AppState, props: Props) => ({
  productSlug: selectProductSlug(appState, props),
  product: selectProduct(appState, props),
});
const WrappedProductDetail = connect(select)(ProductDetail);

export default WrappedProductDetail;
