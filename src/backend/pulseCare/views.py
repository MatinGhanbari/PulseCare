import datetime
import json

import jwt
import neurokit2 as nk
import numpy as np
import redis
import wfdb
from backend.settings import SECRET_KEY
from django.contrib.auth import authenticate
from django.shortcuts import render
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User

# Initialize Redis connection
redis_client = redis.StrictRedis(host='127.0.0.1', port=6379, db=0)


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('jwt_token') or request.headers.get('authorization')
        if not token:
            return None
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        user = User.objects.get(id=payload['user_id'])
        return (user, token)


def index(request):
    return render(request, 'index.html')


def login(request):
    return render(request, 'pages/login.html')


def signup(request):
    return render(request, 'pages/signup.html')


class DashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return render(request, 'pages/dashboard.html', {'user': request.user})


class PatientsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return render(request, 'pages/patients.html', {'user': request.user})


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return render(request, 'pages/patients.html', {'user': request.user})


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password)
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            User.objects.update_last_login(user, datetime.datetime.now())
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid credentials'}, status=400)


class ECGView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = int(request.GET.get('start', 0))
        length = int(request.GET.get('length', 500))
        sampto = int(request.GET.get('sampto', 10_000))
        data_path = str(request.GET.get('data_path', r'datasets/apnea-ecg/x01'))

        # Generate a unique key based on request parameters
        redis_key = f"ecg_data:{data_path}:{start}:{length}:{sampto}"

        # Check if data exists in Redis
        cached_data = redis_client.get(redis_key)
        if cached_data:
            return Response(json.loads(cached_data))

        try:
            record = wfdb.rdrecord(data_path, sampto=sampto)
        except ValueError as e:
            record = wfdb.rdrecord(data_path)

        # Delineate the ECG signal
        ecg_signal = record.p_signal[0:sampto, 0]
        _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
        _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")

        ecg_data = record.p_signal.tolist()[start:start + length] if len(record.p_signal.tolist()[0]) == 2 else [
            [i, record.p_signal.tolist()[start + i][0]] for i in range(length)]

        waves_peak['ECG_R_Peaks'] = rpeaks['ECG_R_Peaks']
        response = generate_ecg_response(ecg_data, waves_peak, start, length)

        # Store the response data in Redis
        redis_client.set(redis_key, json.dumps(response, cls=NumpyEncoder))
        return Response(response)


def generate_ecg_response(ecg_data, peaks, start, length):
    filtered_r_peaks = [num - start for num in peaks['ECG_R_Peaks'] if start < num < start + length]
    filtered_t_peaks = [num - start for num in peaks['ECG_T_Peaks'] if start < num < start + length]
    filtered_p_peaks = [num - start for num in peaks['ECG_P_Peaks'] if start < num < start + length]
    filtered_q_peaks = [num - start for num in peaks['ECG_Q_Peaks'] if start < num < start + length]
    filtered_s_peaks = [num - start for num in peaks['ECG_S_Peaks'] if start < num < start + length]

    return {
        'ecg_data': ecg_data,
        'ECG_R_Peaks': filtered_r_peaks,
        'ECG_T_Peaks': filtered_t_peaks,
        'ECG_P_Peaks': filtered_p_peaks,
        'ECG_Q_Peaks': filtered_q_peaks,
        'ECG_S_Peaks': filtered_s_peaks,
    }


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
