import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from database import Prediccion, SessionLocal, Usuario, get_db, init_db
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

# --- Configuración de entorno ---
API_PORT = int(os.getenv("PORT", "8182"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

# --- Configuración JWT ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cambia-esta-clave-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(
    db: Session, username_or_email: str, password: str
) -> Optional[Usuario]:
    user = (
        db.query(Usuario)
        .filter(
            (Usuario.username == username_or_email)
            | (Usuario.email == username_or_email)
        )
        .first()
    )
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
        if user is None:
            raise credentials_exception
        return user
    except (JWTError, ValueError):
        raise credentials_exception


# --- Mapeo de nombres: API (snake_case) → Entrenamiento (con espacios/símbolos) ---
COLUMN_MAPPING = {
    "Marital_status": "Marital status",
    "Application_mode": "Application mode",
    "Application_order": "Application order",
    "Course": "Course",
    "Daytime_evening_attendance": "Daytime/evening attendance",
    "Previous_qualification": "Previous qualification",
    "Nacionality": "Nacionality",
    "Mothers_qualification": "Mother's qualification",
    "Fathers_qualification": "Father's qualification",
    "Mothers_occupation": "Mother's occupation",
    "Fathers_occupation": "Father's occupation",
    "Displaced": "Displaced",
    "Educational_special_needs": "Educational special needs",
    "Debtor": "Debtor",
    "Tuition_fees_up_to_date": "Tuition fees up to date",
    "Gender": "Gender",
    "Scholarship_holder": "Scholarship holder",
    "Age_at_enrollment": "Age at enrollment",
    "International": "International",
    "Curricular_units_1st_sem_credited": "Curricular units 1st sem (credited)",
    "Curricular_units_1st_sem_enrolled": "Curricular units 1st sem (enrolled)",
    "Curricular_units_1st_sem_evaluations": "Curricular units 1st sem (evaluations)",
    "Curricular_units_1st_sem_approved": "Curricular units 1st sem (approved)",
    "Curricular_units_1st_sem_grade": "Curricular units 1st sem (grade)",
    "Curricular_units_1st_sem_without_evaluations": "Curricular units 1st sem (without evaluations)",
    "Curricular_units_2nd_sem_credited": "Curricular units 2nd sem (credited)",
    "Curricular_units_2nd_sem_enrolled": "Curricular units 2nd sem (enrolled)",
    "Curricular_units_2nd_sem_evaluations": "Curricular units 2nd sem (evaluations)",
    "Curricular_units_2nd_sem_approved": "Curricular units 2nd sem (approved)",
    "Curricular_units_2nd_sem_grade": "Curricular units 2nd sem (grade)",
    "Curricular_units_2nd_sem_without_evaluations": "Curricular units 2nd sem (without evaluations)",
    "Unemployment_rate": "Unemployment rate",
    "Inflation_rate": "Inflation rate",
    "GDP": "GDP",
    "Depression_score": "Depression_score",
    "Anxiety_score": "Anxiety_score",
}

EXPECTED_COLUMN_ORDER = list(COLUMN_MAPPING.values())

# Carga del modelo y scaler
modelo = None
scaler = None
explainer = None

model_path = "modelo/modelo_entrenado.pkl"
scaler_path = "modelo/scaler.pkl"

if not os.path.exists(model_path):
    raise RuntimeError(f"Archivo no encontrado: {model_path}")
if not os.path.exists(scaler_path):
    raise RuntimeError(f"Archivo no encontrado: {scaler_path}")

try:
    modelo = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    print("✅ Modelo y scaler cargados correctamente.")

    try:
        init_db()
        print("✅ Base de datos inicializada correctamente.")
    except Exception as e_db:
        print(f"⚠️ No se pudo inicializar la base de datos: {e_db}")

    try:
        explainer = shap.LinearExplainer(
            modelo,
            masker=shap.maskers.Independent(
                data=np.zeros((1, len(EXPECTED_COLUMN_ORDER)))
            ),
        )
        print("✅ Explainer SHAP (Linear) inicializado correctamente.")
    except Exception as e_shap:
        print(f"⚠️ LinearExplainer no disponible: {e_shap}")
        explainer = None

except Exception as e:
    raise RuntimeError(f"Error al cargar modelo o scaler: {e}")

app = FastAPI(title="API de Predicción de Deserción Universitaria")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# --- Modelos de autenticación ---
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


# --- Modelos de entrada ---
class DatosEntrada(BaseModel):
    Marital_status: int
    Application_mode: int
    Application_order: int
    Course: int
    Daytime_evening_attendance: int
    Previous_qualification: int
    Nacionality: int
    Mothers_qualification: int
    Fathers_qualification: int
    Mothers_occupation: int
    Fathers_occupation: int
    Displaced: int
    Educational_special_needs: int
    Debtor: int
    Tuition_fees_up_to_date: int
    Gender: int
    Scholarship_holder: int
    Age_at_enrollment: int
    International: int
    Curricular_units_1st_sem_credited: int
    Curricular_units_1st_sem_enrolled: int
    Curricular_units_1st_sem_evaluations: int
    Curricular_units_1st_sem_approved: int
    Curricular_units_1st_sem_grade: float
    Curricular_units_1st_sem_without_evaluations: int
    Curricular_units_2nd_sem_credited: int
    Curricular_units_2nd_sem_enrolled: int
    Curricular_units_2nd_sem_evaluations: int
    Curricular_units_2nd_sem_approved: int
    Curricular_units_2nd_sem_grade: float
    Curricular_units_2nd_sem_without_evaluations: int
    Unemployment_rate: float
    Inflation_rate: float
    GDP: float
    Depression_score: float
    Anxiety_score: float


class EstudianteConID(DatosEntrada):
    id_estudiante: str


class LoteEstudiantes(BaseModel):
    estudiantes: List[EstudianteConID]


# --- Funciones auxiliares ---
def procesar_prediccion_individual(
    datos_dict: Dict[str, Any],
) -> Dict[str, Optional[float] | int | str]:
    df_entrada = pd.DataFrame([datos_dict])
    df_entrada = df_entrada.rename(columns=COLUMN_MAPPING)
    df_entrada = df_entrada[EXPECTED_COLUMN_ORDER]

    X_scaled = scaler.transform(df_entrada)
    pred = int(modelo.predict(X_scaled)[0])
    resultado = "Se gradúa" if pred == 0 else "Abandona"

    probabilidad_resultado = None
    probas = None
    if hasattr(modelo, "predict_proba"):
        probas = modelo.predict_proba(X_scaled)[0]
        probabilidad_resultado = round(probas[pred], 3)

    return {
        "prediccion": pred,
        "resultado": resultado,
        "probabilidad_resultado": probabilidad_resultado,
        "probabilidad_graduacion": round(probas[0], 3) if probas is not None else None,
        "probabilidad_abandono": round(probas[1], 3) if probas is not None else None,
    }


def analizar_factores_individuales(
    datos_dict: Dict[str, Any], prediccion: Dict[str, Any]
) -> List[Dict[str, Any]]:
    factores_riesgo = []

    depression_score = datos_dict.get("Depression_score", 0)
    anxiety_score = datos_dict.get("Anxiety_score", 0)

    if depression_score >= 7:
        factores_riesgo.append(
            {
                "factor": "Depresión alta",
                "impacto": "Crítico",
                "descripcion": f"Puntuación de depresión: {depression_score:.2f}/10",
            }
        )
    elif depression_score >= 5:
        factores_riesgo.append(
            {
                "factor": "Depresión moderada",
                "impacto": "Alto",
                "descripcion": f"Puntuación de depresión: {depression_score:.2f}/10",
            }
        )

    if anxiety_score >= 7:
        factores_riesgo.append(
            {
                "factor": "Ansiedad alta",
                "impacto": "Crítico",
                "descripcion": f"Puntuación de ansiedad: {anxiety_score:.2f}/10",
            }
        )
    elif anxiety_score >= 5:
        factores_riesgo.append(
            {
                "factor": "Ansiedad moderada",
                "impacto": "Alto",
                "descripcion": f"Puntuación de ansiedad: {anxiety_score:.2f}/10",
            }
        )

    if datos_dict.get("Debtor", 0) == 1:
        factores_riesgo.append(
            {
                "factor": "Deudor",
                "impacto": "Alto",
                "descripcion": "Estudiante con deudas pendientes",
            }
        )

    if datos_dict.get("Tuition_fees_up_to_date", 1) == 0:
        factores_riesgo.append(
            {
                "factor": "Matrícula no al día",
                "impacto": "Crítico",
                "descripcion": "Presenta pagos de matrícula atrasados",
            }
        )

    if datos_dict.get("Scholarship_holder", 1) == 0:
        factores_riesgo.append(
            {
                "factor": "Sin beca",
                "impacto": "Medio",
                "descripcion": "No cuenta con apoyo económico por beca",
            }
        )

    sem1_approved = datos_dict.get("Curricular_units_1st_sem_approved", 0)
    sem1_enrolled = datos_dict.get("Curricular_units_1st_sem_enrolled", 1)
    sem2_approved = datos_dict.get("Curricular_units_2nd_sem_approved", 0)
    sem2_enrolled = datos_dict.get("Curricular_units_2nd_sem_enrolled", 1)
    sem1_grade = datos_dict.get("Curricular_units_1st_sem_grade", 0)
    sem2_grade = datos_dict.get("Curricular_units_2nd_sem_grade", 0)

    if sem1_enrolled > 0 and (sem1_approved / sem1_enrolled) < 0.5:
        factores_riesgo.append(
            {
                "factor": "Bajo rendimiento 1er semestre",
                "impacto": "Alto",
                "descripcion": f"Aprobó {sem1_approved} de {sem1_enrolled} unidades",
            }
        )

    if sem2_enrolled > 0 and (sem2_approved / sem2_enrolled) < 0.5:
        factores_riesgo.append(
            {
                "factor": "Bajo rendimiento 2do semestre",
                "impacto": "Crítico",
                "descripcion": f"Aprobó {sem2_approved} de {sem2_enrolled} unidades",
            }
        )

    if sem1_grade < 10:
        factores_riesgo.append(
            {
                "factor": "Promedio bajo 1er semestre",
                "impacto": "Alto",
                "descripcion": f"Promedio: {sem1_grade:.2f}",
            }
        )

    if sem2_grade < 10:
        factores_riesgo.append(
            {
                "factor": "Promedio bajo 2do semestre",
                "impacto": "Medio",
                "descripcion": f"Promedio: {sem2_grade:.2f}",
            }
        )

    edad = datos_dict.get("Age_at_enrollment", 18)
    if edad > 25:
        factores_riesgo.append(
            {
                "factor": "Edad avanzada",
                "impacto": "Bajo",
                "descripcion": f"Edad al inscribirse: {edad} años",
            }
        )

    return factores_riesgo


def guardar_prediccion_db(
    usuario: Usuario,
    estudiante_id: Optional[str],
    endpoint: str,
    prediccion: int,
    resultado: str,
    probabilidad_abandono: Optional[float],
    probabilidad_graduacion: Optional[float],
    features: Dict[str, Any],
):
    db: Optional[Session] = None
    try:
        db = SessionLocal()
        registro = Prediccion(
            usuario_id=usuario.id,
            usuario_username=usuario.username,
            estudiante_id=estudiante_id,
            endpoint=endpoint,
            prediccion=prediccion,
            resultado=resultado,
            probabilidad_abandono=float(probabilidad_abandono)
            if probabilidad_abandono is not None
            else None,
            probabilidad_graduacion=float(probabilidad_graduacion)
            if probabilidad_graduacion is not None
            else None,
            features_json=features,
            fecha=datetime.utcnow(),
        )
        db.add(registro)
        db.commit()
    except Exception as e:
        print(f"⚠️ Error al guardar predicción en DB: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass


# --- Endpoints de autenticación ---
@app.post("/auth/register")
def register_usuario(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = payload.username.strip()
    email = payload.email.strip().lower()

    if len(username) < 3:
        raise HTTPException(
            status_code=400, detail="El username debe tener al menos 3 caracteres"
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )

    existe_username = db.query(Usuario).filter(Usuario.username == username).first()
    if existe_username:
        raise HTTPException(status_code=400, detail="El username ya está registrado")

    existe_email = db.query(Usuario).filter(Usuario.email == email).first()
    if existe_email:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    nuevo_usuario = Usuario(
        username=username,
        email=email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    token = create_access_token({"sub": str(nuevo_usuario.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": nuevo_usuario.id,
            "username": nuevo_usuario.username,
            "email": nuevo_usuario.email,
        },
    }


@app.post("/auth/login")
def login_usuario(payload: LoginRequest, db: Session = Depends(get_db)):
    usuario = authenticate_user(db, payload.username_or_email.strip(), payload.password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(usuario.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": usuario.id,
            "username": usuario.username,
            "email": usuario.email,
        },
    }


@app.get("/auth/me")
def obtener_usuario_actual(usuario: Usuario = Depends(get_current_user)):
    return {
        "id": usuario.id,
        "username": usuario.username,
        "email": usuario.email,
    }


# --- Endpoints base ---
@app.get("/")
def inicio():
    return {
        "mensaje": "API de predicción de deserción universitaria",
        "version": "3.0",
        "endpoints_disponibles": {
            "auth": [
                "POST /auth/register - Registro de usuario",
                "POST /auth/login - Login con JWT",
                "GET /auth/me - Usuario autenticado",
            ],
            "prediccion": [
                "POST /predecir - Predicción individual",
                "POST /predecir/lote - Predicción masiva",
            ],
            "analisis": [
                "POST /analizar/riesgo - Estudiantes en riesgo alto",
                "POST /analizar/factores-riesgo - Factores de riesgo individuales",
                "POST /analizar/por-carrera - Análisis por carrera",
                "POST /estadisticas/general - Estadísticas generales",
            ],
            "recomendaciones": ["POST /recomendaciones - Sugerencias de intervención"],
            "historial": [
                "GET /historial - Historial del usuario autenticado",
            ],
            "sistema": ["GET /salud - Estado del sistema"],
        },
    }


@app.get("/salud")
def salud_sistema():
    return {
        "estado": "operativo",
        "modelo_cargado": modelo is not None,
        "scaler_cargado": scaler is not None,
        "caracteristicas_esperadas": len(EXPECTED_COLUMN_ORDER),
        "modelo_tipo": str(type(modelo).__name__) if modelo else "No cargado",
        "puerto_configurado": API_PORT,
        "cors_origins": CORS_ORIGINS,
    }


@app.post("/predecir")
def predecir(datos: DatosEntrada, usuario: Usuario = Depends(get_current_user)):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        df_entrada = pd.DataFrame([datos.dict()])
        df_entrada = df_entrada.rename(columns=COLUMN_MAPPING)
        df_entrada = df_entrada[EXPECTED_COLUMN_ORDER]
        X_scaled = scaler.transform(df_entrada)
        pred = int(modelo.predict(X_scaled)[0])
        resultado = "Se gradúa" if pred == 0 else "Abandona"

        probabilidad_resultado = None
        probas = None
        if hasattr(modelo, "predict_proba"):
            probas = modelo.predict_proba(X_scaled)[0]
            probabilidad_resultado = round(probas[pred], 3)

        caracteristicas_importantes = []
        try:
            if explainer is not None:
                shap_values = explainer.shap_values(X_scaled)
                if isinstance(shap_values, np.ndarray):
                    if shap_values.ndim == 1:
                        shap_vals = shap_values
                    else:
                        shap_vals = shap_values[0]
                else:
                    shap_vals = shap_values

                for i, col_name in enumerate(EXPECTED_COLUMN_ORDER):
                    caracteristicas_importantes.append(
                        {
                            "caracteristica": col_name,
                            "valor": float(df_entrada.iloc[0, i]),
                            "impacto_shap": float(shap_vals[i]),
                            "impacto_absoluto": abs(float(shap_vals[i])),
                        }
                    )

                caracteristicas_importantes.sort(
                    key=lambda x: x["impacto_absoluto"], reverse=True
                )
                caracteristicas_importantes = caracteristicas_importantes[:10]
                for item in caracteristicas_importantes:
                    del item["impacto_absoluto"]
            else:
                if hasattr(modelo, "coef_"):
                    coefs = modelo.coef_[0]
                    for i, col_name in enumerate(EXPECTED_COLUMN_ORDER):
                        contribucion = float(coefs[i] * X_scaled[0, i])
                        caracteristicas_importantes.append(
                            {
                                "caracteristica": col_name,
                                "valor": float(df_entrada.iloc[0, i]),
                                "impacto_coeficiente": contribucion,
                                "impacto_absoluto": abs(contribucion),
                            }
                        )
                    caracteristicas_importantes.sort(
                        key=lambda x: x["impacto_absoluto"], reverse=True
                    )
                    caracteristicas_importantes = caracteristicas_importantes[:10]
                    for item in caracteristicas_importantes:
                        del item["impacto_absoluto"]
        except Exception as e_shap:
            print(f"⚠️ Error al calcular interpretabilidad: {e_shap}")

        try:
            guardar_prediccion_db(
                usuario=usuario,
                estudiante_id=None,
                endpoint="/predecir",
                prediccion=pred,
                resultado=resultado,
                probabilidad_abandono=round(probas[1], 3)
                if probas is not None
                else None,
                probabilidad_graduacion=round(probas[0], 3)
                if probas is not None
                else None,
                features=datos.dict(),
            )
        except Exception:
            pass

        return {
            "usuario": usuario.username,
            "resultado": resultado,
            "probabilidad_resultado": probabilidad_resultado
            if probabilidad_resultado is not None
            else "No disponible",
            "probabilidades_detalladas": {
                "graduacion": round(probas[0], 3),
                "abandono": round(probas[1], 3),
            }
            if probas is not None
            else "No disponible",
            "interpretabilidad": {
                "descripcion": "Análisis de características que influyeron en la predicción usando SHAP (SHapley Additive exPlanations) para Regresión Logística",
                "caracteristicas_top": caracteristicas_importantes
                if caracteristicas_importantes
                else "No disponible",
                "nota": "Los valores muestran la contribución de cada característica. Un impacto positivo contribuye hacia 'Abandona', un impacto negativo contribuye hacia 'Se gradúa'",
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al procesar la predicción: {str(e)}"
        )


@app.post("/predecir/lote")
def predecir_lote(lote: LoteEstudiantes, usuario: Usuario = Depends(get_current_user)):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        resultados = []

        for estudiante in lote.estudiantes:
            datos_dict = estudiante.dict()
            id_estudiante = datos_dict.pop("id_estudiante")
            prediccion = procesar_prediccion_individual(datos_dict)

            resultados.append(
                {
                    "id_estudiante": id_estudiante,
                    "resultado": prediccion["resultado"],
                    "probabilidad_abandono": prediccion["probabilidad_abandono"],
                    "probabilidad_graduacion": prediccion["probabilidad_graduacion"],
                }
            )

        total = len(resultados)
        en_riesgo = sum(1 for r in resultados if r["resultado"] == "Abandona")

        db: Optional[Session] = None
        try:
            db = SessionLocal()
            registros = []
            for i, estudiante in enumerate(lote.estudiantes):
                datos_dict = estudiante.dict()
                id_estudiante = datos_dict.pop("id_estudiante")
                r = resultados[i]
                registros.append(
                    Prediccion(
                        usuario_id=usuario.id,
                        usuario_username=usuario.username,
                        estudiante_id=id_estudiante,
                        endpoint="/predecir/lote",
                        prediccion=0 if r["resultado"] == "Se gradúa" else 1,
                        resultado=r["resultado"],
                        probabilidad_abandono=float(r["probabilidad_abandono"])
                        if r["probabilidad_abandono"] is not None
                        else None,
                        probabilidad_graduacion=float(r["probabilidad_graduacion"])
                        if r["probabilidad_graduacion"] is not None
                        else None,
                        features_json=datos_dict,
                        fecha=datetime.utcnow(),
                    )
                )
            db.bulk_save_objects(registros)
            db.commit()
        except Exception as e:
            print(f"⚠️ Error al guardar lote en DB: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass

        return {
            "usuario": usuario.username,
            "total_estudiantes": total,
            "estudiantes_en_riesgo": en_riesgo,
            "porcentaje_riesgo": round((en_riesgo / total) * 100, 2)
            if total > 0
            else 0,
            "predicciones": resultados,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al procesar el lote: {str(e)}"
        )


@app.post("/analizar/riesgo")
def analizar_riesgo(
    lote: LoteEstudiantes,
    umbral_riesgo: float = 0.6,
    usuario: Usuario = Depends(get_current_user),
):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        estudiantes_alto_riesgo = []

        for estudiante in lote.estudiantes:
            datos_dict = estudiante.dict()
            id_estudiante = datos_dict.pop("id_estudiante")
            prediccion = procesar_prediccion_individual(datos_dict)

            if (
                prediccion["probabilidad_abandono"]
                and prediccion["probabilidad_abandono"] >= umbral_riesgo
            ):
                estudiantes_alto_riesgo.append(
                    {
                        "id_estudiante": id_estudiante,
                        "probabilidad_abandono": prediccion["probabilidad_abandono"],
                        "nivel_riesgo": "Crítico"
                        if prediccion["probabilidad_abandono"] >= 0.8
                        else "Alto",
                        "carrera": datos_dict.get("Course"),
                        "beca": "Sí"
                        if datos_dict.get("Scholarship_holder") == 1
                        else "No",
                        "deudor": "Sí" if datos_dict.get("Debtor") == 1 else "No",
                    }
                )

        estudiantes_alto_riesgo.sort(
            key=lambda x: x["probabilidad_abandono"], reverse=True
        )

        return {
            "usuario": usuario.username,
            "umbral_riesgo": umbral_riesgo,
            "total_analizados": len(lote.estudiantes),
            "total_alto_riesgo": len(estudiantes_alto_riesgo),
            "porcentaje_alto_riesgo": round(
                (len(estudiantes_alto_riesgo) / len(lote.estudiantes)) * 100, 2
            )
            if lote.estudiantes
            else 0,
            "estudiantes_alto_riesgo": estudiantes_alto_riesgo,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al analizar riesgo: {str(e)}"
        )


@app.post("/analizar/factores-riesgo")
def analizar_factores(
    datos: DatosEntrada, usuario: Usuario = Depends(get_current_user)
):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        datos_dict = datos.dict()
        prediccion = procesar_prediccion_individual(datos_dict)
        factores_riesgo = analizar_factores_individuales(datos_dict, prediccion)

        return {
            "usuario": usuario.username,
            "prediccion": prediccion["resultado"],
            "probabilidad_abandono": prediccion["probabilidad_abandono"],
            "total_factores_riesgo": len(factores_riesgo),
            "factores_riesgo": factores_riesgo,
            "nivel_atencion": (
                "Urgente"
                if prediccion["probabilidad_abandono"]
                and prediccion["probabilidad_abandono"] >= 0.8
                else "Alto"
                if prediccion["probabilidad_abandono"]
                and prediccion["probabilidad_abandono"] >= 0.6
                else "Moderado"
                if prediccion["probabilidad_abandono"]
                and prediccion["probabilidad_abandono"] >= 0.4
                else "Bajo"
            ),
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al analizar factores: {str(e)}"
        )


@app.post("/analizar/por-carrera")
def analizar_por_carrera(
    lote: LoteEstudiantes, usuario: Usuario = Depends(get_current_user)
):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        analisis_carreras = {}

        for estudiante in lote.estudiantes:
            datos_dict = estudiante.dict()
            datos_dict.pop("id_estudiante")
            carrera = datos_dict.get("Course")
            prediccion = procesar_prediccion_individual(datos_dict)

            if carrera not in analisis_carreras:
                analisis_carreras[carrera] = {
                    "total_estudiantes": 0,
                    "en_riesgo": 0,
                    "graduados": 0,
                    "promedio_prob_abandono": [],
                }

            analisis_carreras[carrera]["total_estudiantes"] += 1
            analisis_carreras[carrera]["promedio_prob_abandono"].append(
                prediccion["probabilidad_abandono"] or 0
            )

            if prediccion["resultado"] == "Abandona":
                analisis_carreras[carrera]["en_riesgo"] += 1
            else:
                analisis_carreras[carrera]["graduados"] += 1

        resultado_carreras = []
        for carrera, stats in analisis_carreras.items():
            total = stats["total_estudiantes"]
            resultado_carreras.append(
                {
                    "carrera": carrera,
                    "total_estudiantes": total,
                    "estudiantes_en_riesgo": stats["en_riesgo"],
                    "estudiantes_graduados": stats["graduados"],
                    "porcentaje_riesgo": round((stats["en_riesgo"] / total) * 100, 2)
                    if total > 0
                    else 0,
                    "promedio_probabilidad_abandono": round(
                        np.mean(stats["promedio_prob_abandono"]), 3
                    )
                    if stats["promedio_prob_abandono"]
                    else 0,
                }
            )

        resultado_carreras.sort(key=lambda x: x["porcentaje_riesgo"], reverse=True)

        return {
            "usuario": usuario.username,
            "total_carreras": len(resultado_carreras),
            "analisis_por_carrera": resultado_carreras,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al analizar por carrera: {str(e)}"
        )


@app.post("/estadisticas/general")
def estadisticas_generales(
    lote: LoteEstudiantes, usuario: Usuario = Depends(get_current_user)
):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        predicciones_riesgo = []
        edades = []
        con_beca = 0
        deudores = 0
        hombres = 0
        mujeres = 0
        internacionales = 0
        depression_scores = []
        anxiety_scores = []

        for estudiante in lote.estudiantes:
            datos_dict = estudiante.dict()
            datos_dict.pop("id_estudiante")

            prediccion = procesar_prediccion_individual(datos_dict)
            predicciones_riesgo.append(prediccion["probabilidad_abandono"] or 0)

            edades.append(datos_dict.get("Age_at_enrollment", 18))
            depression_scores.append(datos_dict.get("Depression_score", 0))
            anxiety_scores.append(datos_dict.get("Anxiety_score", 0))
            if datos_dict.get("Scholarship_holder") == 1:
                con_beca += 1
            if datos_dict.get("Debtor") == 1:
                deudores += 1
            if datos_dict.get("Gender") == 1:
                hombres += 1
            else:
                mujeres += 1
            if datos_dict.get("International") == 1:
                internacionales += 1

        total = len(lote.estudiantes)
        en_riesgo = sum(1 for p in predicciones_riesgo if p >= 0.5)
        depression_alta = sum(1 for d in depression_scores if d >= 7)
        anxiety_alta = sum(1 for a in anxiety_scores if a >= 7)

        return {
            "usuario": usuario.username,
            "resumen_general": {
                "total_estudiantes": total,
                "estudiantes_en_riesgo": en_riesgo,
                "porcentaje_riesgo": round((en_riesgo / total) * 100, 2)
                if total > 0
                else 0,
                "promedio_probabilidad_abandono": round(
                    np.mean(predicciones_riesgo), 3
                ),
            },
            "demografia": {
                "edad_promedio": round(np.mean(edades), 1) if edades else 0,
                "edad_minima": int(min(edades)) if edades else 0,
                "edad_maxima": int(max(edades)) if edades else 0,
                "hombres": hombres,
                "mujeres": mujeres,
                "porcentaje_hombres": round((hombres / total) * 100, 2)
                if total > 0
                else 0,
                "estudiantes_internacionales": internacionales,
            },
            "situacion_financiera": {
                "con_beca": con_beca,
                "porcentaje_becados": round((con_beca / total) * 100, 2)
                if total > 0
                else 0,
                "deudores": deudores,
                "porcentaje_deudores": round((deudores / total) * 100, 2)
                if total > 0
                else 0,
            },
            "salud_mental": {
                "promedio_depresion": round(np.mean(depression_scores), 2)
                if depression_scores
                else 0,
                "promedio_ansiedad": round(np.mean(anxiety_scores), 2)
                if anxiety_scores
                else 0,
                "estudiantes_depresion_alta": depression_alta,
                "porcentaje_depresion_alta": round((depression_alta / total) * 100, 2)
                if total > 0
                else 0,
                "estudiantes_ansiedad_alta": anxiety_alta,
                "porcentaje_ansiedad_alta": round((anxiety_alta / total) * 100, 2)
                if total > 0
                else 0,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al generar estadísticas: {str(e)}"
        )


@app.post("/recomendaciones")
def generar_recomendaciones(
    datos: DatosEntrada, usuario: Usuario = Depends(get_current_user)
):
    if modelo is None or scaler is None:
        raise HTTPException(status_code=500, detail="Modelo o scaler no disponibles.")

    try:
        datos_dict = datos.dict()
        prediccion = procesar_prediccion_individual(datos_dict)
        factores_riesgo = analizar_factores_individuales(datos_dict, prediccion)

        recomendaciones = []

        if datos_dict.get("Debtor") == 1:
            recomendaciones.append(
                {
                    "tipo": "Financiero",
                    "prioridad": "Alta",
                    "accion": "Gestionar plan de pagos",
                    "descripcion": "Coordinar con área financiera para establecer plan de pagos flexible",
                }
            )

        if (
            datos_dict.get("Scholarship_holder") == 0
            and prediccion["probabilidad_abandono"]
            and prediccion["probabilidad_abandono"] >= 0.6
        ):
            recomendaciones.append(
                {
                    "tipo": "Financiero",
                    "prioridad": "Alta",
                    "accion": "Evaluar elegibilidad para beca",
                    "descripcion": "Revisar si el estudiante califica para programas de becas o ayuda financiera",
                }
            )

        sem1_approved = datos_dict.get("Curricular_units_1st_sem_approved", 0)
        sem1_enrolled = datos_dict.get("Curricular_units_1st_sem_enrolled", 1)

        if sem1_enrolled > 0 and (sem1_approved / sem1_enrolled) < 0.5:
            recomendaciones.append(
                {
                    "tipo": "Académico",
                    "prioridad": "Alta",
                    "accion": "Tutoría académica",
                    "descripcion": "Asignar tutor académico para mejorar rendimiento en materias críticas",
                }
            )

        if datos_dict.get("Curricular_units_1st_sem_grade", 0) < 10:
            recomendaciones.append(
                {
                    "tipo": "Académico",
                    "prioridad": "Media",
                    "accion": "Talleres de técnicas de estudio",
                    "descripcion": "Inscribir en talleres de métodos de estudio y gestión del tiempo",
                }
            )

        if (
            prediccion["probabilidad_abandono"]
            and prediccion["probabilidad_abandono"] >= 0.7
        ):
            recomendaciones.append(
                {
                    "tipo": "Seguimiento",
                    "prioridad": "Alta",
                    "accion": "Reunión personal urgente",
                    "descripcion": "Agendar entrevista con consejero estudiantil para evaluar situación integral",
                }
            )

        depression_score = datos_dict.get("Depression_score", 0)
        anxiety_score = datos_dict.get("Anxiety_score", 0)

        if depression_score >= 7 or anxiety_score >= 7:
            recomendaciones.append(
                {
                    "tipo": "Salud Mental",
                    "prioridad": "Crítica",
                    "accion": "Atención psicológica inmediata",
                    "descripcion": "Referir urgentemente a servicios de apoyo psicológico de la universidad",
                }
            )
        elif depression_score >= 5 or anxiety_score >= 5:
            recomendaciones.append(
                {
                    "tipo": "Salud Mental",
                    "prioridad": "Alta",
                    "accion": "Evaluación psicológica",
                    "descripcion": "Agendar cita con servicios de bienestar estudiantil para evaluación",
                }
            )

        if datos_dict.get("Age_at_enrollment", 18) > 25:
            recomendaciones.append(
                {
                    "tipo": "Psicosocial",
                    "prioridad": "Media",
                    "accion": "Programa de estudiantes adultos",
                    "descripcion": "Incluir en programas especiales para estudiantes adultos con flexibilidad horaria",
                }
            )

        return {
            "usuario": usuario.username,
            "prediccion": prediccion["resultado"],
            "probabilidad_abandono": prediccion["probabilidad_abandono"],
            "total_recomendaciones": len(recomendaciones),
            "recomendaciones": recomendaciones,
            "resumen_factores": f"Se identificaron {len(factores_riesgo)} factores de riesgo",
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al generar recomendaciones: {str(e)}"
        )


@app.get("/historial")
def obtener_historial(
    estudiante_id: Optional[str] = Query(
        None, description="Filtrar por ID de estudiante"
    ),
    resultado: Optional[str] = Query(
        None, description="Filtrar por resultado (Abandona/Se gradúa)"
    ),
    limit: int = Query(
        50, ge=1, le=200, description="Cantidad de registros por página"
    ),
    offset: int = Query(0, ge=0, description="Desplazamiento de página"),
    usuario: Usuario = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        query = db.query(Prediccion).filter(Prediccion.usuario_id == usuario.id)

        if estudiante_id:
            query = query.filter(Prediccion.estudiante_id == estudiante_id)
        if resultado:
            query = query.filter(Prediccion.resultado == resultado)

        total = query.count()
        predicciones = (
            query.order_by(Prediccion.fecha.desc()).offset(offset).limit(limit).all()
        )

        return {
            "usuario": usuario.username,
            "total": total,
            "limit": limit,
            "offset": offset,
            "predicciones": [
                {
                    "id": p.id,
                    "usuario_id": p.usuario_id,
                    "usuario_username": p.usuario_username,
                    "estudiante_id": p.estudiante_id,
                    "endpoint": p.endpoint,
                    "prediccion": p.prediccion,
                    "resultado": p.resultado,
                    "probabilidad_abandono": p.probabilidad_abandono,
                    "probabilidad_graduacion": p.probabilidad_graduacion,
                    "features": p.features_json,
                    "fecha": p.fecha.isoformat() if p.fecha else None,
                }
                for p in predicciones
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error al obtener historial: {str(e)}"
        )
    finally:
        db.close()
