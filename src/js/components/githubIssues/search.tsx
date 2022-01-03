import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import { t } from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
let searchterm = '';
const Search = ({
  searchIssues,
}: {
  searchIssues: (searcht: string) => void;
}) => (
  <>
    <Input
      onChange={(event, { value }) => {
        event.preventDefault();
        searchterm = value;
      }}
      placeholder={t('Search issues by title or number')}
    ></Input>
    <Button onClick={() => searchIssues(searchterm)}>{t('Search')}</Button>
  </>
);

export default Search;
