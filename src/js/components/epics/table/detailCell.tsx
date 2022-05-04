import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { TableCellProps } from '@/js/components/epics/table';
import { ExternalLink } from '@/js/components/utils';
import routes from '@/js/utils/routes';

const DetailTableCell = ({
  projectSlug,
  item,
  className,
  ...props
}: TableCellProps & {
  projectSlug: string;
}) => {
  const { t } = useTranslation();

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
        'epic-name-cell',
        'complex-cell',
      )}
      title={name}
    >
      <div className="cell-stacked slds-truncate">
        <Link
          to={routes.epic_detail(projectSlug, slug)}
          className="slds-text-heading_small
            slds-p-bottom_xx-small
            epic-name-link"
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
            {t('Branch:')}{' '}
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
