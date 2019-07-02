import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { withScroll } from 'react-fns';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';

import { EmptyIllustration } from '@/components/404';
import { LoginButton } from '@/components/login';
import ProductListItem from '@/components/products/listItem';
import { LabelWithSpinner } from '@/components/utils';
import { AppState } from '@/store';
import { fetchMoreProducts, syncRepos } from '@/store/products/actions';
import { Product } from '@/store/products/reducer';
import { selectNextUrl, selectProducts } from '@/store/products/selectors';

interface Props {
  y: number;
  products: Product[];
  next: string | null;
  doFetchMoreProducts({ url }: { url: string }): Promise<any>;
  doSyncRepos(): Promise<any>;
}

const ProductList = withScroll(
  ({ y, products, next, doFetchMoreProducts, doSyncRepos }: Props) => {
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [syncingRepos, setSyncingRepos] = useState(false);

    const syncReposClicked = () => {
      setSyncingRepos(true);
      doSyncRepos().finally(() => {
        setSyncingRepos(false);
      });
    };

    useEffect(() => {
      if (fetchingProducts || !next) {
        return;
      }

      const maybeFetchMoreProducts = () => {
        /* istanbul ignore else */
        if (next && !fetchingProducts) {
          setFetchingProducts(true);
          doFetchMoreProducts({ url: next }).finally(() => {
            setFetchingProducts(false);
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
      const scrolledToBottom =
        scrollHeight - Math.ceil(y + clientHeight) <= 100;

      /* istanbul ignore else */
      if (scrolledToBottom) {
        maybeFetchMoreProducts();
      }
    }, [y, next, fetchingProducts, doFetchMoreProducts]);

    let contents;
    switch (products.length) {
      case 0: {
        // No products; show empty message
        const msg = i18n.t(
          'We couldn’t find any products you have access to on GitHub. Are you logged into the correct account?',
        );
        contents = (
          <>
            <EmptyIllustration message={msg} />{' '}
            <div className="slds-align_absolute-center">
              <LoginButton
                id="auth-error-login"
                label={i18n.t('Log In With a Different Account')}
              />
            </div>
          </>
        );
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
            <div className="slds-m-bottom_medium restricted-container">
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
  },
);

const select = (appState: AppState) => ({
  products: selectProducts(appState),
  next: selectNextUrl(appState),
});

const actions = {
  doFetchMoreProducts: fetchMoreProducts,
  doSyncRepos: syncRepos,
};

const WrappedProductList = connect(
  select,
  actions,
)(ProductList);

export default WrappedProductList;
