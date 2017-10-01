"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let fs             = require('fs');                    // работа с файлами

let INFO = null;
let user_manager   = null;
let map_manager    = null;
let item_manager   = null;
let static_manager = null;

function prepare(_INFO,_user_manager,_map_manager,_item_manager,_static_manager){
    INFO           = _INFO;
    user_manager   = _user_manager;
    map_manager    = _map_manager;
    item_manager   = _item_manager;
    static_manager = _static_manager;
    
    console.log('станции - готовы.');
}

function prepare_info(user,station){

    let ships = user_manager.get_ships_as_string(user);

    let r = {
        i           : INFO.MSG_STATION,
        n           : user.n,
//      items       : item_manager.get_items(user.items),
        id          : station.id,
        d           : station.info,
        credits     : user.credits,
        curr_ship   : user.curr_ship,
        ships       : ships,
    }
    return r;
}

// игрок подал запрос по объекту
function user_req(u,dv,buff_length){
    let req_type = dv.getUint8(3);
    
    let static_obj = static_manager.get(u.station_id);
    let r = {};
    switch (req_type){
        case INFO.STATION_OP_CONNECT: // вход на станцию
                    if (buff_length===8 && !u.unit_in_station){
                        user_manager.unvis_all(u);
                        if (u.unit_id!==0){
                            map_manager.remove_unit(u.unit_id);
                            u.unit_id = 0;
                        }
                        let station_id = dv.getUint32(4);
                        u.station_id = station_id;
                        u.unit_in_station = true;
                        r = prepare_info(u,static_obj);
                    }
                    break;
/*        case  1     :   // ремонт корпуса
                    if (u.unit_in_station){
                        ship_repair(u);
                        r = prepare_info(u,static_obj);
                    }
                    break;
        case  2     :   // покупка топлива
                    if (u.unit_in_station){
                        ship_fuel(u);
                        r = prepare_info(u,static_obj);
                    }
                    break;
        case  3     :   // покупка патронов
                    if (u.unit_in_station){
                        ship_bullets(u);
                        r = prepare_info(u,static_obj);
                    }
                    break;
*/
        case INFO.STATION_OP_LEAVE  : // покинуть станцию
                                if (buff_length===5 && u.unit_in_station){
                                    let curr_ship = dv.getUint8(4);
                                    r = ship_leaving(u,static_obj,curr_ship);
                                }
                                break;
        case INFO.STATION_OP_MARKET : // рынок
                                if (buff_length>=8 && u.unit_in_station && static_obj.info!==undefined){
                                    let curr_ship   = dv.getUint8(4);
                                    r = market(u,curr_ship,static_obj,dv);
                                }
                                break;
        case INFO.STATION_OP_BUY    : // покупка оборудования
                                if (buff_length===8 && u.unit_in_station && static_obj.info!==undefined && static_obj.info.ships!==undefined){
                                    let curr_ship   = dv.getUint8(4);
                                    let razdel      = dv.getUint8(5);
                                    let n           = dv.getUint8(6);
                                    let id          = dv.getUint8(7);
                                    r = ship_buy(u,static_obj,curr_ship,razdel,n,id);
                                }                
                                break;
        case INFO.STATION_OP_GUN    : // настройка оружия
                                if (buff_length===8 && u.unit_in_station){
                                    let curr_ship   = dv.getUint8(4);
                                    let gun_n       = dv.getUint8(5);
                                    let value       = dv.getUint16(6);
                                    r = ship_gun(u,static_obj,curr_ship,gun_n,value);
                                }
                                break;
    }
    return r;
}

function ship_repair(user){
    let d = user.ship_hp_max - user.ship_hp;
    if (d>0){
        let cr = d*1;
        if (user.credits>=cr){
            user.credits = user.credits - cr;
            user.ship_hp = user.ship_hp_max;
        }
    }
}

function ship_fuel(user){
    let d = user.ship_fuel_max - user.ship_fuel;
    if (d>0){
        let cr = d*1;
        if (user.credits>=cr){
            user.credits = user.credits - cr;
            user.ship_fuel = user.ship_fuel_max;
        }
    }
}

function ship_bullets(user){
    let d = user.ship_bullets_max - user.ship_bullets;
    if (d>0){
        let cr = d*1;
        if (user.credits>=cr){
            user.credits = user.credits - cr;
            user.ship_bullets = user.ship_bullets_max;
        }
    }
}

function activate_user(user,station_id){
    user.unit_in_station = true;
    user.station_id = station_id;
    let station = static_manager.get(station_id);
    let r = prepare_info(user,station);
    return r;    
}
 
