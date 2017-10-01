"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let fs                     = require('fs');                    // работа с файлами
//---------------------------------------------------------------------------------------------------------------------
const bb_height            = 100;                          // количество блоков на карте
const bb_width             = 100;
//---------------------------------------------------------------------------------------------------------------------
//     id       x      y     type    angle   status   scale
//  0 1 2 3    4 5    6 7     8 9     10 11    12 13   14 15
//
const FRAME_data_id        = 0;   // 4  unit_id
const FRAME_data_x         = 4;   // 2  - координаты объекта внутри блока
const FRAME_data_y         = 6;   // 2  -
const FRAME_data_type      = 8;   // 2  тип объекта
const FRAME_data_angle     = 10;  // 2  угол 
const FRAME_data_status    = 12;  // 2  статус
const FRAME_data_scale     = 14;  // 2  размер
//---------------------------------------------------------------------------------------------------------------------
const _frameline_size      = 16;            // длинна строки в байтах
const _max_lines_in_frame  = 50;            // один фрейм 50 строк
const _max_frames_count    = 100000;        // максимальное количество фреймов
//---------------------------------------------------------------------------------------------------------------------
let _FRAMES                = new ArrayBuffer(_frameline_size*_max_lines_in_frame*_max_frames_count);
let FRAMES                 = new DataView(_FRAMES);
let _free_frames_list      = [];            // список всех фреймов
let _used_frames_count     = 0;             // количество занятых фреймов
//---------------------------------------------------------------------------------------------------------------------
let free_static            = new Uint32Array(1000000);  // список свободных id
let free_static_curr       = 0;                         // положение в массиве
let static_by_id           = new Array(1000000); // _max_frames_count*_max_lines_in_frame 5 000 000 записей
//---------------------------------------------------------------------------------------------------------------------
const db_row = (4 +1+1+2+2 +2+2+2+2+2 ); // id cx,cy,x,y type,angle,status,scale,hp
//---------------------------------------------------------------------------------------------------------------------
const timer_max = 60;                               // максимальное количество засечек на щкале времени, по 1 секунде
const timer_no_upd = timer_max;                     // метка которая обозначает что объект не стоит на шкале времени
const TIMER_ACTION_REVIVE = 1;                      // 
const TIMER_ACTION_REMOVE = 2;                      // 
let TIMER = {
    sec       : new Array(timer_max).fill(0),       // массив засечек
    sec_n     : 0,                                  // текущая засечка
    sec_delta : 1000,                               // время оставшееся до следующего перехода на засечку
}
//---------------------------------------------------------------------------------------------------------------------
let INFO                   = null;
let Map                    = null;
let item_manager           = null;
let map_manager            = null;
let npc_manager            = null;

