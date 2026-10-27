import { expect, test } from "bun:test";
import { zipSync } from "fflate";
import { createCanvasArchive, openCanvasArchive, CANVAS_ARCHIVE_MAX_BYTES } from "@/lib/canvas/canvas-archive-zip";

test("画布 ZIP 不设置 2/4/6/8 GiB 产品限额", () => {
    expect(CANVAS_ARCHIVE_MAX_BYTES).toBe(Number.MAX_SAFE_INTEGER);
});

test("导出 ZIP 可直接读取中文元数据和媒体，无需手动解压", async () => {
    const bytes = Uint8Array.from({ length: 100000 }, (_, i) => i % 251);
    const archive = await createCanvasArchive([{ name: "projects.json", data: JSON.stringify({ title: "测试画布" }) }, { name: "projects/测试/视频.mp4", data: bytes }]);
    const entries = await openCanvasArchive(archive);
    expect(JSON.parse(await entries.get("projects.json")!.text()).title).toBe("测试画布");
    expect(new Uint8Array(await (await entries.get("projects/测试/视频.mp4")!.blob()).arrayBuffer())).toEqual(bytes);
});

test("兼容压缩的旧 ZIP 并验证 CRC", async () => {
    const archive = zipSync({ "projects.json": new TextEncoder().encode('{"old":true}'), "media.bin": new Uint8Array(1024 * 1024).fill(42) });
    const entries = await openCanvasArchive(new Blob([archive]));
    expect(await entries.get("projects.json")!.text()).toBe('{"old":true}');
    expect((await entries.get("media.bin")!.blob()).size).toBe(1024 * 1024);
});

test("损坏、重复路径与越界数据被拒绝", async () => {
    await expect(createCanvasArchive([{ name: "../outside", data: "x" }])).rejects.toThrow("无效文件路径");
    await expect(createCanvasArchive([{ name: "a", data: "a" }, { name: "a", data: "b" }])).rejects.toThrow("重复");
    const archive = await createCanvasArchive([{ name: "a", data: "abcd" }]);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    bytes[31] ^= 1;
    const entries = await openCanvasArchive(new Blob([bytes]));
    await expect(entries.get("a")!.blob()).rejects.toThrow("校验失败");
    await expect(openCanvasArchive(archive.slice(0, archive.size - 1))).rejects.toThrow();
});

test("读取正常媒体时仅分块读取文件，不对整个 ZIP 调用 arrayBuffer", async () => {
    const archive = await createCanvasArchive([{ name: "media", data: new Uint8Array(3 * 1024 * 1024) }]);
    class FileLikeBlob extends Blob {
        override arrayBuffer(): Promise<ArrayBuffer> { throw new Error("whole archive allocated"); }
    }
    const entries = await openCanvasArchive(new FileLikeBlob([archive]));
    expect((await entries.get("media")!.blob()).size).toBe(3 * 1024 * 1024);
});
