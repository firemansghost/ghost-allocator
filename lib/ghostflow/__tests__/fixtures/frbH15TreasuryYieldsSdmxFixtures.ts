/**
 * Board H.15 SDMX/XML adapter fixtures (synthetic XML + in-memory ZIP; no live downloads).
 */

import { createHash } from 'crypto';
import { deflateRawSync } from 'zlib';
import { FRB_H15_SDMX_SOURCE_LOCATOR } from '../../refresh/adapters/frbH15TreasuryYieldsSdmxMeta';
import {
  crc32Pkzip,
  FRB_H15_ZIP_DATA_MEMBER,
  FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES,
} from '../../refresh/adapters/frbH15ZipMember';

export { ADAPTER_TEST_NOW_ISO } from './frbH15TreasuryYieldsFixtures';

const SDMX_HEADER =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<message:MessageGroup xmlns:message="http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message">\n' +
  '<message:Header/>\n' +
  '<frb:DataSet>\n';

const SDMX_FOOTER = '</frb:DataSet>\n</message:MessageGroup>\n';

type SeriesObs = Array<{
  timePeriod: string;
  obsStatus: 'A' | 'ND' | 'NA' | 'NC';
  obsValue?: string;
}>;

function seriesBlock(seriesName: string, observations: SeriesObs): string {
  const obsTags = observations
    .map((o) => {
      const valueAttr =
        o.obsValue !== undefined ? ` OBS_VALUE="${o.obsValue}"` : '';
      return `      <frb:Obs OBS_STATUS="${o.obsStatus}"${valueAttr} TIME_PERIOD="${o.timePeriod}" />`;
    })
    .join('\n');
  return [
    `    <kf:Series SERIES_NAME="${seriesName}">`,
    obsTags,
    '    </kf:Series>',
  ].join('\n');
}

export function buildFrbH15SdmxFixtureXml(input: {
  series: Array<{ name: string; observations: SeriesObs }>;
  unrelatedSeries?: Array<{ name: string; observations: SeriesObs }>;
  duplicateSeriesName?: string;
  header?: string;
  footer?: string;
}): string {
  const blocks = input.series.map((s) => seriesBlock(s.name, s.observations));
  if (input.unrelatedSeries) {
    for (const s of input.unrelatedSeries) {
      blocks.push(seriesBlock(s.name, s.observations));
    }
  }
  if (input.duplicateSeriesName) {
    blocks.push(
      seriesBlock(input.duplicateSeriesName, [
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '1.00' },
      ])
    );
  }
  return `${input.header ?? SDMX_HEADER}${blocks.join('\n')}\n${input.footer ?? SDMX_FOOTER}`;
}

function seriesBlockWithRawObs(seriesName: string, obsLines: string[]): string {
  return [
    `    <kf:Series SERIES_NAME="${seriesName}">`,
    ...obsLines.map((line) => `      ${line}`),
    '    </kf:Series>',
  ].join('\n');
}

export function buildFrbH15SdmxRawXml(input: {
  dataSetBody: string;
  outsideDataSet?: string;
  header?: string;
  footer?: string;
}): string {
  const header =
    input.header ??
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<message:MessageGroup xmlns:message="http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message">\n' +
      '<message:Header/>\n' +
      '<frb:DataSet>\n';
  if (input.outsideDataSet) {
    return `${header}${input.dataSetBody}\n</frb:DataSet>\n${input.outsideDataSet}\n</message:MessageGroup>\n`;
  }
  const footer = input.footer ?? '</frb:DataSet>\n</message:MessageGroup>\n';
  return `${header}${input.dataSetBody}\n${footer}`;
}

export { SDMX_HEADER, SDMX_FOOTER };

function requiredSeriesBlocks(
  observationsBySeries?: Partial<Record<string, SeriesObs>>
): Array<{ name: string; observations: SeriesObs }> {
  const defaults: Record<string, SeriesObs> = {
    'RIFLGFCY30_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    'RIFLGFCY30_XII_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    'RIFLGFCY02_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }],
    'RIFLGFCY05_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    'RIFLGFCY10_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
  };
  return Object.entries(defaults).map(([name, fallback]) => ({
    name,
    observations: observationsBySeries?.[name] ?? fallback,
  }));
}

