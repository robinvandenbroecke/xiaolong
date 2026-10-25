# -*- coding: utf-8 -*-
"""Leerinhoud van Xiaolong.

Alles wat de kinderen zien en horen staat hier. tools/build_content.py
controleert de pinyin, splitst lettergrepen, zoekt audio en schrijft
js/content.js.

Velden per item:
  id    korte sleutel (ook de naam van het geluidsbestand)
  hz    hanzi
  py    pinyin met toontekens, woorden gescheiden door spaties
  nl    betekenis voor kinderen
  em    plaatje (emoji); sw = kleurstaal in plaats van emoji
  k     w = woord, c = vaste uitdrukking, z = zin
  tk    tekenverhaal (geheugensteun bij het teken)
  tiles woorden voor de zinsbouwer (alleen bij zinnen)
"""

def I(id, hz, py, nl, em, k="w", tk=None, tiles=None, sw=None):
    d = {"id": id, "hz": hz, "py": py, "nl": nl, "em": em, "k": k}
    if tk: d["tk"] = tk
    if tiles: d["tiles"] = tiles
    if sw: d["sw"] = sw
    return d

def Z(id, hz, py, nl, em, tiles):
    return I(id, hz, py, nl, em, k="z", tiles=tiles)

def C(id, hz, py, nl, em, tk=None):
    return I(id, hz, py, nl, em, k="c", tk=tk)

def L(id, title, new, kind="les"):
    return {"id": id, "title": title, "new": new, "kind": kind}

