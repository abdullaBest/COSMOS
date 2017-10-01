"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
let STATION = {
    id              : 0,
    //
    data            : null,
    razdel          : 0,
    angar_razdel    : 0,
    ships_razdel    : 0,
    ships_id        : 0,
    ships_div_sel   : null,
    wait_for_answer : false,
    _timer          : 0,
    _cr             : 0,
    _cargo          : 0,
}
Object.seal(STATION);


function station_prepare(){

}

// пришли данные с сервера
function station_data(data){
    console.log(data);
    if (data.err!==undefined){
        msg(ERROR_MSGS[data.err]);
    }else{
        STATION.data      = data.d;
        USER.n            = parseInt(data.n);
        USER.credits      = parseInt(data.credits);
        USER.curr_ship    = parseInt(data.curr_ship);
        STATION.id        = parseInt(data.id);
        let ships = [];
        if (data.ships!==''){
            let list          = data.ships.split(':');
            for (let i=0;i<list.length;i++){
                let b = list[i].split(',');
                let a = {
                    type          : parseInt(b[0]),
                    cargo         : new Uint32Array(b[1].split('-')),//parse_items(b[1]),
                    cargo_count   : parseInt(b[2]),
                    cargo_max     : parseInt(b[3]),
                    hp            : parseInt(b[4]),
                    hp_max        : parseInt(b[5]),
                    shield        : 0,
                    shield_max    : parseInt(b[6]),
                    shield_gen    : parseInt(b[7]),
                    fuel          : parseInt(b[8]),
                    fuel_max      : parseInt(b[9]),
                    bullets       : parseInt(b[10]),
                    bullets_max   : parseInt(b[11]),
                    dvig          : parseInt(b[12]),
                    guns          :[parseInt(b[13]),
                                    parseInt(b[14]),
                                    parseInt(b[15]),
                                    parseInt(b[16])],
                    guns_i        :[parseInt(b[17]),
                                    parseInt(b[18]),
                                    parseInt(b[19]),
                                    parseInt(b[20])],
                    energy_type   : parseInt(b[21]),
                    energy        : 0,
                    energy_gen    : parseInt(b[22]),
                    energy_max    : parseInt(b[23]),
                    speed         : 0,
                    speed_max     : parseInt(b[24]),
                    station_id    : parseInt(b[25]),
                    device_radius : parseInt(b[26]),
                    device_energy : parseInt(b[27]),
                }
                Object.seal(a);
                a.shield = a.shield_max;
                a.energy = a.energy_max;
                ships.push(a);
            }
        }
        USER.ships = ships;
        //
        $.STATION.angar.userShips.clear();
        $.STATION.ships.userShips.clear();
        let tpl = $.TPL.STATION.userShipsList;
        for (let i=0;i<USER.ships.length;i++){
            let info = INFO_UNITS[USER.ships[i].type];
            tpl.name = info.name;
            tpl.el.dataset.n = i;
            $.STATION.angar.userShips.set(i,tpl);
            $.STATION.ships.userShips.set(i,tpl);
        }
        //
        $.STATION.angar.select(USER.curr_ship);
    }
    
    if (!STATION.wait_for_answer){
        // очищаем списки
        $.STATION.ships.corpus.clear();
        //
        $.STATION.ships.prepare();
        //
        station_show();
        station_menu_select(STATION.razdel);
        //
    }else{
        STATION.wait_for_answer = false;
        $.STATION.ships.info.btn.el.classList.remove('btn_wait');
    }
    //
    station_stat();
    //
    station_market_update();
}

function station_show(){ $.STATION.el.style.display = 'block'; }
function station_hide(){ $.STATION.el.style.display = 'none';  }


// =================================================================
// работаем с верхней полоской статуса
function station_stat(){
    $.STATION.stat.credits.el.innerHTML = format_cr(USER.credits);    
    $.STATION.stat.name.el.innerHTML = STATION.data.name;    
    $.STATION.stat.date.el.innerHTML = '10/окт/2346 10:15';    
}
// =================================================================
// работаем с меню
function station_menu_select(n){
    let l = $.STATION.menu.el.children;
    for(let i=0;i<l.length;i++){ l[i].classList.remove('st_btn_sel'); }
    l[n].classList.add('st_btn_sel');
    //
    station_razdel_show(n);
}

