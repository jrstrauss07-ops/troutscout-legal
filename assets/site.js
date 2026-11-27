/* TroutScout pages (2026-11-27): fills in the live parts so the HTML itself never changes day to day.
   - Fish Score ring from /data/scores/<state>.json (rewritten daily)
   - hatches on this month (highlighted; "Hatching now" lists show only those)
   - the nearest USGS gauge's live flow, straight from USGS
   - the state page's search box */
(function () {
  var st = document.body.dataset.st;
  var BAND = function (s) { return s >= 70 ? 'good' : s >= 50 ? 'fair' : 'poor'; };
  var LABEL = { good: 'Good', fair: 'Fair', poor: 'Poor' };

  var box = document.querySelector('.score[data-k]');
  if (box && st) {
    fetch('/data/scores/' + st + '.json').then(function (r) { return r.json(); }).then(function (j) {
      var v = j[box.dataset.k];
      if (!v) { box.querySelector('.b').textContent = 'Live in the app'; return; }
      var s = v[0], b = BAND(s), ring = box.querySelector('.ring');
      ring.className = 'ring ' + b;
      ring.querySelector('span').textContent = s;
      ring.querySelector('.val').setAttribute('stroke-dasharray', (213.6 * Math.max(0, Math.min(100, s)) / 100).toFixed(1) + ' 214');
      var lab = box.querySelector('.b');
      lab.textContent = LABEL[b]; lab.className = 'b ' + b;
      box.querySelector('small').textContent = v[1] ? 'Best 3 hours, ' + v[1] : '';
    }).catch(function () {});
  }

  var m = new Date().getMonth() + 1;
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  // "Hatching now" on Ad-Hoc / lake pages: this month's rows from the state's hatch file.
  document.querySelectorAll('.hatch.now[data-src]').forEach(function (ul) {
    fetch('/data/hatches/' + ul.dataset.src + '.json').then(function (r) { return r.json(); }).then(function (rows) {
      var on = rows.filter(function (h) { var s = h[1], e = h[2]; return s <= e ? (m >= s && m <= e) : (m >= s || m <= e); });
      ul.innerHTML = on.length ? on.map(function (h) {
        return '<li class="on"><span class="n">' + esc(h[0]) + '</span><span class="m">' + (h[1] === h[2] ? MON[h[1] - 1] : MON[h[1] - 1] + '–' + MON[h[2] - 1]) +
          '</span>' + (h[3] ? '<span class="sz">#' + esc(h[3]) + '</span>' : '') + '</li>';
      }).join('') : '<li class="muted">Few hatches this month - try midges and nymphs.</li>';
    }).catch(function () {});
  });
  document.querySelectorAll('.hatch:not([data-src])').forEach(function (ul) {
    var on = [];
    ul.querySelectorAll('li[data-s]').forEach(function (li) {
      var s = +li.dataset.s, e = +li.dataset.e;
      var act = s <= e ? (m >= s && m <= e) : (m >= s || m <= e);
      if (act) { li.classList.add('on'); on.push(li); }
    });
    on.reverse().forEach(function (li) { ul.insertBefore(li, ul.firstChild); });
    var note = ul.parentNode.querySelector('.hnote');
    if (ul.classList.contains('now')) {
      ul.querySelectorAll('li:not(.on)').forEach(function (li) { li.remove(); });
      if (!on.length) ul.insertAdjacentHTML('beforeend', '<li class="muted">Few hatches this month - try midges and nymphs.</li>');
    } else if (note && on.length) note.textContent = 'hatching now is highlighted';
  });

  var flow = document.querySelector('.flow[data-site]');
  if (flow) {
    fetch('https://waterservices.usgs.gov/nwis/iv/?format=json&siteStatus=active&parameterCd=00060,00010&sites=' + flow.dataset.site)
      .then(function (r) { return r.json(); }).then(function (j) {
        (j.value.timeSeries || []).forEach(function (t) {
          var v = t.values[0].value[0]; if (!v) return;
          var p = t.variable.variableCode[0].value;
          if (p === '00060') flow.querySelector('.cfs').textContent = Math.round(+v.value);
          if (p === '00010') flow.querySelector('.tf').textContent = Math.round(v.value * 9 / 5 + 32);
          flow.querySelector('.when').textContent = 'USGS reading ' + new Date(v.dateTime).toLocaleString();
        });
      }).catch(function () {});
  }

  var find = document.querySelector('.find');
  if (find) find.addEventListener('input', function () {
    var q = find.value.toLowerCase();
    document.querySelectorAll('.county li').forEach(function (l) { l.style.display = l.dataset.n.indexOf(q) < 0 ? 'none' : ''; });
    document.querySelectorAll('.county').forEach(function (s) {
      s.style.display = [].some.call(s.querySelectorAll('li'), function (l) { return l.style.display !== 'none'; }) ? '' : 'none';
    });
  });
})();
