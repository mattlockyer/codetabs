

//Loader

var Loader = (function() {
    Loader = {};
    Loader.queue = [];
    Loader.getQueueHTML = function() {
        var html = '';
        for (var i = 0; i < Loader.queue.length; ++i) {
            var ft = getFiletype(Loader.queue[i]);
            if (ft === 'js') {
                html += '<script type="text/javascript" src="' + Loader.queue[i] + '"></script>';
            } else if (ft === 'css') { 
                html += '<link rel="stylesheet" type="text/css" href="' + Loader.queue[i] + '"/>';
            }
        }
        return html;
    }
    var getFiletype = function(fn) {
        return fn.substring(fn.lastIndexOf('.') + 1);
    }
    return Loader;
}());

//FileManager

var FileManager = (function() {
    FileManager = {};
    
    FileManager.files = {};
    
    FileManager.loadImages = function(data, callback) {
        if (data) {
            var images = data.split(',');
            for (var i = 0; i < images.length; ++i) {
                var fn = images[i];
                var image = new Image();
                image.onload = function() {
                    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    //set it up
                    try {
                        var vn = getVarName(fn);
                        var imageData = canvas.toDataURL('image/png');
                        FileManager.files[vn] = imageData;
                        callback(vn, imageData);
                    } catch(e) {
                        console.log('loading local image failed');
                    }
                };
                image.src = fn;
            }
        }
    }
    
    FileManager.select = function(e, callback) {
        e.stopPropagation();
        e.preventDefault();
        var files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files; // drop || browse
        var reader = new FileReader();
        reader.onload = function (e) {
            var vn = getVarName(files[0].name);
            FileManager.files[vn] = e.target.result;
            callback(vn, e.target.result);
        };
        reader.readAsDataURL(files[0]);
    }
    
    FileManager.createDropZone = function(el, callback) {
        var handleDragOver = function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        }
        // Setup the dnd listeners.
        var dropZone = el[0];
        dropZone.addEventListener('dragover', handleDragOver, false);
        dropZone.addEventListener('drop', function(e) {
            FileManager.select(e, callback);
        }, false);
    }
    
    FileManager.removeFile = function(name) {
        delete FileManager.files[name];
    }
    
    //Private
    
    var getVarName = function(name) {
        return name.substring(name.lastIndexOf('/') + 1, name.indexOf('.'));
    }
    
    return FileManager;
}());

/*
 * 
 * //CodeTabs Object
 *
 */

