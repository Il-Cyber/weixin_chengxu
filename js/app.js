/* ===== 青春诗会 · 诗歌接龙 网页样本 ===== */

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
var LASTCOLOR = "poems_last_color_v1";
var UIDKEY = "poems_uid_v1";
var ADMINKEY = "poems_is_admin_v1";
var ADMIN_CODE = "2026"; // 管理员口令，可按需修改

/* ---------- 敏感词库（可按需增删） ---------- */
// 覆盖辱骂、歧视、低俗色情、暴力威胁、违法内容等常见类别
var SENSITIVE_WORDS = [
  // 辱骂
  "sb", "傻逼", "白痴", "智障", "废物", "垃圾", "滚", "去死", "该死",
  "妈的", "他妈的", "操", "草泥马", "神经病", "贱", "蠢货", "脑残", "煞笔",
  // 歧视
  "黑鬼", "穷鬼", "婊子", "杂种", "龟孙", "乡巴佬",
  // 低俗 / 色情
  "色情", "裸体", "裸聊", "偷拍", "嫖娼", "卖淫", "约炮", "援交", "av",
  "黄片", "口交", "自慰", "群交", "性奴",
  // 暴力 / 威胁 / 违法
  "杀人", "砍人", "杀人犯", "炸死", "枪杀", "报复社会", "自杀", "轻生",
  "贩毒", "吸毒", "洗钱", "诈骗", "赌博", "军火", "走私",
  // 政治类不当表达（此处仅占位，组织者可按需补充）
  "法轮", "邪教"
];

/* 归一化：去空白/标点/符号/数字，英文转小写，仅保留中文与字母 */
function normForCheck(s) {
  return String(s || "").toLowerCase().replace(/[^\u4e00-\u9fa5a-z]/g, "");
}
/* 返回命中的敏感词；无则返回 null */
function findSensitive(str) {
  var n = normForCheck(str);
  if (!n) return null;
  for (var i = 0; i < SENSITIVE_WORDS.length; i++) {
    var w = normForCheck(SENSITIVE_WORDS[i]);
    if (w && n.indexOf(w) !== -1) return SENSITIVE_WORDS[i];
  }
  return null;
}

/* ---------- 用户身份与权限 ---------- */
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
  if (last) {
    // 去掉上一次的颜色，确保"每次点入颜色不同"
    pool = pool.filter(function (p) { return p.c !== last; });
  }
  if (pool.length === 0) pool = PALETTE.slice();
  var idx = Math.floor(Math.random() * pool.length);
  var chosen = pool[idx];
  localStorage.setItem(LASTCOLOR, chosen.c);
  return chosen;
}

/* ---------- 数据存取 ---------- */
function loadPoems() {
  try {
    var raw = localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function savePoems(list) {
  localStorage.setItem(STORE, JSON.stringify(list));
}

function fmtTime() {
  var d = new Date();
  function pad(n) { return n < 10 ? "0" + n : n; }
  return (d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

/* ---------- 渲染 ---------- */
var myColor = pickColor();

function render() {
  var list = loadPoems();
  var ul = document.getElementById("poemList");
  var count = document.getElementById("countBadge");
  var empty = document.getElementById("emptyTip");

  ul.innerHTML = "";
  count.textContent = list.length + " 句";

  if (list.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.forEach(function (item, i) {
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

    // 本人或管理员可删除
    var canDel = item.uid === myUid() || isAdmin();
    if (canDel) {
      var del = document.createElement("button");
      del.className = "poem-del";
      del.type = "button";
      del.title = "删除这句";
      del.textContent = "✕";
      del.setAttribute("data-index", i);
      del.addEventListener("click", function () {
        if (confirm("确定删除这句诗吗？")) {
          var list2 = loadPoems();
          var idx = parseInt(this.getAttribute("data-index"), 10);
          if (idx >= 0 && idx < list2.length) {
            list2.splice(idx, 1);
            savePoems(list2);
            render();
          }
        }
      });
      li.appendChild(del);
    }

    ul.appendChild(li);
  });

  // 滚动到底部，方便持续接龙
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

/* ---------- 顶部颜色指示 ---------- */
(function setColorUI() {
  var dot = document.getElementById("myColorDot");
  var name = document.getElementById("myColorName");
  if (dot) dot.style.background = myColor.c;
  if (name) {
    name.textContent = myColor.name;
    name.style.color = myColor.c;
  }
})();

/* ---------- 提交 ---------- */
function submit() {
  var nickInput = document.getElementById("nick");
  var lineInput = document.getElementById("line");
  var btn = document.getElementById("submitBtn");

  var text = lineInput.value.trim();
  var nick = nickInput.value.trim() || "匿名同学";

  if (!text) {
    lineInput.focus();
    alert("请先写下你的诗句哦～");
    return;
  }

  // 内容自动审查：诗句与昵称都检查，命中即拦截
  if (findSensitive(text) || findSensitive(nick)) {
    alert("检测到不当词汇，请修改后重新提交。");
    return;
  }

  var list = loadPoems();
  list.push({
    text: text,
    author: nick,
    color: myColor.c,
    time: fmtTime(),
    uid: myUid()
  });
  savePoems(list);

  lineInput.value = "";
  render();
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
    } else {
      state.textContent = "";
      state.style.display = "none";
    }
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
      render();
      alert("管理员模式已开启，你现在可以删除任意诗句。");
    } else {
      alert("口令不正确，请重试。");
    }
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

// 初次渲染
render();