// =================================================================
// Разделы станции
function station_razdel_show(n){
    let l = $.STATION.razdels.el.children;
    for(let i=0;i<l.length;i++){ l[i].style.display = 'none'; }
    l[n].style.display='block';
    //
    STATION.razdel = n;
    switch(n){
        case 0: // ангар
                $.STATION.angar.menu.select(STATION.angar_razdel);
                break;
        case 1: // корабли
                station_ships_menu_select(STATION.ships_razdel);
                break;
        case 2: // рынок
                station_market_update();
                break;
    }
}
// =================================================================
// Раздел ангар
$.STATION.angar.select = function(n){
    USER.curr_ship = n;
    //
    if (n<USER.ships.length){
        $.STATION.angar._select( $.STATION.ships.userShips.el.children[n] );
    }
}

$.STATION.angar._select = function(el){
    let n = parseInt(el.dataset.n);
    USER.curr_ship = n;
    //
    let list = $.STATION.angar.userShips.el.children;
    for (let i=0;i<list.length;i++){
        if (i===n){
            list[i].classList.add('st_angar_ship_selected');
        }else{
            list[i].classList.remove('st_angar_ship_selected');
        }
    }
    list = $.STATION.ships.userShips.el.children;
    for (let i=0;i<list.length;i++){
        if (i===n){
            list[i].classList.add('st_angar_ship_selected');
        }else{
            list[i].classList.remove('st_angar_ship_selected');
        }
    }
    //
}

$.STATION.angar.menu.select = function(n){
    let a = $.STATION.angar.menu.el.children;
    for (let i=0;i<a.length;i++){ a[i].classList.remove('st_r_btn_sel'); }
    a[n].classList.add('st_r_btn_sel');
    //    
    a = $.STATION.angar.razdels.el.children;
    for (let i=0;i<a.length;i++){ a[i].style.display = 'none'; }
    a[n].style.display = 'block';
    //    
    STATION.angar_razdel = n;
    //
    switch(n){
        case 0:
                break;
        case 1:
                break;
        case 2: // вооружение
                station_angar_guns_show();                
                break;
        case 3:
                break;
        case 4:
                break;
    
    }
}

function station_angar_guns_show(){
    $.STATION.angar.guns.clear();
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){ return; }
    for(let i=0;i<ship.guns.length;i++){
        let gun_id = ship.guns[i];
        let gun_i  = ship.guns_i[i];
        let tpl = $.TPL.angar.gunEmpty;
        if (gun_id!==0){
            let info = INFO_GUNS[gun_id];
            if (info.type===GUNS_TYPE_BULLET){
                tpl = $.TPL.angar.gunB;
                tpl.id = i;
                tpl.name = info.name;
                tpl.bullets = gun_i;
                tpl.bullets_max = info.bullets_max;
            }else{
                tpl = $.TPL.angar.gunLaser;
                tpl.id = i;
                tpl.name = info.name;
                tpl.laser = gun_i;
                tpl.laser_max = info.energy;
            }
        }
        $.STATION.angar.guns.set(i,tpl);
    } 
}

function station_angar_gun(gun_n,el){
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){ return; }
    let gun_id = ship.guns[gun_n];
    //let gun_i  = ship.guns_i[gun_n];
    let info = INFO_GUNS[gun_id];
    let value = 0;
    if (info.type===GUNS_TYPE_BULLET){
            
    }
    if (info.type===GUNS_TYPE_LASER){
        value = parseInt(el.querySelector('input').value);            
    }
    // отправляем запрос
    // n,tip, type,curr_ship,gun_n, value  
    // 01 2     3    4        5      67
    _buff_dv.setUint8(  3, STATION_OP_GUN );
    _buff_dv.setUint8(  4, USER.curr_ship );
    _buff_dv.setUint8(  5, gun_n );
    _buff_dv.setUint16( 6, value );
    send_bin(MSG_STATION,8);
     
}
// =================================================================
// Раздел корабли
function station_ships_menu_select(n){
    let a = $.STATION.ships.menu.el.children;
    for (let i=0;i<a.length;i++){ a[i].classList.remove('st_r_btn_sel'); }
    a[n].classList.add('st_r_btn_sel');
    //    
    a = $.STATION.ships.razdels.el.children;
    for (let i=0;i<a.length-1;i++){ a[i].style.display = 'none'; }
    a[n].style.display = 'block';
    //    
    STATION.ships_razdel = n;
}