# ---------------------------------------------------------------------------
UNITS = [
  {
    "id": "u1", "zh": "四声", "py": "sì shēng", "nl": "De vier tonen", "em": "🎵", "color": "#E4572E",
    "intro": "In het Chinees zing je een beetje. Dezelfde klank met een andere toon is een ander woord.",
    "items": [
      I("ma1", "妈", "mā", "mama", "👩", tk="女 (vrouw) staat links. 马 (paard) rechts zegt hoe je het uitspreekt: ma."),
      I("ba4", "爸", "bà", "papa", "👨"),
      I("ma3", "马", "mǎ", "paard", "🐴", tk="Vroeger tekenden ze echt een paard: met manen, vier poten en een staart."),
      I("yu2", "鱼", "yú", "vis", "🐟", tk="Een vis met een kop, schubben in het midden en een staart onderaan."),
    ],
    "lessons": [
      L("u1a", "Toon 1 en toon 4", ["ma1", "ba4"], "toonles"),
      L("u1b", "Toon 2 en toon 3", ["yu2", "ma3"], "toonles"),
      L("u1c", "Alle vier de tonen", [], "toonles"),
    ],
  },
  {
    "id": "u2", "zh": "你好", "py": "nǐ hǎo", "nl": "Hallo!", "em": "👋", "color": "#F28C28",
    "intro": "Hallo zeggen, dankjewel zeggen en zeggen hoe je heet.",
    "items": [
      C("nihao", "你好", "nǐ hǎo", "hallo", "👋"),
      C("zaijian", "再见", "zàijiàn", "dag, tot ziens", "🚪"),
      C("xiexie", "谢谢", "xièxie", "dankjewel", "🙏"),
      I("wo", "我", "wǒ", "ik", "🙋"),
      I("ni", "你", "nǐ", "jij", "👉", tk="Links staat 亻, het mensteken. Bij 你 gaat het over een mens: jij."),
      I("hao", "好", "hǎo", "goed", "👍", tk="女 (een mama) en 子 (een kind) samen. Je kan het onthouden als: mama met haar kindje, dat is goed."),
      I("dui", "对", "duì", "juist", "✅"),
      I("bu", "不", "bù", "niet, nee", "❌"),
      C("nihaoma", "你好吗", "nǐ hǎo ma", "hoe gaat het?", "🤔", tk="吗 maakt van een zin een vraag. Kijk: links staat 口, de mond."),
      C("wohenhao", "我很好", "wǒ hěn hǎo", "het gaat goed", "😀"),
      Z("wojiao", "我叫小龙", "wǒ jiào Xiǎolóng", "ik heet Xiǎolóng", "🐉", ["我", "叫", "小龙"]),
    ],
    "lessons": [
      L("u2a", "Hallo en dag", ["nihao", "zaijian", "xiexie"]),
      L("u2b", "Ik en jij", ["wo", "ni", "hao"]),
      L("u2c", "Hoe gaat het?", ["dui", "bu", "nihaoma", "wohenhao"]),
      L("u2d", "Ik heet…", ["wojiao"]),
      L("u2s", "Verhaal: Hallo, Yuányuan!", [], "verhaal"),
    ],
  },
  {
    "id": "u3", "zh": "数字", "py": "shùzì", "nl": "Tellen tot tien", "em": "🔢", "color": "#E9B000",
    "intro": "Tellen van één tot tien, en vragen hoe oud iemand is.",
    "items": [
      I("yi1", "一", "yī", "één", "1️⃣", tk="Eén streep is één."),
      I("er4", "二", "èr", "twee", "2️⃣", tk="Twee strepen is twee."),
      I("san1", "三", "sān", "drie", "3️⃣", tk="Drie strepen is drie. Makkelijk!"),
      I("si4", "四", "sì", "vier", "4️⃣"),
      I("wu3", "五", "wǔ", "vijf", "5️⃣"),
      I("liu4", "六", "liù", "zes", "6️⃣", tk="In China toon je zes met je duim en je pink, zoals een telefoontje."),
      I("qi1", "七", "qī", "zeven", "7️⃣"),
      I("ba1", "八", "bā", "acht", "8️⃣", tk="Twee strepen die uit elkaar gaan. In China is acht een geluksgetal."),
      I("jiu3", "九", "jiǔ", "negen", "9️⃣"),
      I("shi2", "十", "shí", "tien", "🔟", tk="Een kruisje is tien."),
      Z("nijisui", "你几岁", "nǐ jǐ suì", "hoe oud ben jij?", "🎂", ["你", "几", "岁"]),
      Z("woqisui", "我七岁", "wǒ qī suì", "ik ben zeven", "7️⃣🎂", ["我", "七", "岁"]),
    ],
    "lessons": [
      L("u3a", "Eén, twee, drie", ["yi1", "er4", "san1"]),
      L("u3b", "Vier, vijf, zes", ["si4", "wu3", "liu4"]),
      L("u3c", "Zeven tot tien", ["qi1", "ba1", "jiu3", "shi2"]),
      L("u3d", "Hoe oud ben je?", ["nijisui", "woqisui"]),
      L("u3s", "Verhaal: Hoe oud ben jij?", [], "verhaal"),
    ],
  },
  {
    "id": "u4", "zh": "我家", "py": "wǒ jiā", "nl": "Mijn familie", "em": "🏠", "color": "#8CB369",
    "intro": "Papa, mama, broers, zussen, opa en oma.",
    "items": [
      I("baba", "爸爸", "bàba", "papa", "👨"),
      I("mama", "妈妈", "māma", "mama", "👩", tk="Twee keer 妈. Bij mama zie je links altijd 女, het vrouwteken."),
      C("zheshi", "这是", "zhè shì", "dit is", "👇"),
      I("gege", "哥哥", "gēge", "grote broer", "👦"),
      I("didi", "弟弟", "dìdi", "kleine broer", "🧒"),
      I("shi4", "是", "shì", "is, ben", "🔗"),
      I("jiejie", "姐姐", "jiějie", "grote zus", "👱‍♀️", tk="Weer 女 links: een meisje."),
      I("meimei", "妹妹", "mèimei", "kleine zus", "👧", tk="Ook 妹 heeft 女 links."),
      I("ta1", "他", "tā", "hij", "👈👦", tk="亻 het mensteken: 他 is hij."),
      I("ta2", "她", "tā", "zij", "👈👧", tk="Bij zij staat 女 links. Dit teken bestaat pas ongeveer honderd jaar. Het klinkt precies als 他."),
      I("yeye", "爷爷", "yéye", "opa", "👴"),
      I("nainai", "奶奶", "nǎinai", "oma", "👵"),
      Z("zheshiwomama", "这是我妈妈", "zhè shì wǒ māma", "dit is mijn mama", "👇👩", ["这", "是", "我", "妈妈"]),
      Z("tashiwogege", "他是我哥哥", "tā shì wǒ gēge", "hij is mijn grote broer", "👦", ["他", "是", "我", "哥哥"]),
      Z("tashiwomeimei", "她是我妹妹", "tā shì wǒ mèimei", "zij is mijn kleine zus", "👧", ["她", "是", "我", "妹妹"]),
    ],
    "lessons": [
      L("u4a", "Papa en mama", ["baba", "mama", "zheshi"]),
      L("u4b", "Broers", ["gege", "didi", "shi4"]),
      L("u4c", "Zussen", ["jiejie", "meimei", "ta1", "ta2"]),
      L("u4d", "Opa en oma", ["yeye", "nainai"]),
      L("u4e", "Wie is wie?", ["zheshiwomama", "tashiwogege", "tashiwomeimei"]),
      L("u4f", "Tekenfamilie: 女", [], "tekens"),
      L("u4s", "Verhaal: Het fotoalbum", [], "verhaal"),
    ],
  },
  {
    "id": "u5", "zh": "动物", "py": "dòngwù", "nl": "Dieren", "em": "🐼", "color": "#2E9E8F",
    "intro": "Katten, honden, panda's en een dinosaurus.",
    "items": [
      I("mao", "猫", "māo", "kat", "🐱", tk="Links staat 犭, het dierenteken. En luister: māo klinkt bijna als miauw!"),
      I("gou", "狗", "gǒu", "hond", "🐶", tk="Ook de hond heeft 犭, het dierenteken, links."),
      I("niao", "鸟", "niǎo", "vogel", "🐦", tk="Vroeger was dit een tekening van een vogel met een oog, vleugels en pootjes."),
      I("niu", "牛", "niú", "koe", "🐮", tk="Een koeienkop met twee hoorns."),
      I("shenme", "什么", "shénme", "wat?", "❓"),
      Z("zheshishenme", "这是什么", "zhè shì shénme", "wat is dit?", "👇❓", ["这", "是", "什么"]),
      I("xiongmao", "熊猫", "xióngmāo", "panda", "🐼", tk="熊 is beer en 猫 is kat. Een panda is in het Chinees een berenkat!"),
      I("laohu", "老虎", "lǎohǔ", "tijger", "🐯"),
      I("houzi", "猴子", "hóuzi", "aap", "🐵", tk="猴 heeft links het dierenteken 犭."),
      I("tuzi", "兔子", "tùzi", "konijn", "🐰"),
      I("long", "龙", "lóng", "draak", "🐉", tk="Lóng is de draak. Xiǎolóng, 小龙, is een kleine draak!"),
      I("konglong", "恐龙", "kǒnglóng", "dinosaurus", "🦕", tk="恐 is angst en 龙 is draak. Een dinosaurus is een angstdraak!"),
      Z("zheshixiongmao", "这是熊猫", "zhè shì xióngmāo", "dit is een panda", "👇🐼", ["这", "是", "熊猫"]),
    ],
    "lessons": [
      L("u5a", "Kat, hond en vogel", ["mao", "gou", "niao"]),
      L("u5b", "Wat is dit?", ["niu", "shenme", "zheshishenme"]),
      L("u5c", "In de dierentuin", ["xiongmao", "laohu", "houzi", "tuzi"]),
      L("u5d", "Draken!", ["long", "konglong", "zheshixiongmao"]),
      L("u5e", "Tekenfamilie: 犭", [], "tekens"),
      L("u5s", "Verhaal: In de zoo", [], "verhaal"),
    ],
  },
  {
    "id": "u6", "zh": "好吃", "py": "hǎochī", "nl": "Eten en drinken", "em": "🥟", "color": "#D1495B",
    "intro": "Wat eet je graag? Frietjes, dumplings of chocolade?",
    "items": [
      I("chi", "吃", "chī", "eten", "🍽️", tk="Links staat 口, de mond. Met je mond eet je."),
      I("he", "喝", "hē", "drinken", "🥤", tk="Ook drinken doe je met je mond: 口 staat links."),
      I("shui", "水", "shuǐ", "water", "💧", tk="Vroeger tekenden ze een riviertje met golfjes."),
      I("niunai", "牛奶", "niúnǎi", "melk", "🥛", tk="牛 is koe en 奶 is melk. Koeienmelk!"),
      I("pingguo", "苹果", "píngguǒ", "appel", "🍎", tk="In 果 zie je een boom 木 met een vrucht erop."),
      I("xiangjiao", "香蕉", "xiāngjiāo", "banaan", "🍌"),
      C("haochi", "好吃", "hǎochī", "lekker!", "😋", tk="好 is goed en 吃 is eten. Goed om te eten: lekker!"),
      I("mifan", "米饭", "mǐfàn", "rijst", "🍚", tk="米 lijkt op rijstkorrels rond een stengel."),
      I("miantiao", "面条", "miàntiáo", "noedels", "🍜"),
      I("jiaozi", "饺子", "jiǎozi", "dumplings", "🥟"),
      C("woele", "我饿了", "wǒ è le", "ik heb honger", "🤤"),
      I("bingqilin", "冰淇淋", "bīngqílín", "ijsje", "🍦", tk="冰 betekent ijs. Kijk: links staan twee stipjes, zoals ijskristallen."),
      I("qiaokeli", "巧克力", "qiǎokèlì", "chocolade", "🍫", tk="Zeg het snel: qiǎo-kè-lì. Hoor je chocolade?"),
      I("shutiao", "薯条", "shǔtiáo", "frietjes", "🍟", tk="薯 is aardappel en 条 is een reepje. Aardappelreepjes!"),
      C("woyao", "我要", "wǒ yào", "ik wil", "☝️"),
      Z("woyaochijiaozi", "我要吃饺子", "wǒ yào chī jiǎozi", "ik wil dumplings eten", "🥟", ["我", "要", "吃", "饺子"]),
      Z("woyaoheshui", "我要喝水", "wǒ yào hē shuǐ", "ik wil water drinken", "💧", ["我", "要", "喝", "水"]),
    ],
    "lessons": [
      L("u6a", "Eten en drinken", ["chi", "he", "shui", "niunai"]),
      L("u6b", "Fruit", ["pingguo", "xiangjiao", "haochi"]),
      L("u6c", "Ik heb honger!", ["mifan", "miantiao", "jiaozi", "woele"]),
      L("u6d", "Iets lekkers", ["bingqilin", "qiaokeli", "shutiao", "woyao"]),
      L("u6e", "Ik wil…", ["woyaochijiaozi", "woyaoheshui"]),
      L("u6f", "Tekenfamilie: 口", [], "tekens"),
      L("u6s", "Verhaal: Xiǎolóng heeft honger", [], "verhaal"),
    ],
  },
  {
    "id": "u7", "zh": "暗号", "py": "ànhào", "nl": "Geheimtaal voor broers", "em": "🤫", "color": "#7B5EA7",
    "intro": "Wat je zegt als je samen speelt: snel, wacht, mijn beurt, niet eerlijk!",
    "items": [
      C("kuaidian", "快点", "kuài diǎn", "snel! schiet op!", "💨"),
      C("dengyixia", "等一下", "děng yíxià", "wacht even", "⏳"),
      C("haode", "好的", "hǎo de", "oké", "👌"),
      C("lundaowole", "轮到我了", "lúndào wǒ le", "mijn beurt!", "🎲"),
      C("woyingle", "我赢了", "wǒ yíng le", "ik heb gewonnen!", "🏆"),
      C("bugongping", "不公平", "bù gōngpíng", "niet eerlijk!", "😤"),
      C("woyeyao", "我也要", "wǒ yě yào", "ik ook!", "🙋🙋"),
      C("geiwo", "给我", "gěi wǒ", "geef mij", "🤲"),
      C("meiwenti", "没问题", "méi wèntí", "geen probleem", "😎"),
      C("jiayou", "加油", "jiāyóu", "zet hem op!", "💪", tk="Letterlijk: olie erbij doen, zoals benzine in een auto. Zo roepen Chinese kinderen elkaar moed in."),
      C("taibangle", "太棒了", "tài bàng le", "super!", "🤩"),
      C("haowan", "好玩", "hǎowán", "leuk!", "🎉", tk="好 is goed en 玩 is spelen. Goed om mee te spelen: leuk!"),
    ],
    "lessons": [
      L("u7a", "Snel! Wacht!", ["kuaidian", "dengyixia", "haode"]),
      L("u7b", "Wie wint?", ["lundaowole", "woyingle", "bugongping"]),
      L("u7c", "Ik ook!", ["woyeyao", "geiwo", "meiwenti"]),
      L("u7d", "Super!", ["jiayou", "taibangle", "haowan"]),
      L("u7s", "Verhaal: Wie wint?", [], "verhaal"),
    ],
  },
  {
    "id": "u8", "zh": "颜色", "py": "yánsè", "nl": "Kleuren", "em": "🎨", "color": "#3C91E6",
    "intro": "Rood, blauw, geel, groen, wit en zwart. En wat vind jij mooi?",
    "items": [
      I("hongse", "红色", "hóngsè", "rood", "", sw="#E53935", tk="色 betekent kleur. 红 is rood, de gelukskleur van China."),
      I("lanse", "蓝色", "lánsè", "blauw", "", sw="#1E63D6"),
      I("huangse", "黄色", "huángsè", "geel", "", sw="#FBC02D"),
      I("lvse", "绿色", "lǜsè", "groen", "", sw="#2E9E44"),
      I("baise", "白色", "báisè", "wit", "", sw="#FFFFFF"),
      I("heise", "黑色", "hēisè", "zwart", "", sw="#1B1B1B"),
      I("xihuan", "喜欢", "xǐhuan", "graag hebben, leuk vinden", "❤️"),
      I("yanse", "颜色", "yánsè", "kleur", "🎨"),
      C("nine", "你呢", "nǐ ne", "en jij?", "👉❔"),
      I("he2", "和", "hé", "en", "➕"),
      Z("woxihuanhongse", "我喜欢红色", "wǒ xǐhuan hóngsè", "ik vind rood mooi", "❤️", ["我", "喜欢", "红色"]),
      Z("nixihuanshenmeyanse", "你喜欢什么颜色", "nǐ xǐhuan shénme yánsè", "welke kleur vind jij mooi?", "🎨❓", ["你", "喜欢", "什么", "颜色"]),
    ],
    "lessons": [
      L("u8a", "Rood, blauw, geel", ["hongse", "lanse", "huangse"]),
      L("u8b", "Groen, wit, zwart", ["lvse", "baise", "heise"]),
      L("u8c", "Wat vind jij mooi?", ["xihuan", "yanse", "nine", "he2"]),
      L("u8d", "Mijn lievelingskleur", ["woxihuanhongse", "nixihuanshenmeyanse"]),
      L("u8s", "Verhaal: De regenboog", [], "verhaal"),
    ],
  },
  {
    "id": "u9", "zh": "身体", "py": "shēntǐ", "nl": "Mijn lijf", "em": "🙆", "color": "#C05299",
    "intro": "Hoofd, handen, voeten, ogen en oren. En een spelletje: Xiǎolóng zegt…",
    "items": [
      I("tou", "头", "tóu", "hoofd", "🙆"),
      I("shou", "手", "shǒu", "hand", "✋", tk="Vroeger was dit een hand met vingers."),
      I("jiao", "脚", "jiǎo", "voet", "🦶"),
      I("yanjing", "眼睛", "yǎnjing", "ogen", "👀", tk="In 眼 en in 睛 staat links 目, het oog."),
      I("erduo", "耳朵", "ěrduo", "oren", "👂", tk="耳 was vroeger een tekening van een oor."),
      I("bizi", "鼻子", "bízi", "neus", "👃"),
      I("zuiba", "嘴巴", "zuǐba", "mond", "👄", tk="Links in 嘴 zie je 口, de mond."),
      I("kou", "口", "kǒu", "mond (teken)", "👄", tk="Een open mond: een vierkantje."),
      I("mu", "目", "mù", "oog (teken)", "👁️", tk="Een oog dat rechtop staat. Draai je hoofd en je ziet het!"),
      I("mo", "摸", "mō", "aanraken", "👆"),
      Z("momonidetou", "摸摸你的头", "mōmo nǐ de tóu", "raak je hoofd aan", "🙆", ["摸摸", "你的", "头"]),
      Z("momonidebizi", "摸摸你的鼻子", "mōmo nǐ de bízi", "raak je neus aan", "👃", ["摸摸", "你的", "鼻子"]),
    ],
    "lessons": [
      L("u9a", "Hoofd, hand, voet", ["tou", "shou", "jiao"]),
      L("u9b", "Ogen, oren, neus, mond", ["yanjing", "erduo", "bizi", "zuiba"]),
      L("u9c", "Xiǎolóng zegt…", ["kou", "mu", "mo", "momonidetou", "momonidebizi"]),
      L("u9s", "Verhaal: Xiǎolóng zegt…", [], "verhaal"),
    ],
  },
  {
    "id": "u10", "zh": "运动", "py": "yùndòng", "nl": "Bewegen", "em": "⛷️", "color": "#2D7DD2",
    "intro": "Lopen, springen, zwemmen, skiën en voetballen.",
    "items": [
      I("pao", "跑", "pǎo", "lopen, rennen", "🏃", tk="Links staat 𧾷, het voetteken. Rennen doe je met je voeten."),
      I("tiao", "跳", "tiào", "springen", "🦘", tk="Ook 跳 heeft het voetteken 𧾷 links."),
      I("zou", "走", "zǒu", "wandelen", "🚶"),
      I("zuo", "坐", "zuò", "zitten", "💺", tk="Twee mensjes 人 zitten op de grond 土."),
      I("kan", "看", "kàn", "kijken", "🧐", tk="Bovenaan een hand, daaronder 目, het oog. Een hand boven je ogen om goed te kijken!"),
      I("ting", "听", "tīng", "luisteren", "🎧"),
      I("shuo", "说", "shuō", "zeggen, praten", "🗣️"),
      I("shuijiao", "睡觉", "shuìjiào", "slapen", "😴", tk="In 睡 staat links 目, het oog. Als je slaapt, gaan je ogen dicht."),
      I("wan", "玩", "wán", "spelen", "🎮"),
      I("huaxue", "滑雪", "huáxuě", "skiën", "⛷️", tk="滑 is glijden en 雪 is sneeuw. Glijden op de sneeuw!"),
      I("youyong", "游泳", "yóuyǒng", "zwemmen", "🏊", tk="游 en 泳 hebben allebei 氵 links: drie druppels water."),
      C("tizuqiu", "踢足球", "tī zúqiú", "voetballen", "⚽", tk="踢 is trappen, 足 is voet en 球 is bal. Trappen tegen een voetbal!"),
      I("hui", "会", "huì", "kunnen", "💡"),
      I("women", "我们", "wǒmen", "wij", "👫", tk="们 maakt meer dan één. 我 is ik, 我们 is wij."),
      I("qu", "去", "qù", "gaan", "➡️"),
      Z("wohuihuaxue", "我会滑雪", "wǒ huì huáxuě", "ik kan skiën", "⛷️", ["我", "会", "滑雪"]),
      Z("womenquwanba", "我们去玩吧", "wǒmen qù wán ba", "kom, we gaan spelen!", "🎮", ["我们", "去", "玩", "吧"]),
      Z("nihuiyouyongma", "你会游泳吗", "nǐ huì yóuyǒng ma", "kan jij zwemmen?", "🏊❓", ["你", "会", "游泳", "吗"]),
    ],
    "lessons": [
      L("u10a", "Lopen en springen", ["pao", "tiao", "zou", "zuo"]),
      L("u10b", "Kijken en luisteren", ["kan", "ting", "shuo", "shuijiao"]),
      L("u10c", "Sporten", ["wan", "huaxue", "youyong", "tizuqiu"]),
      L("u10d", "Ik kan het!", ["hui", "women", "qu", "wohuihuaxue", "womenquwanba", "nihuiyouyongma"]),
      L("u10e", "Tekenfamilie: 𧾷 en 氵", [], "tekens"),
      L("u10s", "Verhaal: Sportdag", [], "verhaal"),
    ],
  },
  {
    "id": "u11", "zh": "山水", "py": "shān shuǐ", "nl": "Bergen, zon en maan", "em": "⛰️", "color": "#4F772D",
    "intro": "Tekens die er nog uitzien als tekeningen. En sneeuw op de berg!",
    "items": [
      I("ren", "人", "rén", "mens", "🧑", tk="Een mens die wandelt: twee benen."),
      I("da", "大", "dà", "groot", "🐘", tk="Een mens die zijn armen wijd open doet: zó groot!"),
      I("xiao", "小", "xiǎo", "klein", "🐭", tk="Drie kleine stukjes. 小龙 is een kleine draak."),
      I("jian", "尖", "jiān", "puntig", "🔺", tk="Klein 小 bovenop groot 大: smal bovenaan en breed onderaan. Puntig!"),
      I("shan", "山", "shān", "berg", "⛰️", tk="Drie bergtoppen naast elkaar."),
      I("huo", "火", "huǒ", "vuur", "🔥", tk="Een vuurtje met twee vonken."),
      I("mu4", "木", "mù", "boom, hout", "🌳", tk="Een boom: bovenaan takken, onderaan wortels."),
      I("lin", "林", "lín", "bosje", "🌳🌳", tk="Twee bomen 木木 naast elkaar."),
      I("senlin", "森林", "sēnlín", "bos, woud", "🌲", tk="森 heeft drie bomen. Veel bomen samen: een groot bos!"),
      I("ri", "日", "rì", "zon, dag", "☀️", tk="Vroeger een rondje met een stip: de zon."),
      I("yue", "月", "yuè", "maan, maand", "🌙", tk="Vroeger een sikkel: de maan."),
      I("ming", "明", "míng", "helder, licht", "✨", tk="Zon 日 en maan 月 samen: dat geeft helder licht."),
      C("xiayule", "下雨了", "xià yǔ le", "het regent", "🌧️", tk="In 雨 zie je de druppels vallen onder de wolken."),
      C("xiaxuele", "下雪了", "xià xuě le", "het sneeuwt", "🌨️", tk="雪 heeft bovenaan 雨: sneeuw valt uit de lucht zoals regen."),
      Z("shanhenda", "山很大", "shān hěn dà", "de berg is groot", "⛰️", ["山", "很", "大"]),
    ],
    "lessons": [
      L("u11a", "Groot en klein", ["ren", "da", "xiao", "jian"]),
      L("u11b", "Berg, vuur en bomen", ["shan", "huo", "mu4", "lin", "senlin"]),
      L("u11c", "Zon en maan", ["ri", "yue", "ming"]),
      L("u11d", "Regen en sneeuw", ["xiayule", "xiaxuele", "shanhenda"]),
      L("u11e", "Tekenfamilie: 木 en 日", [], "tekens"),
      L("u11s", "Verhaal: Op de berg", [], "verhaal"),
    ],
  },
  {
    "id": "u12", "zh": "玩具", "py": "wánjù", "nl": "Speelgoed en school", "em": "🧱", "color": "#F26419",
    "intro": "Een bal, een boek, Lego en je vrienden op school.",
    "items": [
      I("qiu", "球", "qiú", "bal", "🏀"),
      I("shu", "书", "shū", "boek", "📖"),
      I("che", "车", "chē", "auto", "🚗", tk="Vroeger een kar van bovenaf: een wiel aan elke kant van de as."),
      I("legao", "乐高", "Lègāo", "Lego", "🧱", tk="Lè-gāo klinkt een beetje als Lego. 乐 betekent ook plezier!"),
      I("wanju", "玩具", "wánjù", "speelgoed", "🧸"),
      I("you", "有", "yǒu", "hebben", "🎁"),
      I("meiyou", "没有", "méiyǒu", "niet hebben", "🤷"),
      I("xuexiao", "学校", "xuéxiào", "school", "🏫"),
      I("laoshi", "老师", "lǎoshī", "juf, meester", "👩‍🏫"),
      I("pengyou", "朋友", "péngyou", "vriend", "🤝"),
      I("wode", "我的", "wǒ de", "mijn, van mij", "👈🙂"),
      Z("woyoulegao", "我有乐高", "wǒ yǒu Lègāo", "ik heb Lego", "🧱", ["我", "有", "乐高"]),
      Z("niyouqiuma", "你有球吗", "nǐ yǒu qiú ma", "heb jij een bal?", "🏀❓", ["你", "有", "球", "吗"]),
      Z("tashiwodepengyou", "他是我的朋友", "tā shì wǒ de péngyou", "hij is mijn vriend", "🤝", ["他", "是", "我的", "朋友"]),
    ],
    "lessons": [
      L("u12a", "Bal, boek en auto", ["qiu", "shu", "che"]),
      L("u12b", "Ik heb Lego!", ["legao", "wanju", "you", "meiyou"]),
      L("u12c", "Op school", ["xuexiao", "laoshi", "pengyou", "wode"]),
      L("u12d", "Heb jij…?", ["woyoulegao", "niyouqiuma", "tashiwodepengyou"]),
      L("u12s", "Verhaal: De Legotoren", [], "verhaal"),
    ],
  },
  {
    "id": "u13", "zh": "心情", "py": "xīnqíng", "nl": "Hoe voel je je?", "em": "😄", "color": "#E07A5F",
    "intro": "Blij, verdrietig, boos, moe of bang. En vragen wat er is.",
    "items": [
      I("kaixin", "开心", "kāixīn", "blij", "😄", tk="开 is open en 心 is hart. Als je blij bent, gaat je hart open."),
      I("nanguo", "难过", "nánguò", "verdrietig", "😢"),
      I("shengqi", "生气", "shēngqì", "boos", "😠"),
      I("lei", "累", "lèi", "moe", "😩"),
      I("pa", "怕", "pà", "bang", "😨", tk="Links staat 忄, een klein hartje. Gevoelens hebben vaak een hartje."),
      C("nizenmele", "你怎么了", "nǐ zěnme le", "wat is er?", "😟"),
      C("meiguanxi", "没关系", "méi guānxi", "geeft niks", "🤗"),
      Z("wohenkaixin", "我很开心", "wǒ hěn kāixīn", "ik ben heel blij", "😄", ["我", "很", "开心"]),
      Z("wohenlei", "我很累", "wǒ hěn lèi", "ik ben heel moe", "😩", ["我", "很", "累"]),
      Z("wobupa", "我不怕", "wǒ bú pà", "ik ben niet bang", "💪", ["我", "不", "怕"]),
    ],
    "lessons": [
      L("u13a", "Blij, verdrietig, boos", ["kaixin", "nanguo", "shengqi"]),
      L("u13b", "Moe en bang", ["lei", "pa", "nizenmele"]),
      L("u13c", "Geeft niks!", ["meiguanxi", "wohenkaixin", "wohenlei", "wobupa"]),
      L("u13s", "Verhaal: Waar is de bal?", [], "verhaal"),
    ],
  },
  {
    "id": "u14", "zh": "过年", "py": "guònián", "nl": "Chinees Nieuwjaar", "em": "🧧", "color": "#C1121F",
    "intro": "Rode envelopjes, lantaarns en vuurwerk. En: ik kom uit België!",
    "items": [
      C("xinniankuaile", "新年快乐", "xīnnián kuàilè", "gelukkig nieuwjaar!", "🎆"),
      I("hongbao", "红包", "hóngbāo", "rood envelopje", "🧧", tk="红 is rood en 包 is pakje. Met Nieuwjaar krijgen kinderen er geld in."),
      I("denglong", "灯笼", "dēnglong", "lantaarn", "🏮", tk="In 灯 staat links 火, het vuur: vroeger brandde er een kaarsje in."),
      I("zhongguo", "中国", "Zhōngguó", "China", "🇨🇳", tk="中 is midden en 国 is land. China heet: het land in het midden."),
      I("bilishi", "比利时", "Bǐlìshí", "België", "🇧🇪"),
      Z("woshibilishiren", "我是比利时人", "wǒ shì Bǐlìshí rén", "ik ben een Belg", "🙋🇧🇪", ["我", "是", "比利时", "人"]),
      C("shengrikuaile", "生日快乐", "shēngrì kuàilè", "gelukkige verjaardag!", "🎂"),
    ],
    "lessons": [
      L("u14a", "Nieuwjaar!", ["xinniankuaile", "hongbao", "denglong"]),
      L("u14b", "China en België", ["zhongguo", "bilishi", "woshibilishiren"]),
      L("u14c", "Hoera!", ["shengrikuaile"]),
      L("u14s", "Verhaal: Gelukkig Nieuwjaar", [], "verhaal"),
    ],
  },
]

