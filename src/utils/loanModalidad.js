// ASP.NET serializa los enums como texto; algunos datos antiguos pueden llegar
// como números. Normalizamos ambos formatos para evitar etiquetas incorrectas.
export function isInterestPeriodic(value) {
  if (value === 1 || value === '1') return true;
  return typeof value === 'string' && value.toLowerCase() === 'interesperiodicosobresaldo';
}

export function modalidadLabel(value) {
  return isInterestPeriodic(value) ? 'Interés sobre saldo' : 'Amortización francesa';
}
