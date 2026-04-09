# API de Predicción de Deserción Universitaria

API REST desarrollada con FastAPI que predice el riesgo de deserción universitaria utilizando machine learning.

## Requisitos

- Python 3.13+
- PostgreSQL
- Docker (opcional)

## Instalación

```bash
# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (crear .env)
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

## Variables de Entorno (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=desercion_db
DB_USER=desercion_user
DB_PASSWORD=tu_contraseña
```

## Ejecución

### Desarrollo

```bash
uvicorn main:app --reload --port 8182
```

### Docker

```bash
docker build -t desercion-api .
docker run -p 8182:8182 --env-file .env desercion-api
```

## Autenticación

La API usa **HTTP Basic Auth**:

- Usuario: `admin`
- Contraseña: `12345`

## Endpoints

| Método | Endpoint                    | Descripción                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/`                         | Información de la API           |
| GET    | `/salud`                    | Estado del sistema              |
| POST   | `/predecir`                 | Predicción individual           |
| POST   | `/predecir/lote`            | Predicción masiva               |
| POST   | `/analizar/riesgo`          | Estudiantes en riesgo           |
| POST   | `/analizar/factores-riesgo` | Factores de riesgo individuales |
| POST   | `/analizar/por-carrera`     | Análisis por carrera            |
| POST   | `/estadisticas/general`     | Estadísticas generales          |
| POST   | `/recomendaciones`          | Recomendaciones de intervención |
| GET    | `/historial`                | Historial de predicciones       |

## Ejemplo de Uso

```bash
curl -u admin:12345 -X POST http://localhost:8182/predecir \
  -H "Content-Type: application/json" \
  -d '{
    "Marital_status": 1,
    "Application_mode": 1,
    "Course": 1,
    "Scholarship_holder": 1,
    "Depression_score": 3.5,
    "Anxiety_score": 2.0,
    "Curricular_units_1st_sem_approved": 5,
    "Curricular_units_1st_sem_enrolled": 6,
    "Curricular_units_2nd_sem_approved": 4,
    "Curricular_units_2nd_sem_enrolled": 6
  }'
```

## Características

- Predicción con probabilidades
- Análisis SHAP para interpretabilidad
- Identificación de factores de riesgo
- Recomendaciones personalizadas
- Historial de predicciones en PostgreSQL

## Puerto

El servidor corre en `http://localhost:8182`

