"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
// рендер
let RENDER = {
    WIDTH           : window.innerWidth,
    HEIGHT          : window.innerHeight,
    halfWIDTH       : window.innerWidth/2,
    halfHEIGHT      : window.innerHeight/2,
    aspect          : 1.0,
    scale           : 20,
    scale_to        : 20,
    _scale_to       : 3+5,
    scale_delta     : 0,
    delta           : 0,

    scene           : null,
    scene2          : null,
    scene3          : null,
    scene_models    : null,
    
    renderer        : null,
    camera          : null,
    camera_models   : null,
    camera2         : null,
    camera3         : null,
    light           : null,
    listener        : null,
    composer        : null,
    effectFXAA      : null,
    bloomPass       : null,
    copypass        : null,

    lastframe_time  : 0,

    camera_pos1     : { x:0, y:0 },
    camera_pos2     : { x:0, y:0 },
    _camera_pos     : { x:0, y:0 },

    camera_vector   : {x:0,y:0,z:0},
    _camera_vx      : {x:0,y:0,z:0},
    _camera_vz      : {x:0,y:0,z:0},

    animframeID     : 0,

    //BasicMaterial     : null,
    LensFlareMaterial   : null,
    LensFlareMesh       : null,
    planet_earth        : null,
    planet_lava         : null,
    planet_moon         : null,
    planet_sun          : null,

    mouse_angle         : 0,

    mouse_attach        : null,

    raycaster           : new THREE.Raycaster(),
    mouse               : new THREE.Vector3(),
    _draw_calls         : 0,
    
    camera_step         : 1,
    camera_step_x       : 1,
    camera_step_y       : 1,
    
    SpriteGeometry      : null,
    SpriteMaterial      : null,
    SpriteAnimMaterial  : null,
}

Object.seal(RENDER);

let TEXTURES = {
    material    : [],
    txt         : [],
    n1          : new THREE.TextureLoader().load( 'i/n1.png'),
    lensflare0  : new THREE.TextureLoader().load( 'i/lensflare0.png'),
}

TEXTURES.n1.magFilter       = THREE.NearestFilter;
TEXTURES.n1.minFilter       = THREE.LinearMipMapLinearFilter;

function render_resize(){
    RENDER.WIDTH         = window.innerWidth,
    RENDER.HEIGHT        = window.innerHeight;
    RENDER.halfWIDTH     = RENDER.WIDTH/2;
    RENDER.halfHEIGHT    = RENDER.HEIGHT/2;

    RENDER.aspect        = RENDER.WIDTH/RENDER.HEIGHT;

    let a = RENDER.scale*RENDER.aspect;
    RENDER.camera_models.left   = -a;
	RENDER.camera_models.right  = a;
	RENDER.camera_models.top    = RENDER.scale;
	RENDER.camera_models.bottom = -RENDER.scale;
    RENDER.camera_models.updateProjectionMatrix();
    RENDER.camera.left   = -a;
	RENDER.camera.right  = a;
	RENDER.camera.top    = RENDER.scale;
	RENDER.camera.bottom = -RENDER.scale;
    RENDER.camera.updateProjectionMatrix();
    RENDER.camera2.left   = -a;
	RENDER.camera2.right  = a;
	RENDER.camera2.top    = RENDER.scale;
	RENDER.camera2.bottom = -RENDER.scale;
    RENDER.camera2.updateProjectionMatrix();
    RENDER.camera3.left   = -a;
	RENDER.camera3.right  = a;
	RENDER.camera3.top    = RENDER.scale;
	RENDER.camera3.bottom = -RENDER.scale;
    RENDER.camera3.updateProjectionMatrix();
    //
    RENDER.camera_step   = RENDER.scale*2/RENDER.HEIGHT;
    //
    RENDER.renderer.setSize(RENDER.WIDTH, RENDER.HEIGHT);
    //
	RENDER.composer.setSize( RENDER.WIDTH, RENDER.HEIGHT );
    //RENDER.effectFXAA.uniforms['resolution'].value.set( 1/RENDER.WIDTH, 1/RENDER.HEIGHT );
    //
    //GUI.chat_messages.scrollTop = GUI.chat_messages.scrollHeight;
}
function render_fullscreen(){
    if ( document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled ) {
        if ( document.fullscreenElement ||  document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement ) {
            if (document.exitFullscreen) {
	               document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
	               document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
	               document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
	               document.msExitFullscreen();
                }
        }else{
            let i = document.body;//RENDER.renderer.domElement;
            if (i.requestFullscreen) {
	               i.requestFullscreen();
                } else if (i.webkitRequestFullscreen) {
	               i.webkitRequestFullscreen();
                } else if (i.mozRequestFullScreen) {
	               i.mozRequestFullScreen();
                } else if (i.msRequestFullscreen) {
	              i.msRequestFullscreen();
                }
        }
    }
}

