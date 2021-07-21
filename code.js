document.addEventListener(`DOMContentLoaded`, function () { onLoad(); } );
window.addEventListener(`mousedown`, function (e) { clicked( e.target, false ) } );
window.addEventListener(`change`, function (e) { changed( e.target ) } );

function onLoad(){
    loadState();
    buildScale();
    buildSi();
    profOverride( longLap.mode == `bureaucratic` );
    homeOverride();
    essentialUI();
    lapAll();
    createDivs();
    fixActive();
    fixToggleDisplay();
    updateWatermarks();
    setTimeout(() => {
        updateGlobalIncome();
    }, 250 );
}

function createDivs(){
    for( key in lap.skills ){ appendSkill( key ); }
    for( key in lap.prof ){ appendJob( key ); }
    for( key in home ){ appendHome( key ); }
    for( key in items ){ appendItem( key ); }
    for( key in gods ){ appendDivine( key ); }
    for( key in boons ){ appendBoon( key ); }
    for( key in modes ){ appendMode( key ); }
    appendCostPreviews();
}

function ticker( dur ){
    setTimeout(() => {
        if( lap.dead ){}
        else if( global.paused ){}
        else{ 
            incrementDay();
            adjustAge();
            testUpgradeCosts();
        }
        lap.ticks++;
        if( lap.ticks % 10 == 0 ){
            if( auto.rebirth.automate ){ automate( `rebirth` ); }
            countdown();
            saveState();
            updateTableValues();
        }
        ticker( tickSpeed() );
    }, dur );
}

function clicked( elem ){
    let i = elem.getAttribute(`id`);
    let c = elem.classList;
    if( i == `pause` ){ pauseGame(); }
    else if( c.contains(`profBar`) ){ changeJob( i ); }
    else if( c.contains(`skillBar`) ){ changeSkill( i ); }
    else if( c.contains(`divineBar`) ){ worship( i ); }
    else if( i == `rebirth` ){ rebirth(); }
    else if( c.contains(`tab`) ){ tabChange( i ); }
    else if( c.contains(`home`) ){ if( !auto.homes.automate ){ changeHome( i ); } }
    else if( c.contains(`item`) ){ donDoff( i ); }
    else if( c.contains(`upgrade`) ){ upgradeItem( i.replace(`Upgrade`,``) ); }
    else if( i == `myProf` ){ tabChange( `jobsTab` ) }
    else if( i == `mySkill` ){ tabChange( `skillsTab` ) }
    else if( c.contains(`godCircle`) ){ tabChange( `divineTab` ) }
    else if( i == `fixSave` ){ fixSave(); }
    else if( i == `hardReset` ){ hardReset(); }
    else if( i == `export` ){ exportState(); }
    else if( i == `import` ){ importState(); }
    else if( i == `getBoon` ){ gainBoon( elem.getAttribute(`data-god`) ); }
    else if( c.contains(`mode`) && !c.contains(`active`) ){ changeMode( i, true ); }
    else if( c.contains(`confirm`) ){ changeMode( longLap.nextMode, false ); }
}

function changed( elem ){
    let e = elem.id.replace(`Auto`,``);
    if( elem.id == `slider` ){} // tribute slider
    else{ 
        if( elem.getAttribute(`data-type`) == `automate` ){
            auto[e].automate = elem.checked;
            fixToggleDisplay( elem, e );
        }
        else if( elem.getAttribute(`data-type`) == `toggle` ){
            let root = elem.getAttribute(`data-root`);
            let type = elem.getAttribute(`name`);
            auto[root].toggles[type] = elem.checked;
        }
    }
}

function pauseGame(){
    global.paused = !global.paused;
    butt = document.getElementById(`pause`);
    butt.classList.toggle(`active`);
}

function incrementDay(){
    if( lap.myProf !== `` ){
        xpUp();
        updateBars();
        earnings();
        adjustTribute( document.getElementById(`slider`).value ) ;
        lap.day++;
        let a = makeAge( lap.day );
        if( a.years + ( a.days / 365 ) >= lap.lifespan ){ endLap(); }
        document.getElementById(`age`).innerHTML = `Age ${a.years}, Day ${a.days}`;
        if( lap.isConsul ){ lap.consulDays++; }
        if( lap.consulDays >= 365 ){
            document.getElementById(`modesTab`).classList.remove(`noDisplay`);
            tabChange(`modesTab`);
            longLap.unlocked = true;
            lap.isConsul = false;
            lap.consulDays = 0;
            if( !longLap.complete ){
                longLap.providence += modes[longLap.mode].reward;
                updateTableValues();
                longLap.complete = true;
            }
        }
        updateGlobalIncome();
        checkUnlocks();
    }
}

function adjustAge(){
    if( lap.dead ){}
    else{
        let l = home[lap.myHome].life * lap.skills.vitality.boost * lap.skills.athletics.boost * lap.gods.vesta.boost;
        if( medLap.boons.vesta ){ l += 5; }
        lap.lifespan = ( ( lap.lifespan * 99 + l ) / 100 );
        if( Math.abs( lap.lifespan - l ) < 0.01 ){ lap.lifespan = l; }
        document.getElementById(`lifespan`).innerHTML = niceNumber( lap.lifespan );
        for( key in home ){
            let r = niceNumber( home[key].life * lap.skills.vitality.boost * lap.skills.athletics.boost * lap.gods.vesta.boost );
            if( medLap.boons.vesta ){
                r = niceNumber( home[key].life * lap.skills.vitality.boost * lap.skills.athletics.boost * lap.gods.vesta.boost + 5 );
            }
            document.getElementById(key+`Lifespan`).innerHTML = r;
        }
    }
}

function adjustWorship(){
    let x = 0;
    for( key in lap.gods ){ if( lap.gods[key].active ){ x++; } }
    lap.worshipping = x;
    for( key in lap.gods ){ if( lap.gods[key].active ){ lap.gods[key].denominator = x; } }
}

function adjustTribute( t ){
    if( t == lap.tribute ){}
    else{
        lap.tribute = t;
        document.getElementById(`tribute`).innerHTML = `${t}% (-${niceNumber( getEarnings().tribute)} Đ)`;
        updateAllXP();
    }
}

function earnings(){
    lap.wealth += getEarnings().net;
    document.getElementById(`balance`).innerHTML = niceNumber( Math.floor( lap.wealth ) );
    if( lap.wealth <= 0 ){ destitute(); }
    if( lap.wealth > lap.maxWealth ){ lap.maxWealth = lap.wealth; }
}

function getEarnings( o ){
    let output = {};
    if( o == undefined ){ o = lap.myProf; }
    let p = Math.floor( prof[o].pay * scale[prof[o].payMod] );
    output.income = Math.floor( p * logThis( global.scale, lap.prof[o].level + 3 ) + ( p * lap.prof[o].level / 2 ) );
    if( longLap.mode == `recession` ){ output.income /= 2; }
    output.income *= global.wealthBoost;
    output.income *= lap.skills.negotiation.boost;
    output.income *= lap.skills.precision.boost;
    output.income *= lap.gods.venus.boost;
    if( medLap.boons.venus ){ output.income *= 1.5; }
    output.income = Math.floor( output.income );
    output.expense = 0;
    output.expense += sumItemcosts();
    output.expense *= lap.skills.sense.boost;
    output.expense *= lap.skills.haggling.boost;
    output.expense *= lap.skills.appraisal.boost;
    output.expense *= lap.gods.neptune.boost;
    output.expense += getCost( lap.myHome, `home` );
    output.expense = Math.floor( output.expense );
    let t = output.income * ( lap.tribute / 100 );
    if( countGods() == 0 ){ t = 0; }
    output.tribute = Math.floor( t );
    output.net = output.income - output.expense - output.tribute;
    output.netLessExtra = output.net + getCost( lap.myHome, `home` );
    return output;
}