// Пользователь хочет покинуть станцию
function ship_leaving(user,station,curr_ship){
    let err = 0;
    if (curr_ship>=user.ships.length){
        return {
            i   : INFO.MSG_STATION,
            err : err
        }    
    }
    let ship = user.ships[curr_ship];
    //на корабле должен быт двигатель
    if (ship.dvig===0){ err = 14; }
    //на корабле должно быть топливо
    if (ship.fuel===0){ err = 15; }
    // энергоустановка
    if (ship.energy_type===0){ err = 16; }
    //
    if (err===0){
        user.curr_ship = curr_ship;
        user.unit_id = map_manager.get_new_unit_id();
        if (user.unit_id!==0){
            // заносим координаты
            let block = map_manager.Map.info[station.map_p];
            // заносим координаты
            let cx = block.cx;
            let cy = block.cy;
            let x  = static_manager.get_x(station.frame_pos);
            let y  = static_manager.get_y(station.frame_pos);
            // востанавливаем энергию до максимума перед вылетом
            ship.energy = ship.energy_max;
            ship.shield = ship.shield_max;
            // создаем юнита на карте    
            let angle  = 0;
            let status = 0;
            let unit = map_manager.new_unit(user.unit_id,cx,cy,x,y,user.n,angle,status,ship.hp,ship.shield);
            // заполняем дополнительную информацию
            unit.type = ship.type;
            unit.dvig = ship.dvig;
            unit.guns[0] = ship.guns[0];
            unit.guns[1] = ship.guns[1];
            unit.guns[2] = ship.guns[2];
            unit.guns[3] = ship.guns[3];
            unit.guns_i[0] = ship.guns_i[0];
            unit.guns_i[1] = ship.guns_i[1];
            unit.guns_i[2] = ship.guns_i[2];
            unit.guns_i[3] = ship.guns_i[3];
            //
            user.unit_in_station = false;
            let items_string = item_manager.get_items(user.items);
            let a = {
               i            : INFO.MSG_INIT,
               cx           : cx,
               cy           : cy,
               x            : x,
               y            : y,
               items        : items_string,
               //grp_id       : user.storage,
               name         : user.proto.n,
               credits      : user.credits,
               unit_id      : user.unit_id,
               curr_ship    : user.curr_ship,
            }
            //
            user_manager.update_vis(user,cx,cy);
            return a;
        }else{
            err = 10; // сервер перегружен 
        }
    }
    //
    return {
        i   : INFO.MSG_STATION,
        err : err
    }    
}

// покупка и продажа товаров на рынке 
function market(user,curr_ship,station,dv){
    let err = 0;
    if (curr_ship>=user.ships.length){
        return {
            i   : INFO.MSG_STATION,
            err : err
        } 
    }
    user.curr_ship = curr_ship;
    let ship = user.ships[curr_ship];
    let cargo = ship.cargo;
    // n  tip st_op  curr_ship  n  op  op_count  
    // 01  2    3       4       5  6   7 8
    let l = Math.trunc((dv.byteLength-5)/(1+1+2));
    let p = 5;
    // продаем предметы игрока
    for (let i=0;i<l;i++){
        let n     = dv.getUint8( p+0);
        let op    = dv.getUint8( p+1);
        let count = dv.getUint16(p+2);
        if (op===1 && count!==0 && n<INFO.ITEMS_INFO.length && count<=cargo[n]){    
            let info = INFO.ITEMS_INFO[n];
            let perc = station.info.perc[n];
            if (perc===undefined){perc=100;}
            user.credits = user.credits + Math.round(info.price*(perc-10)/100)*count;
            cargo[n] = cargo[n] - count;            
            ship.cargo_count = ship.cargo_count - count; 
        }
        //
        p = p + 4;
    }
    // покупаем на станции
    p = 5;
    for (let i=0;i<l;i++){
        let n     = dv.getUint8( p+0);
        let op    = dv.getUint8( p+1);
        let count = dv.getUint16(p+2);
        if (op===0 && count!==0 && n<INFO.ITEMS_INFO.length){
            let info = INFO.ITEMS_INFO[n];
            let perc = station.info.perc[n];
            if (perc===undefined){perc=100;}
            let price_buy = Math.round(info.price*perc/100)*count;
            let cargo_free = ship.cargo_max - ship.cargo_count;
            if (price_buy<=user.credits && count<=cargo_free){
                cargo[n] = cargo[n] + count;
                user.credits = user.credits - price_buy;
                ship.cargo_count = ship.cargo_count + count;
            }            
        }
        p = p + 4;
    }
    return prepare_info(user,station);       
}

