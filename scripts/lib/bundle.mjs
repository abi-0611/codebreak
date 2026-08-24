/**
 * A deterministic ZIP writer.
 *
 * `/house` offers the identity as real files, and rule 8 means the links have
 * to resolve to something a person can actually open. That needs an archive,
 * and an archive needs either a dependency or about a hundred lines. This is
 * the hundred lines.
 *
 * WHY NOT A DEPENDENCY. Every archiver on npm stamps the current time into
 * every entry, which makes the output different on every run. CLAUDE.md's
 * standing property for this repository is that a generator run twice produces
 * no diff — a generator that churns its output is a generator nobody re-runs,
 * and one that churns a binary is one nobody can review either. Fixing the
 * clock is the only thing this file does that an off-the-shelf writer does
 * not, and it is the whole reason it exists.
 *
 * DETERMINISM, precisely:
 *
 *   · the DOS timestamp on every entry is the epoch of the format itself,
 *     1980-01-01 00:00, not the wall clock;
 *   · entries are written in the order given, never sorted by the filesystem;
 *   · `deflateRawSync` at a stated level is a pure function of its input, so
 *     the same bytes in produce the same bytes out on any machine;
 *   · an entry that deflates no smaller than it started is STORED instead,
 *     which is both smaller and a stable decision rather than a size race.
 *
 * The format written is the original PKZIP one — local headers, then a central
 * directory, then the end record. No ZIP64, no data descriptors, no encryption.
 * Nothing the house ships is anywhere near the 4 GB or 65,535-entry ceilings
 * those exist to lift.
 */
import { deflateRawSync } from 'node:zlib'

/** 1980-01-01 00:00, the earliest moment the format can express. */
const DOS_DATE = (1980 - 1980) * 512 + 1 * 32 + 1
const DOS_TIME = 0

/** Deflate, per entry. 8 is deflate; 0 is stored. */
const DEFLATED = 8
const STORED = 0

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

/** CRC-32/ISO-HDLC, which is the checksum the format specifies. */
function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

/**
 * Builds one archive.
 *
 * `entries` is `[{ name, data }]`, where `name` is the path INSIDE the archive
 * — always forward slashes, whatever the host platform writes — and `data` is
 * a Buffer or a string.
 */
export function bundle(entries) {
  const parts = []
  const central = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name.split('\\').join('/'), 'utf8')
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8')
    const sum = crc32(raw)

    const packed = deflateRawSync(raw, { level: 9 })
    const smaller = packed.length < raw.length
    const method = smaller ? DEFLATED : STORED
    const body = smaller ? packed : raw

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed: 2.0
    local.writeUInt16LE(0, 6) // flags — none. No data descriptor, no utf8 bit needed for ASCII names.
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(sum, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28) // no extra field — an extra field is where writers hide timestamps

    parts.push(local, name, body)

    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(20, 4) // version made by
    dir.writeUInt16LE(20, 6) // version needed
    dir.writeUInt16LE(0, 8)
    dir.writeUInt16LE(method, 10)
    dir.writeUInt16LE(DOS_TIME, 12)
    dir.writeUInt16LE(DOS_DATE, 14)
    dir.writeUInt32LE(sum, 16)
    dir.writeUInt32LE(body.length, 20)
    dir.writeUInt32LE(raw.length, 24)
    dir.writeUInt16LE(name.length, 28)
    dir.writeUInt16LE(0, 30) // extra length
    dir.writeUInt16LE(0, 32) // comment length
    dir.writeUInt16LE(0, 34) // disk number
    dir.writeUInt16LE(0, 36) // internal attributes
    dir.writeUInt32LE(0, 38) // external attributes
    dir.writeUInt32LE(offset, 42)

    central.push(dir, name)
    offset += local.length + name.length + body.length
  }

  const directory = Buffer.concat(central)

  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4) // this disk
  end.writeUInt16LE(0, 6) // disk the directory starts on
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20) // no archive comment

  return Buffer.concat([...parts, directory, end])
}
