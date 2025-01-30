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
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('patients/', PatientsView.as_view(), name='patients'),
    path('patients/new/', PatientCreateView.as_view(), name='patient-create'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient-detail'),
    path('patients/<int:pk>/edit/', PatientUpdateView.as_view(), name='patient-update'),

    # Api Views
    path('api/register', RegisterView.as_view(), name='api-register'),
    path('api/login', LoginView.as_view(), name='api-login'),
    path('api/logout', LogoutView.as_view(), name='api-logout'),
    path('api/ecg', ECGView.as_view(), name='api-ecg'),
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/login/', LoginView.as_view(), name='api-login'),
    path('api/logout/', LogoutView.as_view(), name='api-logout'),
    path('api/ecg/', ECGView.as_view(), name='api-ecg'),
    path('api/patients/new/', PatientCreateView.as_view(), name='api-patient-create'),
    path('api/patients/<int:pk>/', PatientDetailView.as_view(), name='api-patient-detail'),
]
