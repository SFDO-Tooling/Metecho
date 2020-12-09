import pytest

from ..filters import slug_is_active
from ..models import Epic


@pytest.mark.django_db
def test_slug_is_active(epic_factory):
    epic1 = epic_factory(name="Apple")
    epic2 = epic_factory(name="Banana")
    epic1.slugs.update(is_active=False)
    epics = Epic.objects.all()
    assert list(slug_is_active(epics, "slugs", "apple")) == []
    assert list(slug_is_active(epics, "slugs", "banana")) == [epic2]
