"""
URL patterns for client management.
"""

from django.urls import path
from .views import (
    ClientListView,
    ClientDetailView,
    ClientSearchView
)

urlpatterns = [
    # Client management endpoints
    path('', ClientListView.as_view(), name='client_list'),
    path('search/', ClientSearchView.as_view(), name='client_search'),
    path('<int:pk>/', ClientDetailView.as_view(), name='client_detail'),
] 