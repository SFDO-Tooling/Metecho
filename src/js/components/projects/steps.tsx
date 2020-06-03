import i18n from 'i18next';
import React from 'react';

import Steps from '@/components/steps';
import { Project } from '@/store/projects/reducer';
import { Task } from '@/store/tasks/reducer';
import { PROJECT_STATUSES } from '@/utils/constants';

interface ProjectStatusStepsProps {
  tasks: Task[] | [];
  project: Project;
}
const ProjectStatusSteps = ({ tasks, project }: ProjectStatusStepsProps) => {
  const hasTasks = Boolean(tasks.length);
  const hasDev = tasks.some((task) => task.assigned_dev);
  const steps = [
    {
      label: `${i18n.t('Create a task')}`,
      visible: true,
      active: !hasTasks,
      complete: hasTasks,
      assignee: null,
    },
    {
      label: `${i18n.t('Assign a developer to a task')}`,
      visible: true,
      active: hasTasks && !hasDev,
      complete: project.has_unmerged_commits || (hasTasks && hasDev),
      assignee: null,
    },
    {
      label: `${i18n.t('Complete a task')}`,
      visible: true,
      active: hasTasks && hasDev, //  active if tasks exist && any task has a developer
      complete: project.has_unmerged_commits, // project.has_unmerged_commits
      assignee: null,
    },
    {
      label: `${i18n.t('Submit project for review')}`,
      visible: true,
      active: project.has_unmerged_commits,
      complete:
        project.pr_is_open || project.status === PROJECT_STATUSES.MERGED, //  project.pr_is_open || project.status === MERGED
      assignee: null,
    },
    {
      label: `${i18n.t('Merge pull request on Github')}`,
      visible: true,
      active: project.pr_is_open,
      complete: project.status === PROJECT_STATUSES.MERGED,
      assignee: null,
    },
  ];
  return (
    <>
      <Steps steps={steps} title={i18n.t('Next Steps for this Project')} />
    </>
  );
};

export default ProjectStatusSteps;