$.STATION.ships.prepare = function(){
    let list = STATION.data.ships;
    let d    = $.STATION.ships.corpus;
    if (list===undefined){ return; }
    let card = $.TPL.STATION.ships.corpusCard; 
    for (let i=0;i<list.length;i=i+2){
        let n     = parseInt(list[i+0]);
        let info  = INFO_UNITS[n];
        let price = Math.trunc(info.price*parseInt(list[i+1])/100);
        
        card.id          = n;
        card.name        = info.name;
        card.price       = price;
        card.max_hp      = info.max_hp;
        card.max_shield  = info.max_shield;
        card.max_fuel    = info.max_fuel;
        card.max_speed   = info.max_fuel;
        d.set(n,card);
    }
    //
    list = STATION.data.gens;
    d    = $.STATION.ships.gens;
    if (list!==undefined){ 
        card = $.TPL.STATION.ships.genCard; 
        for (let i=0;i<list.length;i=i+2){
            let n     = parseInt(list[i+0]);
            let info  = INFO_GENS[n];
            let price = Math.trunc(info.price*parseInt(list[i+1])/100);
        
            card.id          = n;
            card.name        = info.name;
            card.price       = price;
            d.set(n,card);
        }
    }
    //
    list = STATION.data.dvigs;
    d    = $.STATION.ships.dvigs;
    if (list!==undefined){ 
        card = $.TPL.STATION.ships.dvigCard; 
        for (let i=0;i<list.length;i=i+2){
            let n     = parseInt(list[i+0]);
            let info  = INFO_DVIGS[n];
            let price = Math.trunc(info.price*parseInt(list[i+1])/100);
        
            card.id          = n;
            card.name        = info.name;
            card.price       = price;
            d.set(n,card);
        }
    }
    //
    list = STATION.data.guns;
    d    = $.STATION.ships.guns;
    if (list!==undefined){ 
        card = $.TPL.STATION.ships.gunCard; 
        for (let i=0;i<list.length;i=i+2){
            let n     = parseInt(list[i+0]);
            let info  = INFO_GUNS[n];
            let price = Math.trunc(info.price*parseInt(list[i+1])/100);
        
            card.id          = n;
            card.name        = info.name;
            card.price       = price;
            d.set(n,card);
        }
    }
    //
    list = STATION.data.devices;
    d    = $.STATION.ships.devices;
    if (list!==undefined){ 
        card = $.TPL.STATION.ships.devicesCard; 
        for (let i=0;i<list.length;i=i+2){
            let n     = parseInt(list[i+0]);
            let info  = INFO_DEVICES[n];
            let price = Math.trunc(info.price*parseInt(list[i+1])/100);
        
            card.id          = n;
            card.name        = info.name;
            card.price       = price;
            d.set(n,card);
        }
    }
    //
    
}

$.STATION.ships.info.update = function(id){
    STATION.ships_id = id;

    $.STATION.ships.info.text.el.innerHTML = '';
    
    let list = STATION.data.ships;
    let info = INFO_UNITS;
    let link = $.STATION.ships.corpus;
    switch(STATION.ships_razdel){
        case 0 : 
                info = INFO_UNITS;
                list = STATION.data.ships;
                link = $.STATION.ships.corpus;
                break; 
        case 1 : 
                info = INFO_GENS;
                list = STATION.data.gens;
                link = $.STATION.ships.gens;
                break; 
        case 2 : 
                info = INFO_DVIGS;
                list = STATION.data.dvigs;
                link = $.STATION.ships.dvigs;
                break; 
        case 3 : 
                info = INFO_GUNS;
                list = STATION.data.guns;
                link = $.STATION.ships.guns;
                break;
         
        case 5 : 
                info = INFO_DEVICES;
                list = STATION.data.devices;
                link = $.STATION.ships.devices;
                break; 
    }
    

    let price = 0;
    for (let i=0;i<list.length;i=i+2){
        let n     = parseInt(list[i+0]);
        if (n===id){
            let price = Math.trunc(info[n].price*parseInt(list[i+1])/100);
            if (USER.credits<price){
                $.STATION.ships.info.btn.el.classList.remove('btn_hover');
            }else{
                $.STATION.ships.info.btn.el.classList.add('btn_hover');
            }
            typeWriter($.STATION.ships.info.text.el,info[n].desc);
            break;
        }
    }
    //
    let el = STATION.ships_div_sel;
    if (el!==null){
        el.classList.remove('st_ship_card_sel');
    }
    el = link._list.get(id);
    el.classList.add('st_ship_card_sel');
    
    STATION.ships_div_sel = el;
}

