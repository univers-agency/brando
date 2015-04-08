"use strict";function activate_tab(e){if(console.log("activate_tab ",e),!$(e).hasClass("is-active")){console.log("lets roll");var t=$(e).closest(".accordion-tabs-minimal");t.find(".is-open").removeClass("is-open").hide(),$(e).next().toggleClass("is-open").toggle(),t.find(".is-active").removeClass("is-active"),$(e).addClass("is-active")}}$(document).ready(function(){$(".accordion-tabs-minimal").each(function(){$(this).children("li").first().children("a").addClass("is-active").next().addClass("is-open").show()}),$(".accordion-tabs-minimal").on("click","li > a",function(e){e.preventDefault(),activate_tab(this)})}),+function(e){function t(t){t&&3===t.which||(e(i).remove(),e(a).each(function(){var o=n(e(this)),i={relatedTarget:this};o.hasClass("open")&&(o.trigger(t=e.Event("hide.bs.dropdown",i)),t.isDefaultPrevented()||o.removeClass("open").trigger("hidden.bs.dropdown",i))}))}function n(t){var n=t.attr("data-target");n||(n=t.attr("href"),n=n&&/#[A-Za-z]/.test(n)&&n.replace(/.*(?=#[^\s]*$)/,""));var o=n&&e(n);return o&&o.length?o:t.parent()}function o(t){return this.each(function(){var n=e(this),o=n.data("bs.dropdown");o||n.data("bs.dropdown",o=new s(this)),"string"==typeof t&&o[t].call(n)})}var i=".dropdown-backdrop",a='[data-toggle="dropdown"]',s=function(t){e(t).on("click.bs.dropdown",this.toggle)};s.VERSION="3.2.0",s.prototype.toggle=function(o){var i=e(this);if(!i.is(".disabled, :disabled")){var a=n(i),s=a.hasClass("open");if(t(),!s){"ontouchstart"in document.documentElement&&!a.closest(".navbar-nav").length&&e('<div class="dropdown-backdrop"/>').insertAfter(e(this)).on("click",t);var r={relatedTarget:this};if(a.trigger(o=e.Event("show.bs.dropdown",r)),o.isDefaultPrevented())return;i.trigger("focus"),a.toggleClass("open").trigger("shown.bs.dropdown",r)}return!1}},s.prototype.keydown=function(t){if(/(38|40|27)/.test(t.keyCode)){var o=e(this);if(t.preventDefault(),t.stopPropagation(),!o.is(".disabled, :disabled")){var i=n(o),s=i.hasClass("open");if(!s||s&&27==t.keyCode)return 27==t.which&&i.find(a).trigger("focus"),o.trigger("click");var r=" li:not(.divider):visible a",l=i.find('[role="menu"]'+r+', [role="listbox"]'+r);if(l.length){var d=l.index(l.filter(":focus"));38==t.keyCode&&d>0&&d--,40==t.keyCode&&d<l.length-1&&d++,~d||(d=0),l.eq(d).trigger("focus")}}}};var r=e.fn.dropdown;e.fn.dropdown=o,e.fn.dropdown.Constructor=s,e.fn.dropdown.noConflict=function(){return e.fn.dropdown=r,this},e(document).on("click.bs.dropdown.data-api",t).on("click.bs.dropdown.data-api",".dropdown form",function(e){e.stopPropagation()}).on("click.bs.dropdown.data-api",a,s.prototype.toggle).on("keydown.bs.dropdown.data-api",a+', [role="menu"], [role="listbox"]',s.prototype.keydown)}(jQuery),$.fn.dropdown.Constructor.prototype.change=function(e){e.preventDefault();var t,n,o,i=$(e.target),a=!1;!i.is("a")&&(i=i.closest("a")),n=i.closest(".dropdown-menu"),o=n.parent().find(".dropdown-label"),$labelHolder=o.text(),t=i.find("input"),a=t.is(":checked"),t.is(":disabled")||"radio"==t.attr("type")&&a||("radio"==t.attr("type")&&n.find("li").removeClass("active"),i.parent().removeClass("active"),!a&&i.parent().addClass("active"),t.prop("checked",!t.prop("checked")),$items=n.find("li > a > input:checked"),$items.length?($text=[],$items.each(function(){var e=$(this).parent().text();e&&$text.push($.trim(e))}),$text=$text.length<4?$text.join(", "):$text.length+" selected",o.html($text)):o.html(o.data("placeholder")))},$(document).on("click.dropdown-menu",".dropdown-select > li > a",$.fn.dropdown.Constructor.prototype.change),$(document).on("click",".nav-primary a",function(e){var t,n=$(e.target);n.is("a")||(n=n.closest("a")),$(".nav-vertical").length||(t=n.parent().siblings(".active"),t&&t.find("> a").toggleClass("active")&&t.toggleClass("active").find("> ul:visible").slideUp(200),n.hasClass("active")&&n.next().slideUp(200)||n.next().slideDown(200),n.toggleClass("active").parent().toggleClass("active"),n.next().is("ul")&&e.preventDefault(),setTimeout(function(){$(document).trigger("updateNav")},300))}),$(document).on("click.bs.dropdown.data-api",".dropdown .on, .dropup .on",function(e){e.stopPropagation()}),function(e){"function"==typeof define&&define.amd?define(e):"undefined"!=typeof module&&"undefined"!=typeof module.exports?module.exports=e():"undefined"!=typeof Package?Sortable=e():window.Sortable=e()}(function(){function e(e,t){this.el=e,this.options=t=t||{};var o={group:Math.random(),sort:!0,disabled:!1,store:null,handle:null,scroll:!0,scrollSensitivity:30,scrollSpeed:10,draggable:/[uo]l/i.test(e.nodeName)?"li":">*",ghostClass:"sortable-ghost",ignore:"a, img",filter:null,animation:0,setData:function(e,t){e.setData("Text",t.textContent)},dropBubble:!1,dragoverBubble:!1};for(var i in o)!(i in t)&&(t[i]=o[i]);var s=t.group;s&&"object"==typeof s||(s=t.group={name:s}),["pull","put"].forEach(function(e){e in s||(s[e]=!0)}),X.forEach(function(o){t[o]=n(this,t[o]||q),a(e,o.substr(2).toLowerCase(),t[o])},this),t.groups=" "+s.name+(s.put.join?" "+s.put.join(" "):"")+" ",e[T]=t;for(var r in this)"_"===r.charAt(0)&&(this[r]=n(this,this[r]));a(e,"mousedown",this._onTapStart),a(e,"touchstart",this._onTapStart),a(e,"dragover",this),a(e,"dragenter",this),R.push(this._onDragOver),t.store&&this.sort(t.store.get(this))}function t(e){b&&b.state!==e&&(l(b,"display",e?"none":""),!e&&b.state&&x.insertBefore(b,m),b.state=e)}function n(e,t){var n=P.call(arguments,2);return t.bind?t.bind.apply(t,[e].concat(n)):function(){return t.apply(e,n.concat(P.call(arguments)))}}function o(e,t,n){if(e){n=n||B,t=t.split(".");var o=t.shift().toUpperCase(),i=new RegExp("\\s("+t.join("|")+")\\s","g");do if(">*"===o&&e.parentNode===n||(""===o||e.nodeName.toUpperCase()==o)&&(!t.length||((" "+e.className+" ").match(i)||[]).length==t.length))return e;while(e!==n&&(e=e.parentNode))}return null}function i(e){e.dataTransfer.dropEffect="move",e.preventDefault()}function a(e,t,n){e.addEventListener(t,n,!1)}function s(e,t,n){e.removeEventListener(t,n,!1)}function r(e,t,n){if(e)if(e.classList)e.classList[n?"add":"remove"](t);else{var o=(" "+e.className+" ").replace(/\s+/g," ").replace(" "+t+" ","");e.className=o+(n?" "+t:"")}}function l(e,t,n){var o=e&&e.style;if(o){if(void 0===n)return B.defaultView&&B.defaultView.getComputedStyle?n=B.defaultView.getComputedStyle(e,""):e.currentStyle&&(n=e.currentStyle),void 0===t?n:n[t];t in o||(t="-webkit-"+t),o[t]=n+("string"==typeof n?"":"px")}}function d(e,t,n){if(e){var o=e.getElementsByTagName(t),i=0,a=o.length;if(n)for(;a>i;i++)n(o[i],i);return o}return[]}function u(e){e.draggable=!1}function c(){M=!1}function p(e,t){var n=e.lastElementChild,o=n.getBoundingClientRect();return t.clientY-(o.top+o.height)>5&&n}function f(e){for(var t=e.tagName+e.className+e.src+e.href+e.textContent,n=t.length,o=0;n--;)o+=t.charCodeAt(n);return o.toString(36)}function h(e){for(var t=0;e&&(e=e.previousElementSibling);)"TEMPLATE"!==e.nodeName.toUpperCase()&&t++;return t}function v(e,t){var n,o;return function(){void 0===n&&(n=arguments,o=this,setTimeout(function(){1===n.length?e.call(o,n[0]):e.apply(o,n),n=void 0},t))}}var m,g,b,x,y,C,w,_,E,N,S,O,D,k,$={},T="Sortable"+(new Date).getTime(),A=window,B=A.document,F=A.parseInt,I=!!("draggable"in B.createElement("div")),M=!1,L=function(e,t,n,o,i,a){var s=B.createEvent("Event");s.initEvent(t,!0,!0),s.item=n||e,s.from=o||e,s.clone=b,s.oldIndex=i,s.newIndex=a,e.dispatchEvent(s)},X="onAdd onUpdate onRemove onStart onEnd onFilter onSort".split(" "),q=function(){},j=Math.abs,P=[].slice,R=[],V=v(function(e,t,n){if(n&&t.scroll){var o,i,a,s,r=t.scrollSensitivity,l=t.scrollSpeed,d=e.clientX,u=e.clientY,c=window.innerWidth,p=window.innerHeight;if(w!==n&&(C=t.scroll,w=n,C===!0)){C=n;do if(C.offsetWidth<C.scrollWidth||C.offsetHeight<C.scrollHeight)break;while(C=C.parentNode)}C&&(o=C,i=C.getBoundingClientRect(),a=(j(i.right-d)<=r)-(j(i.left-d)<=r),s=(j(i.bottom-u)<=r)-(j(i.top-u)<=r)),a||s||(a=(r>=c-d)-(r>=d),s=(r>=p-u)-(r>=u),(a||s)&&(o=A)),($.vx!==a||$.vy!==s||$.el!==o)&&($.el=o,$.vx=a,$.vy=s,clearInterval($.pid),o&&($.pid=setInterval(function(){o===A?A.scrollTo(A.scrollX+a*l,A.scrollY+s*l):(s&&(o.scrollTop+=s*l),a&&(o.scrollLeft+=a*l))},24)))}},30);return e.prototype={constructor:e,_dragStarted:function(){x&&m&&(r(m,this.options.ghostClass,!0),e.active=this,L(x,"start",m,x,N))},_onTapStart:function(e){var t=e.type,n=e.touches&&e.touches[0],i=(n||e).target,s=i,r=this.options,l=this.el,c=r.filter;if(!("mousedown"===t&&0!==e.button||r.disabled)&&(i=o(i,r.draggable,l))){if(N=h(i),"function"==typeof c){if(c.call(this,e,i,this))return L(s,"filter",i,l,N),void e.preventDefault()}else if(c&&(c=c.split(",").some(function(e){return e=o(s,e.trim(),l),e?(L(e,"filter",i,l,N),!0):void 0})))return void e.preventDefault();if((!r.handle||o(s,r.handle,l))&&i&&!m&&i.parentNode===l){D=e,x=this.el,m=i,y=m.nextSibling,O=this.options.group,m.draggable=!0,r.ignore.split(",").forEach(function(e){d(i,e.trim(),u)}),n&&(D={target:i,clientX:n.clientX,clientY:n.clientY},this._onDragStart(D,"touch"),e.preventDefault()),a(B,"mouseup",this._onDrop),a(B,"touchend",this._onDrop),a(B,"touchcancel",this._onDrop),a(m,"dragend",this),a(x,"dragstart",this._onDragStart),I||this._onDragStart(D,!0);try{B.selection?B.selection.empty():window.getSelection().removeAllRanges()}catch(p){}}}},_emulateDragOver:function(){if(k){l(g,"display","none");var e=B.elementFromPoint(k.clientX,k.clientY),t=e,n=" "+this.options.group.name,o=R.length;if(t)do{if(t[T]&&t[T].groups.indexOf(n)>-1){for(;o--;)R[o]({clientX:k.clientX,clientY:k.clientY,target:e,rootEl:t});break}e=t}while(t=t.parentNode);l(g,"display","")}},_onTouchMove:function(e){if(D){var t=e.touches?e.touches[0]:e,n=t.clientX-D.clientX,o=t.clientY-D.clientY,i=e.touches?"translate3d("+n+"px,"+o+"px,0)":"translate("+n+"px,"+o+"px)";k=t,l(g,"webkitTransform",i),l(g,"mozTransform",i),l(g,"msTransform",i),l(g,"transform",i),e.preventDefault()}},_onDragStart:function(e,t){var n=e.dataTransfer,o=this.options;if(this._offUpEvents(),"clone"==O.pull&&(b=m.cloneNode(!0),l(b,"display","none"),x.insertBefore(b,m)),t){var i,s=m.getBoundingClientRect(),r=l(m);g=m.cloneNode(!0),l(g,"top",s.top-F(r.marginTop,10)),l(g,"left",s.left-F(r.marginLeft,10)),l(g,"width",s.width),l(g,"height",s.height),l(g,"opacity","0.8"),l(g,"position","fixed"),l(g,"zIndex","100000"),x.appendChild(g),i=g.getBoundingClientRect(),l(g,"width",2*s.width-i.width),l(g,"height",2*s.height-i.height),"touch"===t?(a(B,"touchmove",this._onTouchMove),a(B,"touchend",this._onDrop),a(B,"touchcancel",this._onDrop)):(a(B,"mousemove",this._onTouchMove),a(B,"mouseup",this._onDrop)),this._loopId=setInterval(this._emulateDragOver,150)}else n&&(n.effectAllowed="move",o.setData&&o.setData.call(this,n,m)),a(B,"drop",this);setTimeout(this._dragStarted,0)},_onDragOver:function(e){var n,i,a,s=this.el,r=this.options,d=r.group,u=d.put,f=O===d,h=r.sort;if(m&&(void 0!==e.preventDefault&&(e.preventDefault(),!r.dragoverBubble&&e.stopPropagation()),O&&!r.disabled&&(f?h||(a=!x.contains(m)):O.pull&&u&&(O.name===d.name||u.indexOf&&~u.indexOf(O.name)))&&(void 0===e.rootEl||e.rootEl===this.el))){if(V(e,r,this.el),M)return;if(n=o(e.target,r.draggable,s),i=m.getBoundingClientRect(),a)return t(!0),void(b||y?x.insertBefore(m,b||y):h||x.appendChild(m));if(0===s.children.length||s.children[0]===g||s===e.target&&(n=p(s,e))){if(n){if(n.animated)return;C=n.getBoundingClientRect()}t(f),s.appendChild(m),this._animate(i,m),n&&this._animate(C,n)}else if(n&&!n.animated&&n!==m&&void 0!==n.parentNode[T]){_!==n&&(_=n,E=l(n));var v,C=n.getBoundingClientRect(),w=C.right-C.left,N=C.bottom-C.top,S=/left|right|inline/.test(E.cssFloat+E.display),D=n.offsetWidth>m.offsetWidth,k=n.offsetHeight>m.offsetHeight,$=(S?(e.clientX-C.left)/w:(e.clientY-C.top)/N)>.5,A=n.nextElementSibling;M=!0,setTimeout(c,30),t(f),v=S?n.previousElementSibling===m&&!D||$&&D:A!==m&&!k||$&&k,v&&!A?s.appendChild(m):n.parentNode.insertBefore(m,v?A:n),this._animate(i,m),this._animate(C,n)}}},_animate:function(e,t){var n=this.options.animation;if(n){var o=t.getBoundingClientRect();l(t,"transition","none"),l(t,"transform","translate3d("+(e.left-o.left)+"px,"+(e.top-o.top)+"px,0)"),t.offsetWidth,l(t,"transition","all "+n+"ms"),l(t,"transform","translate3d(0,0,0)"),clearTimeout(t.animated),t.animated=setTimeout(function(){l(t,"transition",""),l(t,"transform",""),t.animated=!1},n)}},_offUpEvents:function(){s(B,"mouseup",this._onDrop),s(B,"touchmove",this._onTouchMove),s(B,"touchend",this._onDrop),s(B,"touchcancel",this._onDrop)},_onDrop:function(t){var n=this.el,o=this.options;clearInterval(this._loopId),clearInterval($.pid),s(B,"drop",this),s(B,"mousemove",this._onTouchMove),s(n,"dragstart",this._onDragStart),this._offUpEvents(),t&&(t.preventDefault(),!o.dropBubble&&t.stopPropagation(),g&&g.parentNode.removeChild(g),m&&(s(m,"dragend",this),u(m),r(m,this.options.ghostClass,!1),x!==m.parentNode?(S=h(m),L(m.parentNode,"sort",m,x,N,S),L(x,"sort",m,x,N,S),L(m,"add",m,x,N,S),L(x,"remove",m,x,N,S)):(b&&b.parentNode.removeChild(b),m.nextSibling!==y&&(S=h(m),L(x,"update",m,x,N,S),L(x,"sort",m,x,N,S))),e.active&&L(x,"end",m,x,N,S)),x=m=g=y=b=C=w=D=k=_=E=O=e.active=null,this.save())},handleEvent:function(e){var t=e.type;"dragover"===t||"dragenter"===t?(this._onDragOver(e),i(e)):("drop"===t||"dragend"===t)&&this._onDrop(e)},toArray:function(){for(var e,t=[],n=this.el.children,i=0,a=n.length;a>i;i++)e=n[i],o(e,this.options.draggable,this.el)&&t.push(e.getAttribute("data-id")||f(e));return t},sort:function(e){var t={},n=this.el;this.toArray().forEach(function(e,i){var a=n.children[i];o(a,this.options.draggable,n)&&(t[e]=a)},this),e.forEach(function(e){t[e]&&(n.removeChild(t[e]),n.appendChild(t[e]))})},save:function(){var e=this.options.store;e&&e.set(this)},closest:function(e,t){return o(e,t||this.options.draggable,this.el)},option:function(e,t){var n=this.options;return void 0===t?n[e]:void(n[e]=t)},destroy:function(){var e=this.el,t=this.options;X.forEach(function(n){s(e,n.substr(2).toLowerCase(),t[n])}),s(e,"mousedown",this._onTapStart),s(e,"touchstart",this._onTapStart),s(e,"dragover",this),s(e,"dragenter",this),Array.prototype.forEach.call(e.querySelectorAll("[draggable]"),function(e){e.removeAttribute("draggable")}),R.splice(R.indexOf(this._onDragOver),1),this._onDrop(),this.el=null}},e.utils={on:a,off:s,css:l,find:d,bind:n,is:function(e,t){return!!o(e,t,e)},throttle:v,closest:o,toggleClass:r,dispatchEvent:L,index:h},e.version="1.1.1",e.create=function(t,n){return new e(t,n)},e}),!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.Slideout=e()}}(function(){return function e(t,n,o){function i(s,r){if(!n[s]){if(!t[s]){var l="function"==typeof require&&require;if(!r&&l)return l(s,!0);if(a)return a(s,!0);var d=new Error("Cannot find module '"+s+"'");throw d.code="MODULE_NOT_FOUND",d}var u=n[s]={exports:{}};t[s][0].call(u.exports,function(e){var n=t[s][1][e];return i(n?n:e)},u,u.exports,e,t,n,o)}return n[s].exports}for(var a="function"==typeof require&&require,s=0;s<o.length;s++)i(o[s]);return i}({1:[function(e,t){function n(e){e=e||{},this._startOffsetX=0,this._currentOffsetX=0,this._opening=!1,this._moved=!1,this._opened=!1,this._preventOpen=!1,this.panel=e.panel,this.menu=e.menu,this.panel.className+=" slideout-panel",this.menu.className+=" slideout-menu",this._fx=e.fx||"ease",this._duration=parseInt(e.duration,10)||300,this._tolerance=parseInt(e.tolerance,10)||70,this._padding=parseInt(e.padding,10)||256,this._initTouchEvents()}var o,i=e("decouple"),a=!1,s=window.document,r=s.documentElement,l=window.navigator.msPointerEnabled,d={start:l?"MSPointerDown":"touchstart",move:l?"MSPointerMove":"touchmove",end:l?"MSPointerUp":"touchend"},u=function(){var e=/^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/,t=s.getElementsByTagName("script")[0].style;for(var n in t)if(e.test(n))return"-"+n.match(e)[0].toLowerCase()+"-";return"WebkitOpacity"in t?"-webkit-":"KhtmlOpacity"in t?"-khtml-":""}();n.prototype.open=function(){var e=this;return-1===r.className.search("slideout-open")&&(r.className+=" slideout-open"),this._setTransition(),this._translateXTo(this._padding),this._opened=!0,setTimeout(function(){e.panel.style.transition=e.panel.style["-webkit-transition"]=""},this._duration+50),this},n.prototype.close=function(){var e=this;return this.isOpen()||this._opening?(this._setTransition(),this._translateXTo(0),this._opened=!1,setTimeout(function(){r.className=r.className.replace(/ slideout-open/,""),e.panel.style.transition=e.panel.style["-webkit-transition"]=""},this._duration+50),this):this},n.prototype.toggle=function(){return this.isOpen()?this.close():this.open()},n.prototype.isOpen=function(){return this._opened},n.prototype._translateXTo=function(e){this._currentOffsetX=e,this.panel.style[u+"transform"]=this.panel.style.transform="translate3d("+e+"px, 0, 0)"},n.prototype._setTransition=function(){this.panel.style[u+"transition"]=this.panel.style.transition=u+"transform "+this._duration+"ms "+this._fx},n.prototype._initTouchEvents=function(){var e=this;i(s,"scroll",function(){e._moved||(clearTimeout(o),a=!0,o=setTimeout(function(){a=!1},250))}),s.addEventListener(d.move,function(t){e._moved&&t.preventDefault()}),this.panel.addEventListener(d.start,function(t){e._moved=!1,e._opening=!1,e._startOffsetX=t.touches[0].pageX,e._preventOpen=!e.isOpen()&&0!==e.menu.clientWidth}),this.panel.addEventListener("touchcancel",function(){e._moved=!1,e._opening=!1}),this.panel.addEventListener(d.end,function(){e._moved&&(e._opening&&Math.abs(e._currentOffsetX)>e._tolerance?e.open():e.close()),e._moved=!1}),this.panel.addEventListener(d.move,function(t){if(!a&&!e._preventOpen){var n=t.touches[0].clientX-e._startOffsetX,o=e._currentOffsetX=n;if(!(Math.abs(o)>e._padding)&&Math.abs(n)>20){if(e._opening=!0,e._opened&&n>0||!e._opened&&0>n)return;e._moved||-1!==r.className.search("slideout-open")||(r.className+=" slideout-open"),0>=n&&(o=n+e._padding,e._opening=!1),e.panel.style[u+"transform"]=e.panel.style.transform="translate3d("+o+"px, 0, 0)",e._moved=!0}}})},t.exports=n},{decouple:2}],2:[function(e,t){function n(e,t,n){function i(e){r=e,a()}function a(){l||(o(s),l=!0)}function s(){n.call(e,r),l=!1}var r,l=!1;e.addEventListener(t,i,!1)}var o=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||function(e){window.setTimeout(e,1e3/60)}}();t.exports=n},{}]},{},[1])(1)}),$(function(){var e={el:{fieldsRows:$("[data-row-span]"),fieldsContainers:$("[data-field-span]:not(.no-height)"),focusableFields:$("input, textarea, select","[data-field-span]"),window:$(window)},init:function(){this.focusField(this.el.focusableFields.filter(":focus")),this.equalizeFieldHeights(),this.events()},focusField:function(e){e.closest("[data-field-span]").addClass("focus")},removeFieldFocus:function(){this.el.fieldsContainers.removeClass("focus")},events:function(){var e=this;e.el.window.resize(function(){e.equalizeFieldHeights()})},equalizeFieldHeights:function(){this.el.fieldsContainers.css("height","auto");var e=this.el.fieldsRows,t=this.el.fieldsContainers;this.areFieldsStacked()||e.each(function(){var e=$(this),n=e.css("height");e.find(t).css("height",n)})},areFieldsStacked:function(){var e=this.el.fieldsRows.not('[data-row-span="1"]').first(),t=0;return e.children().each(function(){t+=$(this).width()}),e.width()<=t}};e.init(),window.GridForms=e}),function(){var e;e=function(e){var t,n;return t=!1,e(function(){var o;return o=(document.body||document.documentElement).style,t=void 0!==o.animation||void 0!==o.WebkitAnimation||void 0!==o.MozAnimation||void 0!==o.MsAnimation||void 0!==o.OAnimation,e(window).bind("keyup.vex",function(e){return 27===e.keyCode?n.closeByEscape():void 0})}),n={globalID:1,animationEndEvent:"animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend",baseClassNames:{vex:"vex",content:"vex-content",overlay:"vex-overlay",close:"vex-close",closing:"vex-closing",open:"vex-open"},defaultOptions:{content:"",showCloseButton:!0,escapeButtonCloses:!0,overlayClosesOnClick:!0,appendLocation:"body",className:"",css:{},overlayClassName:"",overlayCSS:{},contentClassName:"",contentCSS:{},closeClassName:"",closeCSS:{}},open:function(t){return t=e.extend({},n.defaultOptions,t),t.id=n.globalID,n.globalID+=1,t.$vex=e("<div>").addClass(n.baseClassNames.vex).addClass(t.className).css(t.css).data({vex:t}),t.$vexOverlay=e("<div>").addClass(n.baseClassNames.overlay).addClass(t.overlayClassName).css(t.overlayCSS).data({vex:t}),t.overlayClosesOnClick&&t.$vexOverlay.bind("click.vex",function(t){return t.target===this?n.close(e(this).data().vex.id):void 0}),t.$vex.append(t.$vexOverlay),t.$vexContent=e("<div>").addClass(n.baseClassNames.content).addClass(t.contentClassName).css(t.contentCSS).append(t.content).data({vex:t}),t.$vex.append(t.$vexContent),t.showCloseButton&&(t.$closeButton=e("<div>").addClass(n.baseClassNames.close).addClass(t.closeClassName).css(t.closeCSS).data({vex:t}).bind("click.vex",function(){return n.close(e(this).data().vex.id)}),t.$vexContent.append(t.$closeButton)),e(t.appendLocation).append(t.$vex),n.setupBodyClassName(t.$vex),t.afterOpen&&t.afterOpen(t.$vexContent,t),setTimeout(function(){return t.$vexContent.trigger("vexOpen",t)},0),t.$vexContent},getSelectorFromBaseClass:function(e){return"."+e.split(" ").join(".")},getAllVexes:function(){return e("."+n.baseClassNames.vex+':not(".'+n.baseClassNames.closing+'") '+n.getSelectorFromBaseClass(n.baseClassNames.content))},getVexByID:function(t){return n.getAllVexes().filter(function(){return e(this).data().vex.id===t})},close:function(e){var t;if(!e){if(t=n.getAllVexes().last(),!t.length)return!1;e=t.data().vex.id}return n.closeByID(e)},closeAll:function(){var t;return t=n.getAllVexes().map(function(){return e(this).data().vex.id}).toArray(),(null!=t?t.length:void 0)?(e.each(t.reverse(),function(e,t){return n.closeByID(t)}),!0):!1},closeByID:function(o){var i,a,s,r,l;return a=n.getVexByID(o),a.length?(i=a.data().vex.$vex,l=e.extend({},a.data().vex),s=function(){return l.beforeClose?l.beforeClose(a,l):void 0},r=function(){return a.trigger("vexClose",l),i.remove(),e("body").trigger("vexAfterClose",l),l.afterClose?l.afterClose(a,l):void 0},t?(s(),i.unbind(n.animationEndEvent).bind(n.animationEndEvent,function(){return r()}).addClass(n.baseClassNames.closing)):(s(),r()),!0):void 0},closeByEscape:function(){var t,o,i;return i=n.getAllVexes().map(function(){return e(this).data().vex.id}).toArray(),(null!=i?i.length:void 0)?(o=Math.max.apply(Math,i),t=n.getVexByID(o),t.data().vex.escapeButtonCloses!==!0?!1:n.closeByID(o)):!1},setupBodyClassName:function(){return e("body").bind("vexOpen.vex",function(){return e("body").addClass(n.baseClassNames.open)}).bind("vexAfterClose.vex",function(){return n.getAllVexes().length?void 0:e("body").removeClass(n.baseClassNames.open)})},hideLoading:function(){return e(".vex-loading-spinner").remove()},showLoading:function(){return n.hideLoading(),e("body").append('<div class="vex-loading-spinner '+n.defaultOptions.className+'"></div>')}}},"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof exports?module.exports=e(require("jquery")):window.vex=e(jQuery)}.call(void 0),function(){var e;e=function(e,t){var n,o;return null==t?e.error("Vex is required to use vex.dialog"):(n=function(t){var n;return n={},e.each(t.serializeArray(),function(){return n[this.name]?(n[this.name].push||(n[this.name]=[n[this.name]]),n[this.name].push(this.value||"")):n[this.name]=this.value||""}),n},o={},o.buttons={YES:{text:"OK",type:"submit",className:"vex-dialog-button-primary"},NO:{text:"Cancel",type:"button",className:"vex-dialog-button-secondary",click:function(e){return e.data().vex.value=!1,t.close(e.data().vex.id)}}},o.defaultOptions={callback:function(){},afterOpen:function(){},message:"Message",input:'<input name="vex" type="hidden" value="_vex-empty-value" />',value:!1,buttons:[o.buttons.YES,o.buttons.NO],showCloseButton:!1,onSubmit:function(i){var a,s;return a=e(this),s=a.parent(),i.preventDefault(),i.stopPropagation(),s.data().vex.value=o.getFormValueOnSubmit(n(a)),t.close(s.data().vex.id)},focusFirstInput:!0},o.defaultAlertOptions={message:"Alert",buttons:[o.buttons.YES]},o.defaultConfirmOptions={message:"Confirm"},o.open=function(n){var i;return n=e.extend({},t.defaultOptions,o.defaultOptions,n),n.content=o.buildDialogForm(n),n.beforeClose=function(e){return n.callback(e.data().vex.value)},i=t.open(n),n.focusFirstInput&&i.find('button[type="submit"], button[type="button"], input[type="submit"], input[type="button"], textarea, input[type="date"], input[type="datetime"], input[type="datetime-local"], input[type="email"], input[type="month"], input[type="number"], input[type="password"], input[type="search"], input[type="tel"], input[type="text"], input[type="time"], input[type="url"], input[type="week"]').first().focus(),i},o.alert=function(t){return"string"==typeof t&&(t={message:t}),t=e.extend({},o.defaultAlertOptions,t),o.open(t)},o.confirm=function(t){return"string"==typeof t?e.error("dialog.confirm(options) requires options.callback."):(t=e.extend({},o.defaultConfirmOptions,t),o.open(t))},o.prompt=function(t){var n;return"string"==typeof t?e.error("dialog.prompt(options) requires options.callback."):(n={message:'<label for="vex">'+(t.label||"Prompt:")+"</label>",input:'<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="'+(t.placeholder||"")+'"  value="'+(t.value||"")+'" />'},t=e.extend({},n,t),o.open(t))},o.buildDialogForm=function(t){var n,i,a;return n=e('<form class="vex-dialog-form" />'),a=e('<div class="vex-dialog-message" />'),i=e('<div class="vex-dialog-input" />'),n.append(a.append(t.message)).append(i.append(t.input)).append(o.buttonsToDOM(t.buttons)).bind("submit.vex",t.onSubmit),n},o.getFormValueOnSubmit=function(e){return e.vex||""===e.vex?"_vex-empty-value"===e.vex?!0:e.vex:e},o.buttonsToDOM=function(n){var o;return o=e('<div class="vex-dialog-buttons" />'),e.each(n,function(i,a){var s;return s=e('<button type="'+a.type+'"></button>').text(a.text).addClass(a.className+" vex-dialog-button "+(0===i?"vex-first ":"")+(i===n.length-1?"vex-last ":"")).bind("click.vex",function(n){return a.click?a.click(e(this).parents(t.getSelectorFromBaseClass(t.baseClassNames.content)),n):void 0}),s.appendTo(o)}),o},o)},"function"==typeof define&&define.amd?define(["jquery","vex"],e):"object"==typeof exports?module.exports=e(require("jquery"),require("./vex.js")):window.vex.dialog=e(window.jQuery,window.vex)}.call(void 0);var _classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},_createClass=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}(),Utils=function(){function e(){_classCallCheck(this,e)}return _createClass(e,null,[{key:"addToPathName",value:function(e){return divider="/"==window.location.pathname.slice(-1)?"":"/",window.location.pathname+divider+e}}]),e}();$(function(){vex.defaultOptions.className="vex-theme-plain",vex.dialog.buttons.YES.text="OK",vex.dialog.buttons.NO.text="Angre"});