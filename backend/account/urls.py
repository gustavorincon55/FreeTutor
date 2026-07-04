from django.urls import path
from . import views, api_views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),

    # REST API endpoints
    path('api/csrf/', api_views.csrf_token, name='api-csrf'),
    path('api/register/', api_views.register_api, name='api-register'),
    path('api/login/', api_views.login_api, name='api-login'),
    path('api/logout/', api_views.logout_api, name='api-logout'),
    path('api/profile/', api_views.profile_api, name='api-profile'),
    path('api/availability/', api_views.availability_list_api, name='api-availability-list'),
    path('api/availability/<int:pk>/', api_views.availability_detail_api, name='api-availability-detail'),
    path('api/sessions/', api_views.sessions_api, name='api-sessions'),
    path('api/sessions/open/', api_views.open_sessions_api, name='api-sessions-open'),
    path('api/sessions/<int:pk>/action/', api_views.session_action_api, name='api-session-action'),
    path('api/posts/', api_views.post_list_api, name='api-post-list'),
    path('api/posts/<int:pk>/', api_views.post_detail_api, name='api-post-detail'),
    path('api/posts/<int:pk>/connect/', api_views.post_connect_api, name='api-post-connect'),
]
