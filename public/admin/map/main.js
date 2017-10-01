"use strict";

let map = [];
let map_by_id = new Map();
const map_cx = 100;
const map_cy = 100;
const map_dx = 65536;
const map_maxx = map_cx*map_dx;
const map_maxy = map_cy*map_dx;
let id = 1; 
let planet_info_div = null;

let sel_div = null;
let sel_rx = -1;
let sel_ry = -1;
let sel_id = -1;

let EDITOR = {
    id          : -1,
    cx          : 0,
    cy          : 0,
    x           : 0,
    y           : 0,
    prop_id     : null,
    prop_name   : null,
    prop_desc   : null,
    prop_race   : null,
    prop_owner  : null,
    prop_type   : null,        
    prop_perc   : [],
    prop2_x     : null,
    prop2_y     : null,
    prop2_type  : null,
    prop2_scale : null,
    prop2_angle : null,
    prop2_status: null,
    //
    station_ships       : document.getElementById('station_ships'),
    station_ships_sel   : document.getElementById('station_ships_sel'),
    station_gens        : document.getElementById('station_gens'),
    station_gens_sel    : document.getElementById('station_gens_sel'),
    station_dvigs       : document.getElementById('station_dvigs'),
    station_dvigs_sel   : document.getElementById('station_dvigs_sel'),
    station_guns        : document.getElementById('station_guns'),
    station_guns_sel    : document.getElementById('station_guns_sel'),
    station_devices     : document.getElementById('station_devices'),
    station_devices_sel : document.getElementById('station_devices_sel'),
}
let send_list = [];
let send_buff = null;
let send_buff_pos = 0;

const WIDTH   = 1024;
const HEIGHT  = 1024;
let holst = null;
let ctx   = null;

const db_row   = (4 +1+1+2+2 +2+2+2+2+2 ); // id cx,cy,x,y type,angle,status,scale,hp

let W = {
    sx      : 0,
    sy      : 0,
    ex      : 5*65536,
    ey      : 5*65536,
    step    : 5*65536,
    s_step  : 650,
}

let USER = {
    cx : 50,
    cy : 50,
    x  : 32000,
    y  : 32000,
}

let CONTROLS = {
    state : 0,
}

// генератор псевдослучайных чисел
let _seed = 1000000;
function random() { let x = Math.sin(_seed++) * 100000;  return x - Math.floor(x); }


