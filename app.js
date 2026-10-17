"use strict";
/* Trage hier NUR die öffentliche Projekt-URL und den "anon public"-Key ein, niemals den service_role-Key. */
const SB_URL="https://Projekt-Planer.supabase.co",SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdHljcHh6aHJncWtwdHN6ZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNTI3ODEsImV4cCI6MjEwNzgyODc4MX0.FbgO45PTVAR9OybMXYBsGRbZg7oYsGF7NRnD96swvxQ";
const $=s=>document.querySelector(s),e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(SB_URL.includes('DEIN-')){$('#v').innerHTML='<h2>Einrichtung fehlt</h2><p>Trage in app.js die Supabase-URL und den anon-Key ein.</p>';throw new Error('Konfiguration fehlt')}
const sb=supabase.createClient(SB_URL,SB_KEY);
const STEPS=["Frage eingrenzen","Recherche","Skript schreiben","Faktencheck","Storyboard","Sprecher aufnehmen","Bilder und Karten","Animation und Schnitt","Quellenabspann und Test","Veröffentlichen"],
ROLES=["Projektleitung","Recherche und Drehbuch","Faktencheck","Sprecher","Illustration","Schnitt und Animation"],
TABS=[["ov","Übersicht"],["ta","Aufgaben"],["wg","Fahrplan"],["sk","Skript"],["qu","Quellen"],["no","Notizen"],["ei","Einstellungen"]],
AREAS={project:"Leitfrage, Rollen, Fahrplan",tasks:"Aufgaben",script:"Skript-Tabelle",src:"Quellen",notes:"Notizen",members:"Mitglieder entfernen"},
RN={member:"Mitglied",mod:"Mod",host:"Projekthost"},PR={hoch:0,mittel:1,niedrig:2};
const DEF=()=>({project:{leit:'',steps:STEPS.map(()=>0),team:ROLES.map(()=>'')},tasks:[],script:[],src:[],notes:{g:'',th:{}}});
const norm=(k,d)=>Array.isArray(DEF()[k])?(Array.isArray(d)?d:[]):Object.assign(DEF()[k],d||{});
let Dc=DEF(),cfg={member:{},mod:{}},me=null,user=null,tab=localStorage.tab||'ov',dirty={},tmr={},openN={},asked=0;
const uid=()=>'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const can=a=>!!me&&(me.role=='host'||(cfg[me.role]||{})[a]===true),dis=a=>can(a)?'':' disabled';
const words=t=>((t||'').trim().match(/\S+/g)||[]).length,toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',4000)};
const bars=r=>{const m=Math.max(1,...r.map(x=>x[1]+x[2]));return r.map(x=>`<div class=br><span>${e(x[0])}</span><div><i class=a style="width:${x[1]/m*100}%"></i><i class=b style="width:${x[2]/m*100}%"></i></div><b>${x[1]+x[2]}</b></div>`).join('')||'<p class=m>Noch keine Daten.</p>'};
const tbtn=k=>{const n=(Dc.notes.th[k]||[]).length;return `<button class=x data-a=nt data-k="${e(k)}">Notiz${n?' ('+n+')':''}</button>`};
const tbox=(k,tr)=>{if(!openN[k])return'';const n=Dc.notes.th[k]||[],h=`<div class=nt>${n.map(m=>`<p><b>${e(m.w)}</b> <small>${new Date(m.ts).toLocaleDateString('de')}</small><br>${e(m.t)}</p>`).join('')||'<p class=m>Noch keine Notizen.</p>'}${can('notes')?`<input class=ni data-k="${e(k)}" maxlength=500 placeholder="Notiz schreiben, Enter sendet" aria-label="Notiz">`:''}</div>`;return tr?`<tr><td colspan=7>${h}</tr>`:h};
/* Daten laden und speichern */
async function loadProfile(){if(!user){me=null;return}const{data}=await sb.from('profiles').select('id,name,role').eq('id',user.id).maybeSingle();me=data||null}
async function loadDocs(){const[a,b]=await Promise.all([sb.from('docs').select('key,data'),sb.from('config').select('perms').maybeSingle()]);
 if(b.data)cfg=Object.assign({member:{},mod:{}},b.data.perms);(a.data||[]).forEach(r=>{if(!dirty[r.key])Dc[r.key]=norm(r.key,r.data)});if(a.error||b.error)$('#sync').textContent='Verbindung gestört'}
