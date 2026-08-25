FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY . .
RUN chown -R nobody:nogroup /app
EXPOSE 8000
USER nobody
CMD ["python", "-m", "http.server", "8000", "--directory", "prototypes/sprint1"]