#!/usr/bin/env python3
import re

# Leer el archivo
with open('src/components/PrediccionForm.tsx', 'r') as f:
    content = f.read()

# Agregar import del CSS
if 'import "./PrediccionForm.css"' not in content:
    content = content.replace('import { useState } from "react";', 'import { useState } from "react";\nimport "./PrediccionForm.css";')

# Reemplazos de clases
replacements = [
    (r'className="border-2 border-red-400 rounded-xl p-5 bg-gradient-to-br from-red-50 to-pink-50 shadow-sm"', 'className="form-section section-critical"'),
    (r'className="border-2 border-orange-400 rounded-xl p-5 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-sm"', 'className="form-section section-important"'),
    (r'className="border-2 border-gray-300 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-slate-50 shadow-sm"', 'className="form-section section-complementary"'),
    (r'className="border-2 border-blue-400 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm"', 'className="form-section section-macro"'),
    (r'className="text-xl font-bold mb-4[^"]*"', 'className="section-title"'),
    (r'className="grid grid-cols-1 md:grid-cols-2 gap-4"', 'className="form-grid"'),
    (r'className="grid grid-cols-1 md:grid-cols-3 gap-4"', 'className="form-grid form-grid-3"'),
    (r'className="space-y-6"', 'className="form-container"'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Reemplazar estructura de labels
content = re.sub(r'<label className="flex flex-col">\s*<span className="text-sm font-(?:medium|semibold) text-gray-700 mb-1">([^<]+)</span>', r'<div className="form-field">\n            <label className="form-label">\1</label>', content)

# Reemplazar inputs y selects
content = re.sub(r'className="border-2 border-gray-300 rounded-lg p-2\.5[^"]*"', 'className="form-input"', content)

# Cerrar divs en vez de labels
content = re.sub(r'</label>(\s*</div>)', r'\1\1', content)

# Reemplazar botón
content = re.sub(r'className="bg-gradient-to-r from-green-600 to-teal-600[^"]*"', 'className="form-button"', content)

# Reemplazar mensajes
content = re.sub(r'className="p-5 bg-gradient-to-r from-red-100 to-pink-100[^"]*"', 'className="error-message"', content)
content = re.sub(r'className="font-semibold text-lg"', 'className="error-title"', content)
content = re.sub(r'className="p-6 bg-gradient-to-br from-green-50[^"]*"', 'className="result-container"', content)
content = re.sub(r'className="text-center space-y-3"', 'className="result-content"', content)
content = re.sub(r'className="inline-block px-6 py-3 bg-white rounded-lg shadow-sm"', 'className="result-badge"', content)
content = re.sub(r'className="text-3xl font-bold text-gray-800"', 'className="result-title"', content)
content = re.sub(r'className="bg-white rounded-lg p-4 shadow-sm"', 'className="result-probability-card"', content)
content = re.sub(r'className="text-sm text-gray-600 mb-1"', 'className="result-probability-label"', content)
content = re.sub(r'className="text-4xl font-bold text-red-600"', 'className="result-probability-value"', content)
content = re.sub(r'className="text-sm text-gray-600"', 'className="result-user"', content)
content = re.sub(r'className="font-semibold"', 'className="result-user-name"', content)

# Escribir el resultado
with open('src/components/PrediccionForm.tsx', 'w') as f:
    f.write(content)

print("✅ Archivo actualizado correctamente")
