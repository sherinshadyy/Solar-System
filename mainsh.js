import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js";

//  Scene setup 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

//  Camera setup 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 40);
camera.lookAt(0,0,0);

//  Renderer setup 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//  Lights 
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 200);
sunLight.castShadow = true;
sunLight.shadow.bias = -0.001;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.2);
dirLight.position.set(50,50,50);
dirLight.castShadow = true;
scene.add(dirLight);

//  Texture Loader 
const loader = new THREE.TextureLoader();
const TEXTURES = {
    sun: './sun.jpg',
    mercury: './mercury.jpg',
    venus: './venus.jpg',
    earth: './earth.jpg',
    mars: './mars.jpg',
    jupiter: './jupiter.jpg',
    saturn: './saturn.jpg',
    saturnRing: './saturnring.png',
    uranus: './uranus.jpg',
    neptune: './neptune.jpg',
    pluto: './pluto.jpg'
};
const spaceTexture = loader.load('./stars_milky_way.jpg'); 
scene.background = spaceTexture;

//  Sun
const sunGeo = new THREE.SphereGeometry(4,32,32);
const sunMat = new THREE.MeshStandardMaterial({
    map: loader.load(TEXTURES.sun),
    emissive: 0xffdd33,
    emissiveIntensity: 0.2,
    roughness: 0.4,
    metalness: 0
});
const sun = new THREE.Mesh(sunGeo,sunMat);
sun.castShadow=false; sun.receiveShadow=false;
scene.add(sun);

// Sun glow
function createGlowSprite(size=120){
    const canvas=document.createElement('canvas');
    canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');
    const grd=ctx.createRadialGradient(128,128,10,128,128,128);
    grd.addColorStop(0,'rgba(255,240,200,0.95)');
    grd.addColorStop(0.2,'rgba(255,200,120,0.5)');
    grd.addColorStop(1,'rgba(255,120,20,0)');
    ctx.fillStyle=grd; ctx.fillRect(0,0,256,256);
    const tex=new THREE.CanvasTexture(canvas);
    const spriteMat=new THREE.SpriteMaterial({map:tex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const sprite=new THREE.Sprite(spriteMat);
    sprite.scale.set(size,size,1);
    return sprite;
}
const sunGlow=createGlowSprite(25);
sun.add(sunGlow);
sunLight.position.copy(sun.position);

//  Planets 
const planets=[];
const interactiveObjects=[];
const pivots=[];

// Orbit ring visual
function createOrbitRing(distance, thickness=0.05, color=0x333366){
    const inner=Math.max(0.1,distance-thickness);
    const outer=distance+thickness;
    const ringGeo=new THREE.RingGeometry(inner,outer,128);
    const ringMat=new THREE.MeshBasicMaterial({color:color,side:THREE.DoubleSide,transparent:true,opacity:0.5});
    const ring=new THREE.Mesh(ringGeo,ringMat);
    ring.rotation.x=-Math.PI/2;
    ring.receiveShadow=false;
    ring.renderOrder=1;
    return ring;
}

// Planet creation function
function createPlanet(size,color,distance,speed,materialType='standard',textureURL=null,name='Planet'){
    const geo=new THREE.SphereGeometry(size,32,32);
    let mat=new THREE.MeshStandardMaterial({color,roughness:0.7,metalness:0});
    if(textureURL){ 
        mat.map=loader.load(textureURL); 
        mat.map.anisotropy=renderer.capabilities.getMaxAnisotropy(); 
        mat.needsUpdate=true; 
    }

    const planet=new THREE.Mesh(geo,mat);
    planet.position.x=distance;
    planet.castShadow=true; planet.receiveShadow=true;
    planet.userData={name,radius:size,distance,materialType};

    const pivot=new THREE.Object3D();
    scene.add(pivot);
    pivot.add(planet);
    pivots.push({pivot,speed});

    const ring=createOrbitRing(distance,Math.max(0.05,size*0.02));
    scene.add(ring);

    planets.push({mesh:planet,distance,speed,angle:Math.random()*Math.PI*2,pivot});
    interactiveObjects.push(planet);
    return planet;
}

//  Create planets Mercury → Pluto 
createPlanet(1,0x888888,8,0.002,'standard',TEXTURES.mercury,'Mercury');
createPlanet(1.5,0xeed6a7,12,0.0015,'standard',TEXTURES.venus,'Venus');
createPlanet(1.8,0x2a52be,16,0.001,'standard',TEXTURES.earth,'Earth');
createPlanet(1.3,0xb22222,20,0.0008,'standard',TEXTURES.mars,'Mars');
createPlanet(3.6,0xd9c48c,30,0.0005,'standard',TEXTURES.jupiter,'Jupiter');

// Saturn
(function(){
    const satSize=2.5; const satDist=24;
    const sat=createPlanet(satSize,0xcaa88a,satDist,0.0006,'standard',TEXTURES.saturn,'Saturn');
    const inner=satSize+0.6; const outer=satSize+2.2;
    const ringGeo=new THREE.RingGeometry(inner,outer,128);
    const ringMat=new THREE.MeshBasicMaterial({color:0x8d6b39,side:THREE.DoubleSide,transparent:true,opacity:0.9,map:loader.load(TEXTURES.saturnRing)});
    const ringMesh=new THREE.Mesh(ringGeo,ringMat);
    ringMesh.rotation.x=-Math.PI/2.2;
    const satEntry=planets.find(p=>p.mesh===sat);
    if(satEntry){ satEntry.pivot.add(ringMesh); ringMesh.position.copy(sat.position); }
    interactiveObjects.push(ringMesh);
})();

// Uranus
const uranus = createPlanet(2,0x7fffd4,38,0.0003,'standard',TEXTURES.uranus,'Uranus');
(function(){
    const urRingGeo = new THREE.RingGeometry(2.2, 3.0, 128);
    const urRingMat = new THREE.MeshBasicMaterial({color:0x88eeff, side:THREE.DoubleSide, transparent:true, opacity:0.6});
    const urRing = new THREE.Mesh(urRingGeo, urRingMat);
    urRing.rotation.x = -Math.PI/2.2;
    const entry = planets.find(p=>p.mesh===uranus);
    if(entry){ entry.pivot.add(urRing); urRing.position.copy(uranus.position); }
    interactiveObjects.push(urRing);
})();

// Neptune
createPlanet(1.9,0x4169e1,42,0.00025,'standard',TEXTURES.neptune,'Neptune');

// Pluto
createPlanet(0.8,0xcccccc,46,0.0001,'standard',TEXTURES.pluto,'Pluto');

//  Additional Shapes for Requirements 

// ConeGeometry with MeshPhongMaterial 
/*const coneGeo = new THREE.ConeGeometry(2,4,32);
const coneMat = new THREE.MeshPhongMaterial({color:0xffa500, shininess:100});
const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.set(-8,2,6);
cone.castShadow=true; cone.receiveShadow=true;
scene.add(cone);
interactiveObjects.push(cone);

// BoxGeometry 
const boxGeo = new THREE.BoxGeometry(3,3,3);
const boxMat = new THREE.MeshStandardMaterial({color:0x00ff00});
const box = new THREE.Mesh(boxGeo, boxMat);
box.position.set(8,1.5,5);
box.castShadow=true; box.receiveShadow=true;
scene.add(box);
interactiveObjects.push(box); */

//  OrbitControls 
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;

//  Raycaster + labels 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentLabel = null;

// Store original textures
planets.forEach(p => p.originalTexture = p.mesh.material.map);

// Label helper
function labelSprite(text){
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,256,64);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(text, 10, 35);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthWrite:false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(5,1.3,1);
    return sprite;
}

// Click interaction
window.addEventListener("click", (e)=>{
    mouse.x = (e.clientX/window.innerWidth)*2 - 1;
    mouse.y = -(e.clientY/window.innerHeight)*2 + 1;
    raycaster.setFromCamera(mouse,camera);
    const hits = raycaster.intersectObjects(interactiveObjects, true);
    
    if(hits.length){
        const obj = hits[0].object;
        const entry = planets.find(p => p.mesh === obj);
        if(entry){
            if(currentLabel){ scene.remove(currentLabel); currentLabel=null; }
            const text = `${entry.mesh.userData.name} R:${entry.mesh.userData.radius} D:${entry.mesh.userData.distance}`;
            const sp = labelSprite(text);
            sp.position.copy(entry.mesh.getWorldPosition(new THREE.Vector3()));
            sp.position.y += entry.mesh.userData.radius + 1.2;
            scene.add(sp); currentLabel = sp;

            // Toggle texture
            if(entry.mesh.material.map){
                entry.mesh.material.map = null;
                entry.mesh.material.color.set(0x999999);
            } else {
                entry.mesh.material.map = entry.originalTexture;
                entry.mesh.material.needsUpdate = true;
            }
        }
    } else {
        if(currentLabel){ scene.remove(currentLabel); currentLabel=null; }
    }
});

// Double-click interaction (fixed: only object tapped)
window.addEventListener("dblclick", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactiveObjects, true);

    if (hits.length > 0) {
        const obj = hits[0].object;

        // Toggle only the object itself
        obj.visible = !obj.visible;
    }
});