function prepare(_INFO,_map_manager,_item_manager,_npc_manager){
    INFO         = _INFO;
    map_manager  = _map_manager;
    Map          = map_manager.Map;
    item_manager = _item_manager;
    npc_manager  = _npc_manager;
    // подготавливаем списки фреймов
    for (let i=0;i<_max_frames_count;i++){
        let start = i*_max_lines_in_frame*_frameline_size;
        let a = {
            start : start,                  // позиция в массиве frames (в байтах)
            count : 0,                      // количество занятых позиций в этом блоке
            next  : null,                   // ссылка на следующий блок
            prev  : null,                   // ссылка на предыдущий
        }
        Object.seal(a);        
        _free_frames_list.push(a);
    }
    Object.seal(_free_frames_list);
    //
    for (let i=0;i<static_by_id.length;i++){
        let a = {
            id              : 0,
            map_p           : 0,
            frame_pos       : 0,
            //frame           : null,
            //
            hp              : 0,
            //
            in_upd_n        : timer_no_upd,
            timer_action    : 0,
            prev_t          : 0,
            next_t          : 0,
            //
            items_group     : 0,        // группа для предметов,
            items_count     : 0,        // 
            //
            info            : {},       // информация по объекту
            //
            cargo_n         : 0,        // тип предмета
            cargo_count     : 0,        // количество предметов
        }
        Object.seal(a);
        static_by_id[i] = a;
        free_static[i]  = i;
    }
    free_static_curr = 0;
    //
    let count = 0;
    let p = 0;
    const db_max = static_by_id.length;
    let buff   = new ArrayBuffer(db_row);
    let dv     = new DataView(buff);
    let buff_a = new Uint8Array(buff);
    //try{
        let fd = fs.openSync(__dirname + '/map/map.bin', 'r' );  
        for (let i=0;i<db_max;i++){
            fs.readSync(fd, buff_a, 0, db_row, p);
            let id     = dv.getUint32(0);
            let cx     = dv.getUint8( 4);
            let cy     = dv.getUint8( 5);
            let x      = dv.getUint16(6);
            let y      = dv.getUint16(8);
            let type   = dv.getUint16(10);
            let angle  = dv.getUint16(12);
            let status = dv.getUint16(14);
            let scale  = dv.getUint16(16);
            let hp     = dv.getUint16(18);
            if (id!==0){
                let m = Map.info[cy*bb_width+cx];
                count = count + 1;
                let info = INFO.STATIC_INFO[type];
                if (info.ai!==2){
                    let o = _new_static_in_frame(m,id,x,y,type,angle,scale,status,hp);
                    // загружаме дополнительные данные
                    if (info.storage!==0){
                        // загружаем список предметов
                        try{
                            let b = JSON.parse(fs.readFileSync(__dirname + '/map/s'+id+'.json', 'utf8'));
                            let items = b.items.split(';');
                            if (items.length>1){
                                o.items_group = item_manager.add_group(0);
                                for (let i=0;i<items.length-1;i++){
                                    let it = items[i].split('-');
                                    let item_n     = parseInt(it[1]);
                                    let item_count = parseInt(it[2]);
                                    let item_value = parseInt(it[3]);
                                    o.items_count  = o.items_count + item_count;  
                                    item_manager.add_item(o.items_group,item_n,item_count,item_value);
                                }
                            } 
                        }catch(e){
                        }
                        // загружаем дополнительную информацию
                        try{
                            o.info = JSON.parse(fs.readFileSync(__dirname + '/map/i'+id+'.json', 'utf8'));
                            for (let i=0;i<o.info.perc.length;i++){
                                o.info.perc[i] = parseInt(o.info.perc[i]);
                            }
                            if (o.info.ships!==undefined){
                                // [id,perc,id,perc,...]
                                for (let i=0;i<o.info.ships.length;i++){
                                    o.info.ships[i] = parseInt(o.info.ships[i]);
                                }
                            }
                        }catch(e){
                        }
                    }
                }
                // отправляем объект в менеджер ИИ
                if (info.ai!==0){
                    npc_manager.static_add(id,type,cx,cy,x,y);
                }
                //-----------------------            
            }else{
                free_static[free_static_curr] = i;
                free_static_curr = free_static_curr + 1;
            }      
            p=p+db_row; 
        }
        fs.closeSync(fd);
    //}catch(e){
    //    console.log(e);
    //}    
    //
    console.log('статичные объекты:',count+'/'+static_by_id.length,'свободно:',free_static_curr);
    console.log('статичные фреймы:',Math.trunc(_FRAMES.byteLength/(1024*1024))+' мегабайт');
}

// помечает запист на диске как удаленны, ее можно использовать для создания новых
// TODO запись на диск происходит в синхронном виде, хоть размер записи и маленький но надо исправить
// TODO json файл связанный с этим id не удаляется - с одной стороны хорошо, json обычно делаются только 
//           для важных объектов и их нельзя удалять, с другой стороны не правильно
function _del_row(id){
    let buff = new ArrayBuffer(db_row);
    let dv   = new DataView(buff);
    dv.setUint32(0,  0    );
    let fd = fs.openSync(__dirname + '/map/map.bin', 'r+' );
    let p  = id*db_row;
    fs.writeSync(fd, new Uint8Array(buff),0,db_row, p);
    fs.closeSync(fd);
}
// обновляет запись в бд на диске
// TODO запись в синхронном виде происходит
function _update_row(cx,cy,id,x,y,type,angle,status,scale,hp){
    let buff = new ArrayBuffer(db_row);
    let dv   = new DataView(buff);
    dv.setUint32(0,  id    );
    dv.setUint8( 4,  cx    );
    dv.setUint8( 5,  cy    );
    dv.setUint16(6,  x     );
    dv.setUint16(8,  y     );
    dv.setUint16(10, type  );
    dv.setUint16(12, angle );
    dv.setUint16(14, status);
    dv.setUint16(16, scale );
    dv.setUint16(18, hp    );
        
    let fd = fs.openSync(__dirname + '/map/map.bin', 'r+' );
    let p  = id*db_row;
    fs.writeSync(fd, new Uint8Array(buff), 0,db_row, p);
    fs.closeSync(fd);
}