// =================================================================
function station_buy(){
    if (STATION.wait_for_answer){ return; }
    let razdel = STATION.ships_razdel;
    let id = STATION.ships_id;
    let list,n=-1;
    switch (razdel){
      case 0: //корпусы
            list = STATION.data.ships;
            for (let i=0;i<list.length;i=i+2){
                let _id = parseInt(list[i+0]);
                if (_id===id){
                    n = i;
                    let info  = INFO_UNITS[id];
                    let price = Math.trunc(info.price*parseInt(list[i+1])/100);
                    if (USER.credits<price){
                        msg(ERROR_MSGS[11]);
                        return;
                    }
                    break;
                }
            }         
            break;
      case 1:
            break;
      case 2:
            break;
      case 3: // вооружение
            list = STATION.data.guns;
            for (let i=0;i<list.length;i=i+2){
                let _id = parseInt(list[i+0]);
                if (_id===id){
                    n = i;
                    let info  = INFO_GUNS[id];
                    let price = Math.trunc(info.price*parseInt(list[i+1])/100);
                    if (USER.credits<price){
                        msg(ERROR_MSGS[11]);
                        return;
                    }
                    break;
                }
            }         
            break;
      case 4:
            break;
      case 5:   // дополнительное оборудование
            list = STATION.data.devices;
            for (let i=0;i<list.length;i=i+2){
                let _id = parseInt(list[i+0]);
                if (_id===id){
                    n = i;
                    let info  = INFO_DEVICES[id];
                    let price = Math.trunc(info.price*parseInt(list[i+1])/100);
                    if (USER.credits<price){
                        msg(ERROR_MSGS[11]);
                        return;
                    }
                    let ship = USER.ships[USER.curr_ship];
                    let cargo_free = ship.cargo_max-ship.cargo.length;
                    if (info.cargo>cargo_free){
                        msg(ERROR_MSGS[17]);
                        return;
                    }
                    break;
                }
            }  
            break;
    }
    //
    if (n<0){
        msg(ERROR_MSGS[0]);
        return;
    }   
    // отправляем запрос
    // n,tip, type,curr_ship,razdel,  n,  id
    // 01 2     3    4        5       6    7
    _buff_dv.setUint8(  3, STATION_OP_BUY );
    _buff_dv.setUint8(  4, USER.curr_ship );
    _buff_dv.setUint8(  5, razdel );
    _buff_dv.setUint8(  6, n );
    _buff_dv.setUint8(  7, id );
    send_bin(MSG_STATION,8);
    
    //
    STATION.wait_for_answer = true;
    $.STATION.ships.info.btn.el.classList.add('btn_wait');
    $.STATION.ships.info.btn.el.classList.remove('btn_hover');
}

