"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let BULLETS = {
    b_g     : [
                create_plane_color(0.1,0.02,'#ffffff'),
                ],
    ms      : [],     // список всех пуль
    used    : 0,      // количество использованных
    max     : 2000,   // максимальное количество пуль на сцене
    time    : 2000,   // время полета
    dlinna  : 10,     // дальность полета
}
Object.seal(BULLETS);

const PANIM_SHIP_HIT_CORPUS = 0;
const PANIM_SHIP_HIT_SHIELD = 1;
const PANIM_ASTEROID_BOOM   = 2;
const PANIM_SHIP_FIRE_PARTS = 6;
const PANIM_SHIP_BOOM       = 10;
const PANIM_LASER_SHOT      = 11;
const PANIM_ASTER_BOX       = 12;
const PANIM_ASTER_IRON      = 13;
const PANIM_ASTER_GOLD      = 14;
const PANIM_ASTER_PLATINUM  = 15;

let PARTICLES = {
    anims   : [
                [35,36,37],                             // 0 искры от пуль на корабле
                [46,47,48,47],                          // 1 волны от щита при попадании
                [42],                                   // 2 куски метеоритов
                [43],                                   // 3
                [44],                                   // 4
                [45],                                   // 5
                [38],                                   // 6 горящие осколки от корабля
                [39],                                   // 7
                [40],                                   // 8
                [41],                                   // 9
                [49,49,50,50,51,51,52,52,53,53,54,54],  // 10 взрыв
                [98],                                   // 11 лазерный выстрел
                [102],                                  // 12 ящик
                [99],                                   // 13 железо
                [100],                                  // 14 золото
                [101],                                  // 15 платина
              ],
    list    : [],
    used    : 0,
    max     : 200,
}
Object.seal(PARTICLES);

function bullets_prepare(){
    for (let i=0;i<BULLETS.max;i++){
        let n = Math.trunc(Math.random()*1);
        let g0 = BULLETS.b_g[n].geometry;
        let m0 = BULLETS.b_g[n].material;

        let dx = 0.1;

        let m = new THREE.Mesh( g0, m0 );
        m.position.z = 0.6;
        let a = {
            m      : m,
            delta  : 0,
            _delta : 0,
            from   : {x:0,y:0},
            v      : {x:0,y:0},
            d      : 0,
            speed  : 0,
            owner  : 0,
            damage : 0,
            // координаты для бокс
            _x     : 0,
            _y     : 0,
        }
        Object.seal(a);
        BULLETS.ms.push(a);

    }
    BULLETS.used = 0;
    //
    let scale = 1.0;
    // искры
    //
    for (let i=0;i<PARTICLES.max;i++){
        let dx = 0.1;
        let a = {
            m       : null,         // mesh 
            from    : {x:0,y:0},    // стартовая позиция 
            v       : {x:0,y:0},    // вектор движения 
            speed   : 0,            // скорость движения

            delta   : 0,            // отсчет времени
            time    : 0,            // время жизни 
            
            opacity : 0.0,
            
            anim    : 0,
            anim_d  : 0,
            anim_l  : null,
        }
        Object.seal(a);
        PARTICLES.list.push(a);
    }
    PARTICLES.used = 0;
}

// персонаж выстрелил, делаем дополнительные проверки на попадание
function new_bullet_shot(owner,damage,sx,sy,angle,speed){
    if (BULLETS.used<BULLETS.max){
        let p = BULLETS.ms[BULLETS.used];
        BULLETS.used = BULLETS.used+1;
        //
        p.owner  = owner;
        p.damage = damage;
        p.from.x = sx;
        p.from.y = sy;
        //let ang = angle * Math.PI/180;
        p.v.x   = Math.cos(angle);
        p.v.y   = Math.sin(angle);
        p.speed = speed;
        p.delta = 0;
        p.m.position.x = sx;
        p.m.position.y = sy;
        p.m.rotation.z = angle;
        p._x = Math.trunc((sx/chunk_width)*WORD);
        p._y = Math.trunc((sy/chunk_width)*WORD);
        //
        //
        RENDER.scene_models.add(p.m);
    }
}

function new_laser_shot(owner,damage,scale,sx,sy,angle,dlinna){
    let vx = Math.cos(angle);
    let vy = Math.sin(angle);
    //
    let _sx = Math.trunc((sx/chunk_width)*WORD);
    let _sy = Math.trunc((sy/chunk_width)*WORD);
    let _dx = sx + vx*dlinna;
    let _dy = sy + vy*dlinna;
    _dx = Math.trunc((_dx/chunk_width)*WORD) - _sx;
    _dy = Math.trunc((_dy/chunk_width)*WORD) - _sy;
    //
    let r = MAP.box.raytrace(_sx,_sy,_dx,_dy,owner);
    let d = dlinna;
    if (r!==null){
        d = d*MAP.box.r_dlinna;
        let xx = sx + vx*d; 
        let yy = sy + vy*d; 
        bullets_hit(owner,damage,xx,yy,r);
    }
    let x = sx + vx*d*0.5;
    let y = sy + vy*d*0.5;
    let p  = new_particle(PANIM_LASER_SHOT,x,y,angle,0,1,200);
    p.m.scale.x = d;
    p.m.scale.y = scale;//0.1;//0.1
    p.m._my.r = 1.0;
    p.m._my.g = 0.0;
    p.m._my.b = 0.0;
    p.m._my.a = 1.0;
}