# ---------------------------------------------------------------------------
# Tekenfamilies: een onderdeel en de tekens waarin het zit.
COMPONENTS = {
  "女": {"nl": "het vrouwteken", "em": "👩", "chars": "好妈姐妹她奶"},
  "口": {"nl": "het mondteken", "em": "👄", "chars": "吗吃喝叫听哥嘴"},
  "犭": {"nl": "het dierenteken", "em": "🐾", "chars": "猫狗猴"},
  "𧾷": {"nl": "het voetteken", "em": "🦶", "chars": "跑跳踢"},
  "氵": {"nl": "het waterteken", "em": "💧", "chars": "游泳没"},
  "木": {"nl": "het boomteken", "em": "🌳", "chars": "林森果校"},
  "日": {"nl": "het zonteken", "em": "☀️", "chars": "明是"},
  "亻": {"nl": "het mensteken", "em": "🧑", "chars": "你他们"},
  "目": {"nl": "het oogteken", "em": "👁️", "chars": "眼睛看睡"},
}
# Welke tekenles welke onderdelen oefent.
COMPONENT_LESSONS = {
  "u4f": ["女"], "u5e": ["犭", "女"], "u6f": ["口", "犭"],
  "u10e": ["𧾷", "氵", "口"], "u11e": ["木", "日", "亻", "目"],
}

