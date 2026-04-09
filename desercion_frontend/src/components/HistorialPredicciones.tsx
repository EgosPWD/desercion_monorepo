import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "./HistorialPredicciones.css";

interface PrediccionHistorial {
  id: number;
  usuario_id?: number;
  usuario_username?: string;
  estudiante_id: string | null;
  endpoint: string;
  prediccion: number;
  resultado: string;
  probabilidad_abandono: number | null;
  probabilidad_graduacion: number | null;
  features: Record<string, unknown>;
  fecha: string | null;
}

interface HistorialResponse {
  usuario: string;
  total: number;
  limit: number;
  offset: number;
  predicciones: PrediccionHistorial[];
}

function formatFecha(value: string | null): string {
  if (!value) return "Sin fecha";

  try {
    return new Date(value).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function formatProbabilidad(value: number | null): string {
  if (value === null || value === undefined) return "N/D";
  return `${(value * 100).toFixed(1)}%`;
}

export default function HistorialPredicciones() {
  const [historial, setHistorial] = useState<HistorialResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroResultado, setFiltroResultado] = useState("");
  const [filtroEstudiante, setFiltroEstudiante] = useState("");

  const cargarHistorial = async () => {
    setCargando(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("offset", "0");

      if (filtroResultado.trim()) {
        params.set("resultado", filtroResultado.trim());
      }

      if (filtroEstudiante.trim()) {
        params.set("estudiante_id", filtroEstudiante.trim());
      }

      const data = await apiFetch<HistorialResponse>(`/historial?${params.toString()}`, {
        method: "GET",
      });

      setHistorial(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar el historial";
      setError(message);
      setHistorial(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarHistorial();
  }, []);

  const handleFiltrar = async (e: React.FormEvent) => {
    e.preventDefault();
    await cargarHistorial();
  };

  return (
    <section className="historial-container">
      <div className="historial-header">
        <div>
          <span className="historial-tag">[ USER_ACTIVITY_LOG ]</span>
          <h1 className="historial-title">Historial de Predicciones</h1>
          <p className="historial-description">
            Consultá las predicciones realizadas por el usuario autenticado y
            revisá sus resultados más recientes.
          </p>
        </div>

        <button
          type="button"
          className="historial-refresh-btn"
          onClick={() => void cargarHistorial()}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <form className="historial-filters" onSubmit={handleFiltrar}>
        <div className="historial-field">
          <label htmlFor="filtro-resultado">Resultado</label>
          <select
            id="filtro-resultado"
            value={filtroResultado}
            onChange={(e) => setFiltroResultado(e.target.value)}
            className="historial-select"
          >
            <option value="">Todos</option>
            <option value="Abandona">Abandona</option>
            <option value="Se gradúa">Se gradúa</option>
          </select>
        </div>

        <div className="historial-field">
          <label htmlFor="filtro-estudiante">ID Estudiante</label>
          <input
            id="filtro-estudiante"
            type="text"
            value={filtroEstudiante}
            onChange={(e) => setFiltroEstudiante(e.target.value)}
            placeholder="Ej: EST-001"
            className="historial-input"
          />
        </div>

        <div className="historial-actions">
          <button type="submit" className="historial-apply-btn" disabled={cargando}>
            Aplicar filtros
          </button>
          <button
            type="button"
            className="historial-clear-btn"
            disabled={cargando}
            onClick={() => {
              setFiltroResultado("");
              setFiltroEstudiante("");
              setTimeout(() => {
                void cargarHistorial();
              }, 0);
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && (
        <div className="historial-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {historial && (
        <div className="historial-summary">
          <div className="historial-summary-card">
            <span className="summary-label">Usuario</span>
            <span className="summary-value">{historial.usuario}</span>
          </div>
          <div className="historial-summary-card">
            <span className="summary-label">Total registros</span>
            <span className="summary-value">{historial.total}</span>
          </div>
          <div className="historial-summary-card">
            <span className="summary-label">Límite</span>
            <span className="summary-value">{historial.limit}</span>
          </div>
        </div>
      )}

      <div className="historial-table-wrapper">
        {cargando ? (
          <div className="historial-empty">Cargando historial...</div>
        ) : historial && historial.predicciones.length > 0 ? (
          <table className="historial-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Endpoint</th>
                <th>ID Estudiante</th>
                <th>Resultado</th>
                <th>Prob. Abandono</th>
                <th>Prob. Graduación</th>
              </tr>
            </thead>
            <tbody>
              {historial.predicciones.map((prediccion) => (
                <tr key={prediccion.id}>
                  <td>{prediccion.id}</td>
                  <td>{formatFecha(prediccion.fecha)}</td>
                  <td>{prediccion.endpoint}</td>
                  <td>{prediccion.estudiante_id ?? "N/A"}</td>
                  <td>
                    <span
                      className={`historial-badge ${
                        prediccion.resultado === "Abandona"
                          ? "historial-badge-danger"
                          : "historial-badge-success"
                      }`}
                    >
                      {prediccion.resultado}
                    </span>
                  </td>
                  <td>{formatProbabilidad(prediccion.probabilidad_abandono)}</td>
                  <td>{formatProbabilidad(prediccion.probabilidad_graduacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="historial-empty">
            No hay predicciones registradas para este usuario.
          </div>
        )}
      </div>
    </section>
  );
}
