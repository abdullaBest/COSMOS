"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

function stat_show(){ $.STAT.el.style.display = 'block'; }

function stat_hide(){ $.STAT.el.style.display = 'none'; }

function stat_update(){
    let ship = USER.ships[USER.curr_ship];
    
    let e  = Math.trunc((ship.energy/ship.energy_max)*100);
    let hp = Math.trunc((ship.hp/ship.hp_max)*100);
    let shield = Math.trunc((ship.shield/ship.shield_max)*100);
    let fuel = Math.trunc((ship.fuel/ship.fuel_max)*100);

    $.STAT.energy.el.style.width = e+'%';
    $.STAT.hp.el.style.width     = hp+'%';
    $.STAT.shield.el.style.width = shield+'%';
    $.STAT.speed.el.innerHTML    = ship.speed;
    $.STAT.fuel.el.innerHTML     = fuel+'%';
    $.STAT.credits.el.innerHTML  = USER.credits;
    //GUI.div_stats_bullets.innerHTML  = USER.bullets;
    //GUI.div_stats_credits.innerHTML  = ;
    $.STAT.gun1_b.el.innerHTML = ship.guns_i[0];
    $.STAT.gun2_b.el.innerHTML = ship.guns_i[1];
    $.STAT.gun3_b.el.innerHTML = ship.guns_i[2];
    $.STAT.gun4_b.el.innerHTML = ship.guns_i[3];
    
    //GUI.div_stats_guns[0].innerHTML = USER.gun_stats[0];
    //GUI.div_stats_guns[1].innerHTML = USER.gun_stats[1];
    //GUI.div_stats_guns[2].innerHTML = USER.gun_stats[2];
    //GUI.div_stats_guns[3].innerHTML = USER.gun_stats[3];
}
function stat_gun_status(){
    const c = ['#aaaaaa','#666666','#ff3333'];
    $.STAT.gun1.el.style.backgroundColor = c[USER.gun_stats[0]];
    $.STAT.gun2.el.style.backgroundColor = c[USER.gun_stats[1]];
    $.STAT.gun3.el.style.backgroundColor = c[USER.gun_stats[2]];
    $.STAT.gun4.el.style.backgroundColor = c[USER.gun_stats[3]];
}

