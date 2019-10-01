from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ProjectFilter, RepositoryFilter, ScratchOrgFilter, TaskFilter
from .models import Project, Repository, ScratchOrg, Task
from .paginators import CustomPaginator
from .serializers import (
    FullUserSerializer,
    MinimalUserSerializer,
    ProjectSerializer,
    RepositorySerializer,
    ScratchOrgSerializer,
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
        from .jobs import refresh_github_repositories_for_user_job

        user = self.get_object()
        refresh_github_repositories_for_user_job.delay(user)
        return Response(status=status.HTTP_202_ACCEPTED)


class UserDisconnectSFView(CurrentUserObjectMixin, APIView):
    model = User
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = self.get_object()
        user.invalidate_salesforce_credentials()
        serializer = FullUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = MinimalUserSerializer
    pagination_class = CustomPaginator
    queryset = User.objects.all()


class RepositoryViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = RepositorySerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = RepositoryFilter
    pagination_class = CustomPaginator
    model = Repository

    def get_queryset(self):
        repositories = self.request.user.repositories.values_list("url", flat=True)
        return Repository.objects.filter(repo_url__in=repositories)


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


class ScratchOrgViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ScratchOrgSerializer
    queryset = ScratchOrg.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ScratchOrgFilter

    def perform_destroy(self, instance):
        instance.queue_delete()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.get_unsaved_changes()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["POST"])
    def commit(self, request, pk=None):
        from .jobs import commit_changes_from_org_job

        scratch_org = self.get_object()
        # Expect request.data to be Dict<str, List<str>>
        commit_changes_from_org_job.delay(scratch_org, request.user, request.data)
        return Response("", status=status.HTTP_202_ACCEPTED)
