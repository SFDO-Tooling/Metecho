import { addDays, subHours } from 'date-fns';
import { t } from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Step } from 'react-joyride';

import GuidedTour, {
  getFinalStep,
  TourProps,
} from '@/js/components/tour/guided';
import { Org } from '@/js/store/orgs/reducer';
import { DEFAULT_ORG_CONFIG_NAME, ORG_TYPES } from '@/js/utils/constants';

export const getDemoOrg = ({
  project,
  owner,
  owner_gh_username,
  owner_gh_id,
  latest_commit,
}: Pick<
  Org,
  'project' | 'owner' | 'owner_gh_username' | 'owner_gh_id' | 'latest_commit'
>): Org => {
  const description = t(
    'This is a sample description to show where the description of the Org would appear.',
  );
  const expires_at = addDays(subHours(new Date(), 12), 30).toISOString();

  return {
    id: 'demo-org',
    project,
    epic: null,
    task: null,
    org_type: ORG_TYPES.PLAYGROUND,
    owner,
    owner_gh_username,
    owner_gh_id,
    description,
    description_rendered: `<p>${description}</p>`,
    org_config_name: DEFAULT_ORG_CONFIG_NAME,
    last_modified_at: null,
    expires_at,
    latest_commit,
    latest_commit_url: '',
    latest_commit_at: null,
    last_checked_unsaved_changes_at: null,
    url: '#',
    unsaved_changes: {},
    total_unsaved_changes: 12,
    has_unsaved_changes: true,
    ignored_changes: {},
    total_ignored_changes: 0,
    has_ignored_changes: false,
    currently_refreshing_changes: false,
    currently_capturing_changes: false,
    currently_refreshing_org: false,
    currently_reassigning_user: false,
    is_created: true,
    delete_queued_at: null,
    has_been_visited: true,
    valid_target_directories: {},
  };
};

const PlayTour = (props: TourProps) => {
  /*
    Note: Any step which targets an element that may be hidden (or not in the
    DOM) will be skipped unless the element is made visible when the *prior*
    step is active.
  */
  const steps: Step[] = [
    {
      target: '.walkthrough-metecho-name',
      title: t('What’s in a name?'),
      content: (
        <Trans i18nKey="walkthroughPlayMetechoName">
          Metecho makes it easier for you to view, test, and contribute to
          Salesforce Projects without learning GitHub.
          <br />
          <br />
          <b>Pronunciation</b>: “Met” rhymes with “bet.” “Echo” as in the
          reflection of sound waves.
          <br />
          <b>Definition</b>: To share or participate in.
        </Trans>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.tour-create-scratch-org',
      title: t('View & play with a Project'),
      content: (
        <Trans i18nKey="walkthroughPlayCreateScratchOrg">
          Scratch Orgs are a temporary place for you to view the work on this
          Project. You can use Scratch Orgs to play with changes to the Project
          without affecting the Project.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '.tour-scratch-org',
      title: t('Project Scratch Org'),
      content: (
        <Trans i18nKey="walkthroughPlayScratchOrg">
          This is a sample Scratch Org for this Project. Select “View Org” to
          see the work on this Project. Your Org will expire after 30 days.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '.tour-scratch-org-contribute',
      title: t('Contribute your work'),
      content: (
        <Trans i18nKey="walkthroughPlayScratchOrgContribute">
          To contribute your own work from a Scratch Org, you need “push”
          permissions on the Project in GitHub. If you do not have the right
          permissions, ask a Project admin. Select “Contribute Work” to create a
          Task for your Scratch Org. When your Org expires or is deleted, any
          work not contributed will be lost.
        </Trans>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '.tour-project-tasks-list',
      title: t('List of Tasks'),
      content: (
        <Trans i18nKey="walkthroughPlayListTasks">
          Select the Tasks tab to see a list of all the work being done on this
          Project and who is doing it. Tasks represent small changes to the
          Project, and may be part of an Epic. Select a Task and create a Task
          Scratch Org to view the work on that Task.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '.tour-project-epics-list',
      title: t('List of Epics'),
      content: (
        <Trans i18nKey="walkthroughPlayListEpics">
          Select the Epics tab to see a list of all the Epics for this Project.
          Each Epic is a group of related Tasks. Select an Epic and create an
          Epic Scratch Org to view the work on that Epic.
        </Trans>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    getFinalStep(),
  ];

  return <GuidedTour steps={steps} {...props} />;
};

export default PlayTour;
