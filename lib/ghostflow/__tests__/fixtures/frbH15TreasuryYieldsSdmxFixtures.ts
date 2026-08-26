/**
 * Board H.15 SDMX/XML adapter fixtures (synthetic XML + in-memory ZIP; no live downloads).
 */

import { createHash } from 'crypto';
import { deflateRawSync } from 'zlib';
import { FRB_H15_SDMX_SOURCE_LOCATOR } from '../../refresh/adapters/frbH15TreasuryYieldsSdmxMeta';
import { FRB_H15_ZIP_DATA_MEMBER } from '../../refresh/adapters/frbH15ZipMember';

export { ADAPTER_TEST_NOW_ISO } from './frbH15TreasuryYieldsFixtures';

const SDMX_HEADER =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<message:MessageGroup xmlns:message="http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message">\n' +
  '<message:Header/>\n' +
  '<message:DataSet>\n';

const SDMX_FOOTER = '</message:DataSet>\n</message:MessageGroup>\n';

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
  return `${SDMX_HEADER}${blocks.join('\n')}\n${SDMX_FOOTER}`;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]!;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Build a minimal ZIP archive in memory (stored or DEFLATE raw). */
export function buildMinimalZip(
  entries: Array<{ name: string; content: Uint8Array | string; deflate?: boolean }>
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
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc32(payload), 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(payload.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    nameBuf.copy(header, 30);
    chunks.push(header, compressed);
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

export function fixtureZipSha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export const FIXTURE_H15_SDMX_VALID_ZIP_SHA256 = fixtureZipSha256(FIXTURE_H15_SDMX_VALID_ZIP);

export const FRB_H15_SDMX_TEST_SOURCE_LOCATOR = FRB_H15_SDMX_SOURCE_LOCATOR;
