const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,finite(n)));
const ease=n=>{const p=clamp(n,0,1);return p*p*(3-2*p);};

export function resolveNebulaMode({manual=null,origin=0,scroll=0,progress=0,scrollDriven=true}={}){
  let selection=manual===0||manual===1?manual:null;
  if(scrollDriven&&Math.abs(finite(scroll)-finite(origin))>6)selection=null;
  return {manual:selection,target:selection??(scrollDriven?clamp(progress,0,1):0)};
}

export function createNebulaPoints(requested=2304){
  const count=Math.round(clamp(finite(requested,2304),64,2600)),columns=48,perLayer=Math.ceil(count/4);
  return Array.from({length:count},(_,i)=>{
    const local=i%perLayer,rows=Math.max(2,Math.ceil(perLayer/columns));
    return {u:Math.floor(i/columns)/Math.ceil(count/columns)*Math.PI*2,v:i%columns/columns*Math.PI*2,layer:Math.min(3,Math.floor(i/perLayer)),gridX:local%columns/(columns-1)-.5,gridY:Math.floor(local/columns)/(rows-1)-.5};
  });
}

/** Preserve particle identity while the ribbon resolves into four product layers. */
export function nebulaPoint(point,{progress=0,time=0,pointerX=0,pointerY=0}={}){
  const t=finite(time)%100000,p=clamp(progress,0,1),m=ease((p-.08)/.85),layer=clamp(point.layer,0,3);
  const u=point.u,v=point.v,r=.49+.12*Math.sin(3*u+v);
  let x=(1.25+r*Math.cos(v))*Math.cos(u),y=(1.25+r*Math.cos(v))*Math.sin(u),z=r*Math.sin(v)+.18*Math.sin(2*u);
  const targetX=finite(point.gridX)*1.85+(layer%2?1.16:-1.16);
  const targetY=finite(point.gridY)*1.1+(layer<2?-.76:.76);
  x+=(targetX-x)*m;y+=(targetY-y)*m;z+=((layer-1.5)*.11-z)*m;
  const pitch=.88*(1-m)+.18*m+clamp(pointerY,-1,1)*.13;
  const yaw=.25+Math.sin(t*.25)*.36*(1-m)+clamp(pointerX,-1,1)*.22;
  const roll=-.45*(1-m)+Math.sin(t*.2)*.1*(1-m);
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),cz=Math.cos(roll),sz=Math.sin(roll);
  [x,z]=[x*cy+z*sy,-x*sy+z*cy];[y,z]=[y*cx-z*sx,y*sx+z*cx];
  return [x*cz-y*sz,x*sz+y*cz,z];
}

export function projectNebulaPoint([x,y,z],width,height){
  const w=Math.max(1,finite(width,1)),h=Math.max(1,finite(height,1));
  const perspective=5.8/(5.8+clamp(z,-4,4)),scale=Math.min(w,h)*.24;
  return {x:w*.5+finite(x)*scale*perspective,y:h*.48+finite(y)*scale*perspective,depth:perspective};
}
