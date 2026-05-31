"""
Global Django admin customisation — branding and site metadata.
Import this from config/urls.py
"""
from django.contrib import admin


def configure_admin():
    admin.site.site_header  = "NGP HabitForge Admin"
    admin.site.site_title   = "HabitForge"
    admin.site.index_title  = "Platform Administration"
    admin.site.enable_nav_sidebar = True