// добавляет новую запись
function add(cx,cy,x,y,type,angle,scale,status){
    let id = 0;
    if (free_static_curr>1){
        free_static_curr = free_static_curr - 1;
        id = free_static[free_static_curr];
        let m     = Map.info[cy*bb_width+cx];
        let info  = INFO.STATIC_INFO[type];
        _new_static_in_frame(m,id,x,y,type,angle,scale,status,info.hp);
        map_manager.static_upd_push(m, id+','+cx+','+cy+','+x+','+y+','+type+','+angle+','+scale+','+status+';');
        _update_row(cx,cy,id,x,y,type,angle,status,scale,info.hp);
        //
        if (info.ai!==0){
            npc_manager.static_add(id,type,cx,cy,x,y);
        }
    }
    return id; 
}

// добавляет статичный объект с грузом внутри (или руду), временный
function add_cargo_box(cx,cy,x,y,item_n,item_count,time){
    if (free_static_curr>1){
        free_static_curr = free_static_curr - 1;
        let id = free_static[free_static_curr];
        let a = static_by_id[id];
        //
        let type   = INFO.ITEMS_INFO[item_n].static_n;
        let angle  = 0;
        let scale  = 32768;
        let status = INFO.STATIC_STATUS_COLLECTIBLE;
        let hp     = 0;
        //
        let m = Map.info[cy*bb_width+cx];
        //
        _new_static_in_frame(m,id,x,y,type,angle,scale,status,hp);
        map_manager.static_upd_push(m, id+','+cx+','+cy+','+x+','+y+','+type+','+angle+','+scale+','+status+';');
        //
        a.cargo_n     = item_n;
        a.cargo_count = item_count;
        // если есть время жизни объекта то добавляем в таймер
        if ( time!==0 ){
            a.timer_action = a.timer_action | TIMER_ACTION_REMOVE;
            add_to_timer(a,time);                    
        }
    }
}

// новая запись во фрейме
function _new_static_in_frame(m,id,x,y,type,angle,scale,status,hp){
    let frame_pos = new_pos(m);  
    let a = static_by_id[id];
    a.id          = id;
    a.map_p       = m.map_p;
    a.frame_pos   = frame_pos;
    //a.frame     = m.s_last;
    a.hp          = hp;
    a.prev_t      = 0;
    a.next_t      = 0;
    a.cargo_n     = 0;
    a.cargo_count = 0;
    //
    set_id(     frame_pos, id     );
    set_x(      frame_pos, x      );
    set_y(      frame_pos, y      );
    set_type(   frame_pos, type   );
    set_angle(  frame_pos, angle  );
    set_status( frame_pos, status );
    set_scale(  frame_pos, scale  );
    return a;
}

function get(id){
    if (id<static_by_id.length){
        return static_by_id[id];
    }else{
        return static_by_id[0];
    }
}

// наносим урон статичному объекту
function damage(id,_damage){
    if (id<static_by_id.length){
        let a = static_by_id[id];
        if (a.id!==0 && a.hp!==0){
            if (_damage>=a.hp){
                a.hp = 0;
                let status = get_status(a.frame_pos);
                status = status | INFO.STATIC_STATUS_INACTIVE;
                set_status(a.frame_pos,status);
                //
                a.timer_action = a.timer_action | TIMER_ACTION_REVIVE;
                add_to_timer(a,15);
                //
                process_rule(a);
                //
                let m = Map.info[a.map_p];
                map_manager.static_upd_push(m, id+','+status+';');
            }else{
                a.hp = a.hp - _damage;
            }
        }
    }
}

