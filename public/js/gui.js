"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let GUI = {
    active                  : false,
    //
    type_text               : '',
    type_n                  : 0,
    type_pics               : ['urelonec2.png','urelonec2.png','urelonec2.png','urelonec2.png','urelonec2a.png','urelonec2a.png','urelonec2a.png','urelonec2a.png'],
    type_pic_n              : 0,
    type_div                : null,
    type_div_pic            : null,
    //
    ship_static_id          : 0,    // id статичного объекта с которым ведем операции
    storage_items           : [],
    wait_storage_op         : false,
}
Object.seal(GUI);

let SOUNDS = {
}
Object.seal(SOUNDS);

let miniMap = {
    W               : {  // окно на глобальной карте
                        sx      : 0,
                        sy      : 0,
                        ex      : 5*65536,
                        ey      : 5*65536,
                        step    : 5*65536,
                        s_step  : 650,
                    },
    holst           : null, 
    ctx             : null,
    planet_info_div : null,
    sel_div         : null,
    width           : 640,
    height          : 512,
    sel_id          : 0,
    sel_rx          : 0,
    sel_ry          : 0,
    sel_n           : 0,
    selected_n      : -1,
    state           : 0,
    timer           : null,
}
Object.seal(miniMap);

function typeWriter(div,text) {
    if (div!==undefined){
        GUI.type_n = 0;
        GUI.type_div = div;
        GUI.type_text = text;
    }    
  if (GUI.type_n < GUI.type_text.length ) {
    GUI.type_n = GUI.type_n + 1;
    GUI.type_div.innerHTML = GUI.type_text.substring(0, GUI.type_n);
/*    GUI.type_pic_n = GUI.type_pic_n + 1;
    if (GUI.type_pic_n>=GUI.type_pics.length){
        GUI.type_pic_n = 0;
    }
    GUI.type_div_pic.style.backgroundImage = 'url(i/'+GUI.type_pics[GUI.type_pic_n]+')';
  */  
    setTimeout(function() {
      typeWriter();
    }, 20);
  }
}

function format_cr(n){
    let s = new String(n);
    let ss ='';
    let c = 3;
    let l = s.length;
    while (l--){
        c = c-1;
        if (c===0){
            ss = ' '+s[l]+ss;
            c = 3;
        }else{
            ss = s[l]+ss;
        }
    }
    ss = ss+' cr.';
    return ss;
}
function format_count(n){
    if (n===0){
        return '';
    }else{
        return ''+n+'';
    }
}

function gui_prepare(){
    //miniMap
    //miniMap_prepare();
    //
    
    //SOUNDS.roll      = new THREE.Audio( RENDER.listener );
    //SOUNDS._loader   = new THREE.AudioLoader();
    //SOUNDS._loader.load( 'wav/rollover.wav', function( buffer ) {
    //    SOUNDS.roll.setBuffer( buffer );
	//    SOUNDS.roll.setVolume(0.3);
    //}); 
}

function gui_interaction(){
    if (USER.storage_static_id!==0){
        let a = MAP.static_by_id.get(USER.storage_static_id);
        if (a!==undefined){
            let info = STATIC_INFO[a.type];
            // если это станция 
            if (info.storage === 1000){
                //отправляем запрос на стыковку со станцией
                // 01 2 3 4567
                _buff_dv.setUint8(  3, STATION_OP_CONNECT );
                _buff_dv.setUint32( 4, USER.storage_static_id );
                send_bin(MSG_STATION,8);
            }else{
                //отправляем запрос о хранилище на карте
                // 01 2 3 4567
                let op = 0;
                _buff_dv.setUint8(  3, op );
                _buff_dv.setUint32( 4, USER.storage_static_id );
                send_bin(MSG_STATIC,8);
            }
        }
    }
}
//=========================================================
// SHIP 
//=========================================================
function gui_show_ship_razdel(razdel_n){
    let s = $.SHIP.el.style.display;
    $.SHIP.el.style.display = 'block';    
    let l = $.SHIP.menu.el.children;
    for(let i=0;i<l.length;i++){ l[i].classList.remove('ship_btn_sel'); }
    l[razdel_n].classList.add('ship_btn_sel');
    //
    l = $.SHIP.razdels.el.children;
    for(let i=0;i<l.length;i++){ l[i].style.display = 'none'; }
    l[razdel_n].style.display='block';
    //
    switch(razdel_n){
        case 0: // инфо
                break;
        case 1: // груз
                gui_ship_cargo_update();
                break;
        case 2: // картка
                break;
    }
    //
    
}