//------------------------------------------------------------------------
function create_plane_uv(w,h,map){
    let a1 = {x:0,y:0,z:0}
    let a2 = {x:0,y:0,z:0}
    let a3 = {x:0,y:0,z:0}
    let a4 = {x:0,y:0,z:0}
    let c1 = {r:0,g:0,b:0}
    let c2 = {r:0,g:0,b:0}
    let c3 = {r:0,g:0,b:0}
    let c4 = {r:0,g:0,b:0}
    let u1 = {x:0.0, y:0.0}
    let u2 = {x:1.0, y:0.0}
    let u3 = {x:1.0, y:1.0}
    let u4 = {x:0.0, y:1.0}
    let buff_p = new Float32Array(18);
    let buff_u = new Float32Array(12);
    a1.z = -0.1;
    a2.z = -0.1;
    a3.z = -0.1;
    a4.z = -0.1;
    a1.x = -w;
    a1.y = -h;
    a2.x =  w;
    a2.y = -h;
    a3.x =  w;
    a3.y =  h;
    a4.x = -w;
    a4.y =  h;
    //a1 a2
    //a4 a3
    buff_p[0] = a1.x; buff_p[1] = a1.y; buff_p[2] = a1.z;    
    buff_p[3] = a3.x; buff_p[4] = a3.y; buff_p[5] = a3.z;    
    buff_p[6] = a2.x; buff_p[7] = a2.y; buff_p[8] = a2.z;    
    buff_p[9]  = a1.x; buff_p[10] = a1.y; buff_p[11] = a1.z;    
    buff_p[12] = a4.x; buff_p[13] = a4.y; buff_p[14] = a4.z;    
    buff_p[15] = a3.x; buff_p[16] = a3.y; buff_p[17] = a3.z;    

    buff_u[0]  = u1.x; buff_u[1] = u1.y;
    buff_u[2]  = u3.x; buff_u[3] = u3.y;
    buff_u[4]  = u2.x; buff_u[5] = u2.y;
    buff_u[6]  = u1.x; buff_u[7] = u1.y;
    buff_u[8]  = u4.x; buff_u[9] = u4.y;
    buff_u[10] = u3.x; buff_u[11] = u3.y;
    
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial({
        map : map,
        //vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
        //wireframe : true,
        transparent : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function create_plane_color(w,h,color){
    let a1 = {x:0,y:0,z:0}
    let a2 = {x:0,y:0,z:0}
    let a3 = {x:0,y:0,z:0}
    let a4 = {x:0,y:0,z:0}
    let buff_p = new Float32Array(18);
    a1.x = -w;
    a1.y = -h;
    a2.x =  w;
    a2.y = -h;
    a3.x =  w;
    a3.y =  h;
    a4.x = -w;
    a4.y =  h;
    //a1 a2
    //a4 a3
    buff_p[0] = a1.x; buff_p[1] = a1.y; buff_p[2] = a1.z;    
    buff_p[3] = a3.x; buff_p[4] = a3.y; buff_p[5] = a3.z;    
    buff_p[6] = a2.x; buff_p[7] = a2.y; buff_p[8] = a2.z;    
    buff_p[9]  = a1.x; buff_p[10] = a1.y; buff_p[11] = a1.z;    
    buff_p[12] = a4.x; buff_p[13] = a4.y; buff_p[14] = a4.z;    
    buff_p[15] = a3.x; buff_p[16] = a3.y; buff_p[17] = a3.z;    
    
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    let material = new THREE.MeshBasicMaterial({
        color     : color,
        side      : THREE.DoubleSide,
        //wireframe : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function _plane_uv(buff_p,buff_u,p,pu,sx,sy,ex,ey,w,h,offset_x,offset_y){
    let a1 = {x:0,y:0,z:0}
    let a2 = {x:0,y:0,z:0}
    let a3 = {x:0,y:0,z:0}
    let a4 = {x:0,y:0,z:0}
    let u1 = {x:sx, y:sy}
    let u2 = {x:ex, y:sy}
    let u3 = {x:ex, y:ey}
    let u4 = {x:sx, y:ey}
    a1.z = 0.0;
    a2.z = 0.0;
    a3.z = 0.0;
    a4.z = 0.0;
    //let w = 0.5;
    //let h = 0.5;
    a1.x = offset_x - w;
    a1.y = offset_y - h;
    a2.x = offset_x + w;
    a2.y = offset_y - h;
    a3.x = offset_x + w;
    a3.y = offset_y + h;
    a4.x = offset_x - w;
    a4.y = offset_y + h;
    //a1 a2
    //a4 a3
    buff_p[p+0]  = a1.x; buff_p[p+1]  = a1.y; buff_p[p+2]  = a1.z;    
    buff_p[p+3]  = a3.x; buff_p[p+4]  = a3.y; buff_p[p+5]  = a3.z;    
    buff_p[p+6]  = a2.x; buff_p[p+7]  = a2.y; buff_p[p+8]  = a2.z;    
    buff_p[p+9]  = a1.x; buff_p[p+10] = a1.y; buff_p[p+11] = a1.z;    
    buff_p[p+12] = a4.x; buff_p[p+13] = a4.y; buff_p[p+14] = a4.z;    
    buff_p[p+15] = a3.x; buff_p[p+16] = a3.y; buff_p[p+17] = a3.z;    

    buff_u[pu+0]  = u1.x; buff_u[pu+1]  = u1.y;
    buff_u[pu+2]  = u3.x; buff_u[pu+3]  = u3.y;
    buff_u[pu+4]  = u2.x; buff_u[pu+5]  = u2.y;
    buff_u[pu+6]  = u1.x; buff_u[pu+7]  = u1.y;
    buff_u[pu+8]  = u4.x; buff_u[pu+9]  = u4.y;
    buff_u[pu+10] = u3.x; buff_u[pu+11] = u3.y;
}
//------------------------------------------------------------------------
// сглаженный переход камеры на новое положение
function render_camera_update(delta){
    //---------------------------------
    let sx  = RENDER.camera_pos1.x;
    let sy  = RENDER.camera_pos1.y;
    let ang = USER.mouse_angle;
    let d   = USER.mouse_d*RENDER.scale;
    let ex  = USER.rx + Math.cos(ang)*d;
    let ey  = USER.ry + Math.sin(ang)*d;
    let x = sx + (ex - sx)*0.05;
    let y = sy + (ey - sy)*0.05;
    RENDER.camera_pos1.x = x;
    RENDER.camera_pos1.y = y;
    
    RENDER.camera_models.position.x = x;
    RENDER.camera_models.position.y = y; 
    let step = RENDER.camera_step;
    RENDER.camera.position.x = Math.round(x/step)*step;
    RENDER.camera.position.y = Math.trunc(y/step)*step;
    x =x * 0.5;
    y =y * 0.5;
    RENDER.camera2.position.x = x;
    RENDER.camera2.position.y = y;
    RENDER.camera3.position.x = x*0.5;
    RENDER.camera3.position.y = y*0.5;
    
    
/*    let s = RENDER.camera_pos1;
    let e = RENDER.camera_pos2;
    if (_units_sw){
        s.x = e.x;
        s.y = e.y;
        e.x = RENDER._camera_pos.x;
        e.y = RENDER._camera_pos.y;
    }
    let t = _units_delta/_frames_delta;
    let x = s.x + (e.x - s.x)*t;
    let y = s.y + (e.y - s.y)*t;

    let d = RENDER.camera_step;
        
    RENDER.camera_models.position.x = x;
    RENDER.camera_models.position.y = y;
    RENDER.camera.position.x = Math.round(x/d)*d;
    RENDER.camera.position.y = Math.trunc(y/d)*d;
    x =x * 0.5;
    y =y * 0.5;
    RENDER.camera2.position.x = x;
    RENDER.camera2.position.y = y;
    RENDER.camera3.position.x = x*0.5;
    RENDER.camera3.position.y = y*0.5;
    //-----------------------------------
*/
    if (RENDER.scale_to!==RENDER._scale_to){
        const max_delta = 500;    
        RENDER.scale_delta = RENDER.scale_delta + delta;
        let t =  RENDER.scale_delta/max_delta;
        if (t>=1){
            RENDER.scale_delta = 0;
            RENDER.scale_to = RENDER._scale_to;
            t = 1;         
        }
        RENDER.scale = RENDER.scale_to + (RENDER._scale_to - RENDER.scale_to)*t;
        let a = RENDER.scale*RENDER.aspect;
        //
        RENDER.camera_models.left   = -a;
	    RENDER.camera_models.right  = a;
	    RENDER.camera_models.top    = RENDER.scale;
	    RENDER.camera_models.bottom = -RENDER.scale;
        RENDER.camera_models.updateProjectionMatrix();
        RENDER.camera.left   = -a;
	    RENDER.camera.right  = a;
	    RENDER.camera.top    = RENDER.scale;
	    RENDER.camera.bottom = -RENDER.scale;
        RENDER.camera.updateProjectionMatrix();
        RENDER.camera2.left   = -a;
	    RENDER.camera2.right  = a;
	    RENDER.camera2.top    = RENDER.scale;
	    RENDER.camera2.bottom = -RENDER.scale;
        RENDER.camera2.updateProjectionMatrix();
        RENDER.camera3.left   = -a;
	    RENDER.camera3.right  = a;
	    RENDER.camera3.top    = RENDER.scale;
	    RENDER.camera3.bottom = -RENDER.scale;
        RENDER.camera3.updateProjectionMatrix();
        //
        RENDER.camera_step = RENDER.scale*2/RENDER.HEIGHT;

    }
    
    

 /*   let x  = RENDER.camera.matrixWorld.elements[12];
    let y  = RENDER.camera.matrixWorld.elements[13];
    let z  = RENDER.camera.matrixWorld.elements[14];
    let dx = RENDER._camera_pos.x - x;
    let dy = RENDER._camera_pos.y - y;
    let dz = RENDER._camera_pos.z - z;
    let d  = delta/100;

    x = x + dx*d;
    y = y + dy*d;
    z = z + dz*d;

    RENDER.camera.matrixWorld.elements[12] = x;
    RENDER.camera.matrixWorld.elements[13] = y;
    RENDER.camera.matrixWorld.elements[14] = z;
    /*let u = unit_get(USER.id);
    if (u!==undefined){
        let x = u.position.x;
        let y = u.position.y;
        let z = u.position.z;
        RENDER.camera.matrixWorld.elements[12] = x;
        //RENDER.camera.matrixWorld.elements[13] = y;
        RENDER.camera.matrixWorld.elements[14] = z+5;

        MAP.update_chunk_pos(x,y,z);
    }*/
    //
}

function render_get_angle_for_mouse(){
    let vx = _v3();
    let v1 = _v3();
    vx.x = 1;
    vx.y = 0;
    vx.z = 0;
    v1.x = CONTROLS.mouse_alpha1;
    v1.y = 0;
    v1.z = -CONTROLS.mouse_alpha2;
    _v_norm(v1,v1);
    let angle = Math.acos(dot(vx,v1))*180/Math.PI;
    if (v1.z > 0 ){
        angle = 360-angle;
    }
    //angle = Math.floor(angle/10)*10;
    RENDER.mouse_angle = Math.round(angle);


    /*let vx = _v3();
    let vz = _v3();
    vz.x = RENDER.camera.matrixWorld.elements[8];
    vz.y = RENDER.camera.matrixWorld.elements[9];
    vz.z = RENDER.camera.matrixWorld.elements[10];

    var vector = new THREE.Vector3();
    vector.set( CONTROLS.mouse_alpha1, -CONTROLS.mouse_alpha2, 0 );
    vector.unproject( RENDER.camera );
    //p.x = cc.x + vx.x*alpha1 - vy.x*dy;
    //p.y = cc.y + vx.y*alpha1 - vy.y*dy;
    //p.z = cc.z + vx.z*alpha1 - vy.z*dy;
    //           /
    //         p
    //        /|
    //       / |
    //      /  |
    //------------------
    //
    // TODO настросить параметры камеры сразу же!
    vx.x = 1;
    vx.y = 0;
    vx.z = 0;
    let p = _v3();
    p.x = vector.x;
    p.y = vector.y;
    p.z = vector.z;
    if (vz.y!==0){
        let d = p.y/vz.y;
        p.x = p.x - vz.x*d;
        p.y = 0;
        p.z = p.z - vz.z*d;
        let up = USER.position;
        let v1 = _v3();
        _v_sub(v1,p,up);
        _v_norm(v1,v1);
        let angle = Math.acos(dot(vx,v1))*180/Math.PI;
        if (v1.z < 0 ){
            angle = 360-angle;
        }
        //angle = Math.floor(angle/10)*10;
        RENDER.mouse_angle = Math.round(angle);
    }         */

}

function render_camera_move(delta){
    //RENDER._camera_pos.x = RENDER._camera_pos.x + RENDER.camera_vector.x*delta;
    //RENDER._camera_pos.z = RENDER._camera_pos.z + RENDER.camera_vector.z*delta;
}

function update_attach_matrix(){
    if (RENDER.mouse_attach!==null){
        let m = RENDER.mouse_attach.matrixWorld.elements;
        m[12] = RENDER.selector.tx;
        m[13] = MAP.get_tile_h(RENDER.selector.tx,RENDER.selector.ty);
        m[14] = RENDER.selector.ty;
    }
}

// заготовка для рендера спрайтов
function render_prepare_sprite(){
    let a1 = {x:0,y:0,z:0}
    let a2 = {x:0,y:0,z:0}
    let a3 = {x:0,y:0,z:0}
    let a4 = {x:0,y:0,z:0}
    let c1 = {r:0,g:0,b:0}
    let c2 = {r:0,g:0,b:0}
    let c3 = {r:0,g:0,b:0}
    let c4 = {r:0,g:0,b:0}
    let u1 = {x:0.0, y:0.0}
    let u2 = {x:1.0, y:0.0}
    let u3 = {x:1.0, y:1.0}
    let u4 = {x:0.0, y:1.0}
    let buff_p = new Float32Array(18);
    let buff_u = new Float32Array(12);
    // a4 a3
    // a1 a2
    a1.x = -0.5;    a1.y = -0.5;
    a2.x =  0.5;    a2.y = -0.5;
    a3.x =  0.5;    a3.y =  0.5;
    a4.x = -0.5;    a4.y =  0.5;
    //a1 a2
    //a4 a3
    buff_p[0]  = a1.x; buff_p[1]  = a1.y; buff_p[2]  = a1.z;    
    buff_p[3]  = a3.x; buff_p[4]  = a3.y; buff_p[5]  = a3.z;    
    buff_p[6]  = a2.x; buff_p[7]  = a2.y; buff_p[8]  = a2.z;    
    buff_p[9]  = a1.x; buff_p[10] = a1.y; buff_p[11] = a1.z;    
    buff_p[12] = a4.x; buff_p[13] = a4.y; buff_p[14] = a4.z;    
    buff_p[15] = a3.x; buff_p[16] = a3.y; buff_p[17] = a3.z;    

    buff_u[0]  = u1.x; buff_u[1] = u1.y;
    buff_u[2]  = u3.x; buff_u[3] = u3.y;
    buff_u[4]  = u2.x; buff_u[5] = u2.y;
    buff_u[6]  = u1.x; buff_u[7] = u1.y;
    buff_u[8]  = u4.x; buff_u[9] = u4.y;
    buff_u[10] = u3.x; buff_u[11] = u3.y;
    
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    RENDER.SpriteGeometry = geometry;
    //-----------------------------
    RENDER.SpriteMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            map    : {type: "t",  value: null },
            offset : {type: "v2", value: new THREE.Vector2()},
            size   : {type: "v2", value: new THREE.Vector2()},
            color  : {type: "c",  value: new THREE.Color(1.0,1.0,1.0)},
            opacity: {value: 1.0},
        },
        vertexShader: [
            'uniform vec2 offset;',
            'uniform vec2 size;',
            'varying vec2 vUv;',
            'void main() {',
                'vUv = offset + uv*size;', //
                'gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);',
            '}'].join(''),
        fragmentShader: [
            'uniform sampler2D map;',
            'uniform vec3 color;',
            'uniform float opacity;',
            'varying vec2 vUv;',
            'void main(void) {',
                'gl_FragColor = texture2D(map, vUv)* vec4(color, opacity);',
		    '}'].join(''),
		side         : THREE.DoubleSide,
		transparent  : true,
        //depthTest    : false,
        //depthWrite   : false,
	});
	//
	RENDER.SpriteAnimMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            map    : {type: "t",  value: null },
            offset : {type: "v2", value: new THREE.Vector2()},
            size   : {type: "v2", value: new THREE.Vector2()},
            color  : {type: "c",  value: new THREE.Color(1.0,1.0,1.0)},
            flow   : {type: "v2", value: new THREE.Vector2(0.0,0.0) },
            opacity: {value: 1.0},
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
                'vUv = uv;', //
                'gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);',
            '}'].join(''),
        fragmentShader: [
            'varying vec2 vUv;',
            'uniform sampler2D map;',
            'uniform vec3 color;',
            'uniform vec2 flow;',
            'uniform vec2 offset;',
            'uniform vec2 size;',
            'uniform float opacity;',
            'void main(void) {',
                'vec2 u = offset + fract(vUv+flow)*size;', //
                'gl_FragColor = texture2D(map, u)* vec4(color, opacity);',
		    '}'].join(''),
		side         : THREE.DoubleSide,
		transparent  : true,
        //depthTest    : false,
        //depthWrite   : false,
	});
}


