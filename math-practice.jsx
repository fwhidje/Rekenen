import { useState, useEffect, useRef, useCallback } from "react";

// ─── utils ────────────────────────────────────────────────────────────────────
const rnd  = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[rnd(0,a.length-1)];
const shuf = a => [...a].sort(()=>Math.random()-.5);
const mkCh = c => { const p=new Set([c]); for(const d of[-1,1,-2,2,3,-3]){if(c+d>=0)p.add(c+d);if(p.size===4)break;} return shuf([...p]).slice(0,4); };

// ─── strings ──────────────────────────────────────────────────────────────────
const MSGS = ['🎉 Geweldig!','⭐ Super!','🚀 Waanzinnig!','🦄 Fantastisch!','🔥 Bravo!','💫 Perfect!','🎊 Top!','👏 Goed zo!'];
const LVL  = ['','Telbeer 🐻','Cijferpoes 🐱','Rekenwijs 🐰','Sterrenslim 🦊'];
const MLBL = {
  fill_vis:'Tel en tel op', fill_plain:'Schrijf het antwoord',
  choice:'Kies het goede antwoord', tf:'Waar of niet waar?',
  collect:'Tel samen!', numberline:'Spring op de getallenlijn',
};

// ─── scenes ───────────────────────────────────────────────────────────────────
const SCENES = [
  {e:'⭐',bg:'linear-gradient(160deg,#0f0c29,#302b63)',dk:1},
  {e:'🐠',bg:'linear-gradient(160deg,#005c97,#1cb5e0)',dk:1},
  {e:'🐄',bg:'linear-gradient(160deg,#B3E5FC 30%,#4CAF50)',dk:0},
  {e:'🦋',bg:'linear-gradient(160deg,#E0F7FA,#B2EBF2)',dk:0},
  {e:'🐝',bg:'linear-gradient(160deg,#FFF59D,#AED581)',dk:0},
  {e:'🐑',bg:'linear-gradient(160deg,#B3E5FC 40%,#8BC34A)',dk:0},
  {e:'🐸',bg:'linear-gradient(160deg,#1B5E20,#4CAF50)',dk:1},
  {e:'🦆',bg:'linear-gradient(160deg,#29B6F6,#0288D1)',dk:0},
  {e:'🐞',bg:'linear-gradient(160deg,#388E3C,#66BB6A)',dk:0},
  {e:'🍎',bg:'linear-gradient(160deg,#87CEEB 30%,#8BC34A)',dk:0},
  {e:'🍄',bg:'linear-gradient(160deg,#33691E,#558B2F)',dk:1},
  {e:'🐰',bg:'linear-gradient(160deg,#B3E5FC 40%,#81C784)',dk:0},
  {e:'🚀',bg:'linear-gradient(160deg,#0d0d1a,#1a1a3e)',dk:1},
  {e:'🦕',bg:'linear-gradient(160deg,#1B5E20,#33691E)',dk:1},
  {e:'🍦',bg:'linear-gradient(160deg,#FCE4EC,#E1F5FE)',dk:0},
  {e:'🍪',bg:'linear-gradient(160deg,#FFF3E0,#FFE0B2)',dk:0},
  {e:'🐛',bg:'linear-gradient(160deg,#2E7D32,#66BB6A)',dk:0},
  {e:'🐢',bg:'linear-gradient(160deg,#006064,#00897B)',dk:1},
  {e:'🐱',bg:'linear-gradient(160deg,#F8BBD9,#CE93D8)',dk:0},
  {e:'🐧',bg:'linear-gradient(160deg,#B3E5FC,#E1F5FE)',dk:0},
  {e:'🌾',bg:'linear-gradient(160deg,#F9A825,#FDD835 40%,#87CEEB)',dk:0},
  {e:'🦀',bg:'linear-gradient(160deg,#E65100,#FF8F00 40%,#1565C0)',dk:0},
  {e:'🦉',bg:'linear-gradient(160deg,#1a237e,#283593)',dk:1},
  {e:'🦔',bg:'linear-gradient(160deg,#4E342E,#795548)',dk:1},
];
const DOTCLR = ['#FF6B6B','#4CC9F0','#9B5DE5','#FFD166','#06D6A0','#F77F00','#FF85A1'];

