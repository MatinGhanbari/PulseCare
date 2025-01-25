from django.urls import path
from .views import ItemList, ItemDetail, get_ecg_data

urlpatterns = [
    path('items/', ItemList.as_view(), name='item-list'),
    path('items/<int:pk>/', ItemDetail.as_view(), name='item-detail'),
    path('ecg/', get_ecg_data),
]
