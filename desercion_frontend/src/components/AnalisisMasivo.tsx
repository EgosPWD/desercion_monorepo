import { useState } from "react";
import { getIconSvg } from "../assets/svg";
import { apiFetch } from "../api/client";
import type { Estudiante, ResultadoLote, ResultadoRiesgo, ResultadoCarrera, EstadisticasGenerales, EstudianteRiesgo, AnalisisCarrera } from "../types/api";
import "./AnalisisMasivo.css";

const UMBRAL_RIESGO = 0.6;

export default function AnalisisMasivo() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [resultadoLote, setResultadoLote] = useState<ResultadoLote | null>(null);
  const [resultadoRiesgo, setResultadoRiesgo] = useState<ResultadoRiesgo | null>(null);
  const [resultadoCarrera, setResultadoCarrera] = useState<ResultadoCarrera | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      setError("Error al leer el archivo");
    };

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());

        const estudiantesData: Estudiante[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",");
          const estudiante: any = {};

          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (header === "id_estudiante") {
              estudiante[header] = value;
            } else {
              estudiante[header] = parseFloat(value) || 0;
            }
          });

          estudiantesData.push(estudiante as Estudiante);
        }

        setEstudiantes(estudiantesData);
        setError(null);
      } catch (err: any) {
        setError("Error al procesar el archivo CSV: " + err.message);
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];

    if (file && file.name.endsWith('.csv')) {
      const event = {
        target: {
          files: [file]
        }
      } as any;
      handleFileUpload(event);
    } else {
      setError("Por favor, suelta un archivo CSV");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const analizarLote = async () => {
    if (estudiantes.length === 0) {
      setError("Primero carga un archivo CSV con estudiantes");
      return;
    }

    setCargando(true);
    setError(null);
    setResultadoLote(null);
    setResultadoRiesgo(null);
    setResultadoCarrera(null);
    setEstadisticas(null);

    try {
      const dataLote = await apiFetch<ResultadoLote>("/predecir/lote", {
        method: "POST",
        body: JSON.stringify({ estudiantes }),
      });
      setResultadoLote(dataLote);

      const dataRiesgo = await apiFetch<ResultadoRiesgo>(
        `/analizar/riesgo?umbral_riesgo=${UMBRAL_RIESGO}`,
        {
          method: "POST",
          body: JSON.stringify({ estudiantes }),
        }
      );
      setResultadoRiesgo(dataRiesgo);

      const dataCarrera = await apiFetch<ResultadoCarrera>("/analizar/por-carrera", {
        method: "POST",
        body: JSON.stringify({ estudiantes }),
      });
      setResultadoCarrera(dataCarrera);

      const dataEstadisticas = await apiFetch<EstadisticasGenerales>("/estadisticas/general", {
        method: "POST",
        body: JSON.stringify({ estudiantes }),
      });
      setEstadisticas(dataEstadisticas);
    } catch (err: any) {
      setError("Error al analizar: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="masivo-container">
      <div className="masivo-page-header">
        <span className="masivo-task-tag">[ TASK_ID: BATCH_ANALYSIS_01 ]</span>
        <h1 className="masivo-title">Análisis Masivo</h1>
        <p className="masivo-description">
          Ejecutá modelos predictivos sobre conjuntos de datos estudiantiles completos para identificar patrones de deserción a nivel institucional.
        </p>
      </div>

      <div className="upload-section">
        <h2 className="section-title">Cargar Datos</h2>
        <div className="upload-card">
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              id="csv-upload"
              style={{ display: 'none' }}
            />

            <div className="drop-zone-content">
              <div className="drop-zone-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('upload') }} />
              <p className="drop-zone-title">Arrastra tu archivo CSV aquí</p>
              <p className="drop-zone-subtitle">o</p>
              <button
                onClick={() => {
                  const input = document.getElementById('csv-upload') as HTMLInputElement;
                  if (input) {
                    input.click();
                  }
                }}
                className="file-button"
                type="button"
              >
                Seleccionar archivo
              </button>
              <p className="drop-zone-help">Formato: CSV (máx. 10MB)</p>
            </div>
          </div>

          {estudiantes.length > 0 && (
            <div className="file-info">
              <p className="file-count">
                <span className="check-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('check-circle') }} />
                {estudiantes.length} estudiantes cargados
              </p>
            </div>
          )}

          <div className="upload-instructions">
            <h4>Formato del CSV:</h4>
            <p>El archivo debe incluir las siguientes columnas:</p>
            <code className="csv-example">
              id_estudiante,Marital_status,Application_mode,Course,...
            </code>
            <p className="note">
              Primera fila: nombres de columnas. Siguientes filas: datos de estudiantes.
            </p>
            <a
              href="/ejemplo_estudiantes.csv"
              download="ejemplo_estudiantes.csv"
              className="download-example"
            >
              <span dangerouslySetInnerHTML={{ __html: getIconSvg('download') }} />
              Descargar CSV de ejemplo
            </a>
          </div>
        </div>
      </div>

      <button
        onClick={analizarLote}
        disabled={cargando || estudiantes.length === 0}
        className="analyze-button"
      >
        {cargando ? "Analizando..." : "Analizar Estudiantes"}
      </button>

      {error && (
        <div className="error-container">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
      )}

      {resultadoLote && estadisticas && (
        <div className="results-section">
          <h2 className="section-title">Resumen General</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{resultadoLote.total_estudiantes}</div>
              <div className="stat-label">Total Estudiantes</div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-value">{resultadoLote.estudiantes_en_riesgo}</div>
              <div className="stat-label">En Riesgo de Deserción</div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-value">{resultadoLote.porcentaje_riesgo}%</div>
              <div className="stat-label">% Riesgo</div>
            </div>
            {estadisticas.salud_mental && (
              <>
                <div className="stat-card stat-mental">
                  <div className="stat-value">{estadisticas.salud_mental.estudiantes_depresion_alta || 0}</div>
                  <div className="stat-label">Con Depresión Alta</div>
                </div>
                <div className="stat-card stat-mental">
                  <div className="stat-value">{estadisticas.salud_mental.estudiantes_ansiedad_alta || 0}</div>
                  <div className="stat-label">Con Ansiedad Alta</div>
                </div>
              </>
            )}
          </div>

          {estadisticas.salud_mental && (estadisticas.salud_mental.estudiantes_depresion_alta > 0 || estadisticas.salud_mental.estudiantes_ansiedad_alta > 0) && (
            <div className="mental-health-alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>Alerta de Salud Mental:</strong>
                {estadisticas.salud_mental.estudiantes_depresion_alta > 0 && (
                  <span> {estadisticas.salud_mental.estudiantes_depresion_alta} estudiante(s) con depresión alta ({estadisticas.salud_mental.porcentaje_depresion_alta}%)</span>
                )}
                {estadisticas.salud_mental.estudiantes_depresion_alta > 0 && estadisticas.salud_mental.estudiantes_ansiedad_alta > 0 && <span> | </span>}
                {estadisticas.salud_mental.estudiantes_ansiedad_alta > 0 && (
                  <span> {estadisticas.salud_mental.estudiantes_ansiedad_alta} estudiante(s) con ansiedad alta ({estadisticas.salud_mental.porcentaje_ansiedad_alta}%)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {resultadoRiesgo && resultadoRiesgo.estudiantes_alto_riesgo.length > 0 && (
        <div className="risk-section">
          <h2 className="section-title">
            Estudiantes de Alto Riesgo ({resultadoRiesgo.total_alto_riesgo})
          </h2>
          <div className="table-container">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>ID Estudiante</th>
                  <th>Nivel</th>
                  <th>Prob. Abandono</th>
                  <th>Carrera</th>
                  <th>Beca</th>
                  <th>Deudor</th>
                  <th>Depresión</th>
                  <th>Ansiedad</th>
                </tr>
              </thead>
              <tbody>
                {resultadoRiesgo.estudiantes_alto_riesgo.map((est: EstudianteRiesgo, index: number) => {
                  const estudiante = estudiantes.find(e => e.id_estudiante === est.id_estudiante);
                  const depresion = estudiante?.Depression_score || 0;
                  const ansiedad = estudiante?.Anxiety_score || 0;

                  return (
                    <tr key={index}>
                      <td>{est.id_estudiante}</td>
                      <td>
                        <span className={`nivel-badge nivel-${est.nivel_riesgo.toLowerCase()}`}>
                          {est.nivel_riesgo}
                        </span>
                      </td>
                      <td className="prob-cell">{(est.probabilidad_abandono * 100).toFixed(1)}%</td>
                      <td>{est.carrera}</td>
                      <td>{est.beca}</td>
                      <td>{est.deudor}</td>
                      <td>
                        <span className={`mental-badge ${depresion >= 7 ? 'mental-critical' : depresion >= 5 ? 'mental-high' : 'mental-low'}`}>
                          {depresion.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`mental-badge ${ansiedad >= 7 ? 'mental-critical' : ansiedad >= 5 ? 'mental-high' : 'mental-low'}`}>
                          {ansiedad.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultadoCarrera && (
        <div className="career-section">
          <h2 className="section-title">
            Análisis por Carrera ({resultadoCarrera.total_carreras} carreras)
          </h2>
          <div className="table-container">
            <table className="career-table">
              <thead>
                <tr>
                  <th>Carrera</th>
                  <th>Total</th>
                  <th>En Riesgo</th>
                  <th>Graduados</th>
                  <th>% Riesgo</th>
                  <th>Prob. Promedio</th>
                </tr>
              </thead>
              <tbody>
                {resultadoCarrera.analisis_por_carrera.map((carrera: AnalisisCarrera, index: number) => (
                  <tr key={index} className={carrera.porcentaje_riesgo > 50 ? "high-risk-row" : ""}>
                    <td className="career-id">{carrera.carrera}</td>
                    <td>{carrera.total_estudiantes}</td>
                    <td className="risk-cell">{carrera.estudiantes_en_riesgo}</td>
                    <td className="grad-cell">{carrera.estudiantes_graduados}</td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${carrera.porcentaje_riesgo}%` }}
                        />
                        <span className="progress-text">{carrera.porcentaje_riesgo}%</span>
                      </div>
                    </td>
                    <td>{(carrera.promedio_probabilidad_abandono * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {estadisticas && (
        <div className="stats-section">
          <h2 className="section-title">Dashboard de Estadísticas Generales</h2>

          {estadisticas.resumen_general && (
            <div className="stats-category">
              <h3 className="category-title">Resumen General</h3>
              <div className="stats-grid-full">
                <div className="stat-card stat-primary">
                  <div className="stat-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('users') }} />
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.resumen_general.total_estudiantes || 0}</div>
                    <div className="stat-label">Total Estudiantes</div>
                  </div>
                </div>
                <div className="stat-card stat-danger">
                  <div className="stat-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('alert-triangle') }} />
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.resumen_general.estudiantes_en_riesgo || 0}</div>
                    <div className="stat-label">En Riesgo de Deserción</div>
                  </div>
                </div>
                <div className="stat-card stat-warning">
                  <div className="stat-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('percent') }} />
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.resumen_general.porcentaje_riesgo || 0}%</div>
                    <div className="stat-label">Porcentaje de Riesgo</div>
                  </div>
                </div>
                <div className="stat-card stat-info">
                  <div className="stat-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('trending-up') }} />
                  <div className="stat-content">
                    <div className="stat-value">{((estadisticas.resumen_general.promedio_probabilidad_abandono || 0) * 100).toFixed(1)}%</div>
                    <div className="stat-label">Prob. Promedio Abandono</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {estadisticas.demografia && (
            <div className="stats-category">
              <h3 className="category-title">Demografía</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{estadisticas.demografia.edad_promedio || 0} años</div>
                  <div className="stat-label">Edad Promedio</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{estadisticas.demografia.edad_minima || 0} - {estadisticas.demografia.edad_maxima || 0}</div>
                  <div className="stat-label">Rango de Edad</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{estadisticas.demografia.hombres || 0}</div>
                  <div className="stat-label">Hombres ({estadisticas.demografia.porcentaje_hombres || 0}%)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{estadisticas.demografia.mujeres || 0}</div>
                  <div className="stat-label">Mujeres ({(100 - (estadisticas.demografia.porcentaje_hombres || 0)).toFixed(1)}%)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{estadisticas.demografia.estudiantes_internacionales || 0}</div>
                  <div className="stat-label">Estudiantes Internacionales</div>
                </div>
              </div>
            </div>
          )}

          {estadisticas.situacion_financiera && (
            <div className="stats-category">
              <h3 className="category-title">Situación Financiera</h3>
              <div className="stats-grid">
                <div className="stat-card stat-success">
                  <div className="stat-value">{estadisticas.situacion_financiera.con_beca || 0}</div>
                  <div className="stat-label">Con Beca ({estadisticas.situacion_financiera.porcentaje_becados || 0}%)</div>
                </div>
                <div className="stat-card stat-danger">
                  <div className="stat-value">{estadisticas.situacion_financiera.deudores || 0}</div>
                  <div className="stat-label">Deudores ({estadisticas.situacion_financiera.porcentaje_deudores || 0}%)</div>
                </div>
              </div>
            </div>
          )}

          {estadisticas.salud_mental && (
            <div className="stats-category">
              <h3 className="category-title">Salud Mental</h3>
              <div className="stats-grid">
                <div className="stat-card stat-mental">
                  <div className="stat-value">{estadisticas.salud_mental.promedio_depresion?.toFixed(2) || '0.00'}</div>
                  <div className="stat-label">Promedio Depresión (0-10)</div>
                </div>
                <div className="stat-card stat-mental">
                  <div className="stat-value">{estadisticas.salud_mental.promedio_ansiedad?.toFixed(2) || '0.00'}</div>
                  <div className="stat-label">Promedio Ansiedad (0-10)</div>
                </div>
                <div className={`stat-card ${(estadisticas.salud_mental.porcentaje_depresion_alta || 0) > 20 ? 'stat-danger' : 'stat-warning'}`}>
                  <div className="stat-value">{estadisticas.salud_mental.estudiantes_depresion_alta || 0}</div>
                  <div className="stat-label">Depresión Alta ({estadisticas.salud_mental.porcentaje_depresion_alta || 0}%)</div>
                </div>
                <div className={`stat-card ${(estadisticas.salud_mental.porcentaje_ansiedad_alta || 0) > 20 ? 'stat-danger' : 'stat-warning'}`}>
                  <div className="stat-value">{estadisticas.salud_mental.estudiantes_ansiedad_alta || 0}</div>
                  <div className="stat-label">Ansiedad Alta ({estadisticas.salud_mental.porcentaje_ansiedad_alta || 0}%)</div>
                </div>
              </div>

              {((estadisticas.salud_mental.porcentaje_depresion_alta || 0) > 20 || (estadisticas.salud_mental.porcentaje_ansiedad_alta || 0) > 20) && (
                <div className="alert alert-critical">
                  <strong>⚠️ Alerta Crítica de Salud Mental:</strong> Más del 20% de los estudiantes presentan niveles altos de {
                    (estadisticas.salud_mental.porcentaje_depresion_alta || 0) > 20 && (estadisticas.salud_mental.porcentaje_ansiedad_alta || 0) > 20
                      ? "depresión y ansiedad"
                      : (estadisticas.salud_mental.porcentaje_depresion_alta || 0) > 20
                      ? "depresión"
                      : "ansiedad"
                  }. Se recomienda intervención urgente del área de bienestar estudiantil.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