export type MinimalZipEntryOptions = {
  name: string;
  content: Uint8Array | string;
  deflate?: boolean;
  flags?: number;
  crc32Override?: number;
  compressedSizeOverride?: number;
  uncompressedSizeOverride?: number;
};

/** Build a minimal ZIP archive in memory (stored or DEFLATE raw). */
export function buildMinimalZip(
  entries: Array<MinimalZipEntryOptions>,
  trailingBytes?: Uint8Array
): Uint8Array {
  const chunks: Buffer[] = [];
  for (const entry of entries) {
    const payload =
      typeof entry.content === 'string'
        ? Buffer.from(entry.content, 'utf8')
        : Buffer.from(entry.content);
    const useDeflate = entry.deflate ?? true;
    const compressed = useDeflate ? deflateRawSync(payload) : payload;
    const method = useDeflate ? 8 : 0;
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const header = Buffer.alloc(30 + nameBuf.length);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(entry.flags ?? 0, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(entry.crc32Override ?? crc32Pkzip(payload), 14);
    header.writeUInt32LE(entry.compressedSizeOverride ?? compressed.length, 18);
    header.writeUInt32LE(entry.uncompressedSizeOverride ?? payload.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    nameBuf.copy(header, 30);
    chunks.push(header, compressed);
  }
  if (trailingBytes) {
    chunks.push(Buffer.from(trailingBytes));
  }
  return Uint8Array.from(Buffer.concat(chunks));
}

export function zipWithH15Data(xml: string, extraEntries: Array<{ name: string; content: string }> = []): Uint8Array {
  return buildMinimalZip([
    ...extraEntries.map((e) => ({ name: e.name, content: e.content, deflate: false })),
    { name: FRB_H15_ZIP_DATA_MEMBER, content: xml, deflate: true },
  ]);
}

export const FIXTURE_H15_SDMX_VALID_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY02_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '4.10' },
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' },
        { timePeriod: '2026-07-02', obsStatus: 'ND' },
        { timePeriod: '2026-07-03', obsStatus: 'A', obsValue: '4.15' },
      ],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '4.20' },
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' },
        { timePeriod: '2026-07-03', obsStatus: 'A', obsValue: '4.22' },
      ],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '4.40' },
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' },
        { timePeriod: '2026-07-03', obsStatus: 'A', obsValue: '4.45' },
      ],
    },
    {
      name: 'RIFLGFCY30_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '4.90' },
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' },
        { timePeriod: '2026-07-03', obsStatus: 'A', obsValue: '4.95' },
      ],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '2.70' },
        { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' },
        { timePeriod: '2026-07-02', obsStatus: 'ND' },
        { timePeriod: '2026-07-03', obsStatus: 'A', obsValue: '2.79' },
      ],
    },
  ],
  unrelatedSeries: [
    {
      name: 'RIFLGFCM01_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '3.00' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_VALID_ZIP = zipWithH15Data(FIXTURE_H15_SDMX_VALID_XML);

export const FIXTURE_H15_SDMX_OPTIONAL_GAP_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY02_N.B',
      observations: [
        { timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '4.10' },
        { timePeriod: '2026-07-01', obsStatus: 'ND' },
      ],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_NO_COMMON_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-06-30', obsStatus: 'A', obsValue: '2.70' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_FUTURE_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-10', obsStatus: 'A', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-10', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-10', obsStatus: 'A', obsValue: '4.48' }],
    },
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-10', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-10', obsStatus: 'A', obsValue: '2.78' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_BLANK_PREINCEPTION_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY02_N.B',
      observations: [
        { timePeriod: '1962-01-02', obsStatus: 'ND' },
        { timePeriod: '1962-01-03', obsStatus: 'NA' },
        { timePeriod: '2026-06-30', obsStatus: 'NC' },
        { timePeriod: '2026-07-01', obsStatus: 'ND', obsValue: '-9999' },
      ],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_MISSING_REQUIRED_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_DUPLICATE_SERIES_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
  ],
  duplicateSeriesName: 'RIFLGFCY30_N.B',
});