# ---------------------------------------------------------------------------
# Verhalen. Sprekers: long (Xiǎolóng), yuan (Yuányuan de panda),
# hou (Xiǎohóu het aapje), nai (Oma), all (allemaal).
STORIES = {
  "u2s": {
    "title": "Hallo, Yuányuan!",
    "lines": [
      ("long", "你好！", "nǐ hǎo!", "Hallo!", "🐉👋"),
      ("yuan", "你好！我叫圆圆。", "nǐ hǎo! wǒ jiào Yuányuan.", "Hallo! Ik heet Yuányuan.", "🐼👋"),
      ("long", "我叫小龙。你好吗？", "wǒ jiào Xiǎolóng. nǐ hǎo ma?", "Ik heet Xiǎolóng. Hoe gaat het?", "🐉🤔"),
      ("yuan", "我很好。谢谢！", "wǒ hěn hǎo. xièxie!", "Het gaat goed. Dankjewel!", "🐼😀"),
      ("long", "再见！", "zàijiàn!", "Dag!", "🐉👋"),
      ("yuan", "再见！", "zàijiàn!", "Dag!", "🐼👋"),
    ],
    "qs": [
      ("Hoe heet de panda?", [("🐼", "圆圆 Yuányuan"), ("🐉", "小龙 Xiǎolóng"), ("🐵", "小猴 Xiǎohóu")], 0),
      ("Hoe gaat het met Yuányuan?", [("😀", "goed"), ("😢", "niet goed"), ("😴", "ze is moe")], 0),
      ("Wat zeggen ze op het einde?", [("👋", "再见 dag!"), ("🙏", "谢谢 dankjewel"), ("🤔", "你好吗 hoe gaat het?")], 0),
    ],
  },
  "u3s": {
    "title": "Hoe oud ben jij?",
    "lines": [
      ("yuan", "小龙，你几岁？", "Xiǎolóng, nǐ jǐ suì?", "Xiǎolóng, hoe oud ben jij?", "🐼🎂❓"),
      ("long", "我五岁。你几岁？", "wǒ wǔ suì. nǐ jǐ suì?", "Ik ben vijf. Hoe oud ben jij?", "🐉5️⃣"),
      ("yuan", "我八岁！", "wǒ bā suì!", "Ik ben acht!", "🐼8️⃣"),
      ("hou", "我三岁！", "wǒ sān suì!", "Ik ben drie!", "🐵3️⃣"),
      ("long", "一，二，三！你好，小猴！", "yī, èr, sān! nǐ hǎo, Xiǎohóu!", "Eén, twee, drie! Hallo, Xiǎohóu!", "🐉👋🐵"),
    ],
    "qs": [
      ("Hoe oud is Xiǎolóng?", [("5️⃣", "vijf"), ("8️⃣", "acht"), ("3️⃣", "drie")], 0),
      ("Hoe oud is Yuányuan?", [("8️⃣", "acht"), ("5️⃣", "vijf"), ("🔟", "tien")], 0),
      ("Wie is drie jaar?", [("🐵", "Xiǎohóu"), ("🐼", "Yuányuan"), ("🐉", "Xiǎolóng")], 0),
    ],
  },
  "u4s": {
    "title": "Het fotoalbum",
    "lines": [
      ("yuan", "这是我妈妈。", "zhè shì wǒ māma.", "Dit is mijn mama.", "🐼📷👩"),
      ("yuan", "这是我爸爸。", "zhè shì wǒ bàba.", "Dit is mijn papa.", "🐼📷👨"),
      ("long", "他是你哥哥吗？", "tā shì nǐ gēge ma?", "Is hij je grote broer?", "🐉❓👦"),
      ("yuan", "不，他是我弟弟！", "bù, tā shì wǒ dìdi!", "Nee, hij is mijn kleine broer!", "🐼🧒"),
      ("long", "她是你奶奶吗？", "tā shì nǐ nǎinai ma?", "Is zij je oma?", "🐉❓👵"),
      ("yuan", "对！她是我奶奶。", "duì! tā shì wǒ nǎinai.", "Ja! Zij is mijn oma.", "🐼✅👵"),
    ],
    "qs": [
      ("Wie zie je op de eerste foto?", [("👩", "mama"), ("👴", "opa"), ("👧", "kleine zus")], 0),
      ("De jongen op de foto is…", [("🧒", "haar kleine broer"), ("👦", "haar grote broer"), ("👨", "haar papa")], 0),
      ("Wie is de oude vrouw?", [("👵", "oma"), ("👩", "mama"), ("👱‍♀️", "grote zus")], 0),
    ],
  },
  "u5s": {
    "title": "In de zoo",
    "lines": [
      ("long", "这是什么？", "zhè shì shénme?", "Wat is dit?", "🐉❓🐯"),
      ("yuan", "这是老虎。", "zhè shì lǎohǔ.", "Dit is een tijger.", "🐼🐯"),
      ("long", "这是什么？", "zhè shì shénme?", "Wat is dit?", "🐉❓🐟"),
      ("yuan", "这是鱼。", "zhè shì yú.", "Dit is een vis.", "🐼🐟"),
      ("long", "这是什么？", "zhè shì shénme?", "Wat is dit?", "🐉❓🦕"),
      ("yuan", "这是……恐龙！", "zhè shì… kǒnglóng!", "Dit is… een dinosaurus!", "🐼😱🦕"),
    ],
    "qs": [
      ("Welk dier zien ze eerst?", [("🐯", "tijger"), ("🐶", "hond"), ("🐮", "koe")], 0),
      ("Welk dier zwemt in het water?", [("🐟", "vis"), ("🐦", "vogel"), ("🐰", "konijn")], 0),
      ("Waar schrikt Yuányuan van?", [("🦕", "een dinosaurus"), ("🐱", "een kat"), ("🐵", "een aap")], 0),
    ],
  },
  "u6s": {
    "title": "Xiǎolóng heeft honger",
    "lines": [
      ("long", "奶奶，我饿了！", "nǎinai, wǒ è le!", "Oma, ik heb honger!", "🐉🤤"),
      ("nai", "你要吃什么？", "nǐ yào chī shénme?", "Wat wil je eten?", "👵❓"),
      ("long", "我要吃饺子！", "wǒ yào chī jiǎozi!", "Ik wil dumplings eten!", "🐉🥟"),
      ("nai", "好！你要喝什么？", "hǎo! nǐ yào hē shénme?", "Goed! Wat wil je drinken?", "👵🥤❓"),
      ("long", "我要喝牛奶。", "wǒ yào hē niúnǎi.", "Ik wil melk drinken.", "🐉🥛"),
      ("long", "好吃！谢谢奶奶！", "hǎochī! xièxie nǎinai!", "Lekker! Dankjewel, oma!", "🐉😋🥟"),
    ],
    "qs": [
      ("Wat eet Xiǎolóng?", [("🥟", "dumplings"), ("🍦", "een ijsje"), ("🍟", "frietjes")], 0),
      ("Wat drinkt hij?", [("🥛", "melk"), ("💧", "water"), ("🥤", "limonade")], 0),
      ("Hoe smaakt het?", [("😋", "lekker!"), ("😢", "niet lekker"), ("😴", "hij valt in slaap")], 0),
    ],
  },
  "u7s": {
    "title": "Wie wint?",
    "lines": [
      ("long", "快点！快点！", "kuài diǎn! kuài diǎn!", "Snel! Snel!", "🐉💨"),
      ("hou", "等一下！", "děng yíxià!", "Wacht even!", "🐵⏳"),
      ("long", "我赢了！", "wǒ yíng le!", "Ik heb gewonnen!", "🐉🏆"),
      ("hou", "不公平！", "bù gōngpíng!", "Niet eerlijk!", "🐵😤"),
      ("long", "好的，好的。轮到你了！", "hǎo de, hǎo de. lúndào nǐ le!", "Oké, oké. Jouw beurt!", "🐉👌🎲"),
      ("hou", "我赢了！太棒了！", "wǒ yíng le! tài bàng le!", "Ik heb gewonnen! Super!", "🐵🏆🤩"),
    ],
    "qs": [
      ("Wie wint de eerste keer?", [("🐉", "Xiǎolóng"), ("🐵", "Xiǎohóu"), ("🐼", "Yuányuan")], 0),
      ("Wat roept Xiǎohóu dan?", [("😤", "不公平 niet eerlijk!"), ("🙏", "谢谢 dankjewel"), ("😋", "好吃 lekker!")], 0),
      ("Wie wint op het einde?", [("🐵", "Xiǎohóu"), ("🐉", "Xiǎolóng"), ("👵", "Oma")], 0),
    ],
  },
  "u8s": {
    "title": "De regenboog",
    "lines": [
      ("yuan", "小龙，你喜欢什么颜色？", "Xiǎolóng, nǐ xǐhuan shénme yánsè?", "Xiǎolóng, welke kleur vind jij mooi?", "🐼🎨❓"),
      ("long", "我喜欢红色！你呢？", "wǒ xǐhuan hóngsè! nǐ ne?", "Ik vind rood mooi! En jij?", "🐉❤️"),
      ("yuan", "我喜欢黑色和白色。", "wǒ xǐhuan hēisè hé báisè.", "Ik vind zwart en wit mooi.", "🐼⚫⚪"),
      ("long", "哈哈，对！", "hāha, duì!", "Haha, natuurlijk!", "🐉😂🐼"),
    ],
    "qs": [
      ("Welke kleur vindt Xiǎolóng mooi?", [("🔴", "rood"), ("🔵", "blauw"), ("⚫", "zwart")], 0),
      ("En Yuányuan?", [("🐼", "zwart en wit"), ("🔴", "rood"), ("🔵", "blauw")], 0),
      ("Waarom lacht Xiǎolóng?", [("🐼", "een panda is zelf zwart en wit"), ("🌈", "hij ziet een regenboog"), ("🍦", "hij krijgt een ijsje")], 0),
    ],
  },
  "u9s": {
    "title": "Xiǎolóng zegt…",
    "lines": [
      ("long", "摸摸你的头！", "mōmo nǐ de tóu!", "Raak je hoofd aan!", "🐉🙆"),
      ("long", "摸摸你的鼻子！", "mōmo nǐ de bízi!", "Raak je neus aan!", "🐉👃"),
      ("long", "摸摸你的耳朵！", "mōmo nǐ de ěrduo!", "Raak je oren aan!", "🐉👂"),
      ("long", "摸摸你的脚！", "mōmo nǐ de jiǎo!", "Raak je voeten aan!", "🐉🦶"),
      ("yuan", "哈哈！好玩！", "hāha! hǎowán!", "Haha! Leuk!", "🐼🎉"),
    ],
    "qs": [
      ("Wat moest je eerst aanraken?", [("🙆", "je hoofd"), ("🦶", "je voeten"), ("👂", "je oren")], 0),
      ("En op het einde?", [("🦶", "je voeten"), ("👃", "je neus"), ("✋", "je hand")], 0),
      ("Hoe vindt Yuányuan het spel?", [("🎉", "leuk!"), ("😠", "ze is boos"), ("😴", "saai")], 0),
    ],
  },
  "u10s": {
    "title": "Sportdag",
    "lines": [
      ("long", "我会跑！", "wǒ huì pǎo!", "Ik kan rennen!", "🐉🏃"),
      ("yuan", "我会跳！", "wǒ huì tiào!", "Ik kan springen!", "🐼🦘"),
      ("hou", "我会游泳！", "wǒ huì yóuyǒng!", "Ik kan zwemmen!", "🐵🏊"),
      ("long", "圆圆，你会滑雪吗？", "Yuányuan, nǐ huì huáxuě ma?", "Yuányuan, kan jij skiën?", "🐉⛷️❓"),
      ("yuan", "不会。我会睡觉！", "bú huì. wǒ huì shuìjiào!", "Nee. Ik kan slapen!", "🐼😴"),
    ],
    "qs": [
      ("Wat kan Xiǎohóu?", [("🏊", "zwemmen"), ("⛷️", "skiën"), ("⚽", "voetballen")], 0),
      ("Kan Yuányuan skiën?", [("🙅", "nee"), ("⛷️", "ja, heel goed"), ("🤔", "dat weet ze niet")], 0),
      ("Wat kan Yuányuan wel heel goed?", [("😴", "slapen"), ("🏃", "rennen"), ("🎧", "luisteren")], 0),
    ],
  },
  "u11s": {
    "title": "Op de berg",
    "lines": [
      ("long", "山很大！", "shān hěn dà!", "De berg is groot!", "🐉⛰️"),
      ("yuan", "看！下雪了！", "kàn! xià xuě le!", "Kijk! Het sneeuwt!", "🐼🌨️"),
      ("long", "我们去滑雪吧！", "wǒmen qù huáxuě ba!", "Kom, we gaan skiën!", "🐉⛷️"),
      ("yuan", "我不会滑雪……", "wǒ bú huì huáxuě…", "Ik kan niet skiën…", "🐼😟"),
      ("long", "没关系！加油！", "méi guānxi! jiāyóu!", "Geeft niks! Zet hem op!", "🐉💪"),
      ("yuan", "哇！好玩！", "wā! hǎowán!", "Wauw! Leuk!", "🐼⛷️🎉"),
    ],
    "qs": [
      ("Wat valt er uit de lucht?", [("🌨️", "sneeuw"), ("🌧️", "regen"), ("☀️", "zonnestralen")], 0),
      ("Wat zegt Xiǎolóng als Yuányuan niet kan skiën?", [("💪", "加油 zet hem op!"), ("😤", "不公平 niet eerlijk!"), ("👋", "再见 dag!")], 0),
      ("Hoe vindt Yuányuan skiën?", [("🎉", "leuk!"), ("😢", "verdrietig"), ("😨", "eng")], 0),
    ],
  },
  "u12s": {
    "title": "De Legotoren",
    "lines": [
      ("hou", "你有乐高吗？", "nǐ yǒu Lègāo ma?", "Heb jij Lego?", "🐵🧱❓"),
      ("long", "我有！我们玩吧！", "wǒ yǒu! wǒmen wán ba!", "Ja! Kom, we spelen!", "🐉🧱"),
      ("hou", "好的！", "hǎo de!", "Oké!", "🐵👌"),
      ("long", "快点！", "kuài diǎn!", "Snel!", "🐉💨"),
      ("hou", "等一下！", "děng yíxià!", "Wacht even!", "🐵⏳"),
      ("all", "太棒了！", "tài bàng le!", "Super!", "🐉🐵🤩"),
    ],
    "qs": [
      ("Waarmee spelen ze?", [("🧱", "Lego"), ("🏀", "een bal"), ("📖", "een boek")], 0),
      ("Wat zegt Xiǎohóu als Xiǎolóng 'snel!' roept?", [("⏳", "等一下 wacht even"), ("👋", "再见 dag"), ("🙏", "谢谢 dankjewel")], 0),
      ("Hoe vinden ze hun toren?", [("🤩", "super!"), ("😢", "niet mooi"), ("😠", "ze zijn boos")], 0),
    ],
  },
  "u13s": {
    "title": "Waar is de bal?",
    "lines": [
      ("yuan", "小龙，你怎么了？", "Xiǎolóng, nǐ zěnme le?", "Xiǎolóng, wat is er?", "🐼😟"),
      ("long", "我很难过。", "wǒ hěn nánguò.", "Ik ben heel verdrietig.", "🐉😢"),
      ("long", "我的球不见了。", "wǒ de qiú bú jiàn le.", "Mijn bal is weg.", "🐉🏀❓"),
      ("yuan", "看！这是你的球！", "kàn! zhè shì nǐ de qiú!", "Kijk! Hier is je bal!", "🐼🏀"),
      ("long", "谢谢你，圆圆！我很开心！", "xièxie nǐ, Yuányuan! wǒ hěn kāixīn!", "Dankjewel, Yuányuan! Ik ben heel blij!", "🐉😄"),
    ],
    "qs": [
      ("Hoe voelt Xiǎolóng zich eerst?", [("😢", "verdrietig"), ("😄", "blij"), ("😠", "boos")], 0),
      ("Wat is hij kwijt?", [("🏀", "zijn bal"), ("📖", "zijn boek"), ("🚗", "zijn auto")], 0),
      ("En op het einde?", [("😄", "blij"), ("😩", "moe"), ("😨", "bang")], 0),
    ],
  },
  "u14s": {
    "title": "Gelukkig Nieuwjaar",
    "lines": [
      ("long", "新年快乐，奶奶！", "xīnnián kuàilè, nǎinai!", "Gelukkig nieuwjaar, oma!", "🐉🎆👵"),
      ("nai", "新年快乐！这是你的红包。", "xīnnián kuàilè! zhè shì nǐ de hóngbāo.", "Gelukkig nieuwjaar! Dit is jouw rode envelopje.", "👵🧧"),
      ("long", "哇！谢谢奶奶！", "wā! xièxie nǎinai!", "Wauw! Dankjewel, oma!", "🐉🧧😄"),
      ("yuan", "看！灯笼！", "kàn! dēnglong!", "Kijk! Lantaarns!", "🐼🏮"),
      ("all", "新年快乐！", "xīnnián kuàilè!", "Gelukkig nieuwjaar!", "🐉🐼🐵🎆"),
    ],
    "qs": [
      ("Wat krijgt Xiǎolóng van oma?", [("🧧", "een rood envelopje"), ("🍦", "een ijsje"), ("🏀", "een bal")], 0),
      ("Wat ziet Yuányuan?", [("🏮", "lantaarns"), ("🐉", "een draak"), ("🌙", "de maan")], 0),
      ("Wat roepen ze allemaal op het einde?", [("🎆", "新年快乐 gelukkig nieuwjaar!"), ("🎂", "生日快乐 gelukkige verjaardag!"), ("👋", "再见 dag!")], 0),
    ],
  },
}

