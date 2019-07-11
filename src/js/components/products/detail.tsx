import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { useEffect } from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import { AppState } from '@/store';
import { fetchObject, ObjectsActionType } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

type Props = {
  product?: Product | null;
  productSlug?: string;
  doFetchObject: ObjectsActionType;
} & RouteComponentProps;

const ProductDetail = ({ product, productSlug, doFetchObject }: Props) => {
  useEffect(() => {
    if (productSlug && product === undefined) {
      // Fetch product from API
      doFetchObject({
        objectType: OBJECT_TYPES.PRODUCT,
        filters: { slug: productSlug },
      });
    }
  }, [product, productSlug, doFetchObject]);

  if (!product) {
    if (!productSlug || product === null) {
      return <ProductNotFound />;
    }
    // Fetching product from API
    return <Spinner />;
  }

  if (productSlug && productSlug !== product.slug) {
    // Redirect to most recent product slug
    return <Redirect to={routes.product_detail(product.slug)} />;
  }

  const productDescriptionHasTitle =
    product.description &&
    (product.description.startsWith('<h1>') ||
      product.description.startsWith('<h2>'));
  return (
    <DocumentTitle title={`${product.name} | ${i18n.t('MetaShare')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={product.name}
        />
        <div
          className="slds-p-horizontal_x-large
            slds-p-top_x-small
            ms-breadcrumb"
        >
          <BreadCrumb
            trail={[
              <Link to={routes.home()} key="home">
                {i18n.t('Home')}
              </Link>,
              <div className="slds-p-horizontal_x-small" key={product.slug}>
                {product.name}
              </div>,
            ]}
          />
        </div>
        <div
          className="slds-p-around_x-large
            slds-grid
            slds-gutters
            slds-wrap"
        >
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_2-of-3
              slds-p-bottom_x-large
              slds-text-longform"
          >
            <Button
              label={i18n.t('Create a Project')}
              className="slds-size_full slds-p-vertical_xx-small"
              variant="brand"
              disabled
            />
          </div>
          <div
            className="slds-col
              slds-size_1-of-1
              slds-medium-size_1-of-3
              slds-text-longform"
          >
            {!productDescriptionHasTitle && (
              <h2 className="slds-text-heading_medium">{product.name}</h2>
            )}
            {/* This description is pre-cleaned by the API */}
            {product.description && (
              <p
                className="markdown"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            <a
              href={product.repo_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {i18n.t('GitHub Repo')}
              <Icon
                category="utility"
                name="new_window"
                size="xx-small"
                className="slds-m-bottom_xx-small"
                containerClassName="slds-m-left_xx-small slds-current-color"
              />
            </a>
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
const actions = {
  doFetchObject: fetchObject,
};
const WrappedProductDetail = connect(
  select,
  actions,
)(ProductDetail);

export default WrappedProductDetail;
