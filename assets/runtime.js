/*
 * SparkFlow prototype runtime
 * A small renderer for the exported design pages: {{holes}}, <sc-for>, <sc-if>,
 * <dc-import>, event bindings and class Component extends DCLogic { renderVals() }.
 */
(function () {
  'use strict';

  var BOOL_ATTRS = { disabled: 1, checked: 1, selected: 1, hidden: 1, readonly: 1, required: 1, open: 1 };
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  var ANY = /\{\{\s*([^}]+?)\s*\}\}/g;
  var registry = {};   // name -> { tpl: HTMLTemplateElement, Logic: class }
  var root = null;     // root instance
  var mount = null;    // root DOM container
  var pending = false;

  // ---------- logic base ----------
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    schedule();
  };
  DCLogic.prototype.forceUpdate = function () { schedule(); };
  DCLogic.prototype.renderVals = function () { return {}; };
  window.DCLogic = DCLogic;

  function compile(src) {
    /* eslint-disable no-new-func */
    return new Function('DCLogic', src + '\n;return Component;')(DCLogic);
  }

  // ---------- value lookup ----------
  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var v = scope[parts[0]];
    for (var i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function interpolate(str, scope) {
    return str.replace(ANY, function (_, e) { var v = lookup(e, scope); return v == null || v === false ? '' : String(v); });
  }

  // ---------- render template -> fresh DOM ----------
  function renderChildren(tplParent, scope, ctx, out) {
    var kids = tplParent.childNodes;
    for (var i = 0; i < kids.length; i++) renderNode(kids[i], scope, ctx, out);
    return out;
  }

  function renderNode(t, scope, ctx, out) {
    if (t.nodeType === 3) { out.push(document.createTextNode(t.data.indexOf('{{') < 0 ? t.data : interpolate(t.data, scope))); return; }
    if (t.nodeType !== 1) return;
    var tag = t.localName;

    if (tag === 'helmet') return;

    if (tag === 'sc-if') {
      if (attrVal(t, 'value', scope)) renderChildren(t, scope, ctx, out);
      return;
    }

    if (tag === 'sc-for') {
      var list = attrVal(t, 'list', scope) || [];
      var as = t.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.create(scope);
        s[as] = list[i];
        s.$index = i;
        renderChildren(t, s, ctx, out);
      }
      return;
    }

    if (tag === 'dc-import') {
      var name = t.getAttribute('name');
      var props = {};
      for (var a = 0; a < t.attributes.length; a++) {
        var at = t.attributes[a];
        if (at.name === 'name' || at.name.indexOf('hint-') === 0) continue;
        var key = at.name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
        props[key] = attrVal(t, at.name, scope);
      }
      var k = ctx.path + '/' + (ctx.childIdx++) + ':' + name;
      var inst = ctx.inst.__children[k];
      if (!inst) { inst = ctx.inst.__children[k] = create(name, props); }
      else inst.props = props;
      var wrap = document.createElement('div');
      wrap.setAttribute('data-dc', name);
      wrap.style.display = 'contents';
      renderInstance(inst, k).forEach(function (n) { wrap.appendChild(n); });
      out.push(wrap);
      return;
    }

    var el = t.namespaceURI && t.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(t.namespaceURI, t.localName)
      : document.createElement(tag);
    for (var j = 0; j < t.attributes.length; j++) {
      var attr = t.attributes[j], n = attr.name, raw = attr.value;
      if (n.indexOf('hint-') === 0) continue;
      var m = raw.match(WHOLE);
      if (/^on[A-Z]/.test(n) || /^on[a-z]+$/.test(n) && m) {
        var fn = m ? lookup(m[1], scope) : null;
        if (typeof fn === 'function') { el.__on = el.__on || {}; el.__on[n.toLowerCase()] = fn; }
        continue;
      }
      var v = m ? lookup(m[1], scope) : (raw.indexOf('{{') >= 0 ? interpolate(raw, scope) : raw);
      var lname = n.toLowerCase();
      if (BOOL_ATTRS[lname]) { if (v && v !== 'false') el.setAttribute(n, ''); continue; }
      if (v == null) continue;
      el.setAttribute(n, String(v));
    }
    var inner = renderChildren(t.content || t, scope, ctx, []);
    for (var c = 0; c < inner.length; c++) el.appendChild(inner[c]);
    out.push(el);
  }

  function attrVal(t, name, scope) {
    var raw = t.getAttribute(name);
    if (raw == null) return undefined;
    var m = raw.match(WHOLE);
    return m ? lookup(m[1], scope) : raw;
  }

  // ---------- instances ----------
  function create(name, props) {
    var def = registry[name];
    if (!def) throw new Error('Unknown component: ' + name);
    var inst = new def.Logic(props || {});
    if (!inst.state) inst.state = {};
    inst.__name = name;
    inst.__children = {};
    return inst;
  }

  function renderInstance(inst, path) {
    var vals;
    try { vals = inst.renderVals() || {}; }
    catch (e) { console.error('[' + inst.__name + '] renderVals failed', e); vals = {}; }
    var ctx = { inst: inst, path: path, childIdx: 0 };
    return renderChildren(registry[inst.__name].tpl.content, vals, ctx, []);
  }

  // ---------- patch live DOM ----------
  function same(a, b) {
    return a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.namespaceURI === b.namespaceURI && a.localName === b.localName));
  }

  function patchChildren(parent, next) {
    var prev = Array.prototype.slice.call(parent.childNodes);
    for (var i = 0; i < next.length; i++) {
      var o = prev[i], n = next[i];
      if (!o) parent.appendChild(n);
      else if (same(o, n)) patchNode(o, n);
      else parent.replaceChild(n, o);
    }
    for (var j = next.length; j < prev.length; j++) parent.removeChild(prev[j]);
  }

  function patchNode(o, n) {
    if (o.nodeType === 3) { if (o.data !== n.data) o.data = n.data; return; }
    var i, a;
    for (i = o.attributes.length - 1; i >= 0; i--) {
      a = o.attributes[i].name;
      if (!n.hasAttribute(a)) o.removeAttribute(a);
    }
    for (i = 0; i < n.attributes.length; i++) {
      a = n.attributes[i];
      if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
    }
    if (o.localName === 'input' || o.localName === 'textarea' || o.localName === 'select') {
      if (n.hasAttribute('value') && o.__v !== n.getAttribute('value')) { o.value = n.getAttribute('value'); o.__v = n.getAttribute('value'); }
      if (o.type === 'checkbox' || o.type === 'radio') o.checked = n.hasAttribute('checked');
    }
    o.__on = n.__on;
    patchChildren(o, Array.prototype.slice.call(n.childNodes));
  }

  function prime(nodes) {
    // first paint: sync form properties from attributes
    nodes.forEach(function walk(node) {
      if (node.nodeType !== 1) return;
      if ((node.localName === 'input' || node.localName === 'textarea') && node.hasAttribute('value')) node.__v = node.getAttribute('value');
      Array.prototype.forEach.call(node.childNodes, walk);
    });
  }

  // ---------- scheduling ----------
  function schedule() {
    if (pending) return;
    pending = true;
    Promise.resolve().then(function () { pending = false; draw(); });
  }
  function draw() {
    var nodes = renderInstance(root, 'root');
    if (!mount.__drawn) { prime(nodes); mount.__drawn = true; }
    patchChildren(mount, nodes);
  }

  // ---------- events ----------
  function dispatch(e, names) {
    var el = e.target;
    while (el && el !== mount.parentNode) {
      if (el.__on) {
        for (var i = 0; i < names.length; i++) {
          var fn = el.__on[names[i]];
          if (fn) { try { fn(e); } catch (err) { console.error(err); } }
        }
        if (e.cancelBubble) return;
      }
      el = el.parentNode;
    }
  }
  function isTextLike(el) {
    return el && (el.localName === 'textarea' || (el.localName === 'input' && !/^(checkbox|radio|button|submit|file)$/.test(el.type)));
  }

  // ---------- boot ----------
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('template[data-dc-component]'), function (tpl) {
      var name = tpl.getAttribute('data-dc-component');
      var src = document.querySelector('script[type="text/x-dc"][data-dc-component="' + name + '"]');
      registry[name] = { tpl: tpl, Logic: compile(src ? src.textContent : 'class Component extends DCLogic {}') };
    });
    mount = document.getElementById('dc-app');
    root = create(mount.getAttribute('data-root'), {});
    mount.addEventListener('click', function (e) { dispatch(e, ['onclick']); });
    mount.addEventListener('change', function (e) { if (!isTextLike(e.target)) dispatch(e, ['onchange']); });
    mount.addEventListener('input', function (e) { dispatch(e, isTextLike(e.target) ? ['oninput', 'onchange'] : ['oninput']); });
    mount.addEventListener('keydown', function (e) { dispatch(e, ['onkeydown']); });
    mount.addEventListener('submit', function (e) { dispatch(e, ['onsubmit']); });
    draw();
    if (typeof root.componentDidMount === 'function') root.componentDidMount();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
