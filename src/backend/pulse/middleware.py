# middleware.py
from django.http import HttpResponse
from rest_framework.response import Response
from django.shortcuts import redirect
from django.urls import reverse


class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        public_urls = [
            reverse('login'),
            reverse('signup'),
        ]

        # if not request.session.get('username'):
        #     if request.path not in public_urls:
        #         return HttpResponse('Unauthorized', status=401)

        response = self.get_response(request)
        return response
