"use strict"

console.log('Process versions: ',process.versions);

const fs              = require('fs');                       // работа с файлами
const zlib            = require('zlib');

let WebSocketServer = require('ws').Server;                // связь
let https           = require('https');
let express         = require('express');
const INFO          = require('./public/js/info.js');
let user_manager    = require('./user_manager.js');
let map_manager     = require('./map_manager.js');
let static_manager  = require('./static_manager');      // работа с статичными объектами на карте
let item_manager    = require('./item_manager.js');
let station_manager = require('./station_manager.js');
let npc_manager     = require('./npc_manager.js');
let SERVER          = null; // сервер
let WS              = null; // веб сокет сервер
let WSS             = null; // веб сокет сервер
let WS_BOT          = null; // веб сокет сервер

const _send_status             = new Uint8Array([INFO._send_status_next_tick]);
//===============================================================
// Подготавливаем менеджеры
//===============================================================
item_manager.prepare(INFO);
map_manager.prepare(INFO,item_manager);
static_manager.prepare(INFO,map_manager,item_manager,npc_manager);
user_manager.prepare(INFO,map_manager,item_manager,static_manager);
station_manager.prepare(INFO,user_manager,map_manager,item_manager,static_manager);
npc_manager.prepare(INFO,user_manager,map_manager,item_manager,static_manager);
//===============================================================
console.log('запускаем сервер обмена данными.');
let rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}
function prepare_server(){
    let privateKey  = fs.readFileSync('private.key', 'utf8');
    let certificate = fs.readFileSync('certificate.crt', 'utf8');
    let credentials = {key: privateKey, cert: certificate};
    SERVER = express();
    let httpsServer = https.createServer(credentials, SERVER);
    //
    let bodyParser = require('body-parser');
    SERVER.use(bodyParser.json({ verify: rawBodySaver }));
    SERVER.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
    SERVER.use(bodyParser.raw({ verify: rawBodySaver, type: function () { return true } }));
    //SERVER.use(bodyParser.json()); // support json encoded bodies
    //SERVER.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    //SERVER.use(bodyParser.raw()); 
    let cookieParser = require('cookie-parser');
    SERVER.use(cookieParser());
    //
    SERVER.use(express.static(__dirname + '/public'));
    //
    httpsServer.listen(443);
    let app = SERVER.listen(80);

    // WSS
    WSS = new WebSocketServer({
        //port: 3000,
        perMessageDeflate:false,
        server: httpsServer
    }); //path: '/d',
    WSS.on('connection', function(ws) { ws.onmessage = user_message; });

    // WS
    WS = new WebSocketServer({
        port: 3000,
        perMessageDeflate:false,
        server: app
    }); //path: '/d',
    WS.on('connection', function(ws) { ws.onmessage = user_message; });

    // веб сокет сервер для ботов
    WS_BOT = new WebSocketServer({
        port              : 3443,
        perMessageDeflate : false,
        server            : app,
    });

    
    WS_BOT.on('connection', function(ws) { ws.onmessage = bot_message; });

}
prepare_server();
//===============================================================
// Вход проверка
SERVER.get('/a', function(req, res){
    let r = {};
    try{
        r = JSON.parse(req.query.a);
    }catch(e){
        r = {};
    }
    if (r.e!==undefined){
        r = user_manager.login(r.e,r.p,true);
    }else{
        r = user_manager.login_socket(req.cookies.id,req.cookies.code,null);
    }
    res.send(JSON.stringify(r));
});
// Вход
SERVER.post('/a', function(req, res){
    let email    = req.body.email;
    let password = req.body.password;
    let r = user_manager.login(email,password,false);
    res.redirect('/game.html');
});
// Регистрация проверка
SERVER.get('/r', function(req, res){
    let r = {};
    try{
        r = JSON.parse(req.query.a);
    }catch(e){
        r = {};
    }
    r = user_manager.registration(r.e,r.n,r.p,r.p,false);
    res.send(JSON.stringify(r));
});
// Регистрация
SERVER.post('/r', function(req, res){
    let email     = req.body.email;
    let nickname  = req.body.nickname;
    let password  = req.body.password;
    let password2 = req.body.password2;

    let a = user_manager.registration(email,nickname,password,password2,true);
    if (a.m===7){
        res.redirect('/reg_succes.html');
    }else{
        res.send(JSON.stringify(a));
    }
});
// работа с картой
SERVER.get('/map', function(req, res){
    let r = req.query;
    let t = parseInt(r.t);
    let s;
    if (t===0){
        let readStream = fs.createReadStream(__dirname + '/map/map.bin');
        let gzip = zlib.createGzip();
        res.writeHead(200, { 'Content-Encoding': 'gzip' });
        readStream.pipe(gzip).pipe(res);
    }
    if (t===1){
        let s = '';
        try{
            s = fs.readFileSync(__dirname + '/map/i'+r.id+'.json');
        }catch(e){  
            s = '{}';
        }
        res.send(s);
    }
});
//
SERVER.post('/map', function(req, res){
    if (req.body.byteLength!==undefined){
        let data = req.body;
        try{
            fs.appendFileSync(__dirname + '/map/map.bin', data);
        }catch(e){  
        }
    }else{
        let r = req.body;
        let t = parseInt(r.t);
        if (t===0){
            let data = req.body.data;
            try{
                fs.writeFileSync(__dirname + '/map/map.bin', data);
            }catch(e){  
            }
        }
        if (t===1){
            let id   = r.id;
            let data = r.data;
            try{
                fs.writeFileSync(__dirname + '/map/i'+id+'.json', JSON.stringify(data));
            }catch(e){  
            }
        }
        if (t===2){
            let id     = parseInt(r.id);
            let cx     = parseInt(r.cx);
            let cy     = parseInt(r.cy);
            let x      = parseInt(r.x);
            let y      = parseInt(r.y);
            let type   = parseInt(r.type);
            let scale  = parseInt(r.scale);
            let angle  = parseInt(r.angle);
            let status = parseInt(r.status);
            if (isNaN(type)){type=0;}
            if (isNaN(id)){id=0;}
            if (isNaN(cx)){cx=0;}
            if (isNaN(cy)){cy=0;}
            if (isNaN(x)){x=0;}
            if (isNaN(y)){y=0;}
            if (isNaN(scale)){scale=0;}
            if (isNaN(angle)){angle=0;}
            if (isNaN(status)){status=0;}
            if (x<0){ x = 0; }
            if (y<0){ y = 0; }
            if (x>65535){ x = 65535; }
            if (y>65535){ y = 65535; }
            //if (cx<0){ cx = 0; }
            if (cy<0){ cy = 0; }
            if (cx>99){ cx = 99; }
            if (cy>99){ cy = 99; }
            static_manager.editor(type,id,cx,cy,x,y,angle,scale,status);
        }
    }
    res.send('');
});
//================================================================
// отправляем игроку по сокету данные
function _send(user,message){
    if (user.socket===null){return;}
    if (user.socket.readyState===1){
        try{
            user.socket.send(message);
        }catch(e){
            console.log(message);
        }
    }else{
        user_manager.disconnect_user(user);
    }
}

