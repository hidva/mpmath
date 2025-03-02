MathJax = {
        tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                processEscapes: true
        },
        svg: {
                // 非常重要, 不能使用 global! 否则将生成包含 <use data-c="1D457" xlink:href="#MJX-TEX-I-1D457"></use>
                // 类似 svg, 而这种内容展示是空白!
                // 在这个页面中 https://developers.weixin.qq.com/community/develop/doc/0004eacae04e884a5af23b2496bc00?jumpto=comment&commentid=000244ddd747202669f247bec668
                // 社区提到微信公众号的文章中的公式可以复制. 但我 blog.hidva.com 的公式则无法复制!
                // 原因也是这个, hidva.com fontCache 配置为 global...
                fontCache: 'none'
        }
};

function formula2Svg(latexText, options) {
        MathJax.texReset();
        var latxnode = MathJax.tex2svg(latexText, options);
        MathJax.startup.document.clear();
        MathJax.startup.document.updateDocument();
        return latxnode;
}

window.addEventListener('message', function (event) {
        if (!event.data.type || !event.data.reqid) {
                console.log("hidva.com: unknown event", event);
                return;
        }
        var reqid = event.data.reqid;
        if (event.data.type == 'convert') {
                console.log("hidva.com: receive convert", event);
                var latex_node = formula2Svg(event.data.latex_input, event.data.options);
                event.source.postMessage({
                        reqid: reqid,
                        type: 'convert',
                        resp: latex_node.outerHTML
                }, '*');
                return;
        }
        console.log("hidva.com: unknown event", event);
        return;
});