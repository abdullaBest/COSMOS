"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

const _max_unused_frames = 3;

let _units               = null;
let _units_unused        = null;
let _units_by_id         = new Map();
let _units_unused_frames = _max_unused_frames;
let _units_delta         = 0;
let _units_sw            = false; // метка в интерполяторе движения
let _units_wait_info     = false;   
let _units_wait_info_id  = 0;   
let _random_list         = new Float32Array(100).fill(0.0);
let vector               = null;

const _frames_delta      = 400;
const _frames_delta_r    = 100;


function units_prepare(){
    _seed = 1;
    for (let i=0;i<_random_list.length;i++){ _random_list[i] = random(); }
    //
    vector = new THREE.Vector3();
}

function _new_unit(id){

/*    let rx  = (cx + (x/WORD))*chunk_width;  
    let ry  = (cy + (y/WORD))*chunk_width;
    let ang = (angle/WORD)*2*Math.PI;
*/
    let a = {
        id          : id,
        cx          : 0,
        cy          : 0,
        x           : 0,
        y           : 0,
        //
        type        : 0,
        angle       : 0,         // интерполированный угол
        new_angle   : 0.0,       // реальный угол
        guns_type   : [0,0,0,0], // типы пушек
        guns_angle  : [0,0,0,0],
        guns_i      : [0,0,0,0],    //
        status      : 0,
        hp          : 0,
        shield      : 0,
        dvig        : 0,
        //
        new_p       : { x:0.0, y:0.0 },
        //
        last_dr     : 0,
        ship        : null,
        box         : [],
        //
        next        : null,
        prev        : null,
        //
        div         : null,
        name_span   : null,
        hp_bar      : null,
        //
        name        : '',
        //
        _rnd        : 0,
    }
    Object.seal(a);
    //
    //_unit_box(a);
    //
    _units_by_id.set(id,a);
    return a;
}

function unit_set(id,cx,cy,x,y,angle,status,hp,shield,angle1,angle2,angle3,angle4){
    let a = _units_by_id.get(id);
    //
    let rx = (cx + (x/WORD))*chunk_width;  
    let ry = (cy + (y/WORD))*chunk_width;
    angle  = (angle/WORD)*2*Math.PI;
    // если такого юнита нет в списке то создаем его
    if (a===undefined){
        a = _new_unit(id);
        //
        if (id===USER.unit_id){
            a.new_angle = angle;
            a.new_p.x   = USER.rx;  
            a.new_p.y   = USER.ry;  
            let ship = USER.ships[USER.curr_ship];
            _unit_set_info(a,'',ship.type,ship.dvig,ship.guns,ship.guns_i);
        }        
    }
    //
    a.x             = x;
    a.y             = y;
    a.cx            = cx;
    a.cy            = cy;
    a.hp            = hp;
    a.shield        = shield;
    a.new_angle     = angle;
    a.guns_angle[0] = (angle1/WORD)*2*Math.PI;
    a.guns_angle[1] = (angle2/WORD)*2*Math.PI;
    a.guns_angle[2] = (angle3/WORD)*2*Math.PI;
    a.guns_angle[3] = (angle4/WORD)*2*Math.PI;
    //
    let dd = Math.abs(a.new_angle - a.angle);
    if (dd>Math.PI){ 
        a.new_angle = a.new_angle - 2*Math.PI; 
    }else{
        a.new_angle = a.new_angle; 
    }
    //
    if (id!==USER.unit_id){
        a.new_p.x   = rx;  
        a.new_p.y   = ry;  
        
        //
        if (a.ship!==null){
            unit_update_box(a);
        }
    }else{
        let ship = USER.ships[USER.curr_ship];
        ship.hp     = hp;
        ship.shield = shield;
    }
    // проверка на изменение состояния от игрока
    if ( ((a.status ^ status) & OBJ_STATUS_CHCK)!==0){
        // у коробля обновился счетчик псевдо случайных чисел
        if (status & OBJ_STATUS_UPD_RND){ a._rnd = 0; }
        // обновляем состояние пушек
        if (a.ship!==null) { 
            unit_fire_status(a); 
            monster_hvost_update(a.ship,rx,ry);
        }
    }else{
        //if (id===USER.unit_id){console.log('check false');}
    }
    a.status        = status;
    // корабль взорвался
    if (status & OBJ_STATUS_BOOM){
        new_particle(PANIM_SHIP_BOOM,rx,ry,0,0,0.0,0);
        for (let i=0;i<5;i++){
            let n = Math.trunc(Math.random()*4);
            let ang = random()*Math.PI*2;
            let speed = 0.0010 + Math.random()*0.0040; 
            new_particle(PANIM_SHIP_FIRE_PARTS+n,rx,ry,ang,speed,0.0,1000);
        }
        if (id===USER.unit_id){
            USER.unit_destroyed = true;
        }
    }
    // обновляем информацию по юнитам
    if (!_units_wait_info && a.ship===null){
        _buff_dv.setUint16(   3,  a.id );
        send_bin( MSG_UNIT_INFO, 5  );
        _units_wait_info_id = a.id;
        _units_wait_info = true;           
    }
    // Обновляем список активных
    _unit_is_active(a);
    // обновляем счетчик псевдо рандома
    a._rnd = a._rnd+1;
    if (a._rnd===100){
        a._rnd = 0;
        if (a.id === USER.unit_id){
            USER.status  = USER.status | OBJ_STATUS_UPD_RND;
        }
    }
}