function render_prepare(){
    RENDER.renderer = new THREE.WebGLRenderer({antialias:false, preserveDrawingBuffer: true, /*logarithmicDepthBuffer:true,*/ precision:'lowp' });
    RENDER.renderer.setSize(RENDER.WIDTH, RENDER.HEIGHT);
    document.body.appendChild(RENDER.renderer.domElement);

    RENDER.aspect        = RENDER.WIDTH/RENDER.HEIGHT;
    RENDER.camera        = new THREE.OrthographicCamera( -RENDER.scale*RENDER.aspect, RENDER.scale*RENDER.aspect, RENDER.scale, -RENDER.scale, 0, 2 );
    RENDER.camera2       = new THREE.OrthographicCamera( -RENDER.scale*RENDER.aspect, RENDER.scale*RENDER.aspect, RENDER.scale, -RENDER.scale, 0, 2 );
    RENDER.camera3       = new THREE.OrthographicCamera( -RENDER.scale*RENDER.aspect, RENDER.scale*RENDER.aspect, RENDER.scale, -RENDER.scale, 0, 2 );
    RENDER.camera_models = new THREE.OrthographicCamera( -RENDER.scale*RENDER.aspect, RENDER.scale*RENDER.aspect, RENDER.scale, -RENDER.scale, 0, 20 );

    RENDER.camera.position.z        = 1.0;
    RENDER.camera2.position.z       = 1.0;
    RENDER.camera3.position.z       = 1.0;
    RENDER.camera_models.position.z = 1.0;

    RENDER.scene        = new THREE.Scene();
    RENDER.scene_models = new THREE.Scene();
    RENDER.scene2       = new THREE.Scene();
    RENDER.scene3       = new THREE.Scene();
    // 
    RENDER.listener = new THREE.AudioListener();
    RENDER.camera.add( RENDER.listener );
    //
    render_prepare_sprite();
    //
    //RENDER.BasicMaterial     = new THREE.MeshBasicMaterial ({ vertexColors: THREE.VertexColors, wireframe : false  });
    RENDER.LensFlareMesh = prepare_sun_light();
    RENDER.planet_earth  = prepare_earth();
    RENDER.planet_moon   = prepare_moon();
    RENDER.planet_lava   = prepare_lava();
    RENDER.planet_sun    = prepare_sun();
    //
    RENDER.composer = new THREE.EffectComposer( RENDER.renderer );
   
    let renderPass3 = new THREE.RenderPass( RENDER.scene3, RENDER.camera3 );
    renderPass3.clear = true;
    RENDER.composer.addPass( renderPass3 );

    let renderPass2 = new THREE.RenderPass( RENDER.scene2, RENDER.camera2 );
    renderPass2.clear = false;
    renderPass2.clearDepth = true;
    RENDER.composer.addPass( renderPass2 );

    let renderPass = new THREE.RenderPass( RENDER.scene, RENDER.camera );
    renderPass.clear = false;
    //renderPass.clearDepth = true;
    RENDER.composer.addPass( renderPass );

    let renderPass_models = new THREE.RenderPass( RENDER.scene_models, RENDER.camera_models );
    renderPass_models.clear = false;
    RENDER.composer.addPass( renderPass_models );


    //RENDER.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(RENDER.WIDTH, RENDER.HEIGHT), 1.5, 0.4, 0.85);//1.0, 9, 0.5, 512);
    //RENDER.bloomPass.renderToScreen = true;
	//RENDER.composer.addPass(RENDER.bloomPass);

    //let outlinePass = new THREE.OutlinePass( new THREE.Vector2(RENDER.WIDTH, RENDER.HEIGHT), RENDER.scene, RENDER.camera);
    //composer.addPass( outlinePass );

    //RENDER.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    //RENDER.effectFXAA.uniforms['resolution'].value.set( 1/RENDER.WIDTH, 1/RENDER.HEIGHT );
    //RENDER.effectFXAA.renderToScreen = true;
    //RENDER.composer.addPass( RENDER.effectFXAA );

    RENDER.copypass = new THREE.ShaderPass( THREE.CopyShader );
    RENDER.copypass.renderToScreen = true;
    RENDER.composer.addPass( RENDER.copypass );
    // ---------------------
    for (let i=0;i<STATIC_INFO.length;i++){
        let url = STATIC_INFO[i].url;
        if (url===''){ continue; }
        let a = TEXTURES.material[url];
        if (a===undefined){
            let t = new THREE.TextureLoader().load( 'i/'+url);
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            TEXTURES.txt[url] = t;
            //a = new THREE.MeshBasicMaterial({ map : t, side : THREE.DoubleSide, transparent : true });
            //if (STATIC_INFO[i].anim===100){
            //    a = RENDER.SpriteAnimMaterial.clone();
            //}else{
                a = RENDER.SpriteMaterial.clone();
            //}
            a.uniforms.map.value = t;
            TEXTURES.material[url] = a;
        }else{ 
            if (STATIC_INFO[i].anim===100){
                a = RENDER.SpriteAnimMaterial.clone();
                a.uniforms.map.value = TEXTURES.txt[url];
            }
        }
        STATIC_INFO[i].material = a;
    }
    // ---------------------
    // Обновляет размеры канвы при изменении размеров окна браузера
    window.addEventListener('resize', render_resize) ;
    //
    RENDER.lastframe_time = performance.now();

    render_resize();
}

