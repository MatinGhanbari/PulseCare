# Stage 1: Build the application
FROM python:3.9-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --user -r requirements.txt

COPY . .

# Stage 2: Create the final image
FROM python:3.9-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app .

ENV PATH=/root/.local/bin:$PATH

WORKDIR src/backend
# Run migrations on container startup
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]