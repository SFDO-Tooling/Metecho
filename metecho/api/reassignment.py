from typing import List, Optional

from django.utils.translation import gettext as _
from pydantic import BaseModel

from metecho.api.models import (
    GitHubUser,
    Project,
    ScratchOrg,
    ScratchOrgType,
    Task,
    User,
)


class ReassignmentResponse(BaseModel):
    can_reassign: bool
    issues: List[str] = []


def user_has_permission_to_set_role(
    user: User, target_user: Optional[GitHubUser], task: Task, role: ScratchOrgType
) -> bool:
    """Determine whether the user has permission to set the specified role on the task
    to the target user (which may be None, i.e., unset this role).
    Required permissions:
    - The running user must have push permission to change the Developer
    - If the running user does not have push permission, they can only set
       themselves as QA or remove themselves (not set anyone else)

    Does not check if the target user has permission to receive that role
    (see user_has_permission_to_take_role())"""

    if role is ScratchOrgType.DEV:
        return task.root_project.has_push_permission(user)
    else:
        is_removing_self = (
            target_user is None and task.assigned_qa_id == user.github_id  # type: ignore
        )
        is_assigning_self = (
            target_user
            and target_user.id == user.github_id  # type: ignore
            and task.assigned_qa is None
        )

        return bool(
            task.root_project.has_push_permission(user)
            or is_removing_self
            or is_assigning_self
        )


def user_has_permission_to_take_role(
    user: GitHubUser, project: Project, role: ScratchOrgType
) -> bool:
    """Determine if the given User has appropriate GitHub permissions to
    accept the specified role on this project."""
    return (
        project.has_push_permission(user)
        if role is ScratchOrgType.DEV
        else project.has_pull_permission(user)
    )


def can_assign_task_role(
    task: Task,
    context_user: User,
    github_user: Optional[GitHubUser],
    role_org_type: ScratchOrgType,
) -> ReassignmentResponse:
    """Determine if the proposed task role assignment is valid, based on both the context
    user's permission to make the change and the target GitHub user's permission to receive
    that role. Return an object with a yes/no value and a list of issues."""
    org: Optional[ScratchOrg] = (
        task.orgs.active().filter(org_type=role_org_type).first()  # type: ignore
    )
    issues = []

    if not user_has_permission_to_set_role(
        context_user, github_user, task, role_org_type
    ):
        issues.append(
            _(
                "You don't have permissions to change this role. You need write permission for this project to set or accept the Developer role. If you do not have write access, you can only set or remove yourself as the tester."  # noqa: B950
            )
        )

    if github_user:
        if not user_has_permission_to_take_role(
            github_user, task.root_project, role_org_type
        ):
            issues.append(
                _("User {} is not a valid GitHub collaborator for the role {}").format(
                    github_user,
                    str(role_org_type).lower(),
                )
            )

        if org:
            # An existing org can be reassigned if:
            # - We have a Metecho user to assign it to (not just a GitHubUser)
            # - The org is owned by the same Dev Hub user as the Dev Hub user of the target user

            # Note that we do not attempt to validate that the org is still extant here.
            # That is done by the serializer when we actually do the reassignment.
            # It requires a JWT-auth round trip.
            new_user = github_user.get_matching_user()
            if not new_user:
                issues.append(
                    _(
                        "Scratch orgs must be owned by a user who has logged in to Metecho."
                    )
                )
            elif org.owner_sf_username != new_user.sf_username:
                issues.append(
                    _(
                        "The new owner has a different Dev Hub. Scratch orgs cannot be transferred across Dev Hubs."  # noqa: B950
                    )
                )

    return ReassignmentResponse(can_reassign=(len(issues) == 0), issues=issues)
