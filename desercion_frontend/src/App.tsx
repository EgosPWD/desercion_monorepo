import { useState } from "react";
import PrediccionForm from "./components/PrediccionForm";
import AnalisisMasivo from "./components/AnalisisMasivo";
import HistorialPredicciones from "./components/HistorialPredicciones";
import { useAuth } from "./auth/AuthContext";
import "./App.css";

type Vista = "individual" | "masivo" | "historial";
type AuthMode = "login" | "register";

function AuthScreen() {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({
    username_or_email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login({
        username_or_email: loginForm.username_or_email.trim(),
        password: loginForm.password,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión",
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el usuario",
      );
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <span className="auth-kicker">[ ACCESS_REQUIRED ]</span>
        <h1 className="auth-title">Deserción Predictive Unit</h1>
        <p className="auth-description">
          Accede con tu cuenta para generar predicciones, ejecutar análisis
          masivos y guardar el historial por usuario autenticado.
        </p>

        <ul className="auth-feature-list">
          <li className="auth-feature-item">
            <span className="auth-feature-bullet">■</span>
            Predicción individual con resultados e interpretabilidad.
          </li>
          <li className="auth-feature-item">
            <span className="auth-feature-bullet">■</span>
            Procesamiento masivo desde archivos CSV.
          </li>
          <li className="auth-feature-item">
            <span className="auth-feature-bullet">■</span>
            Registro persistente de predicciones por usuario.
          </li>
        </ul>
      </div>

      <div className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h2>
            <p className="auth-card-subtitle">
              {mode === "login"
                ? "Usa tu usuario o email para acceder a la plataforma."
                : "Regístrate para empezar a guardar predicciones en tu historial."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <label className="auth-field">
                <span className="auth-label">Usuario o Email</span>
                <input
                  type="text"
                  value={loginForm.username_or_email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      username_or_email: e.target.value,
                    }))
                  }
                  className="auth-input"
                  placeholder="usuario o correo@dominio.com"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Contraseña</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="auth-input"
                  placeholder="********"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
              </label>

              {error && (
                <div className="auth-error">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Iniciar sesión"}
              </button>

              <p className="auth-switch-text">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Crear cuenta
                </button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <label className="auth-field">
                <span className="auth-label">Usuario</span>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="auth-input"
                  placeholder="tu_usuario"
                  minLength={3}
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="auth-input"
                  placeholder="correo@dominio.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Contraseña</span>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="auth-input"
                  placeholder="mínimo 6 caracteres"
                  minLength={6}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />
              </label>

              {error && (
                <div className="auth-error">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <p className="auth-switch-text">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Iniciar sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [vistaActual, setVistaActual] = useState<Vista>("individual");
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <span className="topbar-brand">DESERCION</span>

        <div className="topbar-right">
          <div className="topbar-user">
            <div className="topbar-user-meta">
              <span className="topbar-user-label">Usuario activo</span>
              <span className="topbar-user-name">@{user.username}</span>
              <span className="topbar-user-email">{user.email}</span>
            </div>
          </div>

          <span className="topbar-version">v3.0</span>

          <button type="button" className="topbar-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-unit">
            <div className="unit-icon" aria-hidden="true">
              ■
            </div>
            <div className="unit-meta">
              <span className="unit-name">PREDICTIVE UNIT</span>
              <span className="unit-version">v.3.0.0</span>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Vistas">
            <button
              className={`sidebar-nav-item sidebar-nav-btn ${
                vistaActual === "individual" ? "active" : ""
              }`}
              onClick={() => setVistaActual("individual")}
            >
              INDIVIDUAL
            </button>

            <button
              className={`sidebar-nav-item sidebar-nav-btn ${
                vistaActual === "masivo" ? "active" : ""
              }`}
              onClick={() => setVistaActual("masivo")}
            >
              MASIVO
            </button>

            <button
              className={`sidebar-nav-item sidebar-nav-btn ${
                vistaActual === "historial" ? "active" : ""
              }`}
              onClick={() => setVistaActual("historial")}
            >
              HISTORIAL
            </button>
          </nav>

          <div className="sidebar-footer">
            <span className="sidebar-footer-link">{user.email}</span>
            <span className="sidebar-footer-link">SESSION ACTIVE</span>
          </div>
        </aside>

        <main className="main-content">
          {vistaActual === "individual" && <PrediccionForm />}
          {vistaActual === "masivo" && <AnalisisMasivo />}
          {vistaActual === "historial" && <HistorialPredicciones />}
        </main>
      </div>
    </div>
  );
}
