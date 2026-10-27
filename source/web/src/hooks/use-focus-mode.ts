import { useCallback, useEffect, useState } from "react";

const FOCUS_MODE_KEY = "canvas-focus-mode-v2";
const SMALL_SCREEN_BREAKPOINT = 1024;

// 默认策略：小屏自动沉浸；用户仍可手动退出。
// 用户手动切换后以持久化偏好为准，窗口缩放不再覆盖用户选择。
function readInitialPreference(): boolean | null {
    const stored = window.localStorage.getItem(FOCUS_MODE_KEY);
    if (stored !== null) return stored === "true";
    return null;
}

export function resolveFocusMode(preference: boolean | null, smallScreen: boolean) {
    return preference ?? smallScreen;
}

export function useFocusMode() {
    const [userPreference, setUserPreference] = useState<boolean | null>(readInitialPreference);
    const [smallScreen, setSmallScreen] = useState<boolean>(() => window.innerWidth < SMALL_SCREEN_BREAKPOINT);

    const focusMode = resolveFocusMode(userPreference, smallScreen);

    useEffect(() => {
        const handleResize = () => setSmallScreen(window.innerWidth < SMALL_SCREEN_BREAKPOINT);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const persist = useCallback((next: boolean) => {
        setUserPreference(next);
        try {
            window.localStorage.setItem(FOCUS_MODE_KEY, String(next));
        } catch {
            // 忽略 localStorage 不可用场景，专注模式仍可在本次会话生效。
        }
    }, []);

    const enterFocusMode = useCallback(() => persist(true), [persist]);
    const exitFocusMode = useCallback(() => persist(false), [persist]);
    const toggleFocusMode = useCallback(() => persist(!focusMode), [persist, focusMode]);

    return {
        focusMode,
        enterFocusMode,
        exitFocusMode,
        toggleFocusMode,
    };
}
