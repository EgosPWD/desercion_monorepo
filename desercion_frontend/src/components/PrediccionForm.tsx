import { useState } from "react";
import { variableDescriptions } from "../constants/variables";
import { apiFetch } from "../api/client";
import type { Resultado, AnalisisFactores, Recomendaciones } from "../types/api";
import PredictionResult from "./Results/PredictionResult";
import ShapInterpretability from "./Results/ShapInterpretability";
import RiskFactors from "./Results/RiskFactors";
import Recommendations from "./Results/Recommendations";
import "./PrediccionForm.css";

export default function PrediccionForm() {
  const [formData, setFormData] = useState({
    Marital_status: 1,
    Application_mode: 8,
    Application_order: 1,
    Course: 10,
    Daytime_evening_attendance: 1,
    Previous_qualification: 1,
    Nacionality: 1,
    Mothers_qualification: 13,
    Fathers_qualification: 10,
    Mothers_occupation: 6,
    Fathers_occupation: 10,
    Displaced: 0,
    Educational_special_needs: 0,
    Debtor: 0,
    Tuition_fees_up_to_date: 1,
    Gender: 0,
    Scholarship_holder: 1,
    Age_at_enrollment: 19,
    International: 0,
    Curricular_units_1st_sem_credited: 0,
    Curricular_units_1st_sem_enrolled: 6,
    Curricular_units_1st_sem_evaluations: 6,
    Curricular_units_1st_sem_approved: 6,
    Curricular_units_1st_sem_grade: 16.8,
    Curricular_units_1st_sem_without_evaluations: 0,
    Curricular_units_2nd_sem_credited: 0,
    Curricular_units_2nd_sem_enrolled: 6,
    Curricular_units_2nd_sem_evaluations: 6,
    Curricular_units_2nd_sem_approved: 6,
    Curricular_units_2nd_sem_grade: 17.2,
    Curricular_units_2nd_sem_without_evaluations: 0,
    Unemployment_rate: 8.5,
    Inflation_rate: 1.2,
    GDP: 12.0,
    Depression_score: 0,
    Anxiety_score: 0,
  });

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [analisisFactores, setAnalisisFactores] = useState<AnalisisFactores | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendaciones | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value === "" ? "" : Number(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setResultado(null);
    setAnalisisFactores(null);
    setRecomendaciones(null);

    try {
      const dataPrediccion = await apiFetch<Resultado>("/predecir", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setResultado(dataPrediccion);

      const dataFactores = await apiFetch<AnalisisFactores>("/analizar/factores-riesgo", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setAnalisisFactores(dataFactores);

      const dataRecomendaciones = await apiFetch<Recomendaciones>("/recomendaciones", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setRecomendaciones(dataRecomendaciones);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">

      {/* ── Page Header ── */}
      <div className="form-page-header">
        <span className="form-mode-tag">[ ANALYSIS_MODE_ACTIVE ]</span>
        <h1 className="form-page-title">Análisis Individual</h1>
      </div>

      {/* ── Info Section ── */}
      <div className="form-section section-info">
        <div className="info-cards">
          <div className="info-card">
            <span className="info-card-label critical">Críticas</span>
            <p className="info-card-text">
              Variables de rendimiento académico inmediato con alto peso estadístico en la deserción.
            </p>
          </div>
          <div className="info-card">
            <span className="info-card-label important">Importantes</span>
            <p className="info-card-text">
              Factores demográficos y financieros que influyen en la estabilidad del estudiante.
            </p>
          </div>
          <div className="info-card">
            <span className="info-card-label macro">Macroeconómicas</span>
            <p className="info-card-text">
              Factores externos del entorno económico que afectan la capacidad de permanencia.
            </p>
          </div>
        </div>
        <p className="info-note">
          Pasá el cursor sobre cada campo para ver su descripción detallada.
        </p>
      </div>

      {/* ── Variables Críticas ── */}
      <div className="form-section section-critical">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">Variables Críticas</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">Unidades Aprobadas 2do Semestre</span>
            <span className="form-description">
              {variableDescriptions.Curricular_units_2nd_sem_approved}
            </span>
            <input
              type="number"
              name="Curricular_units_2nd_sem_approved"
              value={formData.Curricular_units_2nd_sem_approved}
              onChange={handleChange}
              min={0}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Nota Promedio 2do Semestre (0-20)</span>
            <span className="form-description">
              {variableDescriptions.Curricular_units_2nd_sem_grade}
            </span>
            <input
              type="number"
              step="0.01"
              name="Curricular_units_2nd_sem_grade"
              value={formData.Curricular_units_2nd_sem_grade}
              onChange={handleChange}
              min={0}
              max={20}
              placeholder="Ejemplo: 16.75"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Unidades Aprobadas 1er Semestre</span>
            <span className="form-description">
              {variableDescriptions.Curricular_units_1st_sem_approved}
            </span>
            <input
              type="number"
              name="Curricular_units_1st_sem_approved"
              value={formData.Curricular_units_1st_sem_approved}
              onChange={handleChange}
              min={0}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Nota Promedio 1er Semestre (0-20)</span>
            <span className="form-description">
              {variableDescriptions.Curricular_units_1st_sem_grade}
            </span>
            <input
              type="number"
              step="0.01"
              name="Curricular_units_1st_sem_grade"
              value={formData.Curricular_units_1st_sem_grade}
              onChange={handleChange}
              min={0}
              max={20}
              placeholder="Ejemplo: 15.25"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Matrícula al Día</span>
            <span className="form-description">
              {variableDescriptions.Tuition_fees_up_to_date}
            </span>
            <select
              name="Tuition_fees_up_to_date"
              value={formData.Tuition_fees_up_to_date}
              onChange={handleChange}
              className="form-select"
            >
              <option value={1}>Sí</option>
              <option value={0}>No</option>
            </select>
          </div>

          <div className="form-field">
            <span className="form-label">Becario</span>
            <span className="form-description">
              {variableDescriptions.Scholarship_holder}
            </span>
            <select
              name="Scholarship_holder"
              value={formData.Scholarship_holder}
              onChange={handleChange}
              className="form-select"
            >
              <option value={1}>Sí</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Variables Importantes ── */}
      <div className="form-section section-important">
        <div className="section-header">
          <span className="section-number">02</span>
          <h2 className="section-title">Variables Importantes</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">Edad al Inscribirse</span>
            <span className="form-description">
              {variableDescriptions.Age_at_enrollment}
            </span>
            <input
              type="number"
              name="Age_at_enrollment"
              value={formData.Age_at_enrollment}
              onChange={handleChange}
              min={17}
              max={70}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Deudor</span>
            <span className="form-description">
              {variableDescriptions.Debtor}
            </span>
            <select
              name="Debtor"
              value={formData.Debtor}
              onChange={handleChange}
              className="form-select"
            >
              <option value={0}>No</option>
              <option value={1}>Sí</option>
            </select>
          </div>

          <div className="form-field">
            <span className="form-label">Género</span>
            <span className="form-description">
              {variableDescriptions.Gender}
            </span>
            <select
              name="Gender"
              value={formData.Gender}
              onChange={handleChange}
              className="form-select"
            >
              <option value={0}>Femenino</option>
              <option value={1}>Masculino</option>
            </select>
          </div>

          <div className="form-field">
            <span className="form-label">Modo de Aplicación</span>
            <span className="form-description">
              {variableDescriptions.Application_mode}
            </span>
            <input
              type="number"
              name="Application_mode"
              value={formData.Application_mode}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* ── Variables Macroeconómicas ── */}
      <div className="form-section section-macroeconomic">
        <div className="section-header">
          <span className="section-number">03</span>
          <h2 className="section-title">Variables Macroeconómicas</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">Tasa de Desempleo (%)</span>
            <span className="form-description">
              {variableDescriptions.Unemployment_rate}
            </span>
            <input
              type="number"
              step="0.1"
              name="Unemployment_rate"
              value={formData.Unemployment_rate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">Tasa de Inflación (%)</span>
            <span className="form-description">
              {variableDescriptions.Inflation_rate}
            </span>
            <input
              type="number"
              step="0.1"
              name="Inflation_rate"
              value={formData.Inflation_rate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <span className="form-label">PIB</span>
            <span className="form-description">
              {variableDescriptions.GDP}
            </span>
            <input
              type="number"
              step="0.1"
              name="GDP"
              value={formData.GDP}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* ── Variables de Salud Mental ── */}
      <div className="form-section section-critical">
        <div className="section-header">
          <span className="section-number">04</span>
          <h2 className="section-title">Variables de Salud Mental</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">Puntuación de Depresión (0-10)</span>
            <span className="form-description">
              {variableDescriptions.Depression_score}
            </span>
            <input
              type="number"
              step="0.1"
              name="Depression_score"
              value={formData.Depression_score}
              onChange={handleChange}
              min={0}
              max={10}
              placeholder="Ejemplo: 3.5"
              className="form-input"
            />
            <small className="field-hint">
              0 = Sin síntomas · 5-7 = Moderado · 7+ = Severo
            </small>
          </div>

          <div className="form-field">
            <span className="form-label">Puntuación de Ansiedad (0-10)</span>
            <span className="form-description">
              {variableDescriptions.Anxiety_score}
            </span>
            <input
              type="number"
              step="0.1"
              name="Anxiety_score"
              value={formData.Anxiety_score}
              onChange={handleChange}
              min={0}
              max={10}
              placeholder="Ejemplo: 4.2"
              className="form-input"
            />
            <small className="field-hint">
              0 = Sin síntomas · 5-7 = Moderado · 7+ = Severo
            </small>
          </div>
        </div>
      </div>

      <button type="submit" disabled={cargando} className="submit-button">
        {cargando ? "Analizando..." : "Generar Predicción"}
      </button>

      {error && (
        <div className="error-container">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
      )}

      {resultado && <PredictionResult resultado={resultado} />}

      {resultado && resultado.interpretabilidad && (
        <ShapInterpretability interpretabilidad={resultado.interpretabilidad} />
      )}

      {analisisFactores && <RiskFactors analisisFactores={analisisFactores} />}

      {recomendaciones && recomendaciones.recomendaciones.length > 0 && (
        <Recommendations recomendaciones={recomendaciones} />
      )}
    </form>
  );
}