// персонаж выстрелил, делаем дополнительные проверки на попадание
function new_particle(type,sx,sy,angle,speed,opacity,time){
    if (PARTICLES.used<PARTICLES.max){
        let p = PARTICLES.list[PARTICLES.used];
        PARTICLES.used = PARTICLES.used+1;
        //
        p.from.x   = sx;
        p.from.y   = sy;
        p.v.x      = Math.cos(angle);
        p.v.y      = Math.sin(angle);
        p.speed    = speed;
        p.delta    = 0;
        p.opacity  = opacity;
        p.anim     = 0;
        p.anim_d   = 0;
        
        let g0,m0,size=1.0;
        p.anim_l = PARTICLES.anims[type];
        //
        p.m = _map_sprite_mesh(0,0,0,0,p.anim_l[0],size,angle);
        p.m.position.x = sx;
        p.m.position.y = sy;
        p.m.position.z = 0.6;
        p.m.rotation.z = angle;
        if (time===0){
            p.time = 50*p.anim_l.length;
        }else{
            p.time     = time;
        }
        RENDER.scene_models.add(p.m);
        return p;
    }
    return null;
}

function particle_free(n){
    PARTICLES.used = PARTICLES.used - 1;
    let p1 = PARTICLES.list[PARTICLES.used]; 
    let p2 = PARTICLES.list[n];
    if (PARTICLES.used!==n){
        PARTICLES.list[PARTICLES.used] = p2;
        PARTICLES.list[n] = p1;
    }
    //
    RENDER.scene_models.remove(p2.m);
    p2.m = null;
}

function bullet_free(n){
    BULLETS.used = BULLETS.used - 1;
    let p1 = BULLETS.ms[BULLETS.used]; 
    let p2 = BULLETS.ms[n];
    if (BULLETS.used!==n){
        BULLETS.ms[BULLETS.used] = p2;
        BULLETS.ms[n] = p1;
    }
    //
    RENDER.scene_models.remove(p2.m);
}

// Произошло нанесение урону от пули или лазера по box объекту (статичному или динамическому)
// owner       - владелец пули, кто попал.
// damage      - урон  
// hit_x,hit_y - координаты попадания
// r           - box в который попали, у бокса есть владелец id
function bullets_hit(owner,damage,hit_x,hit_y,r){
    // если мы попали в динамический объект
    if (r.tip & UNIT_SHIP){
        let unit = unit_get(r.id);
        // если пуля принадлежит игроку
        if (owner===USER.unit_id){
            // если объект принадлежит ИИ
            if (unit.status & OBJ_STATUS_NPC){ user_hit_dynamic(damage,r.id); }
        }else{
            // если попали в нас
            if ( r.id===USER.unit_id ){ user_damage(owner,damage); }        
        }
        let angle = 0;
        let speed = 0; 
        //let x = p.m.position.x;
        //let y = p.m.position.y;
        if (damage<=unit.shield){
            new_particle(PANIM_SHIP_HIT_SHIELD,hit_x,hit_y,angle,speed,0.0,0);
        }else{
            new_particle(PANIM_SHIP_HIT_CORPUS,hit_x,hit_y,angle,speed,0.0,0);
        }
    }else{
        // если попал в статичный объект
        if (r.tip & UNIT_ASTEROID){
            // если пуля принадлежит игроку
            if (owner===USER.unit_id){ user_hit_static(damage,r.id); }
            let angle = 0;
            let speed = 0; 
            //let x = p.m.position.x;
            //let y = p.m.position.y;
            new_particle(PANIM_SHIP_HIT_CORPUS,hit_x,hit_y,angle,speed,0.0,0);
        }
    }
}

function bullets_update(delta){
    let i = 0;
    while (i<BULLETS.used){
        let p = BULLETS.ms[i];
        p.delta = p.delta + delta;
        if (p.delta>=BULLETS.time){
            bullet_free(i)
        }else{
            let d = p.delta*p.speed;
            p.m.position.x = p.from.x + p.v.x*d;
            p.m.position.y = p.from.y + p.v.y*d;
            let _x = Math.trunc((p.m.position.x/chunk_width)*WORD);
            let _y = Math.trunc((p.m.position.y/chunk_width)*WORD);
            //
            let dx = _x - p._x;
            let dy = _y - p._y;
            let r = MAP.box.raytrace(p._x,p._y,dx,dy,p.owner);
            if ( r!==null ){
                bullets_hit(p.owner,p.damage,p.m.position.x,p.m.position.y,r);
                bullet_free(i);
            }else{
                i=i+1;
            }
            //
            p._x = _x;
            p._y = _y;
            //
        }
    }
    //------------------
    i = 0;
    while (i<PARTICLES.used){
        let p = PARTICLES.list[i];
        p.delta = p.delta + delta;
        if (p.delta>=p.time){
            particle_free(i)
        }else{
            let d = p.delta*p.speed;
            p.m.position.x = p.from.x + p.v.x*d;
            p.m.position.y = p.from.y + p.v.y*d;
            if (p.opacity!==0){
                p.m._my.a = 1.0 - p.delta/p.time;
            }
            //if (t>0.7){
            //    p.m.material.opacity = 0.5;//1.0 - t;
            //}
            p.anim_d = p.anim_d + delta;
            if (p.anim_d>50){
                p.anim_d = 0;
                p.anim = p.anim + 1;
                if (p.anim===p.anim_l.length){
                    p.anim = 0;
                }
                let f = STATIC_INFO[p.anim_l[p.anim]].frame;
                p.m._my.sx = f[0];
                p.m._my.sy = 1.0-(f[1]+f[3]);
            }
        }
        i = i+1;
    }
}
