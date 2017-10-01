"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let fs             = require('fs');                    // работа с файлами

const bb_height            = 100;                          // количество блоков на карте
const bb_width             = 100;
const uu_max_count         = 65536;                        // максимальное количество юнитов
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
const _max_lines_in_frame  = 50;            // один фрейм 50 строк
const _max_frames_count    = 10000;         // максимальное количество фреймов 
const _frame_size          = 2 + _frameline_size*_max_lines_in_frame; // размер одного фрейма, первые 2 байта: cx,cy
let _FRAMES                = new ArrayBuffer(_frame_size*_max_frames_count);
let FRAMES                 = new DataView(_FRAMES);
let FRAMES_BUFFER          = Buffer.from(_FRAMES);
let _free_frames_list      = [];            // список всех фреймов
let _used_frames_count     = 0;             // количество занятых фреймов
let _unit0;                                 // юнит пустышка

let INFO = null;
let item_manager = null;

let Map = {
    info                : [],                                       // информация по чанкам
    vis                 : null,                                     // ссылка на первый chunk на рассылку
    units               : [],                                       // список юнитов
    free_units          : new Uint16Array(uu_max_count),            // список свободных юнитов
    free_units_i        : 0,                                        // позиция в списке свободных
    active_units        : new Uint16Array(uu_max_count),            // список активных юнитов
    active_units_count  : 0,                                        // количество активных
}
//===============================================================================================
// Подготовка
//===============================================================================================
function prepare(_INFO,_item_manager){
    INFO  = _INFO;
    item_manager = _item_manager;
    // подготавливаем списки фреймов
    for (let i=0;i<_max_frames_count;i++){
        let start = i*_frame_size;
        _free_frames_list.push({
            start : start,                  // позиция в массиве frames (в байтах)
            count : 0,                      // количество занятых позиций в этом блоке
            next  : null,                   // ссылка на следующий блок
            prev  : null,                   // ссылка на предыдущий
        });
    }
    Object.seal(_free_frames_list);
    // подготавливаем блоки карты
    Map.free_units_i = 0;
    for(let y=0; y<bb_height; y++){
        for(let x=0; x<bb_width; x++){
            // заготавливаем информационные блоки
            let a = {
                cx          : x,
                cy          : y,
                map_p       : y*bb_width+x, // положение в массиве
                f_first     : null,         // ссылка на первый фрейм 
                f_last      : null,         // ссылка на последний фрейм              
                u_vis       : null,         // список пользователей подписанных на этот кусок карты
                active      : false,        // участвует данный блок в рассылке или нет
                vis_next    : null,         //
                vis_prev    : null,         //
                _upd        : '',           // одноразовое сообщение, рассылается всем кто подписан на блок один раз, после рассылки будет почищено
                //
                s_first     : null,         //
                s_last      : null,         //
            }
            Object.seal(a);
            Map.info.push(a);
        }
    }

    // подготавливаем юнитов
    for (let i=0;i<uu_max_count;i++){
        Map.free_units[i] = i;
        let a = {
            frame           : null,         //
            frame_pos       : 0,            //
            user_id         : 0,            // номер пользователя к которому привязан этот юнит
            cx              : 0,            // координаты блока на карте
            cy              : 0,    
            chunk_p         : 0,            // номер чанка
            // дополнительная информация
            type            : 0,            // тип юнита
            dvig            : 0,            // тип двигателя
            guns            : [0,0,0,0],    // типы вооружения    
            guns_i          : [0,0,0,0],    // настройки по оружию
        }
        Object.seal(a);
        Map.units.push(a);
    }
    //
    get_new_unit_id(); // забираем нулевого юнита
    //
    //
    console.log('Динамические юниты максимальное количество: '+Map.units.length);
    console.log('Динамические фреймы: '+Math.trunc(_FRAMES.byteLength/(1024*1024))+' мегабайт');
}
//===============================================================================================
// запрашиваем место в списке для юнита
function get_new_unit_id(){
    let i = Map.free_units_i;
    if (i===uu_max_count){
        console.log('перебор по юнитам');
        return 0; // перебор по юнитам
    }
    // берем нового юнита из списка свободных
    let id = Map.free_units[i];
    Map.free_units_i = i + 1;
    return id;
}