// стрельба, создание пуль 
function unit_fire_status(u){
    let f  = u.ship.guns_firing;
    let m  = u.ship.guns_mesh;
    let fl = u.ship.guns_flash;
    let s  = u.status;
    //
    const d  = (-0.05 + _random_list[u._rnd]*0.1); // разброс угла от пушки, чтобы пули не летели по четкой прямой
    const dd = 0.2;//+ Math.random()*0.5; 
    let ang  = u.new_angle;//u.ship.m.rotation.z;
    let vx1  = Math.cos(ang);
    let vy1  = Math.sin(ang);
    let vx2  = -vy1;
    let vy2  = vx1;
    //
    f[0] = s & OBJ_STATUS_FIRE1;
    f[1] = s & OBJ_STATUS_FIRE2;
    f[2] = s & OBJ_STATUS_FIRE3;
    f[3] = s & OBJ_STATUS_FIRE4;
    //
    for (let i=0;i<4;i++){
        if (m[i]===null) { continue; }
        // пушка должна существовать
        if ( f[i]!==0 ){
            fl[i].visible = true;
            
            let g = m[i];
            let angle = ang + u.guns_angle[i] + d;
            let xx = (vx1*g.position.x + vx2*g.position.y)*u.ship.m.scale.x;
            let yy = (vy1*g.position.x + vy2*g.position.y)*u.ship.m.scale.y;        
            let x = u.ship.m.position.x + xx + Math.cos(angle)*dd;
            let y = u.ship.m.position.y + yy + Math.sin(angle)*dd;
            //
            let gun_info = INFO_GUNS[u.guns_type[i]];
            let damage = 0;
            switch (gun_info.type){
              case GUNS_TYPE_BULLET: //
                                    // обновляем данные игрока
                                    if (USER.unit_id===u.id){
                                        let ship = USER.ships[USER.curr_ship];
                                        let b = ship.guns_i[i];
                                        let e = ship.energy;
                                        if ((b>=gun_info.bullets) && (e>=gun_info.energy)){
                                            ship.guns_i[i] = b - gun_info.bullets;
                                            ship.energy    = e - gun_info.energy;
                                        }
                                    }
                                    damage = gun_info.bullet_damage;
                                    new_bullet_shot( u.id, damage, x , y, angle, 0.020);
                                    break;
              case GUNS_TYPE_LASER : //
                                    if (USER.unit_id===u.id){
                                        let ship = USER.ships[USER.curr_ship];
                                        let b = ship.guns_i[i];
                                        let e = ship.energy;
                                        if ( b>0 && b<=e ){
                                            ship.energy = e - b;
                                        }
                                    }
                                    damage = u.guns_i[i];
                                    let scale = 0.1 + u.guns_i[i]*0.001;
                                    new_laser_shot(u.id, damage, scale, x , y, angle, 40);
                                    break;
            }
        }else{
            fl[i].visible = false; 
        }
    }
}

