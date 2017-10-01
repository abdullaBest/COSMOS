"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
let SPEECH = {
    syn        : null,
    _voice_eng : null,   
    _voice_ru  : null,
    volume     : 1.0, 
}

function speech_loadVoices(){
    let voices = speechSynthesis.getVoices();
	voices.forEach(function(voice, i) {
        if (voice.lang==='ru-RU'){
            SPEECH._voice_ru = voice; 
        }
        //if (voice.lang==='en-GB' && voice.name!='Google UK English Male'){
        //    SPEECH._voice_eng = voice; 
        //}
        if (voice.lang==='en-US'){
            SPEECH._voice_eng = voice; 
        }
	});
}

function speech_prepare(){
    if (window.speechSynthesis!==undefined){
        SPEECH.syn = window.speechSynthesis;
        speech_loadVoices();
        // Chrome loads voices asynchronously.
        window.speechSynthesis.onvoiceschanged = function(e) { speech_loadVoices(); };
    }
}

function speech_cancel(){
    if (SPEECH.syn!==null){
    	SPEECH.syn.cancel();
    }

}

function speech_speak(text) {
    if (SPEECH.syn!==null){
        let msg = new SpeechSynthesisUtterance();
    	msg.text = text;
        msg.volume = SPEECH.volume;
	    //msg.rate   = parseFloat(rateInput.value);
	    //msg.pitch  = parseFloat(pitchInput.value);
        if (text.charCodeAt(1)<128){
        	if (SPEECH._voice_eng!==null) { msg.voice = SPEECH._voice_eng; }
        }else{
        	if (SPEECH._voice_ru!==null) { msg.voice = SPEECH._voice_ru; }
        }
    	SPEECH.syn.speak(msg);
    }
}