import type { PortraitClearanceResult } from "./contracts.js";
export type PortraitReportImage = {
    id: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    bytes: Uint8Array;
};
export declare function buildPortraitReports(result: PortraitClearanceResult, images?: readonly PortraitReportImage[]): Promise<{
    markdown: string;
    html: string;
    docx: Uint8Array<ArrayBuffer>;
}>;