// =================================================================
// Раздел Рынок
// =================================================================
// подготавливаем список товаров, обнуляем
function station_market_op_clear(){
    // чистием
    for (let i=0;i<ITEMS_INFO.length;i++){
        let a = ITEMS_INFO[i];
        a.op       = 0;
        a.op_count = 0;
        let perc = parseInt(STATION.data.perc[i]);
        a.price_buy  = Math.round(a.price*perc/100);
        a.price_sell = Math.max(0, Math.round(a.price*(perc-10)/100) );
    }
    //инициализируем
    STATION._cr = USER.credits;
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){
        STATION._cargo = 0;
    }else{
        STATION._cargo = ship.cargo_count;
    }
    
}
// полкупаем
function station_market_buy(n,t){
    clearTimeout(STATION._timer);
    //
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){ return; }
    //
    let a = ITEMS_INFO[n];
    // если до этого там продавали, обнуляем операцию
    if (a.op===1){
        STATION._cargo = STATION._cargo + a.op_count;  
        STATION._cr = STATION._cr - a.op_count*a.price_sell;  
        a.op = 0;
        a.op_count = 0;
    }
    // место на корабле и деньги - должны быть
    if (STATION._cargo<ship.cargo_max && a.price_buy<=STATION._cr){ 
        a.op_count = a.op_count + 1;   
        STATION._cargo = STATION._cargo + 1;  
        STATION._cr = STATION._cr - a.price_buy;  
        //
        t = Math.max(100,t - 20);
        STATION._timer = setTimeout(function(){
            if (USER.fire){
                station_market_buy(n,t);
            }
        },t);
    }
    // обновляем запись по шаблону
    let row  = $.TPL.station.marketRow;
    row.id         = n;
    row.name       = a.name;
    row.price_buy  = a.price_buy;
    row.price_sell = a.price_sell;
    row.op         = a.op;
    row.op_count   = a.op_count;
    row.u_count    = ship.cargo[n];
    $.STATION.market.list.set(n,row);   
    //обновляем статусные поля
    $.STATION.market.credits.el.innerText = format_cr(USER.credits-STATION._cr);
    $.STATION.market.cargo.el.innerText = STATION._cargo;
}
// правка операции
function station_market_op(n,t){
    clearTimeout(STATION._timer);
    //
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){ return; }
    //
    let a = ITEMS_INFO[n];
    // 
    if (a.op_count!==0){
        if (a.op===0){
            STATION._cargo = STATION._cargo - 1;  
            STATION._cr = STATION._cr + a.price_buy;  
        }else{
            STATION._cargo = STATION._cargo + 1;  
            STATION._cr = STATION._cr - a.price_sell;  
        }
        a.op_count = a.op_count - 1;
        //
        t = Math.max(100,t - 20);
        STATION._timer = setTimeout(function(){
            if (USER.fire){
                station_market_op(n,t);
            }
        },t);
    }
    // обновляем запись по шаблону
    let row  = $.TPL.station.marketRow;
    row.id         = n;
    row.name       = a.name;
    row.price_buy  = a.price_buy;
    row.price_sell = a.price_sell;
    row.op         = a.op;
    row.op_count   = a.op_count;
    row.u_count    = ship.cargo[n];
    $.STATION.market.list.set(n,row);   
    //обновляем статусные поля
    $.STATION.market.credits.el.innerText = format_cr(USER.credits-STATION._cr);
    $.STATION.market.cargo.el.innerText = STATION._cargo;
}
// продаем
function station_market_sell(n,t){
    clearTimeout(STATION._timer);
    //
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){ return; }
    //
    let a = ITEMS_INFO[n];
    // если до этого там покупали, обнуляем операцию
    if (a.op===0){
        STATION._cargo = STATION._cargo - a.op_count;  
        STATION._cr = STATION._cr + a.op_count*a.price_buy;  
        a.op = 1;
        a.op_count = 0;
    }
    // у нас должно быть что продавать
    if ( a.op_count<ship.cargo[n] ){ 
        a.op_count = a.op_count + 1;
        STATION._cargo = STATION._cargo - 1;  
        STATION._cr = STATION._cr + a.price_sell;  
        //
        t = Math.max(100,t - 20);
        STATION._timer = setTimeout(function(){
            if (USER.fire){
                station_market_sell(n,t);
            }
        },t);
    }
    // обновляем запись по шаблону
    let row  = $.TPL.station.marketRow;
    row.id         = n;
    row.name       = a.name;
    row.price_buy  = a.price_buy;
    row.price_sell = a.price_sell;
    row.op         = a.op;
    row.op_count   = a.op_count;
    row.u_count    = ship.cargo[n] - a.op_count;
    $.STATION.market.list.set(n,row);   
    //обновляем статусные поля
    $.STATION.market.credits.el.innerText = format_cr(USER.credits-STATION._cr);
    $.STATION.market.cargo.el.innerText = STATION._cargo;
}
// обновляем список товаров
function station_market_update(){
    station_market_op_clear();
    //
    let ship = USER.ships[USER.curr_ship];
    if (ship===undefined){
        return;
    }
    // шаблоны
    let row  = $.TPL.station.marketRow;
    let list = $.STATION.market.list;
    let o = 0;
    for (let i=0;i<ITEMS_INFO.length;i++){
        let a    = ITEMS_INFO[i];
        let perc = parseInt(STATION.data.perc[i]);
        row.id         = i;
        row.name       = a.name;
        row.price_buy  = a.price_buy;
        row.price_sell = a.price_sell;
        row.op_count   = a.op_count;
        row.u_count    = ship.cargo[i];
        let el = list.set(i,row);
        if (perc!==0){
            el.style.display = '';
            el.className = 'st_market_row_'+o;
            o=o+1;
            if (o>1){o=0;}
        }else{
            el.style.display = 'none';
        }
    }
}
// оформляем транзакцию
function station_market_op_send(){
    // определяем сколько всего операций
    let l = ITEMS_INFO.length;
    _buff_dv.setUint8(  3, STATION_OP_MARKET );
    _buff_dv.setUint8(  4, USER.curr_ship );
    let p = 5;
    while (l--){
        let a = ITEMS_INFO[l];
        if (a.op_count!==0){            
            _buff_dv.setUint8(  p+0,  l          );
            _buff_dv.setUint8(  p+1,  a.op       );
            _buff_dv.setUint16( p+2,  a.op_count );
            p = p + 4;
        }
    }
    if (p>5){
        send_bin(MSG_STATION,p);
    }
}
// =================================================================
// 
// игрок решил покинуть станцию
function station_leave(){
    if (STATION.data!==null){
        // n,tip, type, curr_ship
        // 01 2     3      4
        _buff_dv.setUint8(  3, STATION_OP_LEAVE );
        _buff_dv.setUint8(  4, USER.curr_ship );
        send_bin(MSG_STATION,5);
    }    
}


