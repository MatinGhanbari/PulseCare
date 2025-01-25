from django.shortcuts import render
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Item
from .serializers import ItemSerializer

# Load NeuroKit and other useful packages
import neurokit2 as nk
import numpy as np
import pandas as pd

# Create your views here.
class ItemList(generics.ListCreateAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class ItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


import wfdb
@api_view(['GET'])
def get_ecg_data(request, length=400 ,sampto=10000):
    record = wfdb.rdrecord(r'datasets/ahadb/0201', sampto=sampto)

    # Delineate the ECG signal
    ecg_signal = record.p_signal[:, 0]
    _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
    _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")

    return Response({
        'ecg_data': record.p_signal.tolist()[:length],
        'r_peaks': rpeaks['ECG_R_Peaks'],
        't_peaks': waves_peak['ECG_T_Peaks'][:3],
        'p_peaks': waves_peak['ECG_P_Peaks'][:3],
        'q_peaks': waves_peak['ECG_Q_Peaks'][:3],
        's_peaks': waves_peak['ECG_S_Peaks'][:3],
    })