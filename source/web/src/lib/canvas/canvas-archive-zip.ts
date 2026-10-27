import { Inflate } from "fflate";

// No product-level media/archive size cap. ZIP64 sizes must remain exactly
// representable in JavaScript; actual capacity depends on the browser and disk.
export const CANVAS_ARCHIVE_MAX_BYTES = Number.MAX_SAFE_INTEGER;
const MAX_ENTRY_BYTES = Number.MAX_SAFE_INTEGER;
const MAX_TOTAL_BYTES = Number.MAX_SAFE_INTEGER;
const MAX_ENTRIES = 50_000;
const MAX_DIRECTORY_BYTES = 32 * 1024 ** 2;
export const CANVAS_ARCHIVE_METADATA_MAX_BYTES = 64 * 1024 ** 2;
const BLOCK_BYTES = 1024 ** 2;
const U32_MAX = 0xffffffff;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
    let crc = value;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    return crc >>> 0;
});
function crcUpdate(crc: number, bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 255];
    return crc >>> 0;
}
function validName(name: string) {
    if (!name || name.includes("\\") || name.includes("\0") || name.startsWith("/") || /^[a-z]:/i.test(name) || name.split("/").some((part) => part === "..")) throw new Error("ZIP 包含无效文件路径");
    return name;
}
function number64(view: DataView, offset: number) {
    if (offset < 0 || offset + 8 > view.byteLength) throw new Error("ZIP64 字段不完整");
    const value = view.getBigUint64(offset, true);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("ZIP64 数值超过本机可处理范围");
    return Number(value);
}
async function bytesAt(file: Blob, offset: number, length: number) {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > file.size) throw new Error("ZIP 文件不完整或索引越界");
    return new Uint8Array(await file.slice(offset, offset + length).arrayBuffer());
}
async function crcBlob(blob: Blob) {
    let crc = U32_MAX;
    for (let offset = 0; offset < blob.size; offset += BLOCK_BYTES) {
        crc = crcUpdate(crc, await bytesAt(blob, offset, Math.min(BLOCK_BYTES, blob.size - offset)));
    }
    return (crc ^ U32_MAX) >>> 0;
}
export type CanvasArchiveEntry = { size: number; blob(): Promise<Blob>; text(): Promise<string> };