//------------------------------------------------------------
function send_list_part(){
    /*if (send_list.length===0){
        return;
    }
    let s = send_list.shift();
    */
    if (send_buff_pos>=send_buff.byteLength){
        return;
    }
    let d = send_buff.byteLength-send_buff_pos;
    if (d>100*1024){
        d = 100*1024;
    }
    let s = new Uint8Array(send_buff,send_buff_pos,d);
    send_buff_pos = send_buff_pos + d;
    fetch('/map', {
        method: 'post',
        //headers: {
        //            'Accept'        : 'application/json',
        //            'Content-Type'  : 'application/json'
        //},
        //body: JSON.stringify({
        //    t       : 1,
        //    data    : s
        //})
        body : s,
    }).then( (response) => { 
        send_list_part();
    });
}
// сохранение данных по статичным объектам
function save_bin(){
    // создаем 1млн записей
    
    let max   = 1000000;
    let count = max*db_row;
    let buff  = new ArrayBuffer(count);
    let dv = new DataView(buff);
    //
    send_buff = buff;
    //
    let i=0;
    send_list = [];
    let s = '';
    for (let a of map_by_id){
        let id = a[0];
        let o = a[1];
        let p = id*db_row;
        let cx     = parseInt(o[8]);
        let cy     = parseInt(o[9]);
        let x      = parseInt(o[1]);
        let y      = parseInt(o[2]);
        let type   = parseInt(o[3]);
        let angle  = parseInt(o[4]);
        let status = parseInt(o[5]);
        let scale  = parseInt(o[6]);
        let hp     = parseInt(o[7]);
        //s=s + id+','+cx+','+cy+','+x+','+y+','+type+','+angle+','+status+','+scale+','+hp+';';
        i=i+1;
        //if (i===1000){
        //    i=0;
        //    send_list.push(s);
        //    s = '';
        //}
        // id  cx cy  x   y  type  angle  status   scale   hp
        //0123 4  5  67  89  1011  1213   1415     1617   1819
        dv.setUint32(p+0,  id    );
        dv.setUint8( p+4,  cx    );
        dv.setUint8( p+5,  cy    );
        dv.setUint16(p+6,  x     );
        dv.setUint16(p+8,  y     );
        dv.setUint16(p+10, type  );
        dv.setUint16(p+12, angle );
        dv.setUint16(p+14, status);
        dv.setUint16(p+16, scale );
        dv.setUint16(p+18, hp    );
        //
                
    }
    //if (i!==1000){
    //    send_list.push(s);
    //}
    fetch('/map', {
        method: 'post',
        headers: {
            'Accept'        : 'application/json',
            'Content-Type'  : 'application/json'
        },
        body: JSON.stringify({
            t       : 0,
            data    : '',
        })
        
    }).then( (response) => { 
        send_list_part();
    });
}
function generate_map(){
    return;
    let i_seed = document.getElementById('i_seed');
    _seed = i_seed.value;
    map = [];
    for (let y=0;y<map_cy;y++){
        for (let x=0;x<map_cx;x++){
            let a = [];
            map.push(a);
        }
    }
    // раздаем астеролидов
    let types = [0,   1,   2,   5]; //,   42, 43, 44, 45 
    let hp    = [1000,1000,1000,1000,100,100,100,100];
    for (let i=0;i<100000;i++){
        let _x = Math.trunc(random()*map_dx);
        let _y = Math.trunc(random()*map_dx);
        let cx = Math.trunc(random()*map_cx);
        let cy = Math.trunc(random()*map_cy);
        let p = cy*map_cx+cx;
        let a = map[p];
        let type = Math.trunc(random()*types.length);
        let scale = 20000 + Math.trunc(random()*30000);
        let angle = 0 + Math.trunc(random()*65536);
        //id x y type angle status scle hp
        //a.push(id+';'+_x+';'+_y+';'+types[type]+';'+angle+';'+0+';'+scale+';'+hp[type]);
        let _a = [id,_x,_y,types[type],angle,0,scale,hp[type],cx,cy];
        a.push(id);
        map_by_id.set(id,_a);
        id = id + 1;
    }
    // раздаем планеты
    types = [83,   84,   85,   86]; // 
    hp    = [1000,1000,1000,1000,100,100,100,100];
    for (let i=0;i<100;i++){
        // ставим звезду    
        let _x = Math.trunc(random()*map_dx);
        let _y = Math.trunc(random()*map_dx);
        let cx = Math.trunc(random()*map_cx);
        let cy = Math.trunc(random()*map_cy);
        let p = cy*map_cx+cx;
        let a = map[p];
        let type = 3;
        let scale = 65535;
        let angle = 0 + Math.trunc(random()*65536);
        let _a = [id,_x,_y,types[type],angle,0,scale,0,cx,cy];
        a.push(id);
        map_by_id.set(id,_a);
        id = id + 1;

        let count = 3 + Math.trunc(random()*7);
        for (let j=0;j<count;j++){
            let ang = random()*2*Math.PI;
            let vx = Math.cos(ang); 
            let vy = Math.sin(ang);
            let dist = 32768 + Math.trunc(random()*65536);
            let px = Math.trunc(cx*map_dx + _x + vx*dist);
            let py = Math.trunc(cy*map_dx + _y + vy*dist);
            if (px<0){ px = 0; }            
            if (py<0){ py = 0; }
            cx = Math.trunc(px/map_dx);   
            cy = Math.trunc(py/map_dx);
            if (cx>=map_cx){ cx = map_cx-1; }   
            if (cy>=map_cy){ cy = map_cy-1; }
            let x = px - cx*map_dx;   
            let y = py - cy*map_dx;   
            a = map[cy*map_cx+cx];
            let tt = random();
            if (tt>0.99){
                type=0;
            }else{
                type = 1 + Math.trunc(random()*2);
            }
            scale = 32768 + Math.trunc(random()*32768);
            angle = 0 + Math.trunc(random()*65536);

            let _a = [id,x,y,types[type],angle,0,scale,0,cx,cy];
            a.push(id);
            map_by_id.set(id,_a);
            id = id + 1;
            
        }
    }
    // Станции
    types = [87]; // 
    for (let i=0;i<100;i++){
        let _x = Math.trunc(random()*map_dx);
        let _y = Math.trunc(random()*map_dx);
        let cx = Math.trunc(random()*map_cx);
        let cy = Math.trunc(random()*map_cy);
        let p = cy*map_cx+cx;
        let a = map[p];
        let type = Math.trunc(random()*types.length);
        let scale = 65535;//20000 + Math.trunc(random()*30000);
        let angle = 0;
        //id x y type angle status scle hp
        //a.push(id+';'+_x+';'+_y+';'+types[type]+';'+angle+';'+0+';'+scale+';'+hp[type]);
        let _a = [id,_x,_y,types[type],angle,0,scale,0,cx,cy];
        a.push(id);
        map_by_id.set(id,_a);
        id = id + 1;
    }
    //
    save_bin();
    //
    draw_window();
}
//------------------------------------------------------------
function prepare_planets_json(){
    let planets = [];
    for (let a of map_by_id){
        let b = a[1];
        let id     = b[0];
        let x      = b[1];
        let y      = b[2];
        let type   = b[3];
        let angle  = b[4];
        let status = b[5];
        let scale  = b[6];
        let hp     = b[7];
        let cx     = b[8];
        let cy     = b[9];
        //
        if (type===83 || type===84 || type===85 || type===86 || type===87 ){
            planets.push(b);
        }
    }    
    /*
    let count = 0;
    function _info(){
        //
        if (count<planets.length){
            let id = planets[count];
            fetch('/map?t=1&id='+id).then(function(response) {
                return response.json();
            }).then(function(s) {
                let a = planets[count];
                if (s.name!==undefined){
                    a.name  = s.name;
                    a.desc  = s.desc; 
                    a.race  = s.race;
                    a.owner = s.owner;
                    a.p_type= s.type;
                    a.perc  = s.perc;
                }
                count = count + 1;
                _info();
            });
        }else{
            console.log(JSON.stringify(planets));
        }
    }
    _info();
    */
    console.log(JSON.stringify(planets));
        //
    //

}
//------------------------------------------------------------
function draw_user(){
    let w = WIDTH/(W.ex-W.sx);
    let h = HEIGHT/(W.ey-W.sy);
    let rx = USER.cx*map_dx+USER.x;
    let ry = USER.cy*map_dx+USER.y;
    rx = Math.round((rx - W.sx)*w);
    ry = Math.round(HEIGHT-(ry - W.sy)*h);
    //
    //console.log(rx,ry);
    //
    let vx = 1;
    let vy = 0;
    ctx.fillStyle = 'blue';
    let dx = 20;
    ctx.beginPath();
    ctx.moveTo(rx+dx,ry);
    ctx.lineTo(rx-dx,ry-dx);
    ctx.lineTo(rx-dx,ry+dx);
    ctx.fill();
    //
    if (EDITOR.id>=0){
        let b = map_by_id.get(EDITOR.id);
        let cx = b[8];
        let cy = b[9];
        let x = b[1];
        let y = b[2];
        let rx2 = cx*map_dx+x;
        let ry2 = cy*map_dx+y;
        rx2 = Math.round((rx2 - W.sx)*w);
        ry2 = Math.round(HEIGHT-(ry2 - W.sy)*h);
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(rx,ry);
        ctx.lineTo(rx2,ry2);
        ctx.stroke();
    }
    //
}

