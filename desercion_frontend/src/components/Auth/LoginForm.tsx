import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import type { LoginRequest } from "../../types/api";
import "./Auth.css";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    username_or_email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username_or_email.trim() || !formData.password.trim()) {
      setError("Completa usuario o email y contraseña.");
      return;
    }

    try {
      await login({
        username_or_email: formData.username_or_email.trim(),
        password: formData.password,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
    }
  };

  return (
    <div className="auth-panel">
      <div className="auth-header">
        <span className="auth-tag">[ ACCESS_PORTAL ]</span>
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">
          Accede para registrar predicciones y consultar tu historial.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="username_or_email" className="auth-label">
            Usuario o email
          </label>
          <input
            id="username_or_email"
            name="username_or_email"
            type="text"
            value={formData.username_or_email}
            onChange={handleChange}
            className="auth-input"
            placeholder="tu_usuario o correo@dominio.com"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="auth-input"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="auth-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? "Ingresando..." : "Entrar"}
        </button>
      </form>

      <div className="auth-footer">
        <span className="auth-footer-text">¿No tienes cuenta?</span>
        <button
          type="button"
          className="auth-link-button"
          onClick={onSwitchToRegister}
          disabled={isLoading}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  );
}
