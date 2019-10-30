from django.db import models
from hashid_field import HashidAutoField

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


class PopulateRepoId:
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