// функция обработки сокетов
// TODO перевести полностью в бинарный формат
function user_message(message){
    if (typeof message.data ==='string' ){
        let a;
        try { a = JSON.parse(message.data); } catch (e) { return; }
        if ( !Array.isArray(a) || a.length<2){ return; }
        let n   = parseInt(a[0]);
        let tip = parseInt(a[1]);
        if (isNaN(n) || isNaN(tip)){ return; }
        //---
        if (tip===INFO.MSG_LOGIN){ // Пользователь пытается войти в игру
            let id      = a[2];
            let code    = a[3];
            let result  = user_manager.login_socket(id,code,this);
            if (result===null){
                let user = user_manager.get_user_by_n(id);
                result = station_manager.activate_user(user,user.station_id);
            }
            try{
                this.send(JSON.stringify(result));
            } catch (e) { }
            return;
        }
        //---
        let u = user_manager.get_user_by_n(n);
        if (u!==undefined && u.socket===this){
            switch(tip){
                case INFO.MSG_EDITOR       : //Редактор
                                            let type   = parseInt(a[2]);
                                            let id     = parseInt(a[3]);
                                            let cx     = parseInt(a[4]);
                                            let cy     = parseInt(a[5]);
                                            let x      = parseInt(a[6]);
                                            let y      = parseInt(a[7]);
                                            let scale  = parseInt(a[8]);
                                            let angle  = parseInt(a[9]);
                                            let status = parseInt(a[10]);
                                            if (isNaN(type)){type=0;}
                                            if (isNaN(id)){id=0;}
                                            if (isNaN(cx)){cx=0;}
                                            if (isNaN(cy)){cy=0;}
                                            if (isNaN(x)){x=0;}
                                            if (isNaN(y)){y=0;}
                                            if (isNaN(scale)){scale=0;}
                                            if (isNaN(angle)){angle=0;}
                                            if (isNaN(status)){status=0;}
                                            if (x<0){ x = 0; }
                                            if (y<0){ y = 0; }
                                            if (x>65535){ x = 65535; }
                                            if (y>65535){ y = 65535; }
                                            //if (cx<0){ cx = 0; }
                                            if (cy<0){ cy = 0; }
                                            if (cx>99){ cx = 99; }
                                            if (cy>99){ cy = 99; }
                                            static_manager.editor(type,id,cx,cy,x,y,angle,scale,status);
                                            break;
            }
        }
        //
    } else { // пришли бинарные данные
        let d   = new DataView(message.data.buffer,message.data.byteOffset);
        let buff_length = message.data.byteLength;
        if (buff_length<5){ return; }
        let n   = d.getUint16(0); //
        let tip = d.getUint8(2);  //
        let u   = user_manager.get_user_by_n(n);
        if (u!==undefined && u.socket===this){
            let primary_tick = user_manager.get_primary_tick();
            let unit;
            switch(tip){
                case INFO.MSG_UNIT_POS      : // игрок прислал обновление
                                             if (u.tick!==primary_tick && buff_length>=25 ){
                                                if (u.unit_id!==0) {
                                                    if (u.unit_destroyed){
                                                        map_manager.remove_unit(u.unit_id);
                                                        user_manager.unvis_all(u);
                                                        u.unit_id = 0;
                                                    }else{
                                                        // 01 2 3 4 56 78 910 1112 1314 1516 1718 1920 2122 2324
                                                        let cx     = d.getUint8( 3);
                                                        let cy     = d.getUint8( 4);
                                                        let x      = d.getUint16(5);
                                                        let y      = d.getUint16(7);
                                                        let angle  = d.getUint16(9);
                                                        let status = d.getUint16(11);
                                                        let damage = d.getUint16(13);
                                                        let fuel   = d.getUint16(15);
                                                        let a1     = d.getUint16(17);
                                                        let a2     = d.getUint16(19);
                                                        let a3     = d.getUint16(21);
                                                        let a4     = d.getUint16(23);
                                                        //
                                                        if (cx>99){ cx = 99; x = 65535; }
                                                        if (cy>99){ cy = 99; y = 65535; }
                                                        //
                                                        user_manager.update_user_per_frame(u,status,fuel,damage,cx,cy,x,y,angle,a1,a2,a3,a4);
                                                        //                                                        
                                                    }
                                                }
                                                // 
                                                let static_id;
                                                let l = 25;
                                                if (l!==buff_length){
                                                    let count = d.getUint8(l);
                                                    l = l + 1;
                                                    // считываем попадания по динамичным объектам
                                                    while (l<buff_length-3 && count!==0){
                                                        let gun_n   = d.getUint8( l+0);
                                                        let unit_id = d.getUint16(l+1);
                                                        // попали в динамический объект надо что то сделать с ним
                                                        l = l + 3;
                                                        count = count - 1;
                                                    }
                                                    // считываем попадания по статичным объектам
                                                    while (l<buff_length-5){
                                                        let gun_n     = d.getUint8( l+0);
                                                        let static_id = d.getUint32(l+1);
                                                        static_manager.hit_static(static_id,100);
                                                        l = l + 5;
                                                    }
                                                }

                                                // отправляем сообщение игрока дальше - в обработчик ботов
                                                npc_manager.resend(message.data);
                                                //
                                                u.tick        = primary_tick;
                                                //u.last_update = Date.now();
                                             }
                                             break;
                case INFO.MSG_BLOCK         : // игрок запросил блок с карты
                                            if ( buff_length===5 ){
                                                let сx      = d.getUint8( 3);
                                                let сy      = d.getUint8( 4);
                                                if (сx>99){ сx = 99; }
                                                if (сy>99){ сy = 99; }
                                                u.block_req.x = сx;
                                                u.block_req.y = сy;
                                                user_manager.add_action(u,INFO.ACTION_BLOCK_REQ);
                                            }
                                            break;
                case INFO.MSG_UNIT_INFO     : // игрок запросил информацию по юниту
                                            if ( buff_length===5 ){
                                                u.unit_info_req = d.getUint16( 3);
                                                user_manager.add_action(u,INFO.ACTION_UNIT_INFO_REQ);
                                            }
                                            break;
                case INFO.MSG_ITEMS         : // игрок работает с предметами, переносит их из корабля в хранилище
                                            if ( buff_length>=7){ // 3456
                                                let static_id  = d.getUint32( 3);
                                                let static_obj = static_manager.get(static_id);
                                                let r = {
                                                    i    : INFO.MSG_ITEMS,
                                                    s_id : static_id,
                                                    u_id : 0,
                                                    u    : null,
                                                    s    : null,
                                                }
                                                //
                                                if (static_obj.id!==0){
                                                    let c = Math.trunc((buff_length-5)/6);
                                                    if (c>0){
                                                        let p = 7;
                                                        let bad = false;
                                                        let owner1 = u.storage;
                                                        let owner2 = static_obj.items_group;
                                                        let count1 = 0;
                                                        let count2 = 0;
                                                        //
                                                        let cc = c;
                                                        while(c--){
                                                            let id       = d.getUint16(p);
                                                            p = p + 2;
                                                            let count    = d.getUint16(p);
                                                            p = p + 2;
                                                            let stack_id = d.getUint16(p);
                                                            p = p + 2;
                                                            //
                                                            let item = item_manager.get_item(id);
                                                            if (count>item.count){ bad = true; }
                                                            switch(item.owner){
                                                                case owner1 :
                                                                            count1 = count1 + count;
                                                                            break;
                                                                case owner2 :
                                                                            count2 = count2 + count;
                                                                            break;
                                                                default     : bad = true;
                                                                            break;
                                                            }
                                                            if (stack_id!==0){
                                                                let stack_item = item_manager.get_item(stack_id);
                                                                if (stack_item.owner!==owner1 && stack_item.owner!==owner2){ bad = true; }
                                                            }
                                                        }
                                                        //
                                                        // TODO сделать это правильно
                                                        if (count1>100){ bad=true; }
                                                        if (count2>100){ bad=true; }
                                                        //
                                                        if (!bad){
                                                            c = cc;
                                                            p = 5;
                                                            while(c--){
                                                                let id       = d.getUint16(p);
                                                                p = p + 2;
                                                                let count    = d.getUint16(p);
                                                                p = p + 2;
                                                                let stack_id = d.getUint16(p);
                                                                p = p + 2;
                                                                //
                                                                let item = item_manager.get_item(id);
                                                                switch(item.owner){
                                                                    case owner1 : // предмет принадлежит игроку, он переносит его в хранилище
                                                                                if (static_obj.items_group===0){
                                                                                    static_obj.items_group = item_manager.add_group(0);
                                                                                }
                                                                                item_manager.transfer(item,static_obj.items_group,count,stack_id);
                                                                                let user_group = item_manager.get_group(u.storage);
                                                                                if (user_group.count===0){
                                                                                    u.storage = 0;
                                                                                }
                                                                                break;
                                                                    case owner2 : // игрок переносит предмет из хранилища
                                                                                if (u.storage===0){
                                                                                    u.storage = item_manager.add_group(0);
                                                                                }
                                                                                item_manager.transfer(item,u.storage,count,stack_id);
                                                                                let static_group = item_manager.get_group(static_obj.items_group);
                                                                                if (static_group.count===0){
                                                                                    static_obj.items_group = 0;
                                                                                }
                                                                                break;
                                                                }
                                                            }
                                                            //
                                                            static_manager.save_static(static_obj.id);
                                                            //
                                                            r.u = item_manager.get_items(u.storage);
                                                        }
                                                    }
                                                    r.s = item_manager.get_items(static_obj.items_group);
                                                }
                                                //
                                                r.u_id = u.storage;
                                                _send(u,JSON.stringify(r));
                                            }
                                            break;
                case INFO.MSG_STATION       : // 
                                            //01 2 3 4 5 6 7
                                            //if ( buff_length>=8){
                                            {
                                                let info = station_manager.user_req(u,d,buff_length);
                                                _send(u,JSON.stringify(info));
                                            }
                                            break;
            }
        }
    }
    //
    return;
}

