import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import type { RegisterRequest } from "../../types/api";
import "./Auth.css";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({
  onSwitchToLogin,
}: RegisterFormProps) {
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!username || !email || !password || !confirmPassword) {
      return "Completá todos los campos.";
    }

    if (username.length < 3) {
      return "El usuario debe tener al menos 3 caracteres.";
    }

    if (!email.includes("@")) {
      return "Ingresá un email válido.";
    }

    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el usuario.");
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <span className="auth-tag">[ CREATE_ACCOUNT ]</span>
        <h1 className="auth-title">Registro</h1>
        <p className="auth-subtitle">
          Creá tu cuenta para guardar predicciones e historial por usuario.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="register-username" className="auth-label">
            Usuario
          </label>
          <input
            id="register-username"
            type="text"
            className="auth-input"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="tu_usuario"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-email" className="auth-label">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className="auth-input"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="correo@universidad.edu"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-password" className="auth-label">
            Contraseña
          </label>
          <input
            id="register-password"
            type="password"
            className="auth-input"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password" className="auth-label">
            Confirmar contraseña
          </label>
          <input
            id="register-confirm-password"
            type="password"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetí tu contraseña"
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="auth-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <div className="auth-footer">
        <span className="auth-footer-text">¿Ya tenés cuenta?</span>
        <button
          type="button"
          className="auth-link"
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