function sumItemcosts(){
    let output = 0;
    for( key in lap.items ){
        if( lap.items[key].active ){ output += Math.max( 10, items[key].cost ); }
    }
    if( longLap.mode == `recession` ){ output *= 2; }
    return output;
}

function countGods(){
    let count = 0;
    for( g in lap.gods ){
        if( lap.gods[g].active ){
            count++;
        }
    }
    return count;
}

function getXP( o, t ){
    let output = global.baseXP;
    output += lap[t][o].max / 10;
    output *= home[lap.myHome].boost;
    output *= medLap.multi;
    output *= longLap.providence;
    if( t == `skills` ){
        output *= lap.skills.focus.boost;
        output *= lap.gods.vulcan.boost;
        output *= itemBoost( `lens` );
        output *= itemBoost( `diadems` );
        if( o == `brawn` || o == `athletics` || o == `strength` ){ output *= lap.skills.strength.boost * lap.gods.mars.boost; }
        else if( o == `precision` || o == `swiftness` || o == `agility` ){ output *= lap.skills.agility.boost * lap.gods.apollo.boost; }
        else if( o == `stamina` || o == `vitality` || o == `endurance` ){ output *= lap.skills.endurance.boost * lap.gods.mars.boost; }
        else if( o == `sense` || o == `concentration` || o == `intellect` ){ output *= lap.skills.intellect.boost * lap.gods.minerva.boost; }
        else if( o == `appraisal` || o == `worship` || o == `wisdom` ){ output *= lap.skills.wisdom.boost * lap.gods.minerva.boost; }
        else if( o == `haggling` || o == `negotiation` || o == `charisma` ){ output *= lap.skills.charisma.boost * lap.gods.apollo.boost; }
        if( o == `focus` ){ 
            output *= lap.skills.concentration.boost;
            output *= itemBoost( `desk` );
        }
        if( medLap.boons.mars && ( o == `brawn` || o == `athletics` || o == `strength` || o == `stamina` || o == `vitality` || o == `endurance` ) ){ output *= lap.skills.focus.boost; }
        if( medLap.boons.apollo && ( o == `precision` || o == `swiftness` || o == `agility` || o == `haggling` || o == `negotiation` || o == `charisma` ) ){ output *= lap.skills.focus.boost; }
        if( medLap.boons.minerva && ( o == `sense` || o == `concentration` || o == `intellect` || o == `appraisal` || o == `worship` || o == `wisdom` ) ){ output *= lap.skills.focus.boost; }
    }
    if( t == `prof` ){
        output *= lap.skills.stamina.boost;
        output *= lap.gods.ceres.boost;
        output *= itemBoost( `sandals` );
        output *= itemBoost( `cloak` );
        output *= lap.skills.brawn.boost;
        output *= itemBoost( `tunic` );    
    }
    if( t == `gods` ){
        output *= lap.skills.worship.boost;
        output *= lap.gods.jupiter.boost;
        output *= itemBoost( `vestments` );
        output *= itemBoost( `relic` );
        if( lap.gods[o].active ){ output /= lap.gods[o].denominator; }
        else{ output /= ( lap.worshipping + 1 ); }
        output *= lap.tribute * lap.gods.juno.boost / 100;
        if( medLap.boons.juno && medLap.boons[o] ){ output *= 1.5; }
        if( medLap.boons.jupiter ){ output *= Math.pow( 1.1, lap.worshipping ); }
    }
    return output;
}

function tickSpeed(){
    let output = global.speed / lap.speed / lap.skills.swiftness.boost / lap.gods.mercury.boost;
    if( medLap.boons.mercury ){ output /= 1.2; }
    return output;
}

function itemBoost( i ){
    let o = 1;
    if( lap.items[i].active ){ o *= 1 + ( lap.items[i].level * global.upgradeInc ); }
    return o;
}

function xpUp(){
    // profession
    let j = lap.myProf;
    let pj = document.getElementById(lap.myProf).parentElement.parentElement;    
    lap.prof[j].xp += getXP( j, `prof` );
    pj.children[4].innerHTML = niceNumber( Math.ceil( Math.max( 0, lap.prof[j].next - lap.prof[j].xp ) ) );
    if( lap.prof[j].xp >= lap.prof[j].next ){
        if( lap.prof[j].xp < lap.prof[j].next + deduceLevelXP( `prof`, j, lap.prof[j].level + 1 ) * 2 ){ 
            levelUp( `prof`, j, pj ); }
        else{ levelUpMany( `prof`, j, pj ); }
    }
    // skills
    let s = lap.mySkill;
    let ps = document.getElementById( lap.mySkill ).parentElement.parentElement;
    lap.skills[s].xp += getXP( s, `skills` );
    ps.children[4].innerHTML = niceNumber( Math.ceil( Math.max( 0, lap.skills[s].next - lap.skills[s].xp ) ) );
    if( lap.skills[s].xp >= lap.skills[s].next ){ 
        if( lap.skills[s].xp < lap.skills[s].next + deduceLevelXP( `skills`, s, lap.skills[s].level + 1 ) * 2 ){ 
            levelUp( `skills`, s, ps ); }
        else{ levelUpMany( `skills`, s, ps ); }
    }
    // gods
    for( g in lap.gods ){
        if( lap.gods[g].active ){
            let pd = document.getElementById( g ).parentElement.parentElement;    
            lap.gods[g].xp += getXP( g, `gods` );
            pd.children[4].innerHTML = niceNumber( Math.ceil( Math.max( 0, lap.gods[g].next - lap.gods[g].xp ) ) );
            if( lap.gods[g].xp >= lap.gods[g].next ){ 
                if( lap.gods[g].xp < lap.gods[g].next + deduceLevelXP( `gods`, g, lap.gods[g].level + 1 ) * 2 ){ 
                    levelUp( `gods`, g, pd ); }             
                else{ levelUpMany( `gods`, g, pd ); }
            }
        }        
    }   
}

function levelUp( r, z, par ){
    lap[r][z].level++;
    par.children[1].innerHTML = niceNumber(lap[r][z].level);
    lap[r][z].xp = 0;
    lap[r][z].next = deduceLevelXP( r, z, lap[r][z].level );
    if( r !== `prof` ){
        let type = window[r][z].type;
        if( type == `increment` ){ lap[r][z].boost += global.inc * ( r == `gods` ? 5 : 1 ); }
        else if( type == `logarithm` ){ lap[r][z].boost = Math.log10( 10 + lap[r][z].level / ( 50 / ( r == `gods` ? 5 : 1 ) ) ); }
        else if( type == `decrement` ){ lap[r][z].boost = Math.max( 0.1, 1 / ( Math.log10( 10 + lap[r][z].level / ( 25 / ( r == `gods` ? 5 : 1 ) ) ) ) ); }
    }
    if( r == `prof` ){ 
        document.getElementById(`myProf`).children[2].innerHTML = lap[r][z].level;
        par.children[2].innerHTML = `+${niceNumber( getEarnings( lap.myProf ).income )} Đ`;
    }
    else if( r == `skills` ){ 
        document.getElementById(`mySkill`).children[2].innerHTML = lap[r][z].level;
    }
    else if( r == `gods` ){
        if( lap[r][z].level >= 100 && !medLap.boons[z] ){ offerBoon( z ); }
    }
    updateAllXP();
    updateGlobalIncome();
    checkUnlocks();
    if( auto[r].automate ){
        automate( r );
        updateTableValues();
    }
}