function update_sel(){
    let w = WIDTH/(W.ex-W.sx);
    let h = HEIGHT/(W.ey-W.sy);
    let rx = Math.round((sel_rx - W.sx)*w);
    let ry = Math.round(HEIGHT-(sel_ry - W.sy)*h);
    if (rx<0 || rx>WIDTH || ry<0 || ry>HEIGHT){
        sel_div.style.display='none';
    }else{
        sel_div.style.display='block';
        sel_div.style.left = (rx-8)+'px';
        sel_div.style.top = (ry-8)+'px';
    }
}

function draw_window(){
    let sx = Math.floor(W.sx/map_dx);
    let sy = Math.floor(W.sy/map_dx);
    let ex = Math.floor(W.ex/map_dx)+1;
    let ey = Math.floor(W.ey/map_dx)+1;
    if (ex>=100){ex=100;}
    if (ey>=100){ey=100;}
    //
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fill();
    //
    let w = WIDTH/(W.ex-W.sx);
    let h = HEIGHT/(W.ey-W.sy);
    //
    let rx,ry;
    if (W.step<2000000){
        ctx.font = "8px monospace";
        ctx.fillStyle = "#005500";
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#001100';
        for (let cy=sy;cy<=ey;cy++){
            for (let cx=sx;cx<=ex;cx++){
                rx = cx*map_dx;
                ry = cy*map_dx;
                rx = Math.round((rx - W.sx)*w);
                ry = Math.round(HEIGHT-(ry - W.sy)*h);
                ctx.beginPath();
                ctx.moveTo(rx,0);
                ctx.lineTo(rx,HEIGHT);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0,ry);
                ctx.lineTo(WIDTH,ry);
                ctx.stroke();
                //
                if (W.step<800000){
                    ctx.beginPath();
                    ctx.fillText(cx+','+cy,rx+4,ry-7);
                }
            }
        }
    }
    for (let cy=sy;cy<ey;cy++){
        for (let cx=sx;cx<ex;cx++){
            let p = cy*map_cx+cx;
            let a = map[p];
            
            for (let i=0;i<a.length;i++){
                let b = map_by_id.get(a[i]);
                let x = b[1];
                let y = b[2];
                let t = b[3];
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
                rx = cx*map_dx+x;
                ry = cy*map_dx+y;
                rx = Math.round((rx - W.sx)*w);
                ry = Math.round(HEIGHT-(ry - W.sy)*h);
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
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
    }
    //
    draw_user();
    //
    update_sel();    
}

function select_planet(mx,my){
    let sx = Math.floor(W.sx/map_dx);
    let sy = Math.floor(W.sy/map_dx);
    let ex = Math.floor(W.ex/map_dx)+1;
    let ey = Math.floor(W.ey/map_dx)+1;
    if (ex>=100){ex=100;}
    if (ey>=100){ey=100;}
    //
    let w = WIDTH/(W.ex-W.sx);
    let h = HEIGHT/(W.ey-W.sy);
    //
    let xx = Math.trunc(W.sx + (W.ex-W.sx)*(mx/WIDTH));
    let yy = Math.trunc(W.sy + (W.ey-W.sy)*(1.0 - my/HEIGHT));
    let dd = 10000;
    let id = -1;
    let rx = 0;
    let ry = 0;
    for (let cy=sy;cy<ey;cy++){
        for (let cx=sx;cx<ex;cx++){
            let p = cy*map_cx+cx;
            let a = map[p];
            
            for (let i=0;i<a.length;i++){
                let b = map_by_id.get(a[i]);
                let x = b[1];
                let y = b[2];
                let t = b[3];
                let radius = 5000*w;
                switch (t){
                  case 83:  radius = 5000*w; 
                            break;
                  case 84:  radius = 5000*w; 
                            break;
                  case 85:  radius = 5000*w; 
                            break;
                  case 86:  radius = 5000*w; 
                            break;
                  case 87:  radius = 5000*w; 
                            break;
                  default:  continue;
                            break;
                }
                let _rx = cx*map_dx+x;
                let _ry = cy*map_dx+y;
                let dx = _rx-xx;
                let dy = _ry-yy;
                let d = Math.sqrt(dx*dx+dy*dy);
                //console.log(d);
                if (d<dd){
                    dd = d;
                    id = b[0];
                    rx = _rx;
                    ry = _ry;
                }
                //
            }
        }
    }
    let s = ':';
    if (id!==-1){
        s = 'id:'+id;
        sel_id = id;
        sel_rx = rx;
        sel_ry = ry;
        update_sel();
    }
    planet_info_div.innerText = s;
    return id;
}
//------------------------------------------------------------
function user_select_planet(id,cx,cy,x,y){
    EDITOR.id = id;
    EDITOR.cx = cx;
    EDITOR.cy = cy;
    EDITOR.x  = x;
    EDITOR.y  = y;    
    EDITOR.prop_id.innerText = id;
    EDITOR.prop_name.value  = 'загрузка...';
    EDITOR.prop_desc.value  = ''; 
    EDITOR.prop_race.value  = 0; 
    EDITOR.prop_owner.value = 0; 
    EDITOR.prop_type.value  = 0; 
    for(let i=0;i<EDITOR.prop_perc.length;i++){
        EDITOR.prop_perc[i].value=100;
    }
    //
    fetch('/map?t=1&id='+id).then(function(response) {
        return response.json();
    }).then(function(s) {
        if (s.name===undefined){
            EDITOR.prop_name.value  = '';
        }else{
            EDITOR.prop_name.value  = s.name;
            EDITOR.prop_desc.value  = s.desc; 
            EDITOR.prop_race.value  = s.race; 
            EDITOR.prop_owner.value = s.owner; 
            EDITOR.prop_type.value  = s.type; 
            for(let i=0;i<s.perc.length;i++){
                EDITOR.prop_perc[i].value=s.perc[i];
            }
            EDITOR.station_ships.innerHTML = '';
            if (s.ships!==undefined){
                for (let i=0;i<s.ships.length;i=i+2){
                    station_add_el(s.ships[i+0],s.ships[i+1],0);
                }
            }
            EDITOR.station_gens.innerHTML = '';
            if (s.gens!==undefined){
                for (let i=0;i<s.gens.length;i=i+2){
                    station_add_el(s.gens[i+0],s.gens[i+1],1);
                }
            }
            EDITOR.station_dvigs.innerHTML = '';
            if (s.dvigs!==undefined){
                for (let i=0;i<s.dvigs.length;i=i+2){
                    station_add_el(s.dvigs[i+0],s.dvigs[i+1],2);
                }
            }
            EDITOR.station_guns.innerHTML = '';
            if (s.guns!==undefined){
                for (let i=0;i<s.guns.length;i=i+2){
                    station_add_el(s.guns[i+0],s.guns[i+1],3);
                }
            }
            EDITOR.station_devices.innerHTML = '';
            if (s.devices!==undefined){
                for (let i=0;i<s.devices.length;i=i+2){
                    station_add_el(s.devices[i+0],s.devices[i+1],4);
                }
            }
        }
    });         
                                //  0 1 2  3    4      5      6    7  8  9
    let a = map_by_id.get(id); //[_id,x,y,type,angle,status,scale,hp,cx,cy]
    //
    EDITOR.prop2_x.value      = a[8]*map_dx + a[1];
    EDITOR.prop2_y.value      = a[9]*map_dx + a[2];
    EDITOR.prop2_type.value   = a[3];
    EDITOR.prop2_angle.value  = a[4];
    EDITOR.prop2_status.value = a[5];
    EDITOR.prop2_scale.value  = a[6];
    draw_window();
}

function change_prop(){
    if (EDITOR.id>=0){
        let perc = [];
        for (let i=0;i<EDITOR.prop_perc.length;i++){
            perc.push(EDITOR.prop_perc[i].value);
        }
        let ships = [];
        for (let i=0;i<EDITOR.station_ships.children.length;i++){
            let d    = EDITOR.station_ships.children[i];
            let id   = parseInt(d.dataset.id);
            let perc = parseInt(d.children[1].children[0].value);
            ships.push(id);
            ships.push(perc);
        }
        let gens = [];
        for (let i=0;i<EDITOR.station_gens.children.length;i++){
            let d    = EDITOR.station_gens.children[i];
            let id   = parseInt(d.dataset.id);
            let perc = parseInt(d.children[1].children[0].value);
            gens.push(id);
            gens.push(perc);
        }
        let dvigs = [];
        for (let i=0;i<EDITOR.station_dvigs.children.length;i++){
            let d    = EDITOR.station_dvigs.children[i];
            let id   = parseInt(d.dataset.id);
            let perc = parseInt(d.children[1].children[0].value);
            dvigs.push(id);
            dvigs.push(perc);
        }
        let guns = [];
        for (let i=0;i<EDITOR.station_guns.children.length;i++){
            let d    = EDITOR.station_guns.children[i];
            let id   = parseInt(d.dataset.id);
            let perc = parseInt(d.children[1].children[0].value);
            guns.push(id);
            guns.push(perc);
        }
        let devices = [];
        for (let i=0;i<EDITOR.station_devices.children.length;i++){
            let d    = EDITOR.station_devices.children[i];
            let id   = parseInt(d.dataset.id);
            let perc = parseInt(d.children[1].children[0].value);
            devices.push(id);
            devices.push(perc);
        }
        
        let a = {
            name    : EDITOR.prop_name.value,
            desc    : EDITOR.prop_desc.value,
            race    : parseInt(EDITOR.prop_race.value), 
            owner   : parseInt(EDITOR.prop_owner.value), 
            type    : parseInt(EDITOR.prop_type.value),
            perc    : perc,
            ships   : ships,
            gens    : gens,
            dvigs   : dvigs,
            guns    : guns,
            devices : devices,
        }
        //
        fetch('/map', {
            method: 'post',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify({
                t       : 1,
                id      : EDITOR.id,
                data    : a
            })
        }).then( (response) => { 
            //do something awesome that makes the world a better place
        });
        //
    }
}
function change_prop2(){
    if (EDITOR.id>=0){
        let x = parseInt(EDITOR.prop2_x.value);
        let y = parseInt(EDITOR.prop2_y.value);
        let cx = Math.trunc(x/map_dx);
        let cy = Math.trunc(y/map_dx);
        x = x - cx*map_dx;
        y = y - cy*map_dx;
        
        let type   = parseInt(EDITOR.prop2_type.value);
        let angle  = parseInt(EDITOR.prop2_angle.value);
        let status = parseInt(EDITOR.prop2_status.value);
        let scale  = parseInt(EDITOR.prop2_scale.value);
        let a = {
            t      : 2,
            id     : EDITOR.id,
            cx     : cx,
            cy     : cy,
            x      : x, 
            y      : y, 
            type   : type,
            angle  : angle,
            status : status,
            scale  : scale,
        }
        //
        fetch('/map', {
            method: 'post',
            headers: {
                'Accept'        : 'application/json',
                'Content-Type'  : 'application/json'
            },
            body: JSON.stringify(a)
        }).then( (response) => { 
        });
        //
                                          //  0  1 2  3    4      5      6    7  8  9
        let b = map_by_id.get(EDITOR.id); //[_id,x,y,type,angle,status,scale,hp,cx,cy]
        let _cx = b[8];
        let _cy = b[9];
        let p = _cy*map_cx+_cx;
        let m = map[p];
        for (let i=0;i<m.length;i++){
            if (m[i]===EDITOR.id){  
                m.splice(i,1);
                break;
            }
        }
        p = cy*map_cx+cx;
        m = map[p];
        m.push(EDITOR.id);
        
        b[1] = x;
        b[2] = y;
        b[3] = type;
        b[4] = angle;
        b[5] = status;
        b[6] = scale;
        //a[7] = 
        b[8] = cx;
        b[9] = cy;
        //
        draw_window(); 
    }
}
//

function station_add_el(_id,_perc,r){
    let a = null;
    let b = null;
    let c = null;
    switch (r){
        case 0: a = EDITOR.station_ships;
                b = EDITOR.station_ships_sel;
                c = INFO_UNITS;
                break;
        case 1: a = EDITOR.station_gens;
                b = EDITOR.station_gens_sel;
                c = INFO_GENS;
                break;
        case 2: a = EDITOR.station_dvigs;
                b = EDITOR.station_dvigs_sel;
                c = INFO_DVIGS;
                break;
        case 3: a = EDITOR.station_guns;
                b = EDITOR.station_guns_sel;
                c = INFO_GUNS;
                break;
        case 4: a = EDITOR.station_devices;
                b = EDITOR.station_devices_sel;
                c = INFO_DEVICES;
                break;
    }
    //
    let id   = 0;
    let perc = 100;
    if (_id===null){
        id = b.value;
    }else{
        id   = _id;
        perc = _perc;
    }
    id = parseInt(id);
    let ship = c[id];
    for (let i=0;i<a.children.length;i++){
        let d = a.children[i];
        let id2 = parseInt(d.dataset.id);
        if (id2===id){
            return;
        }
    }
    //
    let d = document.createElement('tr');
    d.dataset.id = id;
    d.innerHTML = '<td>'+ship.name+':</td><td><input type="number" style="width:50px;" value="'+perc+'">%</td><td><button onclick="station_remove_el('+id+','+r+');">del</button></td>';
    a.appendChild(d);
}

function station_remove_el(del_id,r){
    let a = null;
    switch (r){
        case 0: a = EDITOR.station_ships;
                break;
        case 1: a = EDITOR.station_gens;
                break;
        case 2: a = EDITOR.station_dvigs;
                break;
        case 3: a = EDITOR.station_guns;
                break;
        case 4: a = EDITOR.station_devices;
                break;
    }
    for (let i=0;i<a.children.length;i++){
        let d = a.children[i];
        let id = parseInt(d.dataset.id);
        if (id === del_id){
            a.removeChild(d);
        }
    }
}
//

function prepare_controls(){
    holst.addEventListener( 'mousedown', function(event){
        let id = select_planet(event.offsetX,event.offsetY);
        if (id!==-1){
            user_select_planet(id);
        }else{
            CONTROLS.state = 1;
        }
        event.preventDefault();
    }, false );
    holst.addEventListener( 'mouseup', function(event){
        CONTROLS.state = 0;
        event.preventDefault();
    }, false );
    holst.addEventListener( 'mousemove', function(event){
        //console.log(event)
        if (CONTROLS.state===0){
            if (W.step<1700000){
               select_planet(event.offsetX,event.offsetY);
            }
        }
        if (CONTROLS.state===1){
            let x = event.movementX;
            let y = event.movementY;
            W.sx = W.sx - x*W.s_step; 
            W.sy = W.sy + y*W.s_step;
            if (W.sx<0){W.sx = 0;} 
            if (W.sx>map_maxx){W.sx = map_maxx;} 
            if (W.sy<0){W.sy = 0;} 
            if (W.sy>map_maxy){W.sy = map_maxy;}
            W.ex = W.sx + W.step; 
            W.ey = W.sy + W.step; 
            draw_window();
        }
        event.preventDefault();
    }, false );
}

function zoom(delta){
    W.step = W.step + delta;
    if (W.step<177680){
        W.step = 177680;
        return;
    }
    if (W.step>6777680){
        W.step = 6777680;
        return;
    }
    W.s_step = Math.trunc(W.s_step + delta/650);
    W.sx =  Math.trunc(W.sx - delta/2);
    W.sy =  Math.trunc(W.sy - delta/2);
    if (W.sx<0){W.sx = 0;} 
    if (W.sx>map_maxx){W.sx = map_maxx;} 
    if (W.sy<0){W.sy = 0;} 
    if (W.sy>map_maxy){W.sy = map_maxy;}
    W.ex = W.sx + W.step;
    W.ey = W.sy + W.step;
    draw_window();
}

function camera_look_at(rx,ry){
    let d = W.step/2;
    W.sx = rx - d;
    W.sy = ry - d;
    zoom(0);
}

function prepare(){
    holst   = document.getElementById('holst');
    ctx = holst.getContext('2d');
    planet_info_div = document.getElementById('planet_info');
    sel_div = document.getElementById('sel');
    sel_div.onclick=function(){
        user_select_planet(sel_id);
    }
    EDITOR.id           = -1;
    EDITOR.prop_id      = document.getElementById('prop_id');
    EDITOR.prop_name    = document.getElementById('prop_name');
    EDITOR.prop_desc    = document.getElementById('prop_desc');
    EDITOR.prop_race    = document.getElementById('prop_race');
    EDITOR.prop_owner   = document.getElementById('prop_owner');
    EDITOR.prop_type    = document.getElementById('prop_type');
    EDITOR.prop2_x      = document.getElementById('prop2_x');
    EDITOR.prop2_y      = document.getElementById('prop2_y');
    EDITOR.prop2_type   = document.getElementById('prop2_type');
    EDITOR.prop2_scale  = document.getElementById('prop2_scale');
    EDITOR.prop2_angle  = document.getElementById('prop2_angle');
    EDITOR.prop2_status = document.getElementById('prop2_status');
    //-- раса
    let s = '';
    for (let i=0;i<PLANET_RACE_INFO.length;i++){
        let a = PLANET_RACE_INFO[i];
        s = s + '<option value="'+a.id+'">'+a.name+'</option>';
    }
    EDITOR.prop_race.innerHTML = s;
    //--- альянс
    s = '';
    for (let i=0;i<ALIANS_INFO.length;i++){
        let a = ALIANS_INFO[i];
        s = s + '<option value="'+a.id+'">'+a.name+'</option>';
    }
    EDITOR.prop_owner.innerHTML = s;
    //--- промышленность
    s = '';
    for (let i=0;i<PLANET_TYPE_INFO.length;i++){
        let a = PLANET_TYPE_INFO[i];
        s = s + '<option value="'+a.id+'">'+a.name+'</option>';
    }
    EDITOR.prop_type.innerHTML = s;
    //--- товары - процент
    let table = document.getElementById('conf_table');
    for (let i=0;i<ITEMS_INFO.length;i++){
        let a = ITEMS_INFO[i];
        let tr = document.createElement('tr');
        tr.innerHTML='<td>'+a.name+'</td><td><input type="number" value="100"></td>';
        table.appendChild(tr);
        EDITOR.prop_perc.push(tr.children[1].children[0]);
    }
    //--- корабли
    s = '';
    for (let i=0;i<INFO_UNITS.length;i++){
        let a = INFO_UNITS[i];
        s = s + '<option value="'+i+'">'+a.name+'</option>';
    }
    EDITOR.station_ships_sel.innerHTML=s;
    EDITOR.station_ships_sel.value = 1;
    //--- магазин генераторов
    s = '';
    for (let i=0;i<INFO_GENS.length;i++){
        let a = INFO_GENS[i];
        s = s + '<option value="'+i+'">'+a.name+'</option>';
    }
    EDITOR.station_gens_sel.innerHTML=s;
    EDITOR.station_gens_sel.value = 1;
    //--- магазин двигателей
    s = '';
    for (let i=0;i<INFO_DVIGS.length;i++){
        let a = INFO_DVIGS[i];
        s = s + '<option value="'+i+'">'+a.name+'</option>';
    }
    EDITOR.station_dvigs_sel.innerHTML=s;
    EDITOR.station_dvigs_sel.value = 1;
    //--- магазин оружия
    s = '';
    for (let i=0;i<INFO_GUNS.length;i++){
        let a = INFO_GUNS[i];
        s = s + '<option value="'+i+'">'+a.name+'</option>';
    }
    EDITOR.station_guns_sel.innerHTML=s;
    EDITOR.station_guns_sel.value = 1;
    //--- магазин устройств
    s = '';
    for (let i=0;i<INFO_DEVICES.length;i++){
        let a = INFO_DEVICES[i];
        s = s + '<option value="'+i+'">'+a.name+'</option>';
    }
    EDITOR.station_devices_sel.innerHTML=s;
    EDITOR.station_devices_sel.value = 1;
    //--------------------------------
    prepare_controls();
    //generate_map();
    //
    let rx = USER.cx*map_dx+USER.x;
    let ry = USER.cy*map_dx+USER.y;
    camera_look_at(rx,ry);
}
function load(){
    //
    let rr = Math.trunc(Math.random()*999999999);
    fetch('/map?t=0&rr='+rr).then(function(response) {
        return response.arrayBuffer();
    }).then(function(buff) {
        map = [];
        for (let y=0;y<map_cy;y++){
            for (let x=0;x<map_cx;x++){
                let a = [];
                map.push(a);
            }
        }

        let dv = new DataView(buff);
        let p = 0;
        for (let i=0;i<1000000;i++){
            let _id    = dv.getUint32(p+0);
            let cx     = dv.getUint8( p+4);
            let cy     = dv.getUint8( p+5);
            let x      = dv.getUint16(p+6);
            let y      = dv.getUint16(p+8);
            let type   = dv.getUint16(p+10);
            let angle  = dv.getUint16(p+12);
            let status = dv.getUint16(p+14);
            let scale  = dv.getUint16(p+16);
            let hp     = dv.getUint16(p+18);
            if (_id!==0){
                if (_id>id){ id=_id+1; }
                let _a = [_id,x,y,type,angle,status,scale,hp,cx,cy];
                let pp = cy*map_cx+cx;
                let a = map[pp];
                a.push(_id);
                map_by_id.set(_id,_a);
            }
            p = p + db_row;
        }      
        //
        prepare();      
    });
}

load();
