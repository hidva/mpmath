

setTimeout(function () {
    let script_inject = document.createElement('script');
    script_inject.src = chrome.runtime.getURL('client/mpm-inject.js');
    script_inject.onload = function () {
        console.log("hidva.com: load mpm-inject.js");
    }
    document.documentElement.appendChild(script_inject);
}, 1000);

setTimeout(function () {
    // 好像一定要先 load mpm-inject 之后再 load mathjax,
    // 这样 mpm inject 中定义的 MathJax 对 mathjax 才可见
    var script = document.createElement('script');
    script.id = 'MathJax-script';
    script.async = true;
    script.src = chrome.runtime.getURL('assets/js/tex-svg-full.js');
    script.onload = function () {
        console.log("hidva.com: load tex-svg-full.js");
    }
    document.head.appendChild(script);
}, 3000);


setTimeout(function () {
    let iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('server/mathjax.html');
    iframe.setAttribute('class', 'mpm-modal');
    iframe.frameBorder = 0;
    iframe.allowTransparency = true;
    iframe.id = 'hidva_com_mathjax_server';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    console.log("hidva.com: inject mathjax.html");
}, 100);