function gui_show_ship_switch(n){
    if ($.SHIP.el.style.display==='none'){
        gui_show_ship_razdel(n);
    }else{
        gui_ship_close();
    }
}

function gui_ship_close(){
    $.SHIP.el.style.display = 'none';    
}

function gui_ship_cargo_update(){
    let ship = USER.ships[USER.curr_ship];
    let list = $.SHIP.cargo.list;
    let card = $.TPL.ship.cargo;
    for (let i=0;i<ship.cargo.length;i++){
        let count = ship.cargo[i];
        card.id    = i;
        card.name  = ITEMS_INFO[i].name;
        card.count = count;
        let el = list.set(i,card);
        if (count===0){
            el.style.display = 'none';
        }else{
            el.style.display = 'block';
        }
    } 
}


function gui_static_info(a){
    GUI.wait_storage_op = false;
    //
    let err = parseInt(a.err);
    if(err!=0){
        msg(ERROR_MSGS[err]);
        return;
    }
    //
    GUI.ship_static_id = parseInt(a.id);
    let items = parse_items(a.items);
    GUI.storage_items = items;
    console.log(items);
    let list = $.SHIP.cargo.space;
    let card = $.TPL.ship.cargo2;
    list.clear();
    for (let i=0;i<items.length;i++){
        let item = items[i];
        card.id    = item.id;
        card.name  = ITEMS_INFO[item.n].name;
        card.count = item.count; 
        list.set(item.id,card)
    }
    //
    if (a.upd.lenght!==0){
        let cargo = USER.ships[USER.curr_ship].cargo;
        let b = a.upd.split('-');
        for (let i=0;i<b.length;i=i+2){
            let n     = parseInt(b[i+0]);
            let count = parseInt(b[i+1]);
            cargo[n]  = count;
        }
    }
    //
    gui_show_ship_razdel(1);
}

function gui_cargo_to_storage(n){
    if (GUI.wait_storage_op){ return; }
    let ship = USER.ships[USER.curr_ship];
    let count = ship.cargo[n];
    if (count===0){ return; }
    //
    let items = GUI.storage_items;
    let item_id = 0;
    for (let i=0;i<items.length;i++){
        if (items[i].n === n){
            item_id = items[i].id; 
            break;
        }
    }        
    // отправляем запрос на перенос предмета с корабля в хранилище
    //      op  static_id  n   stack_item_id  
    //01 2  3     4567     8     9101112
    _buff_dv.setUint8(  3, 1 );
    _buff_dv.setUint32( 4, USER.storage_static_id );
    _buff_dv.setUint8(  8, n );
    _buff_dv.setUint32( 9, item_id );
    send_bin(MSG_STATIC,13);
    GUI.wait_storage_op = true;
    
}

