export type LabelSize = 'small' | 'medium' | 'large'

export interface LabelSizeConfig {
  label: string
  inches: number
  qrPx: number
  cols: number
  rows: number
  perPage: number
}

export const labelSizes: Record<LabelSize, LabelSizeConfig> = {
  small: { label: 'Small (1")', inches: 1, qrPx: 100, cols: 7, rows: 10, perPage: 70 },
  medium: { label: 'Medium (2")', inches: 2, qrPx: 200, cols: 4, rows: 5, perPage: 20 },
  large: { label: 'Large (3")', inches: 3, qrPx: 300, cols: 2, rows: 3, perPage: 6 },
}

export const labelSizeOptions = Object.entries(labelSizes).map(([value, config]) => ({
  label: config.label,
  value,
}))

export function pageCount(itemCount: number, size: LabelSize): number {
  return Math.ceil(itemCount / labelSizes[size].perPage)
}
