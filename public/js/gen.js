"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
let window = {
}
importScripts('lib/tgen.min.js?ver=0.001'); 


function generate_txt_moon(seed){
    let width  = 256;
    let height = 256;
    //
	let params = {
		"width" : width,
		"height": height,
		"items": [
    		[0, "fill",   { "rgba": [150,150,150,1] }],
			[0, "clouds", { seed: seed, blend:  "overlay", rgba: [100,100,100,1], roughness: 8 }],
			[0, "map",    { xamount: 1000, yamount: 1000, xchannel: 0, ychannel: 0, xlayer: 0, ylayer: 0}],
			//[0, "clouds", {"blend": "opacity", "rgba": [55,55,55,0.5] }],
			//[0, "clouds", {"blend": "opacity", "rgba": [155,155,155,0.5] }],
			//[0, "colorize",  { seed: seed+6000, "colormap": "blackwhite"}],
			//[0, "contrast",  { seed: seed+7000, "value":42}],
			//[0, "emboss"],
		]
	}
    //
    // initialize the generator
    let generator = window.tgen.init(height, height);
    // generate
    let canvas  = window.generator.render(params).toCanvas();
    return canvas;
}

let gen = [generate_txt_moon];

self.onmessage = function(e) {
  //var worker_n =  e.data.n;
  //var tip = e.data.data.tip;
  //var lod = e.data.lod;
  let id    = e.data.id;
  let n     = e.data.n;
  let seed  = e.data.seed;

  let canvas = gen[n]( e.data.seed); // вызов функции генератора

  let a = {
    id      : id,
    canvas  : canvas,
  }
  self.postMessage(a,[canvas]); // отправляем данные
}
