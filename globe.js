// <pixel-globe> — interactive pixel dot globe (real land geometry from world-atlas)
(function(){
if(customElements.get('pixel-globe'))return;
const D3={src:'https://unpkg.com/d3@7.9.0/dist/d3.min.js',i:'sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i'};
const TJ={src:'https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js',i:'sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67'};
function loadScript(o){return new Promise((res,rej)=>{let s=document.querySelector('script[src="'+o.src+'"]');
  if(s){if(s.dataset.pgLoaded)return res();s.addEventListener('load',res);s.addEventListener('error',rej);return;}
  s=document.createElement('script');s.src=o.src;s.integrity=o.i;s.crossOrigin='anonymous';
  s.addEventListener('load',()=>{s.dataset.pgLoaded='1';res();});s.addEventListener('error',rej);document.head.appendChild(s);});}
let maskPromise=null;
function landMask(){ // -> fn(lonDeg,latDeg)=>bool, from Natural Earth land rasterized offscreen
  if(maskPromise)return maskPromise;
  maskPromise=loadScript(D3).then(()=>loadScript(TJ))
    .then(()=>fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json'))
    .then(r=>r.json())
    .then(topo=>{
      const land=topojson.feature(topo,topo.objects.countries);
      const W=1024,H=512,off=document.createElement('canvas');off.width=W;off.height=H;
      const ctx=off.getContext('2d',{willReadFrequently:true});
      const proj=d3.geoEquirectangular().translate([W/2,H/2]).scale(W/(2*Math.PI));
      const path=d3.geoPath(proj,ctx);
      ctx.fillStyle='#000';ctx.beginPath();path(land);ctx.fill();
      const px=ctx.getImageData(0,0,W,H).data;
      return (lon,lat)=>{
        const x=Math.max(0,Math.min(W-1,Math.round((lon+180)/360*W)));
        const y=Math.max(0,Math.min(H-1,Math.round((90-lat)/180*H)));
        return px[(y*W+x)*4+3]>120;};
    })
    .catch(e=>{console.warn('pixel-globe: geometry failed to load, showing full sphere',e);return ()=>true;});
  return maskPromise;
}
const CITIES=[
  {name:'Vancouver',cc:'CA',lat:49.2827,lon:-123.1207,current:true},
  {name:'New York',cc:'US',lat:40.7128,lon:-74.0060},
  {name:'Toronto',cc:'CA',lat:43.6532,lon:-79.3832},
  {name:'Delhi',cc:'IN',lat:28.6139,lon:77.2090},
  {name:'Shenzhen',cc:'CN',lat:22.5431,lon:114.0579},
  {name:'Tokyo',cc:'JP',lat:35.6762,lon:139.6503}
];
const rad=d=>d*Math.PI/180;
class PixelGlobe extends HTMLElement{
  static get observedAttributes(){return ['pin-color','auto-rotate','density'];}
  constructor(){super();
    this.ry=rad(172);this.rx=0.62;this.vy=0;this.vx=0;
    this.dots=null;this.mask=null;this.selected='Vancouver';this.hovered=null;
    this.dragging=false;this.focusTarget=null;this.lastInteract=0;this.fontReady=false;this.t0=performance.now();
  }
  get pinColor(){return this.getAttribute('pin-color')||'#6F52E8';}
  get autoRotate(){return this.getAttribute('auto-rotate')!=='false';}
  get density(){return this.getAttribute('density')==='coarse'?3.4:2.4;}
  attributeChangedCallback(n){if(n==='density'&&this.mask)this.genDots();}
  connectedCallback(){
    this.style.display='block';this.style.width='100%';this.style.height='100%';
    const c=this.canvas=document.createElement('canvas');
    c.style.cssText='display:block;width:100%;height:100%;cursor:grab;touch-action:none;image-rendering:pixelated';
    this.appendChild(c);
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this);this.resize();
    landMask().then(m=>{this.mask=m;this.genDots();});
    if(document.fonts&&document.fonts.load)document.fonts.load('700 11px Silkscreen').then(()=>{this.fontReady=true;});
    c.addEventListener('pointerdown',e=>{this.dragging=true;this.focusTarget=null;this.lastInteract=performance.now();
      this.px=e.clientX;this.py=e.clientY;c.setPointerCapture(e.pointerId);c.style.cursor='grabbing';});
    c.addEventListener('pointermove',e=>{
      const r=c.getBoundingClientRect();this.mx=(e.clientX-r.left)*(c.width/r.width);this.my=(e.clientY-r.top)*(c.height/r.height);
      if(this.dragging){const k=0.0055*(520/this.size);
        this.ry+=(e.clientX-this.px)*k;this.rx+=(e.clientY-this.py)*k;
        this.rx=Math.max(-0.85,Math.min(0.85,this.rx));
        this.vy=(e.clientX-this.px)*k;this.vx=(e.clientY-this.py)*k;
        this.px=e.clientX;this.py=e.clientY;this.lastInteract=performance.now();}
      else this.hitTest();});
    c.addEventListener('pointerup',e=>{this.dragging=false;c.style.cursor='grab';this.lastInteract=performance.now();
      const r=c.getBoundingClientRect();this.mx=(e.clientX-r.left)*(c.width/r.width);this.my=(e.clientY-r.top)*(c.height/r.height);
      this.hitTest();if(this.hovered)this.selected=this.hovered;});
    c.addEventListener('pointerleave',()=>{this.hovered=null;});
    this.raf=requestAnimationFrame(t=>this.tick(t));
  }
  disconnectedCallback(){cancelAnimationFrame(this.raf);if(this.ro)this.ro.disconnect();}
  resize(){const w=Math.max(280,this.clientWidth||480);
    const side=Math.min(w,560);
    if(Math.abs((this._side||0)-side)>1){this._side=side;this.style.height=side+'px';}
    const h=this.clientHeight||side;const s=Math.min(w,h);
    const dpr=Math.min(2,window.devicePixelRatio||1);
    this.size=s;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.dpr=dpr;}
  genDots(){const step=this.density,out=[];
    for(let lat=-87;lat<=87;lat+=step){
      const n=Math.max(1,Math.round((360/step)*Math.cos(rad(lat))));
      for(let i=0;i<n;i++){const lon=-180+i*(360/n);
        if(this.mask(lon,lat)){const f=rad(lat),l=rad(lon);
          out.push(Math.cos(f)*Math.sin(l),Math.sin(f),Math.cos(f)*Math.cos(l));}}}
    this.dots=new Float32Array(out);}
  focusCity(name){const c=CITIES.find(x=>x.name===name);if(!c)return;
    const tgt=-rad(c.lon);const two=Math.PI*2;
    let d=(tgt-this.ry)%two;if(d>Math.PI)d-=two;if(d<-Math.PI)d+=two;
    this.focusTarget={ry:this.ry+d,rx:Math.max(-0.8,Math.min(0.8,rad(c.lat)))};
    this.selected=name;this.lastInteract=performance.now();}
  project(lon,lat,R,cx,cy){const f=rad(lat),l=rad(lon);
    return this.projectV(Math.cos(f)*Math.sin(l),Math.sin(f),Math.cos(f)*Math.cos(l),R,cx,cy);}
  projectV(x,y,z,R,cx,cy){const cA=Math.cos(this.ry),sA=Math.sin(this.ry);
    const x2=x*cA+z*sA,z2=-x*sA+z*cA;
    const cB=Math.cos(this.rx),sB=Math.sin(this.rx);
    const y2=y*cB-z2*sB,z3=y*sB+z2*cB;
    return [cx+x2*R,cy-y2*R,z3];}
  tick(t){this.raf=requestAnimationFrame(tt=>this.tick(tt));
    const dt=Math.min(0.05,(t-(this.lt||t))/1000);this.lt=t;
    if(this.focusTarget){const ft=this.focusTarget;
      this.ry+=(ft.ry-this.ry)*Math.min(1,dt*5);this.rx+=(ft.rx-this.rx)*Math.min(1,dt*5);
      if(Math.abs(ft.ry-this.ry)<0.004&&Math.abs(ft.rx-this.rx)<0.004)this.focusTarget=null;}
    else if(this.dragging){/* handled in pointermove */}
    else{this.ry+=this.vy;this.rx=Math.max(-0.85,Math.min(0.85,this.rx+this.vx));
      this.vy*=0.92;this.vx*=0.92;
      if(this.autoRotate&&!this.hovered&&t-this.lastInteract>3000)this.ry-=dt*0.11;}
    this.draw(t);}
  hitTest(){if(!this.pins){this.hovered=null;return;}
    let best=null,bd=18*this.dpr;
    for(const p of this.pins){if(p.z<0.02)continue;
      const d=Math.hypot(p.x-this.mx,p.y-this.my);if(d<bd){bd=d;best=p.name;}}
    this.hovered=best;this.canvas.style.cursor=best?'pointer':(this.dragging?'grabbing':'grab');}
  draw(t){const c=this.canvas,ctx=c.getContext('2d');if(!c.width)return;
    ctx.clearRect(0,0,c.width,c.height);
    const cx=c.width/2,cy=c.height/2,R=Math.min(c.width,c.height)*0.42;
    ctx.fillStyle='#d9ecfc';ctx.beginPath();ctx.arc(cx,cy,R+8*this.dpr,0,7);ctx.fill();
    ctx.strokeStyle='#b7d8f2';ctx.lineWidth=3*this.dpr;ctx.stroke();
    if(!this.dots){ctx.fillStyle='#5b83ad';ctx.font='700 '+Math.round(11*this.dpr)+'px Silkscreen, monospace';
      ctx.textAlign='center';const on=Math.floor(t/400)%2===0;
      ctx.fillText('LOADING WORLD'+(on?' ...':''),cx,cy+4*this.dpr);return;}
    const d=this.dots,n=d.length,base=Math.max(1.5,R/150);
    for(let i=0;i<n;i+=3){
      const p=this.projectV(d[i],d[i+1],d[i+2],R,cx,cy);const z=p[2];
      if(z<=0.01)continue;
      const s=Math.round(base*(z>0.62?1.5:z>0.3?1.1:0.75));
      ctx.globalAlpha=0.3+0.7*z;ctx.fillStyle='#1c3a5e';
      ctx.fillRect(Math.round(p[0]),Math.round(p[1]),s,s);}
    ctx.globalAlpha=1;
    const pc=this.pinColor,dpr=this.dpr;this.pins=[];
    const front=[];
    for(const city of CITIES){const p=this.project(city.lon,city.lat,R,cx,cy);
      this.pins.push({name:city.name,x:p[0],y:p[1],z:p[2]});
      if(p[2]>-0.02)front.push({city,p});}
    front.sort((a,b)=>a.p[2]-b.p[2]);
    for(const {city,p} of front){const x=Math.round(p[0]),y=Math.round(p[1]);
      const big=city.current?7:5,u=dpr;
      ctx.fillStyle='#fff';ctx.fillRect(x-(big+2)*u/2,y-(big+2)*u/2,(big+2)*u,(big+2)*u);
      ctx.fillStyle=pc;ctx.fillRect(x-big*u/2,y-big*u/2,big*u,big*u);
      if(city.current){ctx.fillStyle='#fff';ctx.fillRect(x-1.5*u,y-1.5*u,3*u,3*u);}
      const active=this.hovered===city.name||this.selected===city.name;
      if(active&&p[2]>0.02){
        ctx.font='700 '+Math.round(10*dpr)+'px Silkscreen, monospace';
        const label=city.name.toUpperCase()+(city.current?' * NOW':'')+' '+city.cc;
        const tw=ctx.measureText(label).width,pad=7*dpr,bh=22*dpr;
        let bx=x-tw/2-pad,by=y-big*u-bh-9*dpr;
        bx=Math.max(4,Math.min(c.width-tw-pad*2-4,bx));if(by<4)by=y+big*u+9*dpr;
        ctx.fillStyle='#17233a';ctx.fillRect(Math.round(bx),Math.round(by),Math.round(tw+pad*2),Math.round(bh));
        ctx.fillStyle=pc;ctx.fillRect(Math.round(bx),Math.round(by+bh),Math.round(tw+pad*2),2*dpr);
        ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';
        ctx.fillText(label,Math.round(bx+pad),Math.round(by+bh/2+dpr));
        ctx.textBaseline='alphabetic';}}
  }
}
customElements.define('pixel-globe',PixelGlobe);
window.PixelGlobeCities=CITIES;
})();
