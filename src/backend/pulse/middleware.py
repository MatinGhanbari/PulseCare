# middleware.py

from rest_framework.response import Response
from django.shortcuts import redirect


class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated:
            return redirect("http://127.0.0.1:5500/src/frontend/pages/login.html")

        response = self.get_response(request)
        return response
