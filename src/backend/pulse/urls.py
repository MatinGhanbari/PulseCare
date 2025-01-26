from django.urls import path
from .views import ItemList, ItemDetail, get_ecg_data,user_login,register,user_logout

urlpatterns = [
    path('items/', ItemList.as_view(), name='item-list'),
    path('items/<int:pk>/', ItemDetail.as_view(), name='item-detail'),
    path('ecg', get_ecg_data),
    path('login', user_login),
    path('logout', user_logout),
    path('signup', register),
]
