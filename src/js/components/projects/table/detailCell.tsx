/* eslint-disable @typescript-eslint/camelcase */
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { TableCellProps } from '@/components/projects/table';
import { ExternalLink } from '@/components/utils';
import routes from '@/utils/routes';

const DetailTableCell = ({
  repositorySlug,
  item,
  className,
  ...props
}: TableCellProps & {
  repositorySlug: string;
}) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }

  const { name, description_rendered, slug, branch_url, branch_name } = item;
  return (
    <DataTableCell
      {...props}
      className={classNames(
        className,
        'truncated-cell',
        'project-name-cell',
        'complex-cell',
      )}
      title={name}
    >
      <div className="cell-stacked slds-truncate">
        <Link
          to={routes.project_detail(repositorySlug, slug)}
          className="slds-text-heading_small
            slds-p-bottom_xx-small
            project-name-link"
        >
          {name}
        </Link>
        {description_rendered && (
          <div
            className="truncate-children slds-m-top_xx-small"
            dangerouslySetInnerHTML={{ __html: description_rendered }}
          />
        )}
        {branch_url && (
          <p
            className="slds-text-body_small
              slds-p-top_x-small
              slds-text-color_weak
              slds-truncate"
          >
            {i18n.t('Branch:')}{' '}
            <ExternalLink url={branch_url}>
              {branch_name}
              <Icon
                category="utility"
                name="new_window"
                size="xx-small"
                className="slds-m-bottom_xx-small"
                containerClassName="slds-m-left_xx-small"
              />
            </ExternalLink>
          </p>
        )}
      </div>
    </DataTableCell>
  );
};
DetailTableCell.displayName = DataTableCell.displayName;

export default DetailTableCell;
