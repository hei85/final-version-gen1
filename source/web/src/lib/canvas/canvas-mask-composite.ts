export function assertMaskAspectRatio(sourceWidth: number, sourceHeight: number, resultWidth: number, resultHeight: number) {
    if (![sourceWidth, sourceHeight, resultWidth, resultHeight].every((n) => Number.isFinite(n) && n > 0)) throw new Error("局部重绘缺少真实图片尺寸");
    if (Math.abs((resultWidth / resultHeight) / (sourceWidth / sourceHeight) - 1) > 0.01) throw new Error("局部重绘画幅必须与原图一致；已拒绝改变构图的结果，请使用原图画幅");
}

export function protectedMaskPixels(source: Uint8ClampedArray, result: Uint8ClampedArray, mask: Uint8ClampedArray) {
    if (source.length !== result.length || source.length !== mask.length || source.length % 4) throw new Error("蒙版合成像素尺寸不一致");
    const output = new Uint8ClampedArray(source);
    for (let i = 0; i < output.length; i += 4) {
        const editWeight = 1 - mask[i + 3] / 255;
        if (!editWeight) continue;
        const sourceAlpha = source[i + 3] / 255, resultAlpha = result[i + 3] / 255;
        const alpha = sourceAlpha * (1 - editWeight) + resultAlpha * editWeight;
        for (let ch = 0; ch < 3; ch++) output[i + ch] = alpha ? (source[i + ch] * sourceAlpha * (1 - editWeight) + result[i + ch] * resultAlpha * editWeight) / alpha : 0;
        output[i + 3] = alpha * 255;
    }
    return output;
}
