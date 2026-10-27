import { expect, test } from "bun:test";
import { existingGridSplit, gridSplitVersionKey } from "../src/lib/canvas/canvas-grid-split-reuse";
import { CanvasNodeType, type CanvasNodeData } from "../src/types/canvas";
const source: CanvasNodeData = { id: "source", type: CanvasNodeType.Image, position: {x:0,y:0}, width:100, height:100, metadata: {content:"/original",storageKey:"resource:v1"} };
const cells = Array.from({length:4},(_,index): CanvasNodeData => ({ ...source, id:`cut-${index}`, metadata: {content:`/cut-${index}`,storageKey:`resource:cut-${index}`,gridSplit:{key:gridSplitVersionKey(source,2,2),sourceNodeId:source.id,index,rows:2,columns:2}} }));
test("切分按源图版本与参数复用同一组切图", () => {
    expect(existingGridSplit([...cells].reverse(),source,2,2).map(n=>n.id)).toEqual(["cut-0","cut-1","cut-2","cut-3"]);
    expect(existingGridSplit(cells,{...source,metadata:{...source.metadata,storageKey:"resource:v2"}},2,2)).toEqual([]);
    expect(existingGridSplit(cells,source,1,4)).toEqual([]);
});
test("部分缺图不能悄悄重复创建一套", () => {
    expect(()=>existingGridSplit(cells.slice(1),source,2,2)).toThrow(/部分切分/);
});
