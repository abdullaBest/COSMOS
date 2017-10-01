"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let MSG = {
    div                 : null,
}

let USER = {
    url                 : location.hostname+':3000', //'crocodile.gq', //  
    n                   : -1,
    id                  : getCookie('id'),
    code                : getCookie('code'),
    socket              : null,
    //
    credits             : 0, // деньги
    //
    curr_ship           : 0,
    ships               : [],    
    //
    unit_id             : 0,
    /*ship_type           : 0,
    crew_count          : 0,
    */
    cx                  : 0,
    cy                  : 0,
    x                   : 0,
    y                   : 0,
    rx                  : 0,
    ry                  : 0,
    angle               : 0,
    ang                 : 0,
    //speed               : 0,
    _speed              : 0,
    _fuel               : 0,
    status              : 0,
   /* shield              : 0,        // Щит
    shield_max          : 1000,
    shield_gen          : 0,
    cargo               : 0,
    cargo_max           : 0,
    */
    damage              : 0,    // урон который нанесли кораблю
    //hp                  : 0,
    //hp_max              : 1000,
    //ship_dvig           : 0,
    //ship_guns           : [0,0,0,0],
    gun_angle           : [0,0,0,0],
    gun_stats           : [0,0,0,0],
    //energy              : 0,
    //energy_type         : 0,
    //energy_gen          : 0,
    //energy_max          : 0,
    //
    gameplay_timer      : 0,
    //
    mouse_d             : 0.0,
    mouse_angle         : 0.0,

    answer_status       : _send_status_frame,
    
    static_hit_n        : 0,    //
    static_hit_list     : [],   //
    dynamic_hit_n       : 0,    //
    dynamic_hit_list    : [],   //
    //
    items_group_id      : 0,
    items               : [],
    //
    storage_static_id   : 0,
    storage_items       : [],
    //
    unit_destroyed      : false,
    name                : '',
    //
    _ship_fuel         : 0,        // погрешность в расчетах
    ship_fuel          : 0,        // топливо на корабле
    ship_fuel_max      : 0,        // максимальный запас топлива на корабле
    //bullets            : 0,        // количество пуль
    //
    wait_for_device    : false,     // ждем ответа от сервера по устройству
    _wait_for_device    : false,    // две штуки нужно чтобы с задержкой обновить основной параметр, после прихода фрейма

    //
    fire               : false,
    _fire              : false,
    //
    mouse              : new THREE.Vector3(),
}
Object.seal(USER);
//2+1+ 1+1+2+2+ 2+2+ 2+2+ 2+2+2+2+ 2+4), // n,tip, - cx,cy,x,y,  -angle,status, - damage,fuel - angle1,angle2,angle3,angle4 - hit_dynamic,hit_static
let _buff     = new ArrayBuffer(256);
let _buff_dv  = new DataView(_buff);


const WORD = 65536;
//------------------------------------------------------------------------------------
//                                   ФРЕЙМЫ
//  0 1     2 3    4 5    6 7      8 9       10 11    12 13       14 15     16 17       18 19      20 21      -    byte offset
// id(2),  x(1),  y(1),  angle(2), status(2), hp(2), shield(2), angle1(2), angle2(2), angle3(2), angle4(2)    - 22 байта одна строка

const FRAME_data_id        = 0;   // 2  unit_id
const FRAME_data_x         = 2;   // 2  - координаты объекта внутри блока
const FRAME_data_y         = 4;   // 2  -
const FRAME_data_angle     = 6;   // 2  угол 
const FRAME_data_status    = 8;   // 2  статус
const FRAME_data_hp        = 10;  // 2  очки жизни
const FRAME_data_shield    = 12;  // 2  щит
const FRAME_data_angle1    = 14;  // 2  угол пушки 1  
const FRAME_data_angle2    = 16;  // 2  угол пушки 2
const FRAME_data_angle3    = 18;  // 2  угол пушки 3 
const FRAME_data_angle4    = 20;  // 2  угол пушки 4

const _frameline_size      = 22;            // длинна строки в байтах

//------------------------------------------------------------------------------------
const STATIC_data_id        = 0;    // 4  unit_id
const STATIC_data_x         = 4;    // 2  - координаты объекта внутри блока
const STATIC_data_y         = 6;    // 2  -
const STATIC_data_type      = 8;    // 2  тип объекта
const STATIC_data_angle     = 10;   // 2  угол 
const STATIC_data_status    = 12;   // 2  статус
const STATIC_data_scale     = 14;   // 2  размер

