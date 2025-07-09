# Dockerfile para PostgreSQL 17 con pgvector
FROM postgres:17

# Instalar dependencias necesarias para compilar pgvector
RUN apt-get update && apt-get install -y \
  postgresql-server-dev-17 \
  make \
  gcc \
  git \
  curl && \
  # Clonar pgvector y compilarlo
  git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git && \
  cd pgvector && \
  make && make install && \
  cd .. && rm -rf pgvector && \
  # Limpieza (opcional)
  apt-get remove --purge -y git gcc curl make && \
  apt-get autoremove -y && apt-get clean

EXPOSE 5432