/*
// ====================================================================
///
function gui_show_ship_razdel(n){
    if (GUI.div_ship_menu.style.display==='none'){
        GUI.div_ship_menu.style.display = 'block';
    }
    for (let i=0;i<GUI.div_ship_r.length;i++){
        GUI.div_ship_r[i].style.display = 'none';
    }
    //
    if (USER.storage_group_id===0){
       USER.storage_items = [];
    }
    let i = USER.items.length;
    while (i--){
        let a = USER.items[i];
        if (a.id===0){
            USER.items.splice(i,1);
        }else{
            a.count = a._count;
        }
    }
    i = USER.storage_items.length;
    while (i--){
        let a = USER.storage_items[i];
        if (a.id===0){
            USER.storage_items.splice(i,1);
        }else{
            a.count = a._count;
        }
    }
    gui_refresh_user_items();
    gui_refresh_storage_items();
    //
    switch(n){
        case 0 : 
                gui_prepare_ship_data();
                break;
        case 1 : 
                if (USER.storage_static_id!==0){
                    let a = new ArrayBuffer(2+1+ 4); // n,tip, static_id
                    let d = new DataView(a);
                    // 01 2 3456
                    d.setUint32(   3, USER.storage_static_id );
                    send_bin(MSG_ITEMS,d);
                }else{
                    //TODO 
                }
                break;
        case 2:
                clearInterval(miniMap.timer);
                miniMap_update();
                miniMap.timer = setInterval(miniMap_update,1000);
                break;
    }
    //
    GUI.div_ship_r[n].style.display = 'block';    
    GUI.active = true;
}

function gui_close_ship_menu(){
    GUI.div_ship_menu.style.display = 'none';
    GUI.active = false;
    clearInterval(miniMap.timer); 
}

function gui_refresh_user_items(){
    let d = GUI.div_ship_menu_cargo_list1;
    d.innerHTML = '';
    for (let i=0;i<USER.items.length;i++){
        let id     = USER.items[i].id;
        let n      = USER.items[i].n;
        let count  = USER.items[i].count;
        let value  = USER.items[i].value;
        let _count = USER.items[i]._count;
        //
        let dd = document.createElement('div');
        if (id===0 || count!==_count){
            dd.style.color = 'green';
        }
        dd.dataset.i     = i;
        dd.dataset.owner = 0;
        dd.onclick = gui_items_transfer;
        dd.className = 'crow';
        dd.innerHTML = '<div class="crow1"></div> \
                        <div class="crow2"></div> \
                        <div class="crow3">'+ITEMS_INFO[n].name+'</div> \
                        <div class="crow4">'+count+'</div> \
                        <div class="crow5"></div> \
                        <div class="crow5"></div>';
        d.appendChild(dd);
    }
}

function gui_refresh_storage_items(){
    let d = GUI.div_ship_menu_cargo_list2;
    d.innerHTML = '';
    for (let i=0;i<USER.storage_items.length;i++){
        let id     = USER.storage_items[i].id;
        let n      = USER.storage_items[i].n;
        let count  = USER.storage_items[i].count;
        let value  = USER.storage_items[i].value;
        let _count = USER.storage_items[i]._count;
        //
        let dd = document.createElement('div');
        if (id===0 || count!==_count){
            dd.style.color = 'green';
        }
        dd.onclick = gui_items_transfer;
        dd.dataset.i     = i;
        dd.dataset.owner = 1;
        dd.className = 'crow';
        dd.innerHTML = '<div class="crow1"></div> \
                        <div class="crow2"></div> \
                        <div class="crow3">'+ITEMS_INFO[n].name+'</div> \
                        <div class="crow4">'+count+'</div> \
                        <div class="crow5"></div> \
                        <div class="crow5"></div>';
        d.appendChild(dd);
    }
}

function gui_items_transfer(event){
    let p     = parseInt(this.dataset.i);
    let owner = parseInt(this.dataset.owner);
    let list  = GUI.items_strans_list;
    if (owner===0){
        let a = USER.items[p];
        if (a.count>0){
            a.count  = a.count - 1;
            //
            let f = null;
            for (let i=0;i<USER.storage_items.length;i++){
                let b = USER.storage_items[i];
                if (a.n===b.n){ f = b; }
            }
            if (f!==null){        
                f.count = f.count+1;
            }else{
                USER.storage_items.push({
                    id      : 0,
                    n       : a.n,
                    count   : 1,
                    value   : a.value,
                    _count  : 0,
                })
            }
        }
    }else{
        let a = USER.storage_items[p];
        if (a.count>0){
            a.count  = a.count - 1;
            //
            let f = null;
            for (let i=0;i<USER.items.length;i++){
                let b = USER.items[i];
                if (a.n===b.n){ f = b; }
            }
            if (f!==null){        
                f.count = f.count + 1;
            }else{
                USER.items.push({
                    id      : 0,
                    n       : a.n,
                    count   : 1,
                    value   : a.value,
                    _count  : 0,
                })
            }
        }
    }
    //
    gui_refresh_user_items();
    gui_refresh_storage_items();
}

function gui_items_send(){
    let r = [];
    for (let i=0;i<USER.items.length;i++){
        let a = USER.items[i];
        if (a.count!==a._count){
            if (a.id!==0 && a.count<a._count){
                let id       = a.id;
                let n        = a.n;
                let count    = a._count-a.count;
                let op       = 0; // send
                let stack_id = 0;
                for (let j=0;j<USER.storage_items.length;j++){
                    let b = USER.storage_items[j];
                    if (b.n===n){
                        stack_id = b.id;
                        break;
                    }
                }
                r.push({
                    id       : id,
                    //n        : n,
                    count    : count,
                    //op       : op,
                    stack_id : stack_id,
                })
            }
        }
    }
    for (let i=0;i<USER.storage_items.length;i++){
        let a = USER.storage_items[i];
        if (a.count!==a._count){
            if (a.id!==0 && a.count<a._count){
                let id       = a.id;
                let n        = a.n;
                let count    = a._count-a.count;
                let op       = 1; // receive
                let stack_id = 0;
                for (let j=0;j<USER.items.length;j++){
                    let b = USER.items[j];
                    if (b.n===n){
                        stack_id = b.id;
                        break;
                    }
                }
                r.push({
                    id       : id,
                    //n        : n,
                    count    : count,
                    //op       : op,
                    stack_id : stack_id,
                })
            }
        }
    }
    //
    let size = 2+1 + 4 + (r.length*2*3);
    let a = new ArrayBuffer(size);
    let d = new DataView(a); //01 2 3456 - 78
    d.setUint32(3, USER.storage_static_id );    
    let p = 7;
    for (let i=0;i<r.length;i++){
        d.setUint16(p, r[i].id);    
        p = p + 2;    
        d.setUint16(p, r[i].count);    
        p = p + 2;    
        d.setUint16(p, r[i].stack_id);
        p = p + 2;    
    }
    send_bin(MSG_ITEMS,d);
    //
    console.log(r);
}

*/