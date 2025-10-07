from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_save  

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    

    def ready(self):
        import core.signals  # Ensure signals are imported and registered   