(function (a) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], a)
    } else {
        a((typeof (jQuery) != 'undefined') ? jQuery : window.Zepto)
    }
}(function ($) {
    "use strict";
    var P = {};
    P.fileapi = $("<input type='file'/>").get(0).files !== undefined;
    P.formdata = window.FormData !== undefined;
    var Q = !!$.fn.prop;
    $.fn.attr2 = function () {
        if (!Q) {
            return this.attr.apply(this, arguments)
        }
        var a = this.prop.apply(this, arguments);
        if ((a && a.jquery) || typeof a === 'string') {
            return a
        }
        return this.attr.apply(this, arguments)
    };
    $.fn.ajaxSubmit = function (y) {
        if (!this.length) {
            log('ajaxSubmit: skipping submit process - no element selected');
            return this
        }
        var z, action, url, $form = this;
        if (typeof y == 'function') {
            y = {success: y}
        } else if (y === undefined) {
            y = {}
        }
        z = y.type || this.attr2('method');
        action = y.url || this.attr2('action');
        url = (typeof action === 'string') ? $.trim(action) : '';
        url = url || window.location.href || '';
        if (url) {
            url = (url.match(/^([^#]+)/) || [])[1]
        }
        y = $.extend(true, {
            url: url,
            success: $.ajaxSettings.success,
            type: z || $.ajaxSettings.type,
            iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
        }, y);
        var A = {};
        this.trigger('form-pre-serialize', [this, y, A]);
        if (A.veto) {
            log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
            return this
        }
        if (y.beforeSerialize && y.beforeSerialize(this, y) === false) {
            log('ajaxSubmit: submit aborted via beforeSerialize callback');
            return this
        }
        var B = y.traditional;
        if (B === undefined) {
            B = $.ajaxSettings.traditional
        }
        var C = [];
        var D, a = this.formToArray(y.semantic, C);
        if (y.data) {
            y.extraData = y.data;
            D = $.param(y.data, B)
        }
        if (y.beforeSubmit && y.beforeSubmit(a, this, y) === false) {
            log('ajaxSubmit: submit aborted via beforeSubmit callback');
            return this
        }
        this.trigger('form-submit-validate', [a, this, y, A]);
        if (A.veto) {
            log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
            return this
        }
        var q = $.param(a, B);
        if (D) {
            q = (q ? (q + '&' + D) : D)
        }
        if (y.type.toUpperCase() == 'GET') {
            y.url += (y.url.indexOf('?') >= 0 ? '&' : '?') + q;
            y.data = null
        } else {
            y.data = q
        }
        var E = [];
        if (y.resetForm) {
            E.push(function () {
                $form.resetForm()
            })
        }
        if (y.clearForm) {
            E.push(function () {
                $form.clearForm(y.includeHidden)
            })
        }
        if (!y.dataType && y.target) {
            var F = y.success || function () {
            };
            E.push(function (a) {
                var b = y.replaceTarget ? 'replaceWith' : 'html';
                $(y.target)[b](a).each(F, arguments)
            })
        } else if (y.success) {
            E.push(y.success)
        }
        y.success = function (a, b, c) {
            var d = y.context || this;
            for (var i = 0, max = E.length; i < max; i++) {
                E[i].apply(d, [a, b, c || $form, $form])
            }
        };
        if (y.error) {
            var G = y.error;
            y.error = function (a, b, c) {
                var d = y.context || this;
                G.apply(d, [a, b, c, $form])
            }
        }
        if (y.complete) {
            var H = y.complete;
            y.complete = function (a, b) {
                var c = y.context || this;
                H.apply(c, [a, b, $form])
            }
        }
        var I = $('input[type=file]:enabled', this).filter(function () {
            return $(this).val() !== ''
        });
        var J = I.length > 0;
        var K = 'multipart/form-data';
        var L = ($form.attr('enctype') == K || $form.attr('encoding') == K);
        var M = P.fileapi && P.formdata;
        log("fileAPI :" + M);
        var N = (J || L) && !M;
        var O;
        if (y.iframe !== false && (y.iframe || N)) {
            if (y.closeKeepAlive) {
                $.get(y.closeKeepAlive, function () {
                    O = fileUploadIframe(a)
                })
            } else {
                O = fileUploadIframe(a)
            }
        } else if ((J || L) && M) {
            O = fileUploadXhr(a)
        } else {
            O = $.ajax(y)
        }
        $form.removeData('jqxhr').data('jqxhr', O);
        for (var k = 0; k < C.length; k++) {
            C[k] = null
        }
        this.trigger('form-submit-notify', [this, y]);
        return this;

        function deepSerialize(a) {
            var b = $.param(a, y.traditional).split('&');
            var c = b.length;
            var d = [];
            var i, part;
            for (i = 0; i < c; i++) {
                b[i] = b[i].replace(/\+/g, ' ');
                part = b[i].split('=');
                d.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])])
            }
            return d
        }

        function fileUploadXhr(a) {
            var f = new FormData();
            for (var i = 0; i < a.length; i++) {
                f.append(a[i].name, a[i].value)
            }
            if (y.extraData) {
                var g = deepSerialize(y.extraData);
                for (i = 0; i < g.length; i++) {
                    if (g[i]) {
                        f.append(g[i][0], g[i][1])
                    }
                }
            }
            y.data = null;
            var s = $.extend(true, {}, $.ajaxSettings, y, {
                contentType: false,
                processData: false,
                cache: false,
                type: z || 'POST'
            });
            if (y.uploadProgress) {
                s.xhr = function () {
                    var e = $.ajaxSettings.xhr();
                    if (e.upload) {
                        e.upload.addEventListener('progress', function (a) {
                            var b = 0;
                            var c = a.loaded || a.position;
                            var d = a.total;
                            if (a.lengthComputable) {
                                b = Math.ceil(c / d * 100)
                            }
                            y.uploadProgress(a, c, d, b)
                        }, false)
                    }
                    return e
                }
            }
            s.data = null;
            var h = s.beforeSend;
            s.beforeSend = function (a, o) {
                if (y.formData) {
                    o.data = y.formData
                } else {
                    o.data = f
                }
                if (h) {
                    h.call(this, a, o)
                }
            };
            return $.ajax(s)
        }

        function fileUploadIframe(a) {
            var l = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
            var m = $.Deferred();
            m.abort = function (a) {
                xhr.abort(a)
            };
            if (a) {
                for (i = 0; i < C.length; i++) {
                    el = $(C[i]);
                    if (Q) {
                        el.prop('disabled', false)
                    } else {
                        el.removeAttr('disabled')
                    }
                }
            }
            s = $.extend(true, {}, $.ajaxSettings, y);
            s.context = s.context || s;
            id = 'jqFormIO' + (new Date().getTime());
            if (s.iframeTarget) {
                $io = $(s.iframeTarget);
                n = $io.attr2('name');
                if (!n) {
                    $io.attr2('name', id)
                } else {
                    id = n
                }
            } else {
                $io = $('<iframe name="' + id + '" src="' + s.iframeSrc + '" />');
                $io.css({position: 'absolute', top: '-1000px', left: '-1000px'})
            }
            io = $io[0];
            xhr = {
                aborted: 0,
                responseText: null,
                responseXML: null,
                status: 0,
                statusText: 'n/a',
                getAllResponseHeaders: function () {
                },
                getResponseHeader: function () {
                },
                setRequestHeader: function () {
                },
                abort: function (a) {
                    var e = (a === 'timeout' ? 'timeout' : 'aborted');
                    log('aborting upload... ' + e);
                    this.aborted = 1;
                    try {
                        if (io.contentWindow.document.execCommand) {
                            io.contentWindow.document.execCommand('Stop')
                        }
                    } catch (ignore) {
                    }
                    $io.attr('src', s.iframeSrc);
                    xhr.error = e;
                    if (s.error) {
                        s.error.call(s.context, xhr, e, a)
                    }
                    if (g) {
                        $.event.trigger("ajaxError", [xhr, s, e])
                    }
                    if (s.complete) {
                        s.complete.call(s.context, xhr, e)
                    }
                }
            };
            g = s.global;
            if (g && 0 === $.active++) {
                $.event.trigger("ajaxStart")
            }
            if (g) {
                $.event.trigger("ajaxSend", [xhr, s])
            }
            if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
                if (s.global) {
                    $.active--
                }
                m.reject();
                return m
            }
            if (xhr.aborted) {
                m.reject();
                return m
            }
            sub = l.clk;
            if (sub) {
                n = sub.name;
                if (n && !sub.disabled) {
                    s.extraData = s.extraData || {};
                    s.extraData[n] = sub.value;
                    if (sub.type == "image") {
                        s.extraData[n + '.x'] = l.clk_x;
                        s.extraData[n + '.y'] = l.clk_y
                    }
                }
            }
            var o = 1;
            var p = 2;

            function getDoc(a) {
                var b = null;
                try {
                    if (a.contentWindow) {
                        b = a.contentWindow.document
                    }
                } catch (err) {
                    log('cannot get iframe.contentWindow document: ' + err)
                }
                if (b) {
                    return b
                }
                try {
                    b = a.contentDocument ? a.contentDocument : a.document
                } catch (err) {
                    log('cannot get iframe.contentDocument: ' + err);
                    b = a.document
                }
                return b
            }

            var q = $('meta[name=csrf-token]').attr('content');
            var r = $('meta[name=csrf-param]').attr('content');
            if (r && q) {
                s.extraData = s.extraData || {};
                s.extraData[r] = q
            }

            function doSubmit() {
                var t = $form.attr2('target'), a = $form.attr2('action'), K = 'multipart/form-data',
                    et = $form.attr('enctype') || $form.attr('encoding') || K;
                l.setAttribute('target', id);
                if (!z || /post/i.test(z)) {
                    l.setAttribute('method', 'POST')
                }
                if (a != s.url) {
                    l.setAttribute('action', s.url)
                }
                if (!s.skipEncodingOverride && (!z || /post/i.test(z))) {
                    $form.attr({encoding: 'multipart/form-data', enctype: 'multipart/form-data'})
                }
                if (s.timeout) {
                    timeoutHandle = setTimeout(function () {
                        timedOut = true;
                        cb(o)
                    }, s.timeout)
                }

                function checkState() {
                    try {
                        var a = getDoc(io).readyState;
                        log('state = ' + a);
                        if (a && a.toLowerCase() == 'uninitialized') {
                            setTimeout(checkState, 50)
                        }
                    } catch (e) {
                        log('Server abort: ', e, ' (', e.name, ')');
                        cb(p);
                        if (timeoutHandle) {
                            clearTimeout(timeoutHandle)
                        }
                        timeoutHandle = undefined
                    }
                }

                var b = [];
                try {
                    if (s.extraData) {
                        for (var n in s.extraData) {
                            if (s.extraData.hasOwnProperty(n)) {
                                if ($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                                    b.push($('<input type="hidden" name="' + s.extraData[n].name + '">').val(s.extraData[n].value).appendTo(l)[0])
                                } else {
                                    b.push($('<input type="hidden" name="' + n + '">').val(s.extraData[n]).appendTo(l)[0])
                                }
                            }
                        }
                    }
                    if (!s.iframeTarget) {
                        $io.appendTo('body')
                    }
                    if (io.attachEvent) {
                        io.attachEvent('onload', cb)
                    } else {
                        io.addEventListener('load', cb, false)
                    }
                    setTimeout(checkState, 15);
                    try {
                        l.submit()
                    } catch (err) {
                        var c = document.createElement('form').submit;
                        c.apply(l)
                    }
                } finally {
                    l.setAttribute('action', a);
                    l.setAttribute('enctype', et);
                    if (t) {
                        l.setAttribute('target', t)
                    } else {
                        $form.removeAttr('target')
                    }
                    $(b).remove()
                }
            }

            if (s.forceSync) {
                doSubmit()
            } else {
                setTimeout(doSubmit, 10)
            }
            var u, doc, domCheckCount = 50, callbackProcessed;

            function cb(e) {
                if (xhr.aborted || callbackProcessed) {
                    return
                }
                doc = getDoc(io);
                if (!doc) {
                    log('cannot access response document');
                    e = p
                }
                if (e === o && xhr) {
                    xhr.abort('timeout');
                    m.reject(xhr, 'timeout');
                    return
                } else if (e == p && xhr) {
                    xhr.abort('server abort');
                    m.reject(xhr, 'error', 'server abort');
                    return
                }
                if (!doc || doc.location.href == s.iframeSrc) {
                    if (!timedOut) {
                        return
                    }
                }
                if (io.detachEvent) {
                    io.detachEvent('onload', cb)
                } else {
                    io.removeEventListener('load', cb, false)
                }
                var c = 'success', errMsg;
                try {
                    if (timedOut) {
                        throw'timeout';
                    }
                    var d = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                    log('isXml=' + d);
                    if (!d && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                        if (--domCheckCount) {
                            log('requeing onLoad callback, DOM not available');
                            setTimeout(cb, 250);
                            return
                        }
                    }
                    var f = doc.body ? doc.body : doc.documentElement;
                    xhr.responseText = f ? f.innerHTML : null;
                    xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                    if (d) {
                        s.dataType = 'xml'
                    }
                    xhr.getResponseHeader = function (a) {
                        var b = {'content-type': s.dataType};
                        return b[a.toLowerCase()]
                    };
                    if (f) {
                        xhr.status = Number(f.getAttribute('status')) || xhr.status;
                        xhr.statusText = f.getAttribute('statusText') || xhr.statusText
                    }
                    var h = (s.dataType || '').toLowerCase();
                    var i = /(json|script|text)/.test(h);
                    if (i || s.textarea) {
                        var j = doc.getElementsByTagName('textarea')[0];
                        if (j) {
                            xhr.responseText = j.value;
                            xhr.status = Number(j.getAttribute('status')) || xhr.status;
                            xhr.statusText = j.getAttribute('statusText') || xhr.statusText
                        } else if (i) {
                            var k = doc.getElementsByTagName('pre')[0];
                            var b = doc.getElementsByTagName('body')[0];
                            if (k) {
                                xhr.responseText = k.textContent ? k.textContent : k.innerText
                            } else if (b) {
                                xhr.responseText = b.textContent ? b.textContent : b.innerText
                            }
                        }
                    } else if (h == 'xml' && !xhr.responseXML && xhr.responseText) {
                        xhr.responseXML = v(xhr.responseText)
                    }
                    try {
                        u = x(xhr, h, s)
                    } catch (err) {
                        c = 'parsererror';
                        xhr.error = errMsg = (err || c)
                    }
                } catch (err) {
                    log('error caught: ', err);
                    c = 'error';
                    xhr.error = errMsg = (err || c)
                }
                if (xhr.aborted) {
                    log('upload aborted');
                    c = null
                }
                if (xhr.status) {
                    c = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error'
                }
                if (c === 'success') {
                    if (s.success) {
                        s.success.call(s.context, u, 'success', xhr)
                    }
                    m.resolve(xhr.responseText, 'success', xhr);
                    if (g) {
                        $.event.trigger("ajaxSuccess", [xhr, s])
                    }
                } else if (c) {
                    if (errMsg === undefined) {
                        errMsg = xhr.statusText
                    }
                    if (s.error) {
                        s.error.call(s.context, xhr, c, errMsg)
                    }
                    m.reject(xhr, 'error', errMsg);
                    if (g) {
                        $.event.trigger("ajaxError", [xhr, s, errMsg])
                    }
                }
                if (g) {
                    $.event.trigger("ajaxComplete", [xhr, s])
                }
                if (g && !--$.active) {
                    $.event.trigger("ajaxStop")
                }
                if (s.complete) {
                    s.complete.call(s.context, xhr, c)
                }
                callbackProcessed = true;
                if (s.timeout) {
                    clearTimeout(timeoutHandle)
                }
                setTimeout(function () {
                    if (!s.iframeTarget) {
                        $io.remove()
                    } else {
                        $io.attr('src', s.iframeSrc)
                    }
                    xhr.responseXML = null
                }, 100)
            }

            var v = $.parseXML || function (s, a) {
                if (window.ActiveXObject) {
                    a = new ActiveXObject('Microsoft.XMLDOM');
                    a.async = 'false';
                    a.loadXML(s)
                } else {
                    a = (new DOMParser()).parseFromString(s, 'text/xml')
                }
                return (a && a.documentElement && a.documentElement.nodeName != 'parsererror') ? a : null
            };
            var w = $.parseJSON || function (s) {
                return window['eval']('(' + s + ')')
            };
            var x = function (a, b, s) {
                var c = a.getResponseHeader('content-type') || '', xml = b === 'xml' || !b && c.indexOf('xml') >= 0,
                    u = xml ? a.responseXML : a.responseText;
                if (xml && u.documentElement.nodeName === 'parsererror') {
                    if ($.error) {
                        $.error('parsererror')
                    }
                }
                if (s && s.dataFilter) {
                    u = s.dataFilter(u, b)
                }
                if (typeof u === 'string') {
                    if (b === 'json' || !b && c.indexOf('json') >= 0) {
                        u = w(u)
                    } else if (b === "script" || !b && c.indexOf("javascript") >= 0) {
                        $.globalEval(u)
                    }
                }
                return u
            };
            return m
        }
    };
    $.fn.ajaxForm = function (a) {
        a = a || {};
        a.delegation = a.delegation && $.isFunction($.fn.on);
        if (!a.delegation && this.length === 0) {
            var o = {s: this.selector, c: this.context};
            if (!$.isReady && o.s) {
                log('DOM not ready, queuing ajaxForm');
                $(function () {
                    $(o.s, o.c).ajaxForm(a)
                });
                return this
            }
            log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
            return this
        }
        if (a.delegation) {
            $(document).off('submit.form-plugin', this.selector, doAjaxSubmit).off('click.form-plugin', this.selector, captureSubmittingElement).on('submit.form-plugin', this.selector, a, doAjaxSubmit).on('click.form-plugin', this.selector, a, captureSubmittingElement);
            return this
        }
        return this.ajaxFormUnbind().bind('submit.form-plugin', a, doAjaxSubmit).bind('click.form-plugin', a, captureSubmittingElement)
    };

    function doAjaxSubmit(e) {
        var a = e.data;
        if (!e.isDefaultPrevented()) {
            e.preventDefault();
            $(e.target).ajaxSubmit(a)
        }
    }

    function captureSubmittingElement(e) {
        var a = e.target;
        var b = $(a);
        if (!(b.is("[type=submit],[type=image]"))) {
            var t = b.closest('[type=submit]');
            if (t.length === 0) {
                return
            }
            a = t[0]
        }
        var c = this;
        c.clk = a;
        if (a.type == 'image') {
            if (e.offsetX !== undefined) {
                c.clk_x = e.offsetX;
                c.clk_y = e.offsetY
            } else if (typeof $.fn.offset == 'function') {
                var d = b.offset();
                c.clk_x = e.pageX - d.left;
                c.clk_y = e.pageY - d.top
            } else {
                c.clk_x = e.pageX - a.offsetLeft;
                c.clk_y = e.pageY - a.offsetTop
            }
        }
        setTimeout(function () {
            c.clk = c.clk_x = c.clk_y = null
        }, 100)
    }

    $.fn.ajaxFormUnbind = function () {
        return this.unbind('submit.form-plugin click.form-plugin')
    };
    $.fn.formToArray = function (b, c) {
        var a = [];
        if (this.length === 0) {
            return a
        }
        var d = this[0];
        var e = this.attr('id');
        var f = b ? d.getElementsByTagName('*') : d.elements;
        var g;
        if (f && !/MSIE [678]/.test(navigator.userAgent)) {
            f = $(f).get()
        }
        if (e) {
            g = $(':input[form=' + e + ']').get();
            if (g.length) {
                f = (f || []).concat(g)
            }
        }
        if (!f || !f.length) {
            return a
        }
        var i, j, n, v, el, max, jmax;
        for (i = 0, max = f.length; i < max; i++) {
            el = f[i];
            n = el.name;
            if (!n || el.disabled) {
                continue
            }
            if (b && d.clk && el.type == "image") {
                if (d.clk == el) {
                    a.push({name: n, value: $(el).val(), type: el.type});
                    a.push({name: n + '.x', value: d.clk_x}, {name: n + '.y', value: d.clk_y})
                }
                continue
            }
            v = $.fieldValue(el, true);
            if (v && v.constructor == Array) {
                if (c) {
                    c.push(el)
                }
                for (j = 0, jmax = v.length; j < jmax; j++) {
                    a.push({name: n, value: v[j]})
                }
            } else if (P.fileapi && el.type == 'file') {
                if (c) {
                    c.push(el)
                }
                var h = el.files;
                if (h.length) {
                    for (j = 0; j < h.length; j++) {
                        a.push({name: n, value: h[j], type: el.type})
                    }
                } else {
                    a.push({name: n, value: '', type: el.type})
                }
            } else if (v !== null && typeof v != 'undefined') {
                if (c) {
                    c.push(el)
                }
                a.push({name: n, value: v, type: el.type, required: el.required})
            }
        }
        if (!b && d.clk) {
            var k = $(d.clk), input = k[0];
            n = input.name;
            if (n && !input.disabled && input.type == 'image') {
                a.push({name: n, value: k.val()});
                a.push({name: n + '.x', value: d.clk_x}, {name: n + '.y', value: d.clk_y})
            }
        }
        return a
    };
    $.fn.formSerialize = function (a) {
        return $.param(this.formToArray(a))
    };
    $.fn.fieldSerialize = function (b) {
        var a = [];
        this.each(function () {
            var n = this.name;
            if (!n) {
                return
            }
            var v = $.fieldValue(this, b);
            if (v && v.constructor == Array) {
                for (var i = 0, max = v.length; i < max; i++) {
                    a.push({name: n, value: v[i]})
                }
            } else if (v !== null && typeof v != 'undefined') {
                a.push({name: this.name, value: v})
            }
        });
        return $.param(a)
    };
    $.fn.fieldValue = function (a) {
        for (var b = [], i = 0, max = this.length; i < max; i++) {
            var c = this[i];
            var v = $.fieldValue(c, a);
            if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
                continue
            }
            if (v.constructor == Array) {
                $.merge(b, v)
            } else {
                b.push(v)
            }
        }
        return b
    };
    $.fieldValue = function (b, c) {
        var n = b.name, t = b.type, tag = b.tagName.toLowerCase();
        if (c === undefined) {
            c = true
        }
        if (c && (!n || b.disabled || t == 'reset' || t == 'button' || (t == 'checkbox' || t == 'radio') && !b.checked || (t == 'submit' || t == 'image') && b.form && b.form.clk != b || tag == 'select' && b.selectedIndex == -1)) {
            return null
        }
        if (tag == 'select') {
            var d = b.selectedIndex;
            if (d < 0) {
                return null
            }
            var a = [], ops = b.options;
            var e = (t == 'select-one');
            var f = (e ? d + 1 : ops.length);
            for (var i = (e ? d : 0); i < f; i++) {
                var g = ops[i];
                if (g.selected) {
                    var v = g.value;
                    if (!v) {
                        v = (g.attributes && g.attributes.value && !(g.attributes.value.specified)) ? g.text : g.value
                    }
                    if (e) {
                        return v
                    }
                    a.push(v)
                }
            }
            return a
        }
        return $(b).val()
    };
    $.fn.clearForm = function (a) {
        return this.each(function () {
            $('input,select,textarea', this).clearFields(a)
        })
    };
    $.fn.clearFields = $.fn.clearInputs = function (a) {
        var b = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;
        return this.each(function () {
            var t = this.type, tag = this.tagName.toLowerCase();
            if (b.test(t) || tag == 'textarea') {
                this.value = ''
            } else if (t == 'checkbox' || t == 'radio') {
                this.checked = false
            } else if (tag == 'select') {
                this.selectedIndex = -1
            } else if (t == "file") {
                if (/MSIE/.test(navigator.userAgent)) {
                    $(this).replaceWith($(this).clone(true))
                } else {
                    $(this).val('')
                }
            } else if (a) {
                if ((a === true && /hidden/.test(t)) || (typeof a == 'string' && $(this).is(a))) {
                    this.value = ''
                }
            }
        })
    };
    $.fn.resetForm = function () {
        return this.each(function () {
            if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
                this.reset()
            }
        })
    };
    $.fn.enable = function (b) {
        if (b === undefined) {
            b = true
        }
        return this.each(function () {
            this.disabled = !b
        })
    };
    $.fn.selected = function (b) {
        if (b === undefined) {
            b = true
        }
        return this.each(function () {
            var t = this.type;
            if (t == 'checkbox' || t == 'radio') {
                this.checked = b
            } else if (this.tagName.toLowerCase() == 'option') {
                var a = $(this).parent('select');
                if (b && a[0] && a[0].type == 'select-one') {
                    a.find('option').selected(false)
                }
                this.selected = b
            }
        })
    };
    $.fn.ajaxSubmit.debug = false;

    function log() {
        if (!$.fn.ajaxSubmit.debug) {
            return
        }
        var a = '[jquery.form] ' + Array.prototype.join.call(arguments, '');
        if (window.console && window.console.log) {
            window.console.log(a)
        } else if (window.opera && window.opera.postError) {
            window.opera.postError(a)
        }
    }
}));