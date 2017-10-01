"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let EDITOR = {
    active          : false,

    div             : null,
    div_tool_0      : null,
    div_tool_1      : null,
    div_tool_2      : null,
    div_list        : null,
    
    div_prop_id     : null,
    div_prop_angle  : null,
    div_prop_scale  : null,
    div_prop_x      : null,
    div_prop_y      : null,
    div_grid        : null,

    sel_tool        : 0, 
    selected_div    : null,
    selected_n      : 0,
    //
    selected_id     : -1,
    //
    grid_step       : 1024,
}

function editor_prepare(){
    EDITOR.div = document.getElementById('EDITOR');
    EDITOR.div_list = document.getElementById('EDITOR_LIST');
    EDITOR.div_tool_0 = document.getElementById('EDITOR_T_0');
    EDITOR.div_tool_1 = document.getElementById('EDITOR_T_1');
    EDITOR.div_tool_2 = document.getElementById('EDITOR_T_2');
    EDITOR.div_prop_id = document.getElementById('editor_id');
    EDITOR.div_prop_scale = document.getElementById('editor_scale');
    EDITOR.div_prop_angle = document.getElementById('editor_angle');
    EDITOR.div_prop_x = document.getElementById('editor_x');
    EDITOR.div_prop_y = document.getElementById('editor_y');
    EDITOR.div_grid   = document.getElementById('editor_grid');
    EDITOR.div_prop_id.onchange     = editor_prop_change;
    EDITOR.div_prop_scale.onchange  = editor_prop_change;
    EDITOR.div_prop_angle.onchange  = editor_prop_change;
    EDITOR.div_prop_x.onchange      = editor_prop_change;
    EDITOR.div_prop_y.onchange      = editor_prop_change;
    EDITOR.div_grid.onchange        = editor_prop_change;
    //
    editor_sel_tool(null);
    EDITOR.div_tool_0.onclick = editor_sel_tool;
    EDITOR.div_tool_1.onclick = editor_sel_tool;
    EDITOR.div_tool_2.onclick = editor_sel_tool;
    //
    EDITOR.div_prop_x.step = EDITOR.grid_step;
    EDITOR.div_prop_y.step = EDITOR.grid_step;
    editor_show_group();
}

function editor_show(){
    if (EDITOR.div.style.display==='block'){
        EDITOR.div.style.display = 'none';
        EDITOR.active = false;
        stat_show();
    }else{
        EDITOR.div.style.display = 'block';
        EDITOR.active = true;
        stat_hide();
    }
}

function editor_prop_change(){
    EDITOR.grid_step = 1;
    if (EDITOR.div_grid.checked){
        EDITOR.grid_step = 1024;
    }
    EDITOR.div_prop_x.step = EDITOR.grid_step;
    EDITOR.div_prop_y.step = EDITOR.grid_step;
    //
    if (EDITOR.sel_tool===2){
        let id = EDITOR.selected_id;
        let a  = MAP.static_by_id.get(id);
        if (a!==undefined){
            let scale = parseInt(EDITOR.div_prop_scale.value);
            let angle = parseInt(EDITOR.div_prop_angle.value);
            let rx = parseInt(EDITOR.div_prop_x.value);
            let ry = parseInt(EDITOR.div_prop_y.value);
            if (!isNaN(scale) && !isNaN(angle) && !isNaN(rx) && !isNaN(ry)){
                let cx = Math.trunc(rx/WORD);
                let cy = Math.trunc(ry/WORD);
                let x = rx - cx*WORD;
                let y = ry - cy*WORD;
                angle = Math.trunc((angle/360)*WORD);
                send_json( [0,MSG_EDITOR, a.type, id, cx, cy, x, y, scale, angle, a.status ]  );            
            }
        }
    }
}

function editor_delete(){
    let id = EDITOR.selected_id;
    let a = MAP.static_by_id.get(id);
    if (a!==undefined){
        send_json( [0,MSG_EDITOR, a.type, id, -1, -1, a.x, a.y, a.scale, a.angle, a.status ]  );            
    }
}
function editor_rnd_angle(){
    EDITOR.div_prop_angle.value = 0+Math.trunc(Math.random()*360);  
    editor_prop_change();
}
function editor_rot_angle(){
    let a = EDITOR.div_prop_angle.value;
    a = Math.trunc(a/90)*90;
    a = a-90;
    if (a<0){a=360+a;}
    EDITOR.div_prop_angle.value = a;  
    editor_prop_change();
}
function editor_rnd_scale(){
    EDITOR.div_prop_scale.value = 0+Math.trunc(Math.random()*65536);    
    editor_prop_change();
}