// переносит юнита из списка не активных в список активных, 
// это нужно чтобы юнит не удалился при проверке неактивных.
function _unit_is_active(a){
    let prev = a.prev;
    let next = a.next;
    if (prev!==null){ prev.next = next; }
    if (next!==null){ next.prev = prev; }
    if (_units===a){ _units = next; }
    //
    if (_units_unused===a){
        _units_unused = next;
        if (next!==null){ next.prev = null; }
    }
    //
    a.prev = null;
    a.next = _units;
    if (_units!==null){
        _units.prev = a;
    }
    _units = a;
}
//
function unit_get(id){ return _units_by_id.get(id); }
//
function unit_create_div(u){
    u.div = document.createElement('div');
    u.div.className = 'canvas_ship_info';
    u.name_span = document.createElement('span');
    u.div.appendChild(u.name_span);
    document.body.appendChild(u.div);
}
function unit_update_div(u){ u.name_span.innerText = u.name; }

//
function _unit_set_info(a,name,type,dvig,guns,guns_i){
    a.name = name;
    a.type = parseInt(type);
    a.dvig = parseInt(dvig);
    a.guns_type[0] = parseInt(guns[0]);
    a.guns_type[1] = parseInt(guns[1]);
    a.guns_type[2] = parseInt(guns[2]);
    a.guns_type[3] = parseInt(guns[3]);
    a.guns_i[0] = parseInt(guns_i[0]);
    a.guns_i[1] = parseInt(guns_i[1]);
    a.guns_i[2] = parseInt(guns_i[2]);
    a.guns_i[3] = parseInt(guns_i[3]);
    if (name!==''){
        unit_create_div(a);
        unit_update_div(a);
    } 
    a.ship = new_ship( a.type, a.guns_type, a.dvig );      
    a.ship.m.position.x = a.new_p.x; 
    a.ship.m.position.y = a.new_p.y;
    a.ship.m.rotation.z = a.new_angle;
    //
    unit_create_box(a);
    // TODO сделать корабль игрока выше по z всех остальных
    RENDER.scene_models.add(a.ship.m);
    for (let i=0;i<a.ship.hvost.length;i++){
        RENDER.scene_models.add(a.ship.hvost[i].m);
    }
}
//
function unit_set_info(data){
    //console.log(name);
    let id   = _units_wait_info_id;
    _units_wait_info = false;
    let a = _units_by_id.get(id);
    if (a!==undefined){
        _unit_set_info(a,data.name,data.type,data.dvig,data.guns,data.guns_i);
    }
}

// удаляем информацию по все юнитам
function units_clear(){
    unit_new_frame(); // чистием которые были на очереди на очистку
    unit_new_frame(); // очередь обновилась и теперь чистием всех остальных
}

// начался новый кадр, удаляем все юниты которые больше не обновляются
function unit_new_frame(){
    //console.log('unused---------------------------------------------------')
    //_units_unused_frames = _units_unused_frames - 1;
    //if (_units_unused_frames===0){
        //_units_unused_frames = _max_unused_frames;
        let a = _units_unused;
        while (a!==null){
            let next = a.next;
            if (a.ship!==null){
                RENDER.scene_models.remove(a.ship.m);
                for (let i=0;i<a.ship.hvost.length;i++){
                    RENDER.scene_models.remove(a.ship.hvost[i].m);
                    let box = a.ship.hvost[i].box;
                    if (box!==null){
                        MAP.box.remove(box);
                    }
                }
                ship_free(a.ship);
            }
            for (let i=0;i<a.box.length;i++){
                MAP.box.remove(a.box[i]);
            }
            if (a.div!==null){
                document.body.removeChild(a.div);
            }
            _units_by_id.delete(a.id);
            a.div  = null;
            a.prev = null;
            a.next = null;
            a = next;
        }
        _units_unused = _units;
        _units = null;
    //}
}

