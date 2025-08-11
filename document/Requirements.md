## 基本需求

帮我做一个简单的网页demo，响应式布局。主要用在手机端，后期部署到 vercel（部署说明或其他文档都放在 document文件夹内）

页面入口为：public\index.html 

其余项目按照文件类型分别存放在css，js或 img目录内，且将代码按照业务功能模块分布在单独文件中，方便后续升级



目前只实现一个功能，距离页面底部15%中间位置显示一个比较大的麦克风svg图标，用户用手指轻触图标，开始说话（当前仅需支持中文） ，

然后 说话时 麦克风上方还显示音波动态图标，和 聆听中 提示

当用户松开手指麦克风则表示语音输入结束。

然后，将音频提交到gemini，然后返回结果，并显示结果JSON（原文、关键词等）。

## 基础技术思路

根据google的这个音频理解文档 https://ai.google.dev/gemini-api/docs/audio?hl=zh-cn
纯js+html+css的手机网站，部署到vercel
基本需求，用户按住麦克风图标，说话（20s以内的中文），然后让google的gemini返回json格式的原文、指定的关键词等

好——下面给你一套**可直接部署到 Vercel** 的纯前端（HTML/CSS/JS）+后端（Vercel Serverless API）方案。实现流程：

1. 手机端：按住麦克风开始录音（最多 20s），松开结束并上传（Base64 + mimeType）。
2. 后端（Vercel API route）：把收到的音频 inline 传给 Google Gemini 的 `generateContent`（或使用 Files API 上传更大文件），并把 Gemini 返回的文本结果解析成 JSON（原文、关键词等）返回给前端。
3. 注意：API Key 放在后端环境变量，不暴露到浏览器。Gemini 支持内嵌音频（inlineData）或先上传文件（Files API）。([Google AI for Developers][1])

下面分块给出代码和关键说明（复制到项目，直接部署到 Vercel 即可）。

---

# 1) 前端：`index.html`

保存为 `public/index.html`（或根目录），移动端友好。

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>语音转写（Gemini）</title>
<style>
  :root{--bg:#0f172a;--accent:#7c3aed;--muted:#94a3b8}
  html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Noto Sans CJK SC",sans-serif;background:linear-gradient(180deg,#071130,#071627);color:#fff;display:flex;align-items:center;justify-content:center}
  .card{width:min(680px,92vw);background:rgba(255,255,255,0.03);padding:20px;border-radius:14px;box-shadow:0 6px 20px rgba(2,6,23,0.6)}
  .center{display:flex;flex-direction:column;gap:12px;align-items:center}
  .mic {
    width:84px;height:84px;border-radius:50%;background:linear-gradient(180deg,var(--accent),#5b21b6);display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 30px rgba(124,58,237,0.25);
    -webkit-tap-highlight-color:transparent; touch-action: none;
  }
  .mic svg{width:40px;height:40px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.6))}
  .hint{color:var(--muted);font-size:14px}
  .timer{font-weight:700}
  pre{background:rgba(255,255,255,0.02);padding:8px;border-radius:8px;max-height:240px;overflow:auto;font-size:13px}
  button.small{background:transparent;border:1px solid rgba(255,255,255,0.06);color:var(--muted);padding:6px 10px;border-radius:8px}
</style>
</head>
<body>
  <div class="card center">
    <h2>按住说话 — Gemini 语音理解</h2>
    <div class="center">
      <div id="mic" class="mic" aria-label="按住说话">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1v11"></path>
          <path d="M19 11a7 7 0 0 1-14 0"></path>
          <path d="M12 21v0"></path>
        </svg>
      </div>
      <div class="hint">按住麦克风说话（最长 20s），松开发送</div>
      <div class="hint timer" id="timer">00:00</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button id="playBack" class="small" disabled>回放</button>
        <button id="clear" class="small" disabled>清除</button>
      </div>
    </div>

    <h3 style="margin-top:16px">返回的 JSON（示例）</h3>
    <pre id="output">等待录音...</pre>
  </div>

