from rest_framework import serializers
from .models import User, Profile, Academy, Task, TaskCompletion, ParentChildLink

# --- A minimal serializer for displaying profile info inside other objects ---
class ProfileSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['sport', 'academy']

# --- For READING detailed user info (includes profile and membership details) ---
class UserDetailSerializer(serializers.ModelSerializer):
    profile = ProfileSimpleSerializer(read_only=True)
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'role', 
            'profile', 
            'player_id', 
            'membership_start_date', 
            'membership_end_date'
        ]

# --- For CREATING a new Player/Coach user ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    profile = ProfileSimpleSerializer(required=False)
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'profile']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        role = validated_data.pop('role') # Pop the role to handle it separately

        # Create the user with standard fields that create_user expects
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Now, set the custom role field and save the user instance again
        user.role = role
        user.save()

        # The Profile is created automatically by a signal, so we just update it
        if profile_data:
            Profile.objects.filter(user=user).update(**profile_data)
        return user

# --- For CREATING a new Parent user ---
class ParentRegistrationSerializer(serializers.ModelSerializer):
    child_player_id = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'child_player_id']

    def validate_child_player_id(self, value):
        if not User.objects.filter(player_id=value, role='player').exists():
            raise serializers.ValidationError("No active player found with this ID.")
        return value

    def create(self, validated_data):
        child_player_id = validated_data.pop('child_player_id')
        child_user = User.objects.get(player_id=child_player_id)

        # Correctly create the parent user and set their role
        parent_user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        parent_user.role = 'parent'
        parent_user.save()

        # Link the parent and child in the ParentChildLink table
        ParentChildLink.objects.create(parent=parent_user, child=child_user)
        return parent_user


class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ['id', 'user', 'sport', 'academy']

class TaskCompletionSerializer(serializers.ModelSerializer):
    player_username = serializers.CharField(source='player.username', read_only=True)
    class Meta:
        model = TaskCompletion
        fields = ['id', 'task', 'player', 'player_username', 'completed', 'notes', 'started_at']

# --- For READING/LISTING tasks (with full nested details) ---
class TaskDetailSerializer(serializers.ModelSerializer):
    assigned_by = UserDetailSerializer(read_only=True)
    players = UserDetailSerializer(many=True, read_only=True)
    completions = TaskCompletionSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 
            'title', 
            'description', 
            'assigned_by', 
            'created_at', 
            'due_date', 
            'time_limit_minutes', 
            'players', 
            'completions'
        ]

# --- For CREATING/UPDATING tasks (accepting simple player IDs) ---
class TaskCreateSerializer(serializers.ModelSerializer):
    players = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='player'), many=True, write_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 
            'title', 
            'description', 
            'due_date', 
            'time_limit_minutes', 
            'sport', 
            'academy', 
            'players'
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    profile = ProfileSimpleSerializer(read_only=True)
    # Add photo_url to the fields list
    class Meta:
        model = User
        fields = [ 'id', 'username', 'email', 'role', 'profile', 'player_id', 'membership_start_date', 'membership_end_date', 'photo' ]