import { expect, test } from "bun:test";
import { mediaResultTitle } from "../src/lib/canvas/canvas-media-result-title";
test("原位视频和语音生成保留已有名称",()=> {
    expect(mediaResultTitle("镜头 01｜侧面","@图片1 人物眨眼","Generated Video",true)).toBe("镜头 01｜侧面");
    expect(mediaResultTitle("林舟对白","这是台词","Generated Audio",true)).toBe("林舟对白");
});
test("新派生节点和未命名节点使用提示词或默认名称",()=> {
    expect(mediaResultTitle("源图","新的动作","Generated Video",false)).toBe("新的动作");
    expect(mediaResultTitle(" ","","Generated Video",true)).toBe("Generated Video");
});
