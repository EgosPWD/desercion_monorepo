# Desercion — Predicción de Deserción Estudiantil

Frontend en React + TypeScript + Vite para predecir la deserción estudiantil en educación superior.

## Descripción

Esta aplicación permite predecir si un estudiante abandonará su carrera universitaria basándose en datos académicos, socioeconómicos y de salud mental. Utiliza un modelo de machine learning que devuelve:

- Predicción de riesgo (dropout, graduación o继续 enrollado)
- Probabilidades detalladas para cada resultado
- Factores de riesgo identificados
- Interpretabilidad del modelo mediante valores SHAP
- Recomendaciones personalizadas

## Funcionalidades

### Formulario de Predicción
Recolecta información del estudiante:
- Datos personales (edad, género, estado civil, nacionalidad)
- Datos académicos (carrera, modalidad, calificaciones, unidades cursadas)
- Datos familiares (ocupación y educación de los padres)
- Indicadores económicos (PIB, inflación, tasa de desempleo)
- Salud mental (puntajes de depresión y ansiedad)

### Análisis Masivo
Permite procesar múltiples estudiantes desde un archivo CSV.

### Interpretabilidad
Valores SHAP para entender qué factores influyen en la predicción del modelo.

## Tech Stack

- **React 19** — UI
- **TypeScript** — Tipado estático
- **Vite** — Build tool
- **CSS** — Estilos (tema editorial oscuro)

## Configuración

### Variables de Entorno

Crear `.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 安装 dependencias

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── api/client.ts          # Cliente HTTP
├── components/
│   ├── PrediccionForm.tsx    # Formulario de predicción
│   ├── AnalisisMasivo.tsx    # Análisis masivo
│   ├── AppTabs.tsx           # Navegación
│   └── Results/              # Componentes de resultados
│       ├── PredictionResult.tsx
│       ├── ShapInterpretability.tsx
│       ├── RiskFactors.tsx
│       └── Recommendations.tsx
├── types/api.ts           # Tipos TypeScript
├── constants/variables.ts # Variables del modelo
└── config/env.ts          # Configuración de entorno
```

## API

La aplicación se conecta a un backend que corre el modelo de ML. El endpoint esperado:

```
POST /predict
Body: { ...datos del estudiante }
```

## Licencia

MIT
