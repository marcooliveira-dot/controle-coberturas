'use client';
import { useEffect,useRef,useState } from 'react';
import type * as THREE from 'three';
import { Maximize2,Pause,Play,RotateCcw } from 'lucide-react';
type Props={stores:{id:string,name:string}[],selected:string,onSelect:(id:string)=>void};
export default function StoreWorld({stores,selected,onSelect}:Props){
 const host=useRef<HTMLDivElement>(null),labels=useRef(new Map<string,HTMLButtonElement>()),selection=useRef(selected),pick=useRef(onSelect),paused=useRef(false),reset=useRef<()=>void>(()=>{});
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[isPaused,setIsPaused]=useState(false);
 selection.current=selected;pick.current=onSelect;
 const signature=stores.map(s=>s.id).join('|');
 useEffect(()=>{
  if(!host.current)return;const container=host.current;let disposed=false,cleanup=()=>{};
  setReady(false);setError('');
  Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')]).then(([T,{OrbitControls}])=>{
   if(disposed)return;
   let renderer:THREE.WebGLRenderer;
   try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setError('O 3D não está disponível neste dispositivo. Selecione uma base na lista abaixo.');return}
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xf0eee5,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.setAttribute('aria-label','Maquete 3D das bases. Arraste para girar e use a roda para aproximar.');renderer.domElement.setAttribute('role','img');container.prepend(renderer.domElement);
   const scene=new T.Scene();scene.fog=new T.Fog(0xf0eee5,75,145);
   const camera=new T.PerspectiveCamera(40,1,.1,200),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.46;controls.minPolarAngle=.3;controls.enablePan=true;controls.minDistance=13;controls.maxDistance=115;
   scene.add(new T.HemisphereLight(0xffffff,0x8d9278,2.3));const sun=new T.DirectionalLight(0xffffff,3.2);sun.position.set(-18,35,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
   const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[];
   const mat=(color:number)=>{const m=new T.MeshStandardMaterial({color,roughness:.8});materials.push(m);return m};
   const ivory=mat(0xf9f2df),roof=mat(0xac392b),brick=mat(0xcc693c),gold=mat(0xffba49),glass=mat(0x517e80),pavement=mat(0xdcdacb),grass=mat(0xa7b28b),wood=mat(0x9e6542),leaf=mat(0x64794c),trunk=mat(0x866549),skin=mat(0xc58b63),pants=mat(0x253c42),white=mat(0xfff9e9),dark=mat(0x303c37);
   const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,8),cylinder=new T.CylinderGeometry(1,1,1,10);geometries.push(cube,sphere,cylinder);
   function box(group:THREE.Group|THREE.Scene,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,shadow=false){const mesh=new T.Mesh(cube,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=shadow;mesh.receiveShadow=true;group.add(mesh);return mesh}
   const columns=Math.min(4,Math.max(1,Math.ceil(Math.sqrt(stores.length)))),rows=Math.ceil(stores.length/columns),width=columns*9.2,depth=rows*8.4;
   const ground=box(scene,0,-.33,0,width+5,.3,depth+5,grass);ground.receiveShadow=true;
   for(let row=0;row<rows;row++)box(scene,0,-.14,(row-(rows-1)/2)*8.4+3.3,width+4,.04,1.3,pavement);
   for(let col=0;col<columns;col++)box(scene,(col-(columns-1)/2)*9.2-4.4,-.12,0,.7,.04,depth+4,pavement);
   const targets:THREE.Object3D[]=[],anchors:{id:string,point:THREE.Vector3}[]=[],rings:{id:string,mesh:THREE.Mesh}[]=[],workers:{group:THREE.Group,legs:THREE.Mesh[],arms:THREE.Mesh[],x:number,z:number,phase:number,walk:boolean}[]=[];
   const labelTextures:THREE.Texture[]=[];
   function person(parent:THREE.Group,x:number,z:number,index:number,walk:boolean){
    const p=new T.Group();p.position.set(x,.15,z);parent.add(p);box(p,0,.75,0,.29,.45,.2,gold,true);const head=new T.Mesh(sphere,skin);head.position.y=1.1;head.scale.set(.13,.15,.13);p.add(head);box(p,0,1.24,.025,.32,.08,.28,roof);box(p,0,.78,.115,.18,.29,.025,white);
    const legs=[box(p,-.09,.35,0,.11,.4,.13,pants),box(p,.09,.35,0,.11,.4,.13,pants)];const arms=[box(p,-.22,.74,0,.1,.38,.1,skin),box(p,.22,.74,.1,.1,.38,.1,skin)];box(p,.28,.75,.28,.45,.035,.3,white);workers.push({group:p,legs,arms,x,z,phase:index*1.7,walk});
   }
   stores.forEach((store,index)=>{
    const group=new T.Group();group.position.set((index%columns-(columns-1)/2)*9.2,0,(Math.floor(index/columns)-(rows-1)/2)*8.4);scene.add(group);
    box(group,0,.05,0,8.2,.3,6.5,pavement);box(group,0,1.05,-.4,5.5,1.9,3.3,ivory,true);box(group,0,.35,-.4,5.65,.55,3.4,brick);box(group,0,2.12,-.4,5.95,.28,3.8,roof,true);
    // Duas águas, marquise e vidro de uma unidade de estrada ilustrativa.
    const left=box(group,-1.5,2.43,-.4,3.1,.15,3.9,roof,true);left.rotation.z=.18;const right=box(group,1.5,2.43,-.4,3.1,.15,3.9,roof,true);right.rotation.z=-.18;
    box(group,0,1.35,1.29,4.75,1.05,.055,glass);for(const x of [-2.35,-.8,.8,2.35])box(group,x,1.35,1.35,.07,1.15,.12,ivory);box(group,0,1,1.4,.75,1.4,.09,glass);
    box(group,0,1.95,1.85,6,.16,1.25,gold,true);for(const x of [-2.7,2.7])box(group,x,.95,2.2,.11,1.9,.11,roof);
    box(group,0,2.3,1.55,3.2,.55,.2,roof);const sign=document.createElement('canvas');sign.width=512;sign.height=96;const ctx=sign.getContext('2d');if(ctx){ctx.fillStyle='#fff4d8';ctx.font='bold 42px sans-serif';ctx.textAlign='center';ctx.fillText('FRANGO ASSADO',256,64);const texture=new T.CanvasTexture(sign);texture.colorSpace=T.SRGBColorSpace;labelTextures.push(texture);const signMat=new T.MeshBasicMaterial({map:texture,transparent:true});materials.push(signMat);const signGeometry=new T.PlaneGeometry(3,.52);geometries.push(signGeometry);const signMesh=new T.Mesh(signGeometry,signMat);signMesh.position.set(0,2.3,1.66);group.add(signMesh)}
    // Mesas, clientes e equipe em movimento, sem representar escala ou presença real.
    for(const x of [-1.7,1.7]){box(group,x,.7,2.5,.8,.12,.65,wood);box(group,x,.4,2.5,.13,.6,.13,dark);box(group,x,.37,3,.8,.13,.35,roof)}
    box(group,-2.5,1,-.5,1.6,.15,.65,white);person(group,-2.4,-.45,index,false);person(group,1.7,2.55,index+2,true);person(group,-1.4,2.65,index+5,true);
    for(const x of [-3.5,3.5]){const tree=new T.Mesh(cylinder,trunk);tree.position.set(x,.8,-2);tree.scale.set(.13,1.5,.13);group.add(tree);const crown=new T.Mesh(sphere,leaf);crown.position.set(x,1.75,-2);crown.scale.set(.68,.85,.68);crown.castShadow=true;group.add(crown)}
    // Faixa de seleção no piso, sempre visível junto à base escolhida.
    const ringMaterial=new T.MeshBasicMaterial({color:0xf09d29,transparent:true,opacity:0});materials.push(ringMaterial);const ringGeometry=new T.RingGeometry(3.3,3.43,48);geometries.push(ringGeometry);const ring=new T.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.set(0,.23,.2);group.add(ring);rings.push({id:store.id,mesh:ring});
    const hitMaterial=new T.MeshBasicMaterial({visible:false});materials.push(hitMaterial);const target=box(group,0,1,0,8,3,6.3,hitMaterial);target.userData.storeId=store.id;targets.push(target);
    anchors.push({id:store.id,point:new T.Vector3(group.position.x,3.6,group.position.z)});
   });
   const initial=()=>{const aspect=container.clientWidth/Math.max(container.clientHeight,1),scale=aspect<1.2?1.25:1;camera.position.set(width*.92*scale,Math.max(width,depth)*1.06*scale,depth*1.16*scale);controls.target.set(0,0,0);controls.update()};reset.current=initial;
   const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(container);resize();initial();
   const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down={x:0,y:0};const downHandler=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY}};const upHandler=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(targets)[0];if(hit)pick.current(hit.object.userData.storeId)};
   renderer.domElement.addEventListener('pointerdown',downHandler);renderer.domElement.addEventListener('pointerup',upHandler);
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),onReduced=()=>{paused.current=reduced.matches;setIsPaused(reduced.matches)};onReduced();reduced.addEventListener('change',onReduced);
   let frame=0,last=0,time=0;const projected=new T.Vector3();const animate=(stamp:number)=>{if(disposed)return;frame=requestAnimationFrame(animate);if(stamp-last<32)return;const delta=Math.min((stamp-last)/1000,.1);last=stamp;if(!paused.current)time+=delta;controls.update();
    workers.forEach(w=>{const phase=time*2+w.phase;if(w.walk){w.group.position.x=w.x+Math.sin(phase*.4)*.6;w.group.position.z=w.z+Math.cos(phase*.4)*.15;w.group.rotation.y=Math.cos(phase*.4)>0?1.15:-1.15;w.legs[0].rotation.x=Math.sin(phase*2)*.35;w.legs[1].rotation.x=-Math.sin(phase*2)*.35;}else w.arms[1].rotation.x=-.45+Math.sin(phase)*.25;});
    rings.forEach(r=>{(r.mesh.material as THREE.MeshBasicMaterial).opacity=selection.current===r.id ? .85 : 0});
    for(const a of anchors){const button=labels.current.get(a.id);if(!button)continue;projected.copy(a.point).project(camera);button.style.transform=`translate(-50%,-100%) translate(${(projected.x*.5+.5)*container.clientWidth}px,${(-projected.y*.5+.5)*container.clientHeight}px)`;button.style.visibility=projected.z<1&&Math.abs(projected.x)<1.15&&Math.abs(projected.y)<1.15?'visible':'hidden';}
    renderer.render(scene,camera);
   };frame=requestAnimationFrame(animate);setReady(true);
   cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',onReduced);renderer.domElement.removeEventListener('pointerdown',downHandler);renderer.domElement.removeEventListener('pointerup',upHandler);controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());labelTextures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>{if(!disposed)setError('Não foi possível carregar a maquete. As informações continuam disponíveis na lista de bases.')});
  return()=>{disposed=true;cleanup()};
 },[signature]);
 return <div className="ceo-world-wrap"><div className="ceo-world" ref={host}>{ready&&stores.map(s=><button key={s.id} ref={node=>{if(node)labels.current.set(s.id,node);else labels.current.delete(s.id)}} className={'ceo-world-label '+(s.id===selected?'is-selected':'')} onClick={()=>onSelect(s.id)} aria-pressed={s.id===selected}>{s.name}<span>Ver loja ↗</span></button>)}{!ready&&<div className="ceo-world-loading" role="status">{error||'Preparando a visão 3D das bases…'}</div>}</div><div className="ceo-world-tools"><span><Maximize2 size={14}/> Arraste para girar · role para aproximar</span><button type="button" onClick={()=>reset.current()} aria-label="Restaurar câmera"><RotateCcw size={16}/></button><button type="button" onClick={()=>{paused.current=!paused.current;setIsPaused(paused.current)}} aria-label={isPaused?'Animar equipe':'Pausar animação'}>{isPaused?<Play size={16}/>:<Pause size={16}/>}</button></div><p className="ceo-world-caption">Maquetes e equipes ilustrativas. A disposição não representa um mapa geográfico nem a presença de colaboradores em tempo real.</p></div>;
}
