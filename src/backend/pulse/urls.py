from django.urls import path

from .views import *

urlpatterns = [
    path('items/', ItemList.as_view(), name='item-list'),
    path('items/<int:pk>/', ItemDetail.as_view(), name='item-detail'),
    path('ecg', get_ecg_data, name="ecg"),
    path('login', user_login, name="login"),
    path('logout', user_logout, name="logout"),
    path('signup', register, name="signup"),
    path('getme', getme, name="getme"),
]