function levelUpMany( r, z, par ){
    let i = 0;
    let x = JSON.parse( JSON.stringify( lap[r][z].xp ) );
    let stop = false;
    while( stop == false ){
        if( x - deduceLevelXP( r, z, lap[r][z].level + i ) < 0 ){ stop = true; }
        else if( i > 100 ){ stop = true; }
        else{
            x -= deduceLevelXP( r, z, lap[r][z].level + i )
            levelUp( r, z, par );
        }
        i++;
    }
}

function deduceLevelXP( r, z, b ){
    let next = 0;
    let m = global.mod;
    if( r == `skills` && medLap.boons.vulcan ){ m = global.vulcanMod; }
    if( r == `gods` ){ m = global.godMod; }
    next = ( window[r][z].base * ( b + 1 ) ) * Math.pow( m, b );
    if( r == `prof` && medLap.boons.ceres ){ next = ( window[r][z].base * global.ceresDiv * ( b + 1 ) ) * Math.pow( m, b ); }
    next = Math.floor( next / global.diffDiv );
    return next;
}

function automate( t ){
    if( t == `prof` ){
        let j = ``;
        for( key in lap.prof ){
            if( lap.prof[key].unlocked ){ j = key; }
        }
        changeJob( j );
    }
    else if( t == `skills` ){
        let s = ``, i = 1e300;
        for( key in lap.skills ){
            if( lap.skills[key].unlocked ){ 
                if( lap.skills[key].level < i ){
                    if( auto.skills.toggles[key] ){
                        s = key;
                        i = lap.skills[key].level;
                    }
                }
            }
        }
        if( s !== `` ){ changeSkill( s ) };
    }
    else if( t == `homes` ){
        let h = ``;
        for( x in lap.homes ){
            if( lap.homes[x].unlocked ){
                if( getCost( x, `home` ) <= getEarnings().netLessExtra ){
                    h = x;
                }                
            }
        }
        if( h !== `` ){ changeHome( h ); }
    }
    else if( t == `items` ){
        for( ii in lap.items ){
            if( lap.wealth > getUpgradeCost( ii ) && lap.items[ii].active ){ upgradeItem( ii ); }
        }
    }
    else if( t == `gods` ){
        let e = getEarnings();
        let x = Math.floor( ( e.income - e.expense ) / e.income * 100 );
        if( x < 1 ){ x == 0 }
        lap.tribute = x;
        document.getElementById(`slider`).value = x;
    }
    else if( t == `rebirth` ){
        if( lap.dead ){ rebirth(); }
    }
}

function offerBoon( g ){
    document.getElementById(`godWhich`).innerHTML = titleCase( g );
    document.getElementById(`godGet`).innerHTML = boons[g];
    document.getElementById(`noGods`).classList.add(`noDisplay`);
    document.getElementById(`yesGods`).classList.remove(`noDisplay`);
    document.getElementById(`getBoon`).setAttribute(`data-god`, g);
    document.getElementById(`nextMultiAmount`).innerHTML = niceNumber( scale[countBoons()] +1 );
}

function countBoons(){
    let o = 0;
    for( key in gods ){
        if( medLap.boons[key] ){ o++ }
    }
    return o;
}

function gainBoon( g ){
    medLap.boons[g] = true;
    medLap.multi = scale[countBoons()];
    rebirth( `med` );
}

function updateGlobalIncome(){
    let e = getEarnings();
    let n = ``;
    if( e.net > 0 ){ n = `+`; }
    document.getElementById(`net`).innerHTML = n + niceNumber( e.net );
    document.getElementById(`income`).innerHTML = niceNumber( e.income );
    document.getElementById(`expense`).innerHTML = niceNumber( e.expense );
    document.getElementById(`tithings`).innerHTML = niceNumber( e.tribute );
    document.getElementById(`tribute`).innerHTML = `${lap.tribute}% (-${niceNumber( getEarnings().tribute)} Đ)`;    
    if( auto.homes.automate ){ automate( `homes` ); }
    if( auto.items.automate ){ automate( `items` ); }
    if( auto.gods.automate ){ automate( `gods` ); }
}

function updateBars(){
    doBarStripes( lap.prof[lap.myProf], `myProf`, getXP( lap.myProf, `prof` ) );
    doBarStripes( lap.skills[lap.mySkill], `mySkill`, getXP( lap.mySkill, `skills` ) );
    for( key in lap.gods ){
        let p = lap.gods[key];
        doBarStripes( p, `gods`, getXP( key, `gods` ), key )
        updateRing( `#${key}Ring`, p.xp / p.next );
        if( lap.gods[key].active ){ document.getElementById(`${key}Ring`).classList.add(`godOn`) }
        else{ document.getElementById(`${key}Ring`).classList.remove(`godOn`) }
    }
}

function doBarStripes( p, x, xp, g ){
    let s = `width:${p.xp / p.next * 100}%; transition:all linear ${tickSpeed()}ms;`;
    if( xp >= p.next / 3 && p.level > 1 ){
        s = `width:100%; transition:none;`;
        if( x !== `gods` ){
            document.getElementById(lap[x] + 'Fill').classList.add(`stripes`);
            document.getElementById(lap[x] + 'Fill').style = s;
            document.getElementById(x).classList.add(`stripes`);
            document.getElementById(x).children[0].style = s;
        }
        else{
            if( lap.gods[g].active ){
                document.getElementById(g + `Fill`).classList.add(`stripes`);
            }
            document.getElementById(g + `Fill`).style = s;
        }
    }
    else{
        s = `width:${p.xp / p.next * 100}%; transition:all linear ${tickSpeed()}ms;`;
        if( x !== `gods` ){
            document.getElementById(lap[x] + 'Fill').classList.remove(`stripes`);
            document.getElementById(lap[x] + 'Fill').style = s;
            document.getElementById(x).classList.remove(`stripes`);
            document.getElementById(x).children[0].style = s;
        }
        else{
            document.getElementById(g + `Fill`).classList.remove(`stripes`);
            document.getElementById(g + `Fill`).style = s;
        }
    }
}

function updateAllXP(){
    for( key in lap.prof ){
        let x = niceNumber( getXP( key, `prof` ) );
        if( document.getElementById(`${key}XP`) == null ){}
        else{ document.getElementById(`${key}XP`).innerHTML = x; }
    }
    for( key in lap.skills ){
        let x = niceNumber( getXP( key, `skills` ) );
        document.getElementById(`${key}XP`).innerHTML = x;
        document.getElementById(`${key}Boost`).innerHTML = skills[key].eff.replace(`Q`, niceNumber( lap.skills[key].boost ) );
    }
    for( key in lap.gods ){
        let x = niceNumber( getXP( key, `gods` ) );
        document.getElementById(`${key}XP`).innerHTML = x;
        document.getElementById(`${key}Boost`).innerHTML = gods[key].eff.replace(`Q`, niceNumber( lap.gods[key].boost ) );
    }
}

