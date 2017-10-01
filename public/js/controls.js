"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
let CONTROLS = {
    flags : 0,
    input_active : false,
    mouse_alpha1 : 0,
    mouse_alpha2 : 0,
    mouse_button : 0,
    wheel_delta  : 0,
}
const FLAG_UP           = 1;
const FLAG_DOWN         = 2;
const FLAG_LEFT         = 4;
const FLAG_RIGHT        = 8;
const FLAG_EDITOR       = 16;  // редактор
const FLAG_SITDOWN      = 32;  // приседание
const FLAG_INTERACTION  = 64;  // взаимодействие
const FLAG_FIRE         = 128; // выстрел

let KBD = new Uint16Array(255);
KBD[38] = FLAG_UP;    // up
KBD[87] = FLAG_UP;    // w
KBD[37] = FLAG_LEFT;  // left
KBD[65] = FLAG_LEFT;  // a
KBD[40] = FLAG_DOWN;  // down
KBD[83] = FLAG_DOWN;  // s
KBD[39] = FLAG_RIGHT; // right
KBD[68] = FLAG_RIGHT; // d
KBD[32] = FLAG_EDITOR; // space
KBD[69] = FLAG_INTERACTION; // e

KBD[17] = 0; // CTRL
KBD[89] = 0; // y
KBD[27] = 0; // esc
KBD[13] = 0; // return
KBD[192] = 0; // ~
KBD[49] = 0; // 1
KBD[50] = 0; // 2
KBD[51] = 0; // 3
KBD[52] = 0; // 4

function getRelativeCoordinates(e){
    let x = e.target.offsetLeft;
    let y = e.target.offsetTop;
    let ref = e.target.offsetParent;
    while ( ref ) {
        x += ref.offsetLeft;
        y += ref.offsetTop;
        ref = ref.offsetParent;
    }
    x = e.clientX - x;
    y = e.clientY - y;
    return {x:x,y:y};
}
function controls_prepare(){
    document.addEventListener( 'keydown', function(event){
        if (!CONTROLS.input_active){
            let flag = KBD[event.keyCode];
            CONTROLS.flags = CONTROLS.flags | flag; 
        }
    }, false );
    document.addEventListener( 'keyup', function(event){
        if (!CONTROLS.input_active){
            let flag = KBD[event.keyCode];
            CONTROLS.flags = CONTROLS.flags & (~flag);
        } 
    }, false );
    document.addEventListener( 'keypress', function(event){
        //console.log(event);
        if (!CONTROLS.input_active){
           /* if (event.code==='KeyT'){
            }
            if (event.code==='KeyQ'){
            }
            if (event.code==='KeyR'){
            }
            */
            if (event.code==='Backquote'){
                editor_show();
            }
            if (event.code==='KeyM'){
                gui_show_ship_switch(2);
            }
            if (event.code==='KeyE'){
                gui_interaction();
            }
            if (event.keyCode===49){ //'1'
                user_switch_gun(0);
            }
            if (event.keyCode===50){ //'2'
                user_switch_gun(1);
            }
            if (event.keyCode===51){ //'3'
                user_switch_gun(2);
            }
            if (event.keyCode===52){ //'4'
                user_switch_gun(3);
            }
        }
    }, false );
    document.addEventListener( 'mousedown', function(event){
        if (event.button===0){  // левая кнопка мышки
            USER.fire  = true;
            USER._fire = true;
            //event.preventDefault();
        }

/*    CONTROLS.mouse_button = event.button;
    //console.log(event);
    if (event.button===2){  // правая кнопка мышки
        if (event.target.nodeName==='CANVAS'){
            USER._angle = USER.angle;
            USER.alt_action  = true;
            USER._alt_action  = true;
        }
    }    
    if (event.button===0){  // левая кнопка мышки
        if (event.target.nodeName==='CANVAS'){
            USER.fire  = true;
            USER._fire = true;
            //CONTROLS.flags = CONTROLS.flags | FLAG_FIRE; 
            event.preventDefault();
        }else{
            let action = event.target.getAttribute('action');
            if (action==='select_tile'){
                let p  = getRelativeCoordinates(event);
                let tx = Math.trunc(p.x/32);
                let ty = 15-Math.trunc(p.y/32);
                let n  = ty*16+tx;
                user_set_b1(n+2);
                //GUI.div_select_tiles.style.display = 'none';
            }
        }
    }
*/
    }, true );
    document.addEventListener( 'mouseup', function(event){
        if (event.button===0){
            //if (USER.fire){
                USER.fire = false;
            //}
        }
    //console.log(event);
    /*if (RENDER.selector.active){
        unit_select();        

        RENDER.div_selector.style.display = 'none';
        RENDER.selector.active = false;
    }
    if (event.button===2){
        units_send_command();
    }
    */
  /*  if (event.button===0){
        if (USER.fire){
            USER.fire = false;
        }
    }
    if (event.button===2){
        if (USER.alt_action){
            USER.alt_action = false;
        }
    }
    event.preventDefault();
*/
    }, false );
    document.addEventListener( 'mousewheel', function(event){
        if (event.target.nodeName==='CANVAS'){
            CONTROLS.wheel_delta = event.deltaY;
            event.preventDefault();
        }
    }, false );
    document.addEventListener( 'click', function(event){
        if (event.target.nodeName==='CANVAS'){
            if (EDITOR.active) { editor_click(); }    
        }
    }, false );
    document.addEventListener( 'contextmenu', function(event){
        event.preventDefault();
    }); 
    document.addEventListener( 'pointerlockchange', function(){
    }, false );
    document.addEventListener( 'mousemove', function( event ) {
        let x  = event.clientX/RENDER.WIDTH;
        let y  = event.clientY/RENDER.HEIGHT;
        CONTROLS.mouse_x = event.clientX;
        CONTROLS.mouse_y = event.clientY;
        CONTROLS.mouse_alpha1 = (x*2-1);
        CONTROLS.mouse_alpha2 = -(y*2-1);
    }, false );
}
