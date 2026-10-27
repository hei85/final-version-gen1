export type PortraitSearchCandidate = {
    originalRank: number;
    title: string;
    imageUrl: string;
    sourcePageUrl?: string;
    sourceDomain?: string;
};
export declare class PortraitBaiduSearchError extends Error {
    readonly code: "portrait_search_captcha" | "portrait_search_layout_changed" | "portrait_search_browser_unavailable";
    constructor(code: "portrait_search_captcha" | "portrait_search_layout_changed" | "portrait_search_browser_unavailable", message: string);
}
export type PortraitBrowserStatus = {
    available: boolean;
    executablePath?: string;
    browserName?: string;
};
export declare function detectPortraitBrowser(): Promise<PortraitBrowserStatus>;
export declare function searchBaiduByImage(queryPath: string, options: {
    maxCandidates: number;
    scrolls: number;
    visible: boolean;
    signal?: AbortSignal;
}): Promise<PortraitSearchCandidate[]>;
