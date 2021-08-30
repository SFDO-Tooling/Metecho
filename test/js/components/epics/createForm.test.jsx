import { fireEvent, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import CreateEpicModal from '@/js/components/epics/createForm';
import { createObject } from '@/js/store/actions';
import { addError } from '@/js/store/errors/actions';
import routes from '@/js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/errors/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
addError.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  createObject.mockClear();
  addError.mockClear();
});

const defaultProject = {
  id: 'r1',
  name: 'Project 1',
  slug: 'project-1',
  old_slugs: [],
  description: 'This is a test project.',
  repo_url: 'https://github.com/test/test-repo',
  github_users: [],
};

const defaultUser = { username: 'test-user', github_id: null };

describe('<CreateEpicModal/>', () => {
  const setup = (options) => {
    const defaults = {
      project: defaultProject,
      user: defaultUser,
      isOpen: true,
    };
    const opts = Object.assign({}, defaults, options);
    const { user, project, isOpen } = opts;
    const context = {};
    const closeCreateModal = jest.fn();
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <CreateEpicModal
          user={user}
          project={project}
          closeCreateModal={closeCreateModal}
          isOpen={isOpen}
        />
      </StaticRouter>,
      {},
      storeWithThunk,
    );
    return { ...result, context };
  };

  describe('form submit', () => {
    test('creates a new epic', async () => {
      const { findByText, getByText, getByLabelText } = setup();
      const submit = getByText('Create');
      const nameInput = getByLabelText('*Epic Name');
      const descriptionInput = getByLabelText('Description');
      fireEvent.change(nameInput, { target: { value: 'Name of Epic' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'This is the description' },
      });
      fireEvent.click(submit);

      expect.assertions(1);
      await findByText('Creating…');
      await findByText('Create');

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'epic',
        data: {
          name: 'Name of Epic',
          description: 'This is the description',
          project: 'r1',
          branch_name: '',
          github_users: [],
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

    test('adds current user to github_users', async () => {
      const user = {
        ...defaultUser,
        github_id: '1',
      };
      const { findByText, getByText, getByLabelText } = setup({ user });
      const submit = getByText('Create');
      const nameInput = getByLabelText('*Epic Name');
      fireEvent.change(nameInput, { target: { value: 'Name of Epic' } });
      fireEvent.click(submit);

      expect.assertions(1);
      await findByText('Creating…');
      await findByText('Create');

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'epic',
        data: {
          name: 'Name of Epic',
          description: '',
          project: 'r1',
          branch_name: '',
          github_users: [user.github_id],
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

    describe('success', () => {
      test('redirects to epic detail', async () => {
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'epic',
              object: {
                id: 'epic1',
                slug: 'name-of-epic',
                name: 'Name of Epic',
                project: 'r1',
              },
            },
          }),
        );
        const { findByText, getByText, getByLabelText, context } = setup();
        const submit = getByText('Create');
        const nameInput = getByLabelText('*Epic Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Epic' } });
        fireEvent.click(submit);

        expect.assertions(2);
        await findByText('Creating…');
        await findByText('Create');
        await createObject;

        expect(context.action).toEqual('PUSH');
        expect(context.url).toEqual(
          routes.epic_detail('project-1', 'name-of-epic'),
        );
      });
    });

    describe('error', () => {
      test('displays inline field errors on 400', async () => {
        createObject.mockReturnValueOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({
            body: {
              name: ['Do not do that'],
              description: ['Or that'],
              other: ['What is happening'],
            },
            response: {
              status: 400,
            },
          }),
        );
        const { findByText, getByText, getByLabelText, queryByText } = setup();
        const submit = getByText('Create');
        const nameInput = getByLabelText('*Epic Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Epic' } });
        fireEvent.click(submit);

        expect.assertions(3);
        await findByText('Creating…');
        await findByText('Create');
        await findByText('Do not do that');

        expect(getByText('Do not do that')).toBeVisible();
        expect(getByText('Or that')).toBeVisible();
        expect(queryByText('What is happening')).toBeNull();
      });

      test('calls addError with non-form errors on 400', async () => {
        createObject.mockReturnValueOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({
            body: 'Nope',
            response: {
              status: 400,
            },
            message: 'This is an error.',
          }),
        );
        const { findByText, getByText, getByLabelText } = setup();
        const submit = getByText('Create');
        const nameInput = getByLabelText('*Epic Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Epic' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await findByText('Creating…');
        await findByText('Create');
        await waitFor(() => {
          if (!addError.mock.calls.length) {
            throw new Error('waiting...');
          }
        });

        expect(addError).toHaveBeenCalledWith('This is an error.');
      });
    });
  });

  describe('creating from existing branch', () => {
    let url, result, fakeBranches, input;

    beforeEach(async () => {
      result = setup();
      url = window.api_urls.project_feature_branches(defaultProject.id);
      fakeBranches = ['feature/foo', 'feature/bar'];
      fetchMock.getOnce(url, fakeBranches);
      fireEvent.click(result.getByText('Use existing GitHub branch'));
      input = result.queryByLabelText('*Select a branch to use for this Epic');
      fireEvent.click(input);
      await result.findByText('feature/foo');
    });

    test('selecting existing branch options', () => {
      const { getByText } = result;
      fireEvent.click(getByText('feature/foo'));

      expect(getByText('Remove selected option')).toBeVisible();
    });

    test('removing selected branch', () => {
      const { getByText } = result;
      fireEvent.click(getByText('feature/foo'));

      expect(input.value).toEqual('feature/foo');

      fireEvent.click(getByText('Remove selected option'));

      expect(input.value).toEqual('');
    });

    test('search/filter branches from list', () => {
      fireEvent.change(input, { target: { value: 'foo' } });

      expect(input.value).toEqual('foo');
    });

    test('select new branch instead', () => {
      const { getByText, getByLabelText } = result;
      fireEvent.click(getByText('feature/foo'));

      expect(input.value).toEqual('feature/foo');

      fireEvent.click(getByLabelText('Create new branch on GitHub'));

      expect(input).not.toBeInTheDocument();
    });

    test('sets selected branch on blur if match found', () => {
      fireEvent.change(input, { target: { value: 'feature/foo' } });
      fireEvent.blur(input);

      expect(input.value).toEqual('feature/foo');
    });

    test('resets input value on blur if no match found', () => {
      fireEvent.change(input, { target: { value: 'nope' } });
      fireEvent.blur(input);

      expect(input.value).toEqual('');
    });
  });

  test('does not break if no existing branches found', async () => {
    const { getByText, queryByLabelText, findByText } = setup();
    const url = window.api_urls.project_feature_branches(defaultProject.id);
    fetchMock.getOnce(url, 404);
    fireEvent.click(getByText('Use existing GitHub branch'));
    const input = queryByLabelText('*Select a branch to use for this Epic');
    fireEvent.click(input);
    await findByText('Loading existing branches…');
    await findByText("There aren't any available branches at this time.", {
      exact: false,
    });

    expect(
      getByText("There aren't any available branches at this time.", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });
});
