import { ACCENTS, normalizeConfig } from './core.mjs';
export function createHistory(input){return {past:[],present:normalizeConfig(input),future:[]};}
export function recordEdit(history,input){const next=normalizeConfig(input);if(JSON.stringify(next)===JSON.stringify(history.present))return history;return {past:[...history.past,history.present].slice(-40),present:next,future:[]};}
export function undoHistory(h){if(!h.past.length)return h;return {past:h.past.slice(0,-1),present:h.past.at(-1),future:[h.present,...h.future].slice(0,40)};}
export function redoHistory(h){if(!h.future.length)return h;return {past:[...h.past,h.present].slice(-40),present:h.future[0],future:h.future.slice(1)};}
export function serializeProject(configuration,checkpoint){return JSON.stringify({kind:'blue-nebula-project',version:1,configuration:normalizeConfig(configuration),checkpoint:normalizeConfig(checkpoint),note:'Browser-local concept project. No repository or AI model is connected.'},null,2);}
export function parseProject(text){
  if(typeof text!=='string'||text.length>65536)throw Error('Choose a Blue Nebula project JSON smaller than 64 KB.');
  let data;try{data=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!object(data)||data.version!==1||data.kind!=='blue-nebula-project'||!object(data.configuration)||data.checkpoint!==undefined&&!object(data.checkpoint))throw Error('This is not a supported Blue Nebula project (version 1).');
  for(const config of [data.configuration,data.checkpoint].filter(Boolean)){
    for(const [field,max] of [['title',80],['description',160],['buttonLabel',40]])if(config[field]!==undefined&&(typeof config[field]!=='string'||config[field].length>max))throw Error(`Invalid ${field}: expected text up to ${max} characters.`);
    for(const [field,min,max] of [['gap',8,32],['radius',0,32]])if(config[field]!==undefined&&(typeof config[field]!=='number'||!Number.isFinite(config[field])||config[field]<min||config[field]>max))throw Error(`Invalid ${field}: expected a number from ${min} to ${max}.`);
    for(const field of ['localOnly','notifications'])if(config[field]!==undefined&&typeof config[field]!=='boolean')throw Error(`Invalid ${field}: expected true or false.`);
    if(config.template!==undefined&&!['welcome','dashboard','settings'].includes(config.template))throw Error('Unknown screen template.');
    if(config.accent!==undefined&&(typeof config.accent!=='string'||!Object.hasOwn(ACCENTS,config.accent)))throw Error('Unknown accent token.');
  }
  return {configuration:normalizeConfig(data.configuration),checkpoint:normalizeConfig(data.checkpoint||data.configuration)};
}
export function parseWorkspaceRequest(text){const value=String(text).toLowerCase();if(/\bsettings?\b|\bpreferences?\b/.test(value))return 'settings';if(/\bdashboard\b|\boverview\b/.test(value))return 'dashboard';if(/\bwelcome\b|\bonboarding\b/.test(value))return 'welcome';return null;}
export function createUnifiedDiff(before,after){
  if(before===after)return '';
  const lines=s=>s?s.replace(/\n$/,'').split('\n'):[],a=lines(before),b=lines(after);
  let start=0,tail=0;while(start<Math.min(a.length,b.length)&&a[start]===b[start])start++;
  while(tail<Math.min(a.length,b.length)-start&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
  const from=Math.max(0,start-3),aEnd=Math.min(a.length,a.length-tail+3),bEnd=Math.min(b.length,b.length-tail+3);
  const body=[...a.slice(from,start).map(s=>' '+s),...a.slice(start,a.length-tail).map(s=>'-'+s),...b.slice(start,b.length-tail).map(s=>'+'+s),...a.slice(a.length-tail,aEnd).map(s=>' '+s)];
  return `diff --git a/src/components/WorkspaceScreen.jsx b/src/components/WorkspaceScreen.jsx\n--- a/src/components/WorkspaceScreen.jsx\n+++ b/src/components/WorkspaceScreen.jsx\n@@ -${from+1},${aEnd-from} +${from+1},${bEnd-from} @@\n${body.join('\n')}\n`;
}
