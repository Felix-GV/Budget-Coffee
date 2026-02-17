export function slugify(name: string, retailer: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '');
  return `${base}--${retailer.toLowerCase().replace(/\s+/g, '-')}`;
}
