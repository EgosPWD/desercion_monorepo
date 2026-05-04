import { useEffect, useMemo, useState } from "react";
import { fetchDashboardStats } from "../api/client";
import type { DashboardStatsResponse } from "../types/api";
import "./DashboardObservabilidad.css";

const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL ?? "http://localhost:3030";

export default function DashboardObservabilidad() {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchDashboardStats();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Total predicciones", value: data.resumen.total_predicciones },
      { label: "Total abandono", value: data.resumen.total_abandono },
      { label: "Total graduación", value: data.resumen.total_graduacion },
      { label: "% abandono", value: `${data.resumen.porcentaje_abandono}%` },
      {
        label: "Promedio prob. abandono",
        value: data.resumen.promedio_probabilidad_abandono,
      },
    ];
  }, [data]);

  if (loading) {
    return <div className="dashboard-state">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-state error">Error: {error}</div>;
  }

  return (
    <section className="dashboard-observabilidad">
      <header className="dashboard-header">
        <h1>Dashboard de Observabilidad</h1>
        <a href={GRAFANA_URL} target="_blank" rel="noreferrer" className="grafana-link">
          Abrir Grafana
        </a>
      </header>

      <div className="dashboard-cards">
        {cards.map((card) => (
          <article key={card.label} className="dashboard-card">
            <span className="dashboard-card-label">{card.label}</span>
            <strong className="dashboard-card-value">{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="dashboard-block">
        <h2>Predicciones por endpoint</h2>
        <ul className="endpoint-list">
          {data?.por_endpoint.map((item) => (
            <li key={item.endpoint} className="endpoint-row">
              <span>{item.endpoint}</span>
              <strong>{item.total}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-block">
        <h2>Vista embebida de Grafana</h2>
        <iframe
          className="grafana-iframe"
          title="Grafana"
          src={GRAFANA_URL}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </section>
    </section>
  );
}