function changeJob( job ){
    if( lap.dead ){}
    else if( lap.myProf == job ){
        document.getElementById( lap.myProf ).children[0].classList.add(`active`);
        document.getElementById(`myProf`).children[1].innerHTML = String( titleCase((job.replaceAll(`_`,` `) ))).replaceAll(`,`,` `);
    }
    else{
        if( lap.myProf !== `` ){
            document.getElementById( lap.myProf ).children[0].classList.remove(`active`);
            document.getElementById( lap.myProf ).children[0].classList.remove(`stripes`);
        }
        lap.myProf = job;
        document.getElementById( lap.myProf ).children[0].classList.add(`active`);
        document.getElementById(`myProf`).children[1].innerHTML = String( titleCase((job.replaceAll(`_`,` `) ))).replaceAll(`,`,` `);
        document.getElementById(`myProf`).children[2].innerHTML = lap.prof[job].level;
        document.getElementById(`myProf`).children[0].style = `
        width:${lap.prof[job].xp / lap.prof[job].next * 100}%;
        transition:all linear ${tickSpeed()}ms;`;
        if( job == `consul` ){ lap.isConsul = true; }
        else{ lap.isConsul = false; consulDays = 0; }
        updateGlobalIncome();
    }
}

function changeHome( h ){
    if( !lap.dead ){
        if( lap.myHome !== h ){
            document.getElementById( lap.myHome ).classList.remove(`active`);
            document.getElementById( lap.myHome ).innerHTML = `Move`;
            lap.myHome = h;
            updateGlobalIncome();
        }
        let hh = document.querySelectorAll(`.home`);
        for( let i = 0; i < hh.length; i++ ){
            hh[i].classList.remove(`active`);
            hh[i].innerHTML = `Move`;
        }
        document.getElementById( h ).classList.add(`active`);
        document.getElementById( h ).innerHTML = `Home`;
        updateAllXP();
    }
}

function changeSkill( s ){
    if( !lap.dead ){
        if( lap.mySkill !== s ){
            let b = document.getElementById( lap.mySkill + `Fill` )
            b.classList.remove(`active`);
            b.classList.remove(`stripes`);
            lap.mySkill = s;
            updateGlobalIncome();
            updateTableValues();
        }
        document.getElementById(`mySkill`).children[1].innerHTML = titleCase( s );
        document.getElementById(`mySkill`).children[2].innerHTML = lap.skills[s].level;
        document.getElementById( lap.mySkill + `Fill` ).classList.add(`active`);
        updateAllXP();
    }
}

function changeMode( m, warning ){
    if( warning ){
        if( longLap.safety == null ){
            longLap.nextMode = m;
            longLap.safety = 20;
            let d = document.createElement(`div`);
            d.classList = `modeWarning`;
            d.innerHTML = `<p>You are about to leave your current mode</p>
            <p>Doing so will reset all progress, except for your current Providence.</p>
            <p>Are you sure you want to proceed?</p>
            <div class="button confirm">Yes [<a id="countDown">20</a>]</div>`
            document.getElementById(`modes`).appendChild(d)
        }
    }
    else{
        longLap.mode = JSON.parse( JSON.stringify( longLap.nextMode ) ).replace(`Mode`,``);
        longLap.nextMode = null;
        longLap.safety = null;
        document.getElementById(`modes`).removeChild( document.getElementById(`modes`).lastChild );
        rebirth( `long` );
        document.getElementById(`modeDisplay`).innerHTML = titleCase( longLap.mode );
    }
}

function worship( g ){
    lap.gods[g].active = !lap.gods[g].active;
    if( lap.gods[g].active ){ document.getElementById(g+`Fill`).classList.add(`active`); }
    else{
        document.getElementById(g+`Fill`).classList.remove(`active`);
        document.getElementById(g+`Fill`).classList.remove(`stripes`);
    }
    adjustWorship();
    updateAllXP();
}

function donDoff( i ){
    if( !lap.dead ){
        lap.items[i].active = !lap.items[i].active;
        if( lap.items[i].active ){ document.getElementById( i ).classList.add(`active`); }
        else{ document.getElementById( i ).classList.remove(`active`); }
        updateAllXP();
    }    
}

function upgradeItem( i ){
    let cost = getUpgradeCost( i );
    if( lap.wealth < cost ){}
    else{
        lap.wealth -= cost;
        lap.items[i].level++;
        updateTableValues();
        testUpgradeCosts();
    }
}

function getUpgradeCost( i ){
    let output = lap.items[i].cost * Math.pow( 10, lap.items[i].level + 1 ) * lap.gods.diana.boost;
    if( medLap.boons.diana ){ output = lap.items[i].cost * Math.pow( 7.5, lap.items[i].level + 1 ) * lap.gods.diana.boost; }
    return output;
}

function destitute(){
    lap.wealth = 0;
    lap.tribute = 0;
    for( key in lap.items ){ if( lap.items[key].active ){ donDoff( key ); } }
    changeHome( `homeless` );
    document.getElementById(`balance`).innerHTML = niceNumber( Math.floor( lap.wealth ) );
    updateGlobalIncome();
}

function checkUnlocks(){
    for( key in prof ){
        for( i in prof[key].req.prof ){
            let ii = prof[key].req.prof[i];
            if( lap.prof[ii.type] == undefined ){}
            else if( lap.prof[ii.type].level < ii.level ){}
            else{ 
                unlock( key );
                lap.prof[key].unlocked = true;
            }
        }
    }
    for( key in skills ){
        for( i in skills[key].req.skills ){
            let ii = skills[key].req.skills[i];
            if( lap.skills[ii.type] == undefined ){}
            else if( lap.skills[ii.type].level < ii.level ){}
            else{ 
                unlock( key );
                lap.skills[key].unlocked = true;
            }
        }
    }
    for( key in home ){
        let c = getCost( key, `home` ) * 100
        if( lap.maxWealth >= c ){
            unlock( key );
            lap.homes[key].unlocked = true;
        }
    }
    for( key in items ){
        let c = getCost( key, `item` ) * 50
        if( lap.maxWealth >= c ){
            unlock( key );
            lap.items[key].unlocked = true;
        }
    }
    for( key in medLap.boons ){
        if( medLap.boons[key] ){
            document.getElementById(`${key}Fill`).classList.add(`booned`);
            document.getElementById(`${key}Ring`).classList.add(`booned`);
        }
    }
    let prev = document.getElementById(`profNext`);
    let h = ``;
    for( key in prof ){
        if( lap.prof[key].unlocked ){}
        else{
            let i = prof[key].req.prof[0].type;
            h = `Profession: ${titleCase(i)} ${lap.prof[i].level} / 10.`;
            break;
        }
    }
    prev.innerHTML = h;
    if( h == `` ){ prev.parentElement.classList.add(`noDisplay`); }
    let type = ``;
    for( key in skills ){
        let i = skills[key].req.skills[0].type;
        let elem = document.getElementById(`${key}Preview`);
        if( lap.skills[key].unlocked ){ elem.classList.add(`noDisplay`); }
        else if( type == i && type !== `focus` ){ elem.classList.add(`noDisplay`); }
        else if( !lap.skills[i].unlocked ){ elem.classList.add(`noDisplay`); }
        else{
            elem.children[0].innerHTML = `<div class="space"></div>Skill: ${titleCase(i)} ${lap.skills[i].level} / ${skills[key].req.skills[0].level}.`;
            elem.classList.remove(`noDisplay`);
            type = i;
        }
    }
    prev = document.getElementById(`lodgingNext`);
    let none = true;
    for( key in home ){
        if( lap.homes[key].unlocked ){}
        else{
            prev.innerHTML = `Wealth Balance: ` + niceNumber( getCost( key, 'home' ) * 100 ) + ` Đ`;
            none = false;
            break;
        }
    }
    if( none ){ prev.classList.add(`noDisplay`); }
    prev = document.getElementById(`shopNext`);
    none = true;
    for( key in items ){
        if( lap.items[key].unlocked ){}
        else{
            prev.innerHTML = `Wealth Balance: ` + niceNumber( getCost( key, 'item' ) * 50 ) + ` Đ`;
            none = false;
            break;
        }
    }
    if( none ){ prev.classList.add(`noDisplay`); }
    if( medLap.multi > 1 ){ 
        document.getElementById(`godMulti`).classList.remove(`noDisplay`);
        // document.getElementById(`boonTab`).classList.remove(`noDisplay`);
    }
    else{
        document.getElementById(`godMulti`).classList.add(`noDisplay`);
        // document.getElementById(`boonTab`).classList.add(`noDisplay`);
    }
    document.getElementById(`godMulti`).children[1].innerHTML = `${niceNumber(medLap.multi)}x to all XP gain`;
}

