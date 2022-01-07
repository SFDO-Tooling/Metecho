import Button from '@salesforce/design-system-react/components/button';
import InputIcon from '@salesforce/design-system-react/components/icon/input-icon';
import Search from '@salesforce/design-system-react/components/input/search';
import { t } from 'i18next';
import React, { useState } from 'react';

const SearchIssues = ({
  searchIssues,
}: {
  searchIssues: (searcht: string) => void;
}) => {
  const [searchterm, setSearchterm] = useState('');
  const handleSearchterm = (event) => {
    setSearchterm(event.target.value);
  };
  return (
    <>
      <Search
        id="searchIssues"
        placeholder={t('Search issues by title or number')}
        name="search"
        onChange={handleSearchterm}
        value={searchterm}
        clearable={true}
        onClear={() => {
          searchIssues('');
          setSearchterm('');
        }}
        onSearch={() => searchIssues(searchterm)}
      ></Search>
      <Button onClick={() => searchIssues(searchterm)}>{t('Search')}</Button>
    </>
  );
};

export default SearchIssues;
