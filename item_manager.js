"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let INFO         = null;
let items        = [];
let free_items   = [];
let groups       = [];
let free_groups  = [];

function prepare(_info){
    INFO        = _info;
    items.push(new_item()); // занимаем 0
    groups.push(new_group()); //занимаем 0
}

function new_group(){
    let a = {
        id    : groups.length,
        first : 0,
        count : 0,
        type  : 0,                      // тип группы, 0 - инвентарь, 1-постоянное хранилище на карте, 2-временное хранилище на карте
    }
    Object.seal(a);
    return a;
}

function new_item(){
    let a = {
        id            : items.length,           // порядковый номер  
        owner         : 0,                      // группа которая владеет данным предметом
        n             : 0,                      // id предмета
        count         : 0,                      // количество
        value         : 0,                      // дополнительное значение, количество потронов, количество воздуха и т.д.
        prev          : 0,                      // предыдущий в списке группы
        next          : 0,                      // следующий в списке группы
    }
    Object.seal(a);
    return a;
}

// создает группу
function add_group(type){
    let group;
    if (free_groups.length===0){
        group = new_group();
        groups.push(group);
    }else{
        group = groups[free_groups.shift()];
    }
    group.type  = type;    // 0 - инвентарь 1 - постоянное хранилище, 2- временное
    group.count = 0;
    group.first = 0;
    return group.id;
}

// создает новый предме в группе
function add_item(group_id,n,count,value){
    let group = groups[group_id];
    let item;
    if (free_items.length===0){
        item = new_item();
        items.push(item);
    }else{
        item = items[free_items.shift()];
    }
    item.n      = n;
    item.count  = count;
    item.value  = value;
    item.owner  = group.id;
    item.prev   = 0;
    item.next   = group.first;
    if (group.first!==0){
        let next  = items[group.first];
        next.prev = item.id;
    }
    group.first = item.id;
    group.count = group.count + 1; 
    return item;    
}

// убераем предме из списка группы
function remove_from_group(item){
    if (item.prev!==0){
        items[item.prev].next = item.next; 
    }
    if (item.next!==0){
        items[item.next].prev = item.prev; 
    }
    let gr = groups[item.owner];
    if (gr.first === item.id){
        gr.first = item.next;
    }
    gr.count = gr.count-1;
    if (gr.count===0){
        free_groups.push(gr.id);
    } 
}

// добавляет предмет в группу
function add_to_group(item,group_id,after_id){
    let group = groups[group_id];
    if (after_id!==0){
        let after = items[after_id];
        if (after.next!==0){
            let next  = items[after.next];
            next.prev = item.id;    
            item.next = next.id;
        }
        item.prev  = after.id;        
        after.next = item.id;        
    }else{
        item.prev = 0;
        item.next = group.first;
        if (group.first!==0){
            items[group.first].prev = item.id;
        }
        group.first = item.id;
    }    
    item.owner  = group.id;
    group.count = group.count + 1; 
}

function free_item(item){
    remove_from_group(item);       
    item.owner = 0;
    item.count = 0;
    free_items.push(item.id); 
}

function free_group(group_id){
    let group = groups[group_id];
    let id = group.first;
    while (id!==0){
        let item = items[id];
        item.owner = 0;
        item.count = 0;
        let next = item.next;
        free_items.push(id); 
        id = next;
    }
    //
    free_groups.push(group_id);
}

function get_items(group_id){
    let group = groups[group_id];
    let id = group.first;
    let a = '';
    while (id!==0){
        let item = items[id];
        a = a + item.id+'-'+item.n+'-'+item.count+'-'+item.value+';';    
        id = item.next;
    }
    return a;
}

function get_item(item_id){ return items[item_id]; }

function get_group(group_id){ return groups[group_id]; }

function transfer(s_item,d_group_id,count,stack_id){
    // если переносим предмет полностью
    if (count===s_item.count){
        if (stack_id===0){  // если стакать не с кем
            remove_from_group(s_item);
            add_to_group(s_item,d_group_id,0);
        }else{              // стакаем
            let stack = items[stack_id];
            stack.count = stack.count + count;
            free_item(s_item);
        }
    }else{
        s_item.count = s_item.count - count;
        if (stack_id===0){  // если стакать не с кем
            add_item(d_group_id,s_item.n,count,0);
        }else{              // стакаем
            let stack = items[stack_id];
            stack.count = stack.count + count;
        }
    }
}


module.exports.prepare                 =  prepare;  
module.exports.add_group               =  add_group;  
module.exports.add_item                =  add_item;  
module.exports.get_item                =  get_item;  
module.exports.get_group               =  get_group;  
module.exports.get_items               =  get_items;  
module.exports.free_item               =  free_item;  
module.exports.free_group              =  free_group;  
module.exports.remove_from_group       =  remove_from_group;  
module.exports.add_to_group            =  add_to_group;  
module.exports.transfer                =  transfer;  
