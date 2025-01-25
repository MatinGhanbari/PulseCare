from django.shortcuts import render
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Item
from .serializers import ItemSerializer
from biosppy.signals import ecg

# Create your views here.
class ItemList(generics.ListCreateAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class ItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


import wfdb
@api_view(['GET'])
def get_ecg_data(request, sampto=500):
    record = wfdb.rdrecord(r'datasets/ahadb/0201')

    out = ecg.ecg(signal=record.p_signal[:2000, 0], sampling_rate=record.fs, show=False)

    return Response({
        'ecg_data': record.p_signal.tolist()[:sampto],
        'r_peaks': out['rpeaks'].tolist(),
    })