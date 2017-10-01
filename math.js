"use strict"   
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
const EPSILON = 0.000001;
// y^
//  |
//  |   z_
//  |   /|
//  |  /
//  | /
//  |/
//  |---------->x

//------------------------------------------------------------------------
// Функции помошники
//
//
//------------------------------------------------------------------------
var sin_angle = new Array(); // заготавливаем значения sin и cos в углах для расчетов
var cos_angle = new Array();
for (var i =0;i<=360;i++){
    sin_angle.push( Math.sin(i*Math.PI/180) );
    cos_angle.push( Math.cos(i*Math.PI/180) );
}
sin_angle[0]=0;
cos_angle[0]=1;
sin_angle[90]=1;
cos_angle[90]=0;
sin_angle[180]=0;
sin_angle[360]=0;
cos_angle[360]=1;

function _v3(){
    return {x:0,y:0,z:0}
}
function _v2(){
    return {x:0,y:0}
}
function angle2(v,angle){
    v.x = cos_angle[angle];
    v.y = sin_angle[angle];
}


// нормироуем вектор
function _v_norm(a,b){
    let d = Math.sqrt(b.x*b.x + b.y*b.y + b.z*b.z);
    a.x = b.x/d;
    a.y = b.y/d;
    a.z = b.z/d;
}
// умножаем a=a*c, a- вектор, c - число 
function __v_mul(a,c){
    a.x = a.x*c;    
    a.y = a.y*c;    
    a.z = a.z*c;    
}
// умножаем a=b*c, a,b- вектор, c - число
function _v_mul(a,b,c){
    a.x = b.x*c;    
    a.y = b.y*c;    
    a.z = b.z*c;    
}
// делим a=b/c, a,b- вектор, c - число
function _v_div(a,b,c){
    a.x = b.x/c;    
    a.y = b.y/c;    
    a.z = b.z/c;    
}
// a = b + c;
function _v_add(a,b,c){
    a.x = b.x + c.x;    
    a.y = b.y + c.y;    
    a.z = b.z + c.z;    
}
// a = b + c + d;
function _v_add_add(a,b,c,d){
    a.x = b.x + c.x + d.x;    
    a.y = b.y + c.y + d.y;    
    a.z = b.z + c.z + d.z;    
}
// a = b + c - d;
function _v_add_sub(a,b,c,d){
    a.x = b.x + c.x - d.x;    
    a.y = b.y + c.y - d.y;    
    a.z = b.z + c.z - d.z;    
}
// a = b - c - d;
function _v_sub_sub(a,b,c,d){
    a.x = b.x - c.x - d.x;    
    a.y = b.y - c.y - d.y;    
    a.z = b.z - c.z - d.z;    
}
// a = b - c + d;
function _v_sub_add(a,b,c,d){
    a.x = b.x - c.x + d.x;    
    a.y = b.y - c.y + d.y;    
    a.z = b.z - c.z + d.z;    
}
// a = b - c;
function _v_sub(a,b,c){
    a.x = b.x - c.x;    
    a.y = b.y - c.y;    
    a.z = b.z - c.z;    
}
// a = b + c*d;
function _v_add_mul(a,b,c,d){
    a.x = b.x + c.x*d;    
    a.y = b.y + c.y*d;    
    a.z = b.z + c.z*d;    
}
// a = b*cos[angle] + c*sin[angle]
function _v_angle(a,b,c,angle){
    a.x = b.x*cos_angle[angle] + c.x*sin_angle[angle];
    a.y = b.y*cos_angle[angle] + c.y*sin_angle[angle];
    a.z = b.z*cos_angle[angle] + c.z*sin_angle[angle];
}
// a = b*cos[angle] - c*sin[angle]
function _v_angle_(a,b,c,angle){
    a.x = b.x*cos_angle[angle] - c.x*sin_angle[angle];
    a.y = b.y*cos_angle[angle] - c.y*sin_angle[angle];
    a.z = b.z*cos_angle[angle] - c.z*sin_angle[angle];
}
// a = -b*cos[angle] + c*sin[angle]
function _v_angle__(a,b,c,angle){
    a.x = -b.x*cos_angle[angle] + c.x*sin_angle[angle];
    a.y = -b.y*cos_angle[angle] + c.y*sin_angle[angle];
    a.z = -b.z*cos_angle[angle] + c.z*sin_angle[angle];
}
// a = b + c*cos[angle] + d*sin[angle]
function _v_angle2(a,b,c,d,angle){
    a.x = b.x + c.x*cos_angle[angle] + d.x*sin_angle[angle];
    a.y = b.y + c.y*cos_angle[angle] + d.y*sin_angle[angle];
    a.z = b.z + c.z*cos_angle[angle] + d.z*sin_angle[angle];
}
// умножаем a = b + c*p.x + d*p.y; a,b,c,d - 3d ветктор, p- 2d вектор
function _v_mul_bezier(a,b,c,d,p){
    a.x = b.x + c.x*p.x + d.x*p.y;    
    a.y = b.y + c.y*p.x + d.y*p.y;    
    a.z = b.z + c.z*p.x + d.z*p.y;    
}
//
function _v_mul_bezier2(a,b,c,d,data,offset,t){
    var p1x,p1y,p2x,p2y,p3x,p3y;
    p1x = data[offset+0] + (data[offset+2] - data[offset+0])*t;     
    p1y = data[offset+1] + (data[offset+3] - data[offset+1])*t;      

    p2x = data[offset+2] + (data[offset+4] - data[offset+2])*t;     
    p2y = data[offset+3] + (data[offset+5] - data[offset+3])*t;      

    p3x = data[offset+4] + (data[offset+6] - data[offset+4])*t;     
    p3y = data[offset+5] + (data[offset+7] - data[offset+5])*t;      

    //-----------
    p1x = p1x + (p2x - p1x)*t;
    p1y = p1y + (p2y - p1y)*t;

    p2x = p2x + (p3x - p2x)*t;
    p2y = p2y + (p3y - p2y)*t;
    //-----------
    p1x = p1x + (p2x - p1x)*t;
    p1y = p1y + (p2y - p1y)*t;


    a.x = b.x + c.x*p1x + d.x*p1y;    
    a.y = b.y + c.y*p1x + d.y*p1y;    
    a.z = b.z + c.z*p1x + d.z*p1y;    
}
//  a = b
function _v_set(a,b){
    a.x = b.x;    
    a.y = b.y;    
    a.z = b.z;    
}
// a dot b;
function dot(a,b){
    return a.x*b.x + a.y*b.y + a.z*b.z;
}
//a = b cross c;
function _v_cross(a,b,c){
    a.x = b.y * c.z - b.z * c.y;
    a.y = b.z * c.x - b.x * c.z;
    a.z = b.x * c.y - b.y * c.x;
}
// искревление безьер по 4 точкам, но возращает изменения только по оси x   
function _bezierx(a,t){
    var p1 = 0 ;
    var p2 = 0;
    var p3 = 0;
    p1 = a[0].x + (a[1].x - a[0].x)*t;     
    p2 = a[1].x + (a[2].x - a[1].x)*t;     
    p3 = a[2].x + (a[3].x - a[2].x)*t;     
    //-----------
    p1 = p1 + (p2 - p1)*t;
    p2 = p2 + (p3 - p2)*t;
    //-----------
    p1 = p1 + (p2 - p1)*t;
 
    return p1;
} 
// искревление безьер по 4 точкам, но возращает изменения только по оси y   
function _32_beziery(a,t){
    var p1 = 0 ;
    var p2 = 0;
    var p3 = 0;
    p1 = a[1] + (a[3] - a[1])*t;     
    p2 = a[3] + (a[5] - a[3])*t;     
    p3 = a[5] + (a[7] - a[5])*t;     
    //-----------
    p1 = p1 + (p2 - p1)*t;
    p2 = p2 + (p3 - p2)*t;
    //-----------
    p1 = p1 + (p2 - p1)*t;
 
    return p1;
} 
// искревление безьер по 4 точкам, но возращает изменения только по оси y   
function _32_bezier(a,t){
    var p1 = 0 ;
    var p2 = 0;
    var p3 = 0;
    p1 = a[1] + (a[3] - a[1])*t;     
    p2 = a[3] + (a[5] - a[3])*t;     
    p3 = a[5] + (a[7] - a[5])*t;     
    //-----------
    p1 = p1 + (p2 - p1)*t;
    p2 = p2 + (p3 - p2)*t;
    //-----------
    p1 = p1 + (p2 - p1)*t;
 
    return p1;
} 
// безьер функция по 4 точкам
function __bezier4(q1,q2,q3,q4,t){
    var p1x,p1y,p2x,p2y,p3x,p3y;
    p1x = q1.x + (q2.x - q1.x)*t;     
    p1y = q1.y + (q2.y - q1.y)*t;     

    p2x = q2.x + (q3.x - q2.x)*t;     
    p2y = q2.y + (q3.y - q2.y)*t;     

    p3x = q3.x + (q4.x - q3.x)*t;     
    p3y = q3.y + (q4.y - q3.y)*t;     

    //-----------
    p1x = p1x + (p2x - p1x)*t;
    p1y = p1y + (p2y - p1y)*t;

    p2x = p2x + (p3x - p2x)*t;
    p2y = p2y + (p3y - p2y)*t;
    //-----------
    p1x = p1x + (p2x - p1x)*t;
    p1y = p1y + (p2y - p1y)*t;
 
    return { x:p1x, y:p1y };
}