// переносит предмет с карты в грузовой контейнер корабля, конечно если объект можно собирать и есть по нему правило переноса
function collect(static_id,unit_id,ship){
    if (static_id<static_by_id.length){
        let a = static_by_id[static_id];
        if (a.id!==0){
            let status = get_status(a.frame_pos);
            if (status & INFO.STATIC_STATUS_COLLECTIBLE){
                // достаточно ли энергии для работы устройства
                if (ship.device_energy<=ship.energy){
                    ship.energy = ship.energy - ship.device_energy;
                    // если есть место
                    let item_n = a.cargo_n;
                    let count  = a.cargo_count;
                    let cargo_free = ship.cargo_max - ship.cargo_count;
                    if (count<=cargo_free){
                        // заносим новый предмет в список
                        ship.cargo_count = ship.cargo_count + count;
                        ship.cargo[item_n] = ship.cargo[item_n] + count;
                        // Объявляем об операции на карте всем игрокам
                        let m = Map.info[a.map_p];
                        map_manager.static_upd_push(m, a.id+','+unit_id+','+item_n+','+count+';');
                        // убираем с карты объект
                        remove_from_timer(a);
                        remove_one(a);
                        //
                        free_static[free_static_curr] = a.id;
                        free_static_curr = free_static_curr + 1;
                        //
                        a.id = 0;
                    }
                }
            }
        }
    }
}

// проходим правила при разрушении статичного объекта
// выпадение руды из метеоритов
function process_rule(static_obj){
    let type = get_type(static_obj.frame_pos);
    let info = INFO.STATIC_INFO[type];
    if (info.award_rule===0){ return; }
    let rule = INFO.AWARD_RULE[info.award_rule];
    let c     = rule.static_count;
    let list  = rule.static_list;
    if (c!==0 && list.length!==0){
        let chance = Math.trunc(Math.random()*100); // чем меньше тем лучше, игроку выпадут предметы с большем шансом чем этот
        // находим все кто попадают под шанс
        let l = list.length-2;
        do{
            if (list[l]>=chance){ break; }
            l = l - 2;
        }while(l>=0)
        //выбираем нужное нам количество
        if (l>=0){
            l = Math.trunc(l/2)+1;
            let m  = Map.info[static_obj.map_p];
            let cx = m.cx;
            let cy = m.cy;
            let x  = get_x(static_obj.frame_pos);
            let y  = get_y(static_obj.frame_pos);
            let angle  = 0;
            let scale  = 32768;
            let status = INFO.STATIC_STATUS_COLLECTIBLE;
            let time   = rule.live_time;
            let count  = 1;
            while(c--){
                let n    = Math.trunc(Math.random()*l)*2+1;
                let item_n = list[n];
                add_cargo_box(cx,cy,x,y,item_n,count,time);
            }
        }
    }
}

// сохраняет расширенные данные по объекту в json файл
function save_static(id){
    let st = static_by_id[id];
    let items = '';
    if (st.items_group!==0){
        items = item_manager.get_items(st.items_group);
    }
    let a = {
        items : items,
    }
    try{
        fs.writeFileSync(__dirname + '/map/s'+id+'.json', JSON.stringify(a));
    }catch(e){
    }
}

// 
function edit(id,cx,cy,x,y,type,angle,scale,status){
    let a = static_by_id[id];
    if (a.id===0){ return 0; }
    let m = Map.info[a.map_p];
    // удаляем
    if (cx===-1){
        remove_one(a);
        //
        free_static[free_static_curr] = id;
        free_static_curr = free_static_curr + 1;
        //
        a.id = 0;
        _del_row(id);
    }else{
        let p = cy*bb_width + cx;
        if (p!==a.map_p){ // переносим в другом фрейм
            let _cy = Math.trunc(a.map_p/bb_width);
            let _cx = a.map_p - _cy*bb_width;
            let mm = Map.info[p];
            transfer(a,mm);
            map_manager.static_upd_push(mm, id+','+cx+','+cy+','+x+','+y+','+type+','+angle+','+scale+','+status+';');
        }
        // обновляем запись
        let frame_pos = a.frame_pos;
        set_x(      frame_pos, x      );
        set_y(      frame_pos, y      );
        set_type(   frame_pos, type   );
        set_angle(  frame_pos, angle  );
        set_status( frame_pos, status );
        set_scale(  frame_pos, scale  );
        
        _update_row(cx,cy,a.id,x,y,type,angle,status,scale,a.hp);
    }
    // обновляем 
    map_manager.static_upd_push(m, id+','+cx+','+cy+','+x+','+y+','+type+','+angle+','+scale+','+status+';');
    return id; 
}
// редактирование статичных объектов
function editor(type,id,cx,cy,x,y,angle,scale,status){
    if (id===0){ 
        // добавляем новый объект
        add(cx,cy,x,y,type,angle,scale,status);
    }else{
        // изменяем запись
        edit(id,cx,cy,x,y,type,angle,scale,status);
    }   
}


