export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer" | string;
  user: AuthUser;
}

export interface SessionData {
  token: string;
  user: AuthUser;
}

export interface CaracteristicaImportante {
  caracteristica: string;
  valor: number;
  impacto_shap?: number;
  impacto_coeficiente?: number;
}

export interface Interpretabilidad {
  descripcion: string;
  caracteristicas_top: CaracteristicaImportante[] | string;
  nota?: string;
}

export interface Resultado {
  usuario: string;
  resultado: string;
  probabilidad_resultado: number | string;
  probabilidades_detalladas:
    | {
        graduacion: number;
        abandono: number;
      }
    | string;
  interpretabilidad?: Interpretabilidad;
}

export interface FactorRiesgo {
  factor: string;
  impacto: string;
  descripcion: string;
}

export interface AnalisisFactores {
  usuario: string;
  prediccion: string;
  probabilidad_abandono: number;
  total_factores_riesgo: number;
  factores_riesgo: FactorRiesgo[];
  nivel_atencion: string;
}

export interface Recomendacion {
  tipo: string;
  prioridad: string;
  accion: string;
  descripcion: string;
}

export interface Recomendaciones {
  usuario: string;
  prediccion: string;
  probabilidad_abandono: number;
  total_recomendaciones: number;
  recomendaciones: Recomendacion[];
  resumen_factores: string;
}

export interface Estudiante {
  id_estudiante: string;
  Marital_status: number;
  Application_mode: number;
  Application_order: number;
  Course: number;
  Daytime_evening_attendance: number;
  Previous_qualification: number;
  Nacionality: number;
  Mothers_qualification: number;
  Fathers_qualification: number;
  Mothers_occupation: number;
  Fathers_occupation: number;
  Displaced: number;
  Educational_special_needs: number;
  Debtor: number;
  Tuition_fees_up_to_date: number;
  Gender: number;
  Scholarship_holder: number;
  Age_at_enrollment: number;
  International: number;
  Curricular_units_1st_sem_credited: number;
  Curricular_units_1st_sem_enrolled: number;
  Curricular_units_1st_sem_evaluations: number;
  Curricular_units_1st_sem_approved: number;
  Curricular_units_1st_sem_grade: number;
  Curricular_units_1st_sem_without_evaluations: number;
  Curricular_units_2nd_sem_credited: number;
  Curricular_units_2nd_sem_enrolled: number;
  Curricular_units_2nd_sem_evaluations: number;
  Curricular_units_2nd_sem_approved: number;
  Curricular_units_2nd_sem_grade: number;
  Curricular_units_2nd_sem_without_evaluations: number;
  Unemployment_rate: number;
  Inflation_rate: number;
  GDP: number;
  Depression_score: number;
  Anxiety_score: number;
}

export interface PrediccionLote {
  id_estudiante: string;
  resultado: string;
  probabilidad_abandono: number;
  probabilidad_graduacion: number;
}

export interface ResultadoLote {
  usuario: string;
  total_estudiantes: number;
  estudiantes_en_riesgo: number;
  porcentaje_riesgo: number;
  predicciones: PrediccionLote[];
}

export interface EstudianteRiesgo {
  id_estudiante: string;
  probabilidad_abandono: number;
  nivel_riesgo: string;
  carrera: number;
  beca: string;
  deudor: string;
}

export interface ResultadoRiesgo {
  usuario: string;
  umbral_riesgo: number;
  total_analizados: number;
  total_alto_riesgo: number;
  porcentaje_alto_riesgo: number;
  estudiantes_alto_riesgo: EstudianteRiesgo[];
}

export interface AnalisisCarrera {
  carrera: number;
  total_estudiantes: number;
  estudiantes_en_riesgo: number;
  estudiantes_graduados: number;
  porcentaje_riesgo: number;
  promedio_probabilidad_abandono: number;
}

export interface ResultadoCarrera {
  usuario: string;
  total_carreras: number;
  analisis_por_carrera: AnalisisCarrera[];
}

export interface EstadisticasGenerales {
  usuario: string;
  resumen_general: {
    total_estudiantes: number;
    estudiantes_en_riesgo: number;
    porcentaje_riesgo: number;
    promedio_probabilidad_abandono: number;
  };
  demografia: {
    edad_promedio: number;
    edad_minima: number;
    edad_maxima: number;
    hombres: number;
    mujeres: number;
    porcentaje_hombres: number;
    estudiantes_internacionales: number;
  };
  situacion_financiera: {
    con_beca: number;
    porcentaje_becados: number;
    deudores: number;
    porcentaje_deudores: number;
  };
  salud_mental: {
    promedio_depresion: number;
    promedio_ansiedad: number;
    estudiantes_depresion_alta: number;
    porcentaje_depresion_alta: number;
    estudiantes_ansiedad_alta: number;
    porcentaje_ansiedad_alta: number;
  };
}

export interface HistorialPrediccion {
  id: number;
  usuario_id: number | null;
  usuario_username: string | null;
  estudiante_id: string | null;
  endpoint: string;
  prediccion: number;
  resultado: string;
  probabilidad_abandono: number | null;
  probabilidad_graduacion: number | null;
  features: Record<string, unknown>;
  fecha: string | null;
}

export interface HistorialResponse {
  usuario: string;
  total: number;
  limit: number;
  offset: number;
  predicciones: HistorialPrediccion[];
}