<script>
(async function(){
  const mic = document.getElementById('mic');
  const timerEl = document.getElementById('timer');
  const output = document.getElementById('output');
  const playBackBtn = document.getElementById('playBack');
  const clearBtn = document.getElementById('clear');

  let mediaStream = null, recorder = null, chunks = [], startTs=0, timerInterval=null, audioUrl=null;

  function formatTime(s){
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(Math.floor(s%60)).padStart(2,'0');
    return `${mm}:${ss}`;
  }

  async function ensureMic(){
    if(!mediaStream){
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    return mediaStream;
  }

  function startTimer(){
    startTs = Date.now();
    timerInterval = setInterval(()=>{
      const sec = Math.floor((Date.now() - startTs)/1000);
      timerEl.textContent = formatTime(sec);
      if(sec >= 20){ // 强制 20s 限制
        stopRecording();
      }
    }, 200);
  }
  function stopTimer(){
    clearInterval(timerInterval);
    timerInterval = null;
  }

  async function startRecording(){
    await ensureMic();
    chunks = [];
    // prefer mimeType 'audio/webm' or 'audio/webm;codecs=opus'
    const options = { mimeType: 'audio/webm;codecs=opus' };
    recorder = new MediaRecorder(mediaStream, options);
    recorder.ondataavailable = e => { if(e.data && e.data.size>0) chunks.push(e.data); };
    recorder.onstop = onStopped;
    recorder.start(100); // collect chunks
    startTimer();
    mic.classList.add('recording');
  }

  async function stopRecording(){
    if(!recorder) return;
    stopTimer();
    recorder.stop();
    mic.classList.remove('recording');
    recorder = null;
  }

  async function onStopped(){
    const blob = new Blob(chunks, { type: 'audio/webm' });
    // create play URL
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(blob);
    playBackBtn.disabled = false;
    clearBtn.disabled = false;

    // check size limit ~ 20MB (Gemini inline limit)
    const maxBytes = 20 * 1024 * 1024;
    if(blob.size > maxBytes){
      output.textContent = `录音太大（${Math.round(blob.size/1024/1024)}MB），请录短于 20s 或在后端使用 Files API 上传。`;
      return;
    }

    output.textContent = '上传并请求 Gemini 中（请稍候）...';
    // convert to base64
    const arrayBuffer = await blob.arrayBuffer();
    const b64 = arrayBufferToBase64(arrayBuffer);

    // POST to our serverless function
    try{
      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: 'audio/webm', data: b64 })
      });
      if(!resp.ok) throw new Error(`网络错误 ${resp.status}`);
      const json = await resp.json();
      // expect { transcript: "...", keywords: [...], raw: {...} }
      output.textContent = JSON.stringify(json, null, 2);
    }catch(err){
      output.textContent = '请求失败：' + (err.message || err);
    }
  }

  function arrayBufferToBase64(buffer){
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return btoa(binary);
  }

  // Press and hold: support touch + mouse
  let pressing = false;
  const startPress = async (ev) => {
    if(pressing) return;
    pressing = true;
    try { await startRecording(); } catch(e){ output.textContent = '无法获取麦克风权限：'+e.message; pressing=false; }
  };
  const endPress = async (ev) => {
    if(!pressing) return;
    pressing = false;
    await stopRecording();
  };

  mic.addEventListener('touchstart', (e)=>{ e.preventDefault(); startPress(); });
  mic.addEventListener('touchend', (e)=>{ e.preventDefault(); endPress(); });
  mic.addEventListener('mousedown', (e)=>{ e.preventDefault(); startPress(); });
  document.addEventListener('mouseup', (e)=>{ endPress(); });

  playBackBtn.addEventListener('click', ()=>{
    if(!audioUrl) return;
    const a = new Audio(audioUrl);
    a.play();
  });
  clearBtn.addEventListener('click', ()=>{
    output.textContent = '等待录音...';
    playBackBtn.disabled = true;
    clearBtn.disabled = true;
    if(audioUrl){ URL.revokeObjectURL(audioUrl); audioUrl = null; }
  });

})();
</script>
</body>
</html>
```

要点说明（前端）：

* 我用 `MediaRecorder` 录 `audio/webm;codecs=opus`（现代 Android/Chrome 支持）。如果你想强制 `mp3`，前端需把 PCM 转成 mp3（不推荐在浏览器做）。Gemini 接受多种音频 MIME 类型，且支持直接将内嵌 Base64 音频传入 `generateContent`。([Google AI for Developers][1])
* 强制**20s 最大时长**并在前端限制（也要在后端再次检查大小/时长）。Gemini inline 请求有**20MB**总大小上限，超出需使用 Files API 上传。([Google AI for Developers][1])

---

# 2) 后端（Vercel Serverless）`/api/transcribe.js`

在你的项目根目录下创建 `api/transcribe.js`（Vercel Serverless）。它会把收到的 base64 音频传给 Gemini 的 `generateContent`（REST）。**别忘了在 Vercel 设置环境变量 `GEMINI_API_KEY`**。

```js
// api/transcribe.js  (Node serverless on Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { mimeType, data } = req.body;
    if(!data || !mimeType) return res.status(400).json({ error: 'missing audio data' });

    // guard: check approximate size (base64 -> bytes)
    const byteLength = Math.floor(data.length * 3 / 4);
    const maxBytes = 20 * 1024 * 1024;
    if (byteLength > maxBytes) {
      return res.status(413).json({ error: 'Audio too large for inline upload (use Files API)' });
    }

    // Build Gemini generateContent request body:
    // We ask Gemini: "把语音转成原文，并返回关键词数组。只返回一个 JSON 对象，字段 transcript 和 keywords"
    const prompt = `请把这个音频完整转写为中文原文，并返回指定关键词。**只**返回一个 JSON 对象，不要多余说明。JSON schema: {"transcript": "...", "keywords": ["..."]}`;
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            }
          ]
        }
      ]
    };

    // Use REST endpoint as doc shows. Provide API key via x-goog-api-key header.
    const apiKey = process.env.GEMINI_API_KEY;
    if(!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const gResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    });

    if(!gResp.ok){
      const txt = await gResp.text();
      return res.status(gResp.status).json({ error: 'Gemini API error', detail: txt });
    }

    const j = await gResp.json();
    // Gemini 返回结构会比较复杂，通常包含候选文本在 j.candidates[].content.parts[].text
    // 下面简单提取所有文本片段并拼成字符串
    let combined = '';
    try {
      const cand = j.candidates || j.candidates || [];
      for(const c of cand){
        if(c.content && c.content.parts){
          for(const p of c.content.parts){
            if(p.text) combined += (p.text + '\n');
          }
        }
      }
    } catch(e){ /* ignore */ }

    // 尝试直接解析 Gemini 返回的 "只返回 JSON" 字符串（用户 prompt 要求）
    let parsed = null;
    try {
      // find first {...} JSON substring
      const m = combined.match(/\{[\s\S]*\}/);
      if(m) parsed = JSON.parse(m[0]);
    } catch(e){
      parsed = null;
    }

    return res.status(200).json({
      raw: j,
      text_blob: combined.trim(),
      parsed_json: parsed
    });

  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