function testUpgradeCosts(){
    for( key in lap.items ){
        let cost = getUpgradeCost( key );
        let elem = document.getElementById(key+`Upgrade`);
        if( lap.wealth >= cost ){ elem.classList.remove(`unafford`); }
        else{ elem.classList.add(`unafford`); }
    }
}

function makeAge( x ){
    let output = {}
    output.years = Math.floor( x / 365 );
    output.days = x - output.years * 365;
    output.years += global.ageBuffer;
    return output;
}

function endLap(){
    lap.dead = true;
    document.getElementById(`retryTab`).classList.remove('noDisplay');
    tabChange(`retryTab`);
    document.getElementById(`rebirth`).classList.add('alert');
}

function rebirth( grade ){
    if( grade == `med` ){
        watermarks = {};
        for( t in auto.skills.toggles ){ auto.skills.toggles[t] = false; }
    } // Medium Lap
    if( grade == `long` ){
        watermarks = {};
        medLap.multi = 1;
        for( b in medLap.boons ){ medLap.boons[b] = false; }
        document.getElementById(`boonTab`).classList.add(`noDisplay`);
        longLap.complete = false;
        for( t in auto.skills.toggles ){ auto.skills.toggles[t] = false; }
        if( longLap.mode == `bureaucratic` ){ profOverride( true ); }
        else{ profOverride(); }
    } // Long Lap
    for( key in lap.prof ){
        let l = lap.prof[key].level
        if( watermarks[key] < lap.prof[key].level ){ watermarks[key] = l }
    }
    for( key in lap.skills ){
        let l = lap.skills[key].level
        if( watermarks[key] < lap.skills[key].level ){ watermarks[key] = l }
    }
    for( key in lap.gods ){
        let l = lap.gods[key].level
        if( watermarks[key] < lap.gods[key].level ){ watermarks[key] = l }
    }
    lap.prof = {};
    lap.skills = {};
    lap.gods = {};
    lap.items = {};
    lap.homes = {};
    lap.wealth = 0;
    lap.maxWealth = 0;
    lap.ticks = 0;
    lap.day = 0;
    lap.tribute = 0;
    lap.dead = false;
    lap.lifespan = 25;
    if( medLap.boons.vesta ){ lap.lifespan += 5; }
    document.getElementById(`retryTab`).classList.add(`noDisplay`);
    document.getElementById(`yesGods`).classList.add(`noDisplay`);
    document.getElementById(`noGods`).classList.remove(`noDisplay`);
    lapAll();
    tabChange(`jobsTab`);
    essentialUI();
    createDivs();
    checkUnlocks();
    updateWatermarks();
    changeJob(`beggar`);
    changeHome(`homeless`);
    changeSkill(`focus`);
    fixActive();
    fixToggleDisplay();    
}

function lapAll(){
    // prof
    for( pKey in prof ){
        if( watermarks[pKey] == undefined ){
            watermarks[pKey] = 0;
        }
        if( lap.prof[pKey] == undefined ){ 
            lap.prof[pKey] = {
                level: 0
                , xp: 0
                , next: JSON.parse( JSON.stringify( prof[pKey].base ) )
                , max: JSON.parse( JSON.stringify( watermarks[pKey] ) )
            };
        }
    }
    // skills
    for( sKey in skills ){
        if( watermarks[sKey] == undefined ){
            watermarks[sKey] = 0;
        }
        if( lap.skills[sKey] == undefined ){ 
            lap.skills[sKey] = {
                level: 0
                , xp: 0
                , next: JSON.parse( JSON.stringify( skills[sKey].base ) )
                , max: JSON.parse( JSON.stringify( watermarks[sKey] ) )
                , boost: 1
            };
        }
        if( auto.skills.toggles[sKey] == undefined ){
            auto.skills.toggles[sKey] = false;
        }
    }
    // gods
    for( gKey in gods ){
        if( watermarks[gKey] == undefined ){
            watermarks[gKey] = 0;
        }
        if( lap.gods[gKey] == undefined ){ 
            lap.gods[gKey] = {
                level: 0
                , xp: 0
                , next: JSON.parse( JSON.stringify( global.worshipBase ) )
                , max: JSON.parse( JSON.stringify( watermarks[gKey] ) )
                , boost: 1
                , active: false
                , denominator: 0
            };
        }
        if( auto.gods.toggles[gKey] == undefined ){
            auto.gods.toggles[gKey] = false;
        }
    }
    // items
    if( lap.items == undefined ){ lap.items = {} }
    for( iKey in items ){
        if( lap.items[iKey] == undefined ){ 
            lap.items[iKey] = {
                active: false
                , amount: JSON.parse( JSON.stringify( items[iKey].amount ) )
                , level: 1
                , cost: JSON.parse( JSON.stringify( items[iKey].cost ) )
                , unlocked: false
            };
        }
        if( auto.items.toggles[iKey] == undefined ){
            auto.items.toggles[iKey] = false;
        }
    }
    // homes
    if( lap.homes == undefined ){ lap.homes = {} }
    for( hKey in home ){
        if( lap.homes[hKey] == undefined ){ 
            lap.homes[hKey] = {
                unlocked: false
            };
        }
    }
}

function updateTableValues(){
    for( keyP in lap.prof ){
        let p = lap.prof[keyP];
        let par = document.getElementById(keyP).parentElement.parentElement;
        if( getXP( keyP, `prof` ) < lap.prof[keyP].next / 3 ){
            document.getElementById(keyP+`Fill`).style = `width:${p.xp / p.next * 100}%; transition:all linear ${tickSpeed()}ms;`;
        }
        par.children[1].innerHTML = niceNumber( p.level );
        par.children[2].innerHTML = `+${niceNumber( getEarnings( keyP ).income )} Đ`;
        par.children[3].innerHTML = niceNumber( getXP( keyP, `prof` ) );
        par.children[4].innerHTML = niceNumber( Math.ceil( p.next - p.xp ) );
        par.children[5].innerHTML = niceNumber( p.max );
    }
    for( keyL in lap.skills ){
        let s = lap.skills[keyL];
        let par = document.getElementById(keyL).parentElement.parentElement;
        if( getXP( keyL, `skills` ) < lap.skills[keyL].next / 3 ){
            document.getElementById(keyL+`Fill`).style = `width:${s.xp / s.next * 100}%; transition:all linear ${tickSpeed()}ms;`;
        }
        par.children[1].innerHTML = niceNumber( s.level );
        par.children[2].innerHTML = skills[keyL].eff.replace(`Q`, niceNumber( s.boost ));
        par.children[3].innerHTML = niceNumber( getXP( keyL, `skills` ) );
        par.children[4].innerHTML = niceNumber( Math.ceil( s.next - s.xp ) );
        par.children[5].innerHTML = niceNumber( s.max );
    }
    for( keyD in lap.gods ){
        let g = lap.gods[keyD];
        let par = document.getElementById(keyD).parentElement.parentElement;
        par.children[1].innerHTML = niceNumber( g.level );
        par.children[2].innerHTML = gods[keyD].eff.replace(`Q`, niceNumber( g.boost ));
        par.children[3].innerHTML = niceNumber( getXP( keyD, `gods` ) );
        par.children[4].innerHTML = niceNumber( Math.ceil( g.next - g.xp ) );
        par.children[5].innerHTML = niceNumber( g.max );
    }
    for( keyI in lap.items ){
        let i = lap.items[keyI];
        let par = document.getElementById(keyI).parentElement.parentElement;
        par.children[2].innerHTML = `-${niceNumber( Math.floor( getCost( keyI, `item` ) ) )}  Đ`;
        par.children[3].innerHTML = items[keyI].eff.replace(`Q`, 1+(i.level * global.upgradeInc));
        par.children[4].children[1].innerHTML = `-${niceNumber( getUpgradeCost( keyI ) )}  Đ`;
    }
    for( keyH in home ){
        let par = document.getElementById(keyH).parentElement.parentElement;
        par.children[2].innerHTML = `-${niceNumber( Math.floor( getCost( keyH, `home` ) ) )}  Đ`;
    }
    document.getElementById(`providenceMulti`).children[1].innerHTML = `x${longLap.providence} to all XP gain`;
}