//===============================================================================================
// Запросы игрока
//===============================================================================================
// игрок подал запрос по объекту
function user_req(u,dv,buff_length){
    let req_type = dv.getUint8(3);
    
    let r = {};
    switch (req_type){
        case  0 :   // информация по объекту
                    if (buff_length===8 && !u.unit_in_station){
                        let static_id = dv.getUint32(4);
                        let err = 18;
                        let items = '';
                        if (static_id<static_by_id.length){ 
                            let obj = static_by_id[static_id];
                            if (obj.id!==0 ){
                                err = 0;
                                if (obj.items_group!==0){
                                    items = item_manager.get_items(obj.items_group);
                                }
                            }                    
                        }
                        //
                        r = {
                            i           : INFO.MSG_STATIC,
                            id          : static_id,
                            items       : items,
                            upd         : '',
                            err         : err,
                        }
                    }
                    break;
        case 1  : //переносим предмет из корабля в хранилище
                if (buff_length===13 && !u.unit_in_station){
                        let static_id = dv.getUint32(4);
                        let item_n    = dv.getUint8(8);
                        let stack_id  = dv.getUint32(9);
                        //
                        let ship  = u.ships[u.curr_ship];
                        //
                        let err   = 18;
                        let upd   = '';
                        let items = '';
                        if (static_id<static_by_id.length){ 
                            let obj = static_by_id[static_id];
                            if (obj.id!==0 ){
                                err   = 0;
                                upd   = cargo_to_storage(ship,obj,item_n,stack_id,1);
                                if (upd.length===0){ err = 19; }
                                items = item_manager.get_items(obj.items_group);
                            }                    
                        }                    
                        //
                        r = {
                            i           : INFO.MSG_STATIC,
                            id          : static_id,
                            items       : items,
                            upd         : upd,
                            err         : err,
                        }
                }
                break;
        case 2  : //переносим предмет из хранилищя в корабль
                if (buff_length===12 && !u.unit_in_station){
                        let static_id = dv.getUint32(4);
                        let item_id   = dv.getUint32(8);
                        //
                        let ship  = u.ships[u.curr_ship];
                        //
                        let err   = 18;
                        let upd   = '';
                        let items = '';
                        if (static_id<static_by_id.length && item_id!==0){ 
                            let obj = static_by_id[static_id];
                            if (obj.id!==0 ){
                                err = 0;
                                upd = storage_to_cargo(ship,obj,item_id,1);
                                if (upd.length===0){ err = 19; }
                                items = item_manager.get_items(obj.items_group);
                            }                    
                        }                    
                        //
                        r = {
                            i           : INFO.MSG_STATIC,
                            id          : static_id,
                            items       : items,
                            upd         : upd,
                            err         : err,
                        }
                }
                break;
    }
    return r;
}

function cargo_to_storage(ship,obj,item_n,stack_id,count){
    let upd  = '';
    if (count>ship.cargo[item_n]){ count = ship.cargo[item_n]; }
    if (count===0){ return upd; }
    //    
    let type = get_type(obj.frame_pos);
    let storage_max = INFO.STATIC_INFO[type].storage;
    if (obj.items_group===0){
        obj.items_group = item_manager.add_group(0);
        obj.items_count = 0;
    }
    //
    let new_count = obj.items_count+count; 
    // если есть место в хранилище и есть предметы в трюме коробля то переносим
    if ( new_count<=storage_max ){
        if (stack_id!==0){
            let item = item_manager.get_item(stack_id);
            if (item.owner===obj.items_group && item.n===item_n){
                item.count = item.count + count;
            }else{
                item_manager.add_item(obj.items_group,item_n,count,0);
            } 
        }else{
            item_manager.add_item(obj.items_group,item_n,count,0);
        }
        //
        let c = ship.cargo[item_n] - count; 
        ship.cargo[item_n] = c;
        upd = item_n+'-'+c;
        obj.items_count = new_count;
        save_static(obj.id);
    } 
    return upd;           
}

