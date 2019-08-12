import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { ScrollProps, withScroll } from 'react-fns';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { EmptyIllustration } from '@/components/404';
import ProductListItem from '@/components/products/listItem';
import { LabelWithSpinner, useIsMounted } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { syncRepos } from '@/store/products/actions';
import { selectNextUrl, selectProducts } from '@/store/products/selectors';
import { OBJECT_TYPES } from '@/utils/constants';

const ProductList = withScroll(({ y }: ScrollProps) => {
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [syncingRepos, setSyncingRepos] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const products = useSelector(selectProducts);
  const next = useSelector(selectNextUrl);

  const syncReposClicked = () => {
    setSyncingRepos(true);
    dispatch(syncRepos()).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setSyncingRepos(false);
      }
    });
  };

  useEffect(() => {
    if (fetchingProducts || !next) {
      return;
    }

    const maybeFetchMoreProducts = () => {
      /* istanbul ignore else */
      if (next && !fetchingProducts) {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingProducts(true);
        }
        dispatch(
          fetchObjects({
            objectType: OBJECT_TYPES.PRODUCT,
            url: next,
          }),
        ).finally(() => {
          /* istanbul ignore else */
          if (isMounted.current) {
            setFetchingProducts(false);
          }
        });
      }
    };

    /* istanbul ignore next */
    const scrollHeight =
      (document.documentElement && document.documentElement.scrollHeight) ||
      (document.body && document.body.scrollHeight) ||
      Infinity;
    const clientHeight =
      (document.documentElement && document.documentElement.clientHeight) ||
      window.innerHeight;
    // Fetch more products if within 100px of bottom of page...
    const scrolledToBottom = scrollHeight - Math.ceil(y + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      maybeFetchMoreProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, next]);

  let contents;
  switch (products.length) {
    case 0: {
      // No products; show empty message
      const msg = (
        <Trans i18nKey="noProductsHelper">
          We couldn’t find any products you have access to on GitHub. Confirm
          that you are logged into the correct account or contact an admin on
          GitHub.
        </Trans>
      );
      contents = <EmptyIllustration message={msg} />;
      break;
    }
    default: {
      contents = (
        <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
          {products.map(product => (
            <ProductListItem product={product} key={product.id} />
          ))}
        </div>
      );
      break;
    }
  }

  return (
    <DocumentTitle title={`${i18n.t('Products')} | ${i18n.t('MetaShare')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={i18n.t('Select a Product')}
        />
        <div className="slds-p-around_x-large">
          <div className="slds-grid slds-grid_vertical-align-start">
            <div
              className="slds-grid
                slds-wrap
                slds-shrink
                slds-m-bottom_medium
                slds-p-right_x-large
                restricted-container"
            >
              <p className="slds-p-bottom_small">
                <Trans i18nKey="productListHelper">
                  Contributor access on GitHub is required to view products. If
                  you do not see the product you’re looking for below, confirm
                  that you are logged into the correct account or contact an
                  admin on GitHub.
                </Trans>
              </p>
              <Button
                label={i18n.t('Create Product')}
                variant="brand"
                disabled
              />
            </div>
            <div
              className="slds-grid
                slds-grow
                slds-shrink-none
                slds-grid_align-end"
            >
              {syncingRepos ? (
                <Button
                  label={
                    <LabelWithSpinner
                      label={i18n.t('Syncing GitHub Repos…')}
                      variant="base"
                      size="x-small"
                    />
                  }
                  variant="outline-brand"
                  disabled
                />
              ) : (
                <Button
                  label={i18n.t('Sync GitHub Repositories')}
                  variant="outline-brand"
                  iconCategory="utility"
                  iconName="refresh"
                  iconPosition="left"
                  onClick={syncReposClicked}
                />
              )}
            </div>
          </div>
          {contents}
          {fetchingProducts ? (
            <div className="slds-align_absolute-center slds-m-top_x-large">
              <span className="slds-is-relative slds-m-right_large">
                <Spinner variant="brand" size="small" />
              </span>
              {i18n.t('Loading…')}
            </div>
          ) : null}
        </div>
      </>
    </DocumentTitle>
  );
});

export default ProductList;
