# Load NeuroKit and other useful packages
import hashlib
import json

import neurokit2 as nk
import redis
import wfdb
from django.contrib import messages
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from .models import Item
from .serializers import ItemSerializer

redis_client = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)


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


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@csrf_exempt
@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        body = request.body
        body_str = body.decode('utf-8')
        data = json.loads(body_str)

        # Now you can access the data
        username = data.get('username')
        password = data.get('password')

        # Check if user already exists
        if redis_client.exists(username):
            messages.error(request, 'Username already exists.')
            return Response(data={'error': 'Username already exists'}, status=400)

        # Store user data in Redis
        redis_client.hset(username, 'password', hash_password(password))
        messages.success(request, 'Registration successful!')
        return Response(data={'message': 'Registration successful!'}, status=200)

    return Response(data={'error': 'request method error'}, status=400)


@csrf_exempt
@api_view(['POST'])
def user_login(request):
    if request.method == 'POST':
        body = request.body
        body_str = body.decode('utf-8')
        data = json.loads(body_str)

        # Now you can access the data
        username = data.get('username')
        password = data.get('password')

        # Retrieve user data from Redis
        if redis_client.exists(username):
            stored_password = redis_client.hget(username, 'password').decode()
            if stored_password == hash_password(password):
                request.session['username'] = username
                return Response(data={'message': 'Login successful!'}, status=200)
            else:
                messages.error(request, 'Invalid credentials')
        else:
            messages.error(request, 'User does not exist')

    return Response(data={'error': 'login error'}, status=400)


@csrf_exempt
@api_view(['POST'])
def user_logout(request):
    request.session.flush()
    return Response(data={'message': 'successful!'}, status=200)