function _txtgen_moon(){
    let params = {
        "width"  : 128,
		"height" : 128,
		"items"  : [
			[0, "fill",   {"rgba": [200,200,200,1] }],
			[0, "clouds", {"blend": "opacity", "rgba": [155,155,155,0.5] }],
			[0, "clouds", {"blend": "opacity", "rgba": [55,55,55,0.5] }],
			[0, "clouds", {"blend": "opacity", "rgba": [155,155,155,0.5] }],
			//[0, "clouds", {"blend": "difference", "rgba": [55, 55, 55,0.5] }],
			//[0, "clouds", {"rgba": [100,100,100,[100,255]],}],
			//[0, "clouds", {"blend": "difference", "rgba": [100,100,100,[0.1,0.6]],}],
			//[0, "clouds", {"blend": "difference", "rgba": [100,100,100,[0.1,0.6]],}],
		
/*		
			[0, "clouds", 
			    {
			        "blend"       : "difference",
			        "rgba"        : [100,100,100,1.0],
            		"seed"        : 300,
            		"roughness"   : [10,16],
			    }
			],
*/
//			[0, "emboss"],
		]
	}
	return params;
}

function _txtgen_sun(seed){
    let width  = 256;
    let height = 256;
    //
	let params = {
		"width" : width,
		"height": height,
		"items": [
			[0, "subplasma", { seed: seed,      "size": 4}],
			[0, "subplasma", { seed: seed+1000, "blend": "difference", "size": 5 }],
			[0, "subplasma", { seed: seed+2000, "blend": "difference", "size": 6 }],
			[0, "subplasma", { seed: seed+3000, "blend": "difference", "size": 5 }],
			[0, "subplasma", { seed: seed+4000, "blend": "difference", "size": 4 }],
			[0, "spheres",   { seed: seed+5000, "blend": ["difference"], "size": [25, 37], "count": 10, "dynamic": true}],
			[0, "colorize",  { seed: seed+6000, "colormap": "fire"}],
			[0, "contrast",  { seed: seed+7000, "value":42}]
		]
	}
	
    //
    // initialize the generator
    let generator = tgen.init(height, height);
    // generate
    let canvas  = generator.render(params).toCanvas();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    //
    let camera = new THREE.PerspectiveCamera( 30, width/height, 1, 10000 );
    camera.position.z = 25;
    let scene = new THREE.Scene();
    let texture2 = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );


    let geometry = new THREE.SphereGeometry( 5, 16, 16 );
    let material = new THREE.MeshBasicMaterial( {
        //color     : 0xffff00,
        //wireframe : true,
        map       :  texture,
    });
    let mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);
    //
	RENDER.renderer.render( scene, camera, texture2, true );
	scene.remove(mesh);
	geometry.dispose();
	material.dispose();
    //
    return texture2.texture;
}

