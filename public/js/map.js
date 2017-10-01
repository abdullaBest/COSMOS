"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
const chunk_width   = 128;
const bb_width      = 100;
const bb_height     = 100;
const map_maxx      = bb_width*65536;
const map_maxy      = bb_height*65536;
const _Dx = [ -1, 0, 1,  -1,0,1,  -1,0,1 ];
const _Dy = [ -1,-1,-1,   0,0,0,   1,1,1 ];

let MAP = {
    box             : null,
    center_cx       : 0,
    center_cy       : 0,
    center_cx2      : 0,
    center_cy2      : 0,
    center_cx3      : 0,
    center_cy3      : 0,
    scenes          : new Array(9),
    scenes2         : new Array(9),
    scenes3         : new Array(9),
    //
    wait_for_chunk  : false,
    chunk_x         : 0,
    chunk_y         : 0,
    chunk_data      : null,
    _req_chunk      : new ArrayBuffer(2+1+ 1+1), // n,tip, cx,cy
    _req_chunk_dv   : null,
    //
    static_by_id    : new Map(),
    //
    animation_list  : null,
    //
    watch_list      : null,
    watch_cursor    : null,
}
Object.seal(MAP);

MAP._req_chunk_dv = new DataView(MAP._req_chunk);

function _map_new_scene(){
    let a = {
        x           : -10,      // координаты чанка
        y           : -10,
        objs        : null,     // список объектов на карте
        stars       : null,     // звезды
        nebulas     : null,     // галактики
        _upd        : false,    // при переходе из сектора в сектор блоки могут быть обновлены за счет старых
        loaded      : false,    // загружен этот блок или нет
    }
    return a;
}

function map_prepare(){
    MAP.box = new TheBox2D();
    //
    let d = chunk_width / 2;
    for (let i=0;i<9;i++){
        let a = _map_new_scene();
        a.stars = gen_starfield(100,0,0,0.7);
        RENDER.scene_models.add(a.stars);
        MAP.scenes[i]  = a;
        a = _map_new_scene();
        a.stars = gen_starfield(500,0,0,0.4);
        RENDER.scene2.add(a.stars);
        MAP.scenes2[i] = a;
        a = _map_new_scene();
        a.stars = gen_starfield(5000,0,0,0.2);
        a.nebulas = gen_nebulas(10,0,0);
        RENDER.scene3.add(a.nebulas);
        RENDER.scene3.add(a.stars);
        MAP.scenes3[i] = a;
    }
    //
    map_recalc_vis();
    map_recalc_vis2();
    map_recalc_vis3();
}
//------------------------------------------------------------
function gen_star(center,buff_p,buff_c,p,color_delta){
    let v1 = {x:0,y:0,z:0}
    let v2 = {x:0,y:0,z:0}
    let v3 = {x:0,y:0,z:0}
    let v4 = {x:0,y:0,z:0}
    let c  = {r:1.0,g:1.0,b:1.0}
    let c1 = {r:0,g:0,b:0}
    let c2 = {r:0,g:0,b:0}
    let c3 = {r:0,g:0,b:0}
    let c4 = {r:0,g:0,b:0}
    //        v4
    //
    // v3   center    v1
    //
    //        v2
    
    const dd = 0.02;
    const dd2 = 0.04;
    let dx = 0.1 + Math.random()*color_delta;
    c.r = dx;
    c.g = dx;
    c.b = dx + Math.random()*0.3;
    if (c.b>1.0){c.b=1.0;}
    dx = dd + Math.random()*dd2;
    v1.x = center.x + dx;
    v1.y = center.y;
    v1.z = center.z;
    dx = dd + Math.random()*dd2;
    v2.x = center.x;
    v2.y = center.y + dx;
    v2.z = center.z;
    dx = dd + Math.random()*dd2;
    v3.x = center.x - dx;
    v3.y = center.y;
    v3.z = center.z;
    dx = dd + Math.random()*dd2;
    v4.x = center.x;
    v4.y = center.y - dx;
    v4.z = center.z;
    
    buff_p[p+0] = center.x; buff_p[p+1] = center.y; buff_p[p+2] = center.z;
    buff_p[p+3] = v2.x;     buff_p[p+4] = v2.y;     buff_p[p+5] = v2.z;
    buff_p[p+6] = v1.x;     buff_p[p+7] = v1.y;     buff_p[p+8] = v1.z;
    buff_c[p+0] = c.r;      buff_c[p+1] = c.g;      buff_c[p+2] = c.b;
    buff_c[p+3] = c2.r;     buff_c[p+4] = c2.g;     buff_c[p+5] = c2.b;
    buff_c[p+6] = c1.r;     buff_c[p+7] = c1.g;     buff_c[p+8] = c1.b;
    p = p + 9;
    buff_p[p+0] = center.x; buff_p[p+1] = center.y; buff_p[p+2] = center.z;
    buff_p[p+3] = v3.x;     buff_p[p+4] = v3.y;     buff_p[p+5] = v3.z;
    buff_p[p+6] = v2.x;     buff_p[p+7] = v2.y;     buff_p[p+8] = v2.z;
    buff_c[p+0] = c.r;      buff_c[p+1] = c.g;      buff_c[p+2] = c.b;
    buff_c[p+3] = c3.r;     buff_c[p+4] = c3.g;     buff_c[p+5] = c3.b;
    buff_c[p+6] = c2.r;     buff_c[p+7] = c2.g;     buff_c[p+8] = c2.b;
    p = p + 9;
    buff_p[p+0] = center.x; buff_p[p+1] = center.y; buff_p[p+2] = center.z;
    buff_p[p+3] = v4.x;     buff_p[p+4] = v4.y;     buff_p[p+5] = v4.z;
    buff_p[p+6] = v3.x;     buff_p[p+7] = v3.y;     buff_p[p+8] = v3.z;
    buff_c[p+0] = c.r;      buff_c[p+1] = c.g;      buff_c[p+2] = c.b;
    buff_c[p+3] = c4.r;     buff_c[p+4] = c4.g;     buff_c[p+5] = c4.b;
    buff_c[p+6] = c3.r;     buff_c[p+7] = c3.g;     buff_c[p+8] = c3.b;
    p = p + 9;
    buff_p[p+0] = center.x; buff_p[p+1] = center.y; buff_p[p+2] = center.z;
    buff_p[p+3] = v1.x;     buff_p[p+4] = v1.y;     buff_p[p+5] = v1.z;
    buff_p[p+6] = v4.x;     buff_p[p+7] = v4.y;     buff_p[p+8] = v4.z;
    buff_c[p+0] = c.r;      buff_c[p+1] = c.g;      buff_c[p+2] = c.b;
    buff_c[p+3] = c1.r;     buff_c[p+4] = c1.g;     buff_c[p+5] = c1.b;
    buff_c[p+6] = c4.r;     buff_c[p+7] = c4.g;     buff_c[p+8] = c4.b;
    p = p + 9;
}

