import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Icon from '@salesforce/design-system-react/components/icon';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, { ReactNode, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { withScroll } from 'react-fns';
import { connect } from 'react-redux';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import ProjectForm from '@/components/projects/createForm';
import ProjectListItem from '@/components/projects/listItem';
import { useIsMounted } from '@/components/utils';
import { AppState } from '@/store';
import { fetchObject, fetchObjects, ObjectsActionType } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { ProjectsByProductState } from '@/store/projects/reducer';
import { selectProjectsByProduct } from '@/store/projects/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

type Props = {
  product?: Product | null;
  productSlug?: string;
  projects: ProjectsByProductState | undefined;
  doFetchObject: ObjectsActionType;
  doFetchObjects: ObjectsActionType;
  y: number;
  next: string | null;
} & RouteComponentProps;

const RepoLink = ({ url, children }: { url: string; children: ReactNode }) => (
  <a href={url} target="_blank" rel="noreferrer noopener">
    {children}
  </a>
);

const ProductDetail = withScroll(
  ({
    y,
    product,
    productSlug,
    projects,
    doFetchObject,
    doFetchObjects,
    next,
  }: Props) => {
    const [fetchingProjects, setFetchingProjects] = useState(false);
    const isMounted = useIsMounted();

    useEffect(() => {
      if (productSlug && product === undefined) {
        // Fetch product from API
        doFetchObject({
          objectType: OBJECT_TYPES.PRODUCT,
          filters: { slug: productSlug },
        });
      }
    }, [product, productSlug, doFetchObject]);

    useEffect(() => {
      if (product && (!projects || !projects.fetched)) {
        // Fetch projects from API
        doFetchObjects({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { product: product.id },
          reset: true,
        });
      }
    }, [product, projects, doFetchObjects]);

    // @@@ todo: make this reusable somehow...
    useEffect(() => {
      if (fetchingProjects || !next) {
        return;
      }
      const maybeFetchMoreProjects = () => {
        /* istanbul ignore else */
        if (next && !fetchingProjects) {
          /* istanbul ignore else */
          if (isMounted.current) {
            setFetchingProjects(true);
          }
          doFetchObjects({
            objectType: OBJECT_TYPES.PROJECT,
            url: next,
          }).finally(() => {
            if (isMounted.current) {
              setFetchingProjects(false);
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
      const scrolledToBottom =
        scrollHeight - Math.ceil(y + clientHeight) <= 100;

      /* istanbul ignore else */
      if (scrolledToBottom) {
        maybeFetchMoreProjects();
      }
    }, [doFetchObjects, fetchingProjects, isMounted, y, next]);
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
            info={
              <RepoLink url={product.repo_url}>{product.repo_url}</RepoLink>
            }
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
                slds-p-bottom_x-large"
            >
              {!projects || !projects.fetched ? (
                // Fetching projects from API
                <Spinner />
              ) : (
                <>
                  <ProjectForm
                    product={product}
                    startOpen={!projects.projects.length}
                  />
                  {Boolean(projects.projects.length) && (
                    <>
                      <h2 className="slds-text-heading_medium">
                        {i18n.t('Projects for')} {product.name}
                      </h2>
                      <ul className="slds-has-dividers_bottom">
                        {projects.projects.map(project => (
                          <ProjectListItem
                            key={project.id}
                            project={project}
                            product={product}
                          />
                        ))}
                      </ul>
                    </>
                  )}
                  {fetchingProjects ? (
                    <div className="slds-align_absolute-center slds-m-top_x-large">
                      <span className="slds-is-relative slds-m-right_large">
                        <Spinner variant="brand" size="small" />
                      </span>
                      {i18n.t('Loading…')}
                    </div>
                  ) : null}
                </>
              )}
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
              <RepoLink url={product.repo_url}>
                {i18n.t('GitHub Repo')}
                <Icon
                  category="utility"
                  name="new_window"
                  size="xx-small"
                  className="slds-m-bottom_xx-small"
                  containerClassName="slds-m-left_xx-small slds-current-color"
                />
              </RepoLink>
            </div>
          </div>
        </>
      </DocumentTitle>
    );
  },
);

const select = (appState: AppState, props: Props) => ({
  productSlug: selectProductSlug(appState, props),
  product: selectProduct(appState, props),
  projects: selectProjectsByProduct(appState, props),
});
const actions = {
  doFetchObject: fetchObject,
  doFetchObjects: fetchObjects,
};
const WrappedProductDetail = connect(
  select,
  actions,
)(ProductDetail);

export default WrappedProductDetail;
