export const USD_TO_UZS = 12500;

export function formatSomFromUsd(price: number | null | undefined) {
  if (price === null || price === undefined || Number.isNaN(price)) {
    return "---";
  }

  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(price * USD_TO_UZS))} so'm`;
}