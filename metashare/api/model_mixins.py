from collections import namedtuple

from asgiref.sync import async_to_sync
from django.db import models
from hashid_field import HashidAutoField

from . import push
from .gh import get_repo_info

Request = namedtuple("Request", "user")


class HashIdMixin(models.Model):
    class Meta:
        abstract = True

    id = HashidAutoField(primary_key=True)


class TimestampsMixin(models.Model):
    class Meta:
        abstract = True

    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)


class PopulateRepoIdMixin:
    def get_repo_id(self, user):
        """
        We need to get the repo ID as a particular user, and not all
        users have access to all repos, so we can't do this in a data
        migration. Therefore we have an incremental population approach;
        every time the repo_id needs to be accessed, we use this method,
        and get it from the model if present, or query the GitHub API as
        a fallback, assuming that the current user can access the
        current repo via the repo URL.
        """

        if self.repo_id:
            return self.repo_id

        repo = get_repo_info(user, repo_owner=self.repo_owner, repo_name=self.repo_name)
        self.repo_id = repo.id
        self.save()
        return self.repo_id


class PushMixin:
    """
    Expects the following attributes:
        push_update_type: str
        push_error_type: str
        get_serialized_representation: Callable[self, Optional[User]]
    """

    def _create_context_with_user(self, user):
        return {
            "request": Request(user),
        }

    def _push_message(self, type_, message):
        """
        type_:
            str indicating frontend Redux action.
        message:
            {
                "originating_user_id": str,
                Optional["message"]: str  // error message
            }
        """
        async_to_sync(push.push_message_about_instance)(
            self, {"type": type_, "payload": message}
        )

    def notify_changed(self, *, type_=None, originating_user_id):
        self._push_message(
            type_ or self.push_update_type,
            {"originating_user_id": originating_user_id},
        )

    def notify_error(self, error, *, type_=None, originating_user_id):
        self._push_message(
            type_ or self.push_error_type,
            {"originating_user_id": originating_user_id, "message": str(error)},
        )

    def notify_scratch_org_error(self, *, error, type_, originating_user_id):
        """
        This is only used in the ScratchOrg model currently, but it
        follows the pattern enough that I wanted to move it into this
        mixin.
        """
        async_to_sync(push.report_scratch_org_error)(
            self, error=error, type_=type_, originating_user_id=originating_user_id
        )


class CreatePrMixin:
    """
    Expects these to be on the model:
        create_pr_event: str
        get_repo_id: Fn(user: User) -> int
        get_base: Fn() -> str
        get_head: Fn() -> str
    """

    create_pr_event = ""  # Implement this

    def queue_create_pr(
        self,
        user,
        *,
        title,
        critical_changes,
        additional_changes,
        issues,
        notes,
        originating_user_id,
    ):
        from .jobs import create_pr_job

        self.currently_creating_pr = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

        repo_id = self.get_repo_id(user)
        base = self.get_base()
        head = self.get_head()

        create_pr_job.delay(
            self,
            user,
            repo_id=repo_id,
            base=base,
            head=head,
            title=title,
            critical_changes=critical_changes,
            additional_changes=additional_changes,
            issues=issues,
            notes=notes,
            originating_user_id=originating_user_id,
        )

    def finalize_create_pr(self, *, error=None, originating_user_id):
        self.currently_creating_pr = False
        self.save()
        if error is None:
            self.notify_changed(
                type_=self.create_pr_event, originating_user_id=originating_user_id
            )
        else:
            self.notify_error(error=error, originating_user_id=originating_user_id)
