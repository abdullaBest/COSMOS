"use strict"

// глобальный объект в котором хранится структура
let $ = {}

//   
class strapony {
    constructor(){
        this.el    = null;
        this._call = null;
        this._list = null;
    }
    // добавляет шаблон в элемент
    set(id,a){
        if (this._list===null){
            this._list = new Map();
        }
        let b = this._list.get(id);
        if (b===undefined){
            b = a.el.cloneNode(false);
            a._call(b);
            this._list.set(id,b);
            this.el.appendChild(b);
        }else{
            a._call(b);
        }
        return b;
    }
    // получаем элемент сгененрированный по шаблону
    get(id){
        if (this._list===null){ return null; }
        let b = this._list.get(id);
        if (b===undefined){ return null; }
        return b;
    }
    // удаляет шаблон из элемента
    del(id){
        if (this._list!==null){
            let b = this._list.get(id);
            if (b!==undefined){
                b.parentNode.removeChild(b);
                this._list.delete(id);
            }
        }
    }
    // удаляет все созданные шаблоны
    clear(){
        if (this._list===null){return;}
        for (let a of this._list){
           a[1].parentNode.removeChild(a[1]);
           this._list.delete(a[0]);
        }    
    }
    // назначает событие на дочерние элементы
    func(name,query,event){
        let l = this.el.querySelectorAll(query);
        for (let i=0;i<l.length;i++){
            let a = l[i];   
            a.dataset[name] = i;
            a[event] = this[name];
        }
    }
}

(function(){
    // проходим по все элементам dom дерева и собираем только с выставленным атрибутом id
    let l = document.querySelectorAll('*[id]');
    for (let i=0;i<l.length;i++){
        let el = l[i]; 
        let s = el.id.split('.');   // разбиваем идентификатор на несколько
        if (s.length===0){ continue }
        let a = $;
        // заполняем
        for (let i=0;i<s.length;i++){
            let name = s[i];
            let b = a[name];
            if (b===undefined){     
                b = new strapony();
                a[name] = b;
            }
            a = b;
        }
        a.el = el;
        // обрабатываем шаблоны
        if (s[0]==='TPL'){ 
            el.parentNode.removeChild(el);  // убераем его из документа
            el.removeAttribute('id');       // убераем атрибут id
            let s = el.innerHTML.replace(/`/g,'\\u0060').replace(/'/g,'\\u0027'); // заменяем кавычки на юникод
            // создаем функцию шаблонизатора для достижения максимальной производительности
            a._call = new Function('d','d.innerHTML=`' + s + '`;');
        }
        
    }
})()