/* Pure analysis core for PSKReporter ADIF exports. No DOM, no framework.
   Everything here runs in the browser; nothing is uploaded anywhere. */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- bands */

  var BANDS = [
    { name: '2200m', lo: 0.1357, hi: 0.1378, hf: true },
    { name: '630m', lo: 0.472, hi: 0.479, hf: true },
    { name: '160m', lo: 1.8, hi: 2.0, hf: true },
    { name: '80m', lo: 3.5, hi: 4.0, hf: true },
    { name: '60m', lo: 5.2, hi: 5.5, hf: true },
    { name: '40m', lo: 7.0, hi: 7.3, hf: true },
    { name: '30m', lo: 10.1, hi: 10.15, hf: true },
    { name: '20m', lo: 14.0, hi: 14.35, hf: true },
    { name: '17m', lo: 18.068, hi: 18.168, hf: true },
    { name: '15m', lo: 21.0, hi: 21.45, hf: true },
    { name: '12m', lo: 24.89, hi: 24.99, hf: true },
    { name: '10m', lo: 28.0, hi: 29.7, hf: true },
    { name: '6m', lo: 50.0, hi: 54.0, hf: false },
    { name: '4m', lo: 70.0, hi: 71.0, hf: false },
    { name: '2m', lo: 144.0, hi: 148.0, hf: false },
    { name: '70cm', lo: 430.0, hi: 440.0, hf: false }
  ];
  var BAND_ORDER = BANDS.map(function (b) { return b.name; });
  var IS_HF = {};
  BANDS.forEach(function (b) { IS_HF[b.name] = b.hf; });

  function bandFor(freqMhz, bandField) {
    if (isFinite(freqMhz)) {
      for (var i = 0; i < BANDS.length; i++) {
        if (freqMhz >= BANDS[i].lo && freqMhz <= BANDS[i].hi) return BANDS[i].name;
      }
    }
    if (bandField) {
      var b = String(bandField).toLowerCase().trim();
      if (BAND_ORDER.indexOf(b) >= 0) return b;
    }
    return null;
  }

  /* ----------------------------------------------------------- adif parse */

  function parseAdif(text) {
    var out = [];
    var eoh = text.search(/<eoh>/i);
    var body = eoh >= 0 ? text.slice(eoh + 5) : text;
    var chunks = body.split(/<eor>/i);

    for (var c = 0; c < chunks.length; c++) {
      var chunk = chunks[c];
      if (chunk.indexOf('<') < 0) continue;
      var f = {}, m, found = false;
      var re = /<([A-Za-z0-9_]+):(\d+)(?::[A-Za-z])?>/g;
      while ((m = re.exec(chunk)) !== null) {
        var start = m.index + m[0].length;
        var len = parseInt(m[2], 10);
        f[m[1].toUpperCase()] = chunk.substr(start, len);
        re.lastIndex = start + len;
        found = true;
      }
      if (found) out.push(f);
    }
    return out;
  }

  /* -------------------------------------------------------------- helpers */

  function gridToLatLon(grid) {
    var g = String(grid || '').trim().toUpperCase();
    if (g.length < 4) return null;
    if (!/^[A-R]{2}[0-9]{2}/.test(g)) return null;
    var lon = (g.charCodeAt(0) - 65) * 20 - 180;
    var lat = (g.charCodeAt(1) - 65) * 10 - 90;
    lon += parseInt(g.charAt(2), 10) * 2;
    lat += parseInt(g.charAt(3), 10) * 1;
    if (g.length >= 6 && /^[A-X]{2}$/.test(g.substr(4, 2))) {
      lon += (g.charCodeAt(4) - 65) * (2 / 24) + 1 / 24;
      lat += (g.charCodeAt(5) - 65) * (1 / 24) + 0.5 / 24;
    } else {
      lon += 1; lat += 0.5;
    }
    return { lat: lat, lon: lon };
  }

  function parseStamp(dateStr, timeStr) {
    var d = String(dateStr || '');
    if (!/^\d{8}$/.test(d)) return null;
    var t = ((timeStr || '0000') + '000000').slice(0, 6);
    if (!/^\d{6}$/.test(t)) return null;
    return new Date(Date.UTC(
      +d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8),
      +t.slice(0, 2), +t.slice(2, 4), +t.slice(4, 6)
    ));
  }

  function median(sorted) {
    if (!sorted.length) return null;
    var n = sorted.length, h = n >> 1;
    return n % 2 ? sorted[h] : (sorted[h - 1] + sorted[h]) / 2;
  }

  /* ---------------------------------------------------- whose log is this?

     A PSKReporter export holds two kinds of row, and ADIF's logging-station
     convention decides which is which: OPERATOR / MY_GRIDSQUARE describe the
     station that filed the report, CALL / GRIDSQUARE / COUNTRY / DXCC describe
     the station it decoded.

       your RX  - you decoded somebody.   OPERATOR = you, CALL = them.
                  The far end is fully described, COUNTRY included.
                  (matches pskdata.pl's receiverCallsign= query)
       your TX  - somebody decoded you.   CALL = you, OPERATOR = them.
                  COUNTRY describes YOU, so the far end only has MY_GRIDSQUARE.
                  (matches pskdata.pl's senderCallsign= query)

     Mixing the two without flipping the sides credits every transmitted signal
     to your own country, so the owning callsign has to be identified first.   */

  function detectMyCall(fields) {
    var score = {}, rows = {};
    for (var i = 0; i < fields.length; i++) {
      var op = (fields[i].OPERATOR || '').toUpperCase();
      var cl = (fields[i].CALL || '').toUpperCase();
      if (op) score[op] = (score[op] || 0) + 1;
      if (cl && cl !== op) score[cl] = (score[cl] || 0) + 1;
      if (op) rows[op] = (rows[op] || 0) + 1;
      if (cl && cl !== op) rows[cl] = (rows[cl] || 0) + 1;
    }
    var ranked = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
    var top = ranked[0] || '';

    /* A plain logbook export names the owner in OPERATOR, or nowhere at all, and
       its most-worked station still only shows up in a tiny share of rows. A
       PSKReporter export names its owner in every single row. Below the
       threshold, assume an ordinary log and never flip the two sides -- getting
       that wrong would rewrite real QSOs as reports about somebody else. */
    var share = fields.length ? (rows[top] || 0) / fields.length : 0;
    return {
      call: top,
      share: share,
      dual: share >= 0.4,
      candidates: ranked.slice(0, 8).map(function (c) { return { call: c, n: score[c] }; })
    };
  }

  /* --------------------------------------------------------- record build */

  function buildRecords(fields, myCall, dual) {
    var recs = [], unmapped = {}, myGrids = {}, dirCounts = { tx: 0, rx: 0 };
    var me = (myCall || '').toUpperCase();
    var twoWay = dual !== false;

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var when = parseStamp(f.QSO_DATE, f.TIME_ON || f.TIME_OFF);
      if (!when) continue;
      var band = bandFor(parseFloat(f.FREQ), f.BAND);
      if (!band) continue;

      var call = (f.CALL || '').toUpperCase();
      var oper = (f.OPERATOR || '').toUpperCase();

      var dir, remoteCall, remoteCountry, remoteGrid, remoteDxcc, myGrid;
      if (twoWay && me && call === me && oper !== me) {
        dir = 'tx';                         // they decoded you
        remoteCall = oper;
        remoteCountry = '';                 // the COUNTRY field describes you here
        remoteGrid = f.MY_GRIDSQUARE || '';
        remoteDxcc = '';
        myGrid = f.GRIDSQUARE || '';
      } else {
        dir = 'rx';                         // you decoded them
        remoteCall = call;
        remoteCountry = f.COUNTRY || '';
        remoteGrid = f.GRIDSQUARE || '';
        remoteDxcc = f.DXCC || '';
        myGrid = f.MY_GRIDSQUARE || '';
      }
      dirCounts[dir]++;
      if (myGrid) myGrids[myGrid.toUpperCase()] = (myGrids[myGrid.toUpperCase()] || 0) + 1;

      var cont = remoteCountry ? Continents.byCountry(remoteCountry) : null;
      if (!cont) {
        var ll = gridToLatLon(remoteGrid);
        if (ll) cont = Continents.byLatLon(ll.lat, ll.lon);
        if (remoteCountry && !cont) unmapped[remoteCountry] = (unmapped[remoteCountry] || 0) + 1;
      }

      var snrRaw = f.APP_PSKREP_SNR !== undefined ? f.APP_PSKREP_SNR : f.RST_RCVD;
      var snr = parseFloat(snrRaw);
      var km = parseFloat(f.DISTANCE);

      recs.push({
        t: when.getTime(),
        utcHour: when.getUTCHours(),
        locHour: when.getHours(),
        utcDay: f.QSO_DATE,
        locDay: when.getFullYear() + '-' + (when.getMonth() + 1) + '-' + when.getDate(),
        band: band,
        cont: cont || 'XX',
        dir: dir,
        call: remoteCall,
        dxcc: remoteDxcc || remoteCountry || remoteCall.slice(0, 3),
        country: remoteCountry,
        mode: (f.MODE || 'UNKNOWN').toUpperCase(),
        snr: isFinite(snr) ? snr : null,
        km: isFinite(km) ? km : null
      });
    }
    return {
      recs: recs, unmapped: unmapped, myGrids: myGrids,
      dirCounts: dirCounts, dual: twoWay
    };
  }

  /* ------------------------------------------------------------ aggregate */

  function aggregate(records, opts) {
    var useLocal = opts.timebase === 'local';
    var cells = {}, activeDays = {}, bandTotals = {}, contTotals = {};
    var allCalls = {}, modes = {}, days = {};
    var minT = null, maxT = null, kept = 0;

    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (opts.mode !== 'ALL' && r.mode !== opts.mode) continue;
      if (opts.direction !== 'both' && r.dir !== opts.direction) continue;
      if (opts.hfOnly && !IS_HF[r.band]) continue;
      kept++;
      modes[r.mode] = (modes[r.mode] || 0) + 1;

      var hour = useLocal ? r.locHour : r.utcHour;
      var day = useLocal ? r.locDay : r.utcDay;
      var key = r.band + '|' + r.cont + '|' + hour;
      var cell = cells[key];
      if (!cell) {
        cell = cells[key] = {
          spots: 0, calls: {}, nCalls: 0, dxcc: {}, nDxcc: 0,
          snrs: [], maxKm: null, far: '', days: {}, nDays: 0
        };
      }
      cell.spots++;
      if (r.call && !cell.calls[r.call]) { cell.calls[r.call] = 1; cell.nCalls++; }
      if (r.dxcc && !cell.dxcc[r.dxcc]) { cell.dxcc[r.dxcc] = 1; cell.nDxcc++; }
      if (r.snr !== null) cell.snrs.push(r.snr);
      if (r.km !== null && (cell.maxKm === null || r.km > cell.maxKm)) {
        cell.maxKm = r.km; cell.far = r.call;
      }
      if (!cell.days[day]) { cell.days[day] = 1; cell.nDays++; }

      var ak = r.band + '|' + hour;
      if (!activeDays[ak]) activeDays[ak] = {};
      activeDays[ak][day] = 1;

      bandTotals[r.band] = (bandTotals[r.band] || 0) + 1;
      contTotals[r.cont] = (contTotals[r.cont] || 0) + 1;
      allCalls[r.call] = 1;
      days[day] = 1;
      if (minT === null || r.t < minT) minT = r.t;
      if (maxT === null || r.t > maxT) maxT = r.t;
    }

    Object.keys(cells).forEach(function (k) {
      var c = cells[k];
      c.snrs.sort(function (a, b) { return a - b; });
      c.medSnr = median(c.snrs);
      var parts = k.split('|');
      var ad = activeDays[parts[0] + '|' + parts[2]];
      c.activeDays = ad ? Object.keys(ad).length : 1;
      c.rate = c.spots / c.activeDays;
    });

    return {
      cells: cells,
      get: function (band, cont, hour) { return cells[band + '|' + cont + '|' + hour] || null; },
      bandTotals: bandTotals,
      contTotals: contTotals,
      bands: BAND_ORDER.filter(function (b) { return bandTotals[b]; }),
      conts: Continents.ORDER.concat(['XX']).filter(function (c) { return contTotals[c]; }),
      modes: modes,
      uniqueCalls: Object.keys(allCalls).length,
      nDays: Object.keys(days).length,
      kept: kept,
      minT: minT,
      maxT: maxT
    };
  }

  /* -------------------------------------------------------------- metrics */

  var METRICS = {
    spots: {
      key: 'spots', label: 'Reports', short: 'reports', signed: false,
      get: function (c) { return c ? c.spots : 0; },
      fmt: function (v) { return v === null ? '' : String(Math.round(v)); }
    },
    calls: {
      key: 'calls', label: 'Unique stations', short: 'stations', signed: false,
      get: function (c) { return c ? c.nCalls : 0; },
      fmt: function (v) { return v === null ? '' : String(Math.round(v)); }
    },
    rate: {
      key: 'rate', label: 'Reports per active day', short: 'per day', signed: false,
      get: function (c) { return c ? c.rate : 0; },
      fmt: function (v) { return v === null ? '' : (v >= 10 ? v.toFixed(0) : v.toFixed(1)); }
    },
    snr: {
      key: 'snr', label: 'Median SNR', short: 'dB', signed: true,
      get: function (c) { return c && c.medSnr !== null ? c.medSnr : null; },
      fmt: function (v) { return v === null ? '' : (v > 0 ? '+' : '') + v.toFixed(0); }
    }
  };

  /* --------------------------------------------------------- best windows */

  function rowValues(agg, band, cont, metricKey) {
    var m = METRICS[metricKey], out = [];
    for (var h = 0; h < 24; h++) out.push(m.get(agg.get(band, cont, h)));
    return out;
  }

  function isEmpty(v, signed) { return v === null || (!signed && !v); }

  function bestHour(values, signed) {
    var best = -Infinity, at = null;
    for (var i = 0; i < 24; i++) {
      if (isEmpty(values[i], signed)) continue;
      if (values[i] > best) { best = values[i]; at = i; }
    }
    return at === null ? null : { hour: at, score: best };
  }

  /* For a signed metric (SNR) a missing hour must not score as zero, so the
     window is judged on the mean of the hours that actually have data and needs
     at least two of three to qualify. For counts the plain sum is the point. */
  function bestWindow(values, width, signed) {
    var best = -Infinity, at = null;
    for (var i = 0; i < 24; i++) {
      var sum = 0, n = 0;
      for (var k = 0; k < width; k++) {
        var v = values[(i + k) % 24];
        if (isEmpty(v, signed)) continue;
        sum += v; n++;
      }
      if (!n) continue;
      if (signed && n < Math.min(2, width)) continue;
      var score = signed ? sum / n : sum;
      if (score > best) { best = score; at = i; }
    }
    return at === null ? null : { start: at, end: (at + width) % 24, score: best };
  }

  global.PSKCore = {
    BAND_ORDER: BAND_ORDER,
    IS_HF: IS_HF,
    METRICS: METRICS,
    parseAdif: parseAdif,
    detectMyCall: detectMyCall,
    buildRecords: buildRecords,
    aggregate: aggregate,
    rowValues: rowValues,
    bestHour: bestHour,
    bestWindow: bestWindow,
    gridToLatLon: gridToLatLon,
    bandFor: bandFor
  };
})(window);
