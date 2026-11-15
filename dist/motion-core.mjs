export const clamp01=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function surfaceFrame(top,height,viewport,enabled=true){
  if(!enabled||![top,height,viewport].every(Number.isFinite)||height<=0||viewport<=0)return {scale:1,lift:0};
  const p=clamp01((viewport-top)/(height+viewport*.35));
  return {scale:.98+p*.02,lift:18*(1-p)};
}
export function pointerMotion(x,y,width,height){
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return {x:0,y:0};
  return {x:(clamp01(x/width)*2-1)*4,y:(clamp01(y/height)*2-1)*3};
}
export function smooth(a,b,n){const t=clamp01((n-a)/(b-a));return t*t*(3-2*t);}
export function sceneFrame(raw){
  const p=clamp01(raw),morph=smooth(.1,.38,p),spread=smooth(.58,.88,p);
  return {progress:p,morph,spread,intro:1-smooth(.055,.19,p),chapterOne:smooth(.2,.32,p)*(1-smooth(.57,.67,p)),chapterTwo:smooth(.67,.8,p),yaw:-.18-morph*.4+spread*.62,pitch:.8-morph*.25-spread*.3,scale:1-morph*.73-spread*.08};
}
export function createMorphPoints(count){
  let seed=2911;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
  return Array.from({length:count},(_,i)=>{const a=random()*Math.PI*2,b=random()*Math.PI*2,r=.35+(random()-.5)*.1;return {x:(1+r*Math.cos(b))*Math.cos(a),y:(1+r*Math.cos(b))*Math.sin(a),z:r*Math.sin(b),u:random()-.5,v:random()-.5,layer:i%4,alpha:.3+random()*.7,size:random()>.98?1.9:.4+random()*.6};});
}
export function morphPoint(point,frame){
  const {morph:m,spread:s}=frame,l=point.layer;
  const x=point.u*2.4*(1-s*.46)+(l%2?1.03:-1.03)*s;
  const y=point.v*1.55*(1-s*.35)+(l<2?-.65:.65)*s;
  const z=(l-1.5)*.52*(1-s*.82);
  return [point.x+(x-point.x)*m,point.y+(y-point.y)*m,point.z+(z-point.z)*m];
}