function storage_to_cargo(ship,obj,item_id,count){
    let upd = '';
    if (obj.items_group===0){ return upd; }
    let new_count = ship.cargo_count + count;
    if (new_count>=ship.cargo_max){ return upd; } 
    let item = item_manager.get_item(item_id);
    // если есть место в трюме корабля и предмет с таким количеством существует то переносим
    if ( item.count>=count && item.owner===obj.items_group){
        item.count = item.count - count;
        obj.items_count = obj.items_count - count;
        let c = ship.cargo[item.n] + count;
        ship.cargo[item.n] = c;
        upd = item.n+'-'+c;
        if (item.count===0){ item_manager.free_item(item); }
        save_static(obj.id);
    }    
    return upd;           
}
//===============================================================================================
// TIMER
//===============================================================================================
function update_obj(obj){
    if (obj.timer_action & TIMER_ACTION_REVIVE){
        let type   = get_type(obj.frame_pos);
        let status = get_status(obj.frame_pos);
        let info   = INFO.STATIC_INFO[type];
        obj.hp = info.hp;
        status = status & (~INFO.STATIC_STATUS_INACTIVE);
        set_status(obj.frame_pos,status);
        let m = Map.info[obj.map_p];
        map_manager.static_upd_push(m, obj.id+','+status+';');
    }
    if (obj.timer_action & TIMER_ACTION_REMOVE){
        let status = get_status(obj.frame_pos);
        let m = Map.info[obj.map_p];
        let id = obj.id;
        remove_one(obj);
        free_static[free_static_curr] = obj.id;
        free_static_curr = free_static_curr + 1;
        obj.id = 0;
        if (status & INFO.STATIC_STATUS_COLLECTIBLE){
        }else{
            _del_row(obj.id);
        }
        // обновляем 
        map_manager.static_upd_push(m, id+',-1,0,0,0,0,0,0,0;');
    }
    obj.timer_action = 0;
}

function add_to_timer(obj,sec){
    let n = TIMER.sec_n;          // берем текущую засечку
    n = n + sec;                  // сдвигаемся на время
    if (n>=timer_max){ n = n - timer_max; } 
    // если предмет еще не добавляли в список
    if (obj.in_upd_n === timer_no_upd){
        obj.in_upd_n = n;
        obj.prev_t   = 0;
        // добавляем в список
        let _id = TIMER.sec[n];
        if (_id!==0){ static_by_id[_id].prev_t = obj.id; }
        obj.next_t   = _id;
        TIMER.sec[n] = obj.id;
    }else{
        if (obj.in_upd_n!==n){
            // убераем из списка
            let prev = obj.prev_t;
            let next = obj.next_t;
            if (prev===0){
                TIMER.sec[obj.in_upd_n] = next;
            }else{
                static_by_id[prev].next_t = next;
            }
            if (next!==0){
                static_by_id[next].prev_t = prev;
            }
            // добавляем в список
            let _id = TIMER.sec[n];
            if (_id!==0){ static_by_id[_id].prev_t = obj.id; }
            obj.in_upd_n = n;
            obj.prev_t   = 0;
            obj.next_t   = _id;
            TIMER.sec[n] = obj.id;
        }
    }    
}

function remove_from_timer(obj){
    //let obj = static_by_id[p];
    // убераем из списка
    if (obj.in_upd_n !== timer_no_upd){
        let prev = obj.prev_t;
        let next = obj.next_t;
        if (prev===0){
            TIMER.sec[obj.in_upd_n] = next;
        }else{
            static_by_id[prev].next_t = next;
        }
        if (next!==0){
            static_by_id[next].prev_t = prev;
        }
        obj.prev_t   = 0;
        obj.next_t   = 0;
        obj.in_upd_n = timer_no_upd;
    }
}