function _txtgen_lava(seed){
    let width  = 256;
    let height = 256;
    //
	let params = {
		"width" : width,
		"height": height,
		"items": [
			[0, "subplasma", { seed: seed,      "size": 4}],
			[0, "subplasma", { seed: seed+1000, "blend": "difference", "size": 5 }],
			[0, "subplasma", { seed: seed+2000, "blend": "difference", "size": 6 }],
			[0, "subplasma", { seed: seed+3000, "blend": "difference", "size": 5 }],
			[0, "subplasma", { seed: seed+4000, "blend": "difference", "size": 4 }],
			[0, "spheres",   { seed: seed+5000, "blend": ["difference"], "size": [25, 37], "count": 10, "dynamic": true}],
			[0, "colorize",  { seed: seed+6000, "colormap": "!fire"}],
			[0, "contrast",  { seed: seed+7000, "value":42}]
		]
	}
	
    //
    // initialize the generator
    let generator = tgen.init(height, height);
    // generate
    let canvas  = generator.render(params).toCanvas();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    //
    let camera = new THREE.PerspectiveCamera( 30, width/height, 1, 10000 );
    camera.position.z = 25;
    let scene = new THREE.Scene();
    let texture2 = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );


    let geometry = new THREE.SphereGeometry( 5, 16, 16 );
    let material = new THREE.MeshBasicMaterial( {
        //color     : 0xffff00,
        //wireframe : true,
        map       :  texture,
    });
    let mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);
    //
	RENDER.renderer.render( scene, camera, texture2, true );
	scene.remove(mesh);
	geometry.dispose();
	material.dispose();
    //
    return texture2.texture;
}

