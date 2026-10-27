// Local first-run registration of the exact bundled production skill versions.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin=new URL(process.env.PORTABLE_API_TARGET||'http://127.0.0.1:8080');
if(origin.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(origin.hostname)||origin.username||origin.password)throw Error('Bundled skills may only be registered with the local portable backend');
const base=origin.origin+'/api';
const manifestPath=path.join(root,'bundled-skills','manifest.json');
const raw=fs.readFileSync(manifestPath);const manifest=JSON.parse(raw);
const stateDir=process.env.CANVAS_BACKEND_DATA_DIR||path.join(root,'data');
const stateFile=path.join(stateDir,'bundled-skills-state.json');
async function api(route,options={}){
 const r=await fetch(base+route,{...options,redirect:'error',signal:AbortSignal.timeout(60000)});
 const j=await r.json();if(!r.ok||j.code!==0||!j.data)throw Error(`Local skills operation failed: ${route} HTTP ${r.status}: ${String(j.msg||'').slice(0,200)}`);
 return j.data;
}
const numeric=v=>String(v||'').split('.').map(x=>parseInt(x,10)||0);
const newerOrEqual=(a,b)=>{const x=numeric(a),y=numeric(b);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0);}return true;};
const owned=(await api('/skills?scope=created&pageSize=100&page=1')).skills||[];
const results=[];
const summaries={
 'yingce-film-production':'@衍图 Agent 全自动制作：加载既有剧本到成片完整规则，完成四宫格、四切图、自检返修、剪辑声音和成片交付。',
 'higgsfield':'Higgsfield创作方法与子技能，按衍图真实工具及模型能力适配。',
 'remotion-best-practices':'Remotion视频合成、动画及剪辑参考。',
 'h3-prompt-writing':'MiniMax H3官方提示词方法，按实际输入模式使用。',
 'ffmpeg-ops':'FFmpeg与ffprobe媒体处理、剪辑、变速和混音。'
};
for(const item of manifest.skills){
 const filePath=path.join(root,'bundled-skills',item.file);
 const bytes=fs.readFileSync(filePath);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error(`Bundled skill checksum mismatch: ${item.name}`);
 let skill=owned.find(s=>s.skillName===item.name&&s.isOwner);let action='retained';
 if(!skill){
  const form=new FormData();form.append('file',new Blob([bytes],{type:'application/zip'}),item.file);form.append('sourceType','zip');form.append('isPrivate','false');form.append('name',item.name);form.append('description',summaries[item.name]||item.name);
  skill=(await api('/skills/install',{method:'POST',body:form})).skill;action='installed';
 }else if(skill.contentHash!==item.contentHash&&!newerOrEqual(skill.version,item.version)){
  const form=new FormData();form.append('file',new Blob([bytes],{type:'application/zip'}),item.file);
  skill=(await api(`/skills/${encodeURIComponent(skill.skillId)}/package`,{method:'PUT',body:form})).skill;action='upgraded';
 }else if(skill.contentHash!==item.contentHash){action='preserved_user_version';}
 if(!skill.isAdded)skill=(await api(`/skills/${encodeURIComponent(skill.skillId)}/add`,{method:'POST'})).skill;
 const actual=(await api(`/skills/${encodeURIComponent(skill.skillId)}`)).skill;
 if(!actual.isAdded||!newerOrEqual(actual.version,item.version))throw Error(`Bundled skill is not ready: ${item.name}`);
 if(action!=='preserved_user_version'&&actual.contentHash!==item.contentHash)throw Error(`Installed skill content differs: ${item.name}`);
 results.push({name:item.name,skillId:actual.skillId,version:actual.version,contentHash:actual.contentHash,action});
}
fs.mkdirSync(stateDir,{recursive:true});
fs.writeFileSync(stateFile,JSON.stringify({manifestSha256:crypto.createHash('sha256').update(raw).digest('hex'),registeredAt:new Date().toISOString(),skills:results},null,2));
console.log(JSON.stringify({bundledSkillsReady:results.length,skills:results.map(x=>({name:x.name,version:x.version,action:x.action}))}));