function units_render_update(delta){
    _units_sw = false;
    _units_delta = _units_delta + delta;
    if (_units_delta>=_frames_delta){
        _units_delta   = _units_delta - _frames_delta;
        if (_units_delta>=_frames_delta){ _units_delta = 0; }
        _units_sw = true;
    }
    let t = _units_delta/_frames_delta;
    //--------------
    for (let uu of _units_by_id){
        let id = uu[0];
        let u  = uu[1];
        if (u.ship===null){
            continue;
        }
        //
        let tt = 0.05;
        // обновляем положение 
        let sx = u.ship.m.position.x;
        let sy = u.ship.m.position.y;
        let ex = u.new_p.x;
        let ey = u.new_p.y;
        let rx = sx + (ex-sx)*tt;
        let ry = sy + (ey-sy)*tt;
        u.ship.m.position.x = rx;
        u.ship.m.position.y = ry;
        //
        u.angle = u.angle + (u.new_angle - u.angle)*0.2;
        u.ship.m.rotation.z = u.angle;
        // обновялем хвост   
        let h  = u.ship.hvost;
        for (let i=0;i<h.length;i++){
            sx = h[i].m.position.x;
            sy = h[i].m.position.y;
            h[i].m.position.x = sx + (h[i].x - sx)*tt;
            h[i].m.position.y = sy + (h[i].y - sy)*tt;
            let r = h[i].m.rotation.z;
            h[i].m.rotation.z = r + (h[i].angle - r)*tt;
            //
        }
        // обновляем корабль
        ship_update(u,delta);
        //
        // обновляем положениe инфо-div
        if (u.div!==null){
            vector.x = rx;
            vector.y = ry;
            vector.z = 0;
            vector.project(RENDER.camera);
            vector.x =  ( vector.x * RENDER.halfWIDTH  ) + RENDER.halfWIDTH;
            vector.y = -( vector.y * RENDER.halfHEIGHT ) + RENDER.halfHEIGHT;
            let x = Math.round(vector.x);
            let y = Math.round(vector.y);
            if (x>=0 && x<RENDER.WIDTH && y>=0 && y<RENDER.HEIGHT){
                const of = 100*0.5;//u.div.offsetWidth
                u.div.style.transform = 'translate('+(x - of)+'px,'+y+'px)';
                u.div.style.display  = 'block';
            }else{
                u.div.style.display  = 'none';
            }
        } 
    }    
}
//=============================================================
// BOX
function unit_create_box(a){
    let info = INFO_UNITS[a.type];
    let rx   = a.cx*WORD + a.x;
    let ry   = a.cy*WORD + a.y;
    let tip  = info.box_mask;     // тип объекта
    let mask = UNIT_ASTEROID;     // с кем сталкивается
    let l    = info.corpus.length;
    for (let i=0;i<l;i++){
        let corpus = info.corpus[i];
        let offset = info.corpus_offset[i];
        //
        let x = Math.trunc(rx + offset.x*WORD/chunk_width); 
        let y = Math.trunc(ry + offset.y*WORD/chunk_width);
        //
        let dx = STATIC_INFO[corpus].box;
        //
        let box = MAP.box.add(a.id,x,y,dx,dx,tip,mask);
        a.box.push(box);
    }
    // двигатель
    if (a.dvig!==0){
        let dvig = INFO_DVIGS[a.dvig].n;
        let offset = info.dvig;
        //
        let x = Math.trunc(rx + offset.x*WORD/chunk_width); 
        let y = Math.trunc(ry + offset.y*WORD/chunk_width);
        let dx = STATIC_INFO[dvig].box;
        //
        let box = MAP.box.add(a.id,x,y,dx,dx,tip,mask);
        a.box.push(box);
    }
    // Хвост
    for (let i=0;i<info.hvost.length;i++){
        let h = a.ship.hvost[i];
        let n = info.hvost[i];
        let hvost = STATIC_INFO[n];
        let dx = hvost.box;
        //
        let x = Math.trunc(rx);
        let y = Math.trunc(ry);
        //
        let box = MAP.box.add(a.id,x,y,dx,dx,tip,mask);
        h.box = box;
    }
}
function unit_update_box(a){
    let info = INFO_UNITS[a.type];
    let ship = a.ship;
    let rx   = a.cx*WORD + a.x;
    let ry   = a.cy*WORD + a.y;
    let v1x  = Math.cos(a.new_angle);
    let v1y  = Math.sin(a.new_angle);
    let v2x  = -v1y;
    let v2y  = v1x;  
    //
    let p   = 0;
    let box = a.box[0];
    let m   = ship.m;
    MAP.box.new_position(box,rx,ry);
    let scalex = m.scale.x*WORD/chunk_width;
    let scaley = m.scale.y*WORD/chunk_width;
    // корпус
    let l    = info.corpus.length-1;
    for (let i=0;i<l;i++){
        p   = p + 1;
        box = a.box[p];
        m   = ship.m.children[i];
        let x = Math.trunc(rx + (v1x*m.position.x + v2x*m.position.y)*scalex);
        let y = Math.trunc(ry + (v1y*m.position.x + v2y*m.position.y)*scaley);
        MAP.box.new_position(box,x,y);
    }
    // двигатель
    if (a.dvig!==0){
        p   = p + 1;
        box = a.box[p];
        m   = ship.dvig_mesh;
        let x = Math.trunc(rx + (v1x*m.position.x + v2x*m.position.y)*scalex);
        let y = Math.trunc(ry + (v1y*m.position.x + v2y*m.position.y)*scaley);
        MAP.box.new_position(box,x,y);
    }
    // хвост
    for (let i=0;i<ship.hvost.length;i++){
        let h = ship.hvost[i];
        let x = Math.trunc(h.x*WORD/chunk_width);
        let y = Math.trunc(h.y*WORD/chunk_width);
        MAP.box.new_position(h.box,x,y);
    }
}
//=============================================================
function _new_ship(){
    let a = {
        m               : null,                     // mesh корпуса
        hvost           : [],                       // список ячеек хвоста
        hvost_dx        : 0,
        guns_mesh       : [null,null,null,null],    // mesh пушек
        guns_flash      : [null,null,null,null],    // вспышки от пушек
        guns_flash_d    : 0,                        // дельта времени для вспышек
        guns_flash_n    : [0,0,0,0],                // номер кадра вспышки
        guns_firing     : [0,0,0,0],                // стреляет сейчас оружие или нет
        dvig_mesh       : null,                     // mesh двигателя
    }
    Object.seal(a);
    return a;
}