function _txtgen_earth(seed){
    let width  = 512;
    let height = 512;
    //
    let camera = new THREE.PerspectiveCamera( 30, width/height, 1, 10000 );
    camera.position.z = 25;
    let scene = new THREE.Scene();
    let texture2 = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );



    //
	let params = {
		"width" : width,
		"height": height,
		"items": [
    		[0, "fill",   { "rgba": [0,0,255,1] }],
			[0, "clouds", { seed: seed, blend:  "difference", rgba: [0,[100,255],0,1], roughness: 16 }],
			[0, "map",    { xamount: 155, yamount: 155, xchannel: 0, ychannel: 0, xlayer: 0, ylayer: 0}],
			//[0, "clouds", {"blend": "opacity", "rgba": [55,55,55,0.5] }],
			//[0, "clouds", {"blend": "opacity", "rgba": [155,155,155,0.5] }],
			//[0, "colorize",  { seed: seed+6000, "colormap": "blackwhite"}],
			//[0, "contrast",  { seed: seed+7000, "value":42}],
			//[0, "emboss"],
		]
	}
    //
    // initialize the generator
    let generator = tgen.init(height, height);
    // generate
    let canvas  = generator.render(params).toCanvas();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;


    let geometry = new THREE.SphereGeometry( 5, 16, 16 );
    let material = new THREE.MeshBasicMaterial( {
        map       :  texture,
    });
    let mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);
    
    //
    params = {
		"width": width,
		"height": height,
		"items": [
			[0, "clouds", { seed:seed+1000, blend: "opacity", rgba: [255, 255, 255, 1.0], roughness: [1, 2]}],
			[0, "clouds", { seed:seed+2000, blend: "overlay", rgba: [0, 100, 200, 1],     roughness: [2,4]}],
			[0, "map",    { xamount: 155, yamount: 155, xchannel: 0, ychannel: 0, xlayer: 0, ylayer: 0}],
		]
	}
    //
    generator.clear();
    let texture3 = new THREE.Texture(generator.render(params).toCanvas());
    texture3.needsUpdate = true;
    let geometry2 = new THREE.SphereGeometry( 5.4, 16, 16 );
    let material2 = new THREE.MeshBasicMaterial( {
        map         : texture3,
        transparent : true,
        opacity     : 0.4,
    });
    let mesh2 = new THREE.Mesh( geometry2, material2 );
    scene.add(mesh2);

    //
	RENDER.renderer.render( scene, camera, texture2, true );
	scene.remove(mesh);
	geometry.dispose();
	material.dispose();
	scene.remove(mesh2);
	geometry2.dispose();
	material2.dispose();
    //
    return texture2.texture;
}


