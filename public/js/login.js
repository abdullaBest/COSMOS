"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let MSG = {
    div             : null,
}

let LOGIN = {
    _submit : false,
}

let RENDER = {
    camera   : null,
    scene    : null,
    renderer : null,
    stars    : [],
}

let fileReader = new FileReader();


function msg(a){ MSG.div.children[1].innerHTML = a; MSG.div.style.display = 'block'; }
function msg_close(){ MSG.div.style.display = 'none'; }
//========================================================
// пользователь нажал на кнопку "Войти"
document.addEventListener('submit', function(e){
    console.log(e);
    if (e.target.id === 'form_registration'){
        if (!LOGIN._submit){
            e.preventDefault();
            let request = new XMLHttpRequest();
            let email     = document.getElementById('form_ra').value;
            let password  = document.getElementById('form_rp').value;
            let password2 = document.getElementById('form_rp2').value;
            let nickname  = document.getElementById('form_rn').value;
            if (password!==password2){
                msg(ERROR_MSGS[4]);
                return;
            }
            let a = {
                e : email,
                p : password,
                n : nickname,
            }
            request.open('GET','/r?a='+JSON.stringify(a));
            request.responseType = 'json';
            request.onload = function(){
                let m = this.response.m;
                if (m===7){
                    LOGIN._submit = true;
                    e.target.submit();
                }else{
                    msg(ERROR_MSGS[m]);
                }        
            };
            request.send();
        }        
    }
    if (e.target.id === 'form_login'){
        if (!LOGIN._submit){
            e.preventDefault();
            let a = {
                e : document.getElementById('form_a').value,
                p : document.getElementById('form_p').value,
            }
            let request = new XMLHttpRequest();
            request.open('GET','/a?a='+JSON.stringify(a));
            request.responseType = 'json';
            request.onload = function(){
                let m = this.response.m;
                if (m===9){
                    LOGIN._submit = true;
                    Cookies.set('id', this.response.id, { expires: 365 });                    
                    Cookies.set('code', this.response.code, { expires: 365 });                    
                    e.target.submit();
                }else{
                    msg(ERROR_MSGS[m]);
                }        
            };
            request.send();
        }        
    }
}, false);      

//===================================================
function render_resize(){
    RENDER.WIDTH = window.innerWidth,
    RENDER.HEIGHT = window.innerHeight;
    RENDER.renderer.setSize(RENDER.WIDTH, RENDER.HEIGHT);
    RENDER.aspect = RENDER.WIDTH/RENDER.HEIGHT;

    RENDER.camera.aspect = RENDER.WIDTH / RENDER.HEIGHT;
    RENDER.camera.updateProjectionMatrix();
    //
}

function init(){
    RENDER.WIDTH = window.innerWidth;
    RENDER.HEIGHT = window.innerHeight;
	RENDER.camera = new THREE.PerspectiveCamera(45, RENDER.WIDTH / RENDER.HEIGHT, 1, 1000);
	RENDER.camera.position.z = 5;	 
	RENDER.scene = new THREE.Scene();
	RENDER.renderer = new THREE.WebGLRenderer();
	RENDER.renderer.setSize( RENDER.WIDTH, RENDER.HEIGHT );
	document.body.appendChild( RENDER.renderer.domElement );
    // Обновляет размеры канвы при изменении размеров окна браузера
    window.addEventListener('resize', render_resize) ;

}

function addSphere(){
	for ( var z= -1000; z < 1000; z+=20 ) {
		var geometry   = new THREE.SphereGeometry(0.5, 32, 32)
		var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
		var sphere = new THREE.Mesh(geometry, material)
		sphere.position.x = Math.random() * 1000 - 500;
		sphere.position.y = Math.random() * 1000 - 500;
		sphere.position.z = z;
    	sphere.scale.x = sphere.scale.y = 2;
		RENDER.scene.add( sphere );
		RENDER.stars.push(sphere); 
	}
}

function animateStars() { 
    for(var i=0;i<RENDER.stars.length; i++) {
       let star = RENDER.stars[i]; 
	   star.position.z +=  i/100;
	   if(star.position.z>1000) star.position.z-=2000; 
	}
}

function render() {
	requestAnimationFrame( render );
	RENDER.renderer.render( RENDER.scene, RENDER.camera );
	animateStars();
}

// START
document.addEventListener("DOMContentLoaded", function(event) {
    MSG.div          = document.getElementById('MSG'); 
	
    let login = document.getElementById('LOGIN');
    let id = Cookies.get('id');
    if (id!==undefined){
        login.children[0].style.display = 'none';
        login.children[1].style.display = 'none';
        let request = new XMLHttpRequest();
        request.open('GET','/a');
        request.responseType = 'json';
        request.onload = function(){
            console.log(this.response);
            let i = this.response.i;
            if (i===MSG_LOGIN_FAIL){
                login.children[1].style.display = 'block';
            }
            if (i===MSG_LOGIN){
                login.children[0].style.display = 'block';
            }
        };
        request.send();
    }else{
        login.children[0].style.display = 'none';
        login.children[1].style.display = 'block';
    }
	init();
	addSphere();
	render();
});
