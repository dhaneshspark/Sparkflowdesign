/*
 * SparkFlow app shell: the left sidebar and the top header, shared by every page that has them.
 * Load this BEFORE assets/runtime.js. It registers two components the runtime can import:
 *
 *   <dc-import name="AppSidebar" active="home"></dc-import>
 *   <dc-import name="AppTopbar" active="home" inset="{{true}}" welcome="{{true}}" as-h1="{{true}}"></dc-import>
 *
 * AppSidebar: collapsed rail / expanded menu, hover-to-preview on the toggle icon, click-to-pin,
 *             sticky full-height positioning. Props: active (nav key).
 * AppTopbar:  sticky header with the active page title and Notification / Chat / Escalation icons.
 *             Props: active (nav key, sets the title), title (optional page-specific title that
 *             overrides the nav label), inset (main has 28px/32px padding to bleed
 *             through), welcome (Home-only welcome line), asH1 (title is the page's main heading).
 */
(function () {
  'use strict';

  var ACCENT = '#0070FF';

  // ---------- styles ----------
  var css = [
    '.sf-topbar{position:sticky;top:0;z-index:20;padding:0 32px;height:64px;box-sizing:border-box;display:flex;align-items:center;gap:16px;background:#FFFFFF;border-bottom:1px solid #E4E7EC}',
    '.sf-topbar--inset{margin:-28px -32px 0}',
    '.sf-topbar-heading{flex:1;min-width:0;display:flex;align-items:center;gap:12px}',
    '.sf-topbar-title{flex:0 1 auto;min-width:0;margin:0;font-family:Inter;font-size:20px;font-weight:600;color:#101828;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sf-topbar-actions{display:flex;align-items:center;gap:6px;flex:none}',
    '.sf-topbar-btn{width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;background:transparent;color:#475467;cursor:pointer;transition:background-color .15s ease,color .15s ease}',
    '.sf-topbar-btn:hover{background:#F2F4F7;color:' + ACCENT + '}',
    '.sf-topbar-btn:focus-visible{outline:2px solid ' + ACCENT + ';outline-offset:2px}',
    '.sf-topbar-welcome{flex:0 1 auto;min-width:0;margin:0;padding-left:12px;border-left:1px solid #E4E7EC;font-family:Inter;font-size:14px;font-weight:500;line-height:20px;color:#475467;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sf-topbar-welcome strong{font-weight:600;color:' + ACCENT + '}',
    '@media (max-width:640px){.sf-topbar-welcome{display:none}}',
    '@media (max-width:640px){.sf-topbar{height:56px}.sf-topbar-title{font-size:17px}.sf-topbar-actions{gap:2px}.sf-topbar-btn{width:36px;height:36px}}',
    // Sidebar collapse/expand toggle icon (Flaticon UIcons): points left when expanded, flipped to point right when collapsed.
    '.sf-menu-toggle-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;font-size:18px;line-height:1}',
    '.sf-menu-toggle-icon::before{line-height:1}',
    '.sf-menu-toggle-icon--expand{transform:rotate(180deg)}'
  ].join('\n');

  // Flaticon UIcons (regular rounded) for the sidebar toggle icon.
  var UICONS_HREF = 'https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css';

  // ---------- sidebar markup ----------
  var ICON = 'width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON20 = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  var sidebarTpl = '' +
    '<!-- Expanded menu: docked when expanded; when collapsed it floats over the rail and shows only while previewing -->' +
    '<aside aria-label="Main menu" aria-hidden="{{peekHidden}}" data-peek-zone="{{peekZone}}" style="{{sideOpenStyle}}">' +
      '<div style="display: flex; align-items: center; gap: 10px; padding: 2px 4px 2px 6px">' +
        '<div style="{{logoStyle}}"><img src="assets/sparkflow-icon.png" alt="SparkFlow" style="width:34px;height:34px;object-fit:contain"></div>' +
        '<div style="flex: 1; font-family: Inter; font-weight: 600; font-size: 18px; color: #FFFFFF">SparkFlow</div>' +
        '<button onClick="{{toggleMenu}}" aria-label="{{menuBtnLabel}}" title="{{menuBtnTitle}}" style="width: 36px; height: 36px; border-radius: 9px; border: 1px solid rgba(255,255,255,.18); background: transparent; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer">' +
          '<i class="{{menuBtnIconCls}}" aria-hidden="true"></i>' +
        '</button>' +
      '</div>' +
      '<nav aria-label="Main" style="display: flex; flex-direction: column; gap: 2px">' +
        '<sc-for list="{{navTop}}" as="n">' +
          '<a href="{{n.href}}" aria-current="{{n.current}}" style="{{n.openStyle}}">' +
            '<svg ' + ICON20 + '><path d="{{n.icon}}"></path></svg>' +
            '<span style="flex: 1">{{n.label}}</span>' +
            '<sc-if value="{{n.badge}}"><span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #F79009; color: #101828">{{n.badge}}</span></sc-if>' +
          '</a>' +
        '</sc-for>' +
      '</nav>' +
      '<div style="height: 1px; background: rgba(255,255,255,.12)"></div>' +
      '<div style="display: flex; flex-direction: column; gap: 2px">' +
        '<button onClick="{{toggleReq}}" aria-expanded="{{reqOpen}}" style="display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: 10px; border: 0; background: transparent; color: #E0E7FF; font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; text-align: left">' +
          '<svg ' + ICON20 + '><path d="M12 5v14M5 12h14"></path></svg>' +
          '<span style="flex: 1">Request Center</span>' +
          '<span style="font-size: 12px; color: #A5B4FC">{{reqCaret}}</span>' +
        '</button>' +
        '<sc-if value="{{reqOpen}}">' +
          '<div style="display: flex; flex-direction: column; gap: 1px; padding-left: 32px">' +
            '<sc-for list="{{workflows}}" as="w">' +
              '<a href="#" style="display: flex; align-items: center; min-height: 36px; padding: 0 12px; border-radius: 8px; font-size: 13px; color: #C7D2FE">{{w}}</a>' +
            '</sc-for>' +
            '<a href="#" style="display: flex; align-items: center; min-height: 36px; padding: 0 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #93C5FD">All workflows →</a>' +
          '</div>' +
        '</sc-if>' +
      '</div>' +
      '<div style="height: 1px; background: rgba(255,255,255,.12)"></div>' +
      '<nav aria-label="Library" style="display: flex; flex-direction: column; gap: 2px">' +
        '<sc-for list="{{navBottom}}" as="n">' +
          '<a href="{{n.href}}" aria-current="{{n.current}}" style="{{n.openStyle}}">' +
            '<svg ' + ICON20 + '><path d="{{n.icon}}"></path></svg>' +
            '<span style="flex: 1">{{n.label}}</span>' +
          '</a>' +
        '</sc-for>' +
      '</nav>' +
      '<div style="margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,.06)">' +
        '<div style="display: flex; align-items: center; gap: 10px">' +
          '<div style="width: 38px; height: 38px; border-radius: 50%; background: #FDE7C7; color: #93370D; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex: none">DJ</div>' +
          '<div style="flex: 1; min-width: 0">' +
            '<div style="font-size: 14px; font-weight: 600; color: #FFFFFF">Daniel Johnson</div>' +
            '<div style="font-size: 12px; color: #A5B4FC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Site Engineer · HSE Dept</div>' +
          '</div>' +
          '<button aria-label="Profile and settings" style="width: 32px; height: 32px; border-radius: 8px; border: 0; background: transparent; color: #C7D2FE; font-size: 18px; cursor: pointer">⋯</button>' +
        '</div>' +
        '<div role="radiogroup" aria-label="Workspace" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 3px; border-radius: 9px; background: rgba(0,0,0,.25)">' +
          '<a href="#" role="radio" aria-checked="false" style="display: flex; align-items: center; justify-content: center; height: 32px; border-radius: 7px; font-size: 13px; font-weight: 600; color: #C7D2FE">Admin</a>' +
          '<span role="radio" aria-checked="true" style="{{userPillStyle}}">User</span>' +
        '</div>' +
      '</div>' +
    '</aside>' +

    '<!-- Collapsed rail -->' +
    '<sc-if value="{{menuClosed}}">' +
      '<aside aria-label="Main menu (collapsed)" style="{{sideClosedStyle}}">' +
        '<div style="{{logoStyle}}"><img src="assets/sparkflow-icon.png" alt="SparkFlow" style="width:34px;height:34px;object-fit:contain"></div>' +
        '<button onClick="{{toggleMenu}}" data-peek-trigger aria-label="Expand menu" title="Expand menu  ( [ )" style="width: 44px; height: 36px; border-radius: 9px; border: 1px solid rgba(255,255,255,.18); background: transparent; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 6px">' +
          '<i class="fi fi-rr-angle-double-small-left sf-menu-toggle-icon sf-menu-toggle-icon--expand" aria-hidden="true"></i>' +
        '</button>' +
        '<sc-for list="{{navTop}}" as="n">' +
          '<a href="{{n.href}}" aria-label="{{n.label}}" title="{{n.label}}" aria-current="{{n.current}}" style="{{n.railStyle}}">' +
            '<span style="{{n.railIconStyle}}"><svg ' + ICON + '><path d="{{n.icon}}"></path></svg></span>' +
            '<span style="font-size: 10px; font-weight: 500; line-height: 1.2; text-align: center">{{n.short}}</span>' +
            '<sc-if value="{{n.badge}}"><span style="position: absolute; top: 4px; right: 6px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; background: #F79009; color: #101828; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center">{{n.badge}}</span></sc-if>' +
          '</a>' +
        '</sc-for>' +
        '<button onClick="{{toggleFly}}" aria-expanded="{{flyOpen}}" aria-label="Request Center" title="Request Center" style="{{reqRailStyle}}">' +
          '<svg ' + ICON + '><path d="M12 5v14M5 12h14"></path></svg>' +
          '<span style="font-size: 10px; font-weight: 500">Request</span>' +
        '</button>' +
        '<sc-for list="{{navBottom}}" as="n">' +
          '<a href="{{n.href}}" aria-label="{{n.label}}" title="{{n.label}}" aria-current="{{n.current}}" style="{{n.railStyle}}">' +
            '<span style="{{n.railIconStyle}}"><svg ' + ICON + '><path d="{{n.icon}}"></path></svg></span>' +
            '<span style="font-size: 10px; font-weight: 500; line-height: 1.2; text-align: center">{{n.short}}</span>' +
          '</a>' +
        '</sc-for>' +
        '<button aria-label="Daniel Johnson – profile, switch to Admin" title="Profile · switch to Admin" style="margin-top: auto; position: relative; width: 40px; height: 40px; border-radius: 50%; border: 0; background: #FDE7C7; color: #93370D; font: inherit; font-weight: 700; font-size: 13px; cursor: pointer">' +
          'DJ<span style="{{userDotStyle}}">U</span>' +
        '</button>' +
      '</aside>' +
      '<!-- Request Center flyout (collapsed mode) -->' +
      '<sc-if value="{{flyOpen}}">' +
        '<div role="menu" aria-label="Start a request" style="position: fixed; left: 80px; top: 300px; z-index: 30; width: 260px; padding: 10px; background: #FFFFFF; border: 1px solid #E4E7EC; border-radius: 14px; box-shadow: 0 12px 32px rgba(16,24,40,.18); display: flex; flex-direction: column; gap: 2px">' +
          '<div style="padding: 6px 10px 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475467">Start a request</div>' +
          '<sc-for list="{{workflows}}" as="w">' +
            '<a href="#" role="menuitem" style="display: flex; align-items: center; min-height: 40px; padding: 0 10px; border-radius: 8px; font-size: 14px; color: #101828">{{w}}</a>' +
          '</sc-for>' +
          '<a href="#" role="menuitem" style="{{flyAllStyle}}">All workflows →</a>' +
        '</div>' +
      '</sc-if>' +
    '</sc-if>';

  // ---------- header markup ----------
  var topbarTpl = '' +
    '<header class="{{cls}}">' +
      '<div class="sf-topbar-heading">' +
        '<sc-if value="{{asH1}}"><h1 class="sf-topbar-title">{{title}}</h1></sc-if>' +
        '<sc-if value="{{notH1}}"><div class="sf-topbar-title">{{title}}</div></sc-if>' +
        '<sc-if value="{{welcome}}"><p class="sf-topbar-welcome">Welcome back, <strong>Daniel</strong></p></sc-if>' +
      '</div>' +
      '<div class="sf-topbar-actions">' +
        '<button type="button" class="sf-topbar-btn" aria-label="Notifications" title="Notifications">' +
          '<svg ' + ICON20 + '><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>' +
        '</button>' +
        '<button type="button" class="sf-topbar-btn" aria-label="Chat" title="Chat">' +
          '<svg ' + ICON20 + '><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
        '</button>' +
        '<button type="button" class="sf-topbar-btn" aria-label="Escalations, 1 unread" title="Escalations · 1 unread" style="position: relative">' +
          '<svg ' + ICON20 + '><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"></path></svg>' +
          '<span aria-hidden="true" style="position: absolute; top: 4px; right: 4px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; border: 2px solid #FFFFFF; background: #D92D20; color: #FFFFFF; font-size: 10px; font-weight: 700; line-height: 12px; display: flex; align-items: center; justify-content: center">1</span>' +
        '</button>' +
      '</div>' +
    '</header>';

  // ---------- logic (compiled by the runtime; each must define `class Component`) ----------
  var sharedJs = '' +
    "const SF_ACCENT = '" + ACCENT + "';\n" +
    "const SF_NAV = {\n" +
    "  top: [\n" +
    "    { key: 'home', label: 'Home', short: 'Home', href: 'index.html', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },\n" +
    "    { key: 'sent', label: 'My submissions', short: 'My submissions', href: 'my-submissions.html', icon: 'M22 2 11 13M22 2l-7 20-4-9-9-4z' }\n" +
    "  ],\n" +
    "  bottom: [\n" +
    "    { key: 'docs', label: 'Document registry', short: 'Docs', href: '#', icon: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },\n" +
    "    { key: 'events', label: 'Events', short: 'Events', href: '#', icon: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' }\n" +
    "  ]\n" +
    "};\n" +
    "const sfHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));\n" +
    "const sfMix = (h, to, t) => { const a = sfHex(h), b = sfHex(to); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); };\n";

  var sidebarJs = sharedJs + [
    'class Component extends DCLogic {',
    '  constructor(p) {',
    '    super(p);',
    '    this.state = {};',
    '    // Sidebar pinned open from the hover preview stays open across page loads until collapsed again.',
    "    try { if (sessionStorage.getItem('sf-menu-pinned') === '1') this.state.menu = true; } catch (e) {}",
    '    this.bindPeek();',
    '  }',
    '  isCollapsed() { return !(this.state.menu ?? (this.props.menuExpanded ?? false)); }',
    '  pinMenu() {',
    '    this.cancelPeek();',
    "    try { sessionStorage.setItem('sf-menu-pinned', '1'); } catch (e) {}",
    '    this.setState({ menu: true, fly: false, peek: false });',
    '  }',
    '  // ---- Collapsed-sidebar hover preview: only the rail\'s expand/collapse toggle icon opens it ----',
    '  cancelPeek() { clearTimeout(this._peekTimer); }',
    '  setPeek(on, delay) {',
    '    this.cancelPeek();',
    '    this._peekTimer = setTimeout(() => {',
    '      if ((on && !this.isCollapsed()) || !!this.state.peek === on) return;',
    '      this.setState(on ? { peek: true, fly: false } : { peek: false });',
    '    }, delay);',
    '  }',
    '  bindPeek() {',
    '    // Once the menu floats over the toggle icon it covers it, so the icon\'s on-screen',
    '    // rectangle (not the element) decides "still on the icon".',
    '    const onIcon = (x, y) => {',
    "      const b = document.querySelector('[data-peek-trigger]');",
    '      if (!b) return false;',
    '      const r = b.getBoundingClientRect();',
    '      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;',
    '    };',
    "    const onPanel = el => !!(el && el.closest && el.closest('[data-peek-zone=\"panel\"]'));",
    "    document.addEventListener('pointerover', e => {",
    "      if (e.pointerType !== 'mouse' || this.state.peek) return;",
    "      if (e.target.closest && e.target.closest('[data-peek-trigger]')) this.setPeek(true, 120);",
    '    });',
    "    document.addEventListener('pointerout', e => {",
    "      if (e.pointerType !== 'mouse' || this.state.peek) return;",
    "      if (e.target.closest && e.target.closest('[data-peek-trigger]') && !onIcon(e.clientX, e.clientY)) this.cancelPeek();",
    '    });',
    "    document.addEventListener('pointermove', e => {",
    "      if (e.pointerType !== 'mouse' || !this.state.peek) return;",
    '      if (onIcon(e.clientX, e.clientY) || onPanel(e.target)) this.cancelPeek();',
    '      else this.setPeek(false, 200);',
    '    });',
    "    document.documentElement.addEventListener('pointerleave', () => { if (this.state.peek) this.setPeek(false, 200); });",
    "    document.addEventListener('click', e => {",
    '      if (!this.state.peek) return;',
    '      // A click on the (covered) toggle icon still expands the menu.',
    '      if (onIcon(e.clientX, e.clientY)) {',
    '        e.preventDefault(); e.stopPropagation();',
    '        this.cancelPeek();',
    '        this.setState({ menu: true, fly: false, peek: false });',
    '        return;',
    '      }',
    '      // Clicking any menu item in the preview pins the sidebar open; the item\'s own action still runs.',
    "      if (onPanel(e.target) && e.target.closest('a, button, [role=\"radio\"]')) this.pinMenu();",
    '    }, true);',
    '  }',
    '  renderVals() {',
    '    const A = SF_ACCENT, AD = sfMix(A, \'#000000\', 0.72), AH = sfMix(A, \'#000000\', 0.2);',
    "    const active = this.props.active || 'home';",
    '    const menuOpen = !this.isCollapsed();',
    '    const reqOpen = this.state.req ?? true;',
    '    const flyOpen = !!this.state.fly && !menuOpen;',
    '    const peek = !!this.state.peek && !menuOpen;',
    "    const openBase = 'display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:10px;font-size:14px;font-weight:500;';",
    "    const railBase = 'position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:56px;min-height:56px;border-radius:12px;';",
    '    const mk = n => { const on = n.key === active; return { ...n, current: on ? \'page\' : null,',
    "      openStyle: openBase + (on ? `background:${A};color:#FFFFFF;font-weight:600` : 'color:#E0E7FF'),",
    "      railStyle: railBase + (on ? 'color:#FFFFFF' : 'color:#C7D2FE'),",
    '      // Active highlight sits around the icon only, sized like the rail toggle button (44x36).',
    "      railIconStyle: 'display:flex;align-items:center;justify-content:center;width:44px;height:36px;border-radius:9px;' + (on ? `background:${A}` : '') }; };",
    "    const side = 'box-sizing:border-box;background:#0F1B3D;display:flex;flex-direction:column;';",
    '    // Sticky, one viewport tall; scrolls on its own only if the screen is too short for its items.',
    "    const stick = 'height:100vh;height:100dvh;overflow-x:hidden;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;';",
    "    const docked = 'position:sticky;top:0;align-self:flex-start;';",
    '    return {',
    '      navTop: SF_NAV.top.map(mk), navBottom: SF_NAV.bottom.map(mk),',
    "      workflows: ['Permit To Work', 'Hot Work Permit', 'Site Handover & Inspection'],",
    "      menuClosed: !menuOpen, reqOpen, reqCaret: reqOpen ? '▾' : '▸', flyOpen,",
    "      // Docked: explicitly fully shown with no transition, so it never inherits a half-finished preview fade.",
    "      sideOpenStyle: side + stick + 'flex:0 0 260px;width:260px;padding:16px 12px;gap:14px;' + (menuOpen ? docked + 'transition:none;transform:none;opacity:1;visibility:visible;' :",
    "        'position:fixed;left:0;top:0;z-index:40;transition:transform .2s ease,opacity .2s ease,visibility .2s;' +",
    "        (peek ? 'transform:none;opacity:1;visibility:visible;box-shadow:8px 0 24px rgba(16,24,40,.18)'",
    "              : 'transform:translateX(-12px);opacity:0;visibility:hidden;pointer-events:none')),",
    "      peekZone: menuOpen ? null : 'panel',",
    "      peekHidden: menuOpen || peek ? null : 'true',",
    "      menuBtnLabel: menuOpen ? 'Collapse menu' : 'Keep menu open',",
    "      menuBtnTitle: menuOpen ? 'Collapse menu  ( [ )' : 'Keep menu open  ( [ )',",
    "      menuBtnIconCls: 'fi fi-rr-angle-double-small-left sf-menu-toggle-icon' + (menuOpen ? '' : ' sf-menu-toggle-icon--expand'),",
    "      sideClosedStyle: side + stick + docked + 'flex:0 0 76px;width:76px;padding:16px 10px;align-items:center;gap:6px',",
    "      logoStyle: 'width:36px;height:36px;border-radius:10px;background:transparent;display:flex;align-items:center;justify-content:center;flex:none;margin-bottom:4px',",
    "      reqRailStyle: railBase + 'border:0;font:inherit;cursor:pointer;' + (flyOpen ? 'background:rgba(255,255,255,.12);color:#FFFFFF' : 'background:transparent;color:#C7D2FE'),",
    "      userPillStyle: `display:flex;align-items:center;justify-content:center;height:32px;border-radius:7px;font-size:13px;font-weight:700;background:${A};color:#FFFFFF`,",
    "      userDotStyle: `position:absolute;right:-3px;bottom:-3px;width:18px;height:18px;border-radius:50%;background:${A};color:#FFFFFF;border:2px solid ${AD};font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center`,",
    "      flyAllStyle: `display:flex;align-items:center;min-height:40px;padding:0 10px;border-radius:8px;font-size:14px;font-weight:600;color:${AH}`,",
    '      toggleMenu: () => {',
    '        this.cancelPeek();',
    "        if (menuOpen) { try { sessionStorage.removeItem('sf-menu-pinned'); } catch (e) {} }",
    '        this.setState({ menu: !menuOpen, fly: false, peek: false });',
    '      },',
    '      toggleReq: () => this.setState({ req: !reqOpen }),',
    '      toggleFly: () => this.setState({ fly: !this.state.fly })',
    '    };',
    '  }',
    '}'
  ].join('\n');

  var topbarJs = sharedJs + [
    'class Component extends DCLogic {',
    '  renderVals() {',
    "    const active = this.props.active || 'home';",
    '    const item = [...SF_NAV.top, ...SF_NAV.bottom].find(n => n.key === active) || SF_NAV.top[0];',
    '    return {',
    '      // A page may pass its own title (e.g. the task being viewed); otherwise the active menu item.',
    '      title: this.props.title || item.label,',
    "      cls: 'sf-topbar' + (this.props.inset ? ' sf-topbar--inset' : ''),",
    '      asH1: !!this.props.asH1, notH1: !this.props.asH1,',
    '      welcome: !!this.props.welcome',
    '    };',
    '  }',
    '}'
  ].join('\n');

  // ---------- register with the runtime ----------
  function add(name, html, js) {
    var tpl = document.createElement('template');
    tpl.setAttribute('data-dc-component', name);
    tpl.innerHTML = html;
    var src = document.createElement('script');
    src.type = 'text/x-dc';
    src.setAttribute('data-dc-component', name);
    src.textContent = js;
    document.body.appendChild(tpl);
    document.body.appendChild(src);
  }
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  if (!document.querySelector('link[href="' + UICONS_HREF + '"]')) {
    var uicons = document.createElement('link');
    uicons.rel = 'stylesheet';
    uicons.href = UICONS_HREF;
    document.head.appendChild(uicons);
  }
  add('AppSidebar', sidebarTpl, sidebarJs);
  add('AppTopbar', topbarTpl, topbarJs);
})();
