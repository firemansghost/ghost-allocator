/**
 * Narrow in-memory ZIP local-header reader for Board H.15 release archives.
 * Supports stored (0) and DEFLATE raw (8) members only; not a general ZIP parser.
 */

import { inflateRawSync } from 'zlib';

export const FRB_H15_ZIP_DATA_MEMBER = 'H15_data.xml' as const;

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

export type FrbH15ZipExtractResult =
  | { ok: true; memberName: string; bytes: Uint8Array }
  | { ok: false; code: string; message: string };

function fail(code: string, message: string): FrbH15ZipExtractResult {
  return { ok: false, code, message };
}

/**
 * Extract exactly one member by exact filename from a ZIP byte buffer held in memory.
 * Rejects missing, duplicate, malformed, truncated, or unsupported compression.
 */
export function extractFrbH15ZipMember(
  zipBytes: Uint8Array,
  memberName: string = FRB_H15_ZIP_DATA_MEMBER
): FrbH15ZipExtractResult {
  if (zipBytes.byteLength < 30) {
    return fail('h15_zip_malformed', 'Board H.15 ZIP archive is too small to be valid');
  }

  const view = zipBytes instanceof Buffer ? zipBytes : Buffer.from(zipBytes);
  let offset = 0;
  let matchCount = 0;
  let extracted: Uint8Array | null = null;

  while (offset + 30 <= view.length) {
    const signature = view.readUInt32LE(offset);
    if (signature !== LOCAL_FILE_HEADER_SIGNATURE) {
      break;
    }

    const compressionMethod = view.readUInt16LE(offset + 8);
    const compressedSize = view.readUInt32LE(offset + 18);
    const uncompressedSize = view.readUInt32LE(offset + 22);
    const fileNameLength = view.readUInt16LE(offset + 26);
    const extraFieldLength = view.readUInt16LE(offset + 28);

    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > view.length) {
      return fail('h15_zip_truncated', 'Board H.15 ZIP local header is truncated');
    }

    const entryName = view.toString('utf8', nameStart, nameEnd);
    const dataStart = nameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > view.length) {
      return fail('h15_zip_truncated', 'Board H.15 ZIP member payload is truncated');
    }

    if (entryName === memberName) {
      matchCount++;
      const payload = view.subarray(dataStart, dataEnd);
      try {
        if (compressionMethod === 0) {
          extracted = Uint8Array.from(payload);
        } else if (compressionMethod === 8) {
          const inflated = inflateRawSync(payload);
          extracted = Uint8Array.from(inflated);
        } else {
          return fail(
            'h15_zip_unsupported_compression',
            `Board H.15 ZIP member ${memberName} uses unsupported compression method ${compressionMethod}`
          );
        }
      } catch {
        return fail(
          'h15_zip_malformed',
          `Board H.15 ZIP member ${memberName} could not be decompressed`
        );
      }

      if (uncompressedSize > 0 && extracted.byteLength !== uncompressedSize) {
        return fail(
          'h15_zip_malformed',
          `Board H.15 ZIP member ${memberName} decompressed size mismatch`
        );
      }
    }

    offset = dataEnd;
  }

  if (matchCount === 0) {
    return fail(
      'h15_zip_missing_member',
      `Board H.15 ZIP archive is missing required member ${memberName}`
    );
  }
  if (matchCount > 1) {
    return fail(
      'h15_zip_duplicate_member',
      `Board H.15 ZIP archive contains duplicate member ${memberName}`
    );
  }
  if (!extracted) {
    return fail('h15_zip_malformed', 'Board H.15 ZIP member extraction failed');
  }

  return { ok: true, memberName, bytes: extracted };
}
