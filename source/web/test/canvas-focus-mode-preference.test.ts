import { expect, test } from "bun:test";
import { resolveFocusMode } from "../src/hooks/use-focus-mode";
test("小屏默认进入专注模式，宽屏默认退出", () => {
    expect(resolveFocusMode(null,true)).toBe(true);
    expect(resolveFocusMode(null,false)).toBe(false);
});
test("手动退出优先于小屏默认，缩放窗口不能重新覆盖选择", () => {
    expect(resolveFocusMode(false,true)).toBe(false);
    expect(resolveFocusMode(false,false)).toBe(false);
    expect(resolveFocusMode(true,true)).toBe(true);
    expect(resolveFocusMode(true,false)).toBe(true);
});
