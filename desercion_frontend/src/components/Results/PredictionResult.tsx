import type { Resultado } from "../../types/api";
import "./PredictionResult.css";

interface PredictionResultProps {
  resultado: Resultado;
}

export default function PredictionResult({ resultado }: PredictionResultProps) {
  return (
    <div className="result-container">
      <div className="result-content">
        <p className="result-text">{resultado.resultado}</p>
        <div className="probability-container">
          <p className="probability-label">
            Probabilidad del Resultado
          </p>
          <p className="probability-value">
            {resultado.probabilidad_resultado}
          </p>
        </div>

        {typeof resultado.probabilidades_detalladas === 'object' && (
          <div className="detailed-probabilities">
            <h4 className="probabilities-title">Probabilidades Detalladas</h4>
            <div className="probabilities-grid">
              <div className="probability-item">
                <span className="probability-label">Graduación:</span>
                <span className="probability-value">
                  {resultado.probabilidades_detalladas.graduacion}
                </span>
              </div>
              <div className="probability-item">
                <span className="probability-label">Abandono:</span>
                <span className="probability-value">
                  {resultado.probabilidades_detalladas.abandono}
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="user-info">
          Usuario: <span className="font-semibold">{resultado.usuario}</span>
        </p>
      </div>
    </div>
  );
}
