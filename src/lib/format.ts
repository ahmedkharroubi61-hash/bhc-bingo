/** Tunisian dinar has 1000 millimes. 28900 -> "28,900 DT". */
export function formatPrice(millimes: number): string {
  const dinars = Math.floor(millimes / 1000);
  const rest = String(millimes % 1000).padStart(3, "0");
  return `${dinars.toLocaleString("fr-TN")},${rest} DT`;
}
