import re
from collections import namedtuple

from asgiref.sync import async_to_sync
from django.db import models
from django.utils import timezone
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
    def get_repo_id(self):
        """
        Get the project's GitHub repo id, looking it up based on the owner and name
        if not already populated.

        Authentication is via the Metecho GitHub app,
        so it must already be installed for this repository.
        """

        if self.repo_id:
            return self.repo_id

        repo = get_repo_info(
            user=None, repo_owner=self.repo_owner, repo_name=self.repo_name
        )
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

    def _push_message(
        self, type_, message, for_list=False, group_name=None, include_user=False
    ):
        """
        type_:
            str indicating frontend Redux action.
        message:
            {
                "originating_user_id": str,
                Optional["message"]: str  // error or other message
            }
        """
        async_to_sync(push.push_message_about_instance)(
            self,
            {"type": type_, "payload": message},
            for_list=for_list,
            group_name=group_name,
            include_user=include_user,
        )

    def notify_changed(
        self,
        *,
        type_=None,
        originating_user_id,
        message=None,
        for_list=False,
        group_name=None,
        include_user=False,
    ):
        prepared_message = {"originating_user_id": originating_user_id}
        prepared_message.update(message or {})
        self._push_message(
            type_ or self.push_update_type,
            prepared_message,
            for_list=for_list,
            group_name=group_name,
            include_user=include_user,
        )

    def notify_error(self, error, *, type_=None, originating_user_id, message=None):
        prepared_message = {
            "originating_user_id": originating_user_id,
            "message": str(error),
        }
        prepared_message.update(message or {})
        self._push_message(
            type_ or self.push_error_type,
            prepared_message,
        )

    def notify_scratch_org_error(
        self, *, error, type_, originating_user_id, message=None
    ):
        """
        This is only used in the ScratchOrg model currently, but it
        follows the pattern enough that I wanted to move it into this
        mixin.
        """
        async_to_sync(push.report_scratch_org_error)(
            self,
            error=error,
            type_=type_,
            originating_user_id=originating_user_id,
            message=message or {},
        )


class CreatePrMixin:
    """
    Expects these to be on the model:
        create_pr_event: str
        get_repo_id: Fn(user: User) -> int
        get_base: Fn() -> str
        get_head: Fn() -> str
        try_to_notify_assigned_user: Fn() -> None
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
        alert_assigned_qa,
        originating_user_id,
    ):
        from .jobs import create_pr_job

        self.currently_creating_pr = True
        self.save()
        self.notify_changed(originating_user_id=originating_user_id)

        repo_id = self.get_repo_id()
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
            alert_assigned_qa=alert_assigned_qa,
            originating_user_id=originating_user_id,
        )

    def finalize_create_pr(
        self, *, alert_assigned_qa=False, error=None, originating_user_id
    ):
        self.currently_creating_pr = False
        self.save()

        if alert_assigned_qa:
            self.try_to_notify_assigned_user()

        if error is None:
            self.notify_changed(
                type_=self.create_pr_event, originating_user_id=originating_user_id
            )
        else:
            self.notify_error(error=error, originating_user_id=originating_user_id)


class SoftDeleteQuerySet(models.QuerySet):
    def active(self):
        return self.filter(deleted_at__isnull=True)

    def inactive(self):
        return self.filter(deleted_at__isnull=False)

    def notify_soft_deleted(self, *, preserve_sf_org=False):
        if self.model.__name__ == "ScratchOrg" and not preserve_sf_org:
            for scratch_org in self:
                try:
                    scratch_org.queue_delete(originating_user_id=None)
                except Exception:  # pragma: nocover
                    # If there's a problem deleting it, it's probably
                    # already been deleted.
                    pass
        else:
            for instance in self:
                instance.notify_changed(type_="SOFT_DELETE", originating_user_id=None)

    def delete(self, *, preserve_sf_org=False):
        soft_delete_child_class = getattr(self.model, "soft_delete_child_class", None)
        if soft_delete_child_class:
            parent = camel_to_snake(self.model.__name__)
            soft_delete_child_class(None).objects.filter(
                **{f"{parent}__in": self}
            ).delete(preserve_sf_org=preserve_sf_org)
        self.active().notify_soft_deleted(preserve_sf_org=preserve_sf_org)
        return self.active().update(deleted_at=timezone.now())

    def hard_delete(self):  # pragma: nocover
        return super().delete()

    delete.queryset_only = True


class SoftDeleteMixin(models.Model):
    """
    Assumes you're also mixing in PushMixin.
    """

    class Meta:
        abstract = True

    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteQuerySet.as_manager()

    def notify_soft_deleted(self, *, preserve_sf_org=False):
        if self.__class__.__name__ == "ScratchOrg" and not preserve_sf_org:
            try:
                self.queue_delete(originating_user_id=None)
            except Exception:  # pragma: nocover
                # If there's a problem deleting it, it's probably
                # already been deleted.
                pass
        else:
            self.notify_changed(type_="SOFT_DELETE", originating_user_id=None)

    def delete(self, *args, preserve_sf_org=False, **kwargs):
        soft_delete_child_class = getattr(self, "soft_delete_child_class", None)
        if soft_delete_child_class:
            parent = camel_to_snake(self.__class__.__name__)
            soft_delete_child_class().objects.filter(**{parent: self}).delete(
                preserve_sf_org=preserve_sf_org
            )
        if self.deleted_at is None:
            self.deleted_at = timezone.now()
            self.save()
            self.notify_soft_deleted(preserve_sf_org=preserve_sf_org)

    def hard_delete(self):  # pragma: nocover
        return super().delete()


def camel_to_snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