// линейная интерполяция между a и b, t=[0,1] время
function lerp (a,b,t){
    return a + (b - a)*t;
}
function clamp(a,b,c){
    return Math.max( b, Math.min(c,a) );    
}
function smootherstep(edge0, edge1, x){
    // Scale, and clamp x to 0..1 range
    x = clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0);
    // Evaluate polynomial
    return x*x*x*(x*(x*6 - 15) + 10);
}
function smoothstep (x){
     return ((x) * (x) * (3 - 2 * (x)));
}

//----------------------------------------------------------
// функция пересечения луча с треугольником
//en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
// V1,V2,V3 - Triangle vertices
// ray.s - Ray origin
// ray.v - Ray direction
// ray.out - результат
function triangle_intersection( V1,V2,V3,ray){
    var e1 = {x:0,y:0,z:0} //Edge1, Edge2
    var e2 = {x:0,y:0,z:0}
    var P = {x:0,y:0,z:0}
    var Q = {x:0,y:0,z:0}
    var T = {x:0,y:0,z:0}
    var det, inv_det, u, v;
    var t;
    _v_sub(e1, V2, V1);    //Find vectors for two edges sharing V1
    _v_sub(e2, V3, V1);
    _v_cross(P, ray.v, e2);//Begin calculating determinant - also used to calculate u parameter
    det = dot(e1, P);    //if determinant is near zero, ray lies in plane of triangle or ray is parallel to plane of triangle
    if(det>-EPSILON && det<EPSILON) return 0;//NOT CULLING
    inv_det = 1/det;
    _v_sub(T, ray.s, V1);//calculate distance from V1 to ray origin
    u = dot(T, P) * inv_det;//Calculate u parameter and test bound
    if(u<0 || u>1) return 0;//The intersection lies outside of the triangle
    _v_cross(Q, T, e1);//Prepare to test v parameter
    v = dot(ray.v, Q) * inv_det;//Calculate V parameter and test bound
    if(v<0 || u+v>1) return 0;//The intersection lies outside of the triangle
    t = dot(e2, Q) * inv_det;
    if(t > EPSILON) { //ray intersection
        ray.out = t;
        return 1;
    }
    // No hit, no win
    return 0;
}
/*
 *  As per "Barycentric Technique" as named here 
 *  http://www.blackpawn.com/texts/pointinpoly/default.html 
 *  But without the division
 */
