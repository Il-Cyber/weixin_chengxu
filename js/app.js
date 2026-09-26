/* ===== 青春诗会 · 诗歌接龙 网页样本（云端同步版） =====
 * 数据层：默认使用 LeanCloud 免费云数据库（见 config.js，填好 appId 即开启云端同步）；
 *         未配置时自动回退到浏览器 localStorage（仅本机可见）。
 */

// 云配置（config.js 引入的 window.LEAN_CONFIG）
var CFG = (typeof window !== 'undefined' && window.LEAN_CONFIG) ? window.LEAN_CONFIG : {};
var IS_CLOUD = !!(CFG.appId && typeof AV !== 'undefined');

// 预设色板：均为高饱和、易读色，避免白色与灰色
var PALETTE = [
  { name: "朱砂红", c: "#D14B4B" },
  { name: "茜草红", c: "#C9406B" },
  { name: "暖橙",   c: "#E0763B" },
  { name: "鎏金",   c: "#C9981C" },
  { name: "杏黄",   c: "#D2A02E" },
  { name: "青竹绿", c: "#2F9E6E" },
  { name: "碧湖绿", c: "#0E9A8A" },
  { name: "天青蓝", c: "#2D6FC4" },
  { name: "湖蓝",   c: "#2B8EC4" },
  { name: "紫藤",   c: "#7B5BC4" },
  { name: "葡萄紫", c: "#9A4CA0" },
  { name: "深洋红", c: "#B4356E" }
];

var STORE = "poems_chain_v1";
var IDSEQ = "poems_id_seq_v1";
var LASTCOLOR = "poems_last_color_v1";
var UIDKEY = "poems_uid_v1";
var ADMINKEY = "poems_is_admin_v1";
var ADMIN_CODE = "2026"; // 管理员口令，可按需修改

/* ---------- 敏感词库（可按需增删） ---------- */
var SENSITIVE_WORDS = [
  "sb", "傻逼", "白痴", "智障", "废物", "垃圾", "滚", "去死", "该死",
  "妈的", "他妈的", "操", "草泥马", "神经病", "贱", "蠢货", "脑残", "煞笔",
  "黑鬼", "穷鬼", "婊子", "杂种", "龟孙", "乡巴佬",
  "色情", "裸体", "裸聊", "偷拍", "嫖娼", "卖淫", "约炮", "援交", "av",
  "黄片", "口交", "自慰", "群交", "性奴",
  "杀人", "砍人", "杀人犯", "炸死", "枪杀", "报复社会", "自杀", "轻生",
  "贩毒", "吸毒", "洗钱", "诈骗", "赌博", "军火", "走私",
  "法轮", "邪教"
];
function normForCheck(s) {
  return String(s || "").toLowerCase().replace(/[^\u4e00-\u9fa5a-z]/g, "");
}
function findSensitive(str) {
  var n = normForCheck(str);
  if (!n) return null;
  for (var i = 0; i < SENSITIVE_WORDS.length; i++) {
    var w = normForCheck(SENSITIVE_WORDS[i]);
    if (w && n.indexOf(w) !== -1) return SENSITIVE_WORDS[i];
  }
  return null;
}

/* ---------- 身份 ---------- */
function myUid() {
  var u = localStorage.getItem(UIDKEY);
  if (!u) {
    u = "u" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(UIDKEY, u);
  }
  return u;
}
function isAdmin() {
  return localStorage.getItem(ADMINKEY) === "1";
}

/* ---------- 随机取色（保证本次与上次不同、且非白灰） ---------- */
function pickColor() {
  var last = localStorage.getItem(LASTCOLOR);
  var pool = PALETTE.slice();
  if (last) pool = pool.filter(function (p) { return p.c !== last; });
  if (!pool.length) pool = PALETTE;
  var chosen = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem(LASTCOLOR, chosen.c);
  return chosen;
}

/* ==================== 数据层（云端 / 本地 双实现） ==================== */

/* --- 云端（LeanCloud） --- */
var Cloud = {
  ensureInit: function () {
    if (!AV._initialized) {
      var opt = { appId: CFG.appId, appKey: CFG.appKey };
      if (CFG.serverURL) opt.serverURL = CFG.serverURL;
      AV.init(opt);
      AV._initialized = true;
    }
  },
  load: async function () {
    this.ensureInit();
    var q = new AV.Query('Poem');
    q.ascending('createdAt');
    q.limit(100);
    var recs = await q.find();
    return recs.map(function (r) {
      return {
        id: r.id,
        text: r.get('text'),
        author: r.get('author'),
        color: r.get('color'),
        ownerKey: r.get('ownerKey'),
        time: fmtTime(r.createdAt)
      };
    });
  },
  add: async function (data) {
    this.ensureInit();
    var p = new AV.Object('Poem');
    p.set('text', data.text);
    p.set('author', data.author);
    p.set('color', data.color);
    p.set('ownerKey', data.ownerKey);
    var saved = await p.save();
    return { id: saved.id, time: fmtTime(saved.createdAt) };
  },
  remove: async function (id) {
    this.ensureInit();
    var q = new AV.Query('Poem');
    var rec = await q.get(id);
    await rec.destroy();
  }
};

/* --- 本地（localStorage，回退用） --- */
var Local = {
  nextId: function () {
    var n = parseInt(localStorage.getItem(IDSEQ) || '0', 10) + 1;
    localStorage.setItem(IDSEQ, String(n));
    return 'L' + n;
  },
  load: function () {
    try {
      var raw = localStorage.getItem(STORE);
      var list = raw ? JSON.parse(raw) : [];
      return list.map(function (it) {
        if (!it.id) it.id = Local.nextId();
        return it;
      });
    } catch (e) { return []; }
  },
  save: function (list) {
    localStorage.setItem(STORE, JSON.stringify(list));
  },
  add: async function (data) {
    var list = Local.load();
    var rec = { id: Local.nextId(), text: data.text, author: data.author, color: data.color, ownerKey: data.ownerKey, time: fmtTime() };
    list.push(rec);
    Local.save(list);
    return { id: rec.id, time: rec.time };
  },
  remove: async function (id) {
    var list = Local.load();
    Local.save(list.filter(function (it) { return it.id !== id; }));
  }
};

