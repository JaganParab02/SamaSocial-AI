# Multi-stage Dockerfile for high-efficiency Python FastAPI container
FROM python:3.11-slim as builder

WORKDIR /app

# Install system utilities needed for compiling packages and document parsing (PyMuPDF / fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runner

WORKDIR /app

# Copy installed python dependencies from builder stage
COPY --from=builder /usr/local /usr/local

# Copy backend application source
COPY . .

# Set environment variables to optimize Python execution in container
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Run FastAPI server using uvicorn workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
