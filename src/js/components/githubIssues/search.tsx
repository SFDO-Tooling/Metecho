import Button from '@salesforce/design-system-react/components/button';
import InputIcon from '@salesforce/design-system-react/components/icon/input-icon';
import Input from '@salesforce/design-system-react/components/input';
import { t } from 'i18next';
import React from 'react';
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
      name="search"
      iconRight={
        <InputIcon
          assistiveText={{
            icon: 'Clear',
          }}
          name="clear"
          category="utility"
          onClick={() => {
            searchIssues('');
          }}
        />
      }
    ></Input>
    <Button onClick={() => searchIssues(searchterm)}>{t('Search')}</Button>
  </>
);

export default Search;
