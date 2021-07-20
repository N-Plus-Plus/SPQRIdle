var version = 0.07

var global = {
    speed: 100
    , paused: false
    , ageBuffer: 15
    , baseXP: 1
    , mod: 1.015
    , vulcanMod: 1.012
    , ceresDiv: 0.75
    , godMod: 1.125
    , scale: 1.75
    , inc: 0.01
    , lifespan: 25
    , worshipBase: 100
    , upgradeInc: 0.5
    , wealthBoost: 1.5
    , diffDiv: 1.25
}

var lap = {
    ticks: 0
    , day: 0
    , speed: 1
    , lifespan: 25
    , worshipping: 0
    , tribute: 0
    , wealth: 0
    , maxWealth: 0 // DEAL WITH THIS
    , dead: false
    , myProf: `beggar`
    , myHome: `homeless`
    , mySkill: `focus`
    , gods: {}
    , prof: {}
    , skills: {}
    , items: {}
    , homes: {}
    , isConsul: false
    , consulDays: 0
}

var medLap =  {
    multi: 1
    , boons: {
        jupiter: false
        , juno: false
        , venus: false
        , neptune: false
        , ceres: false
        , vulcan: false
        , mars: false
        , apollo: false
        , minerva: false
        , diana: false
        , mercury: false
        , vesta: false
    }
}

var longLap = {
    providence: 1
    , safety: null
    , nextMode: null
    , mode: `normal`
    , curses: []
    , unlocked: false
    , complete: false
}

var boons = {
    jupiter: `x1.1 worship XP per god being worshipped`
    , juno: `1.5x worship XP for gods whose blessing you've earned`
    , venus: `x1.5 salary income`
    , neptune: `x0.8 Housing costs`
    , ceres: `XP scaling base for Professions is reduced by 25%`
    , vulcan: `XP scaling exponent rate for Skills is reduced by 20%`
    , mars: `Str and End get x2 boost from Focus`
    , apollo: `Agi and Cha get x2 boost from Focus`
    , minerva: `Int and Wis get x2 boost from Focus`
    , diana: `Item Upgrade costs scale exponent reduced by 25%`
    , mercury: `x1.2 game speed increase`
    , vesta: `+5 years of life expectancy`
}

var prof = {}
var namedProfessions = [
    `beggar`
    , `stablehand`
    , `laborer`
    , `journeyman`
    , `craftsman`
    , `artisan`
    , `shopkeeper`
    , `merchant`
    , `accountant`
    , `guildmaster`
    , `financeer`
    , `official`
    , `emissary`
    , `diplomat`
    , `senator`
    , `elector`
    , `consul`
]

var home = {}
var homeTypes = [
    `homeless`
    ,`tent`
    ,`shanty`
    ,`shack`
    ,`hovel`
    ,`hut`
    ,`casa`
    ,`insulae`
    ,`villa`
    ,`domus`
    ,`fort`
    ,`mansion`
    ,`estate`
    ,`castle`
    ,`palace`
    ,`acropolis`
]

var skills = {
    focus: {
        req: { skills: [ { type: `focus`, level: 0 } ] }
        , parent: true
        , eff: `xQ Skill XP`
        , base: 25
        , type: `increment`
    }
    //
    , strength: {
        req: { skills: [ { type: `focus`, level: 10 } ] }
        , parent: true
        , eff: `xQ Strength skills`
        , base: 100
        , type: `increment`
    }
    , brawn: {
        req: { skills: [ { type: `strength`, level: 10 } ] }
        , eff: `xQ Job XP`
        , base: 200
        , type: `increment`
    }
    , athletics: {
        req: { skills: [ { type: `strength`, level: 25 } ] }
        , eff: `xQ Lifespan`
        , base: 500
        , type: `logarithm`
    }
    //
    , agility: {
        req: { skills: [ { type: `focus`, level: 10 } ] }
        , parent: true
        , eff: `xQ Agility skills` 
        , base: 100
        , type: `increment`
    }
    , precision: {
        req: { skills: [ { type: `agility`, level: 10 } ] }
        , eff: `xQ Job salary`
        , base: 200
        , type: `increment`
    }
    , swiftness: {
        req: { skills: [ { type: `agility`, level: 25 } ] }
        , eff: `xQ Game speed`
        , base: 500
        , type: `logarithm`
    }
    //
    , endurance: {
        req: { skills: [ { type: `focus`, level: 25 } ] }
        , parent: true
        , eff: `xQ Endurance skills`
        , base: 100
        , type: `increment`
    }
    , stamina: {
        req: { skills: [ { type: `endurance`, level: 10 } ] }
        , eff: `xQ Job XP`
        , base: 200
        , type: `increment`
    }
    , vitality: {
        req: { skills: [ { type: `endurance`, level: 25 } ] }
        , eff: `xQ Lifespan`
        , base: 500
        , type: `logarithm`
    }
    //
    , intellect: {
        req: { skills: [ { type: `focus`, level: 25 } ] }
        , parent: true
        , eff: `xQ Intellect skills`
        , base: 100
        , type: `increment`
    }
    , sense: {
        req: { skills: [ { type: `intellect`, level: 10 } ] }
        , eff: `xQ Expenses`
        , base: 200
        , type: `decrement`
    }
    , concentration: {
        req: { skills: [ { type: `intellect`, level: 25 } ] }        
        , eff: `xQ Focus XP`
        , base: 500
        , type: `increment`
    }
    //
    , wisdom: {
        req: { skills: [ { type: `focus`, level: 50 } ] }
        , parent: true
        , eff: `xQ Wisdom skills`
        , base: 100
        , type: `increment`
    }
    , worship: {
        req: { skills: [ { type: `wisdom`, level: 10 } ] }
        , eff: `xQ Worship XP`
        , base: 200
        , type: `increment`
    }
    , appraisal: {
        req: { skills: [ { type: `wisdom`, level: 25 } ] }
        , eff: `xQ Expenses`
        , base: 500
        , type: `decrement`
    }
    //
    , charisma: {
        req: { skills: [ { type: `focus`, level: 50 } ] }
        , parent: true
        , eff: `xQ Charisma skills`
        , base: 100
        , type: `increment`
    }
    , haggling: {
        req: { skills: [ { type: `charisma`, level: 10 } ] }
        , eff: `xQ Expenses`
        , base: 200
        , type: `decrement`
    }
    , negotiation: {
        req: { skills: [ { type: `charisma`, level: 25 } ] }        
        , eff: `xQ Job salary`
        , base: 500
        , type: `increment`
    }
}

