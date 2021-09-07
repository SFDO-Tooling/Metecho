import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import TaskForm from '@/js/components/tasks/createForm';
import { createObject } from '@/js/store/actions';
import { addError } from '@/js/store/errors/actions';
import { refreshOrgConfigs } from '@/js/store/projects/actions';
import routes from '@/js/utils/routes';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/errors/actions');
jest.mock('@/js/store/projects/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
addError.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshOrgConfigs.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  createObject.mockClear();
  addError.mockClear();
  refreshOrgConfigs.mockClear();
});

const defaultProject = {
  id: 'p1',
  name: 'Project 1',
  slug: 'project-1',
  old_slugs: [],
  description: 'This is a test project.',
  org_config_names: [
    { key: 'dev' },
    { key: 'qa', label: 'QA', description: 'This is a QA flow' },
    { key: 'release', description: 'This is a Release flow' },
  ],
};

const defaultEpic = {
  id: 'e1',
  name: 'Epic 1',
  slug: 'epic-1',
  project: 'p1',
  old_slugs: [],
  description: 'This is a test epic.',
};

describe('<TaskForm/>', () => {
  const setup = (options) => {
    const defaults = {
      project: defaultProject,
      epic: defaultEpic,
      isOpenOrOrgId: true,
      closeCreateModal: jest.fn(),
    };
    const opts = Object.assign({}, defaults, options);
    const context = {};
    return {
      ...renderWithRedux(
        <StaticRouter context={context}>
          <TaskForm {...opts} />
        </StaticRouter>,
        {},
        storeWithThunk,
      ),
      context,
    };
  };

  describe('refresh org types button click', () => {
    test('triggers refreshOrgConfigs actions', () => {
      const { getByText } = setup();
      const btn = getByText('refresh list of available Org types');
      fireEvent.click(btn);

      expect(refreshOrgConfigs).toHaveBeenCalledWith('p1');
    });
  });

  describe('add a single task', () => {
    test('calls createObject with data', async () => {
      const { getByText, getByLabelText } = setup();
      const submit = getByText('Create');
      const nameInput = getByLabelText('*Task Name');
      const descriptionInput = getByLabelText('Description');
      const radioInput = getByLabelText('QA - This is a QA flow');
      fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'This is the description' },
      });
      fireEvent.click(radioInput);
      fireEvent.click(submit);

      expect.assertions(1);
      await waitFor(() =>
        expect(createObject).toHaveBeenCalledWith({
          objectType: 'task',
          data: {
            name: 'Name of Task',
            description: 'This is the description',
            epic: defaultEpic.id,
            project: undefined,
            org_config_name: 'qa',
          },
          hasForm: true,
          shouldSubscribeToObject: true,
        }),
      );
    });

    describe('success', () => {
      test('redirects to epic task-detail page', async () => {
        const { context, getByText, getByLabelText } = setup({
          epic: undefined,
        });
        const submit = getByText('Create');
        const nameInput = getByLabelText('*Task Name');
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task',
              object: {
                id: 'task1',
                slug: 'name-of-task',
                name: 'Name of Task',
                description: '',
                epic: null,
                project: defaultProject.id,
              },
            },
          }),
        );
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);
        const url = routes.project_task_detail(
          defaultProject.slug,
          'name-of-task',
        );

        expect.assertions(3);
        await waitFor(() =>
          expect(createObject).toHaveBeenCalledWith({
            objectType: 'task',
            data: {
              name: 'Name of Task',
              description: '',
              org_config_name: 'dev',
              epic: undefined,
              project: defaultProject.id,
            },
            hasForm: true,
            shouldSubscribeToObject: true,
          }),
        );
        expect(context.action).toEqual('PUSH');
        expect(context.url).toEqual(url);
      });
    });

    describe('error', () => {
      test('displays errors', async () => {
        createObject.mockReturnValueOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({
            body: {
              org_config_name: ['Do not do that'],
            },
            response: {
              status: 400,
            },
          }),
        );
        const { getByText, getByLabelText, findByText } = setup({
          epic: { ...defaultEpic, org_config_names: [] },
        });

        const submit = getByText('Create');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await findByText('Do not do that');

        expect(getByText('Do not do that')).toBeVisible();
      });
    });
  });

  describe('add and create another task', () => {
    describe('success', () => {
      test('displays success message', async () => {
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task',
              object: {
                id: 'task1',
                slug: 'name-of-task',
                name: 'Name of Task',
                description: '',
                epic: defaultEpic,
              },
            },
          }),
        );
        const { findByText, getByText, getByLabelText } = setup();
        const submit = getByText('Create & New');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await findByText('A Task was successfully created.');

        expect(getByText('A Task was successfully created.')).toBeVisible();
      });
    });
  });

  describe('add and contribute from scratch org', () => {
    describe('success', () => {
      test('redirects to new task page', async () => {
        const org = {
          id: 'org-id',
          org_config_name: 'qa',
        };
        const { getByText, getByLabelText, context } = setup({
          isOpenOrOrgId: org.id,
          playgroundOrg: org,
        });
        const submit = getByText('Create');
        const nameInput = getByLabelText('*Task Name');
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task',
              object: {
                id: 'task1',
                slug: 'name-of-task',
                name: 'Name of Task',
                description: '',
                epic: defaultEpic,
              },
            },
          }),
        );
        fireEvent.change(nameInput, { target: { value: 'Name of Org Task' } });
        fireEvent.click(submit);
        const url = routes.epic_task_detail(
          defaultProject.slug,
          defaultEpic.slug,
          'name-of-task',
        );

        expect.assertions(3);
        await waitFor(() =>
          expect(createObject).toHaveBeenCalledWith({
            objectType: 'task',
            data: {
              dev_org: org.id,
              name: 'Name of Org Task',
              description: '',
              epic: defaultEpic.id,
              org_config_name: 'qa',
            },
            hasForm: true,
            shouldSubscribeToObject: true,
          }),
        );
        expect(context.action).toEqual('PUSH');
        expect(context.url).toEqual(url);
      });
    });
  });
});
