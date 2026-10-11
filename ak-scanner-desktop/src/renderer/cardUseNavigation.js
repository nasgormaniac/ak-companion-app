const categories = ['animal', 'strong', 'miracle'];

export function nextViewAfterCardUse(origin, category) {
  if (origin === 'home') return null;
  if (origin !== 'catalogue' || !categories.includes(category)) {
    throw new Error('Invalid card use origin or category.');
  }
  const nextCategory = categories[categories.indexOf(category) + 1];
  return nextCategory ? { name: 'catalogue', category: nextCategory } : { name: 'home' };
}
