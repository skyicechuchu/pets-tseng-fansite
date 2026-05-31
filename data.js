/* =========================================================================
 *  曾沛慈 Pets Tseng 应援站 — 内容数据层
 *  这是你唯一需要编辑的文件。改这里的内容，页面自动更新，不用动 HTML / JS。
 *  【示例数据】标注的部分是占位/示意，拿到真实数据后替换即可。
 * ========================================================================= */
const SITE = {
  // ---- 基本信息 ----
  name: "曾沛慈",
  enName: "Pets Tseng",
  tagline: "国民姐姐 · 用声音说故事的人",
  heroNote: "歌手 · 演员 · 主持 — 从乐团主唱到金曲提名，一路用作品证明自己",

  // ---- 关于 / 传记 ----
  about: {
    bio: [
      "曾沛慈（Pets Tseng），台湾女歌手、演员、主持人。早年以乐团 Sunny Hill 出身，凭借扎实的现场演唱实力崭露头角。",
      "2011 年因偶像剧《终极一班 2》及主题曲〈一个人想着一个人〉走红，从此影视与音乐双线发展，演唱了大量脍炙人口的剧集主题曲与个人作品。",
      "她的嗓音辨识度高、情感张力强，被粉丝称作「国民姐姐」。除了唱跳与戏剧，也长期活跃于综艺主持，是少数能横跨歌、影、视三栖的全能艺人。",
    ],
    info: [
      { label: "中文名", value: "曾沛慈" },
      { label: "英文名", value: "Pets Tseng" },
      { label: "出生", value: "1985 年 6 月 14 日" },
      { label: "出生地", value: "台湾 高雄" },
      { label: "职业", value: "歌手 / 演员 / 主持人" },
      { label: "出道", value: "2007 年（Sunny Hill 时期）" },
    ],
    source: "资料整理自维基百科等公开来源，仅供粉丝交流。",
    // ---- 社交平台（仅放已核实的官方账号；保留 icon）----
    // platform 决定显示哪个 icon：bilibili / youtube / instagram / weibo / facebook / douyin
    socials: [
      { platform: "bilibili",  label: "哔哩哔哩", url: "https://space.bilibili.com/3546795672079131" },
      { platform: "youtube",   label: "YouTube",  url: "https://www.youtube.com/channel/UCLq1-YKPPy1Z8zLiNqe8bBQ" },
      { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/tseng_pets_ohyeah/" },
      { platform: "weibo",     label: "微博",      url: "https://weibo.com/u/1797539504" },
      { platform: "xiaohongshu", label: "小红书",  url: "https://www.xiaohongshu.com/user/profile/5d35a0a90000000016005932" },
      { platform: "facebook",  label: "Facebook", url: "https://www.facebook.com/ohyeahpetsofficial" },
    ],
  },

  // ---- 音乐作品（专辑时间线 + CD 唱片展示）----
  // cover: 可放真实封面图 URL；留空则用品牌色生成的占位唱片
  albums: [
    { year: "2014", title: "我是曾沛慈", type: "首张个人专辑 · 14 曲", label: "福茂唱片",
      note: "正式以个人歌手身份出道的同名专辑。",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/0e/ba/27/0eba270e-369c-217d-de24-4517e5123e2b/dj.iaofpmis.jpg/600x600bb.jpg",
      link: "https://music.apple.com/tw/album/948585160",
      platforms: {
        apple: "https://music.apple.com/tw/album/948585160",
        qq: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E6%88%91%E6%98%AF%E6%9B%BE%E6%B2%9B%E6%85%88&t=album" } },
    { year: "2017", title: "我愛你 以上", type: "专辑 · 13 曲", label: "福茂唱片",
      note: "情歌实力的集成，收录多首传唱金曲。",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music127/v4/e7/75/29/e7752975-9184-8e1e-54cc-1aef6b059fb9/cover.jpg/600x600bb.jpg",
      link: "https://music.apple.com/tw/album/1251369850",
      platforms: {
        apple: "https://music.apple.com/tw/album/1251369850",
        qq: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E6%88%91%E6%84%9B%E4%BD%A0%20%E4%BB%A5%E4%B8%8A&t=album" } },
    { year: "2019", title: "謎之音", type: "专辑 · 10 曲", label: "福茂唱片",
      note: "音乐性更成熟的概念之作。",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/5b/5a/71/5b5a713c-570f-78de-b612-85cdbaf3ecc9/4711228277674.jpg/600x600bb.jpg",
      link: "https://music.apple.com/tw/album/1475895858",
      platforms: {
        apple: "https://music.apple.com/tw/album/1475895858",
        qq: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E8%AC%8E%E4%B9%8B%E9%9F%B3&t=album" } },
    { year: "2022", title: "今天陽光就是特別耀眼特別和諧", type: "专辑 · 10 曲", label: "福茂唱片",
      note: "贴近自我、温暖明亮的创作阶段。",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/68/7d/78/687d7821-9cb4-fe99-2ecf-d2f3ba56325d/4711099698578.jpg/600x600bb.jpg",
      link: "https://music.apple.com/tw/album/1638091421",
      platforms: {
        apple: "https://music.apple.com/tw/album/1638091421",
        qq: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E4%BB%8A%E5%A4%A9%E9%99%BD%E5%85%89%E5%B0%B1%E6%98%AF%E7%89%B9%E5%88%A5%E8%80%80%E7%9C%BC%E7%89%B9%E5%88%A5%E5%92%8C%E8%AB%A7&t=album" } },
    { year: "2025", title: "下週同樣時間", type: "最新专辑 · 11 曲", label: "福茂唱片",
      note: "2025 年最新发行，延续真挚细腻的风格。",
      cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/10/c5/83/10c5830c-3eb9-fcac-0576-1781e4e5aab1/4711280335220.jpg/600x600bb.jpg",
      link: "https://music.apple.com/tw/album/1815486071",
      platforms: {
        apple: "https://music.apple.com/tw/album/1815486071",
        qq: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E4%B8%8B%E9%80%B1%E5%90%8C%E6%A8%A3%E6%99%82%E9%96%93&t=album" } },
  ],

  // ---- 代表曲目（试听 / 平台链接）----
  // audio 有 URL -> 内嵌播放器；留空 -> 显示「官方平台试听」外链
  tracks: [
    { title: "一个人想着一个人", album: "终极一班 2 电视原声带", year: "2011",
      note: "成名曲，传唱度最高的代表作之一。", audio: "",
      link: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E4%B8%80%E5%80%8B%E4%BA%BA%E6%83%B3%E8%91%97%E4%B8%80%E5%80%8B%E4%BA%BA" },
    { title: "不过失去了一点点", album: "终极恶女 片尾曲", year: "2016",
      note: "情歌实力的代表，福茂官方 MV。", audio: "",
      link: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E4%B8%8D%E9%81%8E%E5%A4%B1%E5%8E%BB%E4%BA%86%E4%B8%80%E9%BB%9E%E9%BB%9E" },
    { title: "我的泪", album: "在一起，就好 片尾曲", year: "2015",
      note: "细腻动人的剧集主题曲。", audio: "",
      link: "https://y.qq.com/n/ryqq/search?w=%E6%9B%BE%E6%B2%9B%E6%85%88%20%E6%88%91%E7%9A%84%E6%B7%9A" },
  ],

  // ---- 影音视频 ----
  // 卡片类型（按字段自动判断，优先级从上到下）：
  //   bili: "BVxxxx"        -> 内嵌 B站官方播放器（拿到真实 BV 号后填这里即可内嵌）
  //   biliSpace: "UID"      -> B站个人主页入口卡（点击跳转该账号空间）
  //   都留空                -> （已无占位卡）
  videos: [
    { bili: "BV1z5GH6xExR", title: "《乘风2026》三公帮唱舞台 · 寻「宝莲」",
      channel: "B站 · UP主 JIA孟佳", note: "曾沛慈 × 徐梦洁 × 孟佳 × 王霏霏 三公帮唱舞台（64万播放）" },
    { bili: "BV1SgZFBfE95", title: "《言不由衷》舞台",
      channel: "曾沛慈 · B站官方", note: "《乘风2026》个人舞台（264万播放）" },
    { bili: "BV1tZGe6yEnZ", title: "《第一次爱的人》舞台",
      channel: "曾沛慈 · B站官方", note: "《乘风2026》个人舞台（111万播放）" },
    { bili: "BV1xaG76tEBt", title: "《一样的月光》舞台",
      channel: "曾沛慈 · B站官方", note: "成为那道照亮一些什么的月光（96万播放）" },
    { bili: "BV1hio9B2EvU", title: "《篇章》二公舞台",
      channel: "B站 · UP主 王濛", note: "曾沛慈 × 王濛 × 张灿 二公舞台（108万播放）" },
  ],

  // ---- 应援打投数据看板 ----【示例数据】拿到真实数字后替换 ----
  campaign: {
    title: "应援打投实时看板",
    subtitle: "比赛 / 打投期间的应援数据汇总",
    isDemo: true, // 显示「示例数据」标识
    weibo: {
      label: "微博《乘风2026》实时榜",
      note: "示例数据 · 实时排名请见微博",
      url: "http://t.cn/AXIilX4p",
    },
    stats: [
      { label: "累计投票数", value: "1,284,560", delta: "+12,340", up: true },
      { label: "音源榜排名", value: "#3", delta: "↑2", up: true },
      { label: "MV 总播放", value: "892 万", delta: "+5.1 万", up: true },
      { label: "应援集资", value: "78%", delta: "进行中", up: true },
    ],
    funding: { current: 780000, goal: 1000000, unit: "元", label: "生日应援集资进度" },
    ranking: {
      title: "音源榜实时排名（示例）",
      labels: ["选手 A", "选手 B", "曾沛慈", "选手 C", "选手 D", "选手 E"],
      values: [98, 92, 87, 71, 65, 52],
      highlight: "曾沛慈",
    },
    trend: {
      title: "近 7 日每日投票趋势（示例）",
      labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      values: [82000, 95000, 110000, 128000, 156000, 198000, 235000],
    },
  },

  // ---- 页脚官方链接 ----
  links: [
    { label: "维基百科", url: "https://zh.wikipedia.org/wiki/曾沛慈" },
    { label: "B站官方主页", url: "https://space.bilibili.com/3546795672079131" },
    { label: "福茂唱片", url: "https://www.linfairrecords.com/" },
  ],
  disclaimer: "本站为粉丝应援交流用途，非官方网站。所有图文版权归原作者及版权方所有。",
};