// Общаемся с ботами
function bot_message(message){
    let d   = new DataView(message.data.buffer,message.data.byteOffset);
    let buff_length = message.data.byteLength;
    npc_manager.req(this,d,buff_length);
}
//=========================================================
// ГЛАВНЫЙ ЦИКЛ
let last_time  = Date.now();  // текущее время
const FRAME_DELTA     = 100;  // время между раздачами фреймов клиентам
const FRAME_DELTA_BAD = FRAME_DELTA + 20; // если раздача кадров задержалась на это время то надо сообщить или принять меры
function main_loop(){
    let curr_time = Date.now();      //текущее время
    let delta  = curr_time - last_time;

    user_manager.update_actions();   // проходим по запросам игроков и выполняем их
    npc_manager.update(delta);       // обновляем ИИ
    // раздаем кадры игрокам
    if (delta>=FRAME_DELTA){
        if (delta>=FRAME_DELTA_BAD){ console.log(' delta',delta); }
        last_time = curr_time;
        let tick = user_manager.get_primary_tick()+1; //обновляем такт
        // проходим по всем активным фреймам и раздаем игрока которые на них подписаны
        let m = map_manager.Map.vis;
        while (m!==null){
            let fr = m.f_first;
            if (fr===null){             // если юнитов в чанке нету, значит рассылаем только обновления
                if (m._upd.length!==0){
                    //-------------  раздаем обновления подписанным на сектор карты игрокам ----------------
                    let cl = m.u_vis;
                    while (cl!=null){
                        let next = cl.next; // переходим здесь, потому что ниже могут линк оборвать
                        _send(cl.user,m._upd);
                        cl = next;
                    }
                    m._upd = '';
                }
                let mm = m;
                m = m.vis_next; // переходим на следующий сектор карты
                map_manager.deactivate_map_vision(mm);  // отписываем этот фрейм из рассылки
            }else{
                // раздаем все фреймы и обновления людям подписанным на них
                do {
                    let data = map_manager.get_frame(fr);
                    //-------------  раздаем фреймы подписанным на сектор карты игрокам ----------------
                    let cl = m.u_vis;
                    while (cl!=null){
                        let user = cl.user;
                        let next = cl.next; // переходим здесь, потому что ниже могут линк оборвать
                        if (user.tick!==tick){  // проверяем получил ли игрок оповещение по новому кадру
                            _send(user,_send_status);
                            user.tick = tick;
                        }
                        // отправляем обновления чанка
                        if (m._upd.length!==0){ _send(user,m._upd); }
                        _send(user,data);
                        cl = next;
                    }
                    //----------------------------------------------------------------------------------
                    fr = fr.next;
                } while (fr!=null)
                // подчищаем список обновлений для этой части карты
                m._upd = '';
                //
                m = m.vis_next; // переходим на следующий сектор карты
            }
        }
        //
        map_manager.update(delta);          // обновляем предметы на карте
        static_manager.update(delta);       // обновляем статику на карте
        //
        user_manager.activate_next_tick();  // оповещаем менеджер о начале нового фрейме
    }
    setImmediate(main_loop);
}

setImmediate(main_loop);