function _txtgen_moon(seed){
    let width  = 256;
    let height = 256;
    //
    let camera = new THREE.PerspectiveCamera( 30, width/height, 1, 10000 );
    camera.position.z = 25;
    let scene = new THREE.Scene();
    let texture2 = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

    //
	let params = {
		"width" : width,
		"height": height,
		"items": [
    		[0, "fill",   { "rgba": [150,150,150,1] }],
			[0, "clouds", { seed: seed, blend:  "overlay", rgba: [100,100,100,1], roughness: 8 }],
			[0, "map",    { xamount: 1000, yamount: 1000, xchannel: 0, ychannel: 0, xlayer: 0, ylayer: 0}],
			//[0, "clouds", {"blend": "opacity", "rgba": [55,55,55,0.5] }],
			//[0, "clouds", {"blend": "opacity", "rgba": [155,155,155,0.5] }],
			//[0, "colorize",  { seed: seed+6000, "colormap": "blackwhite"}],
			//[0, "contrast",  { seed: seed+7000, "value":42}],
			//[0, "emboss"],
		]
	}
    //
    // initialize the generator
    let generator = tgen.init(height, height);
    // generate
    let canvas  = generator.render(params).toCanvas();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;


    let geometry = new THREE.SphereGeometry( 5, 16, 16 );
    let material = new THREE.MeshBasicMaterial( {
        map       :  texture,
    });
    let mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);

    //
	RENDER.renderer.render( scene, camera, texture2, true );
	scene.remove(mesh);
	geometry.dispose();
	material.dispose();
    //
    return texture2.texture;
}