function _new_hvost(mesh){
    let a = {
        x       : 0,
        y       : 0,
        angle   : 0,
        m       : mesh,
        box     : null,
    }
    Object.seal(a);
    return a;
}

function new_ship(type,guns_type,dvig){
    let info   = INFO_UNITS[type];
    let corpus = STATIC_INFO[info.corpus[0]];
    let a  = _new_ship();
    let cx = 0;
    let cy = 0;
    let x  = 0;
    let y  = 0;
    let n  = info.corpus[0];
    let size  = 1.0;
    let angle = 0;
    a.m = _map_sprite_mesh(cx,cy,x,y,n,size,angle);
    // корпус
    let z = -0.01;
    for (let i=1;i<info.corpus.length;i++){
        n = info.corpus[i];
        let m = _map_sprite_mesh(0,0,0,0,n,size,angle);
        m.position.set( info.corpus_offset[i].x/a.m.scale.x, info.corpus_offset[i].y/a.m.scale.y, z );
        let sx = m.scale.x/a.m.scale.x;
        let sy = m.scale.y/a.m.scale.y;
        m.scale.set(sx,sy,1.0);
        z = z - 0.01;
        a.m.add(m);
    }
    // двигатель
    if (dvig!==0){
        n = INFO_DVIGS[dvig].n;
        let m = _map_sprite_mesh(0,0,0,0,n,size,angle);
        m.position.set( info.dvig.x/a.m.scale.x, info.dvig.y/a.m.scale.y, -0.01 );
        let sx = m.scale.x/a.m.scale.x;
        let sy = m.scale.y/a.m.scale.y;
        m.scale.set(sx,sy,1.0);
        a.dvig_mesh = m;
        a.m.add(m);
    }
    // вооружение
    for (let i=0;i<info.guns.length;i++){
        let gun = guns_type[i];
        if (gun!==0){
            // пушка
            let gun_info = INFO_GUNS[gun];
            n = gun_info.n;
            let m = _map_sprite_mesh(0,0,0,0,n,size,angle);
            m.position.set( info.guns[i].x, info.guns[i].y, 0.01 );
            let sx = m.scale.x/a.m.scale.x;
            let sy = m.scale.y/a.m.scale.y;
            m.scale.set(sx,sy,1.0);
            a.m.add(m);
            a.guns_mesh[i] = m;
            //вспышка
            n = gun_info.fn[0];
            let mm = _map_sprite_mesh(0,0,0,0,n,gun_info.fscale,angle);
            mm.position.set( gun_info.fo.x, gun_info.fo.y, 0.01 );
            sx = mm.scale.x/a.m.scale.x;
            sy = mm.scale.y/a.m.scale.y;
            mm.scale.set(sx,sy,1.0);
            mm.visible = false;
            m.add(mm);
            a.guns_flash[i] = mm;
        }
    }

    // хвост
    z = -0.01;
    for (let i=0;i<info.hvost.length;i++){
        n = info.hvost[i];
        let hvost = STATIC_INFO[n];
        let m = _map_sprite_mesh(0,0,0,0,n,size,angle);
        m.position.set( a.m.position.x, a.m.position.y, z );
        z = z - 0.01;
        let hv = _new_hvost( m );
        a.hvost.push(hv);
    }
    return a;
}

