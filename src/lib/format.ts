export function formatPrice(price: number): string {
  return `${price.toLocaleString('ar-DZ')} دج`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
