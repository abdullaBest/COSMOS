"use strict"
/*
    
    copyright 2017 Hamzin Abdulla (abdulla_best@mail.ru)
*/
// сообщения TODO создать языковые константы
const ERROR_MSGS = [
    'Неизвестная ошибка',                                                           // 0
    'Адрес электронной почты не может быть короче 6 символов',                      // 1
    'Имя пользователя не может быть короче 3 символов',                             // 2
    'Пароль не может быть короче 6 символов',                                       // 3
    'Пароли не совпадают',                                                          // 4
    'Такой адрес электронной почты уже зарегестрирован',                            // 5
    'Такое имя пользователя уже зарегестрировано',                                  // 6
    'На адрес электронной почты отправлено письмо подтверждения',                   // 7
    'Адрес электронной почты или пароль введены не верно',                          // 8
    'Авторизация успешна',                                                          // 9
    'Сервер перегружен попробуйте зайти в игру попозже',                            // 10
    'У вас не достаточно кредитов',                                                 // 11
    'Нет свободного места в ангаре',                                                // 12
    'Нет свободного места для оружия',                                              // 13
    'Без двигателя на корабле покинуть станцию невозможно',                         // 14
    'Нехватает топлива для вылета со станции',                                      // 15
    'Без энергетической установки вылет со станции не возможен',                    // 16
    'Недостаточно места в грузовом отсеке',                                         // 17
    'Объект не существует',                                                         // 18
    'Нет места в хранилище',                                                        // 19
    
]

//
const MSG_MSG                       = 0;    // сообщение с сервера
const MSG_LOGIN                     = 1;    // вход в систему
const MSG_LOGIN_FAIL                = 2;    // вход в систему не удался
const MSG_REGISTRATION              = 3;    // регистрация
const MSG_INIT                      = 4;    // инициализация пользователя
const MSG_UNIT_POS                  = 5;    // координаты юнита
const MSG_BLOCK                     = 6;    // блок карты
const MSG_EDITOR                    = 7;    // редактирование
const MSG_STATIC                    = 8;    // работа со объектом на карте
const MSG_UNIT_INFO                 = 9;    // информация по юниту
const MSG_STATION                   = 10;   // станция
const MSG_DEVICE                    = 11;   // задействовано устройство

const OBJ_STATUS_FIRE1              = 1;    // 
const OBJ_STATUS_FIRE2              = 2;    // 
const OBJ_STATUS_FIRE3              = 4;    // 
const OBJ_STATUS_FIRE4              = 8;    // 
const OBJ_STATUS_UPD_RND            = 16;   // метка говорит о том что счетчик псевдо-случайных чисел обнулился 
const OBJ_STATUS_BOOM               = 32;   // корабль взорвался 
const OBJ_STATUS_NPC                = 64;   // корабль бот 
const OBJ_STATUS_CHCK               = 128;  // метка, ее изменение обозначает что данные были обновлены игроком, если метка не обновлена значит данные были просто повторены. 


const STATIC_STATUS_INACTIVE        = 1;    // объект не активен 
const STATIC_STATUS_COLLECTIBLE     = 2;    // объект можно собирать 

const _send_status_frame            = 0;
const _send_status_block            = 1;    // 
const _send_status_block_end        = 2;    //
const _send_status_next_tick        = 3;    //
const _send_status_item_update      = 4;    //

const ACTION_BLOCK_REQ              = 1;    //
const ACTION_UNIT_INFO_REQ          = 2;    //
const ACTION_UNIT_COLLECT           = 4;    // запрос на сбор статичного объекта с карты

const STATION_OP_CONNECT            = 0;    // запрос на стыковку со станцией
const STATION_OP_REPAIR             = 1;    // запрос на починку корабля
const STATION_OP_FUEL               = 2;    // запрос на запрвку топливом
const STATION_OP_BULLETS            = 3;    // запрос на покупку патронов
const STATION_OP_LEAVE              = 4;    // запрос на вылет из станции
const STATION_OP_MARKET             = 5;    // запрос на покупку-продажу объектов на рынке
const STATION_OP_BUY                = 6;    // запрос на покупку оборудования
const STATION_OP_GUN                = 7;    // настройка оружия

const UNIT_SHIP     = 1; 
const UNIT_ASTEROID = 2; 

// двигатели
const INFO_DVIGS = [
    {                                       // 0
        name        : '',                   // название
        desc        : '',                   // описание
        n           : 0,                    // номер картинки
        max_speed   : 0,                    // максимальная скорость
        price       : 0,                    // цена продукта
    },  
    {                                       //1
        name        : 'Двигатель 1',
        desc        : 'просто двигатель',
        n           : 60,        
        max_speed   : 200,
        price       : 1000,
    },
    {                                       //2
        name        : 'Двигатель 2',
        desc        : 'простой двигатель',
        n           : 92,        
        max_speed   : 300,
        price       : 1000,
    },
]

const GUNS_TYPE_BULLET = 0;
const GUNS_TYPE_LASER  = 1;

// Оружие
const INFO_GUNS = [
    {                                             // 0 - пустышка
        name         : '',                        // название турели
        desc         : '',                        // описание
        n            : 0,                         // корпус, номер картинки
        fn           : [0],                       // кадры вспышки
        fo           : {x:0.0,y:0.0},             // положение вспышки относительно корпуса
        fscale       : 1.0,                       // размер вспышки
        // 
        type         : GUNS_TYPE_BULLET,          // тип вооружения
        bullets      : 0,                         // трата пуль за выстрел
        bullets_max  : 0,                         // максимальное количество в турели
        bullets_price: 0,                         // цена патронов за def_i количество
        bullet_damage: 0,                         // урон наносимый одной пулей, для лазеров урон считается из энергии выстрела def_i
        energy       : 0,                         // энергия постраченная за выстрел
        price        : 0,                         // цена
        def_i        : 0,                         // настройка оружия по умолчанию, для GUNS_TYPE_BULLET - количество патронов, GUNS_TYPE_LASER - количество потребляемой энергии при выстреле 
    },
    {                                            // 1 - турель пулемет
        name         : 'турель пулемет',          
        desc         : 'пулемет что может быть лучше',
        n            : 95,                        
        fn           : [61,62,63,64],             
        fo           : {x:0.7,y:0.01},             
        fscale       : 2.5,                       
        // 
        type         : GUNS_TYPE_BULLET,       
        bullets      : 1,                         
        bullets_max  : 400,
        bullets_price: 10,    
        bullet_damage: 300,
        energy       : 0, 
        price        : 1000,
        def_i        : 100,
    },
    {                                            // 2 - турель лазер
        name         : 'турель лазер',          
        desc         : 'разрушительные лучи - все как фантасты и писали',
        n            : 95,                        
        fn           : [61],             
        fo           : {x:0.7,y:0.01},             
        fscale       : 2.5,                       
        // 
        type         : GUNS_TYPE_LASER,          
        bullets      : 0,                         
        bullets_max  : 0,                         
        bullets_price: 0,    
        bullet_damage: 0,
        energy       : 100,                         
        price        : 1000,
        def_i        : 50,
    },
]

// Генераторы энергии
const INFO_GENS = [     
    {                                       // 0 - пустышка
        name            : '',               // описание
        desc            : '',
        gen_per_frame   : 0,                // количество энергии выделяемой за фрейм
        gen_max         : 0,                // встроенный ячейки - максимальный лимит по хранимой энергии  
        price           : 0,                // цена
    },
    {                                       // 1
        name            : 'генератор малой мощности',
        desc            : 'генератор чтобы был',
        gen_per_frame   : 10,
        gen_max         : 300,              
        price           : 2000,           
    },
    {                                       // 2
        name            : 'генератор гамма',
        desc            : 'может стоит его поставить',
        gen_per_frame   : 15,
        gen_max         : 350,              
        price           : 3000,           
    },
]

// устройства
const INFO_DEVICES = [
    {                                       // 0 пустышка
        name            : '',
        desc            : '',
        price           : 0,
        radius          : 0,
        cargo           : 0,                // занимаемое место в грузовом отсеке
        energy          : 0,                // потребляемая энергия
    },
    {                                       // 1 луч для притягивания предметов в космосе
        name            : 'притягивающий луч',
        desc            : 'для притягивания объектов в космосе',
        price           : 1000,
        radius          : 3*1024*1024,
        cargo           : 1,            
        energy          : 100,    
    },
    
]