// ─── mode weights ─────────────────────────────────────────────────────────────
const WTS = {
  1:{fill_vis:40, choice:28, tf:14, collect:18},
  2:{fill_vis:32, choice:24, tf:13, collect:17, numberline:14},
  3:{fill_vis:36, choice:20, tf:13, collect:17, numberline:14},
  4:{fill_vis:43, choice:18, tf:13, collect:14, numberline:12},
};

function pickMode(d) {
  const e=Object.entries(WTS[d]);
  let r=rnd(1,e.reduce((s,[,v])=>s+v,0));
  for(const[m,w]of e){r-=w;if(r<=0)return m;}
  return e[0][0];
}

function makeOps(d) {
  if(d===1) return {a:rnd(1,4), b:rnd(1,2)};
  if(d===2) { const a=rnd(1,5); return {a, b:rnd(1,Math.min(3,8-a))}; }
  if(d===3) { const a=rnd(2,7); return {a, b:rnd(1,Math.min(4,10-a))}; }
  /* d===4 */ { const a=rnd(1,8); return {a, b:rnd(1,10-a)}; }
}

// ─── visual probability matrix ────────────────────────────────────────────────
// Rows: levels 1-4. Cols: small (≤5), medium (6-8), hard (9-10)
const VIS_PROB = {
  1: [1.0,  1.0,  1.0],
  2: [0.5,  1.0,  1.0],
  3: [0.0,  0.5,  1.0],
  4: [0.0,  0.1,  0.7],
};
function sumTier(s) { return s<=5 ? 0 : s<=8 ? 1 : 2; }
function pickVtype(d, a, b) {
  const p = VIS_PROB[d][sumTier(a+b)];
  if(Math.random() >= p) return 'pure';
  return Math.random() < 0.5 ? 'dots' : 'scene';
}

function makeQ(d) {
  const mode = pickMode(d);
  let {a,b} = makeOps(d);
  let c1=pick(DOTCLR), c2=pick(DOTCLR);
  while(c2===c1) c2=pick(DOTCLR);
  const sc = pick(SCENES);

  if(mode==='collect') {
    if(d<=2){a=rnd(1,4);b=rnd(1,3);}
    const itype = d===1 ? 'tap' : 'counter';
    return {a,b,c1,c2, mode, vtype:'scene', scene:sc, answer:a+b, itype};
  }
  if(mode==='fill_vis' || mode==='fill_plain') {
    const vt = pickVtype(d, a, b);
    return {a,b,c1,c2, mode:'fill_vis', vtype:vt, scene:sc, answer:a+b, itype:'numpad'};
  }
  if(mode==='choice') {
    const vt = pickVtype(d, a, b);
    return {a,b,c1,c2, mode, vtype:vt, scene:sc, answer:a+b, itype:'choice', options:mkCh(a+b)};
  }
  if(mode==='tf') {
    const ok=Math.random()<.5;
    const off=ok?0:(Math.random()<.5?1:-1)*rnd(1,2);
    return {a,b,c1,c2, mode, vtype:'pure', answer:ok?1:0, shownAns:Math.max(1,a+b+off), itype:'tf'};
  }
  if(mode==='numberline') return {a,b,c1,c2, mode, vtype:'numberline', answer:a+b, itype:'choice', options:mkCh(a+b)};
  return {a,b,c1,c2, mode:'fill_vis', vtype:pickVtype(d,a,b), scene:sc, answer:a+b, itype:'numpad'};
}

// ─── reveal helpers ───────────────────────────────────────────────────────────
// Only fill_vis and choice with dots/scene vtype at levels 1–2 get sequential reveal
const needsReveal = (q,d) =>
  d<=2 && (q.mode==='fill_vis'||q.mode==='choice') && (q.vtype==='dots'||q.vtype==='scene');

// Returns visibility flags for each element of the equation
// gA/gB = how many items of each group are visible
function revFlags(step, q, d) {
  if(!needsReveal(q,d)) return {gA:q.a, visPlus:true, numA:true, plus:true, gB:q.b, numB:true, eq:true};
  // L1: A items one by one → visPlus → B items one by one → numA → eq+ → numB → eq/slot
  if(d===1) return {
    gA:      Math.min(step, q.a),
    visPlus: step >= q.a+1,
    gB:      Math.max(0, Math.min(step-(q.a+1), q.b)),
    numA:    step >= q.a+q.b+2,
    plus:    step >= q.a+q.b+3,
    numB:    step >= q.a+q.b+4,
    eq:      step >= q.a+q.b+5,
  };
  // L2: gA+numA together → plus (both) → gB+numB together → eq/slot
  return {
    gA:      step>=1 ? q.a : 0,
    numA:    step>=1,
    visPlus: step>=2,
    plus:    step>=2,
    gB:      step>=3 ? q.b : 0,
    numB:    step>=3,
    eq:      step>=4,
  };
}