```

要点说明（后端）：

* REST 请求示例和 `inlineData` 的格式参考官方示例（JS 与 REST 均有），请求大小上限约 20MB（包含提示与内嵌文件）。如果要上传更大文件，应先使用 Files API 上传并在 `generateContent` 中引用文件 URI。([Google AI for Developers][1])
* 在 Vercel 上把 `GEMINI_API_KEY` 配到项目的 Environment Variables（不要把 key 放在前端或公开仓库）。
* 如果你预期文件会 >20MB（或长录音），后端应实现 Files API 的 resumable 上传流程（文档中有示例），再把文件 URI 传给 `generateContent`。([Google AI for Developers][1])

---

# 3) 部署 & 测试要点

1. 在项目根（包含 `api/transcribe.js`）把代码推到 GitHub，然后在 Vercel 新建项目并连接仓库。
2. 在 Vercel dashboard 添加环境变量 `GEMINI_API_KEY`（值为你的 Google API Key，或设置 OAuth 等方式，文档示例多用 API key）。([Google AI for Developers][1])
3. CORS：上面示例把后端放在同一域名（Vercel），前端以相对路径调用 `/api/transcribe`，无需额外 CORS 配置。若你拆分域名，要在 serverless 函数里设置允许的 `Access-Control-Allow-Origin`。
4. 日志和错误处理：建议在后端把 Gemini 的原始 response（或错误）记录到 Vercel 日志以便排查。
5. prompt 设计：我在后端 prompt 里强制让模型“只返回 JSON”。这是减少解析复杂性的常用做法，但仍需在后端做容错（上例演示了提取 `{...}` 并尝试 `JSON.parse`）。

---

# 4) 进一步改进（建议）

* 若想提高转写质量，优先用 `mp3` 或无损格式；或在后端把 `webm` 转码成 `mp3`（例如用 FFmpeg 在一个转换流程或云函数里）。
* 对关键词提取可以在 prompt 里明确要求：比如“返回 top 5 个关键词并按重要性排序”。
* 如果并发高或音频较大，建议实现 Files API 上传 + `generateContent` 引用文件方式（效率与稳定性更好）。文档对 Files API、Resumable Upload 有详细示例。([Google AI for Developers][1])

---

# 重要引用（你可复查）

* Gemini 音频理解文档（内嵌音频、Files API、20MB 限制、示例代码）。([Google AI for Developers][1])

---

[1]: https://ai.google.dev/gemini-api/docs/audio?hl=zh-cn "音频理解  |  Gemini API  |  Google AI for Developers"
