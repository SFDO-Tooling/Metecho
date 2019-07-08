from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import gh
from .models import GitHubRepository, Product, Project
from .paginators import CustomPaginator
from .serializers import FullUserSerializer, ProductSerializer, ProjectSerializer

User = get_user_model()


class CurrentUserObjectMixin:
    def get_queryset(self):
        return self.model.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.get_queryset().get()


class UserView(CurrentUserObjectMixin, generics.RetrieveAPIView):
    model = User
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)


class UserRefreshView(CurrentUserObjectMixin, APIView):
    model = User
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = self.get_object()
        repos = gh.get_all_org_repos(user)
        GitHubRepository.objects.filter(user=user).delete()
        GitHubRepository.objects.bulk_create(
            [GitHubRepository(user=user, url=repo) for repo in repos]
        )
        serializer = FullUserSerializer(user)
        # TODO: this _should_ return the new list of products for the user, but that
        # feels wrong for this endpoint. Merits thought.
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProductSerializer
    pagination_class = CustomPaginator

    def get_queryset(self):
        repositories = self.request.user.repositories.values_list("url", flat=True)
        return Product.objects.filter(repo_url__in=repositories)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectSerializer
    pagination_class = CustomPaginator
    queryset = Project.objects.all()