const _static_frameline_size = 16;     // длинна строки в байтах для статики

//===================================================
function getCookie(cname) {let name = cname + "=";let ca = document.cookie.split(';');for(let i = 0; i < ca.length; i++) {let c = ca[i]; while (c.charAt(0) == ' ') { c = c.substring(1); }if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); } }return '';}
function msg(a){ MSG.div.children[1].innerHTML = a; MSG.div.style.display = 'block'; }
function msg_close(){ MSG.div.style.display = 'none'; }
//===================================================
function restart_connection(){let s = new WebSocket('ws://'+USER.url);s.binaryType='arraybuffer';s.onopen=socket_onopen;s.onmessage=server_message;s.onclose=socket_onclose;USER.socket=s;}
function socket_onopen(event){ send_json([0,MSG_LOGIN,USER.id,USER.code]); }
function socket_onclose(event){ stop_gameplay(); msg('связь прервана'); }
// отправляет сообщение на сервер
function send_json(d){ d[0] = USER.n;USER.socket.send(JSON.stringify(d)); }
// отправляет бинарный буфер, tip - сообщения, l - длинна сообщения 
function send_bin(tip,l){ _buff_dv.setUint16( 0, USER.n ); _buff_dv.setUint8(  2, tip ); USER.socket.send(new Uint8Array(_buff, 0, l)); }
//===================================================
function update_user_per_frame(){
    let ship = USER.ships[USER.curr_ship];
    // востанавливаем энергию
    let e = ship.energy;
    e = Math.min( e + ship.energy_gen, ship.energy_max );
    // востанавливаем щиты
    if (ship.shield<ship.shield_max){
        if (e>=ship.shield_gen){
            e = e - ship.shield_gen;
            ship.shield = Math.min( ship.shield + ship.shield_gen, ship.shield_max );
        }  
    }
    // ВНИМАНИЕ: обновление количества патронов и траты энергии от выстрела лазером происходит в модуле units
    ship.energy = e;
    //
    if (ship.fuel>0){   
        let d  = USER._fuel + ship.speed*0.0001;
        let dd = Math.trunc(d);
        USER._fuel = d - dd;
        if (dd<=ship.fuel){
            ship.fuel  = ship.fuel - dd;
            ship.speed = USER._speed;
        }
    }else{
        ship.fuel   = 0;
        USER._fuel  = 0;
        USER._speed = 0;
        ship.speed  = 0;
    }
    //
    USER.wait_for_device = USER._wait_for_device;    
}

// началься новый фрейм
function new_frame(){
    // c начала отправляем запросы по карте
    map_update();
    //
    update_user_per_frame();
    //
    user_send_status();
    // обновляем юниты
    unit_new_frame();
    //
    //console.log('new_frame');
}

// отправляем на сервер наше тукщее состояние
function user_send_status(){
    //
    let dmg = USER.damage;
    if (dmg>0xFFFF){
        dmg = 0xFFFF;
        USER.damage = USER.damage - 0xFFFF;
    }else{
        USER.damage = 0;
    }
    //
    let ship = USER.ships[USER.curr_ship];
    // затем отправляем данные о положении и направлении взгляда
    // 01 2 3 4 56 78 910 1112 1314 1516 1718 1920 2122 2324 2526 19202122 = 23 
    _buff_dv.setUint16(  0,  USER.n ); 
    _buff_dv.setUint8(   2,  MSG_UNIT_POS ); 
    _buff_dv.setUint8(   3,  USER.cx );
    _buff_dv.setUint8(   4,  USER.cy );
    _buff_dv.setUint16(  5,  USER.x );
    _buff_dv.setUint16(  7,  USER.y );
    _buff_dv.setUint16(  9,  USER.angle );
    _buff_dv.setUint16( 11,  USER.status );
    _buff_dv.setUint16( 13,  dmg );
    _buff_dv.setUint16( 15,  ship.fuel );
    _buff_dv.setUint16( 17,  USER.gun_angle[0] );
    _buff_dv.setUint16( 19,  USER.gun_angle[1] );
    _buff_dv.setUint16( 21,  USER.gun_angle[2] );
    _buff_dv.setUint16( 23,  USER.gun_angle[3] );
    let l = 25;
    //записываем количество попаданий в динамические объекты
    _buff_dv.setUint8( l,  USER.dynamic_hit_n );
    l = l + 1;
    
    //console.log(USER.dynamic_hit_n,USER.static_hit_n);
    
    // список динамических попаданий
    for (let i=0;i<USER.dynamic_hit_n;i++){
        let a = USER.dynamic_hit_list[i];
        _buff_dv.setUint16( l + 0,  a.d );
        _buff_dv.setUint16( l + 1,  a.n );
        l = l + 4;
    }
    USER.dynamic_hit_n = 0;
    // список статичных попаданий
    for (let i=0;i<USER.static_hit_n;i++){
        let a = USER.static_hit_list[i];
        _buff_dv.setUint16( l + 0,  a.d );
        _buff_dv.setUint32( l + 1,  a.n );
        l = l + 6;
    }
    USER.static_hit_n = 0; 
    //
    USER.socket.send(new Uint8Array(_buff, 0, l));
    //
    USER.status = 0;
}

