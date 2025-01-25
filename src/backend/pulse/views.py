from django.shortcuts import render
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Item
from .serializers import ItemSerializer

# Create your views here.
class ItemList(generics.ListCreateAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class ItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


import wfdb
@api_view(['GET'])
def get_ecg_data(request):
    record = wfdb.rdrecord(r'datasets/ahadb/0201')
    p_signal = record.p_signal.tolist()[:500]
    return Response({'ecg_data': p_signal})