// обновляем таймер, 
function update_timer(delta){
    let d = TIMER.sec_delta;
    if (delta>=d){  // пришло время 
        TIMER.sec_delta = 1000; // 1 секунда до следующего обновления
        let n = TIMER.sec_n + 1;      
        if (n===timer_max){ n = 0; }
        TIMER.sec_n = n;
        //
        let id = TIMER.sec[n];
        TIMER.sec[n] = 0; // обнуляем список
        while(id!==0){
            let obj = static_by_id[id];
            obj.in_upd_n = timer_no_upd;
            update_obj(obj);
            // переходим на следующий предмет
            id = obj.next_t;
        }
        //
    }else{
        TIMER.sec_delta = d - delta;
    }   
}

function update(delta){
    update_timer(delta);
}
//===============================================================================================
// GET & SET
//===============================================================================================
function get_id(frame_pos)              { return FRAMES.getUint32(frame_pos + FRAME_data_id);     }
function set_id(frame_pos, id)          { return FRAMES.setUint32(frame_pos + FRAME_data_id, id); }
function get_x(frame_pos)               { return FRAMES.getUint16(frame_pos + FRAME_data_x);      }
function set_x(frame_pos, x)            { return FRAMES.setUint16(frame_pos + FRAME_data_x, x);   }
function get_y(frame_pos)               { return FRAMES.getUint16(frame_pos + FRAME_data_y);      }
function set_y(frame_pos, y)            { return FRAMES.setUint16(frame_pos + FRAME_data_y, y);   }
function get_type(frame_pos)            { return FRAMES.getUint16(frame_pos + FRAME_data_type);           }
function set_type(frame_pos, type)      { return FRAMES.setUint16(frame_pos + FRAME_data_type, type);     }
function get_angle(frame_pos)           { return FRAMES.getUint16(frame_pos + FRAME_data_angle);          }
function set_angle(frame_pos, angle)    { return FRAMES.setUint16(frame_pos + FRAME_data_angle, angle);   }
function get_status(frame_pos)          { return FRAMES.getUint16(frame_pos + FRAME_data_status);         }
function set_status(frame_pos, status)  { return FRAMES.setUint16(frame_pos + FRAME_data_status, status); }
function get_scale(frame_pos)           { return FRAMES.getUint16(frame_pos + FRAME_data_scale);          }
function set_scale(frame_pos, scale)    { return FRAMES.setUint16(frame_pos + FRAME_data_scale, scale);   }
//===============================================================================================
// Работа с фреймами
//===============================================================================================
// возращает данные фрейма, только записи игроков
function get_frame(frame){
    //console.log(frame);
    return new Uint8Array(_FRAMES, frame.start, frame.count*_frameline_size);
}
// занимает место во фрейме для объекта
// ВНИМАНИЕ заполнение данными здесь не происходит
function new_pos(m){
    let s_first = m.s_first;
    let p       = 0;
    // Если стартового фрейма нет, создаем его
    if (s_first===null){ 
        s_first       = _free_frames_list[_used_frames_count];
        _used_frames_count = _used_frames_count+1;
        m.s_first     = s_first;
        m.s_last      = s_first;
        s_first.next  = null;
        s_first.prev  = null;
        s_first.count = 1;
        p = s_first.start;
    }else{
        let s_last  = m.s_last;
        // Если последний фрейм переполнен тогда создаем еще один
        if (s_last.count===_max_lines_in_frame){
            let new_frame      = _free_frames_list[_used_frames_count];
            _used_frames_count = _used_frames_count+1;
            new_frame.next     = null;
            new_frame.prev     = s_last;
            new_frame.count    = 1;
            s_last.next        = new_frame;
            m.s_last           = new_frame;
            p = new_frame.start;
        }else{
            // берем следующую строчку в последнем фрейме
            p = s_last.start + s_last.count*_frameline_size;
            s_last.count = s_last.count+1;
        }
    }    
    return p;
}
// уберает из фрейма один объект, и занимает это место другим объектом из этого же списка чтобы не было дырок
function remove_one(u){
    let frame     = u.frame;
    let frame_pos = u.frame_pos;
    //u.frame       = null;
    u.frame_pos   = 0;
    //
    let m         = Map.info[u.map_p];
    let s_last    = m.s_last;
    let last_pos  = s_last.start+(s_last.count-1)*_frameline_size;
    // если запись занимает последнюю строчку во фрейме
    if (last_pos===frame_pos){ 
        s_last.count = s_last.count - 1;
        if (s_last.count===0){
            let prev = s_last.prev;
            // больше блоков не осталось, убираем этот блок из списка видимых
            if (prev===null){
                m.s_first = null;
                m.s_last  = null;
            }else{
                m.s_last  = prev;
                prev.next = null;
            }
            _used_frames_count = _used_frames_count-1;
            _free_frames_list[_used_frames_count] = s_last;
        }
    }else{
        // переписываем освободившийся блок другим взятым из самого низа
        FRAME_copy(last_pos,frame_pos);
        //
        let id       = get_id(frame_pos);
        let uu       = static_by_id[id];
        //uu.frame     = frame;
        uu.frame_pos = frame_pos;
        s_last.count = s_last.count - 1;
        if (s_last.count===0){
            let prev = s_last.prev;
            // больше блоков не осталось, убираем этот блок из списка видимых, prev - всегда есть
            m.s_last  = prev;
            prev.next = null;

            _used_frames_count = _used_frames_count-1;
            _free_frames_list[_used_frames_count] = s_last;
            //----
        }
    }
}
// копирует запись
// TODO сделать перенос быстрее, возможно надо посмотреть nodejs buffer
function FRAME_copy(src_pos,dst_pos){
    FRAMES.setUint32( dst_pos + FRAME_data_id      , FRAMES.getUint32( src_pos + FRAME_data_id)); 
    FRAMES.setUint16( dst_pos + FRAME_data_x       , FRAMES.getUint16( src_pos + FRAME_data_x)); 
    FRAMES.setUint16( dst_pos + FRAME_data_y       , FRAMES.getUint16( src_pos + FRAME_data_y)); 
    FRAMES.setUint16( dst_pos + FRAME_data_type    , FRAMES.getUint16( src_pos + FRAME_data_type)); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle   , FRAMES.getUint16( src_pos + FRAME_data_angle)); 
    FRAMES.setUint16( dst_pos + FRAME_data_status  , FRAMES.getUint16( src_pos + FRAME_data_status));
    FRAMES.setUint16( dst_pos + FRAME_data_scale   , FRAMES.getUint16( src_pos + FRAME_data_scale)); 
}
// переносит запись из старого фрейма
function transfer( u, m){
    // занимаем новое место
    let frame_pos = new_pos(m);
    let frame     = m.s_last;
    // переносим данные из старого фрейма в новый
    FRAME_copy(u.frame_pos,frame_pos);
    // освободившееся место отдаем другим
    remove_one(u);
    //u.frame     = frame;
    u.frame_pos = frame_pos;
    u.map_p     = m.map_p;
}
//===============================================================================================
module.exports.prepare                  = prepare;
module.exports.new_pos                  = new_pos;
module.exports.get_frame                = get_frame;

module.exports.add                      = add;   
module.exports.add_cargo_box            = add_cargo_box;   

module.exports.get                      = get;
module.exports.damage                   = damage;
module.exports.collect                  = collect;
module.exports.editor                   = editor;
module.exports.update                   = update;
module.exports.save_static              = save_static;

module.exports.user_req                 = user_req;

module.exports.add_to_timer             = add_to_timer;
module.exports.update_timer             = update_timer;

module.exports.get_id                   = get_id;   
module.exports.set_id                   = set_id;   
module.exports.get_x                    = get_x;    
module.exports.set_x                    = set_x;    
module.exports.get_y                    = get_y;   
module.exports.set_y                    = set_y;    
module.exports.get_type                 = get_type;
module.exports.set_type                 = set_type;
module.exports.get_angle                = get_angle;
module.exports.set_angle                = set_angle;
module.exports.get_scale                = get_scale;
module.exports.set_scale                = set_scale;
module.exports.get_status               = get_status;
module.exports.set_status               = set_status;