var CodeTabs = (function() {
    var CodeTabs = {};
    
    CodeTabs.init = function() {
        window.onload = function() {            
            var i, el, src = '', elems = document.getElementsByTagName('SCRIPT');
            for (i = 0; i < elems.length; ++i) {
                el = elems[i];
                var srcValue = el.getAttribute('src');
                if (srcValue && srcValue.indexOf('codetabs') > -1) {
                    src = srcValue;
                    break;
                }
            }
            var oldElems = [];
            elems = document.getElementsByTagName('DIV');
            for (i = 0; i < elems.length; ++i) {
                el = elems[i];
                if (el.className === 'codetabs') {
                    //set params
                    var _data = {};
                    for (var j = 0, attr = el.attributes, l = attr.length; j < l; j++) {
                        var item = attr.item(j);
                        if (item.nodeName.indexOf('data') > -1) {
                            _data[item.nodeName.substring(5)] = item.nodeValue;
                        }
                    }
                    //are you the iframe?
                    if (window.location !== window.parent.location) {
                        CodeTabs.render(_data);
                        return;
                    }
                    var elClone = el.cloneNode(true);
                    var elWrap = document.createElement('div');
                    elWrap.appendChild(elClone);
                    //iframe attributes
                    var iframe = document.createElement('iframe');
                    iframe.width = _data.width;
                    iframe.height = _data.height;
                    if (isMobile) {
                        iframe.width = _data.width/2;
                        iframe.height = _data.height/2;
                    }
                    iframe.name = _data.name;
                    iframe.frameBorder = 0;
                    iframe.setAttribute('id', _data.name);
                    iframe.setAttribute('webkitallowfullscreen', 'true');
                    iframe.setAttribute('mozallowfullscreen', 'true');
                    iframe.setAttribute('allowfullscreen', 'true');
                    //cdn
                    if (_data.cdn) { 
                        Loader.queue.push('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');
                        Loader.queue.push('http://cdn.jsdelivr.net/codemirror/3.1/codemirror.js');
                        Loader.queue.push('http://cdn.jsdelivr.net/codemirror/3.1/codemirror.css');
                        Loader.queue.push('http://netdna.bootstrapcdn.com/font-awesome/3.0.2/css/font-awesome.css');
                    //local sources   
                    } else {
                        Loader.queue.push('js/local/jquery-1.7.2.min.js');
                        Loader.queue.push('js/local/codemirror-3.11.min.js');
                        Loader.queue.push('css/fontawesome-3.0.2.css');
                        Loader.queue.push('css/codemirror-3.11.css');
                    }
                    //dependencies (yuk!)
                    /*
                    Loader.queue.push('js/deps/filesaver.min.js');
                    Loader.queue.push('js/deps/match-highlighter.js');
                    Loader.queue.push('js/deps/match-brackets.js');
                    Loader.queue.push('js/deps/close-brackets.js');
                    Loader.queue.push('js/deps/fold-code.js');
                    Loader.queue.push('js/deps/fold-brace.js');
                    Loader.queue.push('js/deps/fold-xml.js');
                    Loader.queue.push('js/deps/close-tag.js');
                    Loader.queue.push('js/deps/syntax-javascript.js');
                    Loader.queue.push('js/deps/syntax-xml.js');
                    Loader.queue.push('js/deps/syntax-css.js');
                    Loader.queue.push('js/deps/syntax-htmlmixed.js');
                     */
                    //yaaa!
                    Loader.queue.push('js/deps.min.js');
                    //css
                    Loader.queue.push('css/codetabs.css');
                    //ext
                    if (!_data.nozip) {
                        Loader.queue.push('js/ext/jszip.min.js');
                    }
                    if (!_data.nohints) {
                        Loader.queue.push('js/ext/hints.js');
                        Loader.queue.push('js/ext/show-hint.js');
                        Loader.queue.push('css/ext/show-hint.css');
                    }
                    //processing ext
                    if (_data.processing) {
                        Loader.queue.push('js/ext/syntax-processing.js');
                        Loader.queue.push('css/ext/syntax-processing.css');
                    }
                    
                    //get tags for srcs
                    var srcHTML = Loader.getQueueHTML();
                    //style
                    var style = 'body{display:none;margin:0px;padding:0px;border:0px;border-bottom:1px solid #ddd;width:100%;';
                    if (_data.background) {
                        style += 'border:0px;background-color:' + _data.background + ';}';
                    }
                    style += '}'
                    //html
                    var ihtml = '<html><head>' + srcHTML + '<script type="text/javascript" src="' + src + '"></script>'
                    + '<style>' + style + '</style></head>'
                    + '<body>' + elWrap.innerHTML + '</body></html>';
                    //append
                    if (_data.appendbody) {
                        document.body.appendChild(iframe);
                    } else {
                        el.parentNode.insertBefore(iframe, el);
                    }
                    oldElems.push(el);
                    //write markup to iframe
                    var doc = iframe.contentWindow || iframe.contentDocument;
                    if (doc.document) {
                        doc = doc.document;
                    }
                    doc.open();
                    doc.write(ihtml);
                    doc.close();
                }
            }
            for (i = 0; i < oldElems.length; ++i) {
                oldElems[i].parentNode.removeChild(oldElems[i]);
            }
        }
    }
    
    //public
    CodeTabs.logger = {};
    //private
    var data = {};
    var mirrors = [];
    var winTop;
    var doc;
    var iframe;
    var container;
    //state
    var isMobile;
    var isFullscreen;
    var isPlaying;
    var isHidden;
    var lastMirror = 1;
    //internalFrames
    var pFrame;
    var pFrameWin;
    var pFrameDoc;
    
    CodeTabs.render = function(_data) {
        data = _data;
        $(document).ready(function() {
            isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
            isFullscreen = data.isfullscreen;
            isPlaying = data.isplaying;
            isHidden = data.ishidden;
            //start processing the tabs
            var i, len;
            container = $('.codetabs');
            winTop = $(window.top);
            winTop.on('resize', function() {
                CodeTabs.resize();
            });
            $('body').css({
                'display':'block'
            });
            doc = $(window.top.document);
            iframe = doc.find('#' + data.name);
            console.log(iframe);
            iframe[0].fadeOut = function() {
                iframe.stop().fadeOut();
                isHidden = !isHidden;
            }
            iframe[0].fadeIn = function() {
                iframe.stop().fadeIn();
                isHidden = !isHidden;
            }
            iframe[0].hide = function() {
                iframe.stop().hide();
                isHidden = !isHidden;
            }
            iframe[0].show = function() {
                iframe.stop().show();
                isHidden = !isHidden;
            }
            
            mirrors = [];
                
            var tabs = container.children();
            len = tabs.length;
            var html = '<ul class="tabs">';
            html += '<li class="play tab"><i class="icon-play"></i></li>';
            //code tabs
            html += '<li class="menu"><i class="icon-reorder"></i><ul>'
            + '<li class="add"><i class="icon-plus"></i>'
            + '<li class="files tab"><i class="icon-folder-open-alt"></i></li>'
            + '<li class="font"><i class="icon-font"></i></li>';
            if (!data.nozip) {
                html += '<li class="export"><i class="icon-save"></i></li>'
            }
            if (!data.nofullscreen) {
                html += '<li class="fullscreen"><i class="icon-fullscreen"></i></li>';
            }
            html += '</ul></ul>'
            + '<div class="content">'
            + '<div class="wrap"><div class="inner"> <div class="play-content"></div> </div></div>';
            //code content
            html += '<div class="wrap"><div class="inner">'
            + '<input class="upload-input" type="file" name="files[]" multiple style="display:none;" />'
            + '<div class="upload"><div class="inner"><i class="icon-plus-sign icon-3x"></i></div></div>'
            + '<div class="files-content"></div></div></div></div>'
            + '<div class="console"><span class="output"></span>'
            + '<div class="close"><i class="icon-caret-down icon-2x"></i></div></div>';
            container.html(html);
            //add tabs
            for (i = 0; i < len; ++i) {
                var tab = tabs.eq(i);
                var tabName = tab.data('name');
                if (tabName) CodeTabs.addTab(tabName, tab.text());
            }
            //setup console
            CodeTabs.logger.console = $('.console');
            CodeTabs.logger.output = CodeTabs.logger.console.find('.output');
            CodeTabs.logger.close = CodeTabs.logger.console.find('.close');
            CodeTabs.logger.hide();
            CodeTabs.logger.close.on('click', function() {
                CodeTabs.logger.hide();
            });
            //setup tabs
            setupListeners();
            //browse
            $('.upload').on('click', function() {
                $('#' + data.name + '-file-browse-input').trigger('click');
            });
            $('.upload-input').on('change', function(e) {
                FileManager.select(e, function(fn, result) {
                    addThumb(fn, result);
                });
            })
            $('.files-content').hide();
            FileManager.createDropZone($('.upload'), function(fn, result) {
                addThumb(fn, result);
            });
            //export
            if (!data.nozip) {
                $('.export').on('click', function() {
                    exportZip();
                });
            }
            $(window.top).on('keypress', function(event) {
                console.log(event);
                if (event.keyCode == 101 || event.keyCode == 69) {
                    exportZip();
                    event.preventDefault();
                    return false;
                }                    
            });
            //fullscreen
            if (!data.nofullscreen) {
                if (data.isfullscreen) $('.fullscreen i').toggleClass('icon-fullscreen').toggleClass('icon-resize-small');
                $('.fullscreen').on('click', function() {
                    $(this).find('i').toggleClass('icon-fullscreen').toggleClass('icon-resize-small');
                    isFullscreen = !isFullscreen;
                    if (isPlaying) {
                        stopPreview();
                        startPreview();
                    }
                    CodeTabs.resize();
                });
            }
            //font
            $('.font').on('click', function() {
                var size = parseInt(data.fontsize.substring(0, data.fontsize.length - 2));
                size += 2;
                if (size > 32) size = 10;
                data.fontsize = size + 'px';
                codeMirrorFontUpdate();
                var i = $('.content div:visible').index();
                if (i > 0 && i < mirrors.length + 1) mirrors[i-1].refresh();
            });
            //param appearance fixes
            codeMirrorFontUpdate();
            borderFixes();
            //load local images
            FileManager.loadImages(container.data('images'), function(fn, result) {
                addThumb(fn, result);
            });
            //let's go
            if (isPlaying) {
                startPreview();
                showTab(container.find('.tab'), 0);
                lastMirror = 1;
            } else {
                showTab(container.find('.tab'), 1);
            }
            CodeTabs.resize();
            if (isHidden) iframe.hide();
        });
    }
    
    //Add Tab
    CodeTabs.addTab = function(newTabName, code) {
        var tabNames = getTabNames();
        if (tabNames.indexOf(newTabName) > -1) {
            alert('Tab name is already used! Please choose a unique tab name!');
            return;
        }
        if (newTabName.indexOf(' ') > -1) {
            alert('No spaces in tab name please!');
            return;
        }
        var tabs = container.find('.tab');
        var i = tabs.length - 2;
        tabs.eq(i).after('<li class="tab">' + newTabName + '<div class="remove"><i class="icon-remove"></i></div></li>');
        $('.content').children().eq(i).after(
            '<div class="wrap"><textarea id="' + data.name + '-mirror-' + i + '">' + ((code) ? code : '//New Tab: ' + newTabName) + '</textarea></div>'
            );
        setupEditor(i);
        //refresh listeners for tabs
        setupListeners();
        showTab(tabs, i + 1)
        CodeTabs.resize();
    }
    
    //Private Methods
    
    //setup
    
    //listeners
    var setupListeners = function() {
        var tabs = container.find('.tab');
        //kill all listeners and put the tabs listener on
        tabs.off('click').on('click', function() {
            showTab(tabs, tabs.index($(this)));
        });
        //removing tabs, kill listeners, put new on
        $('.tab .remove').off('click').on('click', function(e) {
            var i = tabs.index($(this).parent());
            tabs.eq(i).remove();
            $('.content').children().eq(i).remove();
            mirrors.splice(i-1, 1);
            setupListeners();
            showTab(tabs, i-1);
            CodeTabs.resize();
            e.stopPropagation();
            return false;
        });
        //exit processing when other tab clicked
        tabs.not('.play').on('click', function() {
            isPlaying = false;
            stopPreview();
        });
        //play tab extra function
        $('.play').on('click', function() {
            isPlaying = !isPlaying;
            if (isPlaying) {
                startPreview();
            } else {
                stopPreview(lastMirror);
            }
        });
        //add tab extra function
        $('.add').off('click').on('click', function() {
            var newTabName = window.prompt('Name for new tab:', 'NewTab');
            if (newTabName && newTabName !== '') {
                CodeTabs.addTab(newTabName);
                mirrors[mirrors.length - 1].refresh(); //extra refresh for this guy
            }
        });
    }
    //show tabs
    var showTab = function(tabs, i) {
        tabs.removeClass('active');
        tabs.eq(i).addClass('active');
        var tabContent = $('.content').children();
        tabContent.hide();
        tabContent.eq(i).show();
        if (i > 0 && i < mirrors.length + 1) {
            lastMirror = i;
            mirrors[i - 1].refresh();
        }
    }
    //previews
    var startPreview = function() {
        //setup and hide elements
        CodeTabs.resize();
        var icon = $('.play').find('i');
        icon.removeClass('icon-play').addClass('icon-spinner icon-spin');
        window.setTimeout(function() {
            CodeTabs.logger.hide();
            var content = $('.play-content');
            var tabNames = getTabNames();
            CodeTabs.logger.clear();
            //build new sources
            var htmlSource = '';
            var jsSource = 'function onPageLoad(func){var old=window.onload;if(typeof window.onload!="function"){ '
            + 'window.onload=func;}else{window.onload=function(){if(old){old();}func();}}} '
            + 'var fullWidth=' + content.width() + ';var fullHeight=' + content.parent().height() + ';';
            var cssSource = '';
            var processingSource = '';
            var i = mirrors.length;
            for (i; i > 0; --i) {
                var source = mirrors[i-1].getValue();
                if (tabNames[i].indexOf('.html') > -1) {
                    htmlSource += source;
                } else if (tabNames[i].indexOf('.js') > -1) {
                    jsSource += source;
                } else if (tabNames[i].indexOf('.css') > -1) {
                    cssSource += source;
                } else if (tabNames[i].indexOf('.pde') > -1) {
                    processingSource += source;
                }
            }
            if (data.processing && processingSource !== '') {
                //append files as data URIs
                for (var fn in FileManager.files) {
                    processingSource += 'var ' + fn + ' = "' + FileManager.files[fn] + '";\n';
                }
                if (htmlSource.indexOf('<canvas') === -1) {
                    htmlSource += '<canvas id="canvas" width="100px" height="100px"></canvas><div></div>';
                }
            } 
            
            //iframe
            var el = content.get(0);
            pFrame = document.createElement('iframe');
            pFrame.frameBorder = 0;
            pFrame.setAttribute('id', 'preview');
            pFrame.setAttribute('webkitallowfullscreen', 'true');
            pFrame.setAttribute('mozallowfullscreen', 'true');
            pFrame.setAttribute('allowfullscreen', 'true');
            //scripts
            var scripts = '';
            if (data.scripts) Loader.queue = data.scripts.split(',');
            if (data.processing) Loader.queue.push(data.processing);
            if (data.webcam) Loader.queue.push('js/ext/Webcam.js');
            scripts = Loader.getQueueHTML();
            var processingLoader = '';
            if (processingSource !== '') {
                processingLoader += '<script type="text/javascript"> var processing; onPageLoad(function() { ' //pageload
                + 'Processing.logger = window.parent.CodeTabs.logger; ' //logger
                + 'try { var psrc = document.getElementById("processing-source").value; '
                + 'psrc += "var fullWidth = ' + content.width() + '; var fullHeight = ' + content.parent().height() + ';"; '
                + 'processing = new Processing(document.getElementById("canvas"), psrc) } '
                + 'catch (e) { window.parent.CodeTabs.logger.log(e) } } );//onPageLoad</script>';
            }
            //ihtml
            var ihtml = '<html><head>' + scripts
            + '<script type="text/javascript">' + jsSource + '</script>' + processingLoader
            + '<style type="text/css">body{margin:0px;padding:0px;}' + cssSource + '</style></head><body>'
            + '<textarea id="processing-source" style="display:none">' + processingSource + '</textarea>'
            + htmlSource + '</body>';
            //append
            el.parentNode.insertBefore(pFrame, el);
            //write markup
            pFrameWin = pFrame.contentWindow || pFrame.contentDocument;
            if (pFrameWin.document) {
                pFrameDoc = pFrameWin.document;
            }
            pFrameDoc.open();
            pFrameDoc.write(ihtml);
            pFrameDoc.close();
            //stretch it out
            $(pFrame).css({
                'width':'100%',
                'height':'100%'
            });
            icon.removeClass('icon-spinner icon-spin icon-stop').addClass('icon-stop');
        }, 100);
    }
    //stoping / exiting
    var stopPreview = function(last) {
        try { //try to stop
            pFrameWin.Webcam.stop();
            pFrameWin.processing.exit();
        } catch(e) {} //no biggie
        $('#preview').remove();
        var icon = $('.play').find('i');
        if (!icon.hasClass('icon-warning-sign')) {
            icon.removeClass('icon-spinner icon-spin icon-stop').addClass('icon-play');
        }
        CodeTabs.resize();
        if (last) container.find('.tab').eq(last).trigger('click');
    }
    //setup editors
    var setupEditor = function(i) {
        var tabName = container.find('.tab').eq(i + 1).text();
        //syntax and hints
        var hint = '';
        var syntax = 'text';
        if (tabName.indexOf('.js') > -1) {
            syntax = 'text/javascript';
            if (!data.nohints) hint = 'jsHint';
        } else if (tabName.indexOf('.html') > -1) {
            syntax = 'text/html';
            if (!data.nohints) hint = 'htmlHint';
        } else if (tabName.indexOf('.css') > -1) {
            syntax = 'text/css';
            if (!data.nohints) hint = 'cssHint';
        } else if (tabName.indexOf('.pde') > -1) {
            syntax = 'text/processing';
            if (!data.nohints) hint = 'processingHint';
        }
        if (hint !== '') setupHint(hint);
        //for key triggers
        var passHint = function(cm) {
            setTimeout(function() {
                cm.execCommand(hint);
            }, 250);
            return CodeMirror.Pass;
        }
        
        mirrors.push(CodeMirror.fromTextArea(document.getElementById(data.name + '-mirror-' + i), {
            tabSize:2,
            lineNumbers:true,
            matchBrackets: true,
            highlightSelectionMatches: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
            gutters: ["CodeMirror-linenumbers", "folds"],
            extraKeys: {
                "Ctrl-Space":hint,
                //"Enter": (hint !== 'htmlHint') ? passHint : null,
                //"' '": (hint !== 'htmlHint') ? passHint : null,
                //"Tab": (hint !== 'htmlHint') ? passHint : null,
                "'<'": (hint === 'htmlHint') ? passHint : null,
                "':'": (hint === 'cssHint') ? passHint : null
            },
            mode:syntax
        }));
        function makeMarker() {
            var marker = document.createElement("div");
            marker.className = "folded";
            return marker;
        }
        if (hint !== 'htmlHint') {
            mirrors[i].on("gutterClick", function(cm, n) {
                if (CodeMirror.newFoldFunction(cm, n, CodeMirror.braceRangeFinder)) {
                    cm.setGutterMarker(n, "folds", makeMarker());
                } else {
                    cm.setGutterMarker(n, "folds", null);
                }
            });
        } else {
            mirrors[i].on("gutterClick", function(cm, n) {
                if (CodeMirror.newFoldFunction(cm, n, CodeMirror.tagRangeFinder)) {
                    cm.setGutterMarker(n, "folds", makeMarker());
                } else {
                    cm.setGutterMarker(n, "folds", null);
                }
            });
        }
        mirrors[i].on("update", function() {
            refreshMirrorGutters();
        });
    }
    //setup mirror hints
    var setupHint = function(hint) {
        if (!CodeMirror.commands[hint]) {
            CodeMirror.commands[hint] = function(cm) {
                CodeMirror.showHint(cm, CodeMirror[hint]);
            }
        }
    }
    //export zip
    var exportZip = function() {
        if (confirm('Save sketch?')) {
            var zip = new JSZip();
            var folder = zip.folder(data.name);
            //images
            var images = [];
            var data = folder.folder('data');
            var img = data.folder('img');
            for (var fn in FileManager.files) {
                images.push(fn);
                var data = FileManager.files[fn].substring(FileManager.files[fn].indexOf(',') + 1);
                img.file(fn + '.png', data, {
                    base64:true
                });
            }
            //code
            var tabs = container.find('.tab');
            var i = 1, len = mirrors.length + 1;
            for (i; i < len; ++i) {
                fn = tabs.eq(i).text();
                var code = $.trim(mirrors[i-1].getValue());
                if (code !== '') {
                    var preload = '';
                    var j, len2 = images.length;
                    for (j = 0; j < len2; ++j) {
                        var regex = new RegExp('loadImage\\(' + images[j] + '\\)', 'g');
                        code = code.replace(regex, 'loadImage("img/' + images[j] + '.png")');
                        if (i === 1) {
                            preload += 'img/' + images[j] + '.png';
                        }
                    }
                    if (i === 1) {
                        code = '/* @pjs preload="' + preload + '"; */\n\n' + code;
                    }
                    folder.file(fn, code);
                }
            }
            var blob = zip.generate({
                type:'blob'
            });
            saveAs(blob, data.name + '.zip');
        }
    }
    //add thumb
    var addThumb = function(fn, result) {
        $('.files-content').show().prepend('<div class="thumb"><img src="' + result + '" /><br />'
            + '<div class="thumb-name">' + fn + '</div><div class="remove"><i class="icon-remove"></i></div></div>')
        .find('.remove').each(function() {
            $(this).off('click').on('click', function() {
                FileManager.removeFile($(this).prev().text());
                $(this).parent().remove();
            });
        });
    }
    
    //Logger
    
    CodeTabs.logger.log = function(e, line) {
        CodeTabs.logger.show();
        if (typeof e === "string") {
            CodeTabs.logger.output.append(e);
            return;
        }
        var error = e.toString(), msg = error;
        if (error.indexOf('Unexpected') > -1) {
            msg = 'Missing an opening bracket [SyntaxError]';
            if (error.indexOf('token') > -1 || error.indexOf('identifier') > -1) {
                msg = 'Missing a closing bracket [SyntaxError]';
            }
            if (error.indexOf('number') > -1) {
                msg = 'Missing a comma (in arguments) [SyntaxError]'
            }
        }
        if (error.indexOf('ReferenceError') > -1) {
            msg = 'Undeclared or misspelled variable: ' + error.substring(error.indexOf(' ')) + ' [ReferenceError]';
        }
        if (error.indexOf('TypeError') > -1) {
            msg = 'Missing semi-colon in loop [SyntaxError]';
        }
        if (line) msg += ' on line #' + line;
        msg += '<br />'
        CodeTabs.logger.output.append(msg);
        $('.play').find('i').addClass('icon-warning-sign').removeClass('icon-play');
    };
    CodeTabs.logger.resize = function() {
        if (CodeTabs.logger.console) {
            var h = ($('body').height() - 100) + 'px';
            CodeTabs.logger.console.css({
                top:h
            });
            CodeTabs.logger.close.css({
                top:-1
            });
            CodeTabs.logger.console.scrollTop(99999);
        }
    }
    CodeTabs.logger.clear = function() {
        CodeTabs.logger.output.html('');
    }
    CodeTabs.logger.show = function() {
        CodeTabs.logger.resize();
        CodeTabs.logger.console.show();
    }
    CodeTabs.logger.hide = function() {
        $('.play').find('i').removeClass('icon-warning-sign').addClass('icon-play');
        CodeTabs.logger.console.hide();
    }
    
    //Updates
    
    //Resize
    CodeTabs.resize = function() {
        if (isFullscreen) {
            allowZoom(false);
            iframe.css({
                'background-color':'#aaa',
                'position':'absolute',
                'border-width':'0px',
                'width':winTop.width() - 2 + 'px',
                'height':winTop.height() + 'px',
                'top':'0px',
                'left':'0px',
                'z-index':9997
            });
            iframe.parent().css({
                'overflow':'hidden'
            });
            $('.content').css({
                'top':'0px'
            });
            if (isPlaying) {
                $('.tab, .menu').hide();
                $('.play').show().addClass('border-override');
                $('.play-content').parent().css({
                    'margin-left':'0px',
                    'border-width':'0px'
                });
                doc.scrollTop(0).scrollLeft(0);
            } else {
                resetTabs();
            }
        } else {
            allowZoom(true);
            borderFixes();
            resetTabs();
            iframe.css({
                'background-color':(iframe.data('background-color')) ? iframe.data('background-color') : 'transparent',
                'opacity':1.0,
                'z-index':0
            });
            if (data.appendbody) {
                iframe.css({
                    'width':iframe.attr('width') + 'px',
                    'height':iframe.attr('height') + 'px',
                    'position':'absolute',
                    'top':doc.height()/2 - iframe.attr('height')/2 + 'px',
                    'left':doc.width()/2 - iframe.attr('width')/2 + 'px'
                });
            } else if (data.width) {
                iframe.css({
                    'width':iframe.attr('width') + 'px',
                    'height':iframe.attr('height') + 'px',
                    'position':'relative'
                });
            } else {
                iframe.css({
                    'width':iframe.parent().width() - 2 + 'px',
                    'height':iframe.parent().height() - 2 + 'px',
                    'position':'relative'
                });
            }
        }
        CodeTabs.logger.resize();
    }
    var borderFixes = function() {
        if (data.background) {
            iframe.css({
                'border':'1px solid #ddd'
            });
            $('.content').css({
                'border-left':'none',
                'border-right':'none'
            });
            $('.tabs li').css({
                'height':'17px',
                'margin-top':'-1px'
            });
        } else {
            iframe.css({
                'border':'none'
            });
            $('.tabs li ul').css({
                'top':'33px'
            });
        }
    }
    var resetTabs = function() {
        $('.tab, .menu').show();
        var tabHeight = $('.tabs').height();
        ++tabHeight;
        $('.content').css({
            top:tabHeight + 'px'
        });
        $('.play').show().removeClass('border-override');
        $('.play-content').parent().css({
            'border-width':'1px'
        });
        refreshMirrorGutters();
    }
    //update fonts
    var codeMirrorFontUpdate = function() {
        $('head .CodeMirror-injected-style').remove();
        var html = '<style class="CodeMirror-injected-style">.CodeMirror pre { padding:4px; } .CodeMirror-linenumber { padding-top:4px; } ';
        if (data.fontsize) html += '.CodeMirror pre { font-size:' + data.fontsize + '; }';
        if (data.fontweight) html += '.CodeMirror pre { font-weight:' + data.fontweight + '; } ';
        if (data.lines) html += '.CodeMirror pre { border-bottom:1px solid ' + data.lines + '; } ';
        html += '</style>';
        $('head').append(html);
        refreshMirrorGutters();
    }
    //refreshing mirror gutters
    var refreshMirrorGutters = function() {
        var fontWidth = parseInt(data.fontsize.substring(0, data.fontsize.length - 2));
        $('.CodeMirror-linenumber').css({
            'font-size':data.fontsize,
            'font-weight':data.fontweight,
            'padding-top':'6px',
            'padding-bottom':'2px',
            'margin-top':'-1px',
            'width': 12 + fontWidth + 'px'
        })
        $('.folded').parent().prev().css({
            'border-top':'1px solid #ccc',
            'border-bottom':'1px solid #ccc',
            'background-color':'#ffcc00',
            'font-weight':'bold',
            'color':'#000',
            'cursor':'pointer'
        });
        $('.CodeMirror-gutters, .CodeMirror-linenumbers').css({
            'width': 20 + fontWidth + 'px'
        });
        $('.tabs').css({
            'padding-left': 21 + fontWidth - ((data.background) ? 1 : 0) + 'px'
        });
        $('.inner').css({
            'margin-left': 20 + fontWidth + 'px'
        })
    }
    //restrict mobile zoom in fullscreen mode, messes with keyboard
    var allowZoom = function(flag) {
        if (flag == true) {
            doc.find('head meta[name=viewport]').remove();
        } else {
            doc.find('head meta[name=viewport]').remove();
            doc.find('head').prepend('<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,width=device-width,height=device-height,target-densitydpi=device-dpi,user-scalable=yes" />'
                + '<meta name="viewport" content="initial-scale=1.0,width=device-width,user-scalable=0" />'
                + '<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,width=device-width,user-scalable=no" />');
        }
    }
    //helpers
    var getTabNames = function() {
        var ret = [];
        container.find('.tab').each(function() {
            ret.push($(this).text());
        });
        return ret;
    }
    
    return CodeTabs;
}());

CodeTabs.init();