const revTotal = (q,d) => needsReveal(q,d) ? (d===1 ? q.a+q.b+5 : 4) : 0;

// ─── visual components ────────────────────────────────────────────────────────

function DotGroup({n, vis, color}) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:n>6?152:118}}>
      {Array.from({length:n}).map((_,i)=>(
        <div key={i} style={{
          width:26,height:26,borderRadius:'50%',background:color,
          boxShadow:`0 3px 8px ${color}66`,
          opacity: i<vis ? 1 : 0,
          transform: i<vis ? 'scale(1)' : 'scale(0) rotate(-15deg)',
          transition: 'opacity .24s ease, transform .27s ease',
        }}/>
      ))}
    </div>
  );
}

function SceneGroup({n, vis, scene}) {
  return (
    <div style={{
      background:scene.bg, borderRadius:14, padding:'10px 12px',
      display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center',
      minWidth:68, maxWidth:n>6?158:122,
      boxShadow:'0 4px 14px rgba(0,0,0,.18)',
    }}>
      {Array.from({length:n}).map((_,i)=>(
        <span key={i} style={{
          fontSize:27, lineHeight:1.1, display:'inline-block',
          filter: scene.dk ? 'drop-shadow(0 0 3px rgba(255,255,255,.25))' : 'none',
          opacity: i<vis ? 1 : 0,
          transform: i<vis ? 'scale(1)' : 'scale(0) rotate(-10deg)',
          transition: 'opacity .24s ease, transform .27s ease',
        }}>{scene.e}</span>
      ))}
    </div>
  );
}

