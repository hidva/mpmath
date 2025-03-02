// 返回 container 第一个公式 range, inline .
// range 指定了公式范围, inline = true 则意味着公式是 inline 的
function findFormula(container) {
    var nodeIterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT);

    var currentNode;
    // 公式可能会跨越多个 node.
    var startNode = null;
    var startOffset = -1;
    var inline = false;
    while ((currentNode = nodeIterator.nextNode())) {
        var searchStart = 0;
        while (searchStart < currentNode.nodeValue.length) {
            if (startNode == null) {
                var dollarIndex = currentNode.nodeValue.indexOf('$', searchStart);
                if (dollarIndex == -1) {
                    searchStart = currentNode.nodeValue.length;
                    continue;
                }
                if (dollarIndex > 0 && currentNode.nodeValue.charAt(dollarIndex - 1) == '\\') {
                    // \$ 表示对 $ 的转义, 此时 $ 并不是表示公式的开始.
                    searchStart = dollarIndex + 1;
                    continue;
                }
                startNode = currentNode
                startOffset = dollarIndex;
                if (dollarIndex + 1 < currentNode.nodeValue.length && currentNode.nodeValue.charAt(dollarIndex + 1) == '$') {
                    // 行间公式
                    inline = false;
                    searchStart = dollarIndex + 2;
                } else {
                    inline = true;
                    searchStart = dollarIndex + 1;
                }
                continue;
            }
            var dollarIndex = currentNode.nodeValue.indexOf('$', searchStart);
            if (dollarIndex == -1) {
                searchStart = currentNode.nodeValue.length;
                continue;
            }
            if (dollarIndex > 0 && currentNode.nodeValue.charAt(dollarIndex - 1) == '\\') {
                // \$ 表示对 $ 的转义, 此时 $ 并不是表示公式的结束.
                searchStart = dollarIndex + 1;
                continue;
            }
            var endNode = currentNode
            var endOffset = dollarIndex;
            if (dollarIndex + 1 < currentNode.nodeValue.length && currentNode.nodeValue.charAt(dollarIndex + 1) == '$') {
                endOffset = dollarIndex + 1;
                searchStart = dollarIndex + 2;
            } else {
                searchStart = dollarIndex + 1;
            }
            var range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset + 1); // + 1 是开区间.
            return {
                range: range,
                inline: inline
            };
        }
    };
    return null;
}

function getFormulaTxt(formula) {
    var text = formula.range.toString();
    if (formula.inline) {
        return text.substring(1, text.length - 1);
    } else {
        return text.substring(2, text.length - 2);
    }
}

function mergeNode(firstP, secondP) {
    for (var node of secondP.childNodes) {
        firstP.appendChild(node);
    }
    secondP.remove();
}

function getMathOutputNode() {
    var pmDiv = document.querySelector('.ProseMirror');
    return pmDiv;
}

// key: reqid, value: (resolve, reject)
var pendingRpcRequests = {};

function formula2SvgPromise(latexText, display) {
    let reqid = 'req_' + Math.random().toString(36);
    let { promise, resolve, reject } = Promise.withResolvers();
    pendingRpcRequests[reqid] = { resolve, reject };

    var outputNode = getMathOutputNode();
    let options = MathJax.getMetricsFor(outputNode);
    options.display = display;
    srvframe = document.getElementById('hidva_com_mathjax_server');
    srvframe.contentWindow.postMessage({
        reqid: reqid,
        type: 'convert',
        latex_input: latexText,
        options: options
    }, '*');
    return promise;
}

window.addEventListener('message', function (event) {
    if (!event.data.type || !event.data.reqid || !event.data.resp || event.data.type != 'convert') {
        console.log("hidva.com: unknown event", event);
        return;
    }
    console.log("hidva.com: rece convert resp: ", event.data);
    pendingRpcRequests[event.data.reqid].resolve(event.data.resp);
    delete pendingRpcRequests[event.data.reqid];
});

function svg2outHTML(latexNode, latexText, display) {
    if (display) {
        latexNode.style = 'overflow-x:auto; outline:0; display:block; text-align: center; margin: 15px 0px;';
        latexNode.setAttribute('display', true);
        latexNode.childNodes[0].style = 'height:auto; max-width:300% !important;'
    }
    latexNode.setAttribute('data-formula', latexText);
    let sp = latexNode;
    sp.innerHTML = sp.innerHTML.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
    return sp;
}

// 定义一个递归函数来处理每个公式
function doProcessFormula(body) {
    var formula = findFormula(body);
    if (!formula) {
        // 没有更多的公式需要处理
        return Promise.resolve(); // 返回一个解决的Promise
    }

    var latexText = getFormulaTxt(formula).trim();
    console.log("转化", latexText);

    // 发送消息到扩展，并等待响应
    return formula2SvgPromise(latexText, !formula.inline).then(response => {
        // 收到响应后，使用响应结果
        let parser = new DOMParser();
        let doc = parser.parseFromString(response, 'text/html');
        let latexNode = doc.body.firstChild;
        let outputNode = svg2outHTML(latexNode, latexText, !formula.inline);

        if (formula.inline && formula.range.startContainer != formula.range.endContainer) {
            // 我们在这里处理如下情况, 即 `$` 跨越了多个元素.
            // <p>明显 $</p>
            // <p>|I| = |I_1| + |I_2| + |I_3|</p>
            // <p>$. <svg></svg></p>
            // 如果不做任何处理, 则输出结果丑了一点.
            let startTextNode = formula.range.startContainer;  // 一定是 text.
            let endTextNode = formula.range.endContainer;  // 这也是个 text node.
            let startNode = startTextNode.parentNode;
            let endNode = endTextNode.parentNode;
            formula.range.deleteContents();
            startNode.appendChild(outputNode);
            mergeNode(startNode, endNode);
        } else {
            formula.range.deleteContents();
            formula.range.insertNode(outputNode);
        }
    }).then(() => {
        // 递归处理下一个公式
        return doProcessFormula(body);
    });
}

function processFormula(content) {
    let div_content = '<div>' + content + '</div>';
    let parser = new DOMParser();
    let doc = parser.parseFromString(div_content, 'text/html');
    let divNode = doc.body.firstChild;
    doProcessFormula(divNode).then(() => {
        window.__MP_Editor_JSAPI__.invoke({
            apiName: 'mp_editor_set_content',
            apiParam: {
                content: divNode.outerHTML
            },
            sucCb: (res) => {console.log('hidva.com: processFormula success', res)},
            errCb: (err) => {console.log('hidva.com: processFormula failed', err)}
        });
    });
}

function HidvaMpMathGo() {
    window.__MP_Editor_JSAPI__.invoke({
        apiName: 'mp_editor_get_content',
        sucCb: (res) => {processFormula(res.content)},
        errCb: (err) => {console.log('mp_editor_get_content failed', err)}
    })
}