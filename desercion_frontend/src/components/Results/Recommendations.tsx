import type { Recomendaciones, Recomendacion } from "../../types/api";
import "./Recommendations.css";

interface RecommendationsProps {
  recomendaciones: Recomendaciones;
}

export default function Recommendations({ recomendaciones }: RecommendationsProps) {
  return (
    <div className="recommendations-container">
      <h3 className="recommendations-title">
        Recomendaciones de Intervención
        <span className="recommendations-count">
          {recomendaciones.total_recomendaciones} sugerencias
        </span>
      </h3>

      <div className="recommendations-grid">
        {recomendaciones.recomendaciones.map((rec: Recomendacion, index: number) => (
          <div key={index} className={`recommendation-card priority-${rec.prioridad.toLowerCase()}`}>
            <div className="recommendation-header">
              <span className="recommendation-type">{rec.tipo}</span>
              <span className={`recommendation-priority priority-${rec.prioridad.toLowerCase()}`}>
                {rec.prioridad}
              </span>
            </div>
            <h4 className="recommendation-action">{rec.accion}</h4>
            <p className="recommendation-description">{rec.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
