"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let fs              = require('fs');                       // работа с файлами
let V               = require('./math.js');
const nodemailer    = require('nodemailer');

let USERS = [];
let _users = null;
//
let USERS_db_by_email    = new Map();   // список всех зарегестрированных игроков, отсортированных по адресам почты
let USERS_db_by_nickname = new Map();   // список всех зарегестрированных игроков, отсортированных по именам
//
const max_email_length    = 30;         // максимальная длинна имени
const max_password_length = 30;         // максимальная длинна пароля
const max_nickname_length = 20;         // максимальная длинна клички
const max_code_length     = 24;         // максимальная длинна кода

let primary_tick          = 0;          // отсчитывает фреймы
// ACTIONS
const USERS_actions_per_tick = 10;      // количество запросов которые обрабатываются за такт
let USERS_actions_first      = 0;       // ссылка на первого в списке
let USERS_actions_last       = 0;       // ссылка на последенего в списке
let USERS_actions_count      = 0;       // количество игроков на обработку действий
let USERS_actionsN_first     = 0;       // следющий такт - ссылка на первого в списке
let USERS_actionsN_last      = 0;       // следющий такт - ссылка на последенего в списке
let USERS_actionsN_count     = 0;       // следющий такт - количество игроков на обработку действий
//
let _send_status             = new Uint8Array(1);


let INFO = null;
let map_manager = null;
let item_manager = null;
let static_manager = null;


let _user_pos = {cx:0,cy:0,x:0,y:0}

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'Mail.ru',
    auth: {
        user: 'robotcity@mail.ru',
        pass: 'xdrtfc'
    }
});

