from django.urls import path

from . import views
from .views import *

urlpatterns = [
    # Page Views
    path('', views.index, name='index'),
    path('login', views.login, name='login'),
    path('signup', views.signup, name='signup'),
    path('dashboard', DashboardView.as_view(), name='dashboard'),
    path('patients', PatientsView.as_view(), name='patients'),
    path('/', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('patients/', PatientsView.as_view(), name='patients'),

    # Api Views
    path('api/register', RegisterView.as_view(), name='api-register'),
    path('api/login', LoginView.as_view(), name='api-login'),
    path('api/logout', LogoutView.as_view(), name='api-logout'),
    path('api/ecg', ECGView.as_view(), name='api-ecg'),
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/login/', LoginView.as_view(), name='api-login'),
    path('api/logout/', LogoutView.as_view(), name='api-logout'),
    path('api/ecg/', ECGView.as_view(), name='api-ecg'),
]