var gods = {
    jupiter: {
        eff: `xQ Worship XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , juno: {
        eff: `xQ Tithing potency` //
        , type: `increment`
        , base: global.worshipBase
    }
    , venus: {
        eff: `xQ Job salary`
        , type: `increment`
        , base: global.worshipBase
    }
    , neptune: {
        eff: `xQ Expenses`
        , type: `decrement`
        , base: global.worshipBase
    }
    , ceres: {
        eff: `xQ Job XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , vulcan: {
        eff: `xQ Skill XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , mars: {
        eff: `xQ Str & End skill XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , apollo: {
        eff: `xQ Agi & Cha skill XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , minerva: {
        eff: `xQ Int & Wis skill XP`
        , type: `increment`
        , base: global.worshipBase
    }
    , diana: {
        eff: `xQ Item upgrade cost`
        , type: `decrement`
        , base: global.worshipBase
    }
    , mercury: {
        eff: `xQ Game speed`
        , type: `logarithm`
        , base: global.worshipBase
    }
    , vesta: {
        eff: `xQ Lifespan`
        , type: `logarithm`
        , base: global.worshipBase
    }
}

var items = {
    tunic: {
        eff: `xQ Job XP`
        , cost: 10
        , amount: 1.5
    }
    , lens: {
        eff: `xQ Skill XP`
        , cost: 25
        , amount: 1.5
    }
    , vestments: {
        eff: `xQ Worship XP`
        , cost: 50
        , amount: 1.5
    }
    , desk: {
        eff: `xQ Focus XP`
        , cost: 75
        , amount: 1.5
    }
    , sandals: {
        eff: `xQ Job XP`
        , cost: 125
        , amount: 1.5
    }
    , diadems: {
        eff: `xQ Skill XP`
        , cost: 375
        , amount: 1.5
    }
    , relic: {
        eff: `xQ Worship XP`
        , cost: 625
        , amount: 1.5
    }
    , cloak: {
        eff: `xQ Job XP`
        , cost: 875
        , amount: 1.5
    }
}

var modes = {
    normal: {
        eff: `All basic functionality enabled.`
        , reward: 0
    }
    // , bureaucratic: {
    //     eff: `Five additional professions added between Beggar and Consul.`
    //     , reward: 0.125
    // }
    , recession: {
        eff: `Salaries are halved and all costs are doubled.`
        , reward: 0.25
    }
    // , degenerative: {
    //     eff: `Skills and Jobs slowly decay XP when not being actively pursued.`
    //     , reward: 0.25
    // }
    // , athiest: {
    //     eff: `Gods, Vestments and Relic removed. Divine Blessing unavailable.`
    //     , reward: 1
    // }
}

var auto = {
    prof: {
        automate: false
        , eff: `Promotes you to the highest unlocked profession.`
    }
    , skills: {
        automate: false
        , toggles: {}
        , eff: `Keeps all unlockied skills trained equally.`
    }
    , homes: {
        automate: false
        , eff: `Moves you into the best house you can afford.`
    }
    , items: {
        automate: false
        , toggles: {}
        , eff: `Upgrades equipped items whenever possible.`
    }
    , gods: {
        automate: false
        , toggles: {}
        , eff: `Keeps your Tithings at the max affordable level.`
    }
    , rebirth: {
        automate: false
    }
}

var watermarks = {}
var si = [];
var scale = [];