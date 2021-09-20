from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.db.models import Case, IntegerField, Q, When
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema
from github3.exceptions import ConnectionError, ResponseError
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from . import gh
from .authentication import GitHubHookAuthentication
from .filters import EpicFilter, ProjectFilter, ScratchOrgFilter, TaskFilter
from .hook_serializers import (
    PrHookSerializer,
    PrReviewHookSerializer,
    PushHookSerializer,
)
from .models import EPIC_STATUSES, SCRATCH_ORG_TYPES, Epic, Project, ScratchOrg, Task
from .paginators import CustomPaginator
from .serializers import (
    CanReassignSerializer,
    CommitSerializer,
    CreatePrSerializer,
    EpicCollaboratorsSerializer,
    EpicSerializer,
    FullUserSerializer,
    GuidedTourSerializer,
    MinimalUserSerializer,
    ProjectSerializer,
    ReviewSerializer,
    ScratchOrgSerializer,
    TaskAssigneeSerializer,
    TaskSerializer,
)

User = get_user_model()


class RepoPushPermissionMixin:
    """
    Require repository Push permission for all operations other than list/read.
    Assumes the related model implements a `has_push_permission(user)` method.
    """

    def check_push_permission(self, instance):
        if not instance.has_push_permission(self.request.user):
            raise PermissionDenied(
                _('You do not have "Push" permissions in the related repository')
            )

    def perform_create(self, serializer):
        # instance = serializer.Meta.model(**serializer.validated_data)
        # The for-loop could be replaced with the line above but that raises TypeError
        # if the serializer has extra fields not contained in the model. `setattr()`
        # works around this while still creating a valid instance.
        instance = serializer.Meta.model()
        for k, v in serializer.validated_data.items():
            setattr(instance, k, v)

        self.check_push_permission(instance)
        return super().perform_create(serializer)

    def perform_update(self, serializer):
        self.check_push_permission(serializer.instance)
        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        self.check_push_permission(instance)
        return super().perform_destroy(instance)


class CreatePrMixin:
    error_pr_exists = ""  # Implement this

    @extend_schema(request=CreatePrSerializer)
    @action(detail=True, methods=["POST"])
    def create_pr(self, request, pk=None):
        """Queue a job to create a GitHub pull request."""
        serializer = CreatePrSerializer(data=self.request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.get_object()
        if instance.pr_is_open:
            raise ValidationError(self.error_pr_exists)
        instance.queue_create_pr(
            request.user,
            **serializer.validated_data,
            originating_user_id=str(request.user.id),
        )
        return Response(
            self.get_serializer(instance).data, status=status.HTTP_202_ACCEPTED
        )


class HookView(APIView):
    authentication_classes = (GitHubHookAuthentication,)

    @extend_schema(exclude=True)
    def post(self, request):
        """Intendend to respond to several GitHubs webhooks. Not consumed by the frontend."""
        serializers = {
            "push": PushHookSerializer,
            "pull_request": PrHookSerializer,
            "pull_request_review": PrReviewHookSerializer,
        }
        serializer_class = serializers.get(request.META.get("HTTP_X_GITHUB_EVENT"))
        if serializer_class is None:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        serializer = serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.process_hook()
        return Response(status=status.HTTP_202_ACCEPTED)


class CurrentUserViewSet(GenericViewSet):
    """Actions related to the current user."""

    model = User
    queryset = User.objects.none()  # Required by drf-spectacular
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)

    @extend_schema(operation_id="current_user_retrieve")
    def get(self, request):
        """Get full details about the current user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=None)
    @action(methods=["PUT"], detail=False)
    def agree_to_tos(self, request):
        """Set the user's `agreed_to_tos_at` field to the current datetime."""
        request.user.agreed_to_tos_at = timezone.now()
        request.user.save()
        return self.get(request)

    @extend_schema(request=None)
    @action(methods=["PUT"], detail=False)
    def complete_onboarding(self, request):
        """Set the user's `onboarded_at` field to the current datetime."""
        request.user.onboarded_at = timezone.now()
        request.user.save()
        return self.get(request)

    @extend_schema(request=GuidedTourSerializer)
    @action(methods=["POST"], detail=False)
    def guided_tour(self, request):
        """Update the user's guided-tour preferences and history."""
        serializer = GuidedTourSerializer(instance=request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return self.get(request)

    @extend_schema(request=None)
    @action(methods=["POST"], detail=False)
    def disconnect(self, request):
        """Disconnect the current user from their SalesForce account."""
        request.user.invalidate_salesforce_credentials()
        return self.get(request)

    @extend_schema(request=None, responses={202: None})
    @action(methods=["POST"], detail=False)
    def refresh(self, request):
        """Queue a job to refresh the user's list of GitHub repositories."""
        request.user.queue_refresh_repositories()
        return Response(status=status.HTTP_202_ACCEPTED)


class UserViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, GenericViewSet):
    """Read-only information about all users."""

    permission_classes = (IsAuthenticated,)
    serializer_class = MinimalUserSerializer
    pagination_class = CustomPaginator
    queryset = User.objects.all()


class ProjectViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, GenericViewSet):
    """Read-only information about Metecho Projects."""

    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProjectFilter
    pagination_class = CustomPaginator
    queryset = Project.objects.filter(repo_id__isnull=False)

    def get_queryset(self):
        for project in Project.objects.filter(repo_id__isnull=True):
            try:
                project.get_repo_id()
            except (ResponseError, ConnectionError):
                pass

        if self.request.user.is_superuser:
            return self.queryset

        repo_ids = self.request.user.repositories.values_list("repo_id", flat=True)
        return self.queryset.filter(repo_id__in=repo_ids)

    @extend_schema(request=None, responses={202: None})
    @action(detail=True, methods=["POST"])
    def refresh_github_users(self, request, pk=None):
        """Queue a job to refresh the list of GitHub users for a Project."""
        project = self.get_object()
        project.queue_refresh_github_users(originating_user_id=str(request.user.id))
        return Response(status=status.HTTP_202_ACCEPTED)

    @extend_schema(request=None, responses={202: None})
    @action(detail=True, methods=["POST"])
    def refresh_org_config_names(self, request, pk=None):
        """Queue a job to refresh the list of ScratchOrg configs for a Project."""
        project = self.get_object()
        project.queue_available_org_config_names(user=request.user)
        return Response(
            self.get_serializer(project).data, status=status.HTTP_202_ACCEPTED
        )

    @extend_schema(
        request=None,
        responses=OpenApiResponse(
            {"type": "array", "items": {"type": "string"}}, description=""
        ),
    )
    @action(detail=True, methods=["GET"], pagination_class=None)
    def feature_branches(self, request, pk=None):
        """Get a list of feature branch names for a Project."""
        instance = self.get_object()
        repo = gh.get_repo_info(
            None, repo_owner=instance.repo_owner, repo_name=instance.repo_name
        )
        existing_branches = set(
            Epic.objects.active()
            .exclude(branch_name="")
            .values_list("branch_name", flat=True)
        )
        data = [
            branch.name
            for branch in repo.branches()
            if (
                "__" not in branch.name
                and branch.name != repo.default_branch
                and branch.name not in existing_branches
            )
        ]
        return Response(data)


