import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProjectForm from '@/components/projects/createForm';
import { createObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/errors/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
addError.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  createObject.mockClear();
  addError.mockClear();
});

const defaultRepository = {
  id: 'r1',
  name: 'Repository 1',
  slug: 'repository-1',
  old_slugs: [],
  description: 'This is a test repository.',
  repo_url: 'https://github.com/test/test-repo',
  github_users: [],
};

const defaultUser = { username: 'test-user' };

describe('<ProjectForm/>', () => {
  const setup = (options) => {
    const defaults = {
      repository: defaultRepository,
      user: defaultUser,
      startOpen: true,
    };
    const opts = Object.assign({}, defaults, options);
    const { user, repository, startOpen } = opts;
    const context = {};
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <ProjectForm
          user={user}
          repository={repository}
          startOpen={startOpen}
        />
      </StaticRouter>,
      {},
      storeWithThunk,
    );
    return { ...result, context };
  };

  describe('submit/close buttons', () => {
    test('toggle form open/closed', () => {
      const { getByText, queryByText } = setup({ startOpen: undefined });

      expect(queryByText('Close Form')).toBeNull();

      fireEvent.click(getByText('Create a Project'));

      expect(getByText('Close Form')).toBeVisible();
      expect(getByText('Create Project')).toBeVisible();
      expect(queryByText('Create a Project')).toBeNull();

      fireEvent.click(getByText('Close Form'));

      expect(queryByText('Close Form')).toBeNull();
      expect(getByText('Create a Project')).toBeVisible();
    });
  });

  describe('form submit', () => {
    test('creates a new project', () => {
      const { getByText, getByLabelText } = setup();
      const submit = getByText('Create Project');
      const nameInput = getByLabelText('*Project Name');
      const descriptionInput = getByLabelText('Description');
      fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'This is the description' },
      });
      fireEvent.click(submit);

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'project',
        data: {
          name: 'Name of Project',
          description: 'This is the description',
          repository: 'r1',
          github_users: [],
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

    test('adds current user to github_users', () => {
      const ghUser = { id: '1', login: 'test-user' };
      const repository = {
        ...defaultRepository,
        github_users: [ghUser, { id: '2', login: 'other-username' }],
      };
      const { getByText, getByLabelText } = setup({ repository });
      const submit = getByText('Create Project');
      const nameInput = getByLabelText('*Project Name');
      fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
      fireEvent.click(submit);

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'project',
        data: {
          name: 'Name of Project',
          description: '',
          repository: 'r1',
          github_users: [ghUser],
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

    describe('success', () => {
      test('redirects to project detail', async () => {
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'project',
              object: {
                id: 'project1',
                slug: 'name-of-project',
                name: 'Name of Project',
                repository: 'r1',
              },
            },
          }),
        );
        const { getByText, getByLabelText, context } = setup();
        const submit = getByText('Create Project');
        const nameInput = getByLabelText('*Project Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
        fireEvent.click(submit);

        expect.assertions(2);
        await createObject;

        expect(context.action).toEqual('PUSH');
        expect(context.url).toEqual(
          routes.project_detail('repository-1', 'name-of-project'),
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
        const { getByText, getByLabelText, queryByText, findByText } = setup();
        const submit = getByText('Create Project');
        const nameInput = getByLabelText('*Project Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
        fireEvent.click(submit);

        expect.assertions(3);
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
        const { getByText, getByLabelText } = setup();
        const submit = getByText('Create Project');
        const nameInput = getByLabelText('*Project Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await waitFor(() => {
          if (!addError.mock.calls.length) {
            throw new Error('waiting...');
          }
        });

        expect(addError).toHaveBeenCalledWith('This is an error.');
      });
    });
  });
});
