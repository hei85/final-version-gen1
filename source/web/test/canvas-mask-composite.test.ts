import { expect, test } from "bun:test";
import { assertMaskAspectRatio, protectedMaskPixels } from "../src/lib/canvas/canvas-mask-composite";
test("蒙版外像素精确保留，透明区域采用生成结果", () => {
    const source = new Uint8ClampedArray([10,20,30,255, 50,60,70,255]);
    const result = new Uint8ClampedArray([100,110,120,255, 150,160,170,255]);
    const mask = new Uint8ClampedArray([255,255,255,255, 255,255,255,0]);
    expect([...protectedMaskPixels(source,result,mask)]).toEqual([10,20,30,255,150,160,170,255]);
    expect([...source]).toEqual([10,20,30,255,50,60,70,255]);
});
test("允许同画幅缩放，拒绝改变构图的返回画幅", () => {
    expect(() => assertMaskAspectRatio(3840,2160,1536,864)).not.toThrow();
    expect(() => assertMaskAspectRatio(3840,2160,1024,1024)).toThrow(/画幅/);
    expect(() => assertMaskAspectRatio(0,0,1024,1024)).toThrow(/尺寸/);
});
test("拒绝错误像素数组尺寸", () => {
    expect(() => protectedMaskPixels(new Uint8ClampedArray(4),new Uint8ClampedArray(8),new Uint8ClampedArray(4))).toThrow(/尺寸/);
});