function prepare_sun_light(){
    //------------------------------------------------
    let scale    = 50.0;
    let buff_p   = new Float32Array(18);
    let buff_u   = new Float32Array(12);
    let scalex   = 512/100*scale;
    let scaley   = 512/100*scale;
    _plane_uv(buff_p,buff_u,0,0,0,0,1,1,scalex,scaley,0,0);
    //------------------------------------------------
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial( {
        color           : 0xffa500,
        //wireframe : true,
        side            : THREE.DoubleSide,
        map             : TEXTURES.lensflare0,
        transparent     : true,
        blending        : THREE.AdditiveBlending,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}


function prepare_sun(){
    //------------------------------------------------
    let scale    = 1.0;
    let buff_p   = new Float32Array(18);
    let buff_u   = new Float32Array(12);
    let scalex   = 512/100*scale;
    let scaley   = 512/100*scale;
    _plane_uv(buff_p,buff_u,0,0,0,0,1,1,scalex,scaley,0,0);
    //------------------------------------------------
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial( {
        side            : THREE.DoubleSide,
        map             : _txtgen_sun(1000),
        transparent     : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function prepare_moon(){
    let scale    = 1.0;
    let buff_p   = new Float32Array(18);
    let buff_u   = new Float32Array(12);
    let scalex   = 512/100*scale;
    let scaley   = 512/100*scale;
    _plane_uv(buff_p,buff_u,0,0,0,0,1,1,scalex,scaley,0,0);
    //------------------------------------------------
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial( {
        side            : THREE.DoubleSide,
        map             : _txtgen_moon(2000),
        transparent     : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function prepare_lava(){
    let scale    = 1.0;
    let buff_p   = new Float32Array(18);
    let buff_u   = new Float32Array(12);
    let scalex   = 512/100*scale;
    let scaley   = 512/100*scale;
    _plane_uv(buff_p,buff_u,0,0,0,0,1,1,scalex,scaley,0,0);
    //------------------------------------------------
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial( {
        side            : THREE.DoubleSide,
        map             : _txtgen_lava(2000),
        transparent     : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function prepare_earth(){
    let scale    = 1.0;
    let buff_p   = new Float32Array(18);
    let buff_u   = new Float32Array(12);
    let scalex   = 512/100*scale;
    let scaley   = 512/100*scale;
    _plane_uv(buff_p,buff_u,0,0,0,0,1,1,scalex,scaley,0,0);
    //------------------------------------------------
    let geometry  = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( buff_p, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( buff_u, 2 ) );
    let material = new THREE.MeshBasicMaterial( {
        side            : THREE.DoubleSide,
        map             : _txtgen_earth(100000),
        transparent     : true,
    });
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
}

function stop_animate(){
    cancelAnimationFrame(RENDER.animframeID);
    RENDER.renderer.clear();
}

function animate(){
    RENDER.animframeID = requestAnimationFrame(animate);
    let delta = performance.now() - RENDER.lastframe_time;
    //if ( delta>20 ){
        RENDER.lastframe_time = performance.now();
        //
        map_render_update(delta);
        units_render_update(delta);
        bullets_update(delta);
        //
        render_camera_update(delta);
       	RENDER.composer.render();
    //}
}
