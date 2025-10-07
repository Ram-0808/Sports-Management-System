from django.contrib import admin
from .models import User, Profile, Academy, Task, TaskCompletion
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (('Role', {'fields':('role','photo')}),)
    list_display = ('username','email','role')

admin.site.register(Profile)
admin.site.register(Academy)
admin.site.register(Task)
admin.site.register(TaskCompletion)
