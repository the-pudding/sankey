!function(t){var e={};function n(r){if(e[r])return e[r].exports;var a=e[r]={i:r,l:!1,exports:{}};return t[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)n.d(r,a,function(e){return t[e]}.bind(null,a));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=13)}({0:function(t,e){var n;n=function(){return this}();try{n=n||new Function("return this")()}catch(t){"object"==typeof window&&(n=window)}t.exports=n},13:function(t,e,n){"use strict";n.r(e);var r=n(2),a=n.n(r),i={android:function(){return navigator.userAgent.match(/Android/i)},blackberry:function(){return navigator.userAgent.match(/BlackBerry/i)},ios:function(){return navigator.userAgent.match(/iPhone|iPad|iPod/i)},opera:function(){return navigator.userAgent.match(/Opera Mini/i)},windows:function(){return navigator.userAgent.match(/IEMobile/i)},any:function(){return i.android()||i.blackberry()||i.ios()||i.opera()||i.windows()}},o=i;function c(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var n=[],r=!0,a=!1,i=void 0;try{for(var o,c=t[Symbol.iterator]();!(r=(o=c.next()).done)&&(n.push(o.value),!e||n.length!==e);r=!0);}catch(t){a=!0,i=t}finally{try{r||null==c.return||c.return()}finally{if(a)throw i}}return n}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}function u(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{},r=Object.keys(n);"function"==typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(t){return Object.getOwnPropertyDescriptor(n,t).enumerable}))),r.forEach(function(e){l(t,e,n[e])})}return t}function l(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}var s=d3.select("#graphic"),f=s.select(".graphic__result"),d=f.select("figure").select("svg").select("g"),v=s.select("input"),p=0,y=0,g=[{name:"gillenhall",count:5},{name:"gylenhal",count:9},{name:"gylenhaal",count:8},{name:"gylenhall",count:18},{name:"gyllenhal",count:41},{name:"gyllenhall",count:41},{name:"gyllenhaal",count:29}];function h(t){var e=t.data,n=t.correct,r=t.index,a=void 0===r?0:r,i=e.map(function(t){return u({},t,{char:t.name.charAt(a)})}),o=d3.nest().key(function(t){return t.char}).entries(i).filter(function(t){return t.key}).map(function(t){return u({},t,{id:"".concat(a,"-").concat(t.key),index:a,correct:t.values.map(function(t){return t.name}).includes(n),value:d3.sum(t.values,function(t){return t.count}),values:h({data:t.values,correct:n,index:a+1})})});return o.length?o:null}function m(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=30,n=30,r=30,a=30;p=48*t-a-n,y=320-e-r,f.selectAll("svg").attr("width",p+a+n).attr("height",y+e+r),f.selectAll("g").attr("transform","translate(".concat(a,", ").concat(e,")"))}function b(t){var e=t.treeData,n=t.spellings,r=t.user,a=d3.max(n,function(t){return t.name.length}),i=r.length;m(a);var o=d3.tree().size([y,p]),c=d3.hierarchy(e,function(t){return t.values});c.descendants().forEach(function(t){t.sort(function(t,e){return d3.descending(t.data.correct,e.data.correct)})});var u=o(c),l=d3.max(u.descendants(),function(t){return t.value}),s=d3.scaleLinear().domain([0,l]).range([2,30]);d.selectAll(".link").data(u.descendants().slice(1),function(t){return t.data.id}).join("path").attr("class","link").attr("stroke-width",function(t){return s(t.value)}).attr("d",function(t){var e=t.x;return"M".concat(t.y,",").concat(e,"C").concat((t.y+t.parent.y)/2,",").concat(e," ").concat((t.y+t.parent.y)/2,", ").concat(t.parent.x," ").concat(t.parent.y,",").concat(t.parent.x)}).classed("is-hidden",function(t){return t.depth>=i});d.selectAll(".node").data(u.descendants(),function(t){return t.data.id}).join(function(t){var e=t.append("g").attr("class",function(t){return"node node--".concat(t.values?"internal":"leaf")});return e.append("text").classed("text--bg",!0).attr("alignment-baseline","middle"),e.append("text").classed("text--fg",!0).attr("alignment-baseline","middle"),e}).attr("transform",function(t){return"translate(".concat(t.y,", ").concat(t.x,")")}).classed("is-correct",function(t){return t.data.correct}).classed("is-hidden",function(t){return t.depth>=i}).selectAll("text").text(function(t){return t.data.key})}function x(){var t=this.value.toLowerCase();if(t.length){var e=g.map(function(t){return u({},t)}),n=e.find(function(e){return e.name===t});n?n.count+=1:e.push({name:t,count:1}),b({treeData:c(h({data:e,correct:"gyllenhaal"}),1)[0],spellings:e,user:t})}else{this.value="g",b({treeData:c(h({data:g,correct:"gyllenhaal"}),1)[0],spellings:g,user:t})}}var j={init:function(){m(),b({treeData:c(h({data:g,correct:"gyllenhaal"}),1)[0],spellings:g,user:"Gyllenhaal"}),v.on("keyup",x)},resize:m},w=d3.select("body"),O=0;function k(){var t=w.node().offsetWidth;O!==t&&(O=t,j.resize())}w.classed("is-mobile",o.any()),window.addEventListener("resize",a()(k,150)),function(){if(w.select("header").classed("is-sticky")){var t=w.select(".header__menu"),e=w.select(".header__toggle");e.on("click",function(){var n=t.classed("is-visible");t.classed("is-visible",!n),e.classed("is-visible",!n)})}}(),j.init()},2:function(t,e,n){(function(e){var n="Expected a function",r=NaN,a="[object Symbol]",i=/^\s+|\s+$/g,o=/^[-+]0x[0-9a-f]+$/i,c=/^0b[01]+$/i,u=/^0o[0-7]+$/i,l=parseInt,s="object"==typeof e&&e&&e.Object===Object&&e,f="object"==typeof self&&self&&self.Object===Object&&self,d=s||f||Function("return this")(),v=Object.prototype.toString,p=Math.max,y=Math.min,g=function(){return d.Date.now()};function h(t){var e=typeof t;return!!t&&("object"==e||"function"==e)}function m(t){if("number"==typeof t)return t;if(function(t){return"symbol"==typeof t||function(t){return!!t&&"object"==typeof t}(t)&&v.call(t)==a}(t))return r;if(h(t)){var e="function"==typeof t.valueOf?t.valueOf():t;t=h(e)?e+"":e}if("string"!=typeof t)return 0===t?t:+t;t=t.replace(i,"");var n=c.test(t);return n||u.test(t)?l(t.slice(2),n?2:8):o.test(t)?r:+t}t.exports=function(t,e,r){var a,i,o,c,u,l,s=0,f=!1,d=!1,v=!0;if("function"!=typeof t)throw new TypeError(n);function b(e){var n=a,r=i;return a=i=void 0,s=e,c=t.apply(r,n)}function x(t){var n=t-l;return void 0===l||n>=e||n<0||d&&t-s>=o}function j(){var t=g();if(x(t))return w(t);u=setTimeout(j,function(t){var n=e-(t-l);return d?y(n,o-(t-s)):n}(t))}function w(t){return u=void 0,v&&a?b(t):(a=i=void 0,c)}function O(){var t=g(),n=x(t);if(a=arguments,i=this,l=t,n){if(void 0===u)return function(t){return s=t,u=setTimeout(j,e),f?b(t):c}(l);if(d)return u=setTimeout(j,e),b(l)}return void 0===u&&(u=setTimeout(j,e)),c}return e=m(e)||0,h(r)&&(f=!!r.leading,o=(d="maxWait"in r)?p(m(r.maxWait)||0,e):o,v="trailing"in r?!!r.trailing:v),O.cancel=function(){void 0!==u&&clearTimeout(u),s=0,a=l=i=u=void 0},O.flush=function(){return void 0===u?c:w(g())},O}}).call(this,n(0))}});