function put(k){dirty[k]=1;$('#sync').textContent='speichert …';clearTimeout(tmr[k]);tmr[k]=setTimeout(async()=>{const{error}=await sb.from('docs').upsert({key:k,data:Dc[k]});delete dirty[k];
 if(error){toast('Nicht gespeichert: keine Berechtigung oder offline');await loadDocs();render()}else $('#sync').textContent='gespeichert'},700)}
async function sync(){await loadProfile();await loadDocs();render();if(user&&!me&&!asked){asked=1;joinDlg()}}
setInterval(async()=>{if(Object.keys(dirty).length||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$('#room').open)return;await loadDocs();render()},20000);
sb.auth.onAuthStateChange((ev,s)=>{user=s?s.user:null;setTimeout(sync,0)});
/* Ansichten */
const V={
ov(){const t=Dc.tasks,o=t.filter(x=>!x.done).length,P=Dc.project,p=Math.round(P.steps.filter(Boolean).length/STEPS.length*100),sw=Dc.script.reduce((n,r)=>n+words(r.x),0),
 days=[...Array(7)].map((_,i)=>{const x=new Date(Date.now()-(6-i)*864e5);return[x.toLocaleDateString('de',{weekday:'short'}),t.filter(y=>y.done&&y.doneAt&&new Date(y.doneAt).toDateString()==x.toDateString()).length,0]}),
 who=[...new Set(t.map(x=>x.who))].map(n=>[n,t.filter(x=>x.who==n&&x.done).length,t.filter(x=>x.who==n&&!x.done).length]);
 return `<div class=fr><label for=lf>Leitfrage</label><textarea id=lf data-f=leit placeholder="Was wollen wir beantworten?"${dis('project')}>${e(P.leit)}</textarea><div class=strip>${STEPS.map((_,i)=>`<i class="${P.steps[i]?'on':''}"></i>`).join('')}</div><p style="margin:8px 0 0"><b>${p} Prozent</b> des Fahrplans erledigt</p></div>
<div class=g><div class=c><b>${o}</b><span>offene Aufgaben</span></div><div class=c><b>${t.length-o}</b><span>erledigte Aufgaben</span></div><div class=c><b>${Dc.src.filter(s=>s.ok).length}/${Dc.src.length}</b><span>Quellen geprüft</span></div><div class=c><b>${(sw/140).toFixed(1).replace('.',',')}</b><span>Minuten Skript</span></div></div>
<div class=two><div><h2>Erledigt in 7 Tagen</h2>${bars(days)}</div><div><h2>Aufgaben pro Person</h2>${bars(who)}<p class=m>Grün erledigt, gelb offen.</p></div></div>`},
ta(){const names=Dc.project.team.filter(Boolean),ts=Dc.tasks.slice().sort((a,b)=>a.done-b.done||PR[a.prio]-PR[b.prio]||(a.due||'9').localeCompare(b.due||'9')),today=new Date().toISOString().slice(0,10);
 return '<h2>Aufgaben</h2>'+(can('tasks')?`<div class=f><input type=text id=tt maxlength=200 placeholder="Neue Aufgabe" aria-label="Aufgabe"><select id=tw aria-label="Zuständig">${['alle',...names].map(n=>`<option>${e(n)}</option>`).join('')}</select><input type=date id=td aria-label="Fällig bis"><select id=tp aria-label="Wichtigkeit"><option>hoch<option selected>mittel<option>niedrig</select><button class=bt data-a=addT>Hinzufügen</button></div>`:'')+
 (ts.map(t=>{const i=Dc.tasks.indexOf(t),late=!t.done&&t.due&&t.due<today;return `<div class="row ${t.done?'d':t.prio=='hoch'?'h':''}"><input type=checkbox data-a=tgT data-i=${i} ${t.done?'checked':''}${dis('tasks')} aria-label="erledigt"><span class=t>${e(t.t)} <small>${e(t.who)}${t.due?', bis '+new Date(t.due).toLocaleDateString('de')+(late?' (überfällig)':''):''}</small></span>${tbtn('t:'+t.id)}${can('tasks')?`<button class=x data-a=delT data-i=${i} aria-label="Löschen">✕</button>`:''}</div>${tbox('t:'+t.id)}`}).join('')||'<p class=m>Noch keine Aufgaben.</p>'+(can('tasks')?'<button class=bt data-a=seed>Aufgaben aus dem Fahrplan anlegen</button>':''))},
wg(){return '<h2>Fahrplan</h2>'+STEPS.map((s,i)=>`<div class="row ${Dc.project.steps[i]?'d':''}"><input type=checkbox data-a=st data-i=${i} ${Dc.project.steps[i]?'checked':''}${dis('project')} aria-label="${s}"><span class=t>${i+1}. ${s}</span>${tbtn('s:'+i)}</div>${tbox('s:'+i)}`).join('')},
sk(){const d=dis('script'),c=can('script'),tot=Dc.script.reduce((n,r)=>n+words(r.x),0);
 return `<h2>Skript als Tabelle</h2><p class=m>Pro Zeile eine Szene. Die Sekunden werden aus dem Sprechertext berechnet (140 Wörter pro Minute).</p><div class=sc><table><thead><tr><th>Nr<th>Szene<th>Sprechertext<th>Bild<th>Quelle<th>Sek<th></tr></thead><tbody>`+
 Dc.script.map((r,i)=>`<tr><td>${i+1}<td><input data-c=t data-i=${i} value="${e(r.t)}"${d} aria-label="Szene"><td><textarea rows=3 data-c=x data-i=${i}${d} aria-label="Sprechertext">${e(r.x)}</textarea><td><textarea rows=3 data-c=v data-i=${i}${d} aria-label="Bild">${e(r.v)}</textarea><td><input data-c=q data-i=${i} value="${e(r.q)}"${d} aria-label="Quelle"><td>${Math.round(words(r.x)/140*60)}<td>${c?`<button class=x data-a=upR data-i=${i} aria-label="Nach oben">▲</button><button class=x data-a=dnR data-i=${i} aria-label="Nach unten">▼</button><button class=x data-a=delR data-i=${i} aria-label="Löschen">✕</button>`:''}${tbtn('x:'+r.id)}</tr>${tbox('x:'+r.id,1)}`).join('')+
 `</tbody></table></div><p>${tot} Wörter, etwa ${(tot/140).toFixed(1).replace('.',',')} Minuten</p>${c?'<button class=bt data-a=addR>Zeile hinzufügen</button>':''}`},
qu(){return '<h2>Quellen</h2>'+(can('src')?`<div class=f><input type=text id=qt maxlength=200 placeholder="Titel oder belegte Aussage"><input type=text id=qu maxlength=300 placeholder="Link (https://…)"><button class=bt data-a=addQ>Hinzufügen</button></div>`:'')+(Dc.src.map((s,i)=>`<div class="row ${s.ok?'d':''}"><input type=checkbox data-a=okQ data-i=${i} ${s.ok?'checked':''}${dis('src')} aria-label="geprüft"><span class=t>${/^https?:\/\//.test(s.u)?`<a href="${e(s.u)}" target=_blank rel="noopener noreferrer">${e(s.t)}</a>`:e(s.t)} <small>${s.ok?'geprüft':'noch ungeprüft'}</small></span>${tbtn('q:'+s.id)}${can('src')?`<button class=x data-a=delQ data-i=${i} aria-label="Löschen">✕</button>`:''}</div>${tbox('q:'+s.id)}`).join('')||'<p class=m>Noch keine Quellen.</p>')},
no(){return `<h2>Notizen</h2><p class=m>Notizen zu einzelnen Aufgaben, Schritten, Szenen und Quellen findest du über den Notiz-Knopf an der jeweiligen Zeile.</p><textarea class=tx data-f=g aria-label="Notizen" maxlength=20000${dis('notes')}>${e(Dc.notes.g)}</textarea>`},
ei(){const h=me&&me.role=='host';
 return `<h2>Einstellungen</h2><details open><summary>Kurzer Website-Guide</summary><p><b>Drei Sichten.</b> Besucher sehen nur den aktuellen Stand. Mitglieder treten mit dem Teamcode bei und bearbeiten, was die Hosts erlauben. Projekthosts verwalten alles, Mods helfen mit den Rechten, die die Hosts vergeben.</p><p><b>Tabs.</b> Übersicht zeigt Fortschritt und Grafiken. Aufgaben, Fahrplan, Skript (Tabelle), Quellen und Notizen sind eure Arbeitsbereiche. Der Notiz-Knopf hängt Notizen an eine Zeile.</p><p><b>Gut zu wissen.</b> Alles hier ist öffentlich lesbar, schreibt also nichts Privates hinein. Gespeichert wird automatisch. Bei gleichzeitiger Arbeit am selben Bereich gewinnt der letzte Speicherstand.</p></details>`+
 (me?`<h2>Team</h2><div id=ml></div>`:'<p>Melde dich an, um das Team zu sehen.</p>')+
 (h?`<h2 style="margin-top:22px">Rechte</h2><p class=m>Projekthosts dürfen immer alles. Hier legst du fest, was Mitglieder und Mods dürfen.</p><div class=sc><table><tr><th>Bereich<th>Mitglied<th>Mod</tr>${Object.entries(AREAS).map(([k,l])=>`<tr><td>${l}<td>${k=='members'?'':`<input type=checkbox data-a=perm data-r=member data-k=${k} ${cfg.member[k]?'checked':''} aria-label="${l} Mitglied">`}<td><input type=checkbox data-a=perm data-r=mod data-k=${k} ${cfg.mod[k]?'checked':''} aria-label="${l} Mod"></tr>`).join('')}</table></div>
 <h2 style="margin-top:22px">Zugangscodes</h2><p class=m>Mindestens 10 Zeichen, lang und nicht erratbar. Alte Mitglieder bleiben im Team.</p><div class=f><input type=password id=cm placeholder="Neuer Teamcode" autocomplete=off><button class=bt data-a=code data-k=member>Teamcode ändern</button></div><div class=f><input type=password id=ch placeholder="Neuer Hostcode" autocomplete=off><button class=bt data-a=code data-k=host>Hostcode ändern</button></div>`:'')}};
