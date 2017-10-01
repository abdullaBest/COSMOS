"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

const BOX_TYPE_STATIC  = 0; // статичный блок
const BOX_TYPE_DYNAMIC = 1; // подвижный блок
const BOX_TYPE_STATIC_COLLIDER = 3; // бокc коллайдер, не видимый
const BOX_TYPE_STATIC_SYS = 4; // бокc коллайдер, двигает объекты вместе с системой
class TheBox2D {
    constructor(){
        this.list_x_p = null;
        this.list_x_n = null;
        this.list_y_p = null;
        this.list_y_n = null;
        this.dx = 0;
        this.dy = 0;
        this.r_dlinna = 1.0;
    }
    _new_obj(id,x,y,max_x,max_y,tip,mask){
        let a = {
            id          : id,
            tip         : tip,
            mask        : mask,
            hdx         : max_x,                 //
            hdy         : max_y,
            xp          : x + max_x,  // 
            xn          : x - max_x,
            yp          : y + max_y,
            yn          : y - max_y,
            xp_next     : null,                   // 
            xp_prev     : null,                   // 
            xn_next     : null,
            xn_prev     : null,
            yp_next     : null,
            yp_prev     : null,
            yn_next     : null,
            yn_prev     : null,
            vv          : {x:0,y:0}, //
        }
        return a;
    }
    // вставляет AABB в списки
    _insert_box(a){
        let b = this.list_x_p;
        if (b==null){ 
            this.list_x_p = a; 
        }else{
            do{
                if (a.xp<b.xp){ 
                    let prev = b.xp_prev;
                    if (prev!==null){ prev.xp_next = a; }else{ this.list_x_p = a; }
                    a.xp_next = b;
                    a.xp_prev = prev;
                    b.xp_prev = a;
                    break; 
                }
                if (b.xp_next==null){ b.xp_next = a; a.xp_prev = b; break; }
                b = b.xp_next;
            } while(true);
        }
        //----
        b = this.list_x_n;
        if (b==null){ 
            this.list_x_n = a; 
        }else{
            do{
                if (a.xn<b.xn){ 
                    let prev = b.xn_prev;
                    if (prev!=null){ prev.xn_next = a; }else{ this.list_x_n = a; }
                    a.xn_next = b;
                    a.xn_prev = prev;
                    b.xn_prev = a;
                    break; 
                }
                if (b.xn_next==null){ b.xn_next = a; a.xn_prev = b; break; }
                b = b.xn_next;
            } while(true);
        }
        //----
        b = this.list_y_p;
        if (b==null){ 
            this.list_y_p = a; 
        }else{
            do{
                if (a.yp<b.yp){ 
                    let prev = b.yp_prev;
                    if (prev!=null){ prev.yp_next = a; }else{ this.list_y_p = a; }
                    a.yp_next = b;
                    a.yp_prev = prev;
                    b.yp_prev = a;
                    break; 
                }
                if (b.yp_next==null){ b.yp_next = a; a.yp_prev = b; break; }
                b = b.yp_next;
            } while(true);
        }
        //----
        b = this.list_y_n;
        if (b==null){ 
            this.list_y_n = a; 
        }else{
            do{
                if (a.yn<b.yn){ 
                    let prev = b.yn_prev;
                    if (prev!=null){ prev.yn_next = a; }else{ this.list_y_n = a; }
                    a.yn_next = b;
                    a.yn_prev = prev;
                    b.yn_prev = a;
                    break; 
                }
                if (b.yn_next==null){ b.yn_next = a; a.yn_prev = b; break; }
                b = b.yn_next;
            } while(true);
        }
    }
    // добавляем на карту новый блок
    add(id,x,y,max_x,max_y,tip,mask){
        let a = this._new_obj(id,x,y,max_x,max_y,tip,mask);
        this._insert_box(a);
        return a;
    }
    // двигаем объект
    _move(obj){
        //debugger;
        const EPSILON = 1;
        let dx = obj.vv.x;
        let dy = obj.vv.y;
        let ox = null;
        let oy = null;
        let max_dx = dx;
        let max_dy = dy;
        let mask = obj.mask;
        if (dx>0){
            let x = obj.xp;
            let b = obj.xn_next;
            while(b!=null){
                if ( (x < b.xn) && (b.tip & mask) ){
                    let d = b.xn - x - EPSILON; // находится дальше чем нам надо
                    if (d>dx){ break; }
                    let dd = d/dx;
                    let ddy = dy*dd;
                    let max_y = obj.yp + ddy + EPSILON;
                    let min_y = obj.yn + ddy - EPSILON;
                    if (max_y>b.yn && min_y<b.yp){  
                        max_dx = d;
                        break;   
                    }
                }
                b = b.xn_next;
            }
        }    
        if (dx<0){
            let x = obj.xn;
            let b = obj.xp_prev;
            while(b!=null){
                if ( (x > b.xp) && (b.tip & mask) ){
                    let d = x - b.xp - EPSILON;
                    if (d>Math.abs(dx)){ break; } // находится дальше чем нам надо
                    let dd = Math.abs(d/dx);
                    let ddy = dy*dd;
                    let max_y = obj.yp + ddy + EPSILON;
                    let min_y = obj.yn + ddy - EPSILON;
                    if (max_y>b.yn && min_y<b.yp){  
                        max_dx = -d;
                        break;   
                    }
                }
                b=b.xp_prev;
            }
        }    
        if (dy>0){
            let y = obj.yp;
            let b = obj.yn_next;
            while(b!=null){
                if ( (y < b.yn) && (b.tip & mask) ){
                    let d = b.yn - y - EPSILON; // находится дальше чем нам надо
                    if (d>dy){ break; }
                    let dd = d/dy;
                    let ddx = dx*dd;
                    let max_x = obj.xp + ddx + EPSILON;
                    let min_x = obj.xn + ddx - EPSILON;
                    if (max_x>b.xn && min_x<b.xp){  
                        //нашли пересечение
                        max_dy = d;
                        break;   
                    }
                }
                b=b.yn_next;
            }
        }    
        if (dy<0){
            let y = obj.yn;
            let b = obj.yp_prev;
            while(b!=null){
                if ( (y > b.yp) && (b.tip & mask) ){
                    let d = y - b.yp - EPSILON;
                    if (d>Math.abs(dy)){ break; } // находится дальше чем нам надо
                    let dd = Math.abs(d/dy);
                    let ddx = dx*dd;
                    let max_x = obj.xp + ddx*dd + EPSILON;
                    let min_x = obj.xn + ddx*dd - EPSILON;
                    if (max_x>b.xn && min_x<b.xp){
                        max_dy = -d;  
                        break;   
                    }
                }
                b=b.yp_prev;
            }
        }    
        this.dx = max_dx;
        this.dy = max_dy;
    }
    //убераем объект из бокса
    _remove(obj){
        let prev = obj.xp_prev;
        let next = obj.xp_next;
        if (prev!==null){ prev.xp_next = next; }else{ this.list_x_p = next; }
        if (next!==null){ next.xp_prev = prev; }
        prev = obj.xn_prev;
        next = obj.xn_next;
        if (prev!==null){ prev.xn_next = next; }else{ this.list_x_n = next; }
        if (next!==null){ next.xn_prev = prev; }
        //
        prev = obj.yp_prev;
        next = obj.yp_next;
        if (prev!==null){ prev.yp_next = next; }else{ this.list_y_p = next; }
        if (next!==null){ next.yp_prev = prev; }
        prev = obj.yn_prev;
        next = obj.yn_next;
        if (prev!==null){ prev.yn_next = next; }else{ this.list_y_n = next; }
        if (next!==null){ next.yn_prev = prev; }
    }
    remove(obj){
        this._remove(obj);
        obj.xp_next = null;
        obj.xp_prev = null;
        obj.xn_next = null;
        obj.xn_prev = null;
        obj.yp_next = null;
        obj.yp_prev = null;
        obj.yn_next = null;
        obj.yn_prev = null;
    }
    //
    _realocate_x(obj,xp,xn){
        if (xp>=obj.xp){
            let b = obj.xp_next;
            if (b===null){
                let prev = obj.xp_prev;
                if (prev!==null){ prev.xp_next = obj; }else{ this.list_x_p = obj; }
            }else{
                do{
                    if (b.xp>xp){
                        let prev = b.xp_prev;
                        if (prev!==null){ prev.xp_next = obj; }else{ this.list_x_p = obj; }
                        obj.xp_prev = prev;
                        obj.xp_next = b;
                        b.xp_prev   = obj;
                        break;
                    }
                    if (b.xp_next===null){
                        b.xp_next   = obj;
                        obj.xp_next = null;
                        obj.xp_prev = b;
                        break;
                    }else{
                        b = b.xp_next;
                    }
                }while (true)
            }
        }
        if (xp<obj.xp){
            let b = obj.xp_prev;
            if (b===null){
                let next = obj.xp_next;
                if (next!==null){ next.xp_prev = obj; }
                this.list_x_p = obj;
            }else{
                do{
                    if (b.xp<xp){
                        let next = b.xp_next;
                        if (next!==null){ next.xp_prev = obj; }
                        obj.xp_prev = b;
                        obj.xp_next = next;
                        b.xp_next   = obj;
                        break;
                    }
                    if (b.xp_prev==null){
                        this.list_x_p = obj;
                        b.xp_prev     = obj;
                        obj.xp_prev   = null;
                        obj.xp_next   = b;
                        break;
                    }else{
                        b = b.xp_prev;
                    }
                }while (true)
            }
        }
        //--------------------------------
        if (xn>=obj.xn){
            let b = obj.xn_next;
            if (b===null){
                let prev = obj.xn_prev;
                if (prev!==null){ prev.xn_next = obj; }else{ this.list_x_n = obj; }
            }else{
                do{
                    if (b.xn>xn){
                        let prev = b.xn_prev;
                        if (prev!==null){ prev.xn_next = obj; }else{ this.list_x_n = obj; }
                        obj.xn_prev = prev;
                        obj.xn_next = b;
                        b.xn_prev   = obj;
                        break;
                    }
                    if (b.xn_next===null){
                        b.xn_next   = obj;
                        obj.xn_next = null;
                        obj.xn_prev = b;
                        break;
                    }else{
                        b = b.xn_next;
                    }
                }while (true)
            }
        }
        if (xn<obj.xn){
            let b = obj.xn_prev;
            if (b===null){
                let next = obj.xn_next;
                if (next!==null){ next.xn_prev = obj; }
                this.list_x_n = obj;
            }else{
                do{
                    if (b.xn<xn){
                        let next = b.xn_next;
                        if (next!==null){ next.xn_prev = obj; }
                        obj.xn_prev = b;
                        obj.xn_next = next;
                        b.xn_next   = obj;
                        break;
                    }
                    if (b.xn_prev===null){
                        this.list_x_n = obj;
                        b.xn_prev     = obj;
                        obj.xn_prev   = null;
                        obj.xn_next   = b;
                        break;
                    }else{
                        b = b.xn_prev;
                    }
                }while (true)
            }
        }
        //--------------------------------
        obj.xp = xp;
        obj.xn = xn;
    }
    //
    _realocate_y(obj,yp,yn){
        if (yp>=obj.yp){
            let b = obj.yp_next;
            if (b===null){
                let prev = obj.yp_prev;
                if (prev!==null){ prev.yp_next = obj; }else{ this.list_y_p = obj; }
            }else{
                do{
                    if (b.yp>yp){
                        let prev = b.yp_prev;
                        if (prev!==null){ prev.yp_next = obj; }else{ this.list_y_p = obj; }
                        obj.yp_prev = prev;
                        obj.yp_next = b;
                        b.yp_prev = obj;
                        break;
                    }
                    if (b.yp_next===null){
                        b.yp_next   = obj;
                        obj.yp_next = null;
                        obj.yp_prev = b;
                        break;
                    }else{
                        b = b.yp_next;
                    }
                }while (true)
            }
        }
        if (yp<obj.yp){
            let b = obj.yp_prev;
            if (b===null){
                let next = obj.yp_next;
                if (next!==null){ next.yp_prev = obj; }
                this.list_y_p = obj;
            }else{
                do{
                    if (b.yp<yp){
                        let next = b.yp_next;
                        if (next!==null){ next.yp_prev = obj; }
                        obj.yp_prev = b;
                        obj.yp_next = next;
                        b.yp_next   = obj;
                        break;
                    }
                    if (b.yp_prev==null){
                        this.list_y_p = obj;
                        b.yp_prev     = obj;
                        obj.yp_prev   = null;
                        obj.yp_next   = b;
                        break;
                    }else{
                        b = b.yp_prev;
                    }
                }while (true)
            }
        }
        //--------------------------------
        if (yn>=obj.yn){
            let b = obj.yn_next;
            if (b===null){
                let prev = obj.yn_prev;
                if (prev!==null){ prev.yn_next = obj; }else{ this.list_y_n = obj; }
            }else{
                do{
                    if (b.yn>yn){
                        let prev = b.yn_prev;
                        if (prev!==null){ prev.yn_next = obj; }else{ this.list_y_n = obj; }
                        obj.yn_prev = prev;
                        obj.yn_next = b;
                        b.yn_prev   = obj;
                        break;
                    }
                    if (b.yn_next===null){
                        b.yn_next   = obj;
                        obj.yn_next = null;
                        obj.yn_prev = b;
                        break;
                    }else{
                        b = b.yn_next;
                    }
                }while (true)
            }
        }
        if (yn<obj.yn){
            let b = obj.yn_prev;
            if (b===null){
                let next = obj.yn_next;
                if (next!==null){ next.yn_prev = obj; }
                this.list_y_n = obj;
            }else{
                do{
                    if (b.yn<yn){
                        let next = b.yn_next;
                        if (next!==null){ next.yn_prev = obj; }
                        obj.yn_prev = b;
                        obj.yn_next = next;
                        b.yn_next   = obj;
                        break;
                    }
                    if (b.yn_prev==null){
                        this.list_y_n = obj;
                        b.yn_prev     = obj;
                        obj.yn_prev   = null;
                        obj.yn_next   = b;
                        break;
                    }else{
                        b = b.yn_prev;
                    }
                }while (true)
            }
        }
        //--------------------------------
        obj.yp = yp;
        obj.yn = yn;
    }
    new_position(obj,x,y){
        let xp = x + obj.hdx;
        let xn = x - obj.hdx;
        let yp = y + obj.hdy;
        let yn = y - obj.hdy;
        this._remove(obj);
        this._realocate_x(obj,xp,xn);
        this._realocate_y(obj,yp,yn);
    } 
    move(obj,v){
        const EPSILON = 0.0001; 
        if (Math.abs(v.x)<EPSILON){v.x=0;}
        if (Math.abs(v.y)<EPSILON){v.y=0;}
        obj.vv.x = v.x;
        obj.vv.y = v.y;
        return this._move(obj); 
    }
    // трассирует луч по боксам, sx,sy стартовая точка, dx,dy - длинна луча, id - идентификатор который не участвует в расчетах
    raytrace(sx,sy,dx,dy,id){
        let r = null;
        let dlinna = 1.0;
        if (dx>0){
            let b = this.list_x_n;
            while(b!=null){
                if ( sx < b.xn && id!==b.id ){
                    let d = b.xn - sx; 
                    if (d>dx){ break; }
                    let dd  = d/dx;
                    let _y = sy + dy*dd;
                    if (_y>b.yn && _y<b.yp){  
                        r      = b;
                        dlinna = dd;
                        break;   
                    }
                }
                b = b.xn_next;
            }
        }    
        if (dx<0){
            let b = this.list_x_p;
            while(b!==null && b.xp<sx){ b = b.xp_next; }
            if (b!==null){
                do{
                    b = b.xp_prev;
                    if (b!==null){
                        if (id===b.id){ continue; }
                        let d = sx - b.xp;
                        if (d>Math.abs(dx)){ break; } // находится дальше чем нам надо
                        let dd = Math.abs(d/dx);
                        if (dd>dlinna){break;}
                        let _y = sy + dy*dd;
                        if (_y>b.yn && _y<b.yp){  
                            r      = b;
                            dlinna = dd;
                            break;   
                        }
                    }else{
                        break;
                    }
                }while(true)
            }
        }    
        if (dy>0){
            let b = this.list_y_n;
            while(b!=null){
                if ( sy < b.yn && id!==b.id ){
                    let d = b.yn - sy - EPSILON; // находится дальше чем нам надо
                    if (d>dy){ break; }
                    let dd = d/dy;
                    if (dd>dlinna){break;}
                    let _x = sx + dx*dd;
                    if (_x>b.xn && _x<b.xp){  
                        r      = b;
                        dlinna = dd;
                        break;   
                    }
                }
                b=b.yn_next;
            }
        }    
        if (dy<0){
            let b = this.list_y_p;
            while(b!==null && b.yp<sy){ b = b.yp_next; }
            if (b!==null){
                do{
                    b = b.yp_prev;
                    if (b!==null){
                        if (id===b.id){ continue; }
                        let d = sy - b.yp;
                        if (d>Math.abs(dy)){ break; } // находится дальше чем нам надо
                        let dd = Math.abs(d/dy);
                        if (dd>dlinna){break;}
                        let _x = sx + dx*dd;
                        if (_x>b.xn && _x<b.xp){  
                            r      = b;
                            dlinna = dd;
                            break;   
                        }
                    }else{
                        break;
                    }
                }while(true)
            }
        }    
        this.r_dlinna = dlinna;
        return r;
    }
/*
    add_box(center,max_x,max_y,tip){
        let a = this._new_obj(null,center,max_x,max_y,tip);
        if (tip==BOX_TYPE_STATIC_SYS){
            this.container = a;
        }else{
            this._insert_box(a);
        }
        return a;
    }

    // изменяет размеры бокса по оси y
    // max_y, min_y - должны быть положительными числами
    resize_y(obj,min_y,max_y){
        // TODO ресайз не учитывает что система может быть повернута, но так как таких система пока нет, 
        // есть только вагонетка которая по оси y никаких изменений не делает, поэтому пока этот код правильный
        
        obj.hdy_max = max_y;
        obj.hdy_min = min_y;
        this.new_position(obj);
    }
    // проверка на попадание в контейнер системы  
    is_inside_container(center){
        var m = this.container;
        if (m===null){
            return false;
        }
        var dx = center.x - this.center.x;
        var dy = center.y - this.center.y;
        var dz = center.z - this.center.z;
        var x = this.vx.x * dx + this.vx.y * dy + this.vx.z * dz;
        var y = this.vy.x * dy + this.vy.y * dy + this.vy.z * dz;
        var z = this.vz.x * dx + this.vz.y * dy + this.vz.z * dz;
        if (x>m.xn && x<m.xp && y>m.xn && y<m.xp && z>m.zn && z<m.zp){
            return true;
        }else{
            return false;
        }
    }
    // двигаем всю систему, без расчета коллизий
    sys_update(center,vx,vy,vz){
        //debugger;
        var a = this.list_x_p;
        var m = this.container;
        var c = {x:0,y:0,z:0}
        var _vx = {x:0,y:0,z:0}
        var _vy = {x:0,y:0,z:0}
        var _vz = {x:0,y:0,z:0}
        c.x = this.center.x;
        c.y = this.center.y;
        c.z = this.center.z;
        _vx.x = this.vx.x;
        _vx.y = this.vx.y;
        _vx.z = this.vx.z;
        _vy.x = this.vy.x;
        _vy.y = this.vy.y;
        _vy.z = this.vy.z;
        _vz.x = this.vz.x;
        _vz.y = this.vz.y;
        _vz.z = this.vz.z;
        this.center.x = center.x;
        this.center.y = center.y;
        this.center.z = center.z;
        this.vx.x = vx.x;
        this.vx.y = vx.y;
        this.vx.z = vx.z;
        this.vy.x = vy.x;
        this.vy.y = vy.y;
        this.vy.z = vy.z;
        this.vz.x = vz.x;
        this.vz.y = vz.y;
        this.vz.z = vz.z;
        var user_id = gameplay.user_id;
        while(a!==null){
            if (a.tip!==BOX_TYPE_STATIC_COLLIDER && a.tip!==BOX_TYPE_STATIC_SYS){
                var o = a.main_obj.params;
                if (a.main_obj.attached_to_box===this){
                    if (a.main_obj.id!==user_id){
                        console.log(a.main_obj.id);
                        var dx = o.center.x - c.x;
                        var dy = o.center.y - c.y;
                        var dz = o.center.z - c.z;
                        var x = _vx.x * dx + _vx.y * dy + _vx.z * dz;
                        var y = _vy.x * dy + _vy.y * dy + _vy.z * dz;
                        var z = _vz.x * dx + _vz.y * dy + _vz.z * dz;
                        //if (x>m.xn && x<m.xp && y>m.xn && y<m.xp && z>m.zn && z<m.zp){
                        //console.log('sys upd');
                        o.center.x = center.x + vx.x*x + vy.x*y + vz.x*z;
                        o.center.y = center.y + vx.y*x + vy.y*y + vz.y*z;
                        o.center.z = center.z + vx.z*x + vy.z*y + vz.z*z;
                        a.main_obj.set_new_position();
                        a.main_obj.attached_to_box = this;
                        //}else{
                        //    this.new_position(a);    
                        //}
                    }
                }else{
                    this.new_position(a);    
                }
            }
            a = a.xp_next;
        }                
    }
    // полное очщение класса
    free(){
        this.list_x_p = null;
        this.list_x_n = null;
        this.list_y_p = null;
        this.list_y_n = null;
    }
    // трассируем луч, от объекта, луч имеет свою стартовую позицию, но трассировка все равно будет проходит от объекта, 
    // нужно понимать это и стартовую точку держать внутри бокса объекта, по сути она нужна только для смещения внутри бокса 
    // v - вектор должен быть не нормированный, его длинна это лимит трассировки
    raytrace(obj,center,v){
        //debugger;
        const EPSILON = 1;
        var dx = center.x - this.center.x;
        var dy = center.y - this.center.y;
        var cx = this.vx.x*dx + this.vx.y*dy;
        var cy = this.vy.x*dx + this.vy.y*dy;

        dx = this.vx.x*v.x + this.vx.y*v.y; 
        dy = this.vy.x*v.x + this.vy.y*v.y; 
        var max_d = 1;
        if (dx>0){
            var x = cx;
            var b = obj.xn_next;
            while(b!=null){
                if (x<b.xn){
                    var d = Math.abs(b.xn-x)-EPSILON; // находится дальше чем нам надо
                    if (d<0){d=0;}
                    if (d>dx){ break; }
                    var dd = d/dx;
                    if (dd>max_d){ break; }
                    var ddy = dy*dd;
                    var y = cy + ddy + EPSILON;
                    if (y>b.yn && y<b.yp){  
                        max_d = dd;
                        break;   
                    }
                }
                b=b.xn_next;
            }
        }    
        if (dx<0){
            var x = cx;
            var b = obj.xp_prev;
            while(b!=null){
                if (x>b.xp){
                    var d = Math.abs(b.xp-x)-EPSILON;
                    if (d<0){d=0;}
                    if (d>Math.abs(dx)){ break; } // находится дальше чем нам надо
                    var dd = Math.abs(d/dx);
                    if (dd>max_d){ break; }
                    var ddy = dy*dd;
                    var y = cy + ddy + EPSILON;
                    if (y>b.yn && y<b.yp){  
                        max_d = dd;
                        break;   
                    }
                }
                b=b.xp_prev;
            }
        }    
        if (dy>0){
            var y = cy;
            var b = obj.yn_next;
            while(b!=null){
                if (y<b.yn){
                    var d = Math.abs(b.yn-y)-EPSILON; // находится дальше чем нам надо
                    if (d<0){d=0;}
                    if (d>dy){ break; }
                    var dd = d/dy;
                    if (dd>max_d){ break; }
                    var ddx = dx*dd;
                    var x = cx + ddx - EPSILON;
                    if (x>b.xn && x<b.xp){  
                        max_d = dd;
                        break;   
                    }
                }
                b=b.yn_next;
            }
        }    
        if (dy<0){
            var y = cy;
            var b = obj.yp_prev;
            while(b!=null){
                if (y>b.yp){
                    var d = Math.abs(b.yp-y)-EPSILON;
                    if (d<0){d=0;}
                    if (d>Math.abs(dy)){ break; } // находится дальше чем нам надо
                    var dd = Math.abs(d/dy);
                    if (dd>max_d){ break; }
                    var ddx = dx*dd;
                    var x = cx + ddx*dd - EPSILON;
                    if (x>b.xn && x<b.xp){
                        max_d = dd;  
                        break;   
                    }
                }
                b=b.yp_prev;
            }
        }    
        //
        if (max_d<0.00001){max_d=0;}
        return max_d;    
    }
    */
}