function NumberLine({a,b}) {
  const total=a+b, cw=Math.max(22,Math.min(32,Math.floor(308/(total+2)))), gap=3;
  return (
    <div style={{width:'100%',padding:'8px 4px 4px',overflowX:'auto'}}>
      <div style={{height:28,position:'relative',marginBottom:4,marginLeft:a*(cw+gap)+cw/2-2}}>
        <div style={{position:'absolute',left:0,background:'#EDE6FF',color:'#9B5DE5',borderRadius:8,
          padding:'3px 9px',fontFamily:'Fredoka One,cursive',fontSize:13,whiteSpace:'nowrap',
          boxShadow:'0 2px 6px rgba(155,93,229,.2)'}}>+ {b} →</div>
      </div>
      <div style={{display:'flex',gap,alignItems:'flex-end'}}>
        {Array.from({length:total+1}).map((_,i)=>{
          const iS=i===a,iE=i===total,iJ=i>a&&i<total,iP=i<a;
          const bg=iP?'#C8EEFF':iS?'#4CC9F0':iJ?'#E9DDFF':iE?'#9B5DE5':'#F0F0F0';
          return (
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <div style={{width:cw,height:cw,borderRadius:7,background:bg,
                border:iS?'2.5px solid #4CC9F0':iE?'2.5px solid #9B5DE5':'2px solid #DDD',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontFamily:'Fredoka One,cursive',fontSize:Math.floor(cw*.48),
                color:iS?'#0077AA':iE?'white':'#888',
                boxShadow:iS||iE?'0 3px 10px rgba(0,0,0,.12)':'none'}}>
                {iS?a:iE?'?':''}
              </div>
              <span style={{fontSize:10,color:'#AAA',fontFamily:'Fredoka One,cursive'}}>{i}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── collect: tap (L1/L2) ─────────────────────────────────────────────────────
function TapCollect({a, b, scene, onResolve}) {
  const [gone, setGone] = useState(new Set());
  const total=a+b, count=gone.size, done=count===total;
  useEffect(()=>{ if(done) setTimeout(()=>onResolve(true),700); },[done]);
  const tap = k => { if(!gone.has(k)&&!done) setGone(s=>{const n=new Set(s);n.add(k);return n;}); };
  const items = [
    ...Array.from({length:a}).map((_,i)=>({k:`a${i}`,g:'a'})),
    ...Array.from({length:b}).map((_,i)=>({k:`b${i}`,g:'b'})),
  ];
  return (
    <div style={{width:'100%'}}>
      <SumDisplay a={a} b={b} bf={42} rightSide={<span style={{fontFamily:'Fredoka One,cursive',fontSize:42,color:'#FF6B35'}}>?</span>}/>
      <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',margin:'16px 0'}}>
        {['a','b'].map(g=>(
          <div key={g} style={{background:scene.bg,borderRadius:16,padding:'12px 14px',
            display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',
            minWidth:70,maxWidth:160,boxShadow:'0 4px 16px rgba(0,0,0,.15)'}}>
            {items.filter(i=>i.g===g).map(item=>(
              <span key={item.k} onClick={()=>tap(item.k)} style={{
                fontSize:30,display:'inline-block',lineHeight:1.1,cursor:'pointer',
                transform:gone.has(item.k)?'scale(0) rotate(20deg)':'scale(1)',
                opacity:gone.has(item.k)?0:1,
                transition:'transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s',
                userSelect:'none',touchAction:'none',
                filter:scene.dk?'drop-shadow(0 0 4px rgba(255,255,255,.3))':'none',
              }}>{scene.e}</span>
            ))}
          </div>
        ))}
      </div>
      <div style={{margin:'0 auto',width:118,minHeight:72,
        background:done?'#06D6A0':'white',
        border:`3px ${done?'solid':'dashed'} ${done?'#06D6A0':'#FF6B35'}`,
        borderRadius:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
        transition:'background .4s,border-color .4s,box-shadow .4s',
        boxShadow:done?'0 6px 20px rgba(6,214,160,.45)':'0 2px 10px rgba(0,0,0,.07)'}}>
        <span style={{fontSize:26}}>{done?'✅':'🧺'}</span>
        <span style={{fontFamily:'Fredoka One,cursive',fontSize:22,color:done?'white':'#FF6B35',transition:'color .3s'}}>{count}/{total}</span>
      </div>
      {!done&&<div style={{textAlign:'center',marginTop:10,fontSize:11,fontWeight:900,color:'#CCC',letterSpacing:.8,textTransform:'uppercase'}}>Tik alle {total} aan</div>}
    </div>
  );
}

// ─── collect: counter (L3/L4) ─────────────────────────────────────────────────
function CounterCollect({a, b, onResolve, disabled}) {
  const [count, setCount] = useState(a);
  const Btn = ({label, color, onClick, off}) => (
    <button onClick={onClick} style={{
      width:72,height:72,fontSize:44,fontFamily:'Fredoka One,cursive',
      background:color,color:'white',border:'none',borderRadius:18,
      cursor:off||disabled?'not-allowed':'pointer',
      opacity:off||disabled?.4:1,
      boxShadow:`0 5px 16px ${color}55`,transition:'opacity .2s,transform .1s',
    }}
    onPointerDown={e=>{if(!off&&!disabled)e.currentTarget.style.transform='scale(0.9)'}}
    onPointerUp={e=>{e.currentTarget.style.transform='scale(1)'}}
    onPointerLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>{label}</button>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,width:'100%'}}>
      <SumDisplay a={a} b={b} bf={60} rightSide={
        <div style={{
          minWidth:72,height:72,fontSize:50,
          background:count>0?'#FF6B35':'#F5F5F5',
          color:count>0?'white':'#CCC',
          borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:'Fredoka One,cursive',
          boxShadow:count>0?'0 4px 14px rgba(255,107,53,.4)':'none',
          transition:'background .18s,box-shadow .18s',
        }}>{count||'?'}</div>
      }/>
      <div style={{display:'flex',gap:18}}>
        <Btn label="−" color="#EF233C" off={count===0} onClick={()=>!disabled&&setCount(c=>Math.max(0,c-1))}/>
        <Btn label="+" color="#4CC9F0" off={false}     onClick={()=>!disabled&&setCount(c=>c+1)}/>
      </div>
      <button onClick={()=>!disabled&&count>0&&onResolve(count===a+b)} style={{
        padding:'14px 44px',fontSize:22,fontFamily:'Fredoka One,cursive',
        background:'#FF6B35',color:'white',border:'none',borderRadius:50,
        cursor:count>0&&!disabled?'pointer':'not-allowed',
        opacity:count===0||disabled?.4:1,
        boxShadow:'0 5px 16px rgba(255,107,53,.4)',transition:'opacity .2s,transform .1s',
      }}
      onPointerDown={e=>{if(count>0&&!disabled)e.currentTarget.style.transform='scale(0.95)'}}
      onPointerUp={e=>{e.currentTarget.style.transform='scale(1)'}}
      onPointerLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>✓ Klaar!</button>
    </div>
  );
}

// ─── shared sum display ───────────────────────────────────────────────────────
// Used by collect components (always fully visible, rightSide is customisable)
function SumDisplay({a, b, bf, rightSide}) {
  const S=(c,t,fs)=><span style={{fontFamily:'Fredoka One,cursive',fontSize:fs||bf,color:c}}>{t}</span>;
  return (
    <div style={{display:'flex',alignItems:'center',gap:bf>50?14:10,flexWrap:'wrap',justifyContent:'center'}}>
      {S('#4CC9F0',a)} {S('#FF6B35','+')} {S('#9B5DE5',b)}
      {S('#CCC','=',bf*0.82)} {rightSide}
    </div>
  );
}

// ─── input controls ───────────────────────────────────────────────────────────
function NumPad({onKey, disabled}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,maxWidth:296,margin:'0 auto',width:'100%'}}>
      {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k=>{
        const isC=k==='✓',isD=k==='⌫';
        return (
          <button key={k} onClick={()=>!disabled&&onKey(k)} style={{
            padding:'15px 0',fontSize:isC||isD?22:26,fontFamily:'Fredoka One,cursive',
            background:isC?'#FF6B35':isD?'#EDEDED':'white',
            color:isC?'white':'#2D2D2D',border:isC?'none':'2px solid #ECECEC',
            borderRadius:16,cursor:disabled?'default':'pointer',
            boxShadow:isC?'0 5px 16px rgba(255,107,53,.38)':'0 2px 7px rgba(0,0,0,.07)',
            opacity:disabled?.45:1,userSelect:'none',transition:'transform .1s',
          }}
          onPointerDown={e=>{if(!disabled)e.currentTarget.style.transform='scale(0.92)'}}
          onPointerUp={e=>{e.currentTarget.style.transform='scale(1)'}}
          onPointerLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>{k}</button>
        );
      })}
    </div>
  );
}