//  WASD movement 
const move={forward:false,back:false,left:false,right:false,up:false,down:false};
window.addEventListener('keydown',(e)=>{
    if(e.key=='w'||e.key=='W') move.forward=true;
    if(e.key=='s'||e.key=='S') move.back=true;
    if(e.key=='a'||e.key=='A') move.left=true;
    if(e.key=='d'||e.key=='D') move.right=true;
    if(e.key==' ') move.up=true;
    if(e.key=='Shift') move.down=true;
});
window.addEventListener('keyup',(e)=>{
    if(e.key=='w'||e.key=='W') move.forward=false;
    if(e.key=='s'||e.key=='S') move.back=false;
    if(e.key=='a'||e.key=='A') move.left=false;
    if(e.key=='d'||e.key=='D') move.right=false;
    if(e.key==' ') move.up=false;
    if(e.key=='Shift') move.down=false;
});
function applyCameraMovement(delta){
    const speed=20*delta;
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir); dir.y=0; dir.normalize();
    const right=new THREE.Vector3(); right.crossVectors(camera.up,dir).normalize();
    if(move.forward) camera.position.addScaledVector(dir,speed);
    if(move.back) camera.position.addScaledVector(dir,-speed);
    if(move.left) camera.position.addScaledVector(right,speed);
    if(move.right) camera.position.addScaledVector(right,-speed);
    if(move.up) camera.position.y+=speed;
    if(move.down) camera.position.y-=speed;
}

//  Animation loop 
function animate(){
    requestAnimationFrame(animate);
    for(let p of planets){
        p.pivot.rotation.y += p.speed;
        p.mesh.rotation.y += 0.01;
    }
    sun.rotation.y += 0.002;
    const delta = 0.016;
    applyCameraMovement(delta);
    controls.update();
    renderer.render(scene,camera);
}
animate();

//  Handle resizing 
window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});
