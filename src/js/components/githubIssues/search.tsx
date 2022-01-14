import Button from '@salesforce/design-system-react/components/button';
import Search from '@salesforce/design-system-react/components/input/search';
import { t } from 'i18next';
import React, { useState } from 'react';

const SearchIssues = ({
  searchIssues,
}: {
  searchIssues: (searcht: string) => void;
}) => {
  const [searchterm, setSearchterm] = useState('');
  const handleSearchterm = (
    event: React.ChangeEvent<HTMLInputElement>,
    { value }: { value: string },
  ) => {
    setSearchterm(value);
  };

  const clearSearch = () => {
    searchIssues('');
    setSearchterm('');
  };

  const getSearchResults = () => {
    searchIssues(searchterm);
  };

  return (
    <>
      <Search
        placeholder={t('Search issues by title or number')}
        name="search"
        onChange={handleSearchterm}
        value={searchterm}
        clearable
        onClear={() => {
          clearSearch();
        }}
        onSearch={() => getSearchResults()}
      ></Search>
      <Button onClick={() => getSearchResults()} label={t('Search')}></Button>
    </>
  );
};

export default SearchIssues;
