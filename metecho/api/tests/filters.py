from contextlib import ExitStack
from unittest.mock import patch

import pytest

from ..filters import slug_is_active
from ..models import Project


@pytest.mark.django_db
def test_slug_is_active(project_factory):
    with ExitStack() as stack:
        stack.enter_context(patch("metecho.api.jobs.project_create_branch"))
        stack.enter_context(patch("metecho.api.models.gh"))
        project1 = project_factory(name="Apple")
        project2 = project_factory(name="Banana")
        project1.slugs.update(is_active=False)
    projects = Project.objects.all()
    assert list(slug_is_active(projects, "slugs", "apple")) == []
    assert list(slug_is_active(projects, "slugs", "banana")) == [project2]
