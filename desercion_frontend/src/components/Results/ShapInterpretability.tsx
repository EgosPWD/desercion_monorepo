import type {
  Interpretabilidad,
  CaracteristicaImportante,
} from "../../types/api";
import "./ShapInterpretability.css";

interface ShapInterpretabilityProps {
  interpretabilidad: Interpretabilidad;
}

function getImpactValue(
  caracteristica: CaracteristicaImportante,
): number | null {
  if (typeof caracteristica.impacto_shap === "number") {
    return caracteristica.impacto_shap;
  }

  if (typeof caracteristica.impacto_coeficiente === "number") {
    return caracteristica.impacto_coeficiente;
  }

  return null;
}

export default function ShapInterpretability({
  interpretabilidad,
}: ShapInterpretabilityProps) {
  const caracteristicas = Array.isArray(interpretabilidad.caracteristicas_top)
    ? interpretabilidad.caracteristicas_top
    : [];

  return (
    <div className="interpretability-container">
      <h3 className="interpretability-title">Interpretabilidad del Modelo</h3>
      <p className="interpretability-description">
        {interpretabilidad.descripcion}
      </p>

      <div className="shap-features">
        <h4 className="shap-subtitle">Características más Influyentes</h4>

        {caracteristicas.length > 0 ? (
          <div className="shap-grid">
            {caracteristicas.map(
              (caracteristica: CaracteristicaImportante, index: number) => {
                const impactValue = getImpactValue(caracteristica);
                const isPositive = (impactValue ?? 0) >= 0;

                return (
                  <div
                    key={`${caracteristica.caracteristica}-${index}`}
                    className={`shap-feature-card impact-${
                      isPositive ? "positive" : "negative"
                    }`}
                  >
                    <div className="shap-feature-header">
                      <span className="shap-rank">#{index + 1}</span>
                      <span className="shap-feature-name">
                        {caracteristica.caracteristica}
                      </span>
                    </div>

                    <div className="shap-feature-content">
                      <div className="shap-feature-value">
                        <span className="shap-label">Valor:</span>
                        <span className="shap-value">
                          {caracteristica.valor}
                        </span>
                      </div>

                      <div className="shap-feature-impact">
                        <span className="shap-label">
                          {typeof caracteristica.impacto_shap === "number"
                            ? "Impacto SHAP:"
                            : "Impacto estimado:"}
                        </span>
                        <span
                          className={`shap-impact ${
                            isPositive ? "positive" : "negative"
                          }`}
                        >
                          {impactValue !== null
                            ? `${impactValue > 0 ? "+" : ""}${impactValue.toFixed(4)}`
                            : "No disponible"}
                        </span>
                      </div>

                      {caracteristica.impacto_coeficiente !== undefined && (
                        <div className="shap-feature-coefficient">
                          <span className="shap-label">Coeficiente:</span>
                          <span className="shap-coefficient">
                            {caracteristica.impacto_coeficiente.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="shap-visual-bar">
                      <div
                        className={`shap-bar ${
                          isPositive ? "positive" : "negative"
                        }`}
                        style={{
                          width:
                            impactValue !== null
                              ? `${Math.min(Math.abs(impactValue) * 100, 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="interpretability-note">
            {typeof interpretabilidad.caracteristicas_top === "string"
              ? interpretabilidad.caracteristicas_top
              : "No hay características interpretables disponibles para esta predicción."}
          </p>
        )}
      </div>

      {interpretabilidad.nota && (
        <p className="interpretability-note">
          <strong>Nota:</strong> {interpretabilidad.nota}
        </p>
      )}
    </div>
  );
}
