import { fireEvent, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import CreateProjectModal from '@/js/components/projects/createProjectModal';
import { createObject, fetchObjects } from '@/js/store/actions';
import { refreshOrgs } from '@/js/store/user/actions';
import { OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

import {
  sampleGitHubOrg,
  sampleGitHubOrg2,
  sampleGitHubUser1,
  sampleGitHubUser2,
  sampleProject1,
  sampleProjectDependency,
  sampleProjectDependency2,
  sampleUser1,
} from '../../../../src/stories/fixtures';
import { renderWithRedux, storeWithThunk } from './../../utils';

jest.useFakeTimers();
jest.mock('@/js/store/actions');
jest.mock('@/js/store/user/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
fetchObjects.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshOrgs.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  createObject.mockClear();
  fetchObjects.mockClear();
  refreshOrgs.mockClear();
});

const defaultState = {
  projects: {
    projects: [],
    notFound: [],
    next: null,
    refreshing: false,
    dependencies: [sampleProjectDependency, sampleProjectDependency2],
    fetchingDependencies: false,
  },
  user: sampleUser1,
};

const defaultProps = {
  orgs: [sampleGitHubOrg, sampleGitHubOrg2],
  isRefreshingOrgs: false,
  isOpen: true,
  closeModal: jest.fn(),
};

describe('<CreateProjectModal />', () => {
  const setup = ({
    initialState = defaultState,
    props = defaultProps,
  } = {}) => {
    const context = {};
    const history = { replace: jest.fn() };
    const ui = (
      <StaticRouter context={context}>
        <CreateProjectModal history={history} {...props} />
      </StaticRouter>
    );
    return {
      ...renderWithRedux(ui, initialState, storeWithThunk),
      context,
      history,
    };
  };

  test('renders modal', () => {
    const { getByText } = setup();

    expect(getByText('Create Project')).toBeVisible();
  });

  describe('no dependencies', () => {
    beforeEach(() => {
      setup({
        initialState: {
          ...defaultState,
          projects: { ...defaultState.projects, dependencies: [] },
        },
      });
    });

    test('fetches dependencies', async () => {
      await waitFor(() => expect(fetchObjects).toHaveBeenCalledTimes(1));
    });
  });

  describe('<CreateProjectForm />', () => {
    describe('only one org', () => {
      let result;

      beforeEach(() => {
        fetchMock.getOnce(
          window.api_urls.organization_members(sampleGitHubOrg.id),
          [sampleGitHubUser1],
        );
        fetchMock.postOnce(
          window.api_urls.organization_check_app_installation(
            sampleGitHubOrg.id,
          ),
          { success: false, messages: ['error msg'] },
        );
        result = setup({ props: { ...defaultProps, orgs: [sampleGitHubOrg] } });
      });

      test('fetches collaborators and checks org permissions', async () => {
        await waitFor(() =>
          expect(result.getByText('error msg')).toBeVisible(),
        );
      });
    });

    describe('no orgs', () => {
      let result;

      beforeEach(() => {
        result = setup({ props: { ...defaultProps, orgs: [] } });
      });

      test('displays error message', () => {
        expect(
          result.getByText('You are not a member of any GitHub Organization', {
            exact: false,
          }),
        ).toBeVisible();
      });
    });

    describe('resync orgs btn clicked', () => {
      let result;

      beforeEach(() => {
        result = setup({ props: { ...defaultProps, orgs: [] } });
        const btn = result.getByText('Re-Sync GitHub Organizations');
        fireEvent.click(btn);
      });

      test('refreshes orgs', () => {
        expect(refreshOrgs).toHaveBeenCalledTimes(1);
      });
    });

    describe('resyncing orgs', () => {
      let result;

      beforeEach(() => {
        result = setup({
          props: { ...defaultProps, orgs: [], isRefreshingOrgs: true },
        });
      });

      test('refreshes orgs', () => {
        expect(result.getByText('Syncing GitHub Organizations…')).toBeVisible();
      });
    });

    describe('org and project name entered', () => {
      let result;

      beforeEach(() => {
        fetchMock.getOnce(
          window.api_urls.organization_members(sampleGitHubOrg.id),
          [sampleGitHubUser1],
        );
        fetchMock.postOnce(
          window.api_urls.organization_check_app_installation(
            sampleGitHubOrg.id,
          ),
          { success: true, messages: [] },
        );
        fetchMock.postOnce(
          window.api_urls.organization_check_repo_name(sampleGitHubOrg.id),
          { available: false },
        );
        result = setup();
        const orgSelect = result.getByLabelText('*GitHub Organization');
        fireEvent.click(orgSelect);
        fireEvent.click(result.getByText(sampleGitHubOrg.name));
        const projectNameInput = result.getByLabelText('*Project Name');
        fireEvent.change(projectNameInput, {
          target: { value: 'Name of Project' },
        });
        jest.runAllTimers();
      });

      test('checks repo name availability', async () => {
        await waitFor(() =>
          expect(
            result.getByText('This name is unavailable on GitHub.'),
          ).toBeVisible(),
        );
      });
    });
  });

  describe('<SelectProjectCollaboratorsForm />', () => {
    let result;

    beforeEach(async () => {
      fetchMock.getOnce(
        window.api_urls.organization_members(sampleGitHubOrg.id),
        [sampleGitHubUser1, sampleGitHubUser2],
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_app_installation(sampleGitHubOrg.id),
        { success: true, messages: [] },
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_repo_name(sampleGitHubOrg.id),
        { available: true },
      );
      result = setup({ props: { ...defaultProps, orgs: [sampleGitHubOrg] } });
      const projectNameInput = result.getByLabelText('*Project Name');
      fireEvent.change(projectNameInput, {
        target: { value: 'Name of Project' },
      });
      jest.runAllTimers();
      await waitFor(() =>
        // eslint-disable-next-line jest/no-standalone-expect
        expect(result.getByText('Save & Next')).not.toBeDisabled(),
      );
      fireEvent.click(result.getByText('Save & Next'));
    });

    test('renders list of collaborators', () => {
      expect(
        result.getByText(sampleGitHubUser1.login, { exact: false }),
      ).toBeVisible();
    });

    test('can navigate back via "Go Back" btn', () => {
      fireEvent.click(result.getByText('Go Back'));

      expect(result.getByText('Create Project')).toBeVisible();
    });

    test('can navigate back via direct progress indicator click', () => {
      fireEvent.click(
        result.getByText('Step 1: Enter Project Details', { exact: false }),
      );

      expect(result.getByText('Create Project')).toBeVisible();
    });

    describe('no collaborators', () => {
      beforeEach(() => {
        fetchMock.getOnce(
          window.api_urls.organization_members(sampleGitHubOrg.id),
          [],
          { overwriteRoutes: true },
        );
        const btn = result.getByText('Re-Sync GitHub Collaborators');
        fireEvent.click(btn);
      });

      test('displays msg', async () => {
        await waitFor(() =>
          expect(result.getByText('No Available Collaborators')).toBeVisible(),
        );
      });
    });

    describe('refresh collaborators btn clicked', () => {
      beforeEach(() => {
        fetchMock.getOnce(
          window.api_urls.organization_members(sampleGitHubOrg.id),
          [sampleGitHubUser2],
          { overwriteRoutes: true },
        );
        const btn = result.getByText('Re-Sync GitHub Collaborators');
        fireEvent.click(btn);
      });

      test('refreshes collaborators', async () => {
        await waitFor(() =>
          expect(
            result.queryByText(sampleGitHubUser1.login, { exact: false }),
          ).toBeNull(),
        );
      });
    });

    test('can select and deselect collaborators', () => {
      const checkbox1 = result.getByLabelText('Select row 1');
      const checkbox2 = result.getByLabelText('Select row 2');
      const user2 = result.getByText(sampleGitHubUser2.login, { exact: false });

      fireEvent.click(checkbox1);
      fireEvent.click(user2);

      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();

      fireEvent.click(user2);

      expect(checkbox2).not.toBeChecked();
    });
  });

  describe('<SelectProjectDependenciesForm />', () => {
    let result;

    beforeEach(async () => {
      fetchMock.getOnce(
        window.api_urls.organization_members(sampleGitHubOrg.id),
        [],
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_app_installation(sampleGitHubOrg.id),
        { success: true, messages: [] },
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_repo_name(sampleGitHubOrg.id),
        { available: true },
      );
      result = setup({ props: { ...defaultProps, orgs: [sampleGitHubOrg] } });
      const projectNameInput = result.getByLabelText('*Project Name');
      fireEvent.change(projectNameInput, {
        target: { value: 'Name of Project' },
      });
      jest.runAllTimers();
      await waitFor(() =>
        // eslint-disable-next-line jest/no-standalone-expect
        expect(result.getByText('Save & Next')).not.toBeDisabled(),
      );
      fireEvent.click(result.getByText('Save & Next'));
      fireEvent.click(result.getByText('Save & Next'));
    });

    test('renders list of dependencies', () => {
      expect(result.getByText(sampleProjectDependency.name)).toBeVisible();
    });

    test('can select and deselect dependencies', () => {
      const checkbox1 = result.getByLabelText(sampleProjectDependency.name);

      fireEvent.click(checkbox1);

      expect(checkbox1).toBeChecked();

      fireEvent.click(checkbox1);

      expect(checkbox1).not.toBeChecked();
    });
  });

  describe('<CreateProjectSummary />', () => {
    let result;

    beforeEach(async () => {
      fetchMock.getOnce(
        window.api_urls.organization_members(sampleGitHubOrg.id),
        [sampleGitHubUser1, sampleGitHubUser2],
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_app_installation(sampleGitHubOrg.id),
        { success: true, messages: [] },
      );
      fetchMock.postOnce(
        window.api_urls.organization_check_repo_name(sampleGitHubOrg.id),
        { available: true },
      );
      result = setup({ props: { ...defaultProps, orgs: [sampleGitHubOrg] } });
      const projectNameInput = result.getByLabelText('*Project Name');
      fireEvent.change(projectNameInput, {
        target: { value: 'Name of Project' },
      });
      jest.runAllTimers();
      await waitFor(() =>
        // eslint-disable-next-line jest/no-standalone-expect
        expect(result.getByText('Save & Next')).not.toBeDisabled(),
      );
      fireEvent.click(result.getByText('Save & Next'));
      fireEvent.click(result.getByLabelText('Select row 1'));
      fireEvent.click(result.getByText('Save & Next'));
      fireEvent.click(result.getByLabelText(sampleProjectDependency.name));
      fireEvent.click(result.getByText('Save & Next'));
    });

    test('renders summary page', () => {
      expect(result.getByText('Project Name: “Name of Project”')).toBeVisible();
      expect(result.getByText(sampleGitHubOrg.name)).toBeVisible();
      expect(
        result.getByText(sampleGitHubUser1.login, { exact: false }),
      ).toBeVisible();
      expect(result.getByText(sampleProjectDependency.name)).toBeVisible();
    });

    describe('form submit', () => {
      test('creates a new project', async () => {
        const submit = result.getByText('Create');
        fireEvent.click(submit);
        await result.findByText('Creating…');

        expect(createObject).toHaveBeenCalledWith({
          objectType: OBJECT_TYPES.PROJECT,
          data: {
            organization: sampleGitHubOrg.id,
            name: 'Name of Project',
            repo_name: 'Name-of-Project',
            description: '',
            github_users: [sampleGitHubUser1],
            dependencies: [sampleProjectDependency.id],
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
                objectType: OBJECT_TYPES.PROJECT,
                object: sampleProject1,
              },
            }),
          );
          const submit = result.getByText('Create');
          fireEvent.click(submit);
          await result.findByText('Creating…');

          expect(result.context.action).toBe('PUSH');
          expect(result.context.url).toEqual(
            routes.project_detail(sampleProject1.slug),
          );
        });
      });

      describe('error', () => {
        test('displays inline field errors', async () => {
          createObject.mockReturnValueOnce(() =>
            // eslint-disable-next-line prefer-promise-reject-errors
            Promise.reject({
              body: {
                organization: ['Bad bad bad'],
                collaborators: ['Really bad'],
              },
              response: {
                status: 400,
              },
            }),
          );
          const submit = result.getByText('Create');
          fireEvent.click(submit);
          await result.findByText('Creating…');
          await result.findByText('Bad bad bad');

          expect(result.getByText('Bad bad bad')).toBeVisible();
          expect(result.queryByText('Really bad')).toBeNull();
        });
      });
    });
  });
});
