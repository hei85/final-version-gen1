import { describe, expect, test } from "bun:test";
import { createOpenAIVideoTask } from "../src/services/api/video-provider-openai";
import { createH3BridgeVideoTask } from "../src/services/api/video-provider-h3-bridge";
import { videoResponseTools } from "../src/services/api/video-response";
import type { VideoProviderDeps } from "../src/services/api/video-provider-deps";

const pictures = Array.from({length:6}, (_, i) => ({id:`picture-${i}`, name:`${i}.png`, type:"image/png", dataUrl:`data:image/png;base64,${btoa(String(i))}`}));
function setup(protocol="xai-video") {
    let sent: Record<string, any> | undefined;
    const config={interfaceType:protocol,baseUrl:"https://relay.example/v1",apiKey:"test",videoSeconds:"8",size:"16:9",vquality:"768P"} as never;
    const deps={response:videoResponseTools,transport:{apiUrl:(p:string)=>p,post:async (_:string,body:Record<string,any>)=>{sent=body;return {id:"task"};}}} as unknown as VideoProviderDeps;
    return {config,deps,sent:()=>sent};
}
describe("six reference transport",()=>{
    test("generic xAI sends every ordinary image rather than the first only",async()=>{
        const x=setup();await createOpenAIVideoTask(x.deps,x.config,"Minimax-H3","test",pictures);
        expect(x.sent()?.reference_images.map((m:any)=>m.url)).toEqual(pictures.map(p=>p.dataUrl));
        expect(x.sent()?.image).toBeUndefined();
    });
    test("H3 bridge preserves all six identities, ordering and checksums",async()=>{
        const x=setup("yingce-h3-bridge-video");await createH3BridgeVideoTask(x.deps,x.config,"Minimax-H3","test",pictures);
        expect(x.sent()?.bridge_reference_count).toBe(6);
        expect(x.sent()?.reference_images.map((m:any)=>m.url)).toEqual(pictures.map(p=>p.dataUrl));
        expect(x.sent()?.reference_images.every((m:any)=>m.role==="reference_image")).toBe(true);
        expect(x.sent()?.bridge_reference_hashes).toHaveLength(6);
    });
    test("explicit opening remains first_frame and the other five remain references",async()=>{
        const x=setup("yingce-h3-bridge-video");await createH3BridgeVideoTask(x.deps,x.config,"Minimax-H3","test",pictures,{videoStartFrameNodeId:"picture-0"});
        expect(x.sent()?.bridge_image_roles).toEqual(["first_frame",...Array(5).fill("reference_image")]);
    });
    test("oversized multipart requests stop instead of truncating the list",async()=>{
        const x=setup("newapi");await expect(createOpenAIVideoTask(x.deps,x.config,"video","test",[...pictures,...pictures])).rejects.toThrow("不会截断");
        expect(x.sent()).toBeUndefined();
    });
});
