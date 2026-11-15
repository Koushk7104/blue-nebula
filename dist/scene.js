// Blue Nebula wireframe scene: four connected layers (memory, design, code, checks) drawn as a 3D
// wireframe on a 2D canvas. Scroll or pointer driven. No dependencies.
const LAYERS=[
  {name:'MEMORY',rgb:[61,224,176]},
  {name:'DESIGN',rgb:[120,170,255]},
  {name:'CODE',rgb:[170,200,255]},
  {name:'CHECKS',rgb:[255,184,77]}
];
const rnd=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export function createScene(canvas,opts={}){
  const ctx=canvas.getContext('2d');
  const o={labels:true,pointer:true,tiltX:.98,...opts};
  const st={ry:-.55,rx:o.tiltX,explode:.3,active:-1,focus:0,t:0,px:0,py:0,tpx:0,tpy:0,yoff:0,zoom:1,cam:0};
  // eased channels: set() moves their target, frame() glides toward it; act[] is each layer's smoothed focus 0..1
  const EASED=['ry','rx','explode','yoff','zoom'],tgt={},seen={},act=[0,0,0,0];let prevT=0;
  let W=0,H=0,dpr=1,running=true,visible=true;
  // static random details
  const nodes=LAYERS.map(()=>Array.from({length:22},()=>({u:rnd()*2-1,v:rnd()*2-1,ph:rnd()*6.28})));
  const pillars=Array.from({length:7},(_,i)=>({u:(i%4-1.5)*.5+(rnd()-.5)*.1,v:(i<4?-.45:.45)+(rnd()-.5)*.12,ph:rnd()}));
  const codeLines=Array.from({length:9},()=>({w:.25+rnd()*.55,ind:rnd()<.4?.12:0}));

  function size(){W=canvas.clientWidth;H=canvas.clientHeight;
    // fill cost scales with pixels: cap the backing store at ~2.2M px (thin lines stay crisp at 1.25x)
    dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2.2e6/Math.max(1,W*H)));canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  size();new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(canvas);
  if(o.pointer){
    const host=canvas.parentElement;
    host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();st.tpx=(e.clientX-r.left)/r.width-.5;st.tpy=(e.clientY-r.top)/r.height-.5});
    host.addEventListener('pointerleave',()=>{st.tpx=0;st.tpy=0});
  }

  // plane (u,v in -1..1) -> world
  const SX=1.25,SZ=.85;
  function proj(u,v,li){
    const gap=lerp(.34,.78,st.explode);
    // camera glides to the focused layer: shift the whole stack so the active plate sits at centre
    let camY=0;if(st.cam)for(let i=0;i<4;i++)camY+=act[i]*(i-1.5)*gap;
    let x=u*SX,z=v*SZ,y=(li-1.5)*gap+act[li]*.16-camY*st.cam;
    const cy=Math.cos(st.ry),sy=Math.sin(st.ry);
    let x1=x*cy-z*sy,z1=x*sy+z*cy;
    const cx=Math.cos(st.rx),sx=Math.sin(st.rx);
    let y1=y*cx-z1*sx,z2=y*sx+z1*cx;
    const cam=5.2,f=Math.min(W*.62,H*1.5)*st.zoom*lerp(1,st.cam?.9:.7,st.explode),k=f/(cam-z2*.6);
    return [W/2+x1*k+st.px*40,H/2-y1*k+st.yoff,k];
  }
  function poly(pts,li,close=true){ctx.beginPath();pts.forEach(([u,v],i)=>{const p=proj(u,v,li);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});if(close)ctx.closePath()}
  const rect=(u0,v0,u1,v1,li)=>poly([[u0,v0],[u1,v0],[u1,v1],[u0,v1]],li);
  function circle(u,v,r,li,n=18){poly(Array.from({length:n},(_,i)=>[u+Math.cos(i/n*6.283)*r,v+Math.sin(i/n*6.283)*r*1.5]),li)}

  function drawLayer(li,t){
    const L=LAYERS[li],[r,g,b]=L.rgb;
    const e=act[li],on=e>.5,dim=st.active>=0?lerp(.38,1,e):1;
    const A=(a)=>`rgba(${r},${g},${b},${a*dim})`,Wt=(a)=>`rgba(255,255,255,${a*dim})`;
    // panel: neutral base, tinted layer cross-fades in as it takes focus
    rect(-1,-1,1,1,li);ctx.fillStyle=`rgba(255,255,255,${.025*dim})`;ctx.fill();
    ctx.lineWidth=1;ctx.strokeStyle=Wt(.38);ctx.stroke();
    if(e>.01){ctx.fillStyle=A(.1*e);ctx.fill();ctx.lineWidth=1+.6*e;ctx.strokeStyle=A(.95*e);ctx.stroke();
      // scan sweep across the focused layer
      const sv=((t*.45)%1)*2-1;rect(-1,sv-.12,1,sv,li);ctx.fillStyle=A(.12*e);ctx.fill();
      poly([[-1,sv],[1,sv]],li,false);ctx.lineWidth=1.4;ctx.strokeStyle=A(.7*e);ctx.stroke()}
    // grid
    ctx.lineWidth=.6;ctx.strokeStyle=on?A(.22):Wt(.09);ctx.beginPath();
    for(let i=-4;i<=4;i++){let a=proj(i/4,-1,li),c=proj(i/4,1,li);ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1])}
    for(let i=-4;i<=4;i++){let a=proj(-1,i/4,li),c=proj(1,i/4,li);ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1])}
    ctx.stroke();
    // contents
    ctx.lineWidth=1;ctx.strokeStyle=on?A(.9):Wt(.55);
    if(li===0){for(let i=0;i<5;i++){const v=-.7+i*.34;rect(-.8,v-.11,.8,v+.11,li);ctx.stroke();circle(-.68,v,.035,li,10);ctx.stroke();poly([[-.55,v],[-.55+.3+(i%3)*.15,v]],li,false);ctx.stroke()}}
    if(li===1){rect(-.85,-.7,-.05,.15,li);ctx.stroke();rect(.1,-.7,.85,-.1,li);ctx.stroke();rect(.1,.05,.85,.7,li);ctx.stroke();rect(-.85,.3,-.05,.7,li);ctx.stroke();circle(-.45,-.28,.12,li);ctx.stroke();poly([[-.7,.0],[-.2,.0]],li,false);ctx.stroke()}
    if(li===2){codeLines.forEach((c,i)=>{const v=-.78+i*.19;poly([[-.85+c.ind,v],[-.85+c.ind+c.w,v]],li,false);ctx.lineWidth=on?2:1.2;ctx.stroke()});ctx.lineWidth=1}
    if(li===3){for(let i=0;i<4;i++){const u=-.7+i*.46;circle(u,-.25,.13,li,20);ctx.stroke();const p=[[u-.06,-.25],[u-.015,-.2],[u+.07,-.32]];poly(p,li,false);ctx.stroke()}rect(-.85,.3,.85,.45,li);ctx.stroke();rect(-.85,.3,-.85+1.7*(.5+.5*Math.sin(t*.8)),.45,li);ctx.fillStyle=A(.35);ctx.fill()}
    // nodes
    nodes[li].forEach(n=>{const p=proj(n.u,n.v,li),tw=.4+.6*Math.abs(Math.sin(t*1.2+n.ph));ctx.fillStyle=on?A(tw):Wt(tw*.7);ctx.beginPath();ctx.arc(p[0],p[1],1.2+p[2]*.0035,0,6.283);ctx.fill()});
    // label
    if(o.labels){const p=proj(1,1,li),q=proj(1,.2,li);ctx.font=`600 ${clamp(W/90,10,12)}px ui-monospace,Menlo,Consolas,monospace`;ctx.textBaseline='middle';
      ctx.strokeStyle=on?A(.9):Wt(.3);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+26,p[1]);ctx.stroke();
      ctx.fillStyle=on?A(1):Wt(.55);ctx.fillText(`${String(li+1).padStart(2,'0')}  ${L.name}`,p[0]+32,p[1])}
  }

  function drawPillars(t){
    const top=3,bot=0;
    pillars.forEach(pl=>{
      const a=proj(pl.u,pl.v,bot),b=proj(pl.u,pl.v,top);
      ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=.8;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);
      const f=((t*.22+pl.ph)%1),li=f*3,i0=Math.floor(li),p0=proj(pl.u,pl.v,i0),p1=proj(pl.u,pl.v,Math.min(3,i0+1)),k=li-i0;
      const x=lerp(p0[0],p1[0],k),y=lerp(p0[1],p1[1],k),rgb=LAYERS[Math.min(3,i0)].rgb;
      const gr=ctx.createRadialGradient(x,y,0,x,y,10);gr.addColorStop(0,`rgba(${rgb},.9)`);gr.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,10,0,6.283);ctx.fill();
    });
  }

  function frame(ms){
    requestAnimationFrame(frame);
    if(!running||!visible||document.hidden)return;
    const t=ms/1000,dt=Math.min(.05,t-prevT||.016);prevT=t;st.t=t;
    const k=1-Math.exp(-dt*14); // fast follow: ~70ms settle so the scene tracks the scroll without trailing
    for(const n of EASED)if(n in tgt)st[n]+=(tgt[n]-st[n])*k;
    for(let i=0;i<4;i++)act[i]+=((st.active===i?1:0)-act[i])*k;
    st.px+=(st.tpx-st.px)*.06;st.py+=(st.tpy-st.py)*.06;
    const ry=st.ry+st.px*.6,rx=st.rx+st.py*.25;
    const sv={ry:st.ry,rx:st.rx};st.ry=ry;st.rx=rx;
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<4;i++){
      drawLayer(i,t);
      if(i===0)drawPillars(t); // pillars behind upper layers
    }
    st.ry=sv.ry;st.rx=sv.rx;
  }
  requestAnimationFrame(frame);

  return{
    state:st,
    set(p){for(const n in p){if(EASED.includes(n)&&seen[n])tgt[n]=p[n];else{st[n]=p[n];if(EASED.includes(n)){tgt[n]=p[n];seen[n]=true}}}},
    pause(v){running=!v},
    get paused(){return!running}
  };
}