function gui_storage_to_cargo(item_id){
    if (GUI.wait_storage_op){ return; }
    let ship  = USER.ships[USER.curr_ship];
    if (ship.cargo_count>=ship.cargo_max){ return; }
    // отправляем запрос на перенос предмета с корабля в хранилище
    //      op  static_id  stack_item_id  
    //01 2  3     4567      891011
    _buff_dv.setUint8(  3, 2 );
    _buff_dv.setUint32( 4, USER.storage_static_id );
    _buff_dv.setUint32( 8, item_id );
    send_bin(MSG_STATIC,12);
    GUI.wait_storage_op = true;
}
//=========================================================
// miniMap
//=========================================================
function mm_draw_window(){
    let W = miniMap.W;
    let ctx = miniMap.ctx;
    let sx = Math.floor(W.sx/WORD);
    let sy = Math.floor(W.sy/WORD);
    let ex = Math.floor(W.ex/WORD)+1;
    let ey = Math.floor(W.ey/WORD)+1;
    if (ex>=100){ex=100;}
    if (ey>=100){ey=100;}
    //
    ctx.clearRect(0, 0, miniMap.width, miniMap.height);
    //
    let w = miniMap.width/(W.ex-W.sx);
    let h = miniMap.height/(W.ey-W.sy);
    //
    let rx,ry;
    if (W.step<2000000){
        ctx.font = "8px monospace";
        ctx.fillStyle = "#005500";
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#001100';
        for (let cy=sy;cy<=ey;cy++){
            for (let cx=sx;cx<=ex;cx++){
                rx = cx*WORD;
                ry = cy*WORD;
                rx = Math.round((rx - W.sx)*w);
                ry = Math.round(miniMap.height-(ry - W.sy)*h);
                ctx.beginPath();
                ctx.moveTo(rx,0);
                ctx.lineTo(rx,miniMap.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0,ry);
                ctx.lineTo(miniMap.width,ry);
                ctx.stroke();
                //
                if (W.step<800000){
                    ctx.beginPath();
                    ctx.fillText(cx+','+cy,rx+4,ry-7);
                }
            }
        }
    }
    let l = PLANETS_INFO.length;
    for (let i=0;i<l;i++){
        let a = PLANETS_INFO[i];
        for (let i=0;i<a.length;i++){
            let x  = a[1];
            let y  = a[2];
            let t  = a[3];
            let cx = a[8];
            let cy = a[9];

            let color = 'gray';
            let radius = 500*w;
            switch (t){
                case 83:
                        color = 'blue';
                        radius = 5000*w; 
                        break;
                case 84:
                        color = 'gray';
                        radius = 5000*w; 
                        break;
                case 85:
                        color = 'red';
                        radius = 5000*w; 
                        break;
                case 86:
                        color = 'yellow';
                        radius = 5000*w; 
                        break;
                case 87:
                        color = '#aaaaff';
                        radius = 10000*w; 
                        break;
                default:
                        if (W.step>1000000){
                            continue;
                       }
                    break;
            }
            rx = cx*WORD+x;
            ry = cy*WORD+y;
            rx = Math.round((rx - W.sx)*w);
            ry = Math.round(miniMap.height-(ry - W.sy)*h);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.fillStyle   = color;
            //ctx.lineWidth = 5;
            if (t===87){
                let r = Math.round(radius/2);
                ctx.strokeRect(rx-r, ry-r, radius, radius);
            }else{
                ctx.arc(rx, ry, radius, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
    }
    //
    mm_draw_user_ship();
    //
    mm_update_sel();    
}

function mm_update_sel(){
    let W = miniMap.W;
    let w  = miniMap.width/(W.ex-W.sx);
    let h  = miniMap.height/(W.ey-W.sy);
    let rx = Math.round((miniMap.sel_rx - W.sx)*w);
    let ry = Math.round(miniMap.height-(miniMap.sel_ry - W.sy)*h);
    if (rx<0 || rx>miniMap.width || ry<0 || ry>miniMap.height){
        miniMap.sel_div.style.display='none';
    }else{
        miniMap.sel_div.style.display='block';
        miniMap.sel_div.style.left = (rx-8)+'px';
        miniMap.sel_div.style.top  = (ry-8)+'px';
    }
}

function mm_select_planet(mx,my){
    let W = miniMap.W;
    let sx = Math.floor(W.sx/WORD);
    let sy = Math.floor(W.sy/WORD);
    let ex = Math.floor(W.ex/WORD)+1;
    let ey = Math.floor(W.ey/WORD)+1;
    if (ex>=bb_width){ex=bb_width;}
    if (ey>=bb_height){ey=bb_height;}
    //
    let w = miniMap.width/(W.ex-W.sx);
    let h = miniMap.height/(W.ey-W.sy);
    //
    let xx = Math.trunc(W.sx + (W.ex-W.sx)*(mx/miniMap.width));
    let yy = Math.trunc(W.sy + (W.ey-W.sy)*(1.0 - my/miniMap.height));
    let dd = 10000;
    let id = -1;
    let rx = 0;
    let ry = 0;
    let n = -1;

    let l = PLANETS_INFO.length;
    for (let i=0;i<l;i++){
        let a  = PLANETS_INFO[i];
        let x  = a[1];
        let y  = a[2];
        let t  = a[3];
        let cx = a[8];
        let cy = a[9]; 
        let _rx = cx*WORD+x;
        let _ry = cy*WORD+y;
        let dx = _rx-xx;
        let dy = _ry-yy;
        let d = Math.sqrt(dx*dx+dy*dy);
        if (d<dd){
            dd = d;
            id = a[0];
            rx = _rx;
            ry = _ry;
            n = i;
        }
    }
    //let s = ':';
    if (id!==-1){
        //s = 'id:'+id;
        miniMap.sel_id = id;
        miniMap.sel_rx = rx;
        miniMap.sel_ry = ry;
        miniMap.sel_n  = n;
        mm_update_sel();
    }
    //planet_info_div.innerText = s;
    return id;
}

function mm_user_select_planet(n,cx,cy,x,y){
    //
    let a = PLANETS_INFO[n];
    let id = a[0];
    miniMap.selected_n = n;
    mm_draw_window();
    fetch('/map?t=1&id='+id).then(function(response) {
        return response.json();
    }).then(function(s) {
        let t ='';
        if (s.name===undefined){
        }else{
            t = '<div>'+s.name+'</div>'+
                '<div>'+s.desc+'</div>'+
                '<div>'+ALIANS_INFO[parseInt(s.owner)].name+'</div>'+
                '<div>'+PLANET_TYPE_INFO[parseInt(s.type)].name+'</div>'+
                '<div>'+PLANET_RACE_INFO[parseInt(s.race)].name+'</div>';
        }
        miniMap.planet_info_div.innerHTML = t;
    });         
}

function miniMap_prepare(){
    miniMap.holst            = document.getElementById('mm_holst');
    miniMap.ctx              = miniMap.holst.getContext('2d');
    miniMap.planet_info_div  = document.getElementById('mm_planet_info');
    miniMap.sel_div          = document.getElementById('mm_sel');
    miniMap.sel_div.onclick  = function(){
        mm_user_select_planet(miniMap.sel_n);
    }
    
    miniMap.holst.addEventListener( 'mousedown', function(event){
        let id = mm_select_planet(event.offsetX,event.offsetY);
        if (id!==-1){
            mm_user_select_planet(miniMap.sel_n);
        }else{
            miniMap.state = 1;
        }
        event.preventDefault();
    }, false );
    miniMap.holst.addEventListener( 'mouseup', function(event){
        miniMap.state = 0;
        event.preventDefault();
    }, false );
    miniMap.holst.addEventListener( 'mousemove', function(event){
        if (miniMap.state===0){
            if (miniMap.W.step<1700000){
               mm_select_planet(event.offsetX,event.offsetY);
            }
        }
        if (miniMap.state===1){
            let x = event.movementX;
            let y = event.movementY;
            let W = miniMap.W;
            W.sx = W.sx - x*W.s_step; 
            W.sy = W.sy + y*W.s_step;
            if (W.sx<0){W.sx = 0;} 
            if (W.sx>map_maxx){W.sx = map_maxx;} 
            if (W.sy<0){W.sy = 0;} 
            if (W.sy>map_maxy){W.sy = map_maxy;}
            W.ex = W.sx + W.step; 
            W.ey = W.sy + W.step; 
            mm_draw_window();
        }        
        event.preventDefault();
    }, false );
}

function mm_draw_user_ship(){
    let W   = miniMap.W;
    let ctx = miniMap.ctx;

    let w  = miniMap.width/(W.ex-W.sx);
    let h  = miniMap.height/(W.ey-W.sy);
    let rx = USER.cx*WORD + USER.x;
    let ry = USER.cy*WORD + USER.y;
    rx = Math.round((rx - W.sx)*w);
    ry = Math.round(miniMap.height-(ry - W.sy)*h);
    //
    let vx = 1;
    let vy = 0;
    ctx.fillStyle = 'blue';
    let dx = 10;
    ctx.beginPath();
    ctx.moveTo(rx+dx,ry);
    ctx.lineTo(rx-dx,ry-dx);
    ctx.lineTo(rx-dx,ry+dx);
    ctx.fill();
    //
    if (miniMap.selected_n>=0){
        let b  = PLANETS_INFO[miniMap.selected_n];
        let cx = b[8];
        let cy = b[9];
        let x  = b[1];
        let y  = b[2];
        let rx2 = cx*WORD+x;
        let ry2 = cy*WORD+y;
        rx2 = Math.round((rx2 - W.sx)*w);
        ry2 = Math.round(miniMap.height-(ry2 - W.sy)*h);
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(rx,ry);
        ctx.lineTo(rx2,ry2);
        ctx.stroke();
    }
}

function mm_zoom(delta){
    let w = miniMap.W;
    w.step = w.step + delta;
    if (w.step<177680){
        w.step = 177680;
        return;
    }
    if (w.step>6777680){
        w.step = 6777680;
        return;
    }
    w.s_step = Math.trunc(w.s_step + delta/650);
    w.sx    =  Math.trunc(w.sx - delta/2);
    w.sy    =  Math.trunc(w.sy - delta/2);
    if (w.sx<0){w.sx = 0;} 
    if (w.sx>map_maxx){w.sx = map_maxx;} 
    if (w.sy<0){w.sy = 0;} 
    if (w.sy>map_maxy){w.sy = map_maxy;}
    w.ex = w.sx + w.step;
    w.ey = w.sy + w.step;
    mm_draw_window();
}

function mm_camera_look_at(x,y){
    let d = miniMap.W.step/2;
    miniMap.W.sx = x - d;
    miniMap.W.sy = y - d;
    mm_zoom(0);
}

function miniMap_update(){
    let rx = USER.cx*WORD+USER.x;
    let ry = USER.cy*WORD+USER.y;
    mm_camera_look_at(rx,ry);
}