// генерирует код по шаблону 'xxxx-yxxx'
function generateUUID(s) {
    let d = new Date().getTime();
    let uuid = s.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

function _new_ship(){
    let a = {
        type            : 0,            // тип корабля
        cargo           : new Uint32Array(INFO.ITEMS_INFO.length),  // создаем хранилище предметов
        //cargo           : 0,            // номер хранилищя
        cargo_count     : 0,            // количество занятого места
        cargo_max       : 0,            // максимальное количество товара
        hp              : 0,            // прочность корабля
        hp_max          : 0,            // максимальная прочность корабля
        shield          : 0,            // прочность щита
        shield_max      : 0,            // максимальная прочность щита
        shield_gen      : 0,            // скорость востановления щита
        
        fuel            : 0,            // количество топлива
        fuel_max        : 0,
        bullets         : 0,            // количество патронов
        bullets_max     : 0,  
        dvig            : 0,            // тип двигателя на корабле
        guns            : [0,0,0,0],    // вооружение установленное на корабле
        guns_i          : [0,0,0,0],    // настройки для разного оружия
        
        energy_type     : 0,            // тип энергетической установки установленной на корабле
        energy_gen      : 0,            // количество генерируемой энергии за такт
        energy          : 0,            // количество доступной энергии
        energy_max      : 0,            // максималный порог генерируемой энергии
        
        speed_max       : 0,            // максимальная скорость

        device_radius   : 0,            // радиус действия устройства
        device_energy   : 0,            // энергия которую потребляет устройство
        
        station_id      : 0,            // станция на которой находится корабль
    }
    Object.seal(a);
    return a;  
}

function _new_user(a){
    let obj = {
        n                   : USERS.length,
        proto               : a,
        unit_id             : 0,
        socket              : null,    // сокет
        vis                 : new Array(9),
        tick                : 0,
        action              : 0,
        next_in_action_list : 0,            
        block_req           : { x:0,y:0 },  //
        unit_info_req       : 0,            //
        collect_req         : 0,            // запрос на забор статичного предмета с карты 
        unit_destroyed      : false,        //
        unit_in_station     : false,        // юнит находится на станции
        //
        credits             : 1000,         // внутренние деньги
        //
        items               : 0,            // номер хранилища предметов
        //
        station_id          : 100700,       // номер станции на которой последний раз был игрок
        //
        curr_ship           : 0,            // текущий корабль
        ships               : [],           // список кораблей игрока        
    }
    Object.seal(obj);
    
    for (let i=0;i<9;i++){
        obj.vis[i]={
            next  : null,
            prev  : null,
            user  : obj,
            map_p : -1,
        }
    }
    return obj;
}

// подготавливаем
function prepare(_info,_map_manager,_item_manager,_static_manager){
    INFO           = _info;
    map_manager    = _map_manager;
    item_manager   = _item_manager;
    static_manager = _static_manager;
    // загружаем список игроков
    _users = JSON.parse(fs.readFileSync(__dirname + '/users/users.json', 'utf8'));
    // база данных игроков
    for (let i=0;i<_users.list.length;i++){
        let a = _users.list[i];
        USERS_db_by_email.set(a.e,i);
        USERS_db_by_nickname.set(a.n,i);
        let user = _new_user(a);
        USERS.push(user);
        // это утилита для добавления записей в данные игроков
        /*
        load_user_data(user);
        user.ships = [];
        user.curr_ship = 0;
        save_user_data(user);
        */
    }
}

function _send(user,message){
    if (user.socket===null){return;}
    if (user.socket.readyState===1){
        try{
            user.socket.send(message);
        }catch(e){
            console.log(message);
        }
    }else{
        disconnect_user(user);
    }
}

// сохраняет данные игроков, TODO позднее переделать
function _save_users(){ fs.writeFileSync(__dirname + '/users/users.json', JSON.stringify(_users)); }

function registration(email,nickname,password,password2,is_real){
    email     = new String(email).toString();
    nickname  = new String(nickname).toString();
    password  = new String(password).toString();
    password2 = new String(password2).toString();

    email     = email.substring(0,max_email_length);
    password  = password.substring(0,max_password_length);
    password2 = password2.substring(0,max_password_length);
    nickname  = nickname.substring(0,max_password_length);

    if (email.length<6){
        return { i: INFO.MSG_MSG,  m: 1 }; // короткие
    }
    if (nickname.length<3){
        return { i: INFO.MSG_MSG,  m: 2 }; // короткие
    }
    if (password.length<6){
        return { i: INFO.MSG_MSG,  m: 3 }; // короткие
    }
    if (password!==password2){
        return { i: INFO.MSG_MSG,  m: 4 }; // не совпадают
    }
    if ( USERS_db_by_email.has(email) ){
        return { i: INFO.MSG_MSG,  m: 5 }; // почта уже зарегестрирована
    }
    if ( USERS_db_by_nickname.has(nickname) ){
        return { i: INFO.MSG_MSG,  m: 6 }; // имя пользователя уже зарегестрировано
    }
    //
    if (is_real){
        let id = _users.list.length;

        let uuid = id+'-'+generateUUID('xxxxyxxxxxxx');
        let a = {
            e        : email,
            p        : password,
            n        : nickname,
            _e       : 0,                   // проверена почта или нет
            _e_check : uuid,                // код проверки
            code     : '', 
            id       : id,                  //
        };
        _users.list.push(a);
        _save_users();
        //
        USERS_db_by_email.set(email,id);
        USERS_db_by_nickname.set(nickname,id);
        let obj = _new_user(a);
        USERS.push(obj);
        //
        save_user_data(obj);
        //
    }
    //
    return { i: INFO.MSG_MSG,  m: 7 };  // подтверждение

/*        let b = ;
        USERS_db_by_email[email] = n;
        USERS.push(b);
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Конструктор ММО игр" <robotcity@mail.ru>', // sender address
            to: email, // list of receivers
            subject: 'Подтвердите адресс', // Subject line
            text: '', // plain text body
            html: '<a href="https://crocodile.gq/_a/'+uuid+'">подтвердить адресс</a>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
        //
        msg = 2; // регистрация, отправлено письмо
  */  

}

// вход игрока в игру
function login(email,password,update_code){
    email    = new String(email).toString();
    password = new String(password).toString();
    //
    email    = email.substring(0,max_email_length);
    password = password.substring(0,max_password_length);
    //
    let id = USERS_db_by_email.get(email);
    let msg = 0;
    if (id===undefined){
        return { i: INFO.MSG_MSG,  m: 8 }; // не удалось войти
    }
    // TODO сделать защиту от подбора пароля
    let data = _users.list[id];
    if (data.p!==password){
        return { i: INFO.MSG_MSG,  m: 8 }; // не удалось войти
    }   
    if (update_code){
        data.code = generateUUID('xxxxyxxxxxxx');
    }
    return { i: INFO.MSG_MSG,  m: 9, id:id, code:data.code }; // не удалось войти
}

// вход игрока в игру
function login_socket(id,code,socket){
    id   = new String(id).toString();
    code = new String(code).toString();
    id   = parseInt(id);
    code = code.substring(0,max_code_length);
    if (isNaN(id)){
        return { i: INFO.MSG_LOGIN_FAIL }; // не удалось войти
    }
    // TODO сделать защиту от подбора пароля
    let data = _users.list[id];
    if (data===undefined){
        return { i: INFO.MSG_LOGIN_FAIL }; // не удалось войти
    }
    if (data.code!==code){
        return { i: INFO.MSG_LOGIN_FAIL }; // не удалось войти
    }
    //
    if (socket!==null){
        let user = USERS[id];
        disconnect_user(user);
        user.socket = socket;
        //
        load_user_data(user);
      
        return null;
    }else{
        return { i: INFO.MSG_LOGIN }; // не удалось войти
    }
}

//=====================================================
// Загружаем данные по игроку
function load_user_data(user){
    let user_info;
    try{
        user_info = JSON.parse(fs.readFileSync(__dirname + '/users/'+user.n+'.json', 'utf8'));
    }catch(e){
        return;
    }
    
    user.credits            = parseInt(user_info.credits);
    user.station_id         = parseInt(user_info.station_id);
    user.curr_ship          = parseInt(user_info.curr_ship);
    // иницилизируем предметы игрока           
    user.items = item_manager.add_group(0);
    let items  = user_info.items.split(';');
    let l = items.length-1;
    for (let i=0;i<l;i++){
        let it = items[i].split('-');
        item_manager.add_item(user.items,parseInt(it[1]),parseInt(it[2]),parseInt(it[3]));
    }
    // иницилизируем корабли
    if (user_info.ships!==''){
        let ships = user_info.ships.split(':');
        for (let i=0;i<ships.length;i++){
            let a = _new_ship();
            let b = ships[i].split(',');
            //
            a.type          = parseInt(b[0]);
            let cargo       = b[1];
            a.cargo_count   = parseInt(b[2]);
            a.cargo_max     = parseInt(b[3]);
            a.hp            = parseInt(b[4]);
            a.hp_max        = parseInt(b[5]);
            a.shield_max    = parseInt(b[6]);
            a.shield_gen    = parseInt(b[7]);
            a.fuel          = parseInt(b[8]);
            a.fuel_max      = parseInt(b[9]);
            a.bullets       = parseInt(b[10]);
            a.bullets_max   = parseInt(b[11]);
            a.dvig          = parseInt(b[12]);
            a.guns[0]       = parseInt(b[13]);
            a.guns[1]       = parseInt(b[14]);
            a.guns[2]       = parseInt(b[15]);
            a.guns[3]       = parseInt(b[16]);
            a.guns_i[0]     = parseInt(b[17]);
            a.guns_i[1]     = parseInt(b[18]);
            a.guns_i[2]     = parseInt(b[19]);
            a.guns_i[3]     = parseInt(b[20]);
            a.energy_type   = parseInt(b[21]);
            a.energy_gen    = parseInt(b[22]);
            a.energy_max    = parseInt(b[23]);
            a.speed_max     = parseInt(b[24]);
            a.station_id    = parseInt(b[25]);
            a.device_radius = parseInt(b[26]);
            a.device_energy = parseInt(b[27]);
            //
            a.shield        = a.shield_max;
            a.energy        = a.energy_max;
            // иницилизируем предметы корабля           
            //a.cargo   = item_manager.add_group(0);
            let items = cargo.split('-');
            for(let i=0;i<items.length;i++){
                a.cargo[i] = parseInt(items[i]);
            }    
            
/*            let items = cargo.split(';');
            let l = items.length-1;
            for (let i=0;i<l;i++){            
                let it = items[i].split('-');
                //item_manager.add_item(a.cargo,parseInt(it[1]),parseInt(it[2]),parseInt(it[3]));
            }
*/
            //
            if (a.hp===0){
                a.hp = a.hp_max;
            }
            //
            user.ships.push(a);
        }
    }
}

function get_ships_as_string(user){
    let s = '';
    for (let i=0;i<user.ships.length;i++){
        let a = user.ships[i];
        if (i!==0){ s=s+':'; }
        let cargo = a.cargo[0];
        let l = a.cargo.length;
        for (let i=1;i<l;i++){
            cargo = cargo+'-'+a.cargo[i];
        }
        //let cargo = item_manager.get_items(a.cargo);
        s = s+''+
            a.type+','+             //0
            cargo+','+              //1
            a.cargo_count+','+      //2
            a.cargo_max+','+        //3
            a.hp+','+               //4
            a.hp_max+','+           //5
            a.shield_max+','+       //6
            a.shield_gen+','+       //7
            a.fuel+','+             //8
            a.fuel_max+','+         //9
            a.bullets+','+          //10
            a.bullets_max+','+      //11
            a.dvig+','+             //12
            a.guns[0]+','+          //13
            a.guns[1]+','+          //14
            a.guns[2]+','+          //15
            a.guns[3]+','+          //16
            a.guns_i[0]+','+        //17
            a.guns_i[1]+','+        //18
            a.guns_i[2]+','+        //19
            a.guns_i[3]+','+        //20
            a.energy_type+','+      //21
            a.energy_gen+','+       //22
            a.energy_max+','+       //23
            a.speed_max+','+        //24
            a.station_id+','+       //25
            a.device_radius+','+    //26
            a.device_energy;        //27
    }
    return s;
}

// Сохраняем данные игрока
function save_user_data(user){
    let items_string = '';
    if (user.items!==0){
        items_string = item_manager.get_items(user.items);
    }
    //
    let ships = get_ships_as_string(user);
    //
    let user_info = JSON.stringify({
        credits      : user.credits,
        station_id   : user.station_id,
        items        : items_string,
        curr_ship    : user.curr_ship,
        ships        : ships,
    });
    try{
        fs.writeFileSync(__dirname + '/users/'+user.proto.id+'.json', user_info);
    }catch(e){
    }
}
//=====================================================
function new_ship(user,ship_type,station_id){
    let info  = INFO.INFO_UNITS[ship_type];
    let gen   = INFO.INFO_GENS[info.gen_type];
    let dvig  = INFO.INFO_DVIGS[info.dvig_type];
    //
    let a = _new_ship();
    a.type          = ship_type;
    //
    a.cargo_count   = 0;
    a.cargo_max     = info.max_cargo;
    //
    a.hp            = info.max_hp;   
    a.hp_max        = info.max_hp;
    //
    a.shield        = info.max_shield;
    a.shield_max    = info.max_shield;    
    a.shield_gen    = info.shield_gen;
    //
    a.fuel          = info.max_fuel;
    a.fuel_max      = info.max_fuel;
    //
    a.bullets       = 0;
    a.bullets_max   = info.max_bullets;
    a.guns[0]       = 0;
    a.guns[1]       = 0;
    a.guns[2]       = 0;
    a.guns[3]       = 0;
    //
    a.energy_type   = info.gen_type;
    a.energy_gen    = gen.gen_per_frame;
    a.energy        = gen.gen_max;
    a.energy_max    = gen.gen_max;
    //
    a.dvig          = info.dvig_type;
    a.speed_max     = dvig.max_speed;
    //
    a.station_id    = station_id;
    //
    user.ships.push(a);    
}

function get_curr_ship(user){ return user.ships[user.curr_ship]; }
//=====================================================
// отписываем игрока от карты, все его подписи
function unvis_all(user){
    map_manager.VIS_unset(user.vis[0]);
    map_manager.VIS_unset(user.vis[1]);
    map_manager.VIS_unset(user.vis[2]);
    map_manager.VIS_unset(user.vis[3]);
    map_manager.VIS_unset(user.vis[4]);
    map_manager.VIS_unset(user.vis[5]);
    map_manager.VIS_unset(user.vis[6]);
    map_manager.VIS_unset(user.vis[7]);
    map_manager.VIS_unset(user.vis[8]);
}
//отключаем игрока, сохраняем данные
function disconnect_user(user){
    if (user.socket!==null){
        // отписываем игрока от карты
        unvis_all(user);
        // сохраняем
        save_user_data(user);
        // освобождаем хранилище
        item_manager.free_group(user.items);
        user.items = 0;
        // освобождаем хранилища кораблей
        //for (let i=0;i<user.ships.length;i++){
        //    item_manager.free_group(user.ships[i].cargo);
        //}
        user.ships = [];
        // освобождаем юнита
        if (user.unit_id!==0){
            map_manager.remove_unit(user.unit_id);
            user.unit_id = 0;
        }
        user.unit_destroyed = false;
        user.action  = 0;
        //
        user.socket.close();
        user.socket = null;
    }
}
// обновляем все подписи игрока
function update_vis(u,cx,cy){
    if (u.socket!==null){
        map_manager.VIS_unset(u.vis[0]);
        map_manager.VIS_unset(u.vis[1]);
        map_manager.VIS_unset(u.vis[2]);
        map_manager.VIS_unset(u.vis[3]);
        map_manager.VIS_unset(u.vis[4]);
        map_manager.VIS_unset(u.vis[5]);
        map_manager.VIS_unset(u.vis[6]);
        map_manager.VIS_unset(u.vis[7]);
        map_manager.VIS_unset(u.vis[8]);
        map_manager.VIS_set(u.vis[0],cx - 1,cy - 1);
        map_manager.VIS_set(u.vis[1],cx + 0,cy - 1);
        map_manager.VIS_set(u.vis[2],cx + 1,cy - 1);
        map_manager.VIS_set(u.vis[3],cx - 1,cy + 0);
        map_manager.VIS_set(u.vis[4],cx + 0,cy + 0);
        map_manager.VIS_set(u.vis[5],cx + 1,cy + 0);
        map_manager.VIS_set(u.vis[6],cx - 1,cy + 1);
        map_manager.VIS_set(u.vis[7],cx + 0,cy + 1);
        map_manager.VIS_set(u.vis[8],cx + 1,cy + 1);
    }
}
// 
function get_user_by_n(n){ return USERS[n]; }

function get_primary_tick(){ return primary_tick; }

// ================================================
// ACTIONS
//================================================
// добавляем игрока в список на обработку
function add_action(user,action){
    let n = user.n;
    if (user.action===0){ // если пользователь не состоит в списке до добавляем его туда
        // если игрок уже подавал заявки в этом такте, заносим его в список на следующий такт
        if (user.tick===primary_tick){
            if (USERS_actionsN_count===0){
                USERS_actionsN_first = n;
                USERS_actionsN_last  = n;
            }else{
                let u = get_user_by_n(USERS_actionsN_last);
                u.next_in_action_list = n;
            }
            user.next_in_action_list = 0;
            USERS_actionsN_count = USERS_actionsN_count+1;
            USERS_actionsN_last  = n;
        }else{ // заносим в список на текущий такт
            if (USERS_actions_count===0){
                USERS_actions_first = n;
                USERS_actions_last  = n;
            }else{
                let u = get_user_by_n(USERS_actions_last);
                u.next_in_action_list = n;
            }
            user.next_in_action_list = 0;
            USERS_actions_count = USERS_actions_count+1;
            USERS_actions_last  = n;
        }
    }
    user.action = user.action | action;
}

// обновляем все действия активных игроков
function update_actions(){
    let c = Math.min(USERS_actions_per_tick,USERS_actions_count);
    while (c!==0){
        c=c-1;
        let u = USERS[USERS_actions_first];
        u.tick = primary_tick;
        USERS_actions_count = USERS_actions_count - 1;
        USERS_actions_first = u.next_in_action_list;
        // TODO клиент может уже быть не активным
        // TODO fire и use_item надо будет объеденить
        //if (u.action & INFO.ACTION_FIRE){            // игрок попал
        //    user_fire(u);
        //}
        if (u.action & INFO.ACTION_BLOCK_REQ){       // запросил блок с карты
            user_send_map_chunk(u);
        }
        if (u.action & INFO.ACTION_UNIT_INFO_REQ){   // запросил информацию по юниту
            user_send_unit_info(u);
        }
        if (u.action & INFO.ACTION_UNIT_COLLECT){    // собираем предмет с карты
            user_collect_static(u);
        }
        //if (u.action & INFO.ACTION_INTERACTION){     // игрок взаимодействует с тайлом
        //    user_interaction(u);
        //}
        //if (u.action & INFO.ACTION_STORAGE){         // игрок переносит предмет из инвентаря или хранилища
        //    user_item_operation(u);
        //}
        //if (u.action & INFO.ACTION_USE_ITEM){        // игрок воспользовался предметом
        //    user_use_item(u);
        //}
        u.action = 0;
    }
}

// отправляет чанк карты
function user_send_map_chunk(user){
    let x = user.block_req.x;
    let y = user.block_req.y;
    let f = map_manager.get_static_frame(x,y);
    _send_status[0] = INFO._send_status_block;
    _send(user,_send_status);
    while(f!==null){
        _send(user, static_manager.get_frame(f) );
        f = f.next;
    }
    _send_status[0] = INFO._send_status_block_end;
    _send(user,_send_status);
}

// отправляем игроку информацию про другого игрока
function user_send_unit_info(user){
    let id = user.unit_info_req;
    if (id!==0){
        let unit = map_manager.get_unit(id);
        
        let info = {
            i       : INFO.MSG_UNIT_INFO,
            name    : '',
            type    : unit.type,
            dvig    : unit.dvig,
            guns    : unit.guns,
            guns_i  : unit.guns_i,
        }
        let u = USERS[unit.user_id];
        if (u!==undefined && u.unit_id===id){ //socket!==null
            info.name = u.proto.n;
        }
        _send(user,JSON.stringify(info));
    }else{
        let info = {
            i    : INFO.MSG_UNIT_INFO,
            name : '',
        }
        _send(user,JSON.stringify(info));
    }
}
//
function user_collect_static(user){
    if (user.unit_id!==0 && !user.unit_destroyed){
        let ship      = get_curr_ship(user);
        let static_id = user.collect_req;
        // забираем объект с карты
        static_manager.collect(static_id,user.unit_id,ship); 
    }
    // уведомляем что обработали сообщение
    let info = {
        i    : INFO.MSG_DEVICE,
    }
    _send(user,JSON.stringify(info));
}
// ================================================
// наносим урон кораблю
function damage(user,d){
    let ship = user.ships[user.curr_ship];
    if (ship.shield>d){
        ship.shield = ship.shield - d;
    }else{
        let dd = d - ship.shield;
        ship.shield = 0;
        if (ship.hp>dd){
            ship.hp = ship.hp - dd;
        }else{
            ship.hp = 0;
        }
    }         
}

// раскидываем груз по карте
function ship_cargo_destroy(ship,cx,cy,x,y){
    let c = ship.cargo;
    let l = c.length;
    const time = 30;
    for (let i=0;i<l;i++){
        let item_n = i;
        let count  = c[i];
        if (count!==0){
            c[i] = 0;
            if (Math.random()>0.5){
                // TODO разбросать объекты по радиусу
                static_manager.add_cargo_box(cx,cy,x,y, i, count, time);
            }
        }
    }
}
// 
function update_user_per_frame(u,_status,fuel,damage,cx,cy,x,y,angle,a1,a2,a3,a4){
    // переносим разрешенные статусы без проверки
    let status = _status & (INFO.OBJ_STATUS_UPD_RND);
    //
    let ship = u.ships[u.curr_ship];
    // востанавливаем энергию
    let e = Math.min( ship.energy + ship.energy_gen, ship.energy_max );
    // востанавливаем щиты
    if (ship.shield<ship.shield_max){
        if (e>=ship.shield_gen){
            e = e - ship.shield_gen;
            ship.shield = Math.min( ship.shield + ship.shield_gen, ship.shield_max);
        }  
    }
    // проверяем на стрельбу
    const _st = [
        _status & INFO.OBJ_STATUS_FIRE1,
        _status & INFO.OBJ_STATUS_FIRE2,
        _status & INFO.OBJ_STATUS_FIRE3,
        _status & INFO.OBJ_STATUS_FIRE4
    ];
    for (let i=0;i<4;i++){
        let st = _st[i];
        let t  = ship.guns[i];   // тип пушки
        let b  = ship.guns_i[i]; // количество патронов в пушке
        // если флаг горит и пушка существует
        if ( st!==0 && t!==0 ){
            let gun_info = INFO.INFO_GUNS[t];
            // стрельба из пулемета
            if (gun_info.type === INFO.GUNS_TYPE_BULLET){
                if ((b>=gun_info.bullets) && (e>=gun_info.energy)){
                    ship.guns_i[i] = b - gun_info.bullets;
                    e = e - gun_info.energy;
                    status = status | st;
                }
            }
            // стрельба из лазера
            if (gun_info.type === INFO.GUNS_TYPE_LASER){
                if ( b>0 && b<=e ){
                    e = e - b;
                    status = status | st;
                }                
            }
        }
    }
    // проверка на повреждения
    if (damage!==0){
        if (ship.shield>damage){
            ship.shield = ship.shield - damage;
        }else{
            let d = damage - ship.shield;
            ship.shield = 0;
            if (ship.hp>d){
                ship.hp = ship.hp - d;
            }else{
                ship.hp = 0;
                status = status | INFO.OBJ_STATUS_BOOM;
                u.unit_destroyed = true;
                ship_cargo_destroy(ship,cx,cy,x,y);  
            }
        }
    }
    // обновляем записи, TODO fuel надо перенести на сервер
    ship.energy    = e;
    ship.fuel      = fuel;
    //
    let unit = map_manager.get_unit(u.unit_id);
    //ставим метку что данные были обновлены пользователем
    let old_status = map_manager.get_status(unit.frame_pos);
    if ( (old_status & INFO.OBJ_STATUS_CHCK)===0 ){
        status = status | INFO.OBJ_STATUS_CHCK;
    }
    // обновляем данные
    map_manager.set_position(unit.frame_pos, x, y, angle, a1,a2,a3,a4 );
    map_manager.set_hp(      unit.frame_pos, ship.hp     );
    map_manager.set_shield(  unit.frame_pos, ship.shield );
    map_manager.set_status(  unit.frame_pos, status        );
    // поверяем переход в другой сектор
    let chunk_p = cy*map_manager.bb_width + cx;
    if (unit.chunk_p!==chunk_p){
        map_manager.transfer(unit,chunk_p,cx,cy);
        update_vis(u,cx,cy);
    }
}
// ================================================
// переносим отложенные действия в текущий такт
function activate_next_tick(){
    primary_tick = primary_tick + 2; // 
    // отложенный список действий делаем активным
    if (USERS_actions_count===0){
        USERS_actions_count = USERS_actionsN_count;
        USERS_actions_first = USERS_actionsN_first;
        USERS_actions_last  = USERS_actionsN_last;
    }else{
        USERS_actions_count = USERS_actions_count + USERS_actionsN_count;
        let u = USERS[USERS_actions_last];
        u.next_in_action_list = USERS_actionsN_first;
    }
    USERS_actionsN_count = 0;
    USERS_actionsN_first = 0;
    USERS_actionsN_last  = 0;
}


module.exports.prepare                = prepare;
module.exports.login                  = login;
module.exports.login_socket           = login_socket;
module.exports.registration           = registration;
module.exports.disconnect_user        = disconnect_user;
module.exports.get_user_by_n          = get_user_by_n;
module.exports._save_users            = _save_users;

module.exports.damage                 = damage;

module.exports.get_primary_tick       = get_primary_tick;
module.exports.activate_next_tick     = activate_next_tick;

module.exports.update_vis             = update_vis;
module.exports.unvis_all              = unvis_all;

module.exports.add_action             = add_action;
module.exports.update_actions         = update_actions;
module.exports.new_ship               = new_ship;
module.exports.get_ships_as_string    = get_ships_as_string;
module.exports.get_curr_ship          = get_curr_ship;


module.exports.update_user_per_frame  = update_user_per_frame;


