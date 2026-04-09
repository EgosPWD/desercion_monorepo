import { getIconSvg } from "../assets/svg";

type Vista = "individual" | "masivo";

interface AppTabsProps {
  vistaActual: Vista;
  onChange: (vista: Vista) => void;
}

export default function AppTabs({ vistaActual, onChange }: AppTabsProps) {
  return (
    <div className="nav-tabs">
      <button
        className={`nav-tab ${vistaActual === "individual" ? "active" : ""}`}
        onClick={() => onChange("individual")}
      >
        <span className="nav-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('user') }} />
        Análisis Individual
      </button>
      <button
        className={`nav-tab ${vistaActual === "masivo" ? "active" : ""}`}
        onClick={() => onChange("masivo")}
      >
        <span className="nav-icon" dangerouslySetInnerHTML={{ __html: getIconSvg('users') }} />
        Análisis Masivo
      </button>
    </div>
  );
}

export type { Vista };