class EpicViewSet(RepoPushPermissionMixin, CreatePrMixin, ModelViewSet):
    """Manage Epics related to a Metecho Project."""

    permission_classes = (IsAuthenticated,)
    serializer_class = EpicSerializer
    pagination_class = CustomPaginator
    queryset = Epic.objects.active()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = EpicFilter
    error_pr_exists = _("Epic has already been submitted for testing.")

    def get_queryset(self):
        qs = super().get_queryset()
        whens = [
            When(status=EPIC_STATUSES.Review, then=0),
            When(status=EPIC_STATUSES["In progress"], then=1),
            When(status=EPIC_STATUSES.Planned, then=2),
            When(status=EPIC_STATUSES.Merged, then=3),
        ]
        return qs.annotate(ordering=Case(*whens, output_field=IntegerField())).order_by(
            "ordering", "-created_at", "name"
        )

    @extend_schema(request=EpicCollaboratorsSerializer)
    @action(detail=True, methods=["POST", "PUT"])
    def collaborators(self, request, pk=None):
        """
        Edit the Epic collaborators. Exposed as a separate endpoint for users without
        write access to Epics.
        """
        epic = self.get_object()
        serializer = EpicCollaboratorsSerializer(
            epic, request.data, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(epic, serializer.validated_data)
        return Response(self.get_serializer(epic).data)


class TaskViewSet(RepoPushPermissionMixin, CreatePrMixin, ModelViewSet):
    """Manage Tasks related to a Metecho Project or Epic."""

    permission_classes = (IsAuthenticated,)
    serializer_class = TaskSerializer
    queryset = Task.objects.select_related("epic", "epic__project").active()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = TaskFilter
    error_pr_exists = _("Task has already been submitted for testing.")

    @extend_schema(request=ReviewSerializer)
    @action(detail=True, methods=["POST"])
    def review(self, request, pk=None):
        """Queue a job that submits a Task pull request review."""
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = self.get_object()
        org = serializer.validated_data["org"]

        if not task.pr_is_open:
            raise ValidationError(_("The pull request for this Task has been closed."))
        if not (org or task.review_valid):
            raise ValidationError(_("Cannot submit review without a Test Org."))

        task.queue_submit_review(
            user=request.user,
            data=serializer.validated_data,
            originating_user_id=str(request.user.id),
        )
        return Response(self.get_serializer(task).data, status=status.HTTP_202_ACCEPTED)

    @extend_schema(
        request=CanReassignSerializer,
        responses=OpenApiResponse(
            {"properties": {"can_reassign": {"type": "boolean"}}}, description=""
        ),
    )
    @action(detail=True, methods=["POST"])
    def can_reassign(self, request, pk=None):
        """Check if a GitHub user can be assigned to a Task"""
        serializer = CanReassignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = self.get_object()
        role = serializer.validated_data["role"]
        role_org_type = {
            "assigned_qa": SCRATCH_ORG_TYPES.QA,
            "assigned_dev": SCRATCH_ORG_TYPES.Dev,
        }.get(role, None)
        gh_uid = serializer.validated_data["gh_uid"]
        org = task.orgs.active().filter(org_type=role_org_type).first()
        new_user = getattr(
            SocialAccount.objects.filter(provider="github", uid=gh_uid).first(),
            "user",
            None,
        )
        valid_commit = org and org.latest_commit == (
            task.commits[0] if task.commits else task.origin_sha
        )
        return Response(
            {
                "can_reassign": bool(
                    new_user
                    and org
                    and org.owner_sf_username == new_user.sf_username
                    and valid_commit
                )
            }
        )

    @extend_schema(request=TaskAssigneeSerializer)
    @action(detail=True, methods=["POST", "PUT"])
    def assignees(self, request, pk=None):
        """
        Edit the assigned Developer and Tester on a Task. Exposed as a separate endpoint
        for users without write access to Tasks.
        """
        task = self.get_object()
        serializer = TaskAssigneeSerializer(
            task, request.data, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        serializer.update(task, serializer.validated_data)
        return Response(self.get_serializer(task).data)


class ScratchOrgViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    """Manage SalesForce ScratchOrgs."""

    permission_classes = (IsAuthenticated,)
    serializer_class = ScratchOrgSerializer
    queryset = ScratchOrg.objects.active()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ScratchOrgFilter

    def perform_create(self, *args, **kwargs):
        if self.request.user.is_devhub_enabled:
            super().perform_create(*args, **kwargs)
        else:
            raise PermissionDenied(
                _(
                    "User is not connected to a Salesforce organization "
                    "with Dev Hub enabled."
                )
            )

    def perform_destroy(self, instance):
        instance.queue_delete(originating_user_id=str(self.request.user.id))

    def destroy(self, request, *args, **kwargs):
        scratch_org = self.get_object()
        if not request.user == scratch_org.owner:
            return Response(
                {"error": _("Requesting user did not create Org.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        # XXX: This method is copied verbatim from
        # rest_framework.mixins.RetrieveModelMixin, because I needed to
        # insert the get_unsaved_changes line in the middle.
        queryset = self.filter_queryset(
            self.get_queryset().exclude(
                ~Q(owner=request.user), org_type=SCRATCH_ORG_TYPES.Playground
            )
        )

        force_get = request.query_params.get("get_unsaved_changes", False)
        # XXX: I am apprehensive about the possibility of flooding the
        # worker queues easily this way:
        filters = {
            "org_type__in": [SCRATCH_ORG_TYPES.Dev, SCRATCH_ORG_TYPES.Playground],
            "delete_queued_at__isnull": True,
            "currently_capturing_changes": False,
            "currently_refreshing_changes": False,
        }
        if not force_get:
            filters["owner"] = request.user
        for instance in queryset.filter(**filters).exclude(url=""):
            instance.queue_get_unsaved_changes(
                force_get=force_get, originating_user_id=str(request.user.id)
            )

        # XXX: If we ever paginate this endpoint, we will need to add
        # pagination logic back in here.

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        # XXX: This method is adapted from
        # rest_framework.mixins.RetrieveModelMixin, but one particular
        # change: we needed to insert the get_unsaved_changes line in
        # the middle.
        instance = self.get_object()
        if (
            instance.org_type == SCRATCH_ORG_TYPES.Playground
            and not request.user == instance.owner
        ):
            return Response(
                {"error": _("Requesting user did not create Org.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        force_get = request.query_params.get("get_unsaved_changes", False)
        conditions = [
            instance.org_type in [SCRATCH_ORG_TYPES.Dev, SCRATCH_ORG_TYPES.Playground],
            instance.is_created,
            instance.delete_queued_at is None,
            not instance.currently_capturing_changes,
            not instance.currently_refreshing_changes,
        ]
        if not force_get:
            conditions.append(instance.owner == request.user)
        if all(conditions):
            instance.queue_get_unsaved_changes(
                force_get=force_get, originating_user_id=str(request.user.id)
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(request=CommitSerializer, responses={202: ScratchOrgSerializer})
    @action(detail=True, methods=["POST"])
    def commit(self, request, pk=None):
        """Queue a job that commits changes captured from a ScratchOrg."""
        serializer = CommitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scratch_org = self.get_object()
        if not request.user == scratch_org.owner:
            return Response(
                {"error": _("Requesting user did not create Org.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        commit_message = serializer.validated_data["commit_message"]
        desired_changes = serializer.validated_data["changes"]
        target_directory = serializer.validated_data["target_directory"]
        valid_target_directories = [
            item
            for section in scratch_org.valid_target_directories.values()
            for item in section
        ]
        if target_directory not in valid_target_directories:
            raise ValidationError("Invalid target directory")
        scratch_org.queue_commit_changes(
            user=request.user,
            desired_changes=desired_changes,
            commit_message=commit_message,
            target_directory=target_directory,
            originating_user_id=str(request.user.id),
        )
        return Response(
            self.get_serializer(scratch_org).data, status=status.HTTP_202_ACCEPTED
        )

    @extend_schema(request=None, responses={302: None})
    @action(detail=True, methods=["GET"])
    def redirect(self, request, pk=None):
        """Redirect to a ScratchOrg's URL."""
        scratch_org = self.get_object()
        if not request.user == scratch_org.owner:
            return Response(
                {"error": _("Requesting user did not create Org.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        scratch_org.mark_visited(originating_user_id=str(request.user.id))
        url = scratch_org.get_login_url()
        return HttpResponseRedirect(redirect_to=url)

    @extend_schema(request=None, responses={202: ScratchOrgSerializer})
    @action(detail=True, methods=["POST"])
    def refresh(self, request, pk=None):
        """Queue a job that retrieves the latest changes from a ScratchOrg."""
        scratch_org = self.get_object()
        if not request.user == scratch_org.owner:
            return Response(
                {"error": _("Requesting user did not create Org.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        scratch_org.queue_refresh_org(originating_user_id=str(request.user.id))
        return Response(
            self.get_serializer(scratch_org).data, status=status.HTTP_202_ACCEPTED
        )