function getCost( h, type ){
    let o = 0;
    if( type == `home` ){ 
        o = home[h].cost;
        if( medLap.boons.neptune ){ o *= 0.8; }
    }
    else if( type == `item` ){ o = items[h].cost; }
    o *= lap.skills.haggling.boost * lap.skills.sense.boost * lap.skills.appraisal.boost * lap.gods.neptune.boost;
    if( longLap.mode == `recession` ){ o *= 2; }
    o = round( o, 0 );
    return o;
}

function updateWatermarks(){
    for( key in prof ){ document.getElementById(key+`Max`).innerHTML = watermarks[key]; }
    for( key in skills ){ document.getElementById(key+`Max`).innerHTML = watermarks[key]; }
    for( key in gods ){ document.getElementById(key+`Max`).innerHTML = watermarks[key]; }
}

// build the interface

function buildScale(){
    let x = 1;
    let t = 50;
    scale = [];
    for( let i = 0; i < t; i++ ){
        x += i * 0.25;
        scale.push( x );
    }
}

function profOverride( bureaucrat ){
    prof = {}
    let p = 1, pm = 1, b = 7.5, bu = 1;
    let longProf = [];
    for( key in namedProfessions ){
        if( bureaucrat && longProf.length >= 12 && bu < 6 ){
            longProf.push(`bureaucrat_rank_${bu}`);
            bu++;
        }
        longProf.push(namedProfessions[key]);
    }    
    for( key in longProf ){
        let n = longProf[key];
        let pro = longProf[key+1];
        let r = longProf[key-1]
        prof[n] = {
            category: 0
            , pay: p
            , payMod: pm
            , base: b
            , req: {
                prof: [
                    {
                        type: r == undefined ? n : r
                        , level: r == undefined ? 0 : 10
                    }
                ]
            }
            , promotes: pro == undefined ? `` : pro
        }
        p = round( p * 1.5, 0 );
        pm++;
        b *= 4;
    }
}

function homeOverride(){
    home = {};
    let c = 1.25, l = 25, b = 0;
    if( medLap.boons.vesta ){ l += 5; }
    for( key in homeTypes ){
        home[homeTypes[key]] = {
            cost: c == 1.25 ? 0 : c
            , life: l
            , boost: scale[b]
        }
        c *= 4 + Math.max( 0, ( key - 5 ) / 2 );
        l += 4;
        b++;
    }
}

function essentialUI(){
    document.getElementById(`jobs`).innerHTML = `<span id="cat0">
        <div class="row rProf">
            <div class="c25">Professions</div>
            <div class="c10">Level</div>
            <div class="c15">Đ /day</div>
            <div class="c20">XP /day</div>
            <div class="c20">XP left</div>
            <div class="c10">Max</div>
        </div>
    </span>
    <span><div class="row rGhost"><div class="c100" id="profNext"></div></div></span>`
    document.getElementById(`skills`).innerHTML = `<span>
        <div class="row rProf">
            <div class="c25">Skills</div>
            <div class="c10">Level</div>
            <div class="c25">Effects</div>
            <div class="c15">XP /day</div>
            <div class="c15">XP left</div>
            <div class="c10">Max</div>
        </div>
    </span>`
    document.getElementById(`lodging`).innerHTML = `<div class="row rProf">
        <div class="c20">Dwellings</div>
        <div class="c15">Active</div>
        <div class="c15">Đ /day</div>
        <div class="c15">Lifespan</div>
        <div class="c35">Effects</div>
    </div>`
    document.getElementById(`shop`).innerHTML = `<div class="row rProf">
        <div class="c20">Items</div>
        <div class="c15">Active</div>
        <div class="c15">Đ /day</div>
        <div class="c20">Effects</div>
        <div class="c30">Upgrade</div>
    </div>`
    document.getElementById(`divine`).innerHTML = `<div class="sliderRow">
        <div class="denom">Tithings</div>    
        <input id="slider" class="slider" type="range" min="0" max="100" value="${lap.tribute}">
        <div class="denom tribute" id="tribute">0% (-0 Đ)</div>
    </div>
    <div class="row rProf">
        <div class="c25">Worship</div>
        <div class="c10">Level</div>
        <div class="c25">Effects</div>
        <div class="c15">XP /day</div>
        <div class="c15">XP left</div>
        <div class="c10">Max</div>
    </div>`
    let h = ``
    for( key in gods ){
        h += `<div class="godPrev"><svg class="godRing" width="3rem" height="3rem">
            <circle id="${key}Ring" class="godCircle" stroke-width="1.25rem" fill="transparent" r="0.5rem" cx="1.5rem" cy="1.5rem"/>
        </svg>
        <div class="medGod ${key}"></div>
        </div>`
    }
    document.getElementById(`modesSpace`).innerHTML = `<div class="row rProf">
        <div class="c15">Mode</div>
        <div class="c55">Description</div>
        <div class="c20">Reward</div>
        <div class="c10">Attempt</div>
    </div>`
    document.getElementById(`boon`).innerHTML = `<span id="boonSpace"></span>`
    document.getElementById(`godsPanel`).innerHTML = h;
    // document.getElementById(`subJobs`).innerHTML = template.replace(`Q`,`prof`);
    // a = `<div class="optionBox">Automate:
    //     <label class="switch"><input type="checkbox" id="skillsAuto"><span class="slide round"></span></label>
    // </div>`;
    // for( key in skills ){
    //     a += `<div class="row"><div class="c20">${titleCase( key )}</div><div class="c10">X</div><div class="c70">|----|</div></div>`
    // }
    // document.getElementById(`subSkills`).innerHTML = a;
    document.getElementById(`jobs`).appendChild( buildAutoToggle( `prof` ) );
    document.getElementById(`skills`).appendChild( buildAutoToggle( `skills` ) );
    document.getElementById(`lodging`).appendChild( buildAutoToggle( `homes` ) );
    document.getElementById(`shop`).appendChild( buildAutoToggle( `items` ) );
    document.getElementById(`divine`).appendChild( buildAutoToggle( `gods` ) );
}

