# Load NeuroKit and other useful packages
import neurokit2 as nk
import wfdb
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


@api_view(['GET'])
def get_ecg_data(request):
    start = int(request.GET.get('start', 0))
    length = int(request.GET.get('length', 500))
    sampto = int(request.GET.get('sampto', 10_000))

    data_path = r'datasets/apnea-ecg/x08'
    try:
        record = wfdb.rdrecord(data_path, sampto=sampto)
    except ValueError as e:
        record = wfdb.rdrecord(data_path)

    # Delineate the ECG signal
    ecg_signal = record.p_signal[0:sampto, 0]
    _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
    _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")

    filtered_r_peaks = [num - start for num in rpeaks['ECG_R_Peaks'] if start < num < start + length]
    filtered_t_peaks = [num - start for num in waves_peak['ECG_T_Peaks'] if start < num < start + length]
    filtered_p_peaks = [num - start for num in waves_peak['ECG_P_Peaks'] if start < num < start + length]
    filtered_q_peaks = [num - start for num in waves_peak['ECG_Q_Peaks'] if start < num < start + length]
    filtered_s_peaks = [num - start for num in waves_peak['ECG_S_Peaks'] if start < num < start + length]

    return Response({
        'ecg_data': record.p_signal.tolist()[start:start + length]
        if len(record.p_signal.tolist()[0]) == 2
        else [[i, record.p_signal.tolist()[start + i][0]] for i in range(length)],
        'r_peaks': filtered_r_peaks,
        't_peaks': filtered_t_peaks,
        'p_peaks': filtered_p_peaks,
        'q_peaks': filtered_q_peaks,
        's_peaks': filtered_s_peaks,
    })
