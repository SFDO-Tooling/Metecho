from rest_framework.pagination import PageNumberPagination


class ProductPaginator(PageNumberPagination):
    # We are not currently handling the case of products being
    # created/deleted/reordered between a user fetching one page and another.
    # While the front end gracefully ignores duplicate products, this may result
    # in a product being missed (until a browser-reload) if it was added to an
    # already-fetched page.
    page_size = 25