// создаем новый юнит
function new_unit(id,cx,cy,x,y,user_id,angle,status,hp,shield){
    let u       = Map.units[id];
    u.user_id   = user_id;      // номер игрока к которому привязан юнит
    u.cx        = cx;
    u.cy        = cy;
    u.chunk_p   = cy*bb_width + cx;
    // добавляем юнита в фрейм чанка
    u.frame_pos = FRAME_set_new_pos(u.chunk_p,cx,cy);  
    u.frame     = Map.info[u.chunk_p].f_last;
    // заносим юнит в список активных
    Map.active_units[Map.active_units_count] = id;
    Map.active_units_count = Map.active_units_count + 1;
    // заполняем фрейм данными
    let dst_pos = u.frame_pos;
    FRAMES.setUint16( dst_pos + FRAME_data_id      , id     ); 
    FRAMES.setUint16( dst_pos + FRAME_data_x       , x      ); 
    FRAMES.setUint16( dst_pos + FRAME_data_y       , y      ); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle   , angle  ); 
    FRAMES.setUint16( dst_pos + FRAME_data_status  , status ); 
    FRAMES.setUint16( dst_pos + FRAME_data_hp      , hp     ); 
    FRAMES.setUint16( dst_pos + FRAME_data_shield  , shield ); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle1  , angle  ); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle2  , angle  ); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle3  , angle  ); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle4  , angle  ); 
    //
    return u;
}

// освобождаем юнит
function remove_unit(id){
    // заносим id в список свободных
    Map.free_units_i = Map.free_units_i - 1;
    Map.free_units[Map.free_units_i] = id;
    // уменьшаем количество активных
    Map.active_units_count = Map.active_units_count - 1;
    //
    let u    = Map.units[id];
    // освобождаем запись о юните во фрейме
    FRAME_remove_one_obj(u);
}

function get_unit(id){ return Map.units[id]; }

// обновляем положение юнита
function set_position(frame_pos,x,y,angle,angle1,angle2,angle3,angle4){
    FRAMES.setUint16(frame_pos + FRAME_data_x       ,x      );
    FRAMES.setUint16(frame_pos + FRAME_data_y       ,y      );
    FRAMES.setUint16(frame_pos + FRAME_data_angle   ,angle  );
    FRAMES.setUint16(frame_pos + FRAME_data_angle1  ,angle1 );
    FRAMES.setUint16(frame_pos + FRAME_data_angle2  ,angle2 );
    FRAMES.setUint16(frame_pos + FRAME_data_angle3  ,angle3 );
    FRAMES.setUint16(frame_pos + FRAME_data_angle4  ,angle4 );
}

function transfer(u,chunk_p,cx,cy){ FRAME_transfer(u,chunk_p,cx,cy); }

//возращает ссылку на первый фрейм со статичными объектами
function get_static_frame(cx,cy){  return Map.info[cy*bb_width + cx].s_first; }

// добавляет новое изменение на карте
function static_upd_push(m,upd){
    // если этот блок видят игроки то добавляем запись
    if (m.u_vis!==null){
        m._upd = m._upd + upd;
        activate_map_vision(m);
    }
}

function update(delta){}

//
function get_items(id){
    let o = static_manager.get(id);
    let s = '';
    if (o!==undefined && o.items_group!==0){
        s = item_manager.get_items(o.items_group);
    }
    return s;
}

// GET & SET
function get_id(frame_pos){            return FRAMES.getUint16(frame_pos + FRAME_data_id);            }
function get_status(frame_pos){        return FRAMES.getUint16(frame_pos + FRAME_data_status);        }
function set_status(frame_pos,status){        FRAMES.setUint16(frame_pos + FRAME_data_status,status); }
function get_hp(frame_pos){            return FRAMES.getUint16(frame_pos + FRAME_data_hp);            }
function set_hp(frame_pos,hp){                FRAMES.setUint16(frame_pos + FRAME_data_hp,hp);         }
function get_angle(frame_pos){         return FRAMES.getUint16(frame_pos + FRAME_data_angle);         }
function set_angle(frame_pos,angle){          FRAMES.setUint16(frame_pos + FRAME_data_angle,angle);   }
function get_shield(frame_pos){        return FRAMES.getUint16(frame_pos + FRAME_data_shield);        }
function set_shield(frame_pos,shield){        FRAMES.setUint16(frame_pos + FRAME_data_shield,shield); }

