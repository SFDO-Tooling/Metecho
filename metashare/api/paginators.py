from django.conf import settings
from rest_framework.pagination import PageNumberPagination


class CustomPaginator(PageNumberPagination):
    # We are not currently handling the case of objects being
    # created/deleted/reordered between a user fetching one page and another.
    # While the front end gracefully ignores duplicate objects, this may result
    # in an object being missed (until a browser-reload) if it was added to an
    # already-fetched page.
    page_size = settings.API_PAGE_SIZE