function ship_free(a){
   /* for (let i=0;i<a.m.children.length;i++){
        let b = a.m.children[i];
        b.geometry.dispose();
    }
    */     
}

// обновляет положение пушек и вспышек 
function ship_update(unit,delta){
    let t  = unit.guns_type;
    let f  = unit.ship.guns_firing;
    let fl = unit.ship.guns_flash;
    let m  = unit.ship.guns_mesh;
    let d  = unit.ship.guns_flash_d + delta;
    let n  = unit.ship.guns_flash_n;
    let nn = 0;
    const time = 30;
    if (d>time){ d = d - time; nn=1; }
    unit.ship.guns_flash_d = d;
    for (let i=0;i<4;i++){
        if (m[i]!==null){
            m[i].rotation.z = unit.guns_angle[i];
            // стрельба
            if ( f[i]!==0 ){
                n[i] = n[i] + nn;                
                let info = INFO_GUNS[t[i]];
                if (n[i]===info.fn.length){
                    n[i] = 0;
                }
                let sp_n = info.fn[n[i]];
                fl[i]._my.sx = STATIC_INFO[sp_n].frame[0];
                fl[i]._my.sy = 1.0 - (STATIC_INFO[sp_n].frame[1] + STATIC_INFO[sp_n].frame[3]);
            }
        }
    }
}


function monster_hvost_update(a,head_x,head_y){
    const dx = 0.5; // растояние между ячеками
    let h  = a.hvost;
    let l  = h.length;
    let nx = head_x;
    let ny = head_y;
    for (let i=0;i<l;i++){
        let vx = nx - h[i].x; 
        let vy = ny - h[i].y;
        //TODO упрастить код без sqrt и atan
        let d = Math.sqrt(vx*vx+vy*vy);
        if (d>dx){
            h[i].x = nx - (vx/d)*dx;
            h[i].y = ny - (vy/d)*dx;
            //
            let ang = Math.atan2(vy, vx);
            if (isNaN(ang)){ang=0;}
            if (ang<0){ang = 2*Math.PI + ang;}
            
            let dd = Math.abs(ang - h[i].angle);
            if (dd>Math.PI){ ang = ang - 2*Math.PI; } 
            
            h[i].angle = ang;
        } 
        nx = h[i].x;
        ny = h[i].y;
    }
}
