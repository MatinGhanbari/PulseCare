import datetime
import shutil

import jwt
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

from .data_access import *
from .models import User, Patient


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
    return render(request, 'pages/account/login.html')


def signup(request):
    return render(request, 'pages/account/signup.html')


class DashboardView(APIViewWrapper):
    def get(self, request):
        recent_count = 6
        all_patients_count = len(Patient.objects.all())
        patients_sorted = request.user.patients.all().order_by('join_date', )
        recent_patients = patients_sorted if patients_sorted.count() < recent_count else patients_sorted[:recent_count]
        return render(request, 'pages/dashboard/index.html', {
            'user': request.user,
            'all_patients_count': all_patients_count,
            'recent_patients': recent_patients
        })


class PatientsView(APIViewWrapper):
    def get(self, request):
        recent_count = 6
        all_patients_count = len(Patient.objects.all())
        patients_sorted = request.user.patients.all().order_by('join_date', )
        recent_patients = patients_sorted if patients_sorted.count() < recent_count else patients_sorted[:recent_count]
        return render(request, 'pages/patients/index.html', {
            'user': request.user,
            'all_patients_count': all_patients_count,
            'recent_patients': recent_patients,
        })


class PatientCreateView(APIViewWrapper):
    def get(self, request):
        return render(request, 'pages/patients/modifications/create.html', {'user': request.user})

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
            join_date=datetime.datetime.now(),
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
        return render(request, 'pages/patients/modifications/edit.html', {'user': request.user, 'patient': patient})


class PatientDetailView(APIViewWrapper):
    def get(self, request, pk):
        patient = pk

        redis_key = f"{patient}:details"
        try:
            cached_data = redis_client.get(redis_key)
            if cached_data:
                return Response(json.loads(cached_data))
        except ConnectionError as error:
            print(f"Redis is unavailable! Message: {str(error)}")

        directory_path = os.path.join('datasets', 'patients', str(patient))
        files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
        record_path = str(os.path.join(directory_path, files[0].split(".")[0]))

        record = wfdb.rdrecord(record_path)
        ann = wfdb.rdann(record_path, 'atr')

        annotations_count = ann.ann_len
        record_length = int(round(record.sig_len / record.fs, 0))
        clock_frequency = record.fs

        for (i, note) in enumerate(ann.aux_note):
            if note != "":
                ann.symbol[i] = note.replace('\x00', '')
        annotations_symbols = list(set(ann.symbol))
        annotations = {}
        for sym in annotations_symbols:
            annotations[sym] = [i for (i, n) in enumerate(ann.symbol) if n == sym]
        for i, an in enumerate(annotations):
            annotations[an] = len(annotations[an])
        annotations = sorted(annotations.items(), key=lambda x: x[1], reverse=True)
        signals = {}
        for i, sig in enumerate(record.sig_name):
            signals[sig] = (f"{record.samps_per_frame[i]} tick per sample; "
                            f"{record.adc_gain[i]} adu/mV; "
                            f"{record.adc_res[i]}-bit ADC, zero at {record.adc_zero[i]}; "
                            f"baseline is {record.baseline[i]}")
        notes = record.comments
        patient_obj = Patient.objects.get(id=patient)

        response = {
            'first_name': patient_obj.first_name,
            'last_name': patient_obj.last_name,
            'gender': patient_obj.gender,
            'age': patient_obj.age,
            'pulse_details': {
                'record_length': record_length,
                'clock_frequency': clock_frequency,
                'all_annotations': annotations_count,
                'annotations': annotations,
                'signals': signals,
                'notes': notes,
            },
        }

        try:
            redis_client.set(redis_key, json.dumps(response))
        except ConnectionError as error:
            print(f"Redis is unavailable! Message: {str(error)}")
        return Response(response)

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

        prefix = f"{pk}"
        remove_keys_with_prefix(redis_client, prefix)
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

        prefix = f"{patient}"
        remove_keys_with_prefix(redis_client, prefix)

        return Response({"message": "Deleted successfully!"})


class LogoutView(APIViewWrapper):
    def post(self, request):
        return render(request, 'pages/patients/index.html', {'user': request.user})


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

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user:
            User.objects.update_last_login(user, datetime.datetime.now())
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid credentials'}, status=400)


