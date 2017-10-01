"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let INFO           = null;
let user_manager   = null;
let map_manager    = null;
let item_manager   = null;
let static_manager = null;

let list = [];

let tureli      = [];
let transport   = [];
let kabans      = [];
let worms       = [];

// 01 2 3 45 67 89 1011 1213 1415 1617 1819 2021 2223 2425 2627
const frame_line_length = 28;
const FRAME_id      = 0;
const FRAME_cx      = 2;
const FRAME_cy      = 3;
const FRAME_x       = 4;
const FRAME_y       = 6;
const FRAME_angle   = 8;
const FRAME_status  = 10;
const FRAME_hp      = 12;
const FRAME_shield  = 14;
const FRAME_unit_id = 16;
const FRAME_damage  = 18;
const FRAME_angle1  = 20;
const FRAME_angle2  = 22;
const FRAME_angle3  = 24;
const FRAME_angle4  = 26;

function prepare(_INFO,_user_manager,_map_manager,_item_manager,_static_manager){
    INFO            = _INFO;
    user_manager    = _user_manager;
    map_manager     = _map_manager;
    item_manager    = _item_manager;
    static_manager  = _static_manager;
    //
/*    
    for (let i=0;i<tureli.length;i++){
        new_turel(tureli[i]);
    }
    
    // создаем транспортные корабли
    for (let i=0;i<50;i++){
        new_transport(5);
    }
    for (let i=0;i<25;i++){
        new_transport(6);
    }
    */
 /*   for (let i=0;i<1;i++){
        new_transport(7);
    }
    */
/*
    // создаем кобанчиков
    for (let i=0;i<10;i++){
        new_kaban();
    }
*/
    // создаем червей
 /*   for (let i=0;i<1;i++){
        new_worm(2);    //2,3 черви
        new_worm(3);
    }
    */
}

function new_turel(a){
    let id     = map_manager.get_new_unit_id();
    console.log(id);
    let owner  = 0;
    let angle  = 0;
    let status = INFO.OBJ_STATUS_NPC;
    let hp     = 100;
    let shield = 100;
    let dvig   = 0; // у турелей нет двигаетеля
    let gun1   = 0;
    let gun2   = 0;
    let gun3   = 0;
    let gun4   = 0;
    map_manager.new_unit(id,a.cx,a.cy,a.x,a.y,owner,a.unit_type,angle,status,hp,shield,dvig,gun1,gun2,gun3,gun4);
    a.unit_id = id;
}

function new_transport(type){
    let cx = 50;
    let cy = 50;
    let x = Math.trunc(20000+Math.random()*20000);
    let y = Math.trunc(20000+Math.random()*20000);
    let a = {
        unit_type   : type,
        static_id   : 0,
        cx          : cx,
        cy          : cy,
        x           : x,
        y           : y,
        unit_id     : 0,
    }
    Object.seal(a);
    transport.push(a);
    
    let id     = map_manager.get_new_unit_id();
    let owner  = 0;
    let angle  = 0;
    let status = INFO.OBJ_STATUS_NPC;
    let hp     = 100;
    let shield = 100;
    let dvig   = 2;
    let gun1   = 0;
    let gun2   = 0;
    let gun3   = 0;
    let gun4   = 0;
    map_manager.new_unit(id,a.cx,a.cy,a.x,a.y,owner,a.unit_type,angle,status,hp,shield,dvig,gun1,gun2,gun3,gun4);
    a.unit_id = id;
}

function new_kaban(){
    let a = {
        unit_type   : 8,
        static_id   : 0,
        cx          : 50,
        cy          : 50,
        x           : 32000,
        y           : 32000,
        unit_id     : 0,
    }
    Object.seal(a);
    kabans.push(a);
    
    let id     = map_manager.get_new_unit_id();
    let owner  = 0;
    let angle  = 0;
    let status = INFO.OBJ_STATUS_NPC;
    let hp     = 100;
    let shield = 100;
    let dvig   = 0;
    let gun1   = 0;
    let gun2   = 0;
    let gun3   = 0;
    let gun4   = 0;
    map_manager.new_unit(id,a.cx,a.cy,a.x,a.y,owner,a.unit_type,angle,status,hp,shield,dvig,gun1,gun2,gun3,gun4);
    a.unit_id = id;
    return a;
}

function new_worm(type){
    let a = {
        unit_type   : type, //2,3 черви
        static_id   : 0,
        cx          : 50,
        cy          : 50,
        x           : 32000,
        y           : 32000,
        unit_id     : 0,
    }
    Object.seal(a);
    worms.push(a);
    
    let id     = map_manager.get_new_unit_id();
    let owner  = 0;
    let angle  = 0;
    let status = INFO.OBJ_STATUS_NPC;
    let hp     = 100;
    let shield = 100;
    let dvig   = 0;
    let gun1   = 0;
    let gun2   = 0;
    let gun3   = 0;
    let gun4   = 0;
    map_manager.new_unit(id,a.cx,a.cy,a.x,a.y,owner,a.unit_type,angle,status,hp,shield,dvig,gun1,gun2,gun3,gun4);
    a.unit_id = id;
    return a;
}

