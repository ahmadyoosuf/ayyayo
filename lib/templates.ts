import type { Kind } from './types'

// Shared plush styling injected into every generated/templated artifact so kid
// creations match the app skin even before any model call.
export const ARTIFACT_BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Nunito',system-ui,sans-serif}
  :root{--ink:#2b1e16;--cream:#fff6e6;--peach:#ffb68a;--butter:#ffd86b;--mint:#a8e5c8;--sky:#a6d8ff;--rose:#ffb3c0}
  html,body{height:100%}
  body{background:#fff6e6;color:#2b1e16;display:flex;align-items:center;justify-content:center;min-height:100%;padding:16px;text-align:center}
  .stage{width:100%;max-width:420px}
  button{font-family:inherit;font-weight:800;font-size:18px;padding:12px 22px;border:3px solid #2b1e16;border-radius:999px;background:#ffd86b;color:#2b1e16;cursor:pointer;box-shadow:0 4px 0 #2b1e16;transition:transform .12s}
  button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b1e16}
  .card{background:#fff;border:4px solid #2b1e16;border-radius:28px;box-shadow:0 6px 0 #2b1e16;padding:22px}
  h1{font-size:26px;font-weight:900;margin-bottom:10px}
`

function doc(title: string, body: string, css = '', js = ''): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>${ARTIFACT_BASE_CSS}${css}</style></head>
<body><div class="stage">${body}</div><script>${js}</script></body></html>`
}

// ── GAME: tap the friendly dragon, score goes up ──
const GAME = doc(
  'Dragon Tap',
  `<div class="card">
    <h1>Tap the Dragon!</h1>
    <div id="score" style="font-size:42px;font-weight:900;color:#ff8e5c">0</div>
    <div id="d" style="font-size:90px;cursor:pointer;user-select:none;transition:transform .1s">&#129422;</div>
    <p style="color:#8e7261;font-weight:700">catch it fast</p>
  </div>`,
  '',
  `let s=0;const d=document.getElementById('d'),sc=document.getElementById('score');
   function move(){d.style.transform='translate('+(Math.random()*120-60)+'px,'+(Math.random()*60-30)+'px) scale(1)'}
   d.onclick=()=>{s++;sc.textContent=s;d.style.transform='scale(1.4)';setTimeout(move,90)};setInterval(move,1200)`,
)

// ── STORY: a tiny branching tale ──
const STORY = doc(
  'The Brave Taco',
  `<div class="card">
    <div id="art" style="font-size:80px">&#127790;</div>
    <p id="txt" style="font-weight:700;font-size:19px;margin:14px 0">A brave taco stood at two doors.</p>
    <div id="choices" style="display:flex;flex-direction:column;gap:10px"></div>
  </div>`,
  '',
  `const scenes={start:{art:'\\uD83C\\uDF2E',t:'A brave taco stood at two doors.',c:[['open the red door','red'],['open the blue door','blue']]},
   red:{art:'\\uD83D\\uDC09',t:'A dragon! But it just wanted a hug.',c:[['hug it','win']]},
   blue:{art:'\\u2B50',t:'A field of stars. So pretty!',c:[['make a wish','win']]},
   win:{art:'\\uD83C\\uDF89',t:'The taco was happy. The end!',c:[['again','start']]}};
   function go(k){const s=scenes[k];document.getElementById('art').textContent=s.art;document.getElementById('txt').textContent=s.t;
   const ch=document.getElementById('choices');ch.innerHTML='';s.c.forEach(([label,next])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>go(next);ch.appendChild(b)})}
   go('start')`,
)

// ── QUIZ: 3 quick questions ──
const QUIZ = doc(
  'Animal Quiz',
  `<div class="card">
    <h1 id="q">Loading…</h1>
    <div id="opts" style="display:flex;flex-direction:column;gap:10px"></div>
    <p id="fb" style="font-weight:800;margin-top:12px;min-height:24px"></p>
  </div>`,
  '',
  `const Q=[{q:'Which one can fly?',o:['Cat','Owl','Fish'],a:1},{q:'Which is biggest?',o:['Ant','Mouse','Whale'],a:2},{q:'Which says moo?',o:['Cow','Duck','Frog'],a:0}];
   let i=0,score=0;function show(){const cur=Q[i];document.getElementById('q').textContent=cur.q;const op=document.getElementById('opts');op.innerHTML='';document.getElementById('fb').textContent='';
   cur.o.forEach((t,idx)=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{if(idx===cur.a){score++;document.getElementById('fb').textContent='Yes!'}else{document.getElementById('fb').textContent='Try again next time!'}
   setTimeout(()=>{i++;if(i<Q.length)show();else{document.getElementById('q').textContent='Score: '+score+'/'+Q.length;op.innerHTML='';document.getElementById('fb').textContent='\\uD83C\\uDF89'}},700)};op.appendChild(b)})}show()`,
)

// ── BUDDY: a character the kid talks to. The parent app handles the real
// Fireworks reply via postMessage; this shell shows the chat + canned fallback. ──
const BUDDY = doc(
  'Sprout the Buddy',
  `<div class="card" style="display:flex;flex-direction:column;height:78vh;max-height:560px">
    <div id="face" style="font-size:64px">&#129516;</div>
    <div style="font-weight:900;font-size:18px">Sprout</div>
    <div id="log" style="flex:1;overflow:auto;text-align:left;margin:12px 0;display:flex;flex-direction:column;gap:8px"></div>
    <div style="display:flex;gap:8px">
      <input id="in" placeholder="say something…" style="flex:1;font-family:inherit;font-size:16px;padding:10px 14px;border:3px solid #2b1e16;border-radius:999px;outline:none"/>
      <button id="send">go</button>
    </div>
  </div>`,
  `.bub{padding:8px 12px;border:2.5px solid #2b1e16;border-radius:16px;max-width:80%;font-weight:700}
   .me{align-self:flex-end;background:#a6d8ff}.bot{align-self:flex-start;background:#a8e5c8}`,
  `const log=document.getElementById('log'),inp=document.getElementById('in');
   function add(t,who){const d=document.createElement('div');d.className='bub '+who;d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight}
   add('Hi! I am Sprout. I love jokes!','bot');
   function send(){const t=inp.value.trim();if(!t)return;add(t,'me');inp.value='';
   // Ask the parent app (which proxies Fireworks). Falls back if no reply.
   const id=Date.now();let done=false;
   function onMsg(e){if(e.data&&e.data.type==='buddy_reply'&&e.data.id===id){done=true;window.removeEventListener('message',onMsg);add(e.data.text,'bot')}}
   window.addEventListener('message',onMsg);
   parent.postMessage({type:'buddy_say',id:id,text:t,persona:'Sprout, a cheerful sprout who loves jokes'},'*');
   setTimeout(()=>{if(!done){window.removeEventListener('message',onMsg);add('Hee hee! Why did the seed go to school? To grow smart!','bot')}},4000)}
   document.getElementById('send').onclick=send;inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()})`,
)

export const TEMPLATES: Record<Kind, { title: string; html: string; persona?: string }> = {
  game: { title: 'Dragon Tap', html: GAME },
  story: { title: 'The Brave Taco', html: STORY },
  quiz: { title: 'Animal Quiz', html: QUIZ },
  buddy: { title: 'Sprout the Buddy', html: BUDDY, persona: 'Sprout, a cheerful sprout who loves jokes' },
}

export function templateFor(kind: Kind) {
  return TEMPLATES[kind]
}
