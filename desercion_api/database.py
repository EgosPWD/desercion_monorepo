import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "desercion_db")
DB_USER = os.getenv("DB_USER", "desercion_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "desercion_password")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)


class Prediccion(Base):
    __tablename__ = "predicciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, nullable=True, index=True)
    usuario_username = Column(String, nullable=True, index=True)
    estudiante_id = Column(String, nullable=True)
    endpoint = Column(String, nullable=False)
    prediccion = Column(Integer, nullable=False)
    resultado = Column(String, nullable=False)
    probabilidad_abandono = Column(Float, nullable=True)
    probabilidad_graduacion = Column(Float, nullable=True)
    features_json = Column(JSON, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)


def migrate_schema():
    """Aplica migraciones simples para tablas existentes sin usar Alembic."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE predicciones
                ADD COLUMN IF NOT EXISTS usuario_id INTEGER
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE predicciones
                ADD COLUMN IF NOT EXISTS usuario_username VARCHAR
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_predicciones_usuario_id
                ON predicciones (usuario_id)
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_predicciones_usuario_username
                ON predicciones (usuario_username)
                """
            )
        )


def init_db():
    """Crea las tablas si no existen y aplica migraciones básicas."""
    Base.metadata.create_all(bind=engine)
    migrate_schema()


def get_db():
    """Context manager para sesiones de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
