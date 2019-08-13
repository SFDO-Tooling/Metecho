from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ProductFilter, ProjectFilter, TaskFilter
from .models import Product, Project, Task
from .paginators import CustomPaginator
from .serializers import (
    FullUserSerializer,
    MinimalUserSerializer,
    ProductSerializer,
    ProjectSerializer,
    TaskSerializer,
)

User = get_user_model()


class CurrentUserObjectMixin:
    def get_queryset(self):
        return self.model.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.get_queryset().get()


class UserView(CurrentUserObjectMixin, generics.RetrieveAPIView):
    """
    Shows the current user.
    """

    model = User
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)


class UserRefreshView(CurrentUserObjectMixin, APIView):
    model = User
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = self.get_object()
        user.refresh_repositories()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = MinimalUserSerializer
    pagination_class = CustomPaginator
    queryset = User.objects.all()


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProductSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProductFilter
    pagination_class = CustomPaginator
    model = Product

    def get_queryset(self):
        repositories = self.request.user.repositories.values_list("url", flat=True)
        return Product.objects.filter(repo_url__in=repositories)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectSerializer
    pagination_class = CustomPaginator
    queryset = Project.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProjectFilter


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = TaskFilter
