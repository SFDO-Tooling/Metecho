import pytest
from django.test import Client


@pytest.mark.django_db
def test_index():
    c = Client()
    response = c.get("/login/")
    assert response.status_code == 200
    assert 'class="slds-theme_default"' in str(response.content)