// разбираем бинарное сообщение с сервера
function server_message_bin(data){ 
    let b = new DataView(data);
    if (b.byteLength<9){
        let a = b.getUint8(0);
        switch(a){
            // начался новый фрейм
            case _send_status_next_tick  : new_frame(); break;
            // пришли данные по карте
            case _send_status_block      : USER.answer_status = _send_status_block; break;
            // данные по карте закончились
            case _send_status_block_end  : USER.answer_status = _send_status_frame; map_finalize_chunk(); break;
        }
    }else{
        // сервер прислал фрейм
        if (USER.answer_status===_send_status_frame){
            let cx = b.getUint8(0);
            let cy = b.getUint8(1);
            let p  = b.byteLength;
            while (p!=2){
                p = p - _frameline_size;
                let id      = b.getUint16( p + FRAME_data_id      );
                let x       = b.getUint16( p + FRAME_data_x       );
                let y       = b.getUint16( p + FRAME_data_y       );
                let angle   = b.getUint16( p + FRAME_data_angle   );
                let status  = b.getUint16( p + FRAME_data_status  );
                let hp      = b.getUint16( p + FRAME_data_hp      );
                let shield  = b.getUint16( p + FRAME_data_shield  );
                let angle1  = b.getUint16( p + FRAME_data_angle1  );
                let angle2  = b.getUint16( p + FRAME_data_angle2  );
                let angle3  = b.getUint16( p + FRAME_data_angle3  );
                let angle4  = b.getUint16( p + FRAME_data_angle4  );
                unit_set(id,cx,cy,x,y,angle,status,hp,shield,angle1,angle2,angle3,angle4);
            }
        }
        //
        if (USER.answer_status===_send_status_block){
            map_chunk(b);
        }
    }
}
// пришло сообщение с сервера
function server_message(data){
    if (data.data instanceof ArrayBuffer){ // получаем данные по кадрам
        server_message_bin(data.data);
    }else{
        if (data.data.length!==0 && data.data[0]==='{'){
            let a = JSON.parse(data.data);
            let tip = parseInt(a.i);
            let items;
            switch(tip){
                case MSG_MSG        :  msg(ERROR_MSGS[a.m]);
                                    break;
                case MSG_INIT       :
                                        //USER.n          = parseInt(USER.id);
                                        USER.name       = a.name;
                                        USER.credits    = parseInt(a.credits);
                                        USER.cx         = parseInt(a.cx);
                                        USER.cy         = parseInt(a.cy);
                                        USER.x          = parseInt(a.x);
                                        USER.y          = parseInt(a.y);
                                        USER.unit_id    = parseInt(a.unit_id);
                                        USER.curr_ship  = parseInt(a.curr_ship);
                                        user_parse_items(a.items);
                                        //
                                        USER.rx = (USER.cx + USER.x/WORD)*chunk_width;
                                        USER.ry = (USER.cy + USER.y/WORD)*chunk_width;
                                        //
                                        RENDER.camera_pos1.x = USER.rx; 
                                        RENDER.camera_pos1.y = USER.ry; 
                                        //TODO выход со станции без сдвига
                                        //
                                        station_hide();
                                        //gui_refresh_user_items();
                                        //
                                        map_update_center(USER.cx,USER.cy);
                                        //
                                        start_gameplay();
                                    break;    
                case MSG_LOGIN      : // сервер не присылает такое сообщение никогда
                                    break;    
                case MSG_LOGIN_FAIL :
                                        window.location = '/'; 
                                    break;    
                case MSG_UNIT_INFO  : // пришла информацию по юниту
                                        unit_set_info(a); 
                                    break;    
                case MSG_STATIC     : // пришла информация по объекту на карте
                                    gui_static_info(a); 
                                    break;
/*                case MSG_ITEMS      :
                                        USER.storage_static_id = parseInt(a.s_id);
                                        if (a.s!==null){
                                            USER.storage_items = [];
                                            items = a.s.split(';');
                                            if (items.length>1){
                                                for (let i=0;i<items.length-1;i++){
                                                    let it = items[i].split('-');
                                                    USER.storage_items.push({
                                                        id    : parseInt(it[0]),
                                                        n     : parseInt(it[1]),
                                                        count : parseInt(it[2]),
                                                        value : parseInt(it[3]),
                                                        _count: parseInt(it[2]),
                                                    });
                                                }
                                            } 
                                            gui_refresh_storage_items();
                                        }
                                        //
                                        USER.items_group_id = parseInt(a.u_id);
                                        if (a.u!==null){
                                            USER.items = [];
                                            items = a.u.split(';');
                                            if (items.length>1){
                                                for (let i=0;i<items.length-1;i++){
                                                    let it = items[i].split('-');
                                                    USER.items.push({
                                                        id    : parseInt(it[0]),
                                                        n     : parseInt(it[1]),
                                                        count : parseInt(it[2]),
                                                        value : parseInt(it[3]),
                                                        _count: parseInt(it[2]),
                                                    });
                                                }
                                            }
                                            gui_refresh_user_items();
                                        } 
                                    break;    
*/
                case MSG_STATION    :
                                    if( USER.gameplay_timer!==0){
                                        stop_gameplay();
                                        units_clear(); // удаляем все юниты
                                    }
                                    station_data(a);
                                    break;
                case MSG_DEVICE     : // сервер уведомил что обработал работу устройства и можно отправлять новые запросы 
                                    USER._wait_for_device = false;
                                    break;
            }
        }else{
            map_chunk_update(data.data);
        }
        //
    }
}
//===================================================
function parse_items(s){
    let items = [];
    let list = s.split(';');
    let l = list.length;
    if (l>1){
        l=l-1;
        for (let i=0;i<l;i++){
            let it = list[i].split('-');
            let a = {
                id    : parseInt(it[0]),    // id предмета
                n     : parseInt(it[1]),    // n тип предмета
                count : parseInt(it[2]),    // count
                value : parseInt(it[3]),    // value
            }
            Object.seal(a);
            items.push(a);
        }
    } 
    return items;
}