# ---------------------------------------------------------------------------
# Lettergrepen voor de tonentraining (menselijke opnames, alle vier tonen).
TONE_SYLLABLES = ["ma", "ba", "yi", "wu", "da", "qi", "shi", "tang", "mao", "di", "fu", "hu",
                  "ji", "bao", "tu", "yu", "xian", "zhu", "li", "ge"]

# ---------------------------------------------------------------------------
# Draakwoorden: wat de draak roept bij goede en foute antwoorden.
PRAISE = [
  ("p_taibangle", "太棒了！", "tài bàng le!", "Super!", "good"),
  ("p_duile", "对了！", "duì le!", "Juist!", "good"),
  ("p_henhao", "很好！", "hěn hǎo!", "Heel goed!", "good"),
  ("p_zhenlihai", "真厉害！", "zhēn lìhai!", "Echt straf!", "good"),
  ("p_jiayou", "加油！", "jiāyóu!", "Zet hem op!", "try"),
  ("p_meiguanxi", "没关系！", "méi guānxi!", "Geeft niks!", "try"),
  ("p_zaishi", "再试一次！", "zài shì yí cì!", "Probeer nog eens!", "try"),
]

# ---------------------------------------------------------------------------
# Stickers in het album. De rode envelopjes geven er telkens één.
STICKERS = [
  ("st_shu", "鼠", "shǔ", "rat", "🐀", "dier", "De rat is het eerste van de twaalf dieren van de Chinese kalender. Volgens het verhaal sprong hij slim op de rug van de os en won zo de grote race."),
  ("st_niu", "牛", "niú", "os", "🐂", "dier", "De os was sterk en werkte hard. In de grote race kwam hij als tweede aan."),
  ("st_hu", "虎", "hǔ", "tijger", "🐅", "dier", "Op het voorhoofd van een tijger zie je strepen die lijken op het teken 王. Dat betekent koning."),
  ("st_tu", "兔", "tù", "konijn", "🐇", "dier", "In China vertellen ze dat er een konijn op de maan woont. Een Chinese maanwagen kreeg zelfs zijn naam: Yùtù, het Jaden Konijn."),
  ("st_long", "龙", "lóng", "draak", "🐉", "dier", "Een Chinese draak heeft geen vleugels nodig om te vliegen. Hij brengt geluk en regen."),
  ("st_she", "蛇", "shé", "slang", "🐍", "dier", "De slang is het zesde dier van de Chinese kalender."),
  ("st_ma", "马", "mǎ", "paard", "🐎", "dier", "Het paard is het zevende dier. Mensen die in het jaar van het paard geboren zijn, zouden graag op stap gaan."),
  ("st_yang", "羊", "yáng", "geit", "🐐", "dier", "Het teken 羊 kan geit of schaap betekenen. Kijk: bovenaan staan twee hoorntjes."),
  ("st_hou", "猴", "hóu", "aap", "🐒", "dier", "De bekendste aap uit de Chinese verhalen is Sūn Wùkōng, de Apenkoning. Hij kan op een wolk vliegen."),
  ("st_ji", "鸡", "jī", "haan", "🐓", "dier", "De haan kraait 's morgens vroeg. Hij is het tiende dier van de kalender."),
  ("st_gou", "狗", "gǒu", "hond", "🐕", "dier", "De hond is het elfde dier. Honden zijn trouw: ze blijven bij hun vrienden."),
  ("st_zhu", "猪", "zhū", "varken", "🐖", "dier", "Het varken kwam als laatste aan in de grote race. Volgens het verhaal had het onderweg gegeten en een dutje gedaan."),
  ("st_xiongmao", "熊猫", "xióngmāo", "panda", "🐼", "china", "Een panda eet bijna alleen bamboe, meer dan tien uur per dag."),
  ("st_changcheng", "长城", "Chángchéng", "de Chinese Muur", "🧱", "china", "De Chinese Muur is duizenden kilometers lang. Ze werd gebouwd om vijanden tegen te houden."),
  ("st_kuaizi", "筷子", "kuàizi", "eetstokjes", "🥢", "china", "In China eet je met twee stokjes. Kinderen leren dat al heel jong."),
  ("st_jingju", "京剧", "jīngjù", "Peking-opera", "🎭", "china", "Bij de Peking-opera schilderen de spelers hun gezicht. Een rood gezicht betekent: dapper en trouw."),
  ("st_denglong", "灯笼", "dēnglong", "lantaarn", "🏮", "china", "Op het Lantaarnfeest, vijftien dagen na Nieuwjaar, hangen er overal rode lantaarns."),
  ("st_longzhou", "龙舟", "lóngzhōu", "drakenboot", "🛶", "china", "Bij het Drakenbootfeest roeien teams zo snel ze kunnen in lange boten met een drakenkop vooraan."),
  ("st_cha", "茶", "chá", "thee", "🍵", "china", "Thee komt oorspronkelijk uit China. Daar drinken ze het al duizenden jaren."),
  ("st_yuebing", "月饼", "yuèbing", "maankoek", "🥮", "china", "Maankoeken eet je op het Midherfstfeest, als de maan rond en helder is."),
  ("st_bianpao", "鞭炮", "biānpào", "vuurwerk", "🧨", "china", "Met Nieuwjaar knalt er vuurwerk. Volgens een oud verhaal jaagt het lawaai het monster Nián weg."),
  ("st_gongfu", "功夫", "gōngfu", "kungfu", "🥋", "china", "Kungfu is een Chinese vechtkunst. Het woord betekent eigenlijk: iets wat je leert door heel veel te oefenen."),
  ("st_maobi", "毛笔", "máobǐ", "penseel", "🖌️", "china", "Met een penseel van haar schrijven Chinezen mooie tekens. Dat heet kalligrafie."),
  ("st_jiaozi", "饺子", "jiǎozi", "dumplings", "🥟", "china", "In het noorden van China maken families met Nieuwjaar samen dumplings."),
]