async function members(){const{data}=await sb.from('profiles').select('id,name,role').order('name'),el=$('#ml');if(!el||!data)return;
 el.innerHTML=data.map(p=>{const self=p.id==user.id,ck=!self&&(me.role=='host'?p.role!='host':me.role=='mod'&&can('members')&&p.role=='member');
  return `<div class=row><span class=t>${e(p.name)}</span>${me.role=='host'&&!self?`<select data-uid="${e(p.id)}" aria-label="Rolle von ${e(p.name)}">${Object.keys(RN).map(r=>`<option value=${r} ${p.role==r?'selected':''}>${RN[r]}</option>`).join('')}</select>`:`<small>${RN[p.role]}</small>`}${ck?`<button class=x data-a=kick data-uid="${e(p.id)}">Entfernen</button>`:''}</div>`}).join('')}
function render(){$('#who').innerHTML=me?`${e(me.name)} <small>(${RN[me.role]})</small> <button class=x data-a=out>Abmelden</button>`:user?'<button class=bt data-a=joinopen>Team beitreten</button> <button class=x data-a=out>Abmelden</button>':'<button class=bt data-a=auth>Anmelden</button>';
 $('#bn').textContent=me?'':'Du schaust nur zu. Melde dich an und tritt dem Team bei, um mitzumachen.';
 $('#tabs').innerHTML=TABS.map(t=>`<button data-a=tab data-v=${t[0]} class="${t[0]==tab?'on':''}">${t[1]}</button>`).join('');$('#v').innerHTML=V[tab]();if(tab=='ei'&&me)members()}
