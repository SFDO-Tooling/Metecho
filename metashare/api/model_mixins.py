from asgiref.sync import async_to_sync
from django.db import models
from hashid_field import HashidAutoField

from . import push
from .gh import get_repo_info


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
        get_serialized_representation: Callable[self]
    """

    def _push_message(self, type_, message):
        async_to_sync(push.push_message_about_instance)(
            self, {"type": type_, "payload": message}
        )

    def notify_changed(self, type_=None):
        self._push_message(
            type_ or self.push_update_type, self.get_serialized_representation()
        )

    def notify_error(self, error, type_=None):
        self._push_message(
            type_ or self.push_error_type,
            {"message": str(error), "model": self.get_serialized_representation()},
        )

    def notify_scratch_org_error(self, error, type_):
        """
        This is only used in the ScratchOrg model currently, but it
        follows the pattern enough that I waned to move it into this
        mixin.
        """
        async_to_sync(push.report_scratch_org_error)(self, error, type_)


class CreatePrMixin:
    create_pr_event = ""  # Implement this

    def queue_create_pr(
        self, user, *, title, critical_changes, additional_changes, issues, notes
    ):
        from .jobs import create_pr_job

        self.currently_creating_pr = True
        self.save()
        self.notify_changed()

        create_pr_job.delay(
            self,
            user,
            title=title,
            critical_changes=critical_changes,
            additional_changes=additional_changes,
            issues=issues,
            notes=notes,
        )

    def finalize_create_pr(self, error=None):
        self.currently_creating_pr = False
        self.save()
        if error is None:
            self.notify_changed(self.create_pr_event)
        else:
            self.notify_error(error)
