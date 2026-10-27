import {readFileSync, writeFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {VideoSettingsPanel} from "../src/components/video-settings-panel";
import {canvasThemes} from "../src/lib/canvas-theme";
import {VIDEO_RESOLUTION_INFERRED_HINT} from "../src/lib/video-generation-options";
import {defaultConfig, normalizeConfigSnapshot, type ModelChannel} from "../src/stores/use-config-store";

const directory = "D:/HU/workspace/output/h3-resolution-validation-20261008";
const repaired = process.argv.includes("--relay-repaired");
const modelFile = repaired ? "models-after-relay-repair.json" : "models-after-final-probe.json";
const prefix = repaired ? "relay-repaired-" : "";
const models = JSON.parse(readFileSync(`${directory}/${modelFile}`,"utf8").replace(/^\uFEFF/,"")).data.models;
const channel: ModelChannel = {
  id:"CHANNEL_000003", name:"Axon", apiKey:"system", baseUrl:"/api/ai/system/CHANNEL_000003", apiFormat:"openai",
  models:models.map((item:any)=>item.modelKey),
  modelCosts:models.map((item:any)=>({model:item.modelKey,protocol:item.protocol,capability:item.capability,capabilityConfig:item.capabilityConfig}))
} as ModelChannel;
const checks: any[] = [];
for (const item of models.filter((value:any)=>value.capability==="video")) {
  const tiers = item.id==="MODEL_000174" ? ["768P","2K"] : [item.capabilityConfig?.video?.defaultResolution || "auto"];
  for (const tier of tiers) {
    const selector = `${channel.id}::${item.modelKey}`;
    const config = normalizeConfigSnapshot({config:{...defaultConfig,model:selector,videoModel:selector,
      size:item.capabilityConfig?.video?.defaultRatio || "16:9",vquality:tier,channels:[channel]}}).config;
    const markup = renderToStaticMarkup(<VideoSettingsPanel config={config} onConfigChange={()=>{}} theme={canvasThemes.light}/>);
    const check = {modelId:item.id,tier,rendered:true,untestedNotice:markup.includes(VIDEO_RESOLUTION_INFERRED_HINT),mismatchNotice:markup.includes("768×1344")};
    if (item.id==="MODEL_000174") {
      if (check.untestedNotice || check.mismatchNotice===repaired) throw new Error(`Actual evidence not shown for ${tier}`);
      writeFileSync(`${directory}/${prefix}actual-h3-${tier.toLowerCase()}-settings.html`,markup);
    }
    checks.push(check);
  }
}
writeFileSync(`${directory}/${prefix}actual-model-controls-check.json`,JSON.stringify({source:"actual configured Axon models",browserClicksVerified:false,checks},null,2));
console.log(JSON.stringify({configuredModels:models.length,videoModels:models.filter((item:any)=>item.capability==="video").length,controlsRendered:checks.length,h3:checks.filter(value=>value.modelId==="MODEL_000174"),browserClicksVerified:false}));