// корабли
const INFO_UNITS = [
    {                                       // 0  - пустышка
        name            : '',
        price           : 0,                // цена корабля
        desc            : '',
        //
        corpus          : [],               // кртинки из которых состоит корпус корабля
        corpus_offset   : [],               // положение картинок относительно центра
        guns            : [],               // положение пушек
        dvig            : {x:0.0,y:0.0},    // положение двигателя
        hvost           : [],               // картинки задействованные в виде хвоста
        //
        box_mask        : UNIT_SHIP,        // теги для физического движка      
        //
        max_cargo       : 0,                // объем грузового отсека
        max_hp          : 0,                // 
        max_shield      : 0,                //
        max_fuel        : 0,                // максимальное количество топлива
        max_bullets     : 0,                // максимальное количество патронов
        gen_type        : 0,                // генератор энергии установленный по умолчанию
        dvig_type       : 0,                // двигатель установленный по умолчанию
        shield_gen      : 0,                // скорость востановления щита
        //
        crew            : 0,
    },
    {                                       // 1  - кораблик
        name            : 'корабль 1',
        price           : 100000,           
        desc            : 'коммерческий грузовой корабль',
        //
        corpus          : [55],             
        corpus_offset   : [{x:0,y:0}],      
        guns            : [{x:0.7,y:0}],    
        dvig            : {x:-0.5,y:0},     
        hvost           : [],               
        //
        box_mask        : UNIT_SHIP,              
        //
        max_cargo       : 0,                // объем грузового отсека
        max_hp          : 1000,              
        max_shield      : 1000,             
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        //
        crew            : 1,
    },
    {                                       // 2  - кораблик
        name            : 'корабль 2',
        price           : 100000,           
        desc            : 'коммерческий грузовой корабль',
        //
        corpus          : [56],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.7,y:0}],
        dvig            : {x:-0.5,y:0},
        hvost           : [],
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,                
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 3  - червь
        name            : 'червь',
        price           : 100000,           
        desc            : 'червь - древнее существо, обитатает в поясе астероидов',
        //
        corpus          : [65],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.5,y:0}],
        dvig            : {x:-0.3,y:0},
        hvost           : [66,66,66,66,66,66,66,66,67],        
        //
        box_mask        : UNIT_SHIP+UNIT_ASTEROID,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,                
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 4  - червь2
        name            : 'червь2',
        price           : 100000,           
        desc            : 'червь - древнее существо, обитатает в поясе астероидов',
        //
        corpus          : [68],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.0,y:0}],
        dvig            : {x:0.0,y:0},
        hvost           : [69,69,69,69,69,69,69,69,70],        
        //
        box_mask        : UNIT_SHIP+UNIT_ASTEROID,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 5  - турель
        name            : 'турель',
        price           : 100000,
        desc            : 'боевая турель для установки на стационарные площадки',
        //
        corpus          : [89],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.0,y:0}],
        dvig            : {x:0.0,y:0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 500,        
        max_shield      : 100,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 6  - транспортник
        name            : 'транспорт',
        price           : 100000,           
        desc            : 'транспортртный корабль класса III',
        //
        corpus          : [90,91],
        corpus_offset   : [{x:0,y:0},{x:-1.9,y:0},],
        guns            : [{x:0.0,y:0}],
        dvig            : {x:-3.7,y:0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 7  - транспортник
        name            : 'транспорт',
        price           : 100000,           
        desc            : 'транспортртный корабль класса II',
        //
        corpus          : [90,91,91],
        corpus_offset   : [{x:0,y:0},{x:-1.9,y:0},{x:-3.8,y:0}],
        guns            : [{x:0.0,y:0}],
        dvig            : {x:-5.6,y:0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 8  - транспортник
        name            : 'транспорт',
        price           : 100000,           
        desc            : 'транспортртный корабль класса I',
        //
        corpus          : [90,91,91,91],
        corpus_offset   : [{x:0,y:0},{x:-1.9,y:0},{x:-3.8,y:0},{x:-5.7,y:0}],
        guns            : [{x:0.0,y:0}],
        dvig            : {x:-7.5,y:0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 9  - кабан
        name            : 'кабан',
        price           : 100000,           
        desc            : 'автономный рудокоп',
        //
        corpus          : [93],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.0,y:0.0}],
        dvig            : {x:0.0,y:0.0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 100,        
        max_shield      : 500,        
        max_fuel        : 1000,
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
    {                                       // 10 - корабль 3, с турелью
        name            : 'корабль3',
        price           : 100000,           
        desc            : 'корабль с турелями',
        //
        corpus          : [94],
        corpus_offset   : [{x:0,y:0}],
        guns            : [{x:0.0,y:-0.5},{x:0.5,y:0.0},{x:-0.5,y:0.0},{x:0.0,y:0.5}],
        dvig            : {x:-0.3,y:0.0},
        hvost           : [],        
        //
        box_mask        : UNIT_SHIP,
        //
        max_cargo       : 100,
        max_hp          : 1000,        
        max_shield      : 1000,        
        max_fuel        : 1000,             
        max_bullets     : 500,
        gen_type        : 1,
        dvig_type       : 1,
        shield_gen      : 1,
        crew            : 1,
    },
]
    
// url          - адерс файла атласа
// fw           - размер атласа
// frame        - положение спрайта в атласе
// material     - материал на клиенте
// box          - размер коллайдера относительно размера самой картинки, 0-нет, 1 - полный размер
// hp           - количество очков жизни
// anim         - количество кадров
// anim_d       - скорость анимации
// z            - положение в слоях
// storage      - количество предметов он может хранить внутри
// ai           - обрабатывае ли эти объекты ИИ
// name         - название спрайта
// award_rule   - условия выпадения предметов
const STATIC_INFO = [
 { url:'aster.png',     fw:1024, frame:[ 96,  0,100,100], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteor1',           },//  0
 { url:'aster.png',     fw:1024, frame:[196,  0,100,100], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteor2',           },//  1
 { url:'aster.png',     fw:1024, frame:[296,  0,100,100], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteor3',           },//  2
 { url:'aster.png',     fw:1024, frame:[396,  0,200,200], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteorit',          },//  3
 { url:'aster.png',     fw:1024, frame:[596,  0,200,200], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteorit2',         },//  4
 { url:'aster.png',     fw:1024, frame:[796,  0, 60, 60], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:1, name:'meteorit3',         },//  5
 { url:'aster.png',     fw:1024, frame:[856,  0, 60, 60], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'meteoritosk',       },//  6
 { url:'aster.png',     fw:1024, frame:[916,  0, 60, 60], material:null, box:1 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'meteoritosk2',      },//  7
 { url:'base.png',      fw:1024, frame:[  0,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'bak',               },//  8
 { url:'base.png',      fw:1024, frame:[100,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base1',             },//  9
 { url:'base.png',      fw:1024, frame:[200,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base2',             },// 10
 { url:'base.png',      fw:1024, frame:[300,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base3',             },// 11
 { url:'base.png',      fw:1024, frame:[400,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base4',             },// 12
 { url:'base.png',      fw:1024, frame:[500,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base5',             },// 13
 { url:'base.png',      fw:1024, frame:[600,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base6',             },// 14
 { url:'base.png',      fw:1024, frame:[700,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base7',             },// 15
 { url:'base.png',      fw:1024, frame:[800,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base8',             },// 16
 { url:'base.png',      fw:1024, frame:[900,  0,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base9',             },// 17
 { url:'base.png',      fw:1024, frame:[  0,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base10',            },// 18
 { url:'base.png',      fw:1024, frame:[100,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'base11',            },// 19
 { url:'base.png',      fw:1024, frame:[200,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo1',            },// 20
 { url:'base.png',      fw:1024, frame:[300,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo2',            },// 21
 { url:'base.png',      fw:1024, frame:[400,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo3',            },// 22
 { url:'base.png',      fw:1024, frame:[500,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo4',            },// 23
 { url:'base.png',      fw:1024, frame:[600,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo5',            },// 24
 { url:'base.png',      fw:1024, frame:[700,100,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   8, ai:0, award_rule:0, name:'cargo6',            },// 25
 { url:'base.png',      fw:1024, frame:[  0,300, 50, 50], material:null, box:0 , hp: 100, anim:4, anim_d:100, z: 0.1, storage:   0, ai:0, award_rule:0, name:'lamp1',             },// 26
 { url:'base.png',      fw:1024, frame:[ 50,300, 50, 50], material:null, box:0 , hp: 100, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'lamp2',             },// 27
 { url:'base.png',      fw:1024, frame:[100,300, 50, 50], material:null, box:0 , hp: 100, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'lamp3',             },// 28
 { url:'base.png',      fw:1024, frame:[150,300, 50, 50], material:null, box:0 , hp: 100, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'lamp4',             },// 29
 { url:'base.png',      fw:1024, frame:[300,300,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.7, storage:   0, ai:0, award_rule:0, name:'set2',              },// 30
 { url:'base.png',      fw:1024, frame:[400,300,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.7, storage:   0, ai:0, award_rule:0, name:'set6',              },// 31
 { url:'base.png',      fw:1024, frame:[500,300,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.7, storage:   0, ai:0, award_rule:0, name:'set9',              },// 32
 { url:'base.png',      fw:1024, frame:[600,300,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'sklad',             },// 33
 { url:'base.png',      fw:1024, frame:[700,300,100,100], material:null, box:0 , hp:1000, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'sklad2',            },// 34
 { url:'particle.png',  fw:1024, frame:[144,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'iskr_0',            },// 35
 { url:'particle.png',  fw:1024, frame:[192,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'iskr_1',            },// 36
 { url:'particle.png',  fw:1024, frame:[216,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'iskr_2',            },// 37
 { url:'particle.png',  fw:1024, frame:[ 96,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'kusok_0',           },// 38
 { url:'particle.png',  fw:1024, frame:[  0,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'kusok_1',           },// 39
 { url:'particle.png',  fw:1024, frame:[ 24,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'kusok_2',           },// 40
 { url:'particle.png',  fw:1024, frame:[ 72,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'kusok_3',           },// 41
 { url:'particle.png',  fw:1024, frame:[280,  0, 40, 40], material:null, box:1 , hp: 100, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'osk1',              },// 42
 { url:'particle.png',  fw:1024, frame:[400,  0, 40, 40], material:null, box:1 , hp: 100, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'osk2',              },// 43
 { url:'particle.png',  fw:1024, frame:[360,  0, 40, 40], material:null, box:1 , hp: 100, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'osk3',              },// 44
 { url:'particle.png',  fw:1024, frame:[240,  0, 40, 40], material:null, box:1 , hp: 100, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'osk4',              },// 45
 { url:'particle.png',  fw:1024, frame:[ 48,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'voln_0',            },// 46
 { url:'particle.png',  fw:1024, frame:[168,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'voln_1',            },// 47
 { url:'particle.png',  fw:1024, frame:[120,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'voln_2',            },// 48
 { url:'particle.png',  fw:1024, frame:[840,  0,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_0',           },// 49
 { url:'particle.png',  fw:1024, frame:[  0,100,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_1',           },// 50
 { url:'particle.png',  fw:1024, frame:[440,  0,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_2',           },// 51
 { url:'particle.png',  fw:1024, frame:[540,  0,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_3',           },// 52
 { url:'particle.png',  fw:1024, frame:[640,  0,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_4',           },// 53
 { url:'particle.png',  fw:1024, frame:[740,  0,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:0, name:'vzriv_5',           },// 54
 { url:'ship.png',      fw:1024, frame:[  0,100,100,100], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'korpus',            },// 55
 { url:'ship.png',      fw:1024, frame:[819,  0,100,100], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'korablbogomol',     },// 56
 { url:'ship.png',      fw:1024, frame:[120,  0, 33, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'pushka',            },// 57
 { url:'ship.png',      fw:1024, frame:[153,  0, 34, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'pushka2',           },// 58
 { url:'ship.png',      fw:1024, frame:[187,  0, 40, 40], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'pushka3',           },// 59
 { url:'ship.png',      fw:1024, frame:[  0,  0, 24, 31], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'dvig',              },// 60
 { url:'ship.png',      fw:1024, frame:[ 96,  0, 24, 24], material:null, box:0 , hp:   0, anim:4, anim_d: 20, z:   0, storage:   0, ai:0, award_rule:0, name:'atack1',            },// 61
 { url:'ship.png',      fw:1024, frame:[ 72,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'atack2',            },// 62
 { url:'ship.png',      fw:1024, frame:[ 24,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'atack3',            },// 63
 { url:'ship.png',      fw:1024, frame:[ 48,  0, 24, 24], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z:   0, storage:   0, ai:0, award_rule:0, name:'atack4',            },// 64
 { url:'ship.png',      fw:1024, frame:[337,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormgolova1',       },// 65
 { url:'ship.png',      fw:1024, frame:[457,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormtelo1',         },// 66
 { url:'ship.png',      fw:1024, frame:[397,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormhvost1',        },// 67
 { url:'ship.png',      fw:1024, frame:[277,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormgolova2',       },// 68
 { url:'ship.png',      fw:1024, frame:[577,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormtelo2',         },// 69
 { url:'ship.png',      fw:1024, frame:[517,  0, 60, 60], material:null, box:1 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'wormhvost2',        },// 70
 { url:'base.png',      fw:1024, frame:[800,100,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom1',              },// 71
 { url:'base.png',      fw:1024, frame:[900,100,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom2',              },// 72
 { url:'base.png',      fw:1024, frame:[  0,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom3',              },// 73
 { url:'base.png',      fw:1024, frame:[100,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom4',              },// 74
 { url:'base.png',      fw:1024, frame:[200,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom5',              },// 75
 { url:'base.png',      fw:1024, frame:[300,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom6',              },// 76
 { url:'base.png',      fw:1024, frame:[400,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom7',              },// 77
 { url:'base.png',      fw:1024, frame:[500,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom8',              },// 78
 { url:'base.png',      fw:1024, frame:[600,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom9',              },// 79
 { url:'base.png',      fw:1024, frame:[700,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom10',             },// 80
 { url:'base.png',      fw:1024, frame:[800,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom11',             },// 81
 { url:'base.png',      fw:1024, frame:[900,200,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'dom12',             },// 82
 { url:'',              fw: 512, frame:[  0,  0, 32, 32], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'gen_earth',         },// 83
 { url:'',              fw: 512, frame:[ 32,  0, 32, 32], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'gen_moon',          },// 84
 { url:'',              fw: 512, frame:[ 64,  0, 32, 32], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'gen_lava',          },// 85
 { url:'',              fw: 512, frame:[ 96,  0, 32, 32], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:0, award_rule:0, name:'gen_sun',           },// 86
 { url:'station1.png',  fw: 600, frame:[  0,  0,600,600], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:1000, ai:0, award_rule:0, name:'station1',          },// 87
 { url:'base.png',      fw:1024, frame:[200,300,100,100], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.1, storage:   0, ai:1, award_rule:0, name:'platform',          },// 88
 { url:'ship.png',      fw:1024, frame:[719,  0,100,100], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'turel',             },// 89
 { url:'ship.png',      fw:1024, frame:[556,100,152,150], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'transport1',        },// 90
 { url:'ship.png',      fw:1024, frame:[252,100,152,150], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'transport2',        },// 91
 { url:'ship.png',      fw:1024, frame:[404,100,152,150], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'transport3',        },// 92
 { url:'ship.png',      fw:1024, frame:[637,  0, 82, 80], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:2, award_rule:0, name:'kaban',             },// 93
 { url:'ship.png',      fw:1024, frame:[919,  0,100,100], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'korabl3',           },// 94
 { url:'ship.png',      fw:1024, frame:[227,  0, 50, 50], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'pushka_rad',        },// 95
 { url:'ship.png',      fw:1024, frame:[100,100,152,150], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'police',            },// 96
 { url:'ship.png',      fw:1024, frame:[708,100,188,144], material:null, box:1 , hp:5000, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'youbig',            },// 97
 { url:'particle.png',  fw:1024, frame:[100,100,143, 19], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.5, storage:   0, ai:0, award_rule:0, name:'beam',              },// 98
 { url:'aster.png',     fw:1024, frame:[ 68,  0, 28, 28], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:2, name:'iron',              },// 99
 { url:'aster.png',     fw:1024, frame:[ 40,  0, 28, 28], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:3, name:'gold',              },//100
 { url:'aster.png',     fw:1024, frame:[976,  0, 28, 28], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:4, name:'platinum',          },//101
 { url:'aster.png',     fw:1024, frame:[  0,  0, 40, 40], material:null, box:0 , hp:   0, anim:1, anim_d:  0, z: 0.6, storage:   0, ai:0, award_rule:5, name:'box',               },//102
];


for (let i=0;i<STATIC_INFO.length;i++){
    let a = STATIC_INFO[i];
    let width = a.frame[2];
    a.box = (1024/100*width*a.box)/2; // размер в реальных координатах для системы box, радиус
    a.frame[0] = a.frame[0]/a.fw;
    a.frame[1] = a.frame[1]/a.fw;
    a.frame[2] = a.frame[2]/a.fw;
    a.frame[3] = a.frame[3]/a.fw;
}


const AWARD_RULE = [
    {                                       // 0 - не рабочее правило
        money             : 0,              // деньги 
        static_list       : [],             // появление контейнера или руды на карте: шанс,номер предмета,шанс,номер предмета... - список должен быть сортирован по шансам(от большего к меньшему)
        static_count      : 0,              // количество
        live_time         : 0,              // время жизни появившехся объектов в секундах
    },
    {                                       // 1 - выпадение руды с астероидов
        money             : 0,                   
        static_list       : [70,15, 60,16, 20,17],  
        static_count      : 1,                   
        live_time         : 10,                  
    },    
]


// список предметов доступных в игре, также эта таблица используется для хранения временных данных при операциях с предметами, например в рынке
// group      - пока ничего не делает
// name       - наименование
// price      - 100% цена, на каждорй станции есть процент который определяет цену этого предмета на этой станции
// desc       - описание
// static_n   - номер картинки - если объект нужно показать в виде статичного объекта на карте
// op         - операция 0-купить, 1-продать (для временного хранения при операциях торговли)
// op_count   - количество предметов по операции
// price_buy  - цена покупка
// price_sell - цена продажа
const ITEMS_INFO = [
    { group:0,  name: 'Еда',                  price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //0
    { group:1,  name: 'Ткани',                price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //1
    { group:2,  name: 'Радиоактивные',        price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //2
    { group:3,  name: 'Рабы',                 price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //3
    { group:4,  name: 'Ликероводочные',       price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //4
    { group:5,  name: 'Предметы роскоши',     price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //5
    { group:6,  name: 'Наркотики',            price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //6
    { group:7,  name: 'Компьютеры',           price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //7
    { group:8,  name: 'Станки',               price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //8
    { group:9,  name: 'Масла',                price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //9
    { group:10, name: 'Оружие',               price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //10
    { group:11, name: 'Золото',               price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //11
    { group:12, name: 'Платина',              price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //12
    { group:13, name: 'Драгоценные камни',    price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //13
    { group:14, name: 'Артефакты',            price:10,  desc:'', static_n:102, op:0, op_count:0, price_buy:0,  price_sell:0 }, //14
    { group:15, name: 'руда железо',          price:10,  desc:'', static_n:99,  op:0, op_count:0, price_buy:0,  price_sell:0 }, //15
    { group:16, name: 'руда золото',          price:20,  desc:'', static_n:100, op:0, op_count:0, price_buy:0,  price_sell:0 }, //16
    { group:17, name: 'руда платина',         price:30,  desc:'', static_n:101, op:0, op_count:0, price_buy:0,  price_sell:0 }, //17
]

//id,x,y,type,angle,status,scale,hp,cx,cy
const PLANETS_INFO = [[100001,10317,24380,86,17092,0,65535,0,26,47],[100002,44261,29884,84,16164,0,63221,0,26,47],[100003,62646,46286,84,31111,0,43917,0,26,47],[100004,14410,30209,83,9448,0,33709,0,26,46],[100005,48786,40417,84,28244,0,45442,0,25,45],[100006,54316,26206,85,42861,0,39631,0,24,44],[100007,1776,5103,85,53250,0,51692,0,25,44],[100008,64957,47174,86,50437,0,65535,0,30,9],[100009,4339,25902,85,52295,0,45467,0,31,10],[100010,50811,21888,85,61431,0,64237,0,31,11],[100011,48564,189,84,6982,0,41614,0,32,11],[100012,51255,6741,86,55097,0,65535,0,39,59],[100013,8081,13043,83,25205,0,57521,0,39,58],[100014,5108,11003,85,20302,0,48027,0,39,42],[100015,38945,37699,84,7018,0,57368,0,39,41],[100016,17041,38652,85,51665,0,51409,0,40,59],[100017,47954,6883,84,55860,0,41657,0,40,41],[100018,23261,27686,85,18613,0,47568,0,40,57],[100019,45110,57170,86,28932,0,65535,0,4,98],[100020,38187,15257,84,45431,0,62763,0,3,99],[100021,24828,48801,84,15765,0,64396,0,3,98],[100022,31667,22990,85,10736,0,33634,0,3,98],[100023,58244,55333,86,57429,0,65535,0,71,73],[100024,63317,26250,85,31955,0,41392,0,72,74],[100025,28788,34608,84,60130,0,42751,0,72,73],[100026,61409,60363,85,1874,0,45992,0,70,80],[100027,51258,9589,84,10321,0,63845,0,70,74],[100028,46037,31142,83,27010,0,47279,0,72,80],[100029,3741,22066,84,17156,0,32885,0,72,74],[100030,26508,17770,83,22078,0,49370,0,73,73],[100031,1547,2480,86,17423,0,65535,0,65,70],[100032,37433,24185,85,35884,0,41271,0,66,69],[100033,18670,51047,85,12118,0,62157,0,65,69],[100034,35923,21032,83,63475,0,47445,0,59,69],[100035,45945,35564,85,26040,0,60971,0,58,69],[100036,35834,44595,85,28871,0,33872,0,57,68],[100037,46651,56841,83,16727,0,62197,0,65,68],[100038,25425,32541,86,2966,0,65535,0,44,85],[100039,51535,63919,84,22329,0,37611,0,45,85],[100040,6060,16514,84,7352,0,33828,0,44,85],[100041,62616,10976,85,11845,0,60274,0,43,84],[100042,20896,6548,84,14512,0,34197,0,44,84],[100043,63048,26120,83,62570,0,63684,0,44,85],[100044,42865,60547,84,37704,0,41102,0,44,85],[100045,25816,44634,85,58742,0,43685,0,43,84],[100046,32539,13485,84,1262,0,65535,0,58,59],[100047,61316,39478,85,2972,0,59412,0,58,60],[100048,9664,46042,86,16286,0,62965,0,59,59],[100049,48442,418,85,3710,0,46666,0,58,59],[100050,37024,29313,86,5677,0,46179,0,59,59],[100051,1185,32759,84,330,0,46370,0,60,58],[100052,59348,62603,84,12906,0,33387,0,59,57],[100053,9532,51995,84,10974,0,37329,0,58,55],[100054,63768,58238,83,62051,0,59472,0,57,54],[100055,33944,34039,86,13395,0,65535,0,45,79],[100056,28507,40710,85,31259,0,53288,0,44,79],[100057,1878,12484,84,19284,0,64121,0,47,80],[100058,56248,31658,83,11002,0,61628,0,46,79],[100059,51883,33272,84,15597,0,52164,0,42,79],[100060,62258,58363,85,48060,0,56047,0,43,79],[100061,63951,34361,84,7928,0,48517,0,45,79],[100062,52385,45067,84,82,0,56655,0,43,78],[100063,62336,11483,84,53459,0,48091,0,43,78],[100064,29090,54816,83,16064,0,65535,0,49,59],[100065,62819,61211,85,6702,0,36364,0,46,57],[100066,49071,18162,84,38118,0,34885,0,45,57],[100067,57387,39743,85,14700,0,60198,0,45,56],[100068,8222,50217,86,22677,0,65535,0,43,12],[100069,13254,24450,85,26567,0,37356,0,44,13],[100070,15482,54697,85,34309,0,35264,0,44,12],[100071,41035,60932,85,10356,0,47296,0,43,12],[100072,20475,11909,84,13743,0,50486,0,44,12],[100073,39655,49420,84,15046,0,46221,0,43,11],[100074,18507,24691,86,6761,0,65535,0,58,69],[100075,32930,54944,85,64304,0,55721,0,58,68],[100076,33742,54055,84,32417,0,52523,0,58,69],[100077,18899,33415,85,30745,0,51690,0,64,69],[100078,28297,61737,85,41975,0,36152,0,59,69],[100079,50508,25833,84,26272,0,63597,0,64,70],[100080,33785,24364,85,47151,0,61818,0,59,68],[100081,8702,1860,86,38605,0,65535,0,50,85],[100082,38709,45436,84,8791,0,41343,0,49,85],[100083,18952,25692,85,49695,0,39808,0,50,85],[100084,10546,62359,83,63253,0,43922,0,49,84],[100085,65384,52205,84,21762,0,62753,0,47,83],[100086,4820,32334,86,11188,0,65535,0,55,18],[100087,40970,30210,84,46796,0,57743,0,55,17],[100088,56814,58727,84,65246,0,41130,0,54,16],[100089,20131,15148,84,21940,0,56937,0,54,17],[100090,41259,33939,84,22995,0,42973,0,53,16],[100091,26681,11448,85,245,0,41329,0,53,17],[100092,40967,32289,84,54561,0,61229,0,53,17],[100093,13972,16343,86,64757,0,65535,0,67,36],[100094,14790,44640,84,8458,0,49757,0,67,37],[100095,13345,64045,84,47803,0,58797,0,66,36],[100096,26339,50823,84,27413,0,58398,0,67,36],[100097,36291,41535,83,41934,0,63892,0,66,35],[100098,23076,52046,84,50583,0,34185,0,65,35],[100099,8853,47652,84,3179,0,33614,0,64,34],[100100,30615,422,86,28987,0,65535,0,44,90],[100101,52900,39007,84,26721,0,57975,0,44,89],[100102,29641,59593,84,55503,0,39636,0,45,89],[100103,30988,31795,84,3351,0,36768,0,44,88],[100104,29010,50676,84,46008,0,33794,0,45,88],[100105,11592,54061,85,64343,0,34042,0,46,87],[100106,25268,50383,86,30020,0,65535,0,96,27],[100107,42422,52475,84,46638,0,50777,0,95,27],[100108,26359,3122,84,54062,0,38478,0,96,27],[100109,17202,24460,85,39004,0,57998,0,97,27],[100110,55777,39008,85,27788,0,33351,0,98,27],[100111,32100,43479,85,43759,0,51413,0,97,28],[100112,46148,32061,86,61934,0,65535,0,96,49],[100113,65091,56994,84,22242,0,62060,0,95,49],[100114,39981,58913,85,29706,0,60332,0,94,49],[100115,7028,41880,85,21172,0,46483,0,94,49],[100116,37723,49290,85,3220,0,42219,0,93,48],[100117,3161,26699,85,61764,0,51780,0,93,48],[100118,16159,18566,86,19380,0,65535,0,12,2],[100119,19874,47766,84,6882,0,38496,0,11,1],[100120,7553,13489,84,38673,0,64568,0,11,2],[100121,46638,27563,85,33537,0,37598,0,11,1],[100122,37019,16303,85,60549,0,32801,0,10,0],[100123,63462,47340,85,22657,0,46400,0,9,0],[100124,45522,3700,84,51945,0,40868,0,8,1],[100125,34677,55859,85,20736,0,61101,0,7,0],[100126,11547,31972,85,15150,0,64221,0,7,1],[100127,51238,47990,86,24143,0,65535,0,23,95],[100128,12705,25241,84,636,0,47896,0,24,95],[100129,60105,49043,85,30228,0,49977,0,24,96],[100130,11215,24148,85,44428,0,43620,0,24,95],[100131,29578,47388,85,20585,0,52496,0,25,94],[100132,8556,3247,84,17628,0,64682,0,26,94],[100133,22213,1083,85,27961,0,35770,0,27,95],[100134,27160,26757,84,41773,0,41943,0,27,96],[100135,30712,49959,86,35165,0,65535,0,32,58],[100136,27990,9548,85,63,0,36470,0,32,58],[100137,55934,16628,83,53002,0,49161,0,31,58],[100138,23283,27094,84,4776,0,35322,0,31,59],[100139,19935,36039,85,64798,0,65430,0,31,60],[100140,42560,13089,85,60213,0,35869,0,30,60],[100141,57810,37120,84,44492,0,63332,0,29,60],[100142,56058,15819,86,39693,0,65535,0,69,92],[100143,2563,13850,85,3899,0,35801,0,70,93],[100144,59262,47538,85,41552,0,61970,0,70,92],[100145,4052,45572,84,36933,0,59971,0,72,91],[100146,12114,12210,86,38979,0,65535,0,96,52],[100147,43422,45189,85,13680,0,62131,0,96,52],[100148,1326,14056,85,24383,0,51394,0,97,52],[100149,35548,30910,85,44180,0,43523,0,97,51],[100150,49971,20038,84,55076,0,49552,0,97,51],[100151,48042,29682,86,51598,0,65535,0,70,32],[100152,59689,51786,84,700,0,47689,0,69,32],[100153,45891,33312,84,12447,0,44360,0,68,32],[100154,31515,49864,84,47614,0,39643,0,69,31],[100155,52900,26858,85,38627,0,43631,0,68,31],[100156,41736,29754,85,15910,0,45730,0,68,32],[100157,15991,32398,85,57370,0,49480,0,68,31],[100158,24150,26272,85,30542,0,46393,0,68,32],[100159,57049,62484,86,28374,0,65535,0,28,20],[100160,30531,25915,84,27195,0,38523,0,28,21],[100161,58711,38911,84,32476,0,58100,0,28,22],[100162,42881,7758,85,54821,0,34400,0,28,22],[100163,48894,10513,85,2291,0,35036,0,27,23],[100164,40672,6011,84,34778,0,38723,0,28,24],[100165,21269,1122,86,7365,0,65535,0,49,26],[100166,3560,35804,85,61534,0,36359,0,50,26],[100167,62480,64629,85,58571,0,36823,0,50,26],[100168,61885,42120,84,316,0,59674,0,49,24],[100169,45409,43178,83,43525,0,39633,0,48,24],[100170,7830,48372,85,60877,0,54814,0,47,23],[100171,23442,26367,84,47992,0,36941,0,46,22],[100172,2986,11827,86,38519,0,65535,0,98,69],[100173,35544,3643,84,4970,0,45220,0,98,70],[100174,44217,62668,84,7446,0,41004,0,96,69],[100175,55722,30171,85,50600,0,45138,0,94,69],[100176,52409,39601,85,20316,0,47968,0,93,70],[100177,13011,30295,85,40645,0,49745,0,93,69],[100178,8969,35982,85,30079,0,41064,0,94,68],[100179,56960,5207,86,22770,0,65535,0,72,13],[100180,15483,21296,84,8630,0,63045,0,73,12],[100181,56675,54190,85,57737,0,55114,0,73,12],[100182,20927,64481,84,9776,0,41702,0,74,10],[100183,25502,51416,85,49855,0,65161,0,74,9],[100184,43156,19829,85,25158,0,62439,0,74,8],[100185,9661,21413,85,34950,0,52383,0,75,7],[100186,8891,16383,84,43507,0,57788,0,76,8],[100187,28813,48065,85,40231,0,59493,0,77,8],[100188,55452,27514,84,42307,0,35115,0,77,9],[100189,22443,89,86,41956,0,65535,0,11,56],[100190,8326,21918,85,22630,0,57953,0,11,55],[100191,46124,54618,85,62080,0,37932,0,10,53],[100192,6451,33209,84,41462,0,52042,0,10,52],[100193,47621,25290,85,4037,0,64492,0,10,52],[100194,16868,31688,84,16370,0,45153,0,10,51],[100195,32346,34352,86,39254,0,65535,0,2,74],[100196,58103,23377,84,41831,0,53432,0,2,75],[100197,25688,19446,85,18279,0,50091,0,2,76],[100198,43910,44095,85,25532,0,39828,0,1,77],[100199,42378,9265,85,41488,0,48038,0,1,78],[100200,34678,15868,84,50285,0,60667,0,2,78],[100201,22662,19879,84,6098,0,62379,0,3,78],[100202,45434,63055,85,21716,0,36374,0,4,78],[100203,51184,34352,84,351,0,52662,0,4,79],[100204,21978,33533,84,31124,0,57656,0,5,78],[100205,10210,46010,86,25714,0,65535,0,19,79],[100206,14795,32379,85,52733,0,51466,0,18,80],[100207,40779,1235,84,51948,0,36929,0,18,80],[100208,55335,34678,84,39804,0,56349,0,17,79],[100209,14282,33569,85,18748,0,53825,0,17,80],[100210,63840,29411,85,35831,0,35856,0,17,80],[100211,38827,19657,84,42646,0,33068,0,17,81],[100212,12847,3119,84,44741,0,48717,0,18,81],[100213,21168,3280,84,27538,0,36327,0,17,81],[100214,49606,53461,86,16764,0,65535,0,54,75],[100215,19862,42106,84,24181,0,34447,0,54,74],[100216,45299,15452,83,28676,0,33107,0,55,76],[100217,29743,21441,84,26011,0,52801,0,55,74],[100218,10029,43607,86,13798,0,65535,0,81,4],[100219,39069,63951,85,61708,0,61206,0,80,4],[100220,40848,26850,85,52254,0,42949,0,81,4],[100221,29430,7544,84,41964,0,46791,0,81,4],[100222,32090,34668,85,30736,0,54468,0,81,5],[100223,62293,8488,85,44130,0,58080,0,79,6],[100224,44015,27873,84,64482,0,42989,0,78,5],[100225,21728,50948,85,52710,0,43978,0,77,4],[100226,37370,33269,86,8751,0,65535,0,49,74],[100227,53187,50271,84,21161,0,46254,0,49,73],[100228,24986,65507,83,39572,0,48577,0,50,74],[100229,26794,17378,84,6685,0,62577,0,51,75],[100230,11889,13304,84,2667,0,40981,0,52,76],[100231,32189,30523,84,19581,0,64350,0,51,76],[100232,60580,2486,84,42461,0,58013,0,50,76],[100233,43506,2634,84,50365,0,36282,0,50,77],[100234,17992,44172,84,14523,0,54221,0,48,75],[100235,31113,49420,85,4005,0,37919,0,51,76],[100236,9669,4539,86,55907,0,65535,0,59,55],[100237,54230,45012,85,42914,0,61319,0,58,55],[100238,21076,8670,85,48242,0,35617,0,60,54],[100239,64078,21106,85,47961,0,45398,0,59,55],[100240,64292,56849,84,65108,0,44262,0,58,54],[100241,42207,64806,85,46352,0,45053,0,58,53],[100242,22057,61196,84,34580,0,46157,0,57,51],[100243,55973,61038,87,39164,0,43812,0,57,54],[100244,63116,1306,86,34246,0,65535,0,47,34],[100245,64896,40874,83,24105,0,52800,0,48,33],[100246,14687,7115,85,40712,0,44559,0,49,32],[100247,23752,33909,84,20257,0,33842,0,49,32],[100248,32618,7411,86,51759,0,65535,0,61,96],[100249,41646,58865,85,60313,0,41555,0,62,96],[100250,22271,58103,85,1540,0,34640,0,63,94],[100251,659,46850,85,41147,0,54784,0,64,93],[100252,60278,51952,85,31855,0,54335,0,63,91],[100253,18111,39405,85,20511,0,41674,0,64,90],[100254,43410,1602,85,33755,0,48374,0,63,91],[100255,13562,25137,86,34565,0,65535,0,6,42],[100256,19525,37786,85,41471,0,64165,0,6,41],[100257,54328,60195,84,6574,0,40112,0,6,41],[100258,24489,15672,85,48460,0,51796,0,5,40],[100259,25783,40380,85,61252,0,65210,0,5,41],[100260,4982,4754,86,9702,0,65535,0,90,32],[100261,48775,61154,85,28954,0,42040,0,90,30],[100262,33516,62771,85,56332,0,49040,0,90,30],[100263,11184,44837,84,48010,0,45483,0,90,30],[100264,64815,22382,85,2122,0,60890,0,88,30],[100265,29223,26916,84,19584,0,53403,0,87,30],[100266,43817,47252,85,8964,0,46306,0,87,28],[100267,492,26880,86,286,0,65535,0,94,71],[100268,31981,72,84,42292,0,34294,0,94,72],[100269,22985,22205,84,2861,0,58144,0,94,71],[100270,15547,15564,84,31269,0,56748,0,94,72],[100271,5981,17611,85,532,0,35603,0,95,72],[100272,27634,18275,84,39749,0,50518,0,94,72],[100273,61407,49076,84,50338,0,55724,0,94,71],[100274,59924,19731,85,21775,0,57912,0,94,71],[100275,41429,49566,86,22510,0,65535,0,22,58],[100276,18448,48805,84,46698,0,49027,0,22,59],[100277,30446,64804,85,29469,0,64335,0,21,59],[100278,19446,33163,85,10316,0,36045,0,21,58],[100279,2841,28976,85,17668,0,59956,0,22,58],[100280,48341,7545,85,35937,0,45417,0,22,60],[100281,58504,29775,84,43081,0,34474,0,22,59],[100282,62526,1773,84,9823,0,51067,0,23,60],[100283,12602,30794,86,31439,0,65535,0,57,15],[100284,61266,35402,84,14155,0,37606,0,57,15],[100285,38053,25046,85,37659,0,51585,0,58,15],[100286,20493,13506,85,30795,0,64686,0,57,16],[100287,28064,6545,86,115,0,65535,0,4,4],[100288,26508,60662,84,42232,0,34598,0,3,4],[100289,22662,29973,84,59543,0,38082,0,4,4],[100290,17772,11890,84,1756,0,38889,0,4,5],[100291,43078,25597,84,19091,0,49200,0,4,6],[100292,46768,61663,84,17017,0,55717,0,4,6],[100293,16092,33242,85,14885,0,47002,0,3,5],[100294,49988,31691,84,26757,0,55178,0,3,4],[100295,61137,2533,86,38070,0,65535,0,97,35],[100296,4732,33384,85,22330,0,62585,0,97,34],[100297,15789,27385,85,62709,0,44112,0,99,33],[100298,51534,27880,84,26671,0,33245,0,98,33],[100299,13157,53474,84,3108,0,58875,0,99,33],[100300,1132,11526,84,28710,0,57149,0,99,32],[100301,32486,41583,84,38998,0,59732,0,99,31],[100302,57754,13626,83,62418,0,65535,0,52,44],[100303,2162,13689,84,9736,0,62880,0,52,44],[100304,46697,1866,85,36898,0,44865,0,53,44],[100305,45568,61273,85,9472,0,62038,0,52,43],[100306,14430,49606,86,44682,0,47758,0,52,43],[100307,36643,56188,85,5116,0,47004,0,51,42],[100308,62516,63241,84,50034,0,50105,0,52,43],[100309,33569,2617,85,14118,0,43290,0,53,41],[100310,35669,4609,86,15037,0,65535,0,85,67],[100311,54968,7714,85,36605,0,54942,0,83,68],[100312,22537,64975,83,47993,0,41362,0,85,65],[100313,43993,40889,85,36297,0,62578,0,85,65],[100314,60063,31216,84,50153,0,40347,0,74,68],[100315,4212,47257,84,53268,0,53902,0,87,65],[100316,1917,3667,86,13279,0,62468,0,75,70],[100317,110,23315,84,41105,0,46811,0,86,67],[100318,16172,52899,85,4067,0,57731,0,76,70],[100319,21700,6101,83,48770,0,51684,0,77,70],[100320,32689,11539,86,7957,0,65535,0,88,9],[100321,51428,20638,85,52514,0,35976,0,87,10],[100322,30508,41483,85,23820,0,34430,0,87,9],[100323,22560,27371,84,8370,0,45783,0,87,8],[100324,42841,41138,84,23119,0,39590,0,87,9],[100325,9447,27115,84,21518,0,54321,0,87,8],[100326,26156,64963,86,56374,0,65535,0,5,31],[100327,2410,8846,85,38951,0,57518,0,5,33],[100328,32975,62696,84,6200,0,33865,0,4,34],[100329,48445,36129,84,19403,0,36267,0,4,34],[100330,33749,36336,84,6422,0,37533,0,5,35],[100331,65095,29037,86,34692,0,65535,0,11,27],[100332,49851,59165,85,3548,0,32916,0,11,26],[100333,44838,13012,85,33737,0,53305,0,11,25],[100334,42768,37845,85,44734,0,45803,0,11,26],[100335,24198,15729,85,33470,0,47293,0,12,27],[100336,22713,9220,85,17222,0,54202,0,12,28],[100337,52936,49624,85,37117,0,59875,0,13,28],[100338,53980,20792,85,30328,0,43518,0,14,28],[100339,55589,48755,85,43818,0,62932,0,14,27],[100340,32405,22318,85,55050,0,45226,0,14,27],[100341,49111,17923,86,33115,0,65535,0,83,14],[100342,5236,63690,84,2990,0,60760,0,84,12],[100343,30709,34075,85,2846,0,54567,0,83,11],[100344,56217,64288,85,7079,0,56048,0,83,11],[100345,39105,35745,85,64600,0,36563,0,83,10],[100346,42503,53776,86,22342,0,65535,0,88,45],[100347,1807,56761,84,49042,0,50575,0,89,46],[100348,3580,39784,84,14501,0,50180,0,90,45],[100349,31468,29034,85,38406,0,52150,0,91,45],[100350,26284,48356,84,34049,0,62493,0,92,45],[100351,50488,43186,84,31948,0,43563,0,91,44],[100352,15721,15542,85,59331,0,41072,0,91,45],[100353,8456,28089,85,56380,0,52406,0,92,45],[100354,14015,59953,85,18595,0,55829,0,93,45],[100355,10770,22608,84,29178,0,50592,0,94,46],[100356,29313,31868,86,21995,0,65535,0,87,13],[100357,20629,31656,84,64063,0,41904,0,88,13],[100358,57510,11894,85,24293,0,35655,0,88,12],[100359,34612,10436,84,54022,0,61419,0,87,12],[100360,28885,32458,85,22292,0,58444,0,87,11],[100361,30335,12432,84,62364,0,43388,0,86,12],[100362,41828,58128,85,53303,0,40645,0,85,12],[100363,1063,45910,84,13943,0,59351,0,86,13],[100364,17206,33065,86,15754,0,65535,0,80,16],[100365,40029,25550,85,40673,0,34904,0,79,17],[100366,24937,54613,85,11206,0,64832,0,78,16],[100367,20297,57285,85,25966,0,63506,0,79,16],[100368,29369,9202,84,45282,0,59433,0,79,17],[100369,2191,27019,84,41254,0,34859,0,78,17],[100370,16235,38701,85,52517,0,35891,0,77,18],[100371,14722,35725,86,13281,0,65535,0,48,59],[100372,6429,1830,85,17064,0,49333,0,48,61],[100373,18345,6264,85,7601,0,46032,0,47,62],[100374,64579,16718,84,55826,0,34429,0,47,62],[100375,26032,1670,84,51117,0,48919,0,46,63],[100376,51971,62,85,36177,0,60999,0,45,64],[100377,6528,19253,85,44163,0,45130,0,38,59],[100378,20846,38783,84,33932,0,46132,0,46,64],[100379,23834,28973,86,20222,0,65535,0,81,40],[100380,45982,6817,84,1229,0,47072,0,82,40],[100381,20039,50156,84,27951,0,48144,0,83,39],[100382,23771,36824,84,55086,0,46374,0,84,38],[100383,32147,23939,85,34362,0,40761,0,83,37],[100384,16530,6162,85,17759,0,57595,0,82,37],[100385,39131,47077,84,28106,0,48648,0,83,36],[100386,32659,4899,84,22227,0,40122,0,82,36],[100387,6821,36369,85,44091,0,38023,0,81,36],[100388,55223,13165,85,46581,0,41442,0,81,36],[100389,65022,6442,86,52267,0,65535,0,41,48],[100390,8568,62457,85,25168,0,54617,0,41,47],[100391,19287,48595,85,60731,0,57766,0,42,48],[100392,5239,14541,84,30963,0,45879,0,43,48],[100393,57742,23652,83,42515,0,32998,0,40,48],[100394,40863,19091,86,34171,0,65535,0,1,93],[100395,20186,38446,85,10798,0,61120,0,2,92],[100396,14826,31426,85,30297,0,53588,0,3,91],[100397,14429,11354,84,7802,0,63421,0,4,90],[100398,57604,17809,84,11993,0,38769,0,3,90],[100399,62045,65385,84,29926,0,57795,0,3,90],[100400,6616,58515,84,33252,0,48688,0,4,90],[100401,15911,55752,84,7909,0,57546,0,4,89],[100402,8765,28120,86,65525,0,65535,0,77,1],[100403,4614,7553,85,5806,0,59432,0,76,2],[100404,55222,51236,84,22683,0,36804,0,75,1],[100405,42751,15233,84,7961,0,63265,0,75,0],[100406,56874,43686,84,25154,0,63876,0,75,0],[100407,35426,16960,84,25013,0,57437,0,74,15],[100408,47506,38285,86,14883,0,65535,0,73,39],[100409,60691,54160,85,17296,0,33031,0,73,38],[100410,59761,44817,84,58313,0,46357,0,72,37],[100411,1866,831,84,16970,0,65318,0,72,37],[100412,61742,47450,85,60995,0,65228,0,71,38],[100413,19582,54253,85,60349,0,50431,0,72,38],[100414,15859,58009,85,61672,0,40531,0,72,38],[100415,12482,26970,84,6417,0,57822,0,72,37],[100416,31761,18227,84,53522,0,34217,0,72,38],[100417,28587,47545,84,3600,0,65259,0,72,37],[100418,27700,61434,83,55293,0,65535,0,57,46],[100419,65219,7946,85,7666,0,34864,0,57,47],[100420,225,26194,86,45799,0,52508,0,58,47],[100421,29651,61564,84,45511,0,50080,0,58,48],[100422,54788,65529,84,50972,0,48855,0,57,47],[100423,35044,3747,86,59765,0,65535,0,38,20],[100424,7351,27364,84,26971,0,37799,0,39,21],[100425,4667,25425,84,15862,0,36412,0,40,20],[100426,8152,50086,84,55859,0,59442,0,40,19],[100427,17245,20509,85,46964,0,59867,0,40,20],[100428,57950,35427,84,27067,0,57697,0,40,20],[100429,48,1781,86,18456,0,65535,0,19,51],[100430,59688,52248,85,60651,0,65279,0,17,51],[100431,57357,13916,84,44190,0,57035,0,16,50],[100432,54640,53243,85,24088,0,52889,0,15,50],[100433,39434,27563,85,7053,0,44256,0,15,50],[100434,43768,663,85,41373,0,44386,0,15,50],[100435,8794,63352,84,3667,0,65535,0,49,54],[100436,50616,36160,83,41569,0,34170,0,48,54],[100437,36046,43987,85,35467,0,38210,0,48,53],[100438,31792,44841,83,40430,0,50081,0,47,52],[100439,26117,13561,86,59032,0,55720,0,47,53],[100440,59254,51091,85,61581,0,45774,0,47,52],[100441,32871,4945,84,40561,0,61157,0,46,52],[100442,6162,16673,84,50053,0,36031,0,46,51],[100443,60440,14247,85,41913,0,43184,0,45,50],[100444,16802,54086,85,30852,0,59359,0,52,48],[100445,64786,64096,86,55193,0,65535,0,83,1],[100446,2336,55939,84,26074,0,61487,0,83,2],[100447,550,20157,84,42704,0,60061,0,85,3],[100448,20173,38861,84,11638,0,44307,0,85,3],[100449,13658,39324,86,30627,0,65535,0,45,38],[100450,23690,14447,85,17642,0,54950,0,44,39],[100451,53988,27649,83,43924,0,51241,0,44,39],[100452,64796,10829,84,36314,0,35363,0,43,40],[100453,42103,55378,84,52123,0,56845,0,42,41],[100454,14592,39839,85,34881,0,49954,0,42,40],[100455,4406,8448,85,4932,0,56197,0,42,41],[100456,52456,18246,85,15933,0,62225,0,40,41],[100457,28783,2628,83,45321,0,34326,0,40,41],[100458,45473,2784,85,45445,0,58249,0,40,42],[100459,17644,50355,86,40887,0,65535,0,34,33],[100460,7381,20171,84,43798,0,54251,0,33,33],[100461,6884,29998,85,56165,0,35917,0,34,33],[100462,13912,47291,85,7150,0,46708,0,35,33],[100463,48223,58388,83,19681,0,48249,0,34,32],[100464,18926,45164,84,58011,0,62431,0,33,32],[100465,1609,875,84,59411,0,32862,0,33,34],[100466,40640,25429,86,23383,0,65535,0,93,71],[100467,33241,45672,84,40211,0,65154,0,92,71],[100468,49495,52022,84,86,0,37092,0,92,70],[100469,61446,52994,84,34315,0,51179,0,92,71],[100470,33178,43439,84,41934,0,61063,0,92,72],[100471,32858,14245,85,8371,0,51939,0,91,73],[100472,7953,29257,85,58700,0,63863,0,92,73],[100473,25972,55579,85,26208,0,33201,0,93,73],[100474,57825,47984,86,10206,0,65535,0,99,25],[100475,30168,43257,84,59782,0,59738,0,99,26],[100476,45202,47716,84,14171,0,64282,0,99,26],[100477,59248,54864,85,49691,0,55884,0,99,26],[100478,62785,39933,86,62975,0,65535,0,53,24],[100479,54806,24547,85,25815,0,54592,0,53,25],[100480,34897,9762,83,33849,0,57652,0,54,25],[100481,17915,51507,84,54905,0,41867,0,55,26],[100482,39551,20102,86,24664,0,65535,0,39,41],[100483,50491,18489,84,22401,0,41355,0,38,40],[100484,53342,58236,85,11398,0,58216,0,37,39],[100485,62127,822,84,20830,0,45279,0,31,39],[100486,61151,112,83,9246,0,40853,0,31,38],[100487,25310,4671,85,63334,0,56202,0,31,39],[100488,122,63791,85,4397,0,44154,0,31,37],[100489,15805,27342,85,51835,0,57594,0,32,37],[100490,37903,63232,84,16728,0,47095,0,31,39],[100491,44571,48332,86,23320,0,52459,0,31,38],[100492,44003,9252,86,53141,0,65535,0,91,74],[100493,6474,16287,85,57321,0,60480,0,91,74],[100494,27933,26263,85,33913,0,37781,0,91,75],[100495,10927,57165,85,49122,0,49592,0,92,75],[100496,47584,8238,85,51251,0,50639,0,92,76],[100497,63734,49561,85,37989,0,55965,0,74,69],[100498,21241,51926,86,54789,0,65535,0,97,11],[100499,5059,21615,85,20011,0,41027,0,97,12],[100500,45650,62268,85,25047,0,45247,0,96,12],[100501,16332,23745,85,59931,0,56323,0,97,12],[100502,45681,35361,85,45845,0,34768,0,98,12],[100503,53591,17113,85,29284,0,34796,0,97,13],[100504,54827,50547,85,57377,0,46262,0,97,13],[100505,37886,2343,84,31613,0,64479,0,98,14],[100506,38518,21892,86,55316,0,65535,0,69,64],[100507,63222,35187,84,40611,0,47744,0,68,64],[100508,33726,58437,85,22797,0,49221,0,68,64],[100509,46538,22886,85,60074,0,49580,0,69,64],[100510,16451,57387,85,44652,0,56114,0,68,64],[100511,28039,11784,83,41847,0,35075,0,69,63],[100512,53537,23939,86,43672,0,65535,0,25,6],[100513,63602,444,84,30712,0,49311,0,24,7],[100514,55390,13830,85,3861,0,61061,0,23,8],[100515,3500,52973,84,28496,0,37318,0,23,8],[100516,51100,22930,84,43264,0,38304,0,22,7],[100517,21062,28210,86,25325,0,65535,0,50,19],[100518,32072,46208,83,31739,0,39001,0,50,18],[100519,39748,44618,85,39748,0,62928,0,51,20],[100520,58418,50807,85,24822,0,36365,0,50,20],[100521,53145,26757,84,25143,0,51015,0,49,20],[100522,29449,10965,86,30737,0,65535,0,73,81],[100523,20406,52688,84,8846,0,53870,0,72,75],[100524,56148,9666,84,65243,0,49031,0,71,81],[100525,33913,37129,84,54978,0,55797,0,73,83],[100526,60331,16142,85,41158,0,41404,0,73,81],[100527,30355,57381,84,6223,0,55340,0,73,80],[100528,16624,637,85,27318,0,52340,0,74,74],[100529,26096,59713,84,62152,0,64245,0,73,79],[100530,15741,17319,85,4909,0,40681,0,73,79],[100531,14939,2121,86,27774,0,65535,0,91,71],[100532,4655,52433,84,7990,0,36986,0,92,69],[100533,34528,55716,84,32043,0,45690,0,93,68],[100534,2906,48581,85,7894,0,35262,0,94,68],[100535,14329,35081,85,3024,0,35902,0,95,68],[100536,32699,25180,85,8335,0,62277,0,94,67],[100537,60515,2059,85,30857,0,51449,0,93,66],[100538,45203,21804,86,10549,0,65535,0,56,41],[100539,59361,44974,84,22074,0,44692,0,55,40],[100540,26393,56010,85,64896,0,52894,0,54,40],[100541,62112,58120,84,2751,0,58298,0,54,39],[100542,41590,7928,84,23132,0,57531,0,54,40],[100543,10674,28405,86,3530,0,65535,0,35,11],[100544,50303,4308,84,841,0,64583,0,33,11],[100545,62140,2340,85,54264,0,48597,0,31,11],[100546,60132,53491,85,17873,0,52532,0,31,10],[100547,48788,36887,84,52002,0,56163,0,30,11],[100548,38288,63998,86,14440,0,65535,0,79,1],[100549,23762,38654,84,43435,0,53271,0,78,2],[100550,37612,31263,84,14986,0,52765,0,78,1],[100551,14570,18004,85,55151,0,52130,0,78,1],[100552,60229,26643,84,43071,0,41537,0,79,1],[100553,40812,11937,84,10509,0,48673,0,80,1],[100554,46104,16791,84,33145,0,34784,0,81,1],[100555,16303,22101,84,1229,0,58320,0,80,2],[100556,29977,65108,85,12906,0,43692,0,80,3],[100557,20460,48153,86,31449,0,65535,0,21,73],[100558,17351,56992,85,41375,0,33345,0,22,73],[100559,62267,46130,84,9310,0,47682,0,22,73],[100560,40515,31559,85,15897,0,51121,0,21,74],[100561,1812,5196,85,11971,0,51107,0,22,75],[100562,18549,39198,86,58191,0,65535,0,96,56],[100563,65101,39273,85,10769,0,44234,0,95,57],[100564,9810,22887,85,51863,0,56177,0,94,58],[100565,51457,24701,84,12903,0,44834,0,94,59],[100566,28102,12165,84,1427,0,33795,0,93,59],[100567,41119,1472,84,40330,0,60732,0,92,60],[100568,54855,65503,86,40993,0,65535,0,35,98],[100569,31875,5657,84,25021,0,45511,0,34,99],[100570,55569,32997,84,23839,0,44662,0,35,99],[100571,1620,63505,85,20452,0,56350,0,35,98],[100572,3089,7398,85,11725,0,35645,0,36,98],[100573,44273,46861,85,41320,0,49704,0,35,98],[100574,8630,33626,84,13473,0,54262,0,36,99],[100575,15161,33441,86,51718,0,65535,0,28,18],[100576,29120,42623,85,33495,0,59163,0,27,17],[100577,16693,40822,85,18754,0,62134,0,28,16],[100578,32733,64984,85,61447,0,50605,0,27,16],[100579,61726,18281,85,59126,0,35004,0,27,17],[100580,40165,683,84,35023,0,44884,0,27,18],[100581,22396,30673,84,52612,0,34021,0,26,19],[100582,63863,6172,85,6911,0,58170,0,25,20],[100583,8089,52051,84,55452,0,59474,0,26,20],[100584,60621,64844,85,34305,0,53338,0,24,20],[100585,38967,57799,86,8769,0,65535,0,96,58],[100586,51572,27660,84,59678,0,37928,0,95,59],[100587,1620,20134,84,8715,0,38425,0,96,59],[100588,27945,61383,84,36579,0,51509,0,96,60],[100589,13458,52963,85,24193,0,56137,0,97,61],[100590,54706,11547,84,9272,0,62809,0,98,61],[100591,32292,37257,86,6370,0,65535,0,3,76],[100592,56659,12500,85,36719,0,50109,0,3,75],[100593,10540,63690,85,10748,0,37677,0,2,74],[100594,56021,29578,85,20906,0,53450,0,1,73],[100595,58357,29231,86,10422,0,65535,0,94,63],[100596,6275,61685,85,60753,0,47214,0,94,63],[100597,12764,24478,84,38471,0,34719,0,95,62],[100598,35749,17248,84,4939,0,45436,0,94,62],[100599,13879,27563,85,922,0,52629,0,95,63],[100600,23541,50449,85,24001,0,48993,0,96,63],[100601,64876,18687,86,36976,0,65535,0,2,53],[100602,35601,22153,84,36413,0,43657,0,3,52],[100603,25594,64031,85,13537,0,57146,0,4,51],[100604,34015,38119,85,49733,0,51817,0,4,52],[100605,29376,12008,84,42323,0,35292,0,4,53],[100606,51751,15409,85,9810,0,46549,0,5,52],[100607,1465,4633,84,46026,0,57814,0,7,53],[100608,6691,14626,85,43396,0,44469,0,7,53],[100609,5867,12303,84,22132,0,40859,0,7,52],[100610,4228,43127,86,19380,0,65535,0,68,94],[100611,35055,15223,85,41067,0,58055,0,67,94],[100612,7931,33351,85,6839,0,43688,0,67,95],[100613,6985,51325,85,11973,0,54546,0,66,94],[100614,3849,26956,84,65024,0,43729,0,66,93],[100615,53347,21274,84,64449,0,55003,0,66,94],[100616,14250,32917,85,13527,0,58851,0,65,93],[100617,13444,39977,85,49636,0,43147,0,65,92],[100618,116,62544,84,17166,0,56036,0,66,92],[100619,39850,27496,86,57638,0,65535,0,56,33],[100620,5847,37723,85,28890,0,63657,0,57,33],[100621,9378,1077,85,27701,0,56831,0,58,34],[100622,13052,55609,84,60431,0,64338,0,59,33],[100623,1059,41562,86,20363,0,65535,0,39,25],[100624,36187,215,84,36630,0,39316,0,39,26],[100625,39548,4682,85,42786,0,51083,0,39,27],[100626,40630,13984,83,10961,0,51218,0,38,27],[100627,29798,13323,84,65454,0,64814,0,37,27],[100628,43665,52470,86,6795,0,65535,0,3,54],[100629,10501,44710,85,58367,0,38383,0,4,54],[100630,62698,20399,84,36615,0,35189,0,3,55],[100631,35998,52342,85,51169,0,38889,0,3,54],[100632,1272,45913,84,14569,0,47674,0,4,55],[100633,22426,37298,85,26170,0,52655,0,5,55],[100634,53885,39462,84,23336,0,36128,0,5,56],[100635,26681,63633,85,22758,0,35252,0,4,56],[100636,23706,38169,85,4256,0,34717,0,3,56],[100637,2390,41593,86,45938,0,65535,0,31,23],[100638,29018,54063,84,33691,0,37062,0,31,24],[100639,56227,34964,84,15401,0,43540,0,31,24],[100640,2735,45301,85,37131,0,32835,0,32,24],[100641,5352,31279,84,54103,0,48535,0,32,23],[100642,38802,48755,83,14125,0,65535,0,66,48],[100643,13409,31851,85,34481,0,65285,0,67,48],[100644,63961,27007,86,63590,0,40312,0,66,49],[100645,18805,56811,85,56660,0,60968,0,67,49],[100646,63782,20823,85,63609,0,50744,0,67,50],[100647,9162,24744,84,43338,0,45024,0,67,51],[100648,33294,19028,85,30159,0,51505,0,67,52],[100649,64159,6229,85,33868,0,45699,0,66,52],[100650,29546,46322,84,52401,0,46446,0,67,53],[100651,58769,10317,86,25692,0,65535,0,25,1],[100652,38045,48328,85,40058,0,58267,0,25,0],[100653,27942,23849,84,14283,0,33012,0,25,0],[100654,51477,0,84,10478,0,34798,0,24,0],[100655,2212,0,84,28548,0,58740,0,25,0],[100656,34086,64898,84,20669,0,43730,0,25,0],[100657,11419,0,84,40438,0,60480,0,25,0],[100658,32012,56846,85,22878,0,50119,0,25,0],[100659,5435,14066,86,34499,0,65535,0,8,85],[100660,4793,57859,84,40011,0,61568,0,8,85],[100661,30093,49516,85,11307,0,51882,0,8,85],[100662,51300,38633,84,63644,0,65203,0,6,85],[100663,48300,50764,85,18812,0,59057,0,5,84],[100664,46148,29936,86,64068,0,65535,0,0,9],[100665,50513,6449,85,55864,0,40910,0,0,10],[100666,4295,27828,84,58136,0,35236,0,2,10],[100667,13239,64978,84,56351,0,59230,0,2,9],[100668,5946,30036,84,56531,0,49508,0,3,8],[100669,48613,41454,84,58171,0,33437,0,3,7],[100670,41557,49037,85,9576,0,41104,0,3,6],[100671,27513,18888,84,43437,0,59408,0,2,6],[100672,21882,1701,84,51567,0,48198,0,1,7],[100673,52423,10272,84,35647,0,33106,0,1,6],[100674,57205,8666,86,14290,0,65535,0,56,87],[100675,11060,55961,85,433,0,59896,0,56,87],[100676,64749,58804,83,13537,0,54806,0,57,87],[100677,38115,37136,85,26096,0,54204,0,57,87],[100678,10407,45543,84,12322,0,46046,0,57,86],[100679,57134,27504,86,54242,0,65535,0,68,9],[100680,9662,50770,85,43936,0,42032,0,70,9],[100681,57893,31196,85,14368,0,43500,0,70,10],[100682,4499,21215,85,20770,0,61254,0,71,9],[100683,65129,14314,85,20308,0,57350,0,72,9],[100684,28938,29848,86,25921,0,65535,0,51,49],[100685,10773,9679,84,64197,0,50001,0,51,50],[100686,57872,42364,83,45740,0,41084,0,50,50],[100687,6649,61623,84,29128,0,42538,0,52,50],[100688,8872,19023,85,37374,0,52391,0,50,48],[100689,59896,37874,87,0,0,65535,0,48,33],[100690,15202,13662,87,0,0,65535,0,7,58],[100691,19543,17616,87,0,0,65535,0,83,2],[100692,14232,61434,87,0,0,65535,0,57,46],[100693,63768,45762,87,0,0,65535,0,97,61],[100694,7158,56516,87,0,0,65535,0,26,6],[100695,36928,50958,87,0,0,65535,0,75,27],[100696,21840,14170,87,0,0,65535,0,63,92],[100697,52293,20050,87,0,0,65535,0,99,1],[100698,35409,43178,87,0,0,65535,0,48,24],[100699,7094,60590,87,0,0,65535,0,24,65],[100700,38867,34666,87,0,0,65535,0,50,50],[100701,12854,26268,87,0,0,65535,0,99,61],[100702,14495,12364,87,0,0,65535,0,87,44],[100703,24410,23062,87,0,0,65535,0,26,46],[100704,26651,28677,87,0,0,65535,0,59,69],[100705,40433,27649,87,0,0,65535,0,44,39],[100706,21593,41618,87,0,0,65535,0,65,24],[100707,37628,31141,87,0,0,65535,0,81,17],[100708,61752,34286,87,0,0,65535,0,97,52],[100709,61813,2066,87,0,0,65535,0,22,3],[100710,12537,64975,87,0,0,65535,0,85,65],[100711,61026,10952,87,0,0,65535,0,55,76],[100712,11350,1817,87,0,0,65535,0,84,11],[100713,61973,39440,87,0,0,65535,0,81,27],[100714,36251,8338,87,0,0,65535,0,63,10],[100715,7512,26120,87,0,0,65535,0,45,85],[100716,38039,16784,87,0,0,65535,0,69,63],[100717,64350,52989,87,0,0,65535,0,93,51],[100718,48420,17263,87,0,0,65535,0,33,75],[100719,30630,13984,87,0,0,65535,0,38,27],[100720,7206,24551,87,0,0,65535,0,16,92],[100721,3757,64525,87,0,0,65535,0,23,87],[100722,58946,25999,87,0,0,65535,0,89,31],[100723,16946,10666,87,0,0,65535,0,54,94],[100724,5591,31658,87,0,0,65535,0,47,79],[100725,13457,9985,87,0,0,65535,0,12,67],[100726,41297,46037,87,0,0,65535,0,21,91],[100727,20563,16258,87,0,0,65535,0,80,32],[100728,26094,16245,87,0,0,65535,0,82,8],[100729,44897,2762,87,0,0,65535,0,54,25],[100730,55342,54575,87,0,0,65535,0,75,43],[100731,62099,828,87,0,0,65535,0,88,85],[100732,64265,50044,87,0,0,65535,0,87,85],[100733,44608,33360,87,0,0,65535,0,78,46],[100734,34090,58816,87,0,0,65535,0,49,59],[100735,47196,14278,87,0,0,65535,0,8,54],[100736,15633,784,87,0,0,65535,0,96,63],[100737,18548,15444,87,0,0,65535,0,82,7],[100738,27126,13220,87,0,0,65535,0,18,78],[100739,11700,6101,87,0,0,65535,0,77,70],[100740,9213,58804,87,0,0,65535,0,58,87],[100741,13773,7545,87,0,0,65535,0,35,1],[100742,42817,17770,87,0,0,65535,0,73,73],[100743,18942,37712,87,0,0,65535,0,0,17],[100744,60607,5805,87,0,0,65535,0,1,8],[100745,8889,47906,87,0,0,65535,0,77,99],[100746,34986,65507,87,0,0,65535,0,50,74],[100747,19400,52841,87,0,0,65535,0,47,52],[100748,546,62359,87,0,0,65535,0,49,84],[100749,57190,63630,87,0,0,65535,0,91,37],[100750,23307,5609,87,0,0,65535,0,76,46],[100751,40616,35160,87,0,0,65535,0,48,54],[100752,1296,46482,87,0,0,65535,0,87,10],[100753,30802,27189,87,0,0,65535,0,11,23],[100754,46651,1305,87,0,0,65535,0,65,69],[100755,44554,53723,87,0,0,65535,0,85,10],[100756,21866,46208,87,0,0,65535,0,50,18],[100757,27092,3019,87,0,0,65535,0,3,60],[100758,63617,13043,87,0,0,65535,0,38,58],[100759,32783,63164,87,0,0,65535,0,40,40],[100760,43329,60996,87,0,0,65535,0,87,36],[100761,21888,33364,87,0,0,65535,0,30,9],[100762,59812,49343,87,0,0,65535,0,13,16],[100763,28800,13117,87,0,0,65535,0,77,44],[100764,6971,25490,87,0,0,65535,0,80,88],[100765,25044,3652,87,0,0,65535,0,15,22],[100766,50497,5817,87,0,0,65535,0,0,68],[100767,398,16628,87,0,0,65535,0,32,58],[100768,13490,52214,87,0,0,65535,0,95,90],[100769,37327,49195,87,0,0,65535,0,28,91],[100770,38392,25763,87,0,0,65535,0,40,48],[100771,36037,31142,87,0,0,65535,0,72,80],[100772,18287,63139,87,0,0,65535,0,0,25],[100773,24791,41535,87,0,0,65535,0,66,35],[100774,18262,2689,87,0,0,65535,0,11,24],[100775,58223,58388,87,0,0,65535,0,34,32],[100776,28831,12202,87,0,0,65535,0,6,94],[100777,53409,23686,87,0,0,65535,0,27,92],[100778,51151,112,87,0,0,65535,0,31,38],[100779,21120,6093,87,0,0,65535,0,18,78],[100780,740,4030,87,0,0,65535,0,0,95],[100781,6661,48277,87,0,0,65535,0,93,33],[100782,63367,18030,87,0,0,65535,0,28,67],[100783,12671,20647,87,0,0,65535,0,91,28],[100784,46792,18317,87,0,0,65535,0,23,65],[100785,29787,21495,87,0,0,65535,0,92,88],[100786,22797,48755,87,0,0,65535,0,66,48],[100787,12973,5116,87,0,0,65535,0,97,6],[100788,47754,13626,87,0,0,65535,0,52,44]];


const ALIANS_INFO = [
    { id:0, name:'Звездный Альянс',             desc:''},
    { id:1, name:'Синдикат Мирр',               desc:''},
    { id:2, name:'Урелон',                      desc:''},
    { id:3, name:'Лига свободных государств',   desc:''},
    { id:4, name:'Ютари',                       desc:''},
    { id:5, name:'Доминион Мварахар',           desc:''},
    { id:5, name:'Периферия',                   desc:''},
]
const PLANET_TYPE_INFO = [
    { id:0, name:'аграрная',        },
    { id:1, name:'добывающая',      },
    { id:2, name:'военная',         },
    { id:3, name:'смешанная',       },
    { id:4, name:'машиностроение',  },
    { id:5, name:'сфера услуг',     },
]
const PLANET_RACE_INFO = [
    { id:0, name:'люди',            },
    { id:1, name:'ирроты',          },
    { id:2, name:'Урелонцы',        },
    { id:3, name:'Ютари',           },
    { id:4, name:'Девари',          },
    { id:5, name:'ассорти',         },
]

if (this.alert===undefined){

module.exports.ERROR_MSGS               = ERROR_MSGS;  

module.exports.MSG_MSG                  = MSG_MSG;    
module.exports.MSG_LOGIN                = MSG_LOGIN;  
module.exports.MSG_LOGIN_FAIL           = MSG_LOGIN_FAIL;  
module.exports.MSG_REGISTRATION         = MSG_REGISTRATION;  
module.exports.MSG_INIT                 = MSG_INIT;    
module.exports.MSG_UNIT_POS             = MSG_UNIT_POS;    
module.exports.MSG_BLOCK                = MSG_BLOCK;    
module.exports.MSG_EDITOR               = MSG_EDITOR;    
module.exports.MSG_STATIC               = MSG_STATIC;
module.exports.MSG_UNIT_INFO            = MSG_UNIT_INFO;    
module.exports.MSG_STATION              = MSG_STATION;    
module.exports.MSG_DEVICE               = MSG_DEVICE;

module.exports.OBJ_STATUS_FIRE1         = OBJ_STATUS_FIRE1;    
module.exports.OBJ_STATUS_FIRE2         = OBJ_STATUS_FIRE2;    
module.exports.OBJ_STATUS_FIRE3         = OBJ_STATUS_FIRE3;    
module.exports.OBJ_STATUS_FIRE4         = OBJ_STATUS_FIRE4;    
module.exports.OBJ_STATUS_UPD_RND       = OBJ_STATUS_UPD_RND;    
module.exports.OBJ_STATUS_BOOM          = OBJ_STATUS_BOOM;    
module.exports.OBJ_STATUS_NPC           = OBJ_STATUS_NPC;
module.exports.OBJ_STATUS_CHCK          = OBJ_STATUS_CHCK;

module.exports.STATION_OP_BULLETS       = STATION_OP_BULLETS;
module.exports.STATION_OP_CONNECT       = STATION_OP_CONNECT;
module.exports.STATION_OP_FUEL          = STATION_OP_FUEL;
module.exports.STATION_OP_LEAVE         = STATION_OP_LEAVE;
module.exports.STATION_OP_MARKET        = STATION_OP_MARKET;
module.exports.STATION_OP_REPAIR        = STATION_OP_REPAIR; 
module.exports.STATION_OP_BUY           = STATION_OP_BUY;
module.exports.STATION_OP_GUN           = STATION_OP_GUN;

module.exports.STATIC_STATUS_INACTIVE    = STATIC_STATUS_INACTIVE;     
module.exports.STATIC_STATUS_COLLECTIBLE = STATIC_STATUS_COLLECTIBLE;     

module.exports.ACTION_BLOCK_REQ         = ACTION_BLOCK_REQ;    
module.exports.ACTION_UNIT_INFO_REQ     = ACTION_UNIT_INFO_REQ;    
module.exports.ACTION_UNIT_COLLECT      = ACTION_UNIT_COLLECT;    

    
module.exports._send_status_frame       = _send_status_frame;    
module.exports._send_status_block       = _send_status_block;    
module.exports._send_status_block_end   = _send_status_block_end;    
module.exports._send_status_item_update = _send_status_item_update;    
module.exports._send_status_next_tick   = _send_status_next_tick;    

module.exports.GUNS_TYPE_BULLET         = GUNS_TYPE_BULLET;
module.exports.GUNS_TYPE_LASER          = GUNS_TYPE_LASER;

module.exports.STATIC_INFO              = STATIC_INFO;    
module.exports.ITEMS_INFO               = ITEMS_INFO;    
module.exports.INFO_UNITS               = INFO_UNITS;  
module.exports.INFO_GUNS                = INFO_GUNS;
module.exports.INFO_GENS                = INFO_GENS;
module.exports.INFO_DVIGS               = INFO_DVIGS;
module.exports.INFO_DEVICES             = INFO_DEVICES;

module.exports.AWARD_RULE               = AWARD_RULE;

module.exports.PLANETS_INFO             = PLANETS_INFO; 
   

}


