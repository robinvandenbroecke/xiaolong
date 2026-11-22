/* De draak van elk kind, als SVG. Groeit mee met de sterren.
 * Stadia: 0 ei, 1 baby, 2 kleine draak, 3 met parel, 4 op een wolk, 5 goud.
 * Stemmingen: normal, happy, cheer, wow, think, oops, sleep. */
(function () {
  'use strict';
  var INK = '#23233F', GOLD = '#F6B73C';
  var n = 0;

  function dragonSVG(opts) {
    opts = opts || {};
    var col = opts.color || Store.COLORS[0];
    var stage = opts.stage === undefined ? 1 : opts.stage;
    var mood = opts.mood || 'normal';
    var id = 'dg' + (++n);
    var main = col.main, dark = col.dark, belly = col.belly, horn = GOLD;
    if (stage >= 5) { main = '#F2B632'; dark = '#B57A12'; belly = '#FFF1C2'; horn = '#E0362C'; }
    var vb = opts.crop === 'head' ? (stage === 0 ? '36 66 128 148' : '22 14 156 126') : '0 0 200 214';
    var s = [];
    s.push('<svg class="dragon" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    s.push('<defs><radialGradient id="' + id + 'p" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#CDEBFF"/><stop offset="1" stop-color="#7FC4F5"/></radialGradient></defs>');

    if (stage === 0) {
      s.push(egg(main, belly, opts.crack));
      s.push('</svg>');
      return s.join('');
    }
    if (stage >= 4 && opts.crop !== 'head') s.push(cloud());

    var sc = [1, 0.8, 0.9, 1, 1, 1.04][stage] || 1;
    if (opts.crop === 'head') sc = 1;
    s.push('<g transform="translate(100 204) scale(' + sc + ') translate(-100 -204)" stroke-linejoin="round">');
    var body = opts.crop !== 'head';
    var outfit = opts.outfit || {};
    // staart
    if (body) s.push(outlined('M132,178 C168,184 182,156 168,138 C160,128 148,134 153,144', main, 14));
    if (body) s.push('<path d="M150,147 C140,137 149,123 158,127 C156,133 163,137 160,147 Z" fill="' + horn + '" stroke="' + INK + '" stroke-width="2.5"/>');
    // lijf en buik
    if (body) s.push('<path d="M64,198 C56,160 70,126 100,126 C130,126 144,160 136,198 Z" fill="' + main + '" stroke="' + INK + '" stroke-width="3"/>');
    if (body) s.push('<path d="M80,196 C76,168 84,146 100,146 C116,146 124,168 120,196 Z" fill="' + belly + '"/>');
    if (body) [160, 172, 184].forEach(function (y) {
      s.push('<path d="M' + (86 - (y - 160) * 0.08) + ',' + y + ' Q100,' + (y + 6) + ' ' + (114 + (y - 160) * 0.08) + ',' + y + '" stroke="' + dark + '" stroke-opacity=".35" stroke-width="2" fill="none"/>');
    });
    if (body && (outfit.body === 'cape' || outfit.body === 'skycape')) {
      var cape = outfit.body === 'cape' ? '#d92538' : '#343d83';
      s.push('<path d="M68,133 Q100,150 132,133 L151,192 Q136,211 118,197 L107,155 L93,155 L82,197 Q64,211 49,192 Z" fill="' + cape + '" stroke="#23233F" stroke-width="3"/>');
      s.push('<path d="M55,190 Q68,201 78,193 M122,193 Q132,201 145,190" fill="none" stroke="#f6b73c" stroke-width="3"/>');
    }
    if (body && outfit.body === 'armor') {
      s.push('<path d="M67,140 L82,132 H118 L133,140 L125,175 L100,189 L75,175 Z" fill="#48a179" stroke="#23233F" stroke-width="3"/><path d="M100,142 L113,156 L100,174 L87,156 Z" fill="#c3f9ce" stroke="#246653" stroke-width="3"/>');
    }
    // voeten
    if (body) [82, 118].forEach(function (x) {
      s.push('<ellipse cx="' + x + '" cy="199" rx="15" ry="8" fill="' + dark + '" stroke="' + INK + '" stroke-width="3"/>');
      s.push('<path d="M' + (x - 6) + ',203 v-4 M' + x + ',204 v-4 M' + (x + 6) + ',203 v-4" stroke="' + belly + '" stroke-width="2" stroke-linecap="round"/>');
    });
    if (body && (outfit.feet === 'boots' || outfit.feet === 'cloudboots')) [82, 118].forEach(function (x) {
      var boot = outfit.feet === 'boots' ? '#d92538' : '#dbe9ff';
      s.push('<path d="M' + (x - 9) + ',187 h18 v8 q9,1 8,10 h-34 q-1,-8 8,-10 Z" fill="' + boot + '" stroke="#23233F" stroke-width="3"/>');
    });
    // armen
    if (!body) { /* alleen het hoofd */ } else if (mood === 'cheer') {
      s.push(outlined('M72,146 C58,136 54,124 58,112', main, 9));
      s.push(outlined('M128,146 C142,136 146,124 142,112', main, 9));
    } else {
      s.push(outlined('M71,150 C59,158 59,170 69,173', main, 9));
      s.push(outlined('M129,150 C141,158 141,170 131,173', main, 9));
    }
    // parel
    if (stage >= 3 && body) {
      s.push('<path d="M38,160 C34,152 40,150 38,144 M60,160 C64,153 58,150 61,145" stroke="' + horn + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
      s.push('<circle cx="49" cy="172" r="11" fill="url(#' + id + 'p)" stroke="' + INK + '" stroke-width="2.5"/>');
    }
    // manen
    var mane = stage >= 2 ? 1 : 0.6;
    s.push('<path d="' + mirrorPath('M56,70 L' + (56 - 20 * mane) + ',62 L48,80 L' + (52 - 20 * mane) + ',87 L52,97 Z') + '" fill="' + dark + '" stroke="' + INK + '" stroke-width="2.5"/>');
    s.push('<path d="' + mirrorPath('M56,70 L' + (56 - 20 * mane) + ',62 L48,80 L' + (52 - 20 * mane) + ',87 L52,97 Z', true) + '" fill="' + dark + '" stroke="' + INK + '" stroke-width="2.5"/>');
    // hoorns
    if (stage >= 2) {
      s.push(outlined('M80,50 C76,36 70,28 62,22 M72,36 C66,36 62,32 60,29', horn, 5));
      s.push(outlined('M120,50 C124,36 130,28 138,22 M128,36 C134,36 138,32 140,29', horn, 5));
    } else {
      s.push(outlined('M84,48 C82,42 80,38 77,35', horn, 5));
      s.push(outlined('M116,48 C118,42 120,38 123,35', horn, 5));
    }
    // hoofd
    s.push('<path d="M50,92 C50,58 74,42 100,42 C126,42 150,58 150,92 C150,118 128,130 100,130 C72,130 50,118 50,92 Z" fill="' + main + '" stroke="' + INK + '" stroke-width="3"/>');
    if (stage >= 2) s.push('<path d="M92,45 L96,34 L100,44 L104,34 L108,45" fill="' + horn + '" stroke="' + INK + '" stroke-width="2"/>');
    // snoet
    s.push('<ellipse cx="100" cy="106" rx="30" ry="18" fill="' + belly + '" stroke="' + INK + '" stroke-width="2.5"/>');
    s.push('<ellipse cx="91" cy="100" rx="3" ry="2.2" fill="' + INK + '"/><ellipse cx="109" cy="100" rx="3" ry="2.2" fill="' + INK + '"/>');
    // snorharen
    if (stage >= 2) {
      var long = stage >= 3;
      s.push('<path d="' + (long ? 'M72,108 C52,110 36,122 34,138 C33,146 42,148 44,142' : 'M72,108 C58,110 48,116 42,126') + '" stroke="' + horn + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
      s.push('<path d="' + (long ? 'M128,108 C148,110 164,122 166,138 C167,146 158,148 156,142' : 'M128,108 C142,110 152,116 158,126') + '" stroke="' + horn + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
    }
    s.push(face(mood));
    if (outfit.head === 'band') {
      s.push('<path d="M56,68 Q100,49 144,68 L147,76 Q100,59 53,76 Z" fill="#e98f36" stroke="#23233F" stroke-width="2"/><circle cx="100" cy="63" r="4" fill="#fff1c6"/>');
    }
    if (outfit.head === 'glasses') {
      s.push('<path d="M66,82 H134" stroke="#23233F" stroke-width="5"/><rect x="67" y="73" width="26" height="18" rx="6" fill="#b4e7fb" stroke="#23233F" stroke-width="3"/><rect x="107" y="73" width="26" height="18" rx="6" fill="#b4e7fb" stroke="#23233F" stroke-width="3"/>');
    }
    if (outfit.head === 'crown' || outfit.head === 'starcrown') {
      s.push('<path d="M76,52 L71,27 L88,38 L100,19 L112,38 L129,27 L124,52 Z" fill="#f6b73c" stroke="#23233F" stroke-width="3"/><circle cx="100" cy="43" r="5" fill="#dd4a61" stroke="#23233F" stroke-width="2"/>');
    }
    if (outfit.head === 'starcrown') {
      s.push('<path d="M100,24 L104,32 L113,33 L106,39 L108,48 L100,44 L92,48 L94,39 L87,33 L96,32 Z" fill="#b3e6ff" stroke="#23233F" stroke-width="2"/>');
    }
    if (body && outfit.neck === 'scarf') {
      s.push('<path d="M77,126 Q101,138 124,126 L126,137 Q108,146 98,141 L91,166 L81,161 L90,140 Q81,139 75,135 Z" fill="#55bc98" stroke="#23233F" stroke-width="3"/>');
    }
    if (body && outfit.neck === 'lantern') {
      s.push('<path d="M79,129 L100,150 L121,129" fill="none" stroke="#b87827" stroke-width="3"/><rect x="91" y="149" width="18" height="19" rx="7" fill="#f34f41" stroke="#23233F" stroke-width="2"/><path d="M96,152 V165 M104,152 V165 M100,168 V176" stroke="#f6b73c" stroke-width="2"/>');
    }
    if (body && outfit.neck === 'medal') {
      s.push('<path d="M78,130 L100,154 L122,130" fill="none" stroke="#3964ad" stroke-width="6"/><circle cx="100" cy="158" r="9" fill="#f6b73c" stroke="#23233F" stroke-width="2"/><path d="M100,153 V163 M95,158 H105" stroke="#945622" stroke-width="2"/>');
    }
    s.push('</g>');
    if (mood === 'sleep') s.push('<text x="150" y="40" font-family="Fredoka, sans-serif" font-size="22" fill="' + INK + '">z<tspan font-size="16" dy="-8">z</tspan></text>');
    s.push('</svg>');
    return s.join('');
  }

  function outlined(d, color, w) {
    return '<path d="' + d + '" stroke="' + INK + '" stroke-width="' + (w + 6) + '" fill="none" stroke-linecap="round"/>' +
      '<path d="' + d + '" stroke="' + color + '" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>';
  }
  function mirrorPath(d, mirror) {
    if (!mirror) return d;
    return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (200 - parseFloat(x)) + ',' + y; });
  }

  function face(mood) {
    var f = [], cheeks = '<ellipse cx="64" cy="101" rx="7" ry="4.5" fill="#FF8FA3" opacity=".65"/><ellipse cx="136" cy="101" rx="7" ry="4.5" fill="#FF8FA3" opacity=".65"/>';
    function eyes(r, pr, dx, dy) {
      return [78, 122].map(function (x) {
        return '<circle cx="' + x + '" cy="82" r="' + r + '" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
          '<circle cx="' + (x + (x < 100 ? 2 : -2) + dx) + '" cy="' + (84 + dy) + '" r="' + pr + '" fill="' + INK + '"/>' +
          '<circle cx="' + (x + 5 + dx) + '" cy="' + (80 + dy) + '" r="2.6" fill="#fff"/>';
      }).join('');
    }
    if (mood === 'happy' || mood === 'cheer') {
      f.push('<path d="M67,87 Q78,72 89,87 M111,87 Q122,72 133,87" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>');
      f.push('<path d="M87,111 Q100,128 113,111 Z" fill="' + INK + '"/><ellipse cx="100" cy="119" rx="5" ry="3" fill="#FF6B81"/>');
      f.push(cheeks);
    } else if (mood === 'wow') {
      f.push(eyes(15, 9, 0, 0));
      f.push('<ellipse cx="100" cy="116" rx="5" ry="6" fill="' + INK + '"/>');
      f.push(cheeks);
    } else if (mood === 'think') {
      f.push(eyes(13, 7, 3, -6));
      f.push('<path d="M112,63 Q122,57 132,63" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
      f.push('<path d="M93,115 L108,113" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>');
    } else if (mood === 'oops') {
      f.push(eyes(13, 7, 0, 0));
      f.push('<path d="M68,69 L88,63 M132,69 L112,63" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>');
      f.push('<path d="M88,116 Q94,111 100,116 Q106,121 112,116" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
    } else if (mood === 'sleep') {
      f.push('<path d="M68,84 Q78,91 88,84 M112,84 Q122,91 132,84" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>');
      f.push('<path d="M95,115 Q100,118 105,115" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
      f.push(cheeks);
    } else {
      f.push(eyes(13, 7.5, 0, 0));
      f.push('<path d="M89,113 Q100,121 111,113" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
    }
    return f.join('');
  }

  function egg(main, belly, crack) {
    var s = '<ellipse cx="100" cy="138" rx="52" ry="64" fill="' + belly + '" stroke="' + INK + '" stroke-width="3"/>';
    s += '<ellipse cx="78" cy="112" rx="11" ry="8" fill="' + main + '" opacity=".85"/>';
    s += '<ellipse cx="122" cy="150" rx="14" ry="10" fill="' + main + '" opacity=".85"/>';
    s += '<ellipse cx="92" cy="176" rx="9" ry="6" fill="' + main + '" opacity=".85"/>';
    s += '<ellipse cx="118" cy="104" rx="6" ry="5" fill="' + main + '" opacity=".85"/>';
    if (crack) s += '<path d="M62,128 L74,122 L80,134 L92,124 L100,136 L110,124 L118,134 L128,122 L140,128" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linejoin="round"/>';
    s += '<path d="M76,88 C82,80 90,76 98,75" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>';
    return s;
  }

  function cloud() {
    return '<path d="M34,206 C22,206 20,190 34,188 C36,175 56,172 63,183 C70,170 92,170 96,185 C104,174 126,174 130,187 C139,176 161,178 161,191 C174,189 179,206 165,208 Z" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<path d="M52,198 C48,192 56,187 61,193 M132,199 C130,193 138,190 141,195" stroke="#9FB7D6" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }

  window.Dragon = {
    svg: dragonSVG,
    forPlayer: function (p, mood, extra) {
      var o = { color: Store.colorOf(p), stage: Store.stage(p), mood: mood || 'normal' };
      o.outfit = {};
      ['head', 'body', 'neck', 'feet'].forEach(function (slot) {
        var selection = p.outfit && p.outfit[slot];
        if (selection && p.mine && p.mine.gear && p.mine.gear[selection.id]) o.outfit[slot] = selection.id;
      });
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return dragonSVG(o);
    }
  };
})();