// добавили новый объект на карту
function static_add(id,type,cx,cy,x,y){
/*    if (type===88){
        let a = {
            unit_type   : 4,
            static_id   : id,
            cx          : cx,
            cy          : cy,
            x           : x,
            y           : y,
            unit_id     : 0,
        }
        Object.seal(a);
        tureli.push(a);
        if (map_manager!==null){ 
            new_turel(a); 
            //
            let res = {t:0,l:[a],c:[],k:[]};
            resend(JSON.stringify(res));
        }
        //
    }
    if (type===93){
        if (map_manager!==null){ 
            let a = new_kaban();
            a.cx = cx;
            a.cy = cy;
            a.x  = x;
            a.y  = y;
            a.static_id = id;
            //
            let res = {t:0,l:[],c:[],k:[a]};
            resend(JSON.stringify(res));
        }
        //
    }
*/
}

function req(socket,d,buff_length){
    let type = d.getUint8(0);  //
    let res,p;
    switch(type){
        case 0  :   // запросил список информацию
                res = {t:0,l:tureli,c:transport,k:kabans,w:worms};
                list.push(socket);
                socket.send(JSON.stringify(res));
            break;
        case 1  :
                // none
            break;
        case 2  :   // прислал обновления по юнитам
                let n = Math.trunc((buff_length - 1)/frame_line_length);
                p = buff_length - frame_line_length;
                do{
                    // 01 2 3 45 67 89 1011 1213 1415 1617 1819
                    let id      = d.getUint16( p+ FRAME_id      );
                    let cx      = d.getUint8(  p+ FRAME_cx      );
                    let cy      = d.getUint8(  p+ FRAME_cy      );
                    let x       = d.getUint16( p+ FRAME_x       );
                    let y       = d.getUint16( p+ FRAME_y       );
                    let angle   = d.getUint16( p+ FRAME_angle   );
                    let status  = d.getUint16( p+ FRAME_status  );
                    let hp      = d.getUint16( p+ FRAME_hp      );
                    let shield  = d.getUint16( p+ FRAME_shield  );
                    let unit_id = d.getUint16( p+ FRAME_unit_id );
                    let damage  = d.getUint16( p+ FRAME_damage  );
                    let angle1  = d.getUint16( p+ FRAME_angle1  );
                    let angle2  = d.getUint16( p+ FRAME_angle2  );
                    let angle3  = d.getUint16( p+ FRAME_angle3  );
                    let angle4  = d.getUint16( p+ FRAME_angle4  );
                    //let fuel    = d.getUint16();
                    let unit    = map_manager.get_unit(id);
                    //
                    if (damage!==0){
                        let u = user_manager.get_user_by_n(unit_id);
                        if (u!==undefined){
                            user_manager.damage(u,damage);
                            let user_unit = map_manager.get_unit(u.unit_id);
                            let status = map_manager.get_status(user_unit.frame_pos);
                            if (u.ship_hp===0){
                                status = status | INFO.OBJ_STATUS_BOOM;
                                u.unit_destroyed = true;
                            }
                            // обновляем данные
                            let shield = Math.trunc(u.ship_shield);
                            map_manager.set_hp(     user_unit.frame_pos, u.ship_hp  );
                            map_manager.set_shield( user_unit.frame_pos, shield     );
                            map_manager.set_status( user_unit.frame_pos, status     );
                        }
                    }
                    //
                    map_manager.set_position(unit.frame_pos, x, y, angle, angle1, angle2, angle3, angle4 );
                    map_manager.set_hp(      unit.frame_pos, hp          );
                    map_manager.set_shield(  unit.frame_pos, shield      );
                    map_manager.set_status(  unit.frame_pos, status      );
                    // поверяем переход в другой сектор
                    let chunk_p = cy*map_manager.bb_width + cx;
                    if (unit.chunk_p!==chunk_p){
                        map_manager.transfer(unit,chunk_p,cx,cy);
                        //user_manager.update_vis(u,cx,cy);
                    }
                    p = p - frame_line_length;
                    n = n - 1;
                } while (n!==0);
                //map_manager.remove_unit(u.unit_id);
            break;
    }
    //
    return;
}

function resend(data){
    try{
        for (let i in list){
            let s = list[i];
            s.send(data);
        }
    }catch(e){
        list = [];
    }    
}

function update(delta){
}
//
module.exports.prepare                  = prepare;
module.exports.req                      = req;
module.exports.update                   = update;
module.exports.resend                   = resend;
module.exports.static_add               = static_add;