function Data() {
  return IS_CLOUD ? Cloud : Local;
}

/* ---------- 时间 ---------- */
function fmtTime(d) {
  var x = d || new Date();
  if (x instanceof Date && !isNaN(x)) x = new Date();
  function pad(n) { return n < 10 ? "0" + n : n; }
  return (x.getMonth() + 1) + "-" + pad(x.getDate()) + " " + pad(x.getHours()) + ":" + pad(x.getMinutes());
}

/* ==================== UI ==================== */
var myColor = pickColor();
var poemCache = [];

function render() {
  var ul = document.getElementById("poemList");
  var count = document.getElementById("countBadge");
  var empty = document.getElementById("emptyTip");
  ul.innerHTML = "";
  count.textContent = poemCache.length + " 句";

  if (!poemCache.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  poemCache.forEach(function (item, i) {
    var li = document.createElement("li");
    li.className = "poem-item";

    var num = document.createElement("div");
    num.className = "poem-num";
    num.textContent = i + 1;

    var body = document.createElement("div");
    body.className = "poem-body";

    var text = document.createElement("div");
    text.className = "poem-text";
    text.style.color = item.color;
    text.textContent = item.text;

    var meta = document.createElement("div");
    meta.className = "poem-meta";
    var author = document.createElement("span");
    author.className = "poem-author";
    author.textContent = item.author;
    author.style.color = item.color;
    var time = document.createElement("span");
    time.className = "poem-time";
    time.textContent = item.time;
    meta.appendChild(author);
    meta.appendChild(time);
    body.appendChild(text);
    body.appendChild(meta);
    li.appendChild(num);
    li.appendChild(body);

    var canDel = item.ownerKey === myUid() || isAdmin();
    if (canDel) {
      var del = document.createElement("button");
      del.className = "poem-del";
      del.type = "button";
      del.title = "删除这句";
      del.textContent = "✕";
      del.setAttribute("data-id", item.id);
      del.addEventListener("click", function () {
        if (confirm("确定删除这句诗吗？")) {
          Data().remove(this.getAttribute("data-id"))
            .then(function () { return refresh(); })
            .catch(function () { alert("删除失败，请重试"); });
        }
      });
      li.appendChild(del);
    }
    ul.appendChild(li);
  });
}

async function refresh() {
  try {
    poemCache = await Data().load();
  } catch (e) {
    console.error('load failed', e);
  }
  render();
}

/* ---------- 顶部颜色指示 ---------- */
(function setColorUI() {
  var dot = document.getElementById("myColorDot");
  var name = document.getElementById("myColorName");
  if (dot) dot.style.background = myColor.c;
  if (name) { name.textContent = myColor.name; name.style.color = myColor.c; }
})();

/* ---------- 提交 ---------- */
async function submit() {
  var nickInput = document.getElementById("nick");
  var lineInput = document.getElementById("line");
  var text = lineInput.value.trim();
  var nick = nickInput.value.trim() || "匿名同学";

  if (!text) { lineInput.focus(); alert("请先写下你的诗句哦～"); return; }
  if (findSensitive(text) || findSensitive(nick)) {
    alert("检测到不当词汇，请修改后重新提交。");
    return;
  }
  try {
    await Data().add({ text: text, author: nick, color: myColor.c, ownerKey: myUid() });
    lineInput.value = "";
    await refresh();
  } catch (e) {
    alert("提交失败，请检查云配置或网络后重试");
  }
}

/* ---------- 管理员入口 ---------- */
(function bindAdmin() {
  var toggle = document.getElementById("adminToggle");
  var panel = document.getElementById("adminPanel");
  var codeInput = document.getElementById("adminCode");
  var okBtn = document.getElementById("adminOk");
  var state = document.getElementById("adminState");
  function refreshState() {
    if (isAdmin()) {
      state.textContent = "管理员模式已开启，可删除任意诗句";
      state.style.display = "block";
    } else { state.textContent = ""; state.style.display = "none"; }
  }
  refreshState();
  toggle.addEventListener("click", function () {
    var hidden = panel.style.display === "none";
    panel.style.display = hidden ? "flex" : "none";
    if (hidden) { codeInput.value = ""; codeInput.focus(); }
  });
  okBtn.addEventListener("click", function () {
    if (codeInput.value.trim() === ADMIN_CODE) {
      localStorage.setItem(ADMINKEY, "1");
      panel.style.display = "none";
      refreshState();
      refresh();
      alert("管理员模式已开启，你现在可以删除任意诗句。");
    } else { alert("口令不正确，请重试。"); }
  });
})();

/* ---------- 事件绑定 ---------- */
(function bind() {
  var btn = document.getElementById("submitBtn");
  btn.addEventListener("click", submit);
  var line = document.getElementById("line");
  line.addEventListener("input", function () {
    btn.disabled = line.value.trim().length === 0;
  });
})();

/* ---------- 启动：首次加载 + 云端轮询同步 ---------- */
refresh();
if (IS_CLOUD) {
  // 云端模式下每 5 秒轮询一次，自动同步其他设备的新诗句
  setInterval(refresh, 5000);
  var tip = document.getElementById("cloudTip");
  if (tip) tip.textContent = "云端已同步 · 所有设备实时共享";
}