function buildDiv( type, a ){
    let output = ``;
    if( type == 'job' ){
        output = `<div class="row noDisplay">
            <div class="c25 c0">
                <div class="bar profBar" id="${a}">
                    <div class="barFill jobFill" id="${a}Fill" style="width: 0%;"></div>
                    <div class="barLabel">${ String( titleCase((a.replaceAll(`_`,` `) ))).replaceAll(`,`,` `)}</div>
                </div>
            </div>
            <div class="c10">${lap.prof[a].level}</div>
            <div class="c15">+${niceNumber( getEarnings( a ).income )} Đ</div>
            <div class="c20" id="${a}XP">${niceNumber( getXP( a, `prof` ) )}</div>
            <div class="c20">${prof[a].base}</div>
            <div class="c10" id="${a}Max">${lap.prof[a].max}</div>
        </div>`
    }
    else if( type == 'home' ){
        output = `<div class="row noDisplay">
            <div class="c20 c01">${titleCase(a)}</div>
            <div class="c15">
                <div class="button home" id="${a}">Move</div>
            </div>
            <div class="c15">-${niceNumber( home[a].cost )} Đ</div>
            <div class="c15" id="${a}Lifespan">${niceNumber( (home[a].life * lap.skills.vitality.boost * lap.skills.athletics.boost * lap.gods.vesta.boost ) )}</div>
            <div class="c35">x${niceNumber(1+(home[a].boost-1))} to all XP gain</div>
        </div>`
    }
    else if( type == 'item' ){
        output = `<div class="row noDisplay">
            <div class="c20 c01">${titleCase((a.replace(`_`,` `)).replace(`,`,` `))}</div>
            <div class="c15">
                <div class="button item" id="${a}">Hire</div>
            </div>
            <div class="c15">-${niceNumber( items[a].cost )} Đ</div>
            <div class="c20">${items[a].eff.replace(`Q`,lap.items[a].amount)}</div>
            <div class="c30"><div class="button upgrade" id="${a}Upgrade">Upgrade</div><div class="upgCost">-${niceNumber( getUpgradeCost( a ) )} Đ</div></div>
        </div>`
    }
    else if( type == 'skill' ){
        output = `<div class="row noDisplay">
            <div class="c25 c0">
            ${skills[a].parent ? '' : '<div class="space"></div>' }
                <div class="bar skillBar" id="${a}">
                    <div class="barFill skillFill" id="${a}Fill" style="width: 0%;"></div>
                    <div class="barLabel">${titleCase(a)}</div>
                </div>
            </div>
            <div class="c10">0</div>
            <div class="c25" id="${a}Boost">${skills[a].eff.replace(`Q`, niceNumber( lap.skills[a].boost ) )}</div>
            <div class="c15" id="${a}XP">1</div>
            <div class="c15">100</div>
            <div class="c10" id="${a}Max">${lap.skills[a].max}</div>
            <div class="toggleShow skillsToggle noDisplay"><input type="checkbox" name="${a}" data-type="toggle" data-root="skills" checked></div>
        </div>
        <div class="row rGhost" id="${a}Preview"><div class="c100" id="profNext"></div></div>`
    }
    else if( type == 'gods' ){
        output = `<div class="row">
            <div class="c25 c0">
                <div class="bar divineBar" id="${a}">
                    <div class="barFill godsFill" id="${a}Fill" style="width: 0%;"></div>
                    <div class="barLabel"><div class="tinyGod ${a}"></div>${titleCase(a)}</div>
                </div>
            </div>
            <div class="c10">0</div>
            <div class="c25" id="${a}Boost">${gods[a].eff.replace(`Q`, niceNumber( lap.gods[a].boost ))}</div>
            <div class="c15" id="${a}XP">1</div>
            <div class="c15">100</div>
            <div class="c10" id="${a}Max">${lap.gods[a].max}</div>
        </div>`
    }
    else if( type == 'mode' ){
        output = `<div class="row">
            <div class="c15 c0">${titleCase(a)}</div>
            <div class="c55">${modes[a].eff}</div>
            <div class="c20">+${modes[a].reward} Providence</div>
            <div class="c10">
                <div id="${a}Mode" class="button mode">Attempt</div>
            </div>
        </div>`
    }
    else if( type == 'boon' ){
        output = `<div class="boonBox" data-god="${a}">
            <div class="boonText">${titleCase( a )}</div>
            <div class="bigIco ${a}"></div>
            <div class="boonText">${boons[a]}</div>
        </div>`
    }
    return output;
}

function buildAutoToggle( x ){
    let elem = document.createElement(`div`);
    elem.classList = `autoBox`
    let t = `Automate: <label class="switch"><input type="checkbox" id="QAuto" data-type="automate"><span class="slide round"></span></label>`
    elem.innerHTML = t.replace( `Q`, x )
    return elem;
}

function updateRing( selector, percent ){
    var circle = document.querySelector(selector);
    var radius = circle.r.baseVal.value;
    var circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    const offset = circumference - percent * circumference;
    circle.style.strokeDashoffset = offset;
}

function appendElement( e, type ){ // REVISIT - MAKE GENERIC
    let x = document.createElement(`div`);
    document.getElementById(type).appendChild(x);
    document.getElementById(type).lastChild.outerHTML = buildDiv( type, e );
}

function appendJob( a ){
    let x = document.createElement(`div`);
    document.getElementById(`cat${prof[a].category}`).appendChild(x);
    document.getElementById(`cat${prof[a].category}`).lastChild.outerHTML = buildDiv( `job`, a );
    // if( !document.getElementById(`jobsTab`).classList.contains(`active`) ){
    //     document.getElementById(`jobsTab`).classList.add(`alert`);
    // }
}

function appendHome( h ){
    let x = document.createElement(`div`);
    document.getElementById(`lodging`).appendChild(x);
    document.getElementById(`lodging`).lastChild.outerHTML = buildDiv( `home`, h );
    // if( !document.getElementById(`lodgingTab`).classList.contains(`active`) ){
    //     document.getElementById(`lodgingTab`).classList.add(`alert`);
    // }
}

function appendItem( i ){
    let x = document.createElement(`div`);
    document.getElementById(`shop`).appendChild(x);
    document.getElementById(`shop`).lastChild.outerHTML = buildDiv( `item`, i );
    // if( !document.getElementById(`shopTab`).classList.contains(`active`) ){
    //     document.getElementById(`shopTab`).classList.add(`alert`);
    // }
}

function appendSkill( s ){
    let x = document.createElement(`div`);
    document.getElementById(`skills`).children[0].appendChild(x);
    document.getElementById(`skills`).children[0].lastChild.outerHTML = buildDiv( `skill`, s );
    // if( !document.getElementById(`skillsTab`).classList.contains(`active`) ){
    //     document.getElementById(`skillsTab`).classList.add(`alert`);
    // }
}

function appendBoon( b ){
    let x = document.createElement(`div`);
    document.getElementById(`boonSpace`).appendChild(x);
    document.getElementById(`boonSpace`).lastChild.outerHTML = buildDiv( `boon`, b );
}

function appendMode( m ){
    let x = document.createElement(`div`);
    document.getElementById(`modesSpace`).appendChild(x);
    document.getElementById(`modesSpace`).lastChild.outerHTML = buildDiv( `mode`, m );
    // if( !document.getElementById(`skillsTab`).classList.contains(`active`) ){
    //     document.getElementById(`skillsTab`).classList.add(`alert`);
    // }
}

function appendDivine( g ){
    let x = document.createElement(`div`);
    document.getElementById(`divine`).appendChild(x);
    document.getElementById(`divine`).lastChild.outerHTML = buildDiv( `gods`, g );
}

