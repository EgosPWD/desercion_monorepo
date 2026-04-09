import type { AnalisisFactores, FactorRiesgo } from "../../types/api";
import "./RiskFactors.css";

interface RiskFactorsProps {
  analisisFactores: AnalisisFactores;
}

export default function RiskFactors({ analisisFactores }: RiskFactorsProps) {
  return (
    <div className="analysis-container">
      <h3 className="analysis-title">
        Análisis de Factores de Riesgo
        <span className={`attention-badge attention-${analisisFactores.nivel_atencion.toLowerCase()}`}>
          {analisisFactores.nivel_atencion}
        </span>
      </h3>

      {analisisFactores.factores_riesgo.length > 0 ? (
        <div className="factors-grid">
          {analisisFactores.factores_riesgo.map((factor: FactorRiesgo, index: number) => (
            <div key={index} className={`factor-card impact-${factor.impacto.toLowerCase()}`}>
              <div className="factor-header">
                <span className="factor-name">{factor.factor}</span>
                <span className={`factor-impact impact-${factor.impacto.toLowerCase()}`}>
                  {factor.impacto}
                </span>
              </div>
              <p className="factor-description">{factor.descripcion}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-factors">No se identificaron factores de riesgo significativos</p>
      )}
    </div>
  );
}