function editor_sel_tool(el){
    if (this===undefined){
        EDITOR.sel_tool = 2;
    }else{
        let n = this.id.split('_');
        EDITOR.sel_tool = parseInt(n[2]);
    }
    //
    EDITOR.div_tool_0.style.backgroundColor = '';
    EDITOR.div_tool_1.style.backgroundColor = '';
    EDITOR.div_tool_2.style.backgroundColor = '';
    if (EDITOR.sel_tool===0){
        EDITOR.div_tool_0.style.backgroundColor = 'gray';
    }
    if (EDITOR.sel_tool===1){
        EDITOR.div_tool_1.style.backgroundColor = 'gray';
    }
    if (EDITOR.sel_tool===2){
        EDITOR.div_tool_2.style.backgroundColor = 'gray';
    }
}

function editor_show_group(){
    let s = '';
    for (let i=0;i<STATIC_INFO.length;i++){
        let a = STATIC_INFO[i];
        let url = a.url;
        if (url===''){url='gen.png';}
        let x = Math.trunc(a.frame[0]*a.fw);
        let y = Math.trunc(a.frame[1]*a.fw);
        let w = Math.trunc(a.frame[2]*a.fw);
        let h = Math.trunc(a.frame[3]*a.fw);
        s = s + '<div onclick="editor_sel(this,'+i+');" class="item_sel" style="width:'+w+'px;height:'+h+'px;background:url(i/'+url+') -'+x+'px -'+y+'px;">';
        s = s + '</div>';
        
    }
    EDITOR.selected_div = null;
    EDITOR.div_list.innerHTML=s;    
}

function editor_sel(el,n){
    if (EDITOR.selected_div!==null){
        EDITOR.selected_div.style.border = '';
    }
    EDITOR.selected_div = el;
    EDITOR.selected_div.style.border = '1px solid white';
    EDITOR.selected_n = n;
}

function editor_click(){
    let d = document.elementFromPoint(CONTROLS.mouse_x,CONTROLS.mouse_y); // узнаем что за элемент под мышкой находится
    if (d===RENDER.renderer.domElement){
        RENDER.mouse.x = CONTROLS.mouse_alpha1;
        RENDER.mouse.y = CONTROLS.mouse_alpha2;
        RENDER.mouse.z = 0.0;
        RENDER.mouse.unproject(RENDER.camera_models);
        let x = RENDER.mouse.x/chunk_width;
        let y = RENDER.mouse.y/chunk_width;
        if (x<0 || y<0){ return; }
        x = Math.abs(x);
        y = Math.abs(y);
        let cx = Math.trunc(x);
        let cy = Math.trunc(y);
        x = x - cx;
        y = y - cy;
        if (cx<0){cx=0;}
        if (cy<0){cy=0;}
        if (cx>99){cx=99;}
        if (cy>99){cy=99;}
        x = Math.trunc(x*WORD);
        y = Math.trunc(y*WORD);
        //
        let step = EDITOR.grid_step;
        //
        // добавляем картинку на картку
        if (EDITOR.sel_tool===0){
            if (step!==1){
                x = Math.round(x/step)*step;
                y = Math.round(y/step)*step;
            }
            let type  = EDITOR.selected_n;
            let id    = 0;
            let angle  = Math.trunc((EDITOR.div_prop_angle.value/360)*WORD);;
            let status = 0;
            let scale  = EDITOR.div_prop_scale.value; //Math.trunc(WORD/2);
            //console.log(cx,cy,x,y);
            send_json( [0,MSG_EDITOR, type, id, cx, cy, x, y, scale, angle, status ]  );
        }
        // выбираем объект на карте
        if (EDITOR.sel_tool===2){
            let rx = (cx*WORD+x);
            let ry = (cy*WORD+y);
            let max_d = 1024/100*50;
            let n = -1;
            for (let aa of MAP.static_by_id){
                let id  = aa[0];
                let a   = aa[1];
                let rx2 = (a.cx*WORD+a.x);
                let ry2 = (a.cy*WORD+a.y);
                let dx  = rx2 - rx;
                let dy  = ry2 - ry;
                let d   = Math.sqrt(dx*dx+dy*dy);
                if (d<max_d && EDITOR.selected_id!==id){
                    //max_d = d;
                    n = a.id;
                    if (a.type===EDITOR.selected_n){
                        break;
                    }                    
                }
            }
            let a = MAP.static_by_id.get(EDITOR.selected_id);
            if (a!==undefined ){
                a.mesh._my.r = 1.0;
                a.mesh._my.g = 1.0;
                a.mesh._my.b = 1.0;
            }
            EDITOR.selected_id = n;
            if (n!==-1){
                let a = MAP.static_by_id.get(n);
                let angle = Math.trunc((a.angle/WORD)*360);
                EDITOR.div_prop_id.innerHTML = a.id;
                EDITOR.div_prop_angle.value  = angle;
                EDITOR.div_prop_scale.value  = a.scale;
                EDITOR.div_prop_x.value      = a.cx*WORD+a.x;
                EDITOR.div_prop_y.value      = a.cy*WORD+a.y;
                a.mesh._my.r = 1.0;
                a.mesh._my.g = 0.5;
                a.mesh._my.b = 0.5;
            }
        }
    }
}