/** Read only the central directory; materialize and verify one media file on demand. */
export async function openCanvasArchive(file: Blob): Promise<Map<string, CanvasArchiveEntry>> {
    if (!Number.isSafeInteger(file.size) || file.size > CANVAS_ARCHIVE_MAX_BYTES) throw new Error("画布压缩包大小超过当前运行环境可准确处理的范围");
    if (file.size < 22) throw new Error("ZIP 文件不完整");
    const tailStart = Math.max(0, file.size - 65_557);
    const tail = await bytesAt(file, tailStart, file.size - tailStart);
    const endView = new DataView(tail.buffer);
    let end = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
        if (endView.getUint32(i, true) === 0x06054b50 && i + 22 + endView.getUint16(i + 20, true) === tail.length) {
            end = i;
            break;
        }
    }
    if (end < 0) throw new Error("ZIP 缺少完整目录，文件可能未下载完成");
    if (endView.getUint16(end + 4, true) || endView.getUint16(end + 6, true)) throw new Error("不支持分卷 ZIP，请先合并全部分卷");
    let count = endView.getUint16(end + 10, true);
    let directoryBytes = endView.getUint32(end + 12, true);
    let directoryOffset = endView.getUint32(end + 16, true);
    let directoryBoundary = tailStart + end;
    if (count === 0xffff || directoryBytes === U32_MAX || directoryOffset === U32_MAX) {
        const locator = new DataView((await bytesAt(file, directoryBoundary - 20, 20)).buffer);
        if (locator.getUint32(0, true) !== 0x07064b50 || locator.getUint32(4, true) !== 0 || locator.getUint32(16, true) !== 1) throw new Error("ZIP64 目录无效或未合并分卷");
        directoryBoundary = number64(locator, 8);
        const z64 = new DataView((await bytesAt(file, directoryBoundary, 56)).buffer);
        if (z64.getUint32(0, true) !== 0x06064b50 || z64.getUint32(16, true) || z64.getUint32(20, true) || number64(z64, 24) !== number64(z64, 32)) throw new Error("ZIP64 目录无效");
        count = number64(z64, 32);
        directoryBytes = number64(z64, 40);
        directoryOffset = number64(z64, 48);
    } else if (endView.getUint16(end + 8, true) !== count) throw new Error("ZIP 分卷目录不完整");
    if (count > MAX_ENTRIES || directoryBytes > MAX_DIRECTORY_BYTES) throw new Error("画布 ZIP 文件条目过多");
    if (directoryOffset + directoryBytes > directoryBoundary) throw new Error("ZIP 目录越界");
    const raw = await bytesAt(file, directoryOffset, directoryBytes);
    const view = new DataView(raw.buffer);
    const entries = new Map<string, CanvasArchiveEntry>();
    let cursor = 0,
        totalBytes = 0;
    for (let index = 0; index < count; index++) {
        if (cursor + 46 > raw.length || view.getUint32(cursor, true) !== 0x02014b50) throw new Error("ZIP 目录损坏");
        const flags = view.getUint16(cursor + 8, true),
            method = view.getUint16(cursor + 10, true),
            expectedCrc = view.getUint32(cursor + 16, true);
        let compressed = view.getUint32(cursor + 20, true),
            size = view.getUint32(cursor + 24, true),
            localOffset = view.getUint32(cursor + 42, true);
        const nameLength = view.getUint16(cursor + 28, true),
            extraLength = view.getUint16(cursor + 30, true),
            commentLength = view.getUint16(cursor + 32, true);
        const next = cursor + 46 + nameLength + extraLength + commentLength;
        if (next > raw.length || view.getUint16(cursor + 34, true)) throw new Error("ZIP 条目不完整或属于未合并分卷");
        const nameBytes = raw.slice(cursor + 46, cursor + 46 + nameLength);
        const name = validName(decoder.decode(nameBytes));
        if (flags & (1 | 0x40) || (method !== 0 && method !== 8)) throw new Error(`ZIP 含加密或不支持的文件：${name}`);
        let found64 = false;
        for (let p = cursor + 46 + nameLength; p < cursor + 46 + nameLength + extraLength;) {
            if (p + 4 > cursor + 46 + nameLength + extraLength) throw new Error("ZIP 扩展字段损坏");
            const tag = view.getUint16(p, true),
                length = view.getUint16(p + 2, true);
            p += 4;
            if (p + length > cursor + 46 + nameLength + extraLength) throw new Error("ZIP 扩展字段越界");
            if (tag === 1) {
                const extra = new DataView(raw.buffer, p, length);
                let q = 0;
                found64 = true;
                if (size === U32_MAX) {
                    size = number64(extra, q);
                    q += 8;
                }
                if (compressed === U32_MAX) {
                    compressed = number64(extra, q);
                    q += 8;
                }
                if (localOffset === U32_MAX) localOffset = number64(extra, q);
            }
            p += length;
        }
        if (!found64 && [size, compressed, localOffset].includes(U32_MAX)) throw new Error("ZIP64 条目缺少大小信息");
        totalBytes += size;
        if (!Number.isSafeInteger(totalBytes) || totalBytes > MAX_TOTAL_BYTES) throw new Error("ZIP 文件总量超过当前运行环境可准确处理的范围");
        if (localOffset + 30 + compressed > directoryOffset) throw new Error(`ZIP 媒体索引越界：${name}`);
        if (method === 0 && compressed !== size) throw new Error(`ZIP 媒体大小不匹配：${name}`);
        if (entries.has(name)) throw new Error(`ZIP 中存在重复路径：${name}`);
        const blob = async () => {
            const local = new DataView((await bytesAt(file, localOffset, 30)).buffer);
            if (local.getUint32(0, true) !== 0x04034b50 || local.getUint16(8, true) !== method || local.getUint16(6, true) !== flags) throw new Error(`ZIP 本地文件头不匹配：${name}`);
            const localNameLength = local.getUint16(26, true),
                localExtraLength = local.getUint16(28, true);
            const actualName = await bytesAt(file, localOffset + 30, localNameLength);
            if (decoder.decode(actualName) !== name) throw new Error(`ZIP 本地路径不匹配：${name}`);
            const start = localOffset + 30 + localNameLength + localExtraLength;
            if (start + compressed > directoryOffset) throw new Error(`ZIP 文件内容越界：${name}`);
            const content = file.slice(start, start + compressed);
            if (method === 0) {
                if ((await crcBlob(content)) !== expectedCrc) throw new Error(`ZIP 文件校验失败：${name}`);
                return content;
            }
            const parts: BlobPart[] = [];
            let written = 0,
                crc = U32_MAX;
            const inflate = new Inflate((chunk) => {
                written += chunk.length;
                if (written > size || written > MAX_ENTRY_BYTES) throw new Error(`ZIP 文件解压超过声明大小：${name}`);
                crc = crcUpdate(crc, chunk);
                parts.push(chunk.slice());
            });
            for (let offset = 0; offset < compressed; offset += 64 * 1024) {
                const end = Math.min(compressed, offset + 64 * 1024);
                inflate.push(await bytesAt(content, offset, end - offset), end === compressed);
            }
            if (!compressed) inflate.push(new Uint8Array(), true);
            if (written !== size || (crc ^ U32_MAX) >>> 0 !== expectedCrc) throw new Error(`ZIP 文件解压校验失败：${name}`);
            return new Blob(parts);
        };
        entries.set(name, {
            size,
            blob,
            text: async () => {
                if (size > CANVAS_ARCHIVE_METADATA_MAX_BYTES) throw new Error(`画布元数据超过 64 MiB：${name}`);
                return (await blob()).text();
            },
        });
        cursor = next;
    }
    if (cursor !== directoryBytes) throw new Error("ZIP 目录长度不匹配");
    return entries;
}