/*
// ====================================================================
// STATION
// ====================================================================

// пришел ответ с сервера по станции
function gui_station(data){
    gui_station_r_hide();
    GUI.div_station_r0.style.display = 'block';
    GUI.div_station_r1.style.display = 'block';
    GUI.div_station_r2.style.display = 'block';
    //
    GUI.div_station.style.display = 'block';
    //
    //console.log(data);
    //
    if (data!==null){
        if (data.items!==undefined){ user_parse_items(data.items); }
        if (data.n!==undefined){ USER.n   = parseInt(data.n); }
        if (data.id!==undefined){ USER.storage_static_id = parseInt(data.id); }
        if (data.u!==undefined){ 
            GUI.station_market_credits = USER.credits;
            GUI.station_market_cargo = USER.cargo;
            USER.credits   = parseInt(data.u.credits);
            USER.cargo     = parseInt(data.u.cargo);
            USER.cargo_max = parseInt(data.u.cargo_max);
        }
        if (data.d!==undefined){
            GUI.div_st_market_ok.disabled = false;
            GUI.station_market_list = [];
            let l = data.d.perc;
            for (let i=0;i<l.length;i++){
                let info = ITEMS_INFO[i];
                let price_buy = Math.round(info.price*parseInt(l[i])/100);
                let price_sell = Math.round(info.price*(parseInt(l[i])-10)/100);
                let cargo = 0;
                if (price_sell>0){
                    let a = {
                        type        : i,            // тип предмета
                        op          : 0,            // операция 0-купить, 1- продать
                        u_iid       : 0,            // user item id, id предмета у игрока с которым нужно соеденить или из которого надо вычетать
                        u_count     : 0,            // количество предметов у игрока
                        count       : 0,            // количество 
                        price_buy   : price_buy,    // цена покупки
                        price_sell  : price_sell,   // цена продажи
                    }            
                    let b = get_user_item_by_n(i);
                    if (b!==null){
                        a.u_iid   = b.id;
                        a.u_count = b.count;
                    }
                    GUI.station_market_list.push(a);
                }
            }
        }
    }
    if (GUI.info===null){
        stop_gameplay();
        GUI.info = data;
        GUI.div_station_name.innerText = data.d.name;
        GUI.div_station_desc.innerText = data.d.desc;
        //------
        // подготавливаем рынок
        //------
        GUI.station_razdel = 0;
        GUI.type_div = GUI.div_station_admt;
        GUI.type_div_pic = GUI.div_station_adm;
        GUI.type_n = 0;
        GUI.type_text = 'Тонкокожие здесь редкость, товары для девочек в дальнем разделе рынка, не порежтесь об пол, ваш корабль отстыкуют от станции если понадобится место.';
        typeWriter();
        //speech_speak('станция "'+data.d.name+'"');
    }else{
        if (data!==null){
            GUI.info = data;
        }else{
            GUI.station_razdel = 0;
        }
        switch(GUI.station_razdel){
            case 0  : // 
                    break;
            case 1  : // обновляем данные по ангару
                    gui_station_angar();
                    break;
            case 2  : // 
                    gui_station_market();
                    break;
            case 3  : // 
                    gui_station_bar();
                    break;
        }
    }
}

function gui_station_angar(){
    gui_station_r_hide();
    GUI.div_station_r3.style.display = 'block';
    GUI.div_station_r4.style.display = 'block';
    GUI.station_razdel = 1;
    //
    let hp = GUI.info.u.hp;
    let hp_max = GUI.info.u.hp_max;
    let fuel = GUI.info.u.fuel;
    let fuel_max = GUI.info.u.fuel_max;
    let bullets = GUI.info.u.bullets;
    let bullets_max = GUI.info.u.bullets_max;
    //
    let perc = Math.round((hp/hp_max)*100)+'%';
    let price = (hp_max - hp)*1;
    GUI.div_st_hp_perc.style.width = perc;
    GUI.div_st_hp_perc2.innerText = hp+'/'+hp_max;
    GUI.div_st_hp_price.innerText = price;
    //
    perc = Math.round((fuel/fuel_max)*100)+'%';
    price = (fuel_max - fuel)*1;
    GUI.div_st_fuel_perc.style.width = perc;
    GUI.div_st_fuel_perc2.innerText = fuel+'/'+fuel_max;
    GUI.div_st_fuel_price.innerText = price;
    //
    perc = Math.round((bullets/bullets_max)*100)+'%';
    price = (bullets_max - bullets)*1;
    GUI.div_st_bullets_perc.style.width = perc;
    GUI.div_st_bullets_perc2.innerText = bullets+'/'+bullets_max;
    GUI.div_st_bullets_price.innerText = price;
    //
}

function gui_station_market(){
    gui_station_r_hide();
    GUI.div_station_r5.style.display = 'block';
    GUI.station_razdel = 2;
    //
    GUI.station_market_credits   = USER.credits;
    GUI.station_market_cargo     = USER.cargo;
    GUI.div_st_credits.innerText = GUI.station_market_credits;
    GUI.div_st_cargo.innerText = USER.cargo_max - GUI.station_market_cargo;
    //
    let l = GUI.station_market_list;
    let s =''; 
    let n = 1;
    for (let i=0;i<l.length;i++){
        let a = l[i];
        a.count = 0;
        a.op = 0;
        let info = ITEMS_INFO[a.type];
        s = s + '<tr>'
        s = s + '<td class="td_n">'+n+'.</td>';
        s = s + '<td class="td_name">'+info.name+'</td>';
        s = s + '<td class="td_price">'+a.price_buy+'</td>';
        s = s + '<td class="td_btn"><button onmousedown="gui_station_buy(this,'+i+');">купить</button></td>';
        s = s + '<td class="td_btn"><button onmousedown="gui_station_clear(this,'+i+');">0</button></td>';
        s = s + '<td class="td_price">'+a.price_sell+'</td>';
        s = s + '<td class="td_count_cargo">'+a.u_count+'</td>';
        s = s + '<td class="td_btn"><button onmousedown="gui_station_sell(this,'+i+');">продать</button></td>';
        s = s + '</tr>';   
        n=n+1;
    }    
    GUI.div_st_market_list.innerHTML = s;   
}

function gui_station_bar(){
    gui_station_r_hide();
    GUI.div_station_r6.style.display = 'block';
    GUI.station_razdel = 3;
    //
}


function _gui_station_buy(){
    let a = GUI.station_market_list[GUI.station_market_n];
    if (a.op===1){
        GUI.station_market_credits = GUI.station_market_credits - (a.price_sell*a.count); 
        GUI.station_market_cargo   = GUI.station_market_cargo + a.count; 
        a.op = 0;
        a.count = 0;            
    }
    
    if ( a.price_buy<=GUI.station_market_credits && GUI.station_market_cargo<USER.cargo_max ){
        a.count = a.count+1;
        GUI.station_market_credits = GUI.station_market_credits - a.price_buy;
        GUI.station_market_cargo = GUI.station_market_cargo + 1;
    } 

    let d = GUI.station_market_row.children[4];
    d = d.children[0];
    if (a.count===0){
        d.innerText='0';
    }else{
        d.innerText='-->'+a.count;
    }
    d = GUI.station_market_row.children[6];
    d.innerText = a.u_count;
    GUI.div_st_credits.innerText = GUI.station_market_credits;
    GUI.div_st_cargo.innerText = USER.cargo_max - GUI.station_market_cargo;
}

function gui_station_clear(el,n){
    let a = GUI.station_market_list[n];
    if (a.op===1){
        GUI.station_market_credits = GUI.station_market_credits - (a.price_sell*a.count); 
        GUI.station_market_cargo   = GUI.station_market_cargo + a.count; 
        a.count = 0;            
    }
    if (a.op===0){
        GUI.station_market_credits = GUI.station_market_credits + (a.price_buy*a.count); 
        GUI.station_market_cargo   = GUI.station_market_cargo - a.count; 
        a.count = 0;            
    }
    //
    let row = el.parentNode.parentNode;
    let d = row.children[4];
    d = d.children[0];
    d.innerText='0';
    //
    d = row.children[6];
    d.innerText = a.u_count-a.count;
    GUI.div_st_credits.innerText = GUI.station_market_credits;
    GUI.div_st_cargo.innerText = USER.cargo_max - GUI.station_market_cargo;
}

function gui_station_buy(el,n){
    GUI.station_market_row = el.parentNode.parentNode;
    GUI.station_market_n = n;
    _gui_station_buy();
    clearInterval(GUI.station_btn_timer);
    GUI.station_btn_timer = setInterval(function(){
        if (!USER.fire){
            clearInterval(GUI.station_btn_timer);
            GUI.station_btn_timer = 0;    
        }else{
            _gui_station_buy();
        }
    },200);
}

function _gui_station_sell(){
    let a = GUI.station_market_list[GUI.station_market_n];
    if (a.op===0){
        GUI.station_market_credits = GUI.station_market_credits + (a.price_buy*a.count); 
        GUI.station_market_cargo = GUI.station_market_cargo - a.count; 
        a.op    = 1;
        a.count = 0;            
    }

    if (a.count<a.u_count){
        a.count = a.count+1;
        GUI.station_market_credits = GUI.station_market_credits + a.price_sell; 
        GUI.station_market_cargo = GUI.station_market_cargo - 1; 
    }
    
    let d = GUI.station_market_row.children[4];
    d = d.children[0];
    if (a.count!==0){
        d.innerText='<--'+a.count;
    }else{
        d.innerText='0';
    }

    d = GUI.station_market_row.children[6];
    d.innerText = a.u_count-a.count;
    GUI.div_st_credits.innerText = GUI.station_market_credits;
    GUI.div_st_cargo.innerText = USER.cargo_max - GUI.station_market_cargo;
}

function gui_station_sell(el,n){
    GUI.station_market_row = el.parentNode.parentNode;
    GUI.station_market_n = n;
    _gui_station_sell();
    clearInterval(GUI.station_btn_timer);
    GUI.station_btn_timer = setInterval(function(){
        if (!USER.fire){
            clearInterval(GUI.station_btn_timer);
            GUI.station_btn_timer = 0;
        }else{
            _gui_station_sell();
        }
    },200);
}

function gui_station_market_ok(){
    if (USER.storage_static_id===0){ return; }
    let list = GUI.station_market_list;
    let l = list.length;
    // определяем сколько всего операций
    let count = 0;
    for (let i=0;i<l;i++){
        if (list[i].count!==0){ count = count + 1; }
    }
    //
    if (count!==0){
        let size = 2+1 + 1+4 + count*(4+1+1+2);// n,tip, type,static_id  (item_id,type,op,count)
        let a = new ArrayBuffer(size); 
        let d = new DataView(a);
        // 01 2 3 4567 
        d.setUint8(  3, 5 ); // 0 - connect 1 -repair 2- fuel 3-bullets 4-покинуть станцию 5-рынок
        d.setUint32( 4, USER.storage_static_id );
        let p = 8; // 0123 4 5 67 
        for (let i=0;i<l;i++){
            let a = list[i];
            if (a.count!==0){            
                d.setUint32( p+0,  a.u_iid );
                d.setUint8(  p+4,  a.type  );
                d.setUint8(  p+5,  a.op    );
                d.setUint16( p+6,  a.count );
                p = p + 8;
            }
        }
        send_bin(MSG_STATION,d);           
        GUI.div_st_market_ok.disabled = true;
    }
}

function gui_st_repair(){
    if (USER.storage_static_id!==0){
        let a = new ArrayBuffer(2+1+ 1+4); // n,tip, type,static_id
        let d = new DataView(a);
        // 01 2 3 4567
        d.setUint8(  3, 1 ); // 0 - connect 1 -repair 2- fuel 3-bullets 4-покинуть станцию 5-рынок
        d.setUint32( 4, USER.storage_static_id );
        send_bin(MSG_STATION,d);
    }    
}
function gui_st_fuel(){
    if (USER.storage_static_id!==0){
        let a = new ArrayBuffer(2+1+ 1+4); // n,tip, type,static_id
        let d = new DataView(a);
        // 01 2 3 4567
        d.setUint8(  3, 2 ); // 0 - connect 1 -repair 2- fuel 3-bullets 4-покинуть станцию 5-рынок
        d.setUint32( 4, USER.storage_static_id );
        send_bin(MSG_STATION,d);
    }    
}
function gui_st_bullets(){
    if (USER.storage_static_id!==0){
        let a = new ArrayBuffer(2+1+ 1+4); // n,tip, type,static_id
        let d = new DataView(a);
        // 01 2 3 4567
        d.setUint8(  3, 3 ); // 0 - connect 1 -repair 2- fuel 3-bullets 4-покинуть станцию 5-рынок
        d.setUint32( 4, USER.storage_static_id );
        send_bin(MSG_STATION,d);
    }    
}
*/