// покупка корабля, оборудования, оружия и т.п.
function ship_buy(user,station,curr_ship,razdel,n,_id){
    let err = 0;
    let list;
    switch(razdel){
        case 0: // корабль
                list = station.info.ships;
                if (n<list.length-1){
                    if (list[n]===_id){
                        let id   = list[n+0];
                        let perc = list[n+1]/100;
                        let unit_info = INFO.INFO_UNITS[id]; 
                        let price = Math.trunc(unit_info.price*perc);
                        if (user.credits<price)  { err = 11; }
                        if (user.ships.length>=3){ err = 12; }
                        // денег хватате и есть место
                        if ( err === 0 ){
                            user.credits = user.credits - price;
                            user_manager.new_ship(user,id,station.id);
                            return prepare_info(user,station);       
                        }
                    }
                }
                break;
        case 1:
                break;
        case 2:
                break;
        case 3: // вооружение
                if (curr_ship>=user.ships.length){
                    err = 0;
                }else{
                    user.curr_ship = curr_ship;
                    let ship = user.ships[curr_ship];
                    let ship_info  = INFO.INFO_UNITS[ship.type];
                    let guns_count = ship_info.guns.length;  
                    list = station.info.guns;
                    if (n<list.length-1){
                        if (list[n]===_id){
                            let id    = list[n+0];
                            let perc  = list[n+1]/100;
                            let info  = INFO.INFO_GUNS[id]; 
                            let price = Math.trunc(info.price*perc);
                            if (user.credits<price)  { err = 11; }
                            let nn = 0;
                            //let l = ship.guns.length;
                            while (ship.guns[nn]!==0 && nn<guns_count){
                                nn=nn+1;
                            }
                            if (nn===guns_count){ err = 13; }
                            // денег хватате и есть место
                            if ( err === 0 ){
                                user.credits  = user.credits - price;
                                ship.guns[nn]   = id;
                                ship.guns_i[nn] = info.def_i;
                                return prepare_info(user,station);       
                            }
                        }
                    }
                }        
                break;
        case 4:
                break;
        case 5: // дополнительное оборудование
                if (curr_ship>=user.ships.length){
                    err = 0;
                }else{
                    user.curr_ship = curr_ship;
                    let ship = user.ships[curr_ship];
                    let ship_info  = INFO.INFO_UNITS[ship.type];
                    list = station.info.devices;
                    if (n<list.length-1 && list[n]===_id) {
                        let id    = list[n+0];
                        let perc  = list[n+1]/100;
                        let info  = INFO.INFO_DEVICES[id]; 
                        let price = Math.trunc(info.price*perc);
                        if (user.credits<price)  { err = 11; }
                        let cargo = item_manager.get_group(ship.cargo);
                        let cargo_free = ship.cargo_max - ship.cargo_count;
                        if (info.cargo>cargo_free){ err = 17; } 
                        // денег хватате и есть место
                        if ( err === 0 ){
                            user.credits  = user.credits - price;
                            ship.cargo_count = ship.cargo_count + info.cargo;
                            ship.device_radius = info.radius;
                            ship.device_energy = info.energy;
                            return prepare_info(user,station);       
                        }
                    }
                }        
                break;
    
    }
    return {
        i   : INFO.MSG_STATION,
        err : err
    }
}
 
// настройка оружия 
function ship_gun(user,station,curr_ship,gun_n,value){
    let err = 0;
    if (curr_ship<user.ships.length){
        user.curr_ship = curr_ship;
        let ship = user.ships[curr_ship];
        let ship_info  = INFO.INFO_UNITS[ship.type];
        let guns_count = ship_info.guns.length;  
        if (gun_n<guns_count && ship.guns[gun_n]!==0){
            let gun_type = ship.guns[gun_n];
            let info  = INFO.INFO_GUNS[gun_type];
            // если пули то покупаем пачку 
            if (info.type===INFO.GUNS_TYPE_BULLET){
                let c = info.bullets_max - ship.guns_i[gun_n];
                c = Math.trunc(c/info.def_i)*info.bullets_price;
                if (c===0){ c = info.bullets_price; }
                if (user.credits>=c){
                    user.credits = user.credits - c;
                    ship.guns_i[gun_n] = info.bullets_max; 
                }else{
                    err = 11;
                }
            }
            // если лазер то настраиваем мощность
            if (info.type===INFO.GUNS_TYPE_LASER){
                ship.guns_i[gun_n] = Math.min(value,info.energy); 
            }
            return prepare_info(user,station);       
        }
    }
    return {
        i   : INFO.MSG_STATION,
        err : err
    }    
}
//===============================================================================================
module.exports.prepare                  = prepare;
module.exports.user_req                 = user_req;
module.exports.activate_user            = activate_user;

