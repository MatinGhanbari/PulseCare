import datetime
import json
import os
import shutil

import jwt
import neurokit2 as nk
import numpy as np
import redis
import wfdb
from backend.settings import SECRET_KEY
from django.contrib.auth import authenticate
from django.core.files.storage import FileSystemStorage
from django.shortcuts import get_object_or_404
from django.shortcuts import redirect
from django.shortcuts import render
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Patient

# Initialize Redis connection
redis_client = redis.StrictRedis(
    host=os.getenv('REDIS_HOST'),
    port=int(os.getenv('REDIS_PORT')),
    db=int(os.getenv('REDIS_DB'))
)


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


class APIViewWrapper(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, AuthenticationFailed) or isinstance(exc, NotAuthenticated):
            return redirect('login')
        return super().handle_exception(exc)


def index(request):
    return render(request, 'index.html')


def login(request):
    return render(request, 'pages/login.html')


def signup(request):
    return render(request, 'pages/signup.html')


class DashboardView(APIViewWrapper):
    def get(self, request):
        return render(request, 'pages/dashboard.html',
                      {'user': request.user, 'all_patients_count': len(Patient.objects.all())})


class PatientsView(APIViewWrapper):
    def get(self, request):
        return render(request, 'pages/patients.html', {'user': request.user})


class PatientCreateView(APIViewWrapper):
    def get(self, request):
        return render(request, 'pages/patients/create.html', {'user': request.user})

    def post(self, request):
        firstname = request.POST.get('firstname')
        lastname = request.POST.get('lastname')
        age = request.POST.get('age')
        gender = request.POST.get('gender')
        files = request.FILES.getlist('files')

        patient = Patient(
            first_name=firstname,
            last_name=lastname,
            age=age,
            gender=gender,
            doctor=request.user
        )
        patient.save()
        directory_path = os.path.join('datasets', 'patients', str(patient.id))
        os.makedirs(directory_path, exist_ok=True)

        # Process each file
        for file in files:
            fs = FileSystemStorage(location=directory_path)
            filename = fs.save(file.name, file)  # Save the file

        # Return a JSON response
        return Response({"message": "Files and data uploaded successfully!"})


class PatientUpdateView(APIViewWrapper):
    def get(self, request, pk):
        patient = get_object_or_404(Patient, id=pk)
        return render(request, 'pages/patients/edit.html', {'user': request.user, 'patient': patient})


class PatientDetailView(APIViewWrapper):
    def put(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk, doctor=request.user)

        firstname = request.POST.get('firstname')
        lastname = request.POST.get('lastname')
        age = request.POST.get('age')
        gender = request.POST.get('gender')
        files = request.FILES.getlist('files')

        patient.first_name = firstname
        patient.last_name = lastname
        patient.age = age
        patient.gender = gender
        patient.save()

        directory_path = os.path.join('datasets', 'patients', str(patient.id))

        prefix = f"ecg_data:{pk}"
        remove_keys_with_prefix(prefix)
        shutil.rmtree(directory_path)

        os.makedirs(directory_path, exist_ok=False)

        # Process each file
        for file in files:
            fs = FileSystemStorage(location=directory_path)
            filename = fs.save(file.name, file)  # Save the file

        # Return a JSON response
        return Response({"message": "Updated successfully!"})

    def delete(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk, doctor=request.user)
        patient.delete()

        prefix = f"ecg_data:{patient}"
        remove_keys_with_prefix(prefix)

        return Response({"message": "Deleted successfully!"})


def remove_keys_with_prefix(prefix):
    cursor = 0
    while True:
        cursor, keys = redis_client.scan(cursor, match=f"{prefix}*")
        if keys:
            redis_client.delete(*keys)
        if cursor == 0:
            break


class LogoutView(APIViewWrapper):
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


class ECGView(APIViewWrapper):
    def get(self, request):
        start = int(request.GET.get('start', 0))
        length = int(request.GET.get('length', 500))
        sampto = int(request.GET.get('sampto', 10_000))
        patient = str(request.GET.get('patient'))

        # Generate a unique key based on request parameters
        redis_key = f"ecg_data:{patient}:{start}:{length}:{sampto}"

        # Check if data exists in Redis
        cached_data = redis_client.get(redis_key)
        if cached_data:
            return Response(json.loads(cached_data))

        directory_path = os.path.join('datasets', 'patients', str(patient))
        files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
        record_path = str(os.path.join(directory_path, files[0].split(".")[0]))

        try:
            record = wfdb.rdrecord(record_path, sampto=sampto)
        except ValueError as e:
            record = wfdb.rdrecord(record_path)

        # Delineate the ECG signal
        try:
            ecg_signal = record.p_signal[0:sampto, 0]
            _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
            _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")
        except ValueError as e:
            ecg_signal = record.p_signal[:, 0]
            _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
            try:
                _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")
            except ValueError as e:
                waves_peak = {'ECG_R_Peaks': [], 'ECG_T_Peaks': [], 'ECG_P_Peaks': [], 'ECG_Q_Peaks': [],
                              'ECG_S_Peaks': []}

        ecg_data = record.p_signal.tolist()[start:start + length] if len(record.p_signal.tolist()[0]) == 2 else [
            [i, record.p_signal.tolist()[start + i][0]] for i in range(length)]

        # ecg_data = record.p_signal.tolist()[start:start + length]

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