# class ECGView(APIViewWrapper):
#     def get(self, request):
#         base_rate = 1000
#
#         start = int(request.GET.get('start', 0))
#         length = int(request.GET.get('length', 5))
#         patient = str(request.GET.get('patient'))
#
#         # Generate a unique key based on request parameters
#         redis_key = f"{patient}:ecg:{start}:{length}:{base_rate}"
#
#         # Check if data exists in Redis
#         try:
#             cached_data = redis_client.get(redis_key)
#             if cached_data:
#                 return Response(json.loads(cached_data))
#         except ConnectionError as error:
#             print(f"Redis is unavailable! Message: {str(error)}")
#
#         directory_path = os.path.join('datasets', 'patients', str(patient))
#         files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
#         record_path = str(os.path.join(directory_path, files[0].split(".")[0]))
#
#         record = wfdb.rdrecord(record_path)
#         ann = wfdb.rdann(record_path, 'atr')
#
#         annotations_count = ann.ann_len
#         record_length = int(round(record.sig_len / record.fs, 0))
#         clock_frequency = record.fs
#
#         for (i, note) in enumerate(ann.aux_note):
#             if note != "":
#                 ann.symbol[i] = note.replace('\x00', '')
#         annotations_symbols = list(set(ann.symbol))
#         annotations = {}
#         for sym in annotations_symbols:
#             annotations[sym] = [i for (i, n) in enumerate(ann.symbol) if n == sym]
#         for i, an in enumerate(annotations):
#             annotations[an] = len(annotations[an])
#         annotations = sorted(annotations.items(), key=lambda x: x[1], reverse=True)
#         signals = {}
#         for i, sig in enumerate(record.sig_name):
#             signals[sig] = (f"{record.samps_per_frame[i]} tick per sample; "
#                             f"{record.adc_gain[i]} adu/mV; "
#                             f"{record.adc_res[i]}-bit ADC, zero at {record.adc_zero[i]}; "
#                             f"baseline is {record.baseline[i]}")
#         notes = record.comments
#
#         # Delineate the ECG signal
#         sig_start = start * clock_frequency
#         sig_end = (length + start) * clock_frequency
#         # if length > 5 else (5 + start) * clock_frequency
#         ecg_signal = record.p_signal[sig_start:sig_end, 0]
#
#         # rpeaks = {}
#         # waves_peak = {}
#         # try:
#         #     _, rpeaks = nk.ecg_peaks(ecg_signal, sampling_rate=record.fs)
#         #     _, waves_peak = nk.ecg_delineate(ecg_signal, rpeaks, sampling_rate=record.fs, method="peak")
#         # except Exception as e:
#         #     print(f"Error with patient {patient}, start: {start}, length: {length}: " + str(e))
#         #     waves_peak = {'ECG_P_Peaks': [], 'ECG_Q_Peaks': [], 'ECG_S_Peaks': [], 'ECG_T_Peaks': []}
#
#         # ecg_signal = ecg_signal[sig_start:(length + start) * clock_frequency
#         #                         :int((length + start) * clock_frequency / base_rate)
#         #                         if (length + start) * clock_frequency > base_rate else 1]
#
#         ecg_signal = record.p_signal[sig_start:sig_end:int((length + start) * clock_frequency / base_rate)
#         if (length + start) * clock_frequency > base_rate else 1, 0]
#
#         response = {
#             'ecg_data': ecg_signal,
#             # 'ECG_P_Peaks': [num - sig_start for num in waves_peak['ECG_P_Peaks'] if sig_start < num < sig_end] if
#             # waves_peak['ECG_P_Peaks'] else [],
#             # 'ECG_Q_Peaks': [num - sig_start for num in waves_peak['ECG_Q_Peaks'] if sig_start < num < sig_end] if
#             # waves_peak['ECG_Q_Peaks'] else [],
#             # 'ECG_R_Peaks': [num - sig_start for num in rpeaks['ECG_R_Peaks'] if sig_start < num < sig_end],
#             # 'ECG_S_Peaks': [num - sig_start for num in waves_peak['ECG_S_Peaks'] if sig_start < num < sig_end] if
#             # waves_peak['ECG_S_Peaks'] else [],
#             # 'ECG_T_Peaks': [num - sig_start for num in waves_peak['ECG_T_Peaks'] if sig_start < num < sig_end] if
#             # waves_peak['ECG_T_Peaks'] else [],
#             'record_length': record_length,
#             'clock_frequency': clock_frequency,
#             'all_annotations': annotations_count,
#             'annotations': annotations,
#             'signals': signals,
#             'notes': notes,
#             'patient': {
#                 'first_name': Patient.objects.get(id=patient).first_name,
#                 'last_name': Patient.objects.get(id=patient).last_name,
#                 'gender': Patient.objects.get(id=patient).gender,
#                 'age': Patient.objects.get(id=patient).age,
#             }
#         }
#
#         # Store the response data in Redis
#         try:
#             redis_client.set(redis_key, json.dumps(response, cls=NumpyEncoder))
#         except ConnectionError as error:
#             print(f"Redis is unavailable! Message: {str(error)}")
#         return Response(response)


class ECGView(APIViewWrapper):
    def get(self, request):
        start = int(request.GET.get('start', 0))
        length = int(request.GET.get('length', 5))
        patient = str(request.GET.get('patient'))

        # redis_key = f"{patient}:ecg:{start}:{length}:{base_rate}"
        #
        # # Check if data exists in Redis
        # try:
        #     cached_data = redis_client.get(redis_key)
        #     if cached_data:
        #         return Response(json.loads(cached_data))
        # except ConnectionError as error:
        #     print(f"Redis is unavailable! Message: {str(error)}")

        directory_path = os.path.join('datasets', 'patients', str(patient))
        files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
        record_path = str(os.path.join(directory_path, files[0].split(".")[0]))

        head = wfdb.rdheader(record_path)
        clock_frequency = head.fs
        sampfrom = start * clock_frequency
        sampto = (length + start) * clock_frequency

        try:
            record = wfdb.rdrecord(record_path, sampfrom=sampfrom, sampto=sampto, channels=[0])
        except ValueError as e:
            if 'sampfrom must be shorter than the signal length' in str(e):
                return Response({'error': 'sampfrom must be shorter than the signal length'},
                                status=status.HTTP_400_BAD_REQUEST)

        time_to_add = datetime.timedelta(seconds=start)

        ecg = [[int((record.get_elapsed_time(i) + time_to_add).total_seconds() * 1000), x[0]]
               for i, x in enumerate(record.p_signal)]

        response = {
            'ecg_data': ecg,
        }

        # Store the response data in Redis
        # try:
        #     redis_client.set(redis_key, json.dumps(response, cls=NumpyEncoder))
        # except ConnectionError as error:
        #     print(f"Redis is unavailable! Message: {str(error)}")
        return Response(response)