function gen_starfield(count,sx,sy,color_delta){
    //let count = 2000;
    let size = 2*count * (4 * 9);
    let buff_p = new Float32Array(size);
    let buff_c = new Float32Array(size);
    let p = 0;
    let center = {x:0,y:0,z:0.0}
    for (let i=0;i<count;i++){
        center.x = sx + Math.random()*chunk_width;
        center.y = sy + Math.random()*chunk_width;
        gen_star(center,buff_p,buff_c,p,color_delta);
        p = p + 4*9;
    }
    //
    //center.z = -0.2;
    for (let i=0;i<count;i++){
        center.x = sx + Math.random()*chunk_width;
        center.y = sy + Math.random()*chunk_width;
        gen_star(center,buff_p,buff_c,p,color_delta);
        p = p + 4*9;
    }
    //
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( buff_c, 3 ) );
    let material = new THREE.MeshBasicMaterial({
        //map : TEXTURES.glx1,
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
        //wireframe : true,
        //transparent : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function gen_nebula(x,y,buff_p,buff_u,p,pu){
    const frames = [
	   { x:849,  y:199, w:258, h:237 },
	   { x:1393, y:462, w:288, h:373 },
	   { x:1681, y:462, w:319, h:380 },
	   { x:482,  y:0,   w:281, h:182 },
	   { x:0,    y:199, w:316, h:201 },
	   { x:648,  y:462, w:182, h:280 },
	   { x:1107, y:199, w:393, h:239 },
	   { x:1063, y:0,   w:210, h:193 },
	   { x:332,  y:462, w:316, h:270 },
	   { x:1500, y:199, w:241, h:263 },
	   { x:0,    y:462, w:332, h:270 },
	   { x:274,  y:0,   w:208, h:179 },
	   { x:316,  y:199, w:184, h:211 },
	   { x:1495, y:0,   w:297, h:199 },
	   { x:830,  y:462, w:289, h:281 },
	   { x:0,    y:842, w:430, h:385 },
	   { x:0,    y:0,   w:274, h:152 },
	   { x:763,  y:0,   w:300, h:191 },
	   { x:500,  y:199, w:349, h:236 },
	   { x:1273, y:0,   w:222, h:194 },
	   { x:1119, y:462, w:274, h:291 },
    ]

    let v1 = {x:0,y:0,z:0}
    let v2 = {x:0,y:0,z:0}
    let v3 = {x:0,y:0,z:0}
    let v4 = {x:0,y:0,z:0}
    let u1 = {x:0,y:0}
    let u2 = {x:0,y:0}
    let u3 = {x:0,y:0}
    let u4 = {x:0,y:0}
    // v1             v2
    //
    //      center    
    //
    // v4             v3
    let dx = 3.0 + random()*6.0;
    v1.x = x - dx;
    v1.y = y - dx;
    v2.x = x + dx;
    v2.y = y - dx;
    v3.x = x + dx;
    v3.y = y + dx;
    v4.x = x - dx;
    v4.y = y + dx;
    let n = Math.trunc(random()*frames.length);
    const ww = 2048;

    u1.x = (frames[n].x)/ww;
    u1.y = 1-(frames[n].y)/ww;
    u2.x = (frames[n].x + frames[n].w)/ww;
    u2.y = 1-(frames[n].y)/ww;
    u3.x = (frames[n].x + frames[n].w)/ww;
    u3.y = 1-(frames[n].y + frames[n].h)/ww;
    u4.x = (frames[n].x)/ww;
    u4.y = 1-(frames[n].y + frames[n].h)/ww;
    
    buff_p[p+0] = v1.x;     buff_p[p+1] = v1.y;     buff_p[p+2] = v1.z;
    buff_p[p+3] = v3.x;     buff_p[p+4] = v3.y;     buff_p[p+5] = v3.z;
    buff_p[p+6] = v2.x;     buff_p[p+7] = v2.y;     buff_p[p+8] = v2.z;

    buff_u[pu+0] = u1.x;     buff_u[pu+1] = u1.y;
    buff_u[pu+2] = u3.x;     buff_u[pu+3] = u3.y;
    buff_u[pu+4] = u2.x;     buff_u[pu+5] = u2.y;
    pu=pu + 6;
    p = p + 9;
    buff_p[p+0] = v1.x;     buff_p[p+1] = v1.y;     buff_p[p+2] = v1.z;
    buff_p[p+3] = v4.x;     buff_p[p+4] = v4.y;     buff_p[p+5] = v4.z;
    buff_p[p+6] = v3.x;     buff_p[p+7] = v3.y;     buff_p[p+8] = v3.z;

    buff_u[pu+0] = u1.x;     buff_u[pu+1] = u1.y;
    buff_u[pu+2] = u4.x;     buff_u[pu+3] = u3.y;
    buff_u[pu+4] = u3.x;     buff_u[pu+5] = u4.y;
    pu=pu + 6;
    p = p + 9;
}

function update_nebulas(count,sx,sy,buff_p,buff_u){
    let p = 0;
    let pu = 0;
    _seed = sx*10000+sy;
    const dd = chunk_width*0.03;
    for (let i=0;i<count;i++){
        let x = random()*chunk_width;
        let y = random()*chunk_width;
        for (let j=0;j<4;j++){
            let xx = x + (-dd + 2*random()*dd);
            let yy = y + (-dd + 2*random()*dd);
            gen_nebula(xx,yy,buff_p,buff_u,p,pu);
            p  = p + 18;
            pu = pu + 12;
        }
    }

}

function gen_nebulas(count,sx,sy){
    //let count = 2000;
    let size = count*4 * (2 * 9);
    let buff_p = new Float32Array(size);
    let sizeu = count*4 * (2 * 6);
    let buff_u = new Float32Array(sizeu);
    //
    //update_nebulas(count,sx,sy,buff_p,buff_u);
    //
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial({
        map         : TEXTURES.n1,
        side        : THREE.DoubleSide,
        transparent : true,
    });
    return new THREE.Mesh( geometry, material );
}
//------------------------------------------------------------
function map_recalc_vis(){
    let x = MAP.center_cx;
    let y = MAP.center_cy;
    //console.log(x,y);
    let scenes = MAP.scenes;
    for (let i=0;i<9;i++){ 
        scenes[i]._upd = false; 
    }
    let  i = 0;
    do{
        if (!scenes[i]._upd){
            // находим новое положение на карте этого блока
            let dx = scenes[i].x - x;
            let dy = scenes[i].y - y;
            // если блок не вышел за рамки карты обзора
            if (Math.abs(dx)<2 && Math.abs(dy)<2 ){
                // переносим на новое место 
                let n = (dy+1)*3+(dx+1);    // находи его новое положение
                let a =  scenes[n];
                scenes[n]      = scenes[i];
                scenes[n]._upd = true;
                scenes[i]      = a;
            }else{
                let m = scenes[i].objs;
                while (m!==null){
                    let next = m.c_next;
                    map_remove_obj(m); 
                    m = next;
                }
                scenes[i].objs = null;
                i=i+1;
            }
        }else{
            i=i+1;
        }
    } while (i<9)
    //
    for (let i=0;i<9;i++){
        let a = scenes[i]; 
        a.x = x + _Dx[i];                        
        a.y = y + _Dy[i];
        if (!a._upd){
            a.stars.position.x   = a.x*chunk_width;
            a.stars.position.y   = a.y*chunk_width;
            MAP.scenes[i]._upd   = true;
            MAP.scenes[i].loaded = false;
        }
    }
}
function map_recalc_vis2(){
    let x = MAP.center_cx2;
    let y = MAP.center_cy2;
    let scenes = MAP.scenes2;
    for (let i=0;i<9;i++){
        let a = scenes[i]; 
        a.x = x + _Dx[i];                        
        a.y = y + _Dy[i];
        a.stars.position.x = a.x*chunk_width;
        a.stars.position.y = a.y*chunk_width;
    }
    
}
function map_recalc_vis3(){
    let x = MAP.center_cx3;
    let y = MAP.center_cy3;
    //console.log(x,y);
    let scenes = MAP.scenes3;
    for (let i=0;i<9;i++){ 
        scenes[i]._upd = false;
    }
    let  i = 0;
    do{
        if (!scenes[i]._upd){
            // находим новое положение на карте этого блока
            let dx = scenes[i].x - x;
            let dy = scenes[i].y - y;
            // если блок не вышел за рамки карты обзора
            if (Math.abs(dx)<2 && Math.abs(dy)<2 ){
                // переносим на новое место 
                let n = (dy+1)*3+(dx+1);    // находи его новое положение
                let a =  scenes[n];
                scenes[n]      = scenes[i];
                scenes[n]._upd = true;
                scenes[i]      = a;
            }else{
                i=i+1;
            }
        }else{
            i=i+1;
        }
    } while (i<9)
    //
    for (let i=0;i<9;i++){
        let a = scenes[i]; 
        a.x = x + _Dx[i];                        
        a.y = y + _Dy[i];
        if (!a._upd){
            let sx = a.x*chunk_width;
            let sy = a.y*chunk_width;
            a.stars.position.x = sx;
            a.stars.position.y = sy;
            let m = a.nebulas;
            let buff_p = m.geometry.attributes.position.array;
            let buff_u = m.geometry.attributes.uv.array;
            update_nebulas(10,sx,sy,buff_p,buff_u);
            m.geometry.attributes.position.needsUpdate = true;
            m.geometry.attributes.uv.needsUpdate = true;
            m.position.x = sx;
            m.position.y = sy;
            MAP.scenes3[i]._upd = true;
        }
    }
}

// проверка - нужно ли загрузить новые блоки карты.
function map_update_center(cx,cy){
    if (MAP.center_cx!==cx || MAP.center_cy!==cy ){
        MAP.center_cx = cx;
        MAP.center_cy = cy;
        map_recalc_vis();
        let cx2 = Math.trunc(cx*0.5);
        let cy2 = Math.trunc(cy*0.5);
        if (MAP.center_cx2!==cx2 || MAP.center_cy2!==cy2 ){
            MAP.center_cx2 = cx2;
            MAP.center_cy2 = cy2;
            map_recalc_vis2();
        }
        let cx3 = Math.trunc(cx2*0.5);
        let cy3 = Math.trunc(cy2*0.5);
        if (MAP.center_cx3!==cx3 || MAP.center_cy3!==cy3 ){
            MAP.center_cx3 = cx3;
            MAP.center_cy3 = cy3;
            map_recalc_vis3();
        }
    }
}

//------------------------------------------------------------
/*
function _buff_frame(buff_p,buff_u,p,pu,n,scale,offset_x,offset_y){
    //
    let frame    = STATIC_INFO[n].frame;
    const fw     = STATIC_INFO[n].fw;
    let sx       =     (frame[0]);
    let sy       = 1.0-(frame[1]+frame[3]);
    let ex       =     (frame[0]+frame[2]);
    let ey       = 1.0-(frame[1]);
    let dd       = fw/100*scale;
    let scalex   = frame.w*dd;
    let scaley   = frame.h*dd;
    _plane_uv(buff_p,buff_u,p,pu,sx,sy,ex,ey,scalex,scaley,offset_x,offset_y);
}

function _mesh_gen2(anim_list,dx){
    let l = anim_list.lengt;
    let buff_p   = new Float32Array(l*18);
    let buff_u   = new Float32Array(l*12);
    //
    let p = 0, pu = 0;
    for (let i=0;i<l;i++){
        _buff_frame(buff_p,buff_u,p,pu,anim_list[i],dx,0.0,0.0);
        p  = p  + 18; 
        pu = pu + 12; 
    }
    //
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let n = anim_list[0];
    let m = new THREE.Mesh( geometry, STATIC_INFO[n].material );
    m.position.z = STATIC_INFO[n].z;
    return m;
}

function _mesh_gen(n,anim_n,dx,offset_x,offset_y){
    let buff_p   = new Float32Array(anim_n*18);
    let buff_u   = new Float32Array(anim_n*12);
    //
    let p        = 0;
    let pu       = 0;
    for (let i=n;i<n+anim_n;i++){
        _buff_frame(buff_p,buff_u,p,pu,i,dx,offset_x,offset_y);
        p  = p  + 18; 
        pu = pu + 12; 
    }
    //
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let m = new THREE.Mesh( geometry, STATIC_INFO[n].material );
    
    let frame    = STATIC_INFO[n].frame;
    const fw     = STATIC_INFO[n].fw;
    let sx       =     (frame[0]);
    let sy       = 1.0-(frame[1]+frame[3]);
    let ex       =     (frame[0]+frame[2]);
    let ey       = 1.0-(frame[1]);
    let dd       = fw/100*dx;
    let scalex   = frame[2]*dd;
    let scaley   = frame[3]*dd;

    let material = STATIC_INFO[n].material;
    //let material = RENDER.SpriteMaterial.clone();
    //material.uniforms.map.value = STATIC_INFO[n].material.map;
    //material.uniforms.offset.value.x = sx;
    //material.uniforms.offset.value.y = sy;
    //material.uniforms.size.value.x   = frame.w/fw;
    //material.uniforms.size.value.y   = frame.h/fw;
    
    let m = new THREE.Mesh( RENDER.SpriteGeometry, material );
    m.scale.x = scalex;
    m.scale.y = scaley;
    m.position.z = STATIC_INFO[n].z;
    return m;
}
*/

function _map_sprite_mesh(cx,cy,x,y,n,dx,angle){
    let info     = STATIC_INFO[n];
    let frame    = info.frame;
    const fw     = info.fw;
    let sx       =     (frame[0]);
    let sy       = 1.0-(frame[1]+frame[3]);
    let ex       =     (frame[0]+frame[2]);
    let ey       = 1.0-(frame[1]);
    
    let dd       = (1024/100)/WORD*chunk_width*dx;
    let scalex   = frame[2]*fw*dd;
    let scaley   = frame[3]*fw*dd;
    
    let m = new THREE.Mesh( RENDER.SpriteGeometry, info.material );
    m.scale.x    = scalex;
    m.scale.y    = scaley;
    m.position.z = info.z;
    m.position.x = (cx + x/WORD)*chunk_width; 
    m.position.y = (cy + y/WORD)*chunk_width;
    m.rotation.z = (angle/WORD)*Math.PI*2; 
    //
    m._my = {
        sx: sx,
        sy: sy,
        dx: frame[2],
        dy: frame[3],
        r : 1.0,
        g : 1.0,
        b : 1.0,
        a : 1.0,
    }
    Object.seal(m._my);
    //
    return m;
}

function _map_frame_box(id,cx,cy,x,y,dx,tip,mask){
    let rx    = cx*WORD + x;
    let ry    = cy*WORD + y;
    return MAP.box.add(id,rx,ry,dx,dx,tip,mask);
}
//------------------------------------------------------------

function map_update(){
    if (!MAP.wait_for_chunk){
        for(let i=0;i<9;i++){
            if (!MAP.scenes[i].loaded){
                let x = MAP.scenes[i].x;
                let y = MAP.scenes[i].y;
                if (x>=0 && x<bb_width && y>=0 && y<bb_height){
                    MAP.wait_for_chunk = true;
                    MAP.chunk_x = x;
                    MAP.chunk_y = y;
                    //
                    _buff_dv.setUint8( 3, MAP.chunk_x);
                    _buff_dv.setUint8( 4, MAP.chunk_y);
                    send_bin( MSG_BLOCK, 5   );
                    //
                    break;
                }else{
                    MAP.scenes[i].loaded = true;
                }
            }   
        }
    }
    //
    map_update_watch();
}

function map_render_update(delta){
    //
    map_update_animation(delta);
}

function map_update_animation(delta){
    let a = MAP.animation_list;
    while (a!==null){
        a.anim_delta = a.anim_delta + delta;
        if (a.anim_delta>=a.anim_delta_max){
            a.anim_delta = a.anim_delta - a.anim_delta_max;
            if (a.anim_delta>=a.anim_delta_max){ a.anim_delta = 0; }
            
            a.anim_n = a.anim_n + 1;
            if (a.anim_n===a.anim_max){ a.anim_n = 0; }
            let n = a.type + a.anim_n;
            let f = STATIC_INFO[n].frame;
            a.mesh._my.sx = f[0];
            a.mesh._my.sy = 1.0-(f[1]+f[3]);
        }        
        a = a.a_next;
    }
}
//----------------------------------------------------------
function map_add_to_animation(a){
    a.a_next = MAP.animation_list;
    a.a_prev = null;
    if (MAP.animation_list!==null){
        MAP.animation_list.a_prev = a;
    }
    MAP.animation_list = a;
}
function map_remove_from_animation(a){
    let prev = a.a_prev;
    let next = a.a_next;
    if (a===MAP.animation_list){
        MAP.animation_list = next;
    }
    if (prev!==null){ prev.a_next = next; }
    if (next!==null){ next.a_prev = prev; }
}

function map_add_to_watch(a){
    a.w_next = MAP.watch_list;
    a.w_prev = null;
    if (MAP.watch_list!==null){
        MAP.watch_list.w_prev = a;
    }
    MAP.watch_list = a;
}
function map_remove_from_watch(a){
    let prev = a.w_prev;
    let next = a.w_next;
    if (a===MAP.watch_list){
        MAP.watch_list =next;
    }
    if (a===MAP.watch_cursor){
        MAP.watch_cursor = next;
    }
    if (prev!==null){ prev.w_next = next; }
    if (next!==null){ next.w_prev = prev; }
}

function map_add_to_chunk(a,chunk){
    a.c_next = chunk.objs;
    a.c_prev = null;
    if (chunk.objs!==null){
        chunk.objs.c_prev = a;
    }
    chunk.objs = a;
    a.chunk = chunk;
}
function map_remove_from_chunk(a){
    let prev = a.c_prev;
    let next = a.c_next;
    if (a===a.chunk.objs){
        a.chunk.objs = next;
    }
    if (prev!==null){ prev.c_next = next; }
    if (next!==null){ next.c_prev = prev; }
}

//------------------------------------------------------------

function map_asteroid_boom(x,y,count){
    for (let i=0;i<count;i++){
        let n = Math.trunc(Math.random()*4);
        let angle = random()*Math.PI*2;
        let speed = 0.0005 + Math.random()*0.0020; 
        let xx = x + (-0.5 + Math.random());
        let yy = y + (-0.5 + Math.random());
        new_particle(PANIM_ASTEROID_BOOM+n,xx,yy,angle,speed,0.0,1000);
    }
}

function map_new_obj(id,cx,cy,x,y,layer,type,scale,angle,status,anim_d,anim){
    let b = {
        id               : id,
        cx               : cx,
        cy               : cy,
        x                : x,
        y                : y,
        layer            : layer,   // 0 слой карты 1- динамический
        //
        type             : type,
        scale            : scale,
        angle            : angle,
        status           : status,
        //
        mesh             : null,    // 
        mesh2            : null,    // дополнительный мешь, например лучи солнца
        box              : null,    // 
        // раздел анимации
        anim_delta       : 0,                
        anim_delta_max   : anim_d,
        anim_n           : 0,
        anim_max         : anim,
        a_next           : null,
        a_prev           : null,
        // список объектов которые нужно проверять на пересечение с кораблем
        w_prev           : null,
        w_next           : null,
        // список по чанкам
        c_prev           : null,    
        c_next           : null,
        chunk            : null,
        //
        is_uniq          : false,
    }
    Object.seal(b);
    
    return b;
}

// убирает объект с карты
function map_remove_obj(a){
    if (a.id!==0){
        map_remove_from_animation(a);
        map_remove_from_watch(a);
        map_remove_from_chunk(a);
        if (a.layer===0){
            RENDER.scene.remove(a.mesh);
        }else{
            RENDER.scene_models.remove(a.mesh);
        }
        //a.mesh.geometry.dispose();
        if (a.is_uniq){
            if (a.mesh2!==null){
                RENDER.scene_models.remove(a.mesh2);
            }
        }
        if (a.box!==null){ MAP.box.remove(a.box); }
        MAP.static_by_id.delete(a.id);
        a.id    = 0;
        a.mesh  = null;
        a.mesh2 = null;
        a.box   = null;
    }
}

// Обновляет статичный объект на карте, если его нет будет создан или наоборот удален
function map_set(id,cx,cy,x,y,type,angle,scale,status){
    let a = MAP.static_by_id.get(id);
    if (cx<0){
        if (a!==undefined){ map_remove_obj(a); }
        return null;
    }
    
    let info = STATIC_INFO[type];
    if (a===undefined){
        a = map_new_obj(id,cx,cy,x,y,0,type,scale,angle,status,info.anim_d,info.anim);
        if (info.url===''){
            a.is_uniq = true;
        }
        MAP.static_by_id.set(id,a);  
        if (info.z>0.5){ a.layer=1; }
    }else{
        a.cx     = cx;
        a.cy     = cy;
        a.x      = x;
        a.y      = y;
        a.scale  = scale;
        a.angle  = angle;
        //a.type   = type;
        //a.status = status;
        // убираем старый
        map_remove_obj(a);
        a.id = id;
    }
    //
    let size = (scale/WORD)*2.0;
    //
    if (a.is_uniq){
        let _name = info.name.split('_');
        let p = chunk_width/WORD;
        let rx = cx*chunk_width +  x*p; 
        let ry = cy*chunk_width +  y*p;
        if (_name[0]==='gen'){
            switch(_name[1]){
                case 'earth' :
                            a.mesh = RENDER.planet_earth.clone();
                            break;
                case 'moon' :
                            a.mesh = RENDER.planet_moon.clone();
                            break;
                case 'lava' :
                            a.mesh = RENDER.planet_lava.clone();
                            break;
                case 'sun' :
                            a.mesh = RENDER.planet_sun.clone();
                            //
                            a.mesh2 = RENDER.LensFlareMesh.clone();
                            a.mesh2.position.x = rx;
                            a.mesh2.position.y = ry;
                            a.mesh2.position.z = info.z;
                            RENDER.scene_models.add(a.mesh2);
                            break;
            }
            a.mesh.scale.x = size;
            a.mesh.scale.y = size;
            a.mesh.position.x = rx;
            a.mesh.position.y = ry;
            a.mesh.position.z = info.z;
        }
    }else{
        a.mesh = _map_sprite_mesh(cx,cy,x,y,type,size,angle);
    }
    //
    if (a.layer===0){
        RENDER.scene.add(a.mesh);
    }else{
        RENDER.scene_models.add(a.mesh);
    }
    //
    if (info.box!==0){
        let tip   = UNIT_ASTEROID;
        let mask  = UNIT_ASTEROID;
        let dx    = Math.round(info.box*size);
        a.box     = _map_frame_box(id,cx,cy,x,y,dx,tip,mask);
    } 
    //
    if (info.anim>1){ map_add_to_animation(a); }
    if ((info.storage!==0) || (a.status & STATIC_STATUS_COLLECTIBLE) ) { map_add_to_watch(a); }
    return a;
}

// Пришла часть данных по блоку, они приходят частями, блок с карты мы запрашивали до этого
function map_chunk(data){
    let cx = MAP.chunk_x;
    let cy = MAP.chunk_y;
    let dx = cx - MAP.center_cx;
    let dy = cy - MAP.center_cy;
    // если блок не вышел за рамки карты обзора
    if (Math.abs(dx)<2 && Math.abs(dy)<2 ){
        let n = (dy+1)*3+(dx+1);    // находим его новое положение
        let a =  MAP.scenes[n];
        let p  = data.byteLength;
        let pp = 0;
        while (p!=0){
            p = p - _static_frameline_size;
            let id      = data.getUint32( pp + STATIC_data_id      );
            let x       = data.getUint16( pp + STATIC_data_x       );
            let y       = data.getUint16( pp + STATIC_data_y       );
            let type    = data.getUint16( pp + STATIC_data_type    );
            let angle   = data.getUint16( pp + STATIC_data_angle   );
            let status  = data.getUint16( pp + STATIC_data_status  );
            let scale   = data.getUint16( pp + STATIC_data_scale   );
            let b = map_set(id,cx,cy,x,y,type,angle,scale,status);
            map_add_to_chunk(b,a);
            pp = pp + _static_frameline_size;
        }
    }
}

// Данные по блоку на карте закончились, можно заказывать новый блок 
function map_finalize_chunk(){
    MAP.wait_for_chunk = false;
    let dx = MAP.chunk_x - MAP.center_cx;
    let dy = MAP.chunk_y - MAP.center_cy;
    // если блок не вышел за рамки карты обзора
    if (Math.abs(dx)<2 && Math.abs(dy)<2 ){
        let n = (dy+1)*3+(dx+1);    // находим его новое положение
        MAP.scenes[n].loaded = true;
    }
}

// пришло обновление по объектам на карте
function map_chunk_update(data){
    let a = data.split(';');
    let id,cx,cy,x,y,type,angle,scale,status;
    let obj,dx,dy;
    for (let i=0;i<a.length-1;i++){
        let b = a[i].split(',');
        switch(b.length){
            case 2: // изменение статуса
                    id     = parseInt(b[0]);
                    status = parseInt(b[1]);
                    obj    = MAP.static_by_id.get(id);
                    if (obj!==undefined){
                        //
                        if (!(obj.status & STATIC_STATUS_INACTIVE) && (status & STATIC_STATUS_INACTIVE)){
                            //
                            map_asteroid_boom(obj.mesh.position.x,obj.mesh.position.y,10);
                            //
                            map_remove_from_animation(obj);
                            map_remove_from_watch(obj);
                            if (obj.layer===0){
                                RENDER.scene.remove(obj.mesh);
                            }else{
                                RENDER.scene_models.remove(obj.mesh);
                            }
                            if (obj.box!==null){ MAP.box.remove(obj.box); obj.box = null;}
                        }
                        //
                        if ((obj.status & STATIC_STATUS_INACTIVE) && !(status & STATIC_STATUS_INACTIVE)){
                            let info = STATIC_INFO[obj.type];
                            if (obj.layer>0.5){
                                RENDER.scene_models.add(obj.mesh);
                            }else{
                                RENDER.scene.add(obj.mesh);
                            }
                            //
                            if (info.box!==0){
                                let tip  = UNIT_ASTEROID;
                                let mask = UNIT_ASTEROID;
                                let size = (obj.scale/WORD)*2.0;
                                let dx   = Math.round(info.box*size);
                                obj.box = _map_frame_box(obj.id,obj.cx,obj.cy,obj.x,obj.y,dx,tip,mask);
                            } 
                            //
                            if (info.anim>1){ map_add_to_animation(obj); }
                            if (info.storage!==0) { map_add_to_watch(obj); }
                            
                        }
                        //
                        obj.status = status;
                    }
                    break;
            case 4: // объект был подобран юнитом
                    id     = parseInt(b[0]);
                    obj    = MAP.static_by_id.get(id);
                    if (obj!==undefined){
                        let unit_id = parseInt(b[1]);
                        let item_n  = parseInt(b[2]);
                        let count   = parseInt(b[3]);
                        if (unit_id===USER.unit_id){
                            let ship = USER.ships[USER.curr_ship];
                            ship.energy = ship.energy - ship.device_energy;
                            ship.cargo[item_n] = ship.cargo[item_n] + count;
                        }
                        let anim_n = PANIM_ASTER_BOX;
                        switch(item_n){
                            case 15: anim_n = PANIM_ASTER_IRON;
                                    break;
                            case 16: anim_n = PANIM_ASTER_GOLD;
                                    break;
                            case 17: anim_n = PANIM_ASTER_PLATINUM;
                                    break;
                        }
                        let rx = (obj.cx + (obj.x/WORD))*chunk_width;  
                        let ry = (obj.cy + (obj.y/WORD))*chunk_width;
                        let dx = USER.rx - rx;
                        let dy = USER.ry - ry;
                        let d = dx*dx+dy*dy;
                        let speed = 0.0100;
                        let time = d/(speed*10);
                        let ang = Math.atan2(dy, dx);
                        if (isNaN(ang)){ang=0.0;}
                        new_particle(anim_n,rx,ry,ang,speed,0.0,time);
                        map_remove_obj(obj);
                    }
                    break;
            case 9: // появился новый объект или изменили или удалили, полное обновление данных
                    id     = parseInt(b[0]);
                    cx     = parseInt(b[1]);
                    cy     = parseInt(b[2]);
                    x      = parseInt(b[3]);
                    y      = parseInt(b[4]);
                    type   = parseInt(b[5]);
                    angle  = parseInt(b[6]);
                    scale  = parseInt(b[7]);
                    status = parseInt(b[8]);
                    obj = MAP.static_by_id.get(id);
                    if (obj!==undefined){ map_remove_obj(obj); }
                    dx = cx - MAP.center_cx;
                    dy = cy - MAP.center_cy;
                    // если блок не вышел за рамки карты обзора
                    if (Math.abs(dx)<2 && Math.abs(dy)<2 ){
                        let m =  MAP.scenes[(dy+1)*3+(dx+1)]; // находим его новое положение
                        obj = map_set(id,cx,cy,x,y,type,angle,scale,status);
                        map_add_to_chunk(obj,m);
                    }
                    break;
        }
    }
}

//--------------------------------------------
function map_update_watch(){
    let a = MAP.watch_cursor;
    let i = 10;
    const dd  = 400*400;
    const dd2 = 4000*4000;
    let rx2 = USER.cx*WORD + USER.x;
    let ry2 = USER.cy*WORD + USER.y;
    let ship = USER.ships[USER.curr_ship];
    while (i--){
        if (a===null){
            MAP.watch_cursor = MAP.watch_list;
            break;
        }else{
            //
            let rx  = a.cx*WORD+a.x;
            let ry  = a.cy*WORD+a.y;
            let dx  = rx - rx2; 
            let dy  = ry - ry2;
            if (USER._speed===0){
                let d   = dx*dx+dy*dy;
                let info = STATIC_INFO[a.type];
                if (info.storage!==0){
                    if (info.storage===1000){
                        if (d<dd2){ USER.storage_static_id = a.id; }
                    }else{
                        if (d<dd){  USER.storage_static_id = a.id; }
                    }
                } 
            }
            // если предмет можно собирать
            if (a.status & STATIC_STATUS_COLLECTIBLE){
                let d   = dx*dx+dy*dy;
                if (ship.device_radius>=d && ship.device_energy<=ship.energy && !USER.wait_for_device){
                    let device_n = 0;
                    // отправляем запрос на сбор предмета
                    // отправляем:      device_n  static_id
                    //            01 2      3       4567   
                    _buff_dv.setUint8(  3, device_n );
                    _buff_dv.setUint32( 4, a.id     );
                    send_bin(MSG_DEVICE,8);
                    USER.wait_for_device  = true;
                    USER._wait_for_device = true;
                }
            }
            //
            a = a.w_next;
        }        
    }
    //
    if (USER._speed!==0){ USER.storage_static_id = 0; }
}