/* Dialoge */
const dlg=h=>{$('#rb').innerHTML=h;if(!$('#room').open)$('#room').showModal()},msg=m=>{const x=$('#dm');if(x)x.textContent=m};
const authDlg=()=>dlg('<h3>Anmelden</h3><input id=em type=email autocomplete=email placeholder="E-Mail" aria-label="E-Mail"><input id=pw type=password autocomplete=current-password placeholder="Passwort, mindestens 8 Zeichen" aria-label="Passwort"><p id=dm>&nbsp;</p><button data-a=login>Anmelden</button> <button data-a=reg>Neu registrieren</button> <button data-a=rc>Schließen</button>');
const joinDlg=()=>dlg('<h3>Team beitreten</h3><p>Gib den Teamcode ein. Projekthosts haben einen eigenen Hostcode.</p><input id=jn maxlength=30 placeholder="Dein Anzeigename" aria-label="Anzeigename"><input id=jc type=password autocomplete=off placeholder="Code" aria-label="Code"><p id=dm>&nbsp;</p><button data-a=join>Beitreten</button> <button data-a=rc>Später</button>');
/* Aktionen */
const dl=async(f)=>{const{error}=await f;if(error)toast(error.message);return!error};
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,i=+b.dataset.i,D=Dc,k=b.dataset.k;
 if(a=='tab'){tab=b.dataset.v;localStorage.tab=tab;return render()}
 if(a=='rc')return $('#room').close();
 if(a=='auth')return authDlg();if(a=='joinopen')return joinDlg();
 if(a=='out'){await sb.auth.signOut();asked=0;return}
 if(a=='login'||a=='reg'){const c={email:$('#em').value.trim(),password:$('#pw').value};if(c.password.length<8)return msg('Das Passwort braucht mindestens 8 Zeichen.');
  const r=a=='login'?await sb.auth.signInWithPassword(c):await sb.auth.signUp(c);if(r.error)return msg(a=='login'?'Anmeldung fehlgeschlagen.':r.error.message);
  if(a=='reg'&&!r.data.session)return msg('Bitte bestätige die E-Mail und melde dich danach an.');return $('#room').close()}
 if(a=='join'){const r=await sb.rpc('join_team',{code:$('#jc').value,nm:$('#jn').value});if(r.error)return msg(r.error.message);if(r.data=='falsch')return msg('Falscher Code.');$('#room').close();return sync()}
 if(a=='kick'){if(confirm('Wirklich entfernen?')&&await dl(sb.rpc('kick',{target:b.dataset.uid})))members();return}
 if(a=='perm'){cfg[b.dataset.r][k]=b.checked;await dl(sb.rpc('set_perms',{p:cfg}));return}
 if(a=='code'){const x=$(k=='member'?'#cm':'#ch');if(await dl(sb.rpc('set_code',{kind:k,code:x.value}))){x.value='';toast('Code geändert')}return}
 if(a=='nt'){openN[k]=!openN[k];return render()}
 if(a=='addT'){const t=$('#tt').value.trim();if(!t)return;D.tasks.push({id:uid(),t,who:$('#tw').value,due:$('#td').value,prio:$('#tp').value,done:0});put('tasks')}
 else if(a=='seed'){STEPS.forEach(s=>D.tasks.push({id:uid(),t:s,who:'alle',due:'',prio:'mittel',done:0}));put('tasks')}
 else if(a=='tgT'){const t=D.tasks[i];t.done=b.checked?1:0;t.doneAt=b.checked?Date.now():0;put('tasks')}
 else if(a=='delT'){D.tasks.splice(i,1);put('tasks')}
 else if(a=='st'){D.project.steps[i]=b.checked?1:0;put('project')}
 else if(a=='addQ'){const t=$('#qt').value.trim();if(!t)return;D.src.push({id:uid(),t,u:$('#qu').value.trim(),ok:0});put('src')}
 else if(a=='okQ'){D.src[i].ok=b.checked?1:0;put('src')}
 else if(a=='delQ'){D.src.splice(i,1);put('src')}
 else if(a=='addR'){D.script.push({id:uid(),t:'Szene '+(D.script.length+1),x:'',v:'',q:''});put('script')}
 else if(a=='upR'&&i>0){D.script.splice(i-1,0,D.script.splice(i,1)[0]);put('script')}
 else if(a=='dnR'&&i<D.script.length-1){D.script.splice(i+1,0,D.script.splice(i,1)[0]);put('script')}
 else if(a=='delR'){if(!confirm('Zeile löschen?'))return;D.script.splice(i,1);put('script')}
 else return;
 render()});