export const FIXTURE_H15_SDMX_INVALID_DATE_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-13-40', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_BAD_VALUE_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97x' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_UNKNOWN_STATUS_XML = buildFrbH15SdmxFixtureXml({
  series: [
    {
      name: 'RIFLGFCY30_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }],
    },
    {
      name: 'RIFLGFCY30_XII_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }],
    },
    {
      name: 'RIFLGFCY02_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'Q', obsValue: '4.17' }],
    },
    {
      name: 'RIFLGFCY05_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }],
    },
    {
      name: 'RIFLGFCY10_N.B',
      observations: [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }],
    },
  ],
});

export const FIXTURE_H15_SDMX_INVALID_UTF8_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: Uint8Array.from([0xff, 0xfe, 0x80, 0x81]),
    deflate: false,
  },
]);

export const FIXTURE_H15_SDMX_DUPLICATE_MEMBER_ZIP = buildMinimalZip([
  { name: FRB_H15_ZIP_DATA_MEMBER, content: FIXTURE_H15_SDMX_VALID_XML, deflate: true },
  { name: FRB_H15_ZIP_DATA_MEMBER, content: FIXTURE_H15_SDMX_VALID_XML, deflate: true },
]);

export const FIXTURE_H15_SDMX_MISSING_MEMBER_ZIP = buildMinimalZip([
  { name: 'other.xml', content: '<root/>', deflate: false },
]);

export const FIXTURE_H15_SDMX_MALFORMED_ZIP = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x00]);

export const FIXTURE_H15_SDMX_NO_NAMESPACE_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks(),
  header:
    '<?xml version="1.0" encoding="UTF-8"?>\n<message:MessageGroup>\n<message:Header/>\n<frb:DataSet>\n',
});

export const FIXTURE_H15_SDMX_MISSING_DATASET_CLOSE_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks(),
  footer: '',
});

export const FIXTURE_H15_SDMX_MISSING_MESSAGEGROUP_CLOSE_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks(),
  footer: '</frb:DataSet>\n',
});

export const FIXTURE_H15_SDMX_MISSING_STATUS_INVALID_DATE_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks({
    'RIFLGFCY02_N.B': [{ timePeriod: 'banana', obsStatus: 'ND' }],
  }),
});

export const FIXTURE_H15_SDMX_DUPLICATE_AA_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks({
    'RIFLGFCY30_N.B': [
      { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' },
      { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.98' },
    ],
  }),
});

export const FIXTURE_H15_SDMX_DUPLICATE_ND_ND_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks({
    'RIFLGFCY02_N.B': [
      { timePeriod: '2026-07-01', obsStatus: 'ND' },
      { timePeriod: '2026-07-01', obsStatus: 'ND' },
    ],
  }),
});

export const FIXTURE_H15_SDMX_DUPLICATE_ND_A_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks({
    'RIFLGFCY02_N.B': [
      { timePeriod: '2026-07-01', obsStatus: 'ND' },
      { timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' },
    ],
  }),
});

export const FIXTURE_H15_SDMX_A_MINUS9999_XML = buildFrbH15SdmxFixtureXml({
  series: requiredSeriesBlocks({
    'RIFLGFCY30_N.B': [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '-9999' }],
  }),
});

/** Required target series appear after frb:DataSet close; only optionals remain inside. */
export const FIXTURE_H15_SDMX_REQUIRED_OUTSIDE_DATASET_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlock('RIFLGFCY02_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }]),
    seriesBlock('RIFLGFCY05_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }]),
    seriesBlock('RIFLGFCY10_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }]),
  ].join('\n'),
  outsideDataSet: [
    seriesBlock('RIFLGFCY30_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.97' }]),
    seriesBlock('RIFLGFCY30_XII_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }]),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_NON_SELF_CLOSING_OBS_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs OBS_STATUS="A" TIME_PERIOD="2026-07-01" OBS_VALUE="4.97"></frb:Obs>',
    ]),
    ...requiredSeriesBlocks()
      .filter((s) => s.name !== 'RIFLGFCY30_N.B')
      .map((s) => seriesBlock(s.name, s.observations)),
  ].join('\n'),
});