//===============================================================================================
// Работа с подписками на блоки
//===============================================================================================
// добавляем блок карты в рассылку обновлений
function activate_map_vision(m){
    //console.log('add',m.map_p);
    if (!m.active){
        let v = Map.vis;
        if (v!==null){
            v.vis_prev = m;
        }
        m.vis_prev = null;
        m.vis_next = v;
        m.active = true;
        Map.vis = m;
    }
}
// убераем кусок карты из рассылки
function deactivate_map_vision(m){
    //console.log('remove',m.map_p);
    if (m.active){
        let prev = m.vis_prev;
        let next = m.vis_next;
        if (prev!==null){
            prev.vis_next = next;
        }else{
            Map.vis = next;
        }
        if (next!==null){
            next.vis_prev = prev;
        }
        m.vis_prev = null;
        m.vis_next = null;
        m.active = false;
        if (m._upd.length!==0){
            m._upd = '';
        }
    }
}
//добавляет смотрящего в блок карты
function add_vis_to_map(m,vis){
    let s_vis = m.u_vis;
    vis.next = s_vis;
    vis.prev = null;
    m.u_vis = vis;
    // если это не первый vis в списке
    if (s_vis!==null){
        s_vis.prev = vis;    
    }else{
        // если есть фреймы с юнитами то добавляем в список на рассылку 
        if (m.f_first!==null){
            activate_map_vision(m);
        }        
    }    
}
//активирует смотрящего на блок 
function VIS_set(vis,cx,cy){
    if (cx>=0 && cx<bb_width && cy>=0 && cy<bb_height){
        let map_p = cy*bb_width+cx;   
        vis.map_p = map_p;
        let m = Map.info[map_p];
        add_vis_to_map(m,vis);
    }else{
        vis.next = null;
        vis.prev = null;
        vis.map_p = -1;
    }
}
//убирает смотрящего с блока карты
function VIS_unset(vis){
    let map_p = vis.map_p;
    if (map_p===-1){ return; }
    let m = Map.info[map_p];
    let prev = vis.prev;
    let next = vis.next;
    if (m.u_vis===vis){
        m.u_vis = next;
    }
    if (prev!==null){ prev.next = next; }
    if (next!==null){ next.prev = prev; }
    vis.prev = null;
    vis.next = null;
    vis.map_p = -1;
    //
    if (m.u_vis===null){
        deactivate_map_vision(m);
    }
}
//===============================================================================================
// Работа с фреймами
//===============================================================================================
// возращает данные фрейма, только записи игроков
function get_frame(frame){ return new Uint8Array(_FRAMES, frame.start, (2+frame.count*_frameline_size)); }

// занимает место во фрейме для объекта
// ВНИМАНИЕ заполнение данными здесь не происходит
function FRAME_set_new_pos(chunk_p,cx,cy){
    let m       = Map.info[chunk_p];
    let f_first = m.f_first;
    let p       = 0;
    // Если стартового фрейма нет, создаем его
    if (f_first===null){ 
        f_first = _free_frames_list[_used_frames_count];

        _used_frames_count = _used_frames_count+1;
        m.f_first     = f_first;
        m.f_last      = f_first;
        f_first.next  = null;
        f_first.prev  = null;
        f_first.count = 1;
        p = f_first.start;
        // заносим коодинаты на карте в начальные байти фрейма
        FRAMES.setUint8( p+0, cx); 
        FRAMES.setUint8( p+1, cy); 
        p = p + 2;
        // если на этот блок были подписаны игроки то заносим этот блок в список рассылки
        if (m.u_vis!==null){
            activate_map_vision(m);
        }
        //
    }else{
        let f_last  = m.f_last;
        // Если последний фрейм переполнен тогда создаем еще один
        if (f_last.count===_max_lines_in_frame){
            let new_frame      = _free_frames_list[_used_frames_count];

            _used_frames_count = _used_frames_count+1;
            new_frame.next     = null;
            new_frame.prev     = f_last;
            new_frame.count    = 1;

            f_last.next        = new_frame;
            m.f_last           = new_frame;
            p = new_frame.start;
            // заносим коодинаты на карте в начальные байти фрейма
            FRAMES.setUint8( p+0, cx); 
            FRAMES.setUint8( p+1, cy); 
            p = p + 2;
        }else{
            // берем следующую строчку в последнем фрейме
            p = (f_last.start + 2) + f_last.count*_frameline_size;
            f_last.count = f_last.count + 1;
        }
    }    
    return p;
}