const CC=['#4CC9F0','#9B5DE5','#FF6B35','#06D6A0'];
function ChoiceButtons({options, onPick, disabled}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:304,margin:'0 auto',width:'100%'}}>
      {options.map((o,i)=>(
        <button key={o} onClick={()=>!disabled&&onPick(o)} style={{
          padding:'18px 10px',fontFamily:'Fredoka One,cursive',fontSize:34,
          background:CC[i%CC.length],color:'white',border:'none',borderRadius:18,
          cursor:disabled?'default':'pointer',
          boxShadow:`0 5px 16px ${CC[i%CC.length]}55`,
          opacity:disabled?.45:1,transition:'transform .1s',userSelect:'none',
        }}
        onPointerDown={e=>{if(!disabled)e.currentTarget.style.transform='scale(0.92)'}}
        onPointerUp={e=>{e.currentTarget.style.transform='scale(1)'}}
        onPointerLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>{o}</button>
      ))}
    </div>
  );
}

function TFButtons({onPick, disabled}) {
  return (
    <div style={{display:'flex',gap:14,justifyContent:'center',maxWidth:304,margin:'0 auto',width:'100%'}}>
      {[[1,'✓','#06D6A0','WAAR'],[0,'✗','#EF233C','NIET WAAR']].map(([v,sym,color,lbl])=>(
        <button key={v} onClick={()=>!disabled&&onPick(v)} style={{
          flex:1,padding:'16px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:3,
          fontFamily:'Fredoka One,cursive',background:color,color:'white',border:'none',borderRadius:20,
          boxShadow:`0 5px 16px ${color}55`,cursor:disabled?'default':'pointer',
          opacity:disabled?.45:1,transition:'transform .1s',userSelect:'none',
        }}
        onPointerDown={e=>{if(!disabled)e.currentTarget.style.transform='scale(0.92)'}}
        onPointerUp={e=>{e.currentTarget.style.transform='scale(1)'}}
        onPointerLeave={e=>{e.currentTarget.style.transform='scale(1)'}}>
          <span style={{fontSize:32}}>{sym}</span>
          <span style={{fontSize:12,letterSpacing:.4}}>{lbl}</span>
        </button>
      ))}
    </div>
  );
}