document.addEventListener('input',ev=>{const t=ev.target,f=t.dataset.f,c=t.dataset.c;
 if(f=='leit'){Dc.project.leit=t.value;put('project')}else if(f=='g'){Dc.notes.g=t.value;put('notes')}else if(c){Dc.script[+t.dataset.i][c]=t.value;put('script')}});
document.addEventListener('change',async ev=>{const t=ev.target;if(t.dataset.c)render();
 if(t.dataset.uid&&t.tagName=='SELECT'){await dl(sb.rpc('set_role',{target:t.dataset.uid,r:t.value}));members()}});
document.addEventListener('keydown',ev=>{const t=ev.target;if(ev.key!='Enter'||!t.classList.contains('ni')||!t.value.trim()||!me)return;
 const k=t.dataset.k;(Dc.notes.th[k]=Dc.notes.th[k]||[]).push({w:me.name,t:t.value.trim().slice(0,500),ts:Date.now()});put('notes');render()});
/* Geheime Räume */
console.log('Der Fuchs im Footer hat drei Leben. Klick ihn dreimal.');
const R={1:["Raum 1: Die Zahlenkammer","Im Jahr 1933 geschah vieles schnell. Suche die Tage im Monat für: Ernennung Hitlers zum Reichskanzler, Reichstagsbrand, Ermächtigungsgesetz. Wie lautet die Summe der drei Tage?","80","Die Tür öffnet sich. Schlüsselwort: <code>QUELLE</code>."],
2:["Raum 2: Die Chiffrierkammer","Verschoben um die Buchstabenzahl des Schlüsselworts: <code>COJKXYZGTJ</code>. Gehe jeden Buchstaben im Alphabet zurück.","WIDERSTAND","Richtig. Der letzte Raum ist offen."]};
function room(n){if(n>2)return dlg('<h3>Raum 3: Das Fuchsarchiv</h3><p>Geschafft. Bonusidee: ein Kapitel über Widerstand. Startpunkte: Weiße Rose, Georg Elsers Attentat 1939, 20. Juli 1944. Raum 4 ist leer: Überlegt euch ein Rätsel, Pyfox baut es ein.</p><button data-a=rc>Schließen</button>');
 const r=R[n];dlg(`<h3>${r[0]}</h3><p>${r[1]}</p><input id=ra autocomplete=off aria-label=Antwort><p id=dm>&nbsp;</p><button id=rg>Prüfen</button> <button data-a=rc>Schließen</button>`);
 $('#rg').onclick=()=>{if($('#ra').value.replace(/\s/g,'').toUpperCase()==r[2]){$('#dm').innerHTML=r[3];localStorage.room=n+1;$('#rg').textContent='Weiter';$('#rg').onclick=()=>room(n+1)}else msg('Noch nicht richtig. Recherchiere weiter.')}}
let fc=0,ft;$('#fox').addEventListener('click',()=>{clearTimeout(ft);fc++;ft=setTimeout(()=>fc=0,1500);if(fc>2){fc=0;room(+(localStorage.room||1))}});
render();sync();
