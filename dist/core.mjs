export const ACCENTS = { blue: '#459eff', violet: '#a68aff', mint: '#6ddab6' };
export function createDemoState() { return { status: 'idle', step: -1 }; }
export function advanceDemo(state) {
  if (state.status === 'paused' || state.status === 'complete') return state;
  return state.step >= 3 ? { status: 'complete', step: 4 } : { status: 'running', step: state.step + 1 };
}
export function togglePause(state) {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused') return { ...state, status: 'running' };
  return state;
}
export function normalizeConfig(config = {}) {
  return { template:['welcome','dashboard','settings'].includes(config.template)?config.template:'welcome',title:String(config.title??'Make space for great work.').slice(0,80),description:String(config.description??'Your ideas have a place to grow.').slice(0,160),buttonLabel:String(config.buttonLabel??'Open your project').slice(0,40),accent:Object.hasOwn(ACCENTS,config.accent)?config.accent:'blue',gap:Math.max(8,Math.min(32,Number(config.gap)||16)),radius:Math.max(0,Math.min(32,Number.isFinite(Number(config.radius))?Number(config.radius):16)),localOnly:config.localOnly!==false,notifications:config.notifications===true };
}
export function createTemplateConfig(template){
  const presets={welcome:{},dashboard:{template:'dashboard',title:'A clearer view of your work.',description:'An illustrative overview of your next chapter.',buttonLabel:'Explore the project',accent:'violet'},settings:{template:'settings',title:'A workspace that feels like you.',description:'Set the boundaries for this example project.',buttonLabel:'Save preferences',accent:'mint'}};
  return normalizeConfig(presets[template]||presets.welcome);
}
export function generateComponent(input) {
  const c=normalizeConfig(input);
  const detail=c.template==='dashboard'?`      <dl aria-label="Illustrative project metrics">\n        <div><dt>Projects</dt><dd>3</dd></div>\n        <div><dt>Open tasks</dt><dd>7</dd></div>\n        <div><dt>Saved decisions</dt><dd>4</dd></div>\n      </dl>\n`:c.template==='settings'?`      <fieldset>\n        <legend>Example workspace preferences</legend>\n        <label><input type="checkbox" defaultChecked={${c.localOnly}} /> Local-only routing</label>\n        <label><input type="checkbox" defaultChecked={${c.notifications}} /> Activity notifications</label>\n      </fieldset>\n`:'';
  return `export default function WorkspaceScreen() {\n  return (\n    <section\n      aria-label="Project overview"\n      style={{\n        display: "grid",\n        gap: ${c.gap},\n        padding: 32,\n        borderRadius: ${c.radius},\n        background: "#11151f",\n        color: "#f3f5fa",\n      }}\n    >\n      <span style={{ color: "${ACCENTS[c.accent]}" }}>\n        YOUR NEXT CHAPTER\n      </span>\n      <h2>{${JSON.stringify(c.title)}}<\/h2>\n      <p>{${JSON.stringify(c.description)}}<\/p>\n${detail}      <a href="#projects">{${JSON.stringify(c.buttonLabel)}}<\/a>\n    <\/section>\n  );\n}\n`;
}
export function verifyWorkspace(input) {
  const c=normalizeConfig(input);
  return [
    {id:'heading',name:'Meaningful heading',detail:'The card has a non-empty visible heading.',passed:c.title.trim().length > 0},
    {id:'layout',name:'Layout constraints',detail:'Spacing is 8–32 px and corner radius is 0–32 px.',passed:Number(input.gap)>=8&&Number(input.gap)<=32&&(input.radius===undefined||Number(input.radius)>=0&&Number(input.radius)<=32)},
    {id:'tokens',name:'Design token binding',detail:'The accent uses a registered design token.',passed:Object.hasOwn(ACCENTS,input.accent)},
    {id:'link',name:'Accessible action',detail:'Generated JSX includes a non-empty action label.',passed:c.buttonLabel.trim().length>0&&generateComponent(c).includes(`{${JSON.stringify(c.buttonLabel)}}`)},
    {id:'safe',name:'Text serialization',detail:'User text is serialized as a JSX string expression.',passed:generateComponent(c).includes(`{${JSON.stringify(c.title)}}`)}
  ];
}
export function getHardwareProfile(ram) {
  if (ram<16) return {id:'unsupported',name:'Below the proposed minimum',description:'The PRD proposes 16 GB RAM as the starting point. Use this browser demo on any modern device; desktop support still needs qualification.',vram:'Not qualified',disk:'Not qualified',tag:'DISCOVERY REQUIRED'};
  if (ram<32) return {id:'limited',name:'A lighter local workspace',description:'Proposed H0 profile: memory and canvas editing, with a small CPU model on a best-effort basis. Inference speed is not guaranteed.',vram:'CPU inference',disk:'SSD required',tag:'H0 · LIMITED LOCAL'};
  if (ram<64) return {id:'reference',name:'Your personal engineering engine',description:'Proposed H1 reference: one compact local model, project retrieval, and an active engineering task. The exact model will be selected through trials.',vram:'12 GB NVIDIA VRAM',disk:'30 GB free · NVMe',tag:'H1 · REFERENCE INFERENCE'};
  return {id:'advanced',name:'Room to explore further',description:'Proposed H2 profile for later, optional adapter experiments in an isolated Linux environment. Training is a separate, consented roadmap capability.',vram:'24 GB NVIDIA VRAM',disk:'100 GB free',tag:'H2 · FUTURE ADAPTATION'};
}
export function createEvidenceReport(input, generatedAt=new Date().toISOString()) {
  const checks=verifyWorkspace(input);
  return {kind:'Blue Nebula browser demo evidence',version:1,generatedAt,scope:'Illustrative next-chapter project; current browser canvas',configuration:normalizeConfig(input),checks,summary:{passed:checks.filter(c=>c.passed).length,total:checks.length},limitations:['Checks validate demo data and generated JSX text.','No compiler, browser rendering test, local model, or repository task is executed.','This report does not qualify the proposed desktop application.']};
}