function pointInTriangle(p, a, b, c) {
    var v0 = {x:0,y:0,z:0}
    var v1 = {x:0,y:0,z:0}
    var v2 = {x:0,y:0,z:0}
    _v_sub(v0,c,a);
    _v_sub(v1,b,a);
    _v_sub(v2,p,a);
    var dot00 = dot(v0,v0 );
    var dot01 = dot(v0,v1 );
    var dot02 = dot(v0,v2 );
    var dot11 = dot(v1,v1 );
    var dot12 = dot(v1,v2 );
    var u,v;
    return  ( (u = dot11 * dot02 - dot01 * dot12) >= 0 ) &&
            ( (v = dot00 * dot12 - dot01 * dot02) >= 0 ) &&
            ( u + v < ( dot00 * dot11 - dot01 * dot01 ) );
}

// This gets the y value at the given 2d coordinates
function getYinTriangle(p1,p2,p3, x, z) {
    let a = -(p3.z*p2.y-p1.z*p2.y-p3.z*p1.y+p1.y*p2.z+p3.y*p1.z-p2.z*p3.y)
    let b = (p1.z*p3.x+p2.z*p1.x+p3.z*p2.x-p2.z*p3.x-p1.z*p2.x-p3.z*p1.x)
    let c = (p2.y*p3.x+p1.y*p2.x+p3.y*p1.x-p1.y*p3.x-p2.y*p1.x-p2.x*p3.y)
    let d = -a*p1.x-b*p1.y-c*p1.z
    return -(a*x+c*z+d)/b
}

// генератор псевдослучайных чисел
let _seed = 1;
function random() {
    let x = Math.sin(_seed++) * 100000;
    return x - Math.floor(x);
}

// TODO оптимизировать
function _bezier_v4(a1,w1,w2,w3,w4,t){
    let a2 = {x:0,y:0,z:0}
    let a3 = {x:0,y:0,z:0}
    a1.x = w1.x + (w2.x-w1.x)*t;
    a1.y = w1.y + (w2.y-w1.y)*t;
    a1.z = w1.z + (w2.z-w1.z)*t;

    a2.x = w2.x + (w3.x-w2.x)*t;
    a2.y = w2.y + (w3.y-w2.y)*t;
    a2.z = w2.z + (w3.z-w2.z)*t;

    a3.x = w3.x + (w4.x-w3.x)*t;
    a3.y = w3.y + (w4.y-w3.y)*t;
    a3.z = w3.z + (w4.z-w3.z)*t;

    a1.x = a1.x + (a2.x-a1.x)*t;
    a1.y = a1.y + (a2.y-a1.y)*t;
    a1.z = a1.z + (a2.z-a1.z)*t;

    a2.x = a2.x + (a3.x-a2.x)*t;
    a2.y = a2.y + (a3.y-a2.y)*t;
    a2.z = a2.z + (a3.z-a2.z)*t;
    
    a1.x = a1.x + (a2.x-a1.x)*t;
    a1.y = a1.y + (a2.y-a1.y)*t;
    a1.z = a1.z + (a2.z-a1.z)*t;
}

module.exports._v3 = _v3;
module.exports._v2 = _v2;
module.exports.angle2 = angle2;


