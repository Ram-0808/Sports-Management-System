from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
# --- ADD THIS LINE ---
from rest_framework.parsers import MultiPartParser, FormParser 
from .models import User, Profile, Academy, Task, TaskCompletion, ParentChildLink
from .serializers import (
    UserDetailSerializer,
    UserRegistrationSerializer,
    ParentRegistrationSerializer,
    ProfileSerializer,
    AcademySerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskCompletionSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class ParentRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = ParentRegistrationSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    http_method_names = ['get', 'patch', 'head', 'options']
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = User.objects.all()
        sport = self.request.query_params.get('sport')
        if sport:
            queryset = queryset.filter(profile__sport=sport)
        return queryset

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

class AcademyViewSet(viewsets.ModelViewSet):
    queryset = Academy.objects.all()
    serializer_class = AcademySerializer
    permission_classes = [permissions.AllowAny]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TaskCreateSerializer
        return TaskDetailSerializer

    def perform_create(self, serializer):
        coach_profile = self.request.user.profile
        serializer.save(
            assigned_by=self.request.user,
            sport=coach_profile.sport,
            academy=coach_profile.academy
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_tasks(request):
    tasks = request.user.tasks.all().order_by('-created_at')
    serializer = TaskDetailSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def coach_mark_task_complete(request, task_id, player_id):
    coach = request.user
    if coach.role != 'coach':
        return Response({"detail": "Only coaches can perform this action."}, status=status.HTTP_403_FORBIDDEN)
    try:
        task = Task.objects.get(id=task_id, assigned_by=coach)
        player = User.objects.get(id=player_id, role='player')
    except (Task.DoesNotExist, User.DoesNotExist):
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    completion, _ = TaskCompletion.objects.get_or_create(task=task, player=player)
    completion.completed = True
    completion.notes = request.data.get('notes', 'Completed by coach.')
    completion.save()
    serializer = TaskCompletionSerializer(completion)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def parent_dashboard(request):
    parent = request.user
    if parent.role != 'parent':
        return Response({"detail": "Not a parent account."}, status=status.HTTP_403_FORBIDDEN)
    try:
        link = ParentChildLink.objects.get(parent=parent)
        child = link.child
        tasks = child.tasks.all().order_by('-created_at')
        response_data = {
            'child': UserDetailSerializer(child).data,
            'tasks': TaskDetailSerializer(tasks, many=True).data
        }
        return Response(response_data)
    except ParentChildLink.DoesNotExist:
        return Response({"detail": "No child linked to this parent account."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def player_start_task(request, task_id):
    player = request.user
    if player.role != 'player':
        return Response({"detail": "Only players can start tasks."}, status=status.HTTP_403_FORBIDDEN)
    try:
        task = Task.objects.get(id=task_id, players=player)
    except Task.DoesNotExist:
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
    completion, _ = TaskCompletion.objects.get_or_create(task=task, player=player)
    if completion.started_at is None:
        completion.started_at = timezone.now()
        completion.save()
    serializer = TaskCompletionSerializer(completion)
    return Response(serializer.data)