// ─── main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [diff,     setDiff]     = useState(1);
  const [q,        setQ]        = useState(()=>makeQ(1));
  const [qKey,     setQKey]     = useState(0);
  const [input,    setInput]    = useState('');
  const [fb,       setFb]       = useState(null);
  const [streak,   setStreak]   = useState(0);
  const [history,  setHistory]  = useState([]);
  const [levelMsg, setLevelMsg] = useState(null);
  const [revStep,  setRevStep]  = useState(Infinity);

  const timers = useRef([]);

  // ── reveal schedule ──────────────────────────────────────────────────────────
  useEffect(()=>{
    timers.current.forEach(clearTimeout);
    timers.current=[];

    if(!needsReveal(q,diff)){ setRevStep(Infinity); return; }

    setRevStep(0);
    const ts=[];

    if(diff===1){
      let delay=0;
      for(let i=1;i<=q.a;i++){ delay+=600; const s=i; ts.push(setTimeout(()=>setRevStep(s),delay)); }
      delay+=500; ts.push(setTimeout(()=>setRevStep(q.a+1),delay));
      for(let i=1;i<=q.b;i++){ delay+=600; const s=q.a+1+i; ts.push(setTimeout(()=>setRevStep(s),delay)); }
      delay+=750; ts.push(setTimeout(()=>setRevStep(q.a+q.b+2),delay));
      delay+=600; ts.push(setTimeout(()=>setRevStep(q.a+q.b+3),delay));
      delay+=600; ts.push(setTimeout(()=>setRevStep(q.a+q.b+4),delay));
      delay+=700; ts.push(setTimeout(()=>setRevStep(q.a+q.b+5),delay));
    } else {
      // L2: 4 steps — gA+numA, plus, gB+numB, eq
      let d2=0;
      [800,650,800,700].forEach((ms,i)=>{ d2+=ms; ts.push(setTimeout(()=>setRevStep(i+1),d2)); });
    }

    timers.current=ts;
    return ()=>{ ts.forEach(clearTimeout); };
  },[qKey]);

  const revComplete = revStep >= revTotal(q,diff);
  const flags = revFlags(revStep, q, diff);

  // ── advance/retreat logic ────────────────────────────────────────────────────
  const next = useCallback((nd,ns)=>{
    setQ(makeQ(nd)); setDiff(nd); setStreak(ns);
    setQKey(k=>k+1); setInput(''); setFb(null); setLevelMsg(null);
  },[]);

  const resolve = (isOk) => {
    if(fb) return;

    let msg;
    if(isOk) msg=pick(MSGS);
    else if(q.mode==='tf'){
      const wt=q.a+q.b===q.shownAns;
      msg=`Het was ${wt?'WAAR ✓':'NIET WAAR ✗'}! ${q.a}+${q.b}=${q.a+q.b} 💡`;
    } else {
      msg=`Het antwoord is ${q.a+q.b} 💡`;
    }

    setFb({ok:isOk,msg});
    setHistory(h=>[...h,{ok:isOk,diff}]);

    let nd=diff, ns=streak;
    if(isOk){
      ns=streak+1;
      if(ns>=10 && diff<4){ nd=diff+1; ns=0; setLevelMsg('up'); }
      else if(ns>=10){ ns=10; } // max level, keep going
    } else {
      ns=Math.max(0, streak-3);
    }

    setTimeout(()=>next(nd,ns), isOk?1100:2400);
  };

  const handleNumKey = k => {
    if(fb || !revComplete) return;
    if(k==='⌫'){ setInput(v=>v.slice(0,-1)); return; }
    if(k==='✓'){ if(input) resolve(parseInt(input,10)===q.answer); return; }
    if(input.length>=2) return;
    setInput(v=>v+k);
  };

  // ── rendering ────────────────────────────────────────────────────────────────
  const fbColor  = fb ? (fb.ok?'#06D6A0':'#EF233C') : null;
  const isCollect = q.itype==='tap'||q.itype==='counter';
  const hasVis    = !isCollect && q.vtype!=='pure';
  const bf        = hasVis ? '42px' : '60px';

  // Always rendered — visibility driven by opacity/transform, never by mount/unmount
  const SEl = ({vis, color, val, fs}) => (
    <span style={{
      fontFamily:'Fredoka One,cursive', fontSize:fs||bf, color,
      opacity: vis ? 1 : 0,
      transform: vis ? 'scale(1)' : 'scale(0.4)',
      transition: 'opacity .35s ease, transform .38s ease',
      display:'inline-block',
    }}>{val}</span>
  );

  const AnswerSlot = ({vis}) => (
    <div style={{
      minWidth:hasVis?54:72, height:hasVis?54:72, fontSize:hasVis?36:50,
      background:input?'#FF6B35':'#F5F5F5',
      color:input?'white':'#CCC',
      borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Fredoka One,cursive',
      boxShadow:input?'0 4px 14px rgba(255,107,53,.4)':'none',
      opacity: vis ? 1 : 0,
      transform: vis ? 'scale(1)' : 'scale(0.4)',
      transition:'background .18s, box-shadow .18s, opacity .35s ease, transform .38s ease',
    }}>{input||'?'}</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');
        @keyframes pop     {from{transform:scale(0) rotate(-10deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
        @keyframes slideUp {from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce  {0%,100%{transform:translateY(0)}35%{transform:translateY(-18px)}65%{transform:translateY(-8px)}}
        @keyframes shake   {0%,100%{transform:translateX(0)}20%{transform:translateX(-11px)}40%{transform:translateX(11px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}
        @keyframes badgeIn {0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>

      <div style={{minHeight:'100vh',fontFamily:'Nunito,sans-serif',
        background:'linear-gradient(150deg,#FFF9F2,#FFF0FA)',
        display:'flex',flexDirection:'column',alignItems:'center',
        padding:'18px 14px 40px'}}>

        {/* ── header ── */}
        <div style={{width:'100%',maxWidth:430,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{background:'white',borderRadius:16,padding:'8px 18px',boxShadow:'0 2px 10px rgba(0,0,0,.09)'}}>
            <div style={{fontSize:10,fontWeight:900,color:'#BBB',letterSpacing:.7}}>NIVEAU</div>
            <div style={{fontSize:17,fontWeight:800,color:'#555',fontFamily:'Fredoka One,cursive'}}>{LVL[diff]}</div>
          </div>
          <div style={{background:'white',borderRadius:16,padding:'8px 18px',boxShadow:'0 2px 10px rgba(0,0,0,.09)',textAlign:'right'}}>
            <div style={{fontSize:10,fontWeight:900,color:'#BBB',letterSpacing:.7}}>VOORTGANG</div>
            <div style={{fontSize:17,fontWeight:800,fontFamily:'Fredoka One,cursive',color:'#FF6B35'}}>{Math.min(streak,10)} / 10</div>
          </div>
        </div>

        {/* ── level-up banner ── */}
        {levelMsg && (
          <div key={`lm-${qKey}`} style={{marginBottom:12,background:'#06D6A0',color:'#013d1e',
            borderRadius:50,padding:'8px 24px',fontFamily:'Fredoka One,cursive',fontSize:16,
            boxShadow:'0 4px 14px rgba(6,214,160,.45)',animation:'badgeIn .4s ease both'}}>
            🎉 Volgend niveau! Geweldig!
          </div>
        )}

        {/* ── question card ── */}
        <div key={qKey} style={{
          width:'100%',maxWidth:430,background:'white',borderRadius:28,
          padding:isCollect||hasVis?'22px 18px 26px':'34px 20px',
          boxShadow:fb?`0 8px 32px ${fbColor}44,0 0 0 3px ${fbColor}`:'0 8px 30px rgba(0,0,0,.08)',
          marginBottom:16,minHeight:200,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          gap:isCollect||hasVis?14:0,
          animation:fb?(fb.ok?'bounce .55s ease':'shake .4s ease'):'slideUp .3s ease',
          transition:'box-shadow .3s',position:'relative',overflow:'hidden',
        }}>

          {/* Collect modes (self-contained) */}
          {q.itype==='tap'     && <TapCollect     key={qKey} a={q.a} b={q.b} scene={q.scene} onResolve={resolve}/>}
          {q.itype==='counter' && <CounterCollect key={qKey} a={q.a} b={q.b} onResolve={resolve} disabled={!!fb}/>}

          {/* All other modes */}
          {!isCollect && <>
            {/* Visual block — always in DOM, items fade/scale in */}
            {hasVis && (
              q.vtype==='dots'?(
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'center',minHeight:60}}>
                  <DotGroup n={q.a} vis={flags.gA} color={q.c1}/>
                  <span style={{fontSize:28,fontFamily:'Fredoka One,cursive',color:'#FF6B35',display:'inline-block',
                    opacity:flags.visPlus?1:0,transform:flags.visPlus?'scale(1)':'scale(0.4)',
                    transition:'opacity .35s ease,transform .38s ease'}}>+</span>
                  <DotGroup n={q.b} vis={flags.gB} color={q.c2}/>
                </div>
              ):q.vtype==='scene'?(
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'center',minHeight:80}}>
                  <SceneGroup n={q.a} vis={flags.gA} scene={q.scene}/>
                  <span style={{fontSize:28,fontFamily:'Fredoka One,cursive',color:'#FF6B35',display:'inline-block',
                    opacity:flags.visPlus?1:0,transform:flags.visPlus?'scale(1)':'scale(0.4)',
                    transition:'opacity .35s ease,transform .38s ease'}}>+</span>
                  <SceneGroup n={q.b} vis={flags.gB} scene={q.scene}/>
                </div>
              ):q.vtype==='numberline'?(
                <NumberLine a={q.a} b={q.b}/>
              ):null
            )}

            {/* Equation line — always fully in DOM, elements transition in */}
            {q.mode==='tf' ? (
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',justifyContent:'center',minHeight:72}}>
                <span style={{fontFamily:'Fredoka One,cursive',fontSize:bf,color:'#4CC9F0'}}>{q.a}</span>
                <span style={{fontFamily:'Fredoka One,cursive',fontSize:bf,color:'#FF6B35'}}>+</span>
                <span style={{fontFamily:'Fredoka One,cursive',fontSize:bf,color:'#9B5DE5'}}>{q.b}</span>
                <span style={{fontFamily:'Fredoka One,cursive',fontSize:`calc(${bf}*0.84)`,color:'#CCC'}}>=</span>
                <span style={{fontFamily:'Fredoka One,cursive',fontSize:bf,color:'#2D2D2D',
                  background:'#FFF9C4',borderRadius:12,padding:'2px 12px',border:'2px solid #FFD166'}}>
                  {q.shownAns}
                </span>
              </div>
            ):(
              <div style={{display:'flex',alignItems:'center',gap:hasVis?10:14,flexWrap:'wrap',justifyContent:'center',minHeight:72}}>
                <SEl vis={flags.numA} color='#4CC9F0' val={q.a}/>
                <SEl vis={flags.plus} color='#FF6B35' val='+'/>
                <SEl vis={flags.numB} color='#9B5DE5' val={q.b}/>
                <SEl vis={flags.eq}   color='#CCC'    val='=' fs={`calc(${bf}*0.84)`}/>
                <AnswerSlot vis={flags.eq && q.itype==='numpad'}/>
                {q.itype==='choice' && <SEl vis={flags.eq} color='#FF6B35' val='?'/>}
              </div>
            )}
          </>}

          {/* Feedback overlay */}
          {fb && (
            <div style={{position:'absolute',inset:0,
              background:fb.ok?'rgba(6,214,160,.90)':'rgba(255,215,215,.93)',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              borderRadius:28,padding:20,fontFamily:'Fredoka One,cursive',textAlign:'center',
              color:fb.ok?'#013d1e':'#8B0000',animation:'pop .22s ease',gap:8}}>
              <div style={{fontSize:26}}>{fb.msg}</div>
              {!fb.ok && q.mode!=='tf' && !isCollect && (
                <div style={{fontSize:19,opacity:.8}}>{q.a} + {q.b} = {q.a+q.b}</div>
              )}
            </div>
          )}
        </div>

        {/* ── mode label ── */}
        <div style={{fontSize:11,fontWeight:900,color:'#C8C8C8',letterSpacing:.9,marginBottom:16,textTransform:'uppercase'}}>
          {q.mode==='fill_vis' && q.vtype==='pure' ? 'Schrijf het antwoord' : MLBL[q.mode]||''}
        </div>

        {/* ── input controls ── */}
        {q.itype==='numpad' && <NumPad onKey={handleNumKey} disabled={!!fb||!revComplete}/>}
        {q.itype==='choice' && <ChoiceButtons options={q.options} onPick={v=>revComplete&&resolve(v===q.answer)} disabled={!!fb||!revComplete}/>}
        {q.itype==='tf'     && <TFButtons onPick={v=>resolve(v===q.answer)} disabled={!!fb}/>}

        {/* ── history trail ── */}
        {history.length>0 && (
          <div style={{marginTop:26,display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
            {history.slice(-16).map((h,i)=>(
              <div key={i} style={{width:11,height:11,borderRadius:'50%',
                background:h.ok?'#06D6A0':'#EF233C',opacity:.45+(i/16)*.55}}/>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
