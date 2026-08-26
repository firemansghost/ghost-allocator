/**
 * Board H.15 Treasury yields — SDMX/XML release transport metadata constants only.
 */

export const FRB_H15_SDMX_SOURCE_FAMILY_ID = 'frb_h15_treasury_yields' as const;

export const FRB_H15_SDMX_SOURCE_NAME =
  'Board of Governors H.15 — Treasury constant maturity (nominal + inflation-indexed)' as const;

export const FRB_H15_SDMX_SOURCE_LOCATOR =
  'https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip' as const;

export const FRB_H15_SDMX_ADAPTER_ID = 'frb-h15-treasury-yields-sdmx' as const;

export const FRB_H15_SDMX_PARSER_VERSION = '1.0.0' as const;

export const FRB_H15_SDMX_ARTIFACT_ID = 'treasuryLongEndIncomeLens' as const;

/** SDMX compact `SERIES_NAME` values (no H15/H15/ prefix). */
export const FRB_H15_SDMX_REQUIRED_SERIES_NAMES = [
  'RIFLGFCY30_N.B',
  'RIFLGFCY30_XII_N.B',
] as const;

export const FRB_H15_SDMX_OPTIONAL_SERIES_NAMES = [
  'RIFLGFCY02_N.B',
  'RIFLGFCY05_N.B',
  'RIFLGFCY10_N.B',
] as const;

export const FRB_H15_SDMX_REGISTERED_SERIES_NAMES = [
  ...FRB_H15_SDMX_REQUIRED_SERIES_NAMES,
  ...FRB_H15_SDMX_OPTIONAL_SERIES_NAMES,
] as const;

export type FrbH15SdmxRequiredSeriesName =
  (typeof FRB_H15_SDMX_REQUIRED_SERIES_NAMES)[number];

export type FrbH15SdmxOptionalSeriesName =
  (typeof FRB_H15_SDMX_OPTIONAL_SERIES_NAMES)[number];

export type FrbH15SdmxRegisteredSeriesName =
  (typeof FRB_H15_SDMX_REGISTERED_SERIES_NAMES)[number];

/** Map SDMX series name to DDP unique id used by shared normalization. */
export function frbH15SdmxSeriesNameToUniqueId(
  seriesName: FrbH15SdmxRegisteredSeriesName
): `H15/H15/${FrbH15SdmxRegisteredSeriesName}` {
  return `H15/H15/${seriesName}`;
}
