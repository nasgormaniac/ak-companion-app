export function resolveTheme(saved, systemDark) {
  if (saved === 'light' || saved === 'dark') return saved;
  return systemDark ? 'dark' : 'light';
}

export function applyTheme(root, storage, theme) {
  root.dataset.theme = theme;
  try { storage.setItem('ak-scanner-theme', theme); }
  catch { /* the selected theme remains active for this session */ }
}