/** Store existing media blobs directly; never allocate one ArrayBuffer for the whole ZIP. */
export async function createCanvasArchive(files: Array<{ name: string; data: BlobPart }>) {
    if (files.length > MAX_ENTRIES) throw new Error("画布文件超过 50000 项，请按画布分开导出");
    const parts: BlobPart[] = [],
        central: BlobPart[] = [],
        names = new Set<string>();
    let offset = 0,
        centralSize = 0;
    const put = (bytes: BlobPart, length: number) => {
        parts.push(bytes);
        offset += length;
        if (!Number.isSafeInteger(offset) || offset > CANVAS_ARCHIVE_MAX_BYTES) throw new Error("画布 ZIP 超过当前运行环境可准确处理的范围");
    };
    for (const file of files) {
        validName(file.name);
        if (names.has(file.name)) throw new Error(`画布导出文件路径重复：${file.name}`);
        names.add(file.name);
        const content = file.data instanceof Blob ? file.data : new Blob([file.data]);
        if (content.size > MAX_ENTRY_BYTES || (file.name === "projects.json" && content.size > CANVAS_ARCHIVE_METADATA_MAX_BYTES)) throw new Error(`画布文件超过导入可支持的大小：${file.name}`);
        const name = encoder.encode(file.name);
        if (name.length > 65535) throw new Error("画布导出文件名过长");
        const crc = await crcBlob(content),
            localOffset = offset;
        const largeSize = content.size >= U32_MAX;
        const header = new Uint8Array(30 + name.length + (largeSize ? 20 : 0)),
            h = new DataView(header.buffer);
        h.setUint32(0, 0x04034b50, true);
        h.setUint16(4, largeSize ? 45 : 20, true);
        h.setUint16(6, 0x800, true);
        h.setUint16(12, 33, true);
        h.setUint32(14, crc, true);
        h.setUint32(18, largeSize ? U32_MAX : content.size, true);
        h.setUint32(22, largeSize ? U32_MAX : content.size, true);
        h.setUint16(26, name.length, true);
        h.setUint16(28, largeSize ? 20 : 0, true);
        header.set(name, 30);
        if (largeSize) {
            const at = 30 + name.length;
            h.setUint16(at, 1, true);
            h.setUint16(at + 2, 16, true);
            h.setBigUint64(at + 4, BigInt(content.size), true);
            h.setBigUint64(at + 12, BigInt(content.size), true);
        }
        put(header, header.length);
        put(content, content.size);
        const largeOffset = localOffset >= U32_MAX;
        const extraBytes = (largeSize ? 16 : 0) + (largeOffset ? 8 : 0);
        const record = new Uint8Array(46 + name.length + (extraBytes ? extraBytes + 4 : 0)),
            c = new DataView(record.buffer);
        c.setUint32(0, 0x02014b50, true);
        c.setUint16(4, extraBytes ? 45 : 20, true);
        c.setUint16(6, extraBytes ? 45 : 20, true);
        c.setUint16(8, 0x800, true);
        c.setUint16(14, 33, true);
        c.setUint32(16, crc, true);
        c.setUint32(20, largeSize ? U32_MAX : content.size, true);
        c.setUint32(24, largeSize ? U32_MAX : content.size, true);
        c.setUint16(28, name.length, true);
        c.setUint16(30, extraBytes ? extraBytes + 4 : 0, true);
        c.setUint32(42, largeOffset ? U32_MAX : localOffset, true);
        record.set(name, 46);
        if (extraBytes) {
            const at = 46 + name.length;
            c.setUint16(at, 1, true);
            c.setUint16(at + 2, extraBytes, true);
            let position = at + 4;
            if (largeSize) {
                c.setBigUint64(position, BigInt(content.size), true);
                c.setBigUint64(position + 8, BigInt(content.size), true);
                position += 16;
            }
            if (largeOffset) c.setBigUint64(position, BigInt(localOffset), true);
        }
        central.push(record);
        centralSize += record.length;
    }
    if (centralSize > MAX_DIRECTORY_BYTES) throw new Error("画布文件索引过大，请按画布分开导出");
    const centralOffset = offset;
    for (const record of central) put(record, (record as Uint8Array).byteLength);
    if (centralOffset >= U32_MAX || centralSize >= U32_MAX || files.length >= 0xffff) {
        const zip64Offset = offset,
            z = new Uint8Array(56),
            v = new DataView(z.buffer);
        v.setUint32(0, 0x06064b50, true);
        v.setBigUint64(4, BigInt(44), true);
        v.setUint16(12, 45, true);
        v.setUint16(14, 45, true);
        v.setBigUint64(24, BigInt(files.length), true);
        v.setBigUint64(32, BigInt(files.length), true);
        v.setBigUint64(40, BigInt(centralSize), true);
        v.setBigUint64(48, BigInt(centralOffset), true);
        put(z, z.length);
        const locator = new Uint8Array(20),
            l = new DataView(locator.buffer);
        l.setUint32(0, 0x07064b50, true);
        l.setBigUint64(8, BigInt(zip64Offset), true);
        l.setUint32(16, 1, true);
        put(locator, locator.length);
    }
    const end = new Uint8Array(22),
        e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, Math.min(files.length, 0xffff), true);
    e.setUint16(10, Math.min(files.length, 0xffff), true);
    e.setUint32(12, Math.min(centralSize, U32_MAX), true);
    e.setUint32(16, Math.min(centralOffset, U32_MAX), true);
    put(end, end.length);
    return new Blob(parts, { type: "application/zip" });
}