// уберает из фрейма один объект, и занимает это место другим объектом из этого же списка чтобы не было дырок
// chunk_p - сектор на карте
// frame - фрейм в котором будем уберать
// frame_pos - положение внутри фрейма которое надо почистить
function FRAME_remove_one_obj(u){
    let frame     = u.frame;
    let frame_pos = u.frame_pos;
    let m         = Map.info[u.chunk_p];
    let f_last    = m.f_last;
    let last_pos  = (f_last.start + 2) + (f_last.count-1)*_frameline_size;
    // если запись занимает последнюю строчку во фрейме
    if (last_pos===frame_pos){ 
        f_last.count = f_last.count - 1;
        if (f_last.count===0){
            let prev = f_last.prev;
            // больше блоков не осталось, убираем этот блок из списка видимых
            if (prev===null){
                m.f_first = null;
                m.f_last  = null;
                deactivate_map_vision(m);
            }else{
                m.f_last  = prev;
                prev.next = null;
            }

            _used_frames_count = _used_frames_count-1;
            _free_frames_list[_used_frames_count] = f_last;
        }
    }else{
        // переписываем освободившийся блок другим взятым из самого низа
        FRAME_copy(last_pos,frame_pos);
        // 
        let id       = get_id(frame_pos);
        let uu       = Map.units[id];
        uu.frame     = frame;
        uu.frame_pos = frame_pos;
        f_last.count = f_last.count - 1;
        if (f_last.count===0){
            let prev = f_last.prev;
            // больше блоков не осталось, убираем этот блок из списка видимых, prev - всегда есть
            m.f_last  = prev;
            prev.next = null;

            _used_frames_count = _used_frames_count-1;
            _free_frames_list[_used_frames_count] = f_last;
            //----
        }
    }
}

// копирует запись
// TODO сделать перенос быстрее, возможно надо посмотреть nodejs buffer
function FRAME_copy(src_pos,dst_pos){
    FRAMES_BUFFER.copy(FRAMES_BUFFER,dst_pos,src_pos,src_pos+_frameline_size);
/*    FRAMES.setUint16( dst_pos + FRAME_data_id      , FRAMES.getUint16( src_pos + FRAME_data_id     )); 
    FRAMES.setUint16( dst_pos + FRAME_data_x       , FRAMES.getUint16( src_pos + FRAME_data_x      )); 
    FRAMES.setUint16( dst_pos + FRAME_data_y       , FRAMES.getUint16( src_pos + FRAME_data_y      )); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle   , FRAMES.getUint16( src_pos + FRAME_data_angle  )); 
    FRAMES.setUint16( dst_pos + FRAME_data_status  , FRAMES.getUint16( src_pos + FRAME_data_status )); 
    FRAMES.setUint16( dst_pos + FRAME_data_hp      , FRAMES.getUint16( src_pos + FRAME_data_hp     )); 
    FRAMES.setUint16( dst_pos + FRAME_data_shield  , FRAMES.getUint16( src_pos + FRAME_data_shield )); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle1  , FRAMES.getUint16( src_pos + FRAME_data_angle1 )); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle2  , FRAMES.getUint16( src_pos + FRAME_data_angle2 )); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle3  , FRAMES.getUint16( src_pos + FRAME_data_angle3 )); 
    FRAMES.setUint16( dst_pos + FRAME_data_angle4  , FRAMES.getUint16( src_pos + FRAME_data_angle4 )); 
*/
}

// переносит запись из старого фрейма в новый, по координатам
function FRAME_transfer( u, chunk_p, cx, cy ){
    // занимаем новое место
    let frame_pos = FRAME_set_new_pos(chunk_p,cx,cy);
    let frame     = Map.info[chunk_p].f_last;
    // переносим данные из старого фрейма в новый
    FRAME_copy(u.frame_pos,frame_pos);
    // освободившееся место отдаем другим
    FRAME_remove_one_obj(u);
    u.frame     = frame;
    u.frame_pos = frame_pos;
    u.cx        = cx;
    u.cy        = cy;
    u.chunk_p   = chunk_p;
    return frame_pos;
}

//===============================================================================================
module.exports.prepare                  = prepare;
module.exports.bb_width                 = bb_width;
module.exports.bb_height                = bb_height;  
module.exports.Map                      = Map;
module.exports.VIS_set                  = VIS_set;
module.exports.VIS_unset                = VIS_unset;

module.exports.deactivate_map_vision    = deactivate_map_vision;
module.exports.get_new_unit_id          = get_new_unit_id;
module.exports.new_unit                 = new_unit;
module.exports.remove_unit              = remove_unit;
module.exports.set_position             = set_position;
module.exports.transfer                 = transfer;

module.exports.get_static_frame         = get_static_frame;
module.exports.get_items                = get_items;
module.exports.static_upd_push          = static_upd_push;

module.exports.update                   = update;

module.exports.get_unit                 = get_unit;
module.exports.get_frame                = get_frame;
module.exports.get_status               = get_status;
module.exports.set_status               = set_status;
module.exports.get_hp                   = get_hp;
module.exports.set_hp                   = set_hp;
module.exports.get_angle                = get_angle;
module.exports.set_angle                = set_angle;
module.exports.get_shield               = get_shield;
module.exports.set_shield               = set_shield;
