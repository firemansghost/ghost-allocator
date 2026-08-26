/**
 * Narrow in-memory ZIP local-header reader for Board H.15 release archives.
 * Supports stored (0) and DEFLATE raw (8) members only; not a general ZIP parser.
 */

import { inflateRawSync } from 'zlib';

export const FRB_H15_ZIP_DATA_MEMBER = 'H15_data.xml' as const;

/** Conservative ceiling for H15_data.xml (~70.7 MB observed; 128 MiB headroom). */
export const FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES = 128 * 1024 * 1024;

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP64_SIZE_SENTINEL = 0xffffffff;

/** General-purpose bit flag: encrypted entry. */
const GPBF_ENCRYPTED = 0x0001;
/** General-purpose bit flag: data descriptor follows compressed data. */
const GPBF_DATA_DESCRIPTOR = 0x0008;

export type FrbH15ZipExtractResult =
  | { ok: true; memberName: string; bytes: Uint8Array }
  | { ok: false; code: string; message: string };

function fail(code: string, message: string): FrbH15ZipExtractResult {
  return { ok: false, code, message };
}

/** CRC-32 (PKZIP polynomial) over uncompressed bytes. */
export function crc32Pkzip(buf: Uint8Array | Buffer): number {
  const view = buf instanceof Buffer ? buf : Buffer.from(buf);
  let crc = 0xffffffff;
  for (let i = 0; i < view.length; i++) {
    crc ^= view[i]!;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function isAllowedZipTrailingSignature(signature: number): boolean {
  return (
    signature === CENTRAL_DIRECTORY_SIGNATURE ||
    signature === END_OF_CENTRAL_DIRECTORY_SIGNATURE
  );
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
  let targetHeaderCrc: number | null = null;

  while (offset + 30 <= view.length) {
    const signature = view.readUInt32LE(offset);
    if (signature !== LOCAL_FILE_HEADER_SIGNATURE) {
      break;
    }

    const generalPurposeFlag = view.readUInt16LE(offset + 6);
    if (generalPurposeFlag & GPBF_ENCRYPTED) {
      return fail(
        'h15_zip_unsupported_flags',
        'Board H.15 ZIP entry uses unsupported encrypted flag'
      );
    }
    if (generalPurposeFlag & GPBF_DATA_DESCRIPTOR) {
      return fail(
        'h15_zip_unsupported_flags',
        'Board H.15 ZIP entry uses unsupported data-descriptor flag'
      );
    }

    const compressionMethod = view.readUInt16LE(offset + 8);
    const headerCrc = view.readUInt32LE(offset + 14);
    const compressedSize = view.readUInt32LE(offset + 18);
    const uncompressedSize = view.readUInt32LE(offset + 22);
    const fileNameLength = view.readUInt16LE(offset + 26);
    const extraFieldLength = view.readUInt16LE(offset + 28);

    if (compressedSize === ZIP64_SIZE_SENTINEL || uncompressedSize === ZIP64_SIZE_SENTINEL) {
      return fail(
        'h15_zip_unsupported_zip64',
        'Board H.15 ZIP entry uses unsupported ZIP64 size fields'
      );
    }

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

      if (uncompressedSize > FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES) {
        return fail(
          'h15_zip_member_too_large',
          `Board H.15 ZIP member ${memberName} exceeds maximum uncompressed size`
        );
      }

      const payload = view.subarray(dataStart, dataEnd);
      try {
        if (compressionMethod === 0) {
          if (payload.byteLength > FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES) {
            return fail(
              'h15_zip_member_too_large',
              `Board H.15 ZIP member ${memberName} exceeds maximum uncompressed size`
            );
          }
          extracted = Uint8Array.from(payload);
        } else if (compressionMethod === 8) {
          const inflated = inflateRawSync(payload, {
            maxOutputLength: FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES,
          });
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

      if (extracted.byteLength > FRB_H15_ZIP_MAX_UNCOMPRESSED_BYTES) {
        return fail(
          'h15_zip_member_too_large',
          `Board H.15 ZIP member ${memberName} exceeds maximum uncompressed size`
        );
      }

      if (crc32Pkzip(extracted) !== headerCrc) {
        return fail(
          'h15_zip_crc_mismatch',
          `Board H.15 ZIP member ${memberName} CRC32 does not match local header`
        );
      }

      targetHeaderCrc = headerCrc;
    }

    offset = dataEnd;
  }

  if (offset < view.length) {
    if (offset + 4 > view.length) {
      return fail('h15_zip_malformed', 'Board H.15 ZIP archive has truncated trailing structure');
    }
    const trailingSignature = view.readUInt32LE(offset);
    if (!isAllowedZipTrailingSignature(trailingSignature)) {
      return fail(
        'h15_zip_malformed',
        'Board H.15 ZIP archive has unexpected trailing structure after local entries'
      );
    }
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
  if (!extracted || targetHeaderCrc === null) {
    return fail('h15_zip_malformed', 'Board H.15 ZIP member extraction failed');
  }

  return { ok: true, memberName, bytes: extracted };
}