function appendCostPreviews(){
    let elem = document.getElementById(`lodging`);
    let x = document.createElement(`div`);
    x.classList = `row rGhost`;
    x.innerHTML = `<div class="c100" id="lodgingNext"></div>`
    elem.appendChild(x);
    elem = document.getElementById(`shop`);
    x = document.createElement(`div`);
    x.classList = `row rGhost`;
    x.innerHTML = `<div class="c100" id="shopNext"></div>`
    elem.appendChild(x);
}

function fixActive(){
    for( g in lap.gods ){
        if( lap.gods[g].active ){ document.getElementById(g+`Fill`).classList.add(`active`); }
        else{ document.getElementById(g+`Fill`).classList.remove(`active`); }
    }
    document.getElementById(`slider`).value = lap.tribute;
    for( i in lap.items ){
        if( lap.items[i].active ){ document.getElementById(i).classList.add(`active`); }
        else{ document.getElementById(i).classList.remove(`active`); }
    }
    for( key in auto ){
        if( auto[key].automate ){
            document.getElementById(`${key}Auto`).checked = true;
        }
    }
    document.getElementById(`${longLap.mode}Mode`).classList.add(`active`);  
    document.getElementById(`${longLap.mode}Mode`).innerHTML = `Active`;
    let boonC = document.querySelectorAll(`.boonBox`);
    for( let i = 0; i < boonC.length; i++ ){
        let g = boonC[i].getAttribute(`data-god`);
        if( medLap.boons[g] ){ 
            boonC[i].classList.remove(`unearned`);
            boonC[i].classList.add(`earned`);
        }
        else{
            boonC[i].classList.add(`unearned`);
            boonC[i].classList.remove(`earned`);
        }
    }
    if( countBoons() > 0 ){ document.getElementById(`boonTab`).classList.remove(`noDisplay`); }
    if( longLap.unlocked ){
        document.getElementById(`modesTab`).classList.remove(`noDisplay`);
        document.getElementById(`providenceMulti`).classList.remove(`noDisplay`);
    }
    document.getElementById(`modeDisplay`).innerHTML = titleCase( longLap.mode );
}

function fixToggleDisplay( elem, e ){
    if( elem == undefined ){ elem = document.getElementById(`skillsAuto`), e = `skills`; }
    let n = document.querySelectorAll(`.${e}Toggle` );
    if( elem.checked ){ for( let i = 0; i < n.length; i++ ){ n[i].classList.remove(`noDisplay`); } }
    else{ for( let i = 0; i < n.length; i++ ){ n[i].classList.add(`noDisplay`); } }
    for( let i = 0; i < n.length; i++ ){ n[i].children[0].checked = auto[e].toggles[n[i].children[0].getAttribute(`name`)]; }
}

function unlock( u ){
    document.getElementById(u).parentElement.parentElement.classList.remove(`noDisplay`);
}

// GENERIC FUNCTIONS

function buildSi(){
    var toBe = ["","k","M","B","T","q","Q","s","S","O","D"];
    var times = Math.floor( ( 307 - 15 ) / 3 );
    for( let i = 0; i < times; i++ ){
        var nextLetter = String.fromCharCode( 65 + i - ( Math.floor( i / 26 ) * 26 ) );
        var repeats = Math.floor( i / 26 ) + 2;
        var nextOutput = '"';
        for( let j = 0; j < repeats; j++ ){
            nextOutput += nextLetter;
        }
        nextOutput += '"';
        toBe.push( nextOutput );
    }
    si = toBe;
}

function niceNumber( x ){
    let o = ``;
    if( x < 1000 && x > -1000 ){ o = round(x,2)}
    else if( x < 1000000 ){ o = round(x,0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
    else{ o = abbrevNum( x ) };
    return o;
}

function abbrevNum(number){
    var tier = Math.log10(number) / 3 | 0;
    if(tier == 0) return number;
    var suffix = si[tier];
    var scale = Math.pow(10, tier * 3);
    var scaled = number / scale;
    return scaled.toPrecision(4) + suffix;
}

function logThis(base, x) {
	var a = Math.log(x);
    var b = Math.log(base);  
    return a / b;
}

function titleCase(string) {
    var sentence = string.toString().toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toString().toUpperCase() + sentence[i].slice(1);
    };
    return sentence;
};

function tabChange( target ){
    let s = target.replace(`Tab`,``);
    let t = document.querySelectorAll(`.tab`);
    let tt = document.querySelectorAll(`.main`);
    for( let i = 0; i < t.length; i++ ){ t[i].classList.remove(`active`); }
    for( let i = 0; i < tt.length; i++ ){ tt[i].classList.add(`noDisplay`); }
    document.getElementById(target).classList.add(`active`);
    document.getElementById(s).classList.remove(`noDisplay`);
    document.getElementById(target).classList.remove(`alert`);    
}

function countdown(){
    if( longLap.safety == null ){}
    else if( longLap.safety == 0 ){
        longLap.nextMode = null;
        longLap.safety = null;
        document.getElementById(`modes`).removeChild( document.getElementById(`modes`).lastChild );
    }
    else{
        longLap.safety -= 1;
        document.getElementById(`countDown`).innerHTML = longLap.safety;
    }
}

function saveState(){
    var state = {};
    state.lap = lap;
    state.medLap = medLap;
    state.longLap = longLap;
    state.auto = auto;
    state.watermarks = watermarks;
    state.version = version;
    localStorage.setItem(`state`, JSON.stringify(state));
}

function loadState() {
    var state = JSON.parse(localStorage.getItem(`state`));
    if( state !== null && state.lap !== undefined ){
        watermarks = state.watermarks;
        lap = state.lap;
        if( state.medLap !== null && state.medLap !== undefined ){ medLap = state.medLap; }
        if( state.longLap !== null && state.longLap !== undefined ){ longLap = state.longLap; }
        if( state.auto !== null && state.auto !== undefined ){ auto = state.auto; }
        if( state.version == undefined || state.version !== version ){ fixSave(); }
        setTimeout(() => {
            changeJob( lap.myProf );
            changeSkill( lap.mySkill );
            changeHome( lap.myHome );
            updateTableValues();    
        }, 100 );        
    }
    // else{
    //     changeJob( `beggar` );
    //     changeHome( `homeless` );
    //     changeSkill( `focus` );
    // }
    longLap.safety = null;
    longLap.nextMode = null;
    setTimeout(() => {
        if( lap.dead ){ rebirth(); }
        else{
            unlock( `beggar` );
            unlock( `focus` );
            unlock( `homeless` );
            testUpgradeCosts();
            document.getElementById(`myProf`).children[2].innerHTML = lap.prof[lap.myProf].level;
            document.getElementById(`mySkill`).children[2].innerHTML = lap.skills[lap.mySkill].level;
        }
        ticker( global.speed );
    }, 100);
}

function exportState(){
    let state = localStorage.getItem(`state`);
    document.getElementById(`impExp`).value = btoa( state );
}

function importState(){
    let state = atob( document.getElementById(`impExp`).value );
    localStorage.setItem(`state`, state);
    location.reload();
}

function fixSave(){
    lap.gods = {};
    lap.items = {};
    lap.prof = {};
    lap.skills = {};
    lap.myProf = `beggar`
    lap.myHome = `homeless`
    lap.mySkill = `focus`
    lap.gods = {}
    lapAll();
    rebirth();
    ticker( 10 );
    saveState();    
    setTimeout(() => {
        location.reload();        
    }, 100);
}

function hardReset(){
    localStorage.clear(`state`)
    location.reload();
 }

function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
      return Math.round(value);
  
    value = +value;
    exp = +exp;
  
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
      return NaN;
  
    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
  
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}