function user_parse_items(items){
    //USER.items_group_id = parseInt(a.grp_id);
    USER.items = [];
    let list = items.split(';');
    let l = list.length;
    if (l>1){
        l=l-1;
        for (let i=0;i<l;i++){
            let it = list[i].split('-');
            USER.items.push({
                id    : parseInt(it[0]),
                n     : parseInt(it[1]),
                count : parseInt(it[2]),
                value : parseInt(it[3]),
                _count: parseInt(it[2]),
            });
        }
    } 
}

function get_item_id_by_n(n){ return ITEMS_INFO[n].u_iid; }
/*
function get_user_item_by_n(n){
    for (let i=0;i<USER.items.length;i++){
        if (USER.items[i].n===n){
            return USER.items[i];
        }
    }
    return null;
}
*/
//===================================================
// попал в статичный объект
function user_hit_static(damage,static_id){
    if (USER.static_hit_n!==USER.static_hit_list.length){
        let a = USER.static_hit_list[USER.static_hit_n];
        a.d = damage;
        a.n = static_id;
        USER.static_hit_n = USER.static_hit_n + 1;
        console.log(damage);
    }
}
// попал в динамичный объект
function user_hit_dynamic(damage,unit_id){
    if (USER.dynamic_hit_n!==USER.dynamic_hit_list.length){
        let a = USER.dynamic_hit_list[USER.dynamic_hit_n];
        a.d = damage;
        a.n = unit_id;
        USER.dynamic_hit_n = USER.dynamic_hit_n + 1;
        console.log(damage);
    }
}
// игроку нанесли урон
function user_damage(unit_id,damage){ 
    USER.damage = USER.damage + damage; 
    console.log(damage);
}
// игрок активирует разные функции оружия
function user_switch_gun(gun_n){
    USER.gun_stats[gun_n] = USER.gun_stats[gun_n] + 1;
    if (USER.gun_stats[gun_n]>2){
        USER.gun_stats[gun_n] = 0;   
    }
    //
    stat_gun_status();
    //
}

//===================================================
function gameplay_update(delta){
    //------------------------------------------------------------------
    if (CONTROLS.wheel_delta<0){
        if (RENDER.scale_to>4){ RENDER._scale_to = RENDER.scale_to - 5; } 
        CONTROLS.wheel_delta = 0;
    }
    if (CONTROLS.wheel_delta>0){
        if (RENDER.scale_to<300){ RENDER._scale_to = RENDER.scale_to + 5; } 
        CONTROLS.wheel_delta = 0;  
    }
    //------------------------------------------------------------------
    //
    if (EDITOR.active){ return; }

    const speed_step = 16;
    let flags  = CONTROLS.flags;
    let status = USER.status;
    let vx = 0;
    let vy = 0;
    if (!GUI.active){
        // Скорость
        if (flags & FLAG_UP){
            USER._speed = USER._speed + speed_step;
            if (USER._speed> 1024){USER._speed = 1024;} 
        }
        if (flags & FLAG_DOWN){
            USER._speed = USER._speed - speed_step;
            if (USER._speed<-64){USER._speed = -64;}
        }
        let ang = USER.ang;
        if (flags & FLAG_LEFT){
            ang = ang + 0.1;
            if (ang>2*Math.PI){ang = ang - 2*Math.PI;}
        }
        if (flags & FLAG_RIGHT){
            ang = ang - 0.1;
            if (ang<0){ang = 2*Math.PI + ang;}
        }
        USER.ang   = ang;
        USER.angle = Math.trunc((ang/(2*Math.PI))*WORD);
        vx = Math.cos(ang);
        vy = Math.sin(ang);
        // стрельба
        if (USER.fire){
            if (USER.gun_stats[0]<2){ status = status | OBJ_STATUS_FIRE1; }
            if (USER.gun_stats[1]<2){ status = status | OBJ_STATUS_FIRE2; }
            if (USER.gun_stats[2]<2){ status = status | OBJ_STATUS_FIRE3; }
            if (USER.gun_stats[3]<2){ status = status | OBJ_STATUS_FIRE4; }
        }
        //-----------------------------------
        // определяем направление по положению мышки
        USER.mouse.x = CONTROLS.mouse_alpha1;
        USER.mouse.y = CONTROLS.mouse_alpha2;
        USER.mouse.z = 0.0;          
        USER.mouse.unproject( RENDER.camera_models );
        let dx = CONTROLS.mouse_alpha1;
        let dy = CONTROLS.mouse_alpha2;
        USER.mouse_d = Math.sqrt(dx*dx+dy*dy);
        ang = Math.atan2(dy, dx);
        if (isNaN(ang)){ang=0.0;}
        USER.mouse_angle = ang;
    }else{
        vx = Math.cos(USER.ang);
        vy = Math.sin(USER.ang);
    }
    //let nvx = -vy;
    //let nvy = vx;
    let unit = unit_get(USER.unit_id);
    if (unit!==undefined){
        //
        let ship = USER.ships[USER.curr_ship];
        if (unit.ship.m!==null){
            let m  = unit.ship.guns_mesh;
            let l  = m.length;
            let dx = USER.mouse.x - unit.ship.m.position.x;
            let dy = USER.mouse.y - unit.ship.m.position.y;
            let mx = dx*vx+dy*vy;
            let my = -dx*vy+dy*vx;
            for (let i=0;i<l;i++){
                let gun = m[i];
                if (gun!==null){
                    if (USER.gun_stats[i]===0){
                        let dx = mx - gun.position.x; 
                        let dy = my - gun.position.y; 
                        let ang = Math.atan2(dy, dx);
                        if (isNaN(ang)){ang=0;}
                        if (ang<0){ang = 2*Math.PI + ang;}
                        USER.gun_angle[i] = Math.trunc((ang/(2*Math.PI))*WORD);
                    }
                }else{
                    USER.gun_angle[i] = 0;
                }
            }
        }
        //
        let v  = {x:0,y:0}
        let v2 = {x:0,y:0}
        v.x  = Math.round(vx*ship.speed);
        v.y  = Math.round(vy*ship.speed);
        v2.x = v.x;
        v2.y = 0;
        let box = unit.box[0];
        MAP.box.move(box,v2);
        let x  = USER.x + MAP.box.dx;
        let y  = USER.y + MAP.box.dy;
        //----
        let vis = false;
        //
        if (x>=WORD){
            if (USER.cx<99){ USER.cx = USER.cx + 1; vis = true; x = x - WORD; }else{ x = WORD - 1; }
        }
        if (x<0){
            if (USER.cx>0){  USER.cx = USER.cx - 1; vis = true; x = WORD + x; }else{ x = 0; }
        }
        let rx = USER.cx*WORD + x;
        let ry = USER.cy*WORD + y;
        MAP.box.new_position(box,rx,ry);
        //
        v2.x = 0;
        v2.y = v.y;
        MAP.box.move(box,v2);
        x = x + MAP.box.dx;
        y = y + MAP.box.dy;
        if (y>=WORD){
            if (USER.cy<99){ USER.cy = USER.cy + 1; vis = true; y = y - WORD; }else{ y = WORD - 1; }
        }
        if (y<0){
            if (USER.cy>0){  USER.cy = USER.cy - 1; vis = true; y = WORD + y; }else{ y = 0; }
        }
        rx = USER.cx*WORD + x;
        ry = USER.cy*WORD + y;
        MAP.box.new_position(box,rx,ry);
        //
        USER.x = x;
        USER.y = y;
        // выставляем новое положение
        rx = (USER.cx + USER.x/WORD)*chunk_width;
        ry = (USER.cy + USER.y/WORD)*chunk_width;
        //
        USER.rx = rx;
        USER.ry = ry;
        //
        unit.new_p.x   = rx;  
        unit.new_p.y   = ry;
        //
        // проверка на переход в новый сектор карты
        if (vis){
           map_update_center(USER.cx,USER.cy);
        }
    }
    USER.status = status;
    //обновляем статы в интерфейсе
    stat_update();
    // проверяем работает ли основной рендер, если нет то проводим нужные обновления своими силами
    let render_delta = performance.now() - RENDER.lastframe_time;
    if (render_delta>90){
        //console.log(render_delta);
        RENDER.lastframe_time = performance.now();
        //
        map_render_update(render_delta);
        units_render_update(render_delta);
        bullets_update(render_delta);
        //
        render_camera_update(render_delta);
    }
    //
}
function start_gameplay(info){
    stat_show();
    let d1 = performance.now();
    USER.gameplay_timer = setInterval(function(){
        let n = performance.now();
        gameplay_update(n - d1);
        d1 = n;
    },100);
    //
    RENDER.animframeID = requestAnimationFrame(animate);
}
function stop_gameplay(){
    clearInterval(USER.gameplay_timer);
    USER.gameplay_timer = 0;
    stop_animate();
    stat_hide();
}
function user_prepare(){
    for (let i=0;i<20;i++){
        let a = {
            d : 0,  // урон нанесенный объекту
            n : 0,  // id цели
        }
        Object.seal(a);
        USER.static_hit_list.push(a);
    }
    for (let i=0;i<20;i++){
        let a = {
            d : 0,  // урон нанесенный объекту
            n : 0,  // id цели
        }
        Object.seal(a);
        USER.dynamic_hit_list.push(a);
    }
}
//===================================================
// START
//document.addEventListener("DOMContentLoaded", function(event) {
    MSG.div             = document.getElementById('MSG');
    //
    speech_prepare();
    editor_prepare(); 
	render_prepare();
    bullets_prepare();
    units_prepare();
    controls_prepare();
    gui_prepare();
    station_prepare();
    map_prepare();
    user_prepare();
    restart_connection();
//});