// Hand-built: non-self-closing observation with nested /> must fail closed.
export const FIXTURE_H15_SDMX_MALFORMED_NESTED_OBS_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs OBS_STATUS="A" TIME_PERIOD="2026-07-01" OBS_VALUE="4.97">',
      '  <x />',
      '</frb:Obs>',
    ]),
    seriesBlock('RIFLGFCY30_XII_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '2.78' }]),
    seriesBlock('RIFLGFCY02_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.17' }]),
    seriesBlock('RIFLGFCY05_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.24' }]),
    seriesBlock('RIFLGFCY10_N.B', [{ timePeriod: '2026-07-01', obsStatus: 'A', obsValue: '4.48' }]),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_XOBS_STATUS_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs XOBS_STATUS="A" OBS_VALUE="4.97" TIME_PERIOD="2026-07-01" />',
    ]),
    ...requiredSeriesBlocks()
      .filter((s) => s.name !== 'RIFLGFCY30_N.B')
      .map((s) => seriesBlock(s.name, s.observations)),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_XTIME_PERIOD_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs OBS_STATUS="A" XTIME_PERIOD="2026-07-01" OBS_VALUE="4.97" />',
    ]),
    ...requiredSeriesBlocks()
      .filter((s) => s.name !== 'RIFLGFCY30_N.B')
      .map((s) => seriesBlock(s.name, s.observations)),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_XOBS_VALUE_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs OBS_STATUS="A" TIME_PERIOD="2026-07-01" XOBS_VALUE="4.97" />',
    ]),
    ...requiredSeriesBlocks()
      .filter((s) => s.name !== 'RIFLGFCY30_N.B')
      .map((s) => seriesBlock(s.name, s.observations)),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_DUPLICATE_OBS_STATUS_XML = buildFrbH15SdmxRawXml({
  dataSetBody: [
    seriesBlockWithRawObs('RIFLGFCY30_N.B', [
      '<frb:Obs OBS_STATUS="A" OBS_STATUS="ND" OBS_VALUE="4.97" TIME_PERIOD="2026-07-01" />',
    ]),
    ...requiredSeriesBlocks()
      .filter((s) => s.name !== 'RIFLGFCY30_N.B')
      .map((s) => seriesBlock(s.name, s.observations)),
  ].join('\n'),
});

export const FIXTURE_H15_SDMX_STORED_ZIP = buildMinimalZip([
  { name: FRB_H15_ZIP_DATA_MEMBER, content: FIXTURE_H15_SDMX_VALID_XML, deflate: false },
]);

export const FIXTURE_H15_SDMX_CRC_MISMATCH_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: FIXTURE_H15_SDMX_VALID_XML,
    deflate: true,
    crc32Override: 0xdeadbeef,
  },
]);

export const FIXTURE_H15_SDMX_ENCRYPTED_FLAG_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: FIXTURE_H15_SDMX_VALID_XML,
    deflate: true,
    flags: 0x0001,
  },
]);

export const FIXTURE_H15_SDMX_DATA_DESCRIPTOR_FLAG_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: FIXTURE_H15_SDMX_VALID_XML,
    deflate: true,
    flags: 0x0008,
  },
]);

export const FIXTURE_H15_SDMX_ZIP64_SIZE_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: FIXTURE_H15_SDMX_VALID_XML,
    deflate: true,
    uncompressedSizeOverride: 0xffffffff,
  },
]);

export const FIXTURE_H15_SDMX_OVERSIZE_DECLARED_ZIP = buildMinimalZip([
  {
    name: FRB_H15_ZIP_DATA_MEMBER,
    content: FIXTURE_H15_SDMX_VALID_XML,
    deflate: true,
    uncompressedSizeOverride: FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES + 1,
  },
]);

export const FIXTURE_H15_SDMX_UNEXPECTED_TRAILING_ZIP = buildMinimalZip(
  [{ name: FRB_H15_ZIP_DATA_MEMBER, content: FIXTURE_H15_SDMX_VALID_XML, deflate: true }],
  Uint8Array.from([0xef, 0xbe, 0xad, 0xde])
);

export function fixtureZipSha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export const FIXTURE_H15_SDMX_VALID_ZIP_SHA256 = fixtureZipSha256(FIXTURE_H15_SDMX_VALID_ZIP);

export const FRB_H15_SDMX_TEST_SOURCE_LOCATOR = FRB_H15_SDMX_SOURCE_LOCATOR;
