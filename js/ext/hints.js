(function () {
    
    /*
     * HTML Hints
     */

    CodeMirror.htmlHint = function(cm) {        
        var cursor = cm.getCursor();
        if (cursor.ch > 0) {
            var text = cm.getRange(CodeMirror.Pos(0, 0), cursor);
            var typed = '';
            var symbol = '';
            for(var i = text.length - 1; i >= 0; i--) {
                if(text[i] == ' ' || text[i] == '<') {
                    symbol = text[i];
                    break;
                } else {
                    typed = text[i] + typed;
                }
            }
            text = text.slice(0, text.length - typed.length);
            var hints = htmlKeywords;
            if(typeof hints === 'undefined') {
                hints = [''];
            } else {
                hints = hints.slice(0);
                for (var i = hints.length - 1; i >= 0; i--) {
                    if (hints[i].indexOf(typed) != 0) hints.splice(i, 1);
                }
            }
            return {
                list: hints,
                from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                to: cursor
            };
        }
    }
    
    /*
     * CSS Hints
     */
    
    if (!String.prototype.trim) {
        String.prototype.trim=function(){
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    CodeMirror.cssHint = function(cm) {        
        var cursor = cm.getCursor();
        if (cursor.ch > 0) {
            var text = cm.getRange(CodeMirror.Pos(0, 0), cursor);
            var typed = '';
            var symbol;
            for(var i = text.length - 1; i >= 0; i--) {
                if(text[i] == ':') {
                    symbol = text[i];
                    break;
                } else {
                    typed = text[i] + typed;
                }
            }
            //trim typed strings after symbols
            if (typed.indexOf('{')) typed = typed.substring(typed.lastIndexOf('{') + 1).trim();
            if (typed.indexOf(';')) typed = typed.substring(typed.lastIndexOf(';') + 1).trim();
            //here we go
            text = text.slice(0, text.length - typed.length);
            var hints = cssKeywords;
            if (symbol) hints = cssValueKeywords;
            if(typeof hints === 'undefined') {
                hints = [''];
            } else {
                hints = hints.slice(0);
                for (var i = hints.length - 1; i >= 0; i--) {
                    if (hints[i].indexOf(typed) != 0) hints.splice(i, 1);
                }
            }
            return {
                list: hints,
                from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                to: cursor
            };
        }
    }
    
    /*
     * Script Hints
     */
    
    var Pos = CodeMirror.Pos;

    function forEach(arr, f) {
        for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
    }
  
    function arrayContains(arr, item) {
        if (!Array.prototype.indexOf) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === item) {
                    return true;
                }
            }
            return false;
        }
        return arr.indexOf(item) != -1;
    }

    function scriptHint(editor, keywords, getToken, options) {
        // Find the token at the cursor
        var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
        // If it's not a 'word-style' token, ignore the token.
        if (!/^[\w$_]*$/.test(token.string)) {
            token = tprop = {
                start: cur.ch, 
                end: cur.ch, 
                string: "", 
                state: token.state,
                type: token.string == "." ? "property" : null
            };
        }
        // If it is a property, find out what it is a property of.
        
        while (tprop.type == "property") {
            tprop = getToken(editor, Pos(cur.line, tprop.start));
            if (tprop.string != ".") return;
            tprop = getToken(editor, Pos(cur.line, tprop.start));
            if (tprop.string == ')') {
                var level = 1;
                do {
                    tprop = getToken(editor, Pos(cur.line, tprop.start));
                    switch (tprop.string) {
                        case ')':
                            level++;
                            break;
                        case '(':
                            level--;
                            break;
                        default:
                            break;
                    }
                } while (level > 0);
                tprop = getToken(editor, Pos(cur.line, tprop.start));
                if (tprop.type.indexOf("variable") === 0) {
                    tprop.type = "function";
                } else {
                    return;
                }
            }
            if (!context) var context = [];
            context.push(tprop);
        }
        return {
            list: getCompletions(token, context, keywords, options),
            from: Pos(cur.line, token.start),
            to: Pos(cur.line, token.end)
        };
    }
    
    function getCompletions(token, context, keywords, options) {
        var found = [], start = token.string;
        function maybeAdd(str) {
            if (str.indexOf(start) == 0 && !arrayContains(found, str)) found.push(str);
        }
        function gatherCompletions(obj) {
            /*
            if (typeof obj == "string") forEach(stringProps, maybeAdd);
            else if (obj instanceof Array) forEach(arrayProps, maybeAdd);
            else if (obj instanceof Function) forEach(funcProps, maybeAdd);
            */
            for (var name in obj) maybeAdd(name);
        }
        if (context) {
            // If this is a property, see if it belongs to some object we can find in the current environment.
            var obj = context.pop(), base;
            if (obj.type) {
                if (obj.type.indexOf("variable") === 0) {
                    if (options && options.additionalContext)
                        base = options.additionalContext[obj.string];
                    base = base || window[obj.string];
                } else if (obj.type == "string") {
                    base = "";
                } else if (obj.type == "atom") {
                    base = 1;
                } else if (obj.type == "function") {
                    if (window.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') &&
                        (typeof window.jQuery == 'function'))
                        base = window.jQuery();
                    else if (window._ != null && (obj.string == '_') && (typeof window._ == 'function'))
                        base = window._();
                }
            }
            while (base != null && context.length)
                base = base[context.pop().string];
            if (base != null) gatherCompletions(base);
        } 
        // Look in the window object and any local scope
        // (reading into JS mode internals to get at the local and global variables)
        if (options.name === 'javascript') {
            for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
            for (var v = token.state.globalVars; v; v = v.next) maybeAdd(v.name);
            gatherCompletions(window);
        }
        forEach(keywords, maybeAdd);
        
        return found;
    }
    
    /*
     * Javascript
     */

    CodeMirror.jsHint = function(editor, options) {
        return scriptHint(editor, javascriptKeywords,
            function (e, cur) {
                return e.getTokenAt(cur);
            },
            {
                name:'javascript'
            });
    };

    /*
     * Processing
     */
    
    function getProcessingToken(editor, cur) {
        var token = editor.getTokenAt(cur);
        if (cur.ch == token.start + 1 && token.string.charAt(0) == '.') {
            token.end = token.start;
            token.string = '.';
            token.type = "property";
        }
        else if (/^\.[\w$_]*$/.test(token.string)) {
            token.type = "property";
            token.start++;
            token.string = token.string.replace(/\./, '');
        }
        return editor.getTokenAt(cur);
    }
    CodeMirror.processingHint = function(editor, options) {
        return scriptHint(editor, processingKeywords, getProcessingToken, {
            name:'processing'
        });
    };
    
    /*
     * Coffee
     */
    
    function getCoffeeScriptToken(editor, cur) {
        // This getToken, it is for coffeescript, imitates the behavior of
        // getTokenAt method in javascript.js, that is, returning "property"
        // type and treat "." as indepenent token.
        var token = editor.getTokenAt(cur);
        if (cur.ch == token.start + 1 && token.string.charAt(0) == '.') {
            token.end = token.start;
            token.string = '.';
            token.type = "property";
        }
        else if (/^\.[\w$_]*$/.test(token.string)) {
            token.type = "property";
            token.start++;
            token.string = token.string.replace(/\./, '');
        }
        return token;
    }
    CodeMirror.coffeescriptHint = function(editor, options) {
        return scriptHint(editor, coffeescriptKeywords, getCoffeeScriptToken, options);
    };
    

    /*
     * Keywords
     */
    /*
    var stringProps = ("charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight " +
        "toUpperCase toLowerCase split concat match replace search").split(" ");
    var arrayProps = ("length concat join splice push pop shift unshift slice reverse sort indexOf " +
        "lastIndexOf every some filter forEach map reduce reduceRight ").split(" ");
    var funcProps = "prototype apply call bind".split(" ");
    var javascriptKeywords = ("break case catch continue debugger default delete do else false finally for function "
        + "if in instanceof new null return switch throw true try typeof var void while with").split(" ");
    */
    var javascriptKeywords = ("break case catch continue debugger default delete do else false finally for function "
        + "if in instanceof new null return switch throw true try typeof var void while with "
    
        + "charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight "
        + "toUpperCase toLowerCase split concat match replace search "
        + "length concat join splice push pop shift unshift slice reverse sort indexOf " +
        + "lastIndexOf every some filter forEach map reduce reduceRight "
    
        + "prototype apply call bind "
    
        + "save restore scale rotate translate transform transform createLinearGradient createRadialGradient lineDash clearRect "
        + "fillRect beginPath closePath moveTo lineTo quadraticCurveTo bezierCurveTo arcTo rect arc fill stroke clip isPointInPath "
        + "isPointInStroke measureText alpha compositeOperation lineWidth lineCap lineJoin miterLimit clearShadow "
        + "fillText strokeText strokeColor fillColor strokeRect drawImage drawImageFromRect shadow putImageData webkitPutImageDataHD "
        + "createPattern createImageData imageData webkitGetImageDataHD lineDash").split(" ");
    
    var htmlKeywords = ('a abbr acronym address applet area article aside audio b base basefont bdi '
        + 'bdo bgsound big blink blockquote body br button  canvas caption center cite code col colgroup '
        + 'command data datalist dd del details dfn dir div dl dt em embed fieldset '
        + 'figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html '
        + 'i iframe img input ins isindex kbd keygen label legend li link listing main map mark '
        + 'marquee menu meta meter nav nobr noframes noscript object ol optgroup option output p param plaintext '
        + 'pre progress q rp rt ruby s samp script section select small source spacer span strike '
        + 'strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt '
        + 'u ul var video wbr xmp').split(" ");
    
    var cssKeywords = [
    "align-content", "align-items", "align-self", "alignment-adjust",
    "alignment-baseline", "anchor-point", "animation", "animation-delay",
    "animation-direction", "animation-duration", "animation-iteration-count",
    "animation-name", "animation-play-state", "animation-timing-function",
    "appearance", "azimuth", "backface-visibility", "background",
    "background-attachment", "background-clip", "background-color",
    "background-image", "background-origin", "background-position",
    "background-repeat", "background-size", "baseline-shift", "binding",
    "bleed", "bookmark-label", "bookmark-level", "bookmark-state",
    "bookmark-target", "border", "border-bottom", "border-bottom-color",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-bottom-style", "border-bottom-width", "border-collapse",
    "border-color", "border-image", "border-image-outset",
    "border-image-repeat", "border-image-slice", "border-image-source",
    "border-image-width", "border-left", "border-left-color",
    "border-left-style", "border-left-width", "border-radius", "border-right",
    "border-right-color", "border-right-style", "border-right-width",
    "border-spacing", "border-style", "border-top", "border-top-color",
    "border-top-left-radius", "border-top-right-radius", "border-top-style",
    "border-top-width", "border-width", "bottom", "box-decoration-break",
    "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
    "caption-side", "clear", "clip", "color", "color-profile", "column-count",
    "column-fill", "column-gap", "column-rule", "column-rule-color",
    "column-rule-style", "column-rule-width", "column-span", "column-width",
    "columns", "content", "counter-increment", "counter-reset", "crop", "cue",
    "cue-after", "cue-before", "cursor", "direction", "display",
    "dominant-baseline", "drop-initial-after-adjust",
    "drop-initial-after-align", "drop-initial-before-adjust",
    "drop-initial-before-align", "drop-initial-size", "drop-initial-value",
    "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis",
    "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
    "float", "float-offset", "font", "font-feature-settings", "font-family",
    "font-kerning", "font-language-override", "font-size", "font-size-adjust",
    "font-stretch", "font-style", "font-synthesis", "font-variant",
    "font-variant-alternates", "font-variant-caps", "font-variant-east-asian",
    "font-variant-ligatures", "font-variant-numeric", "font-variant-position",
    "font-weight", "grid-cell", "grid-column", "grid-column-align",
    "grid-column-sizing", "grid-column-span", "grid-columns", "grid-flow",
    "grid-row", "grid-row-align", "grid-row-sizing", "grid-row-span",
    "grid-rows", "grid-template", "hanging-punctuation", "height", "hyphens",
    "icon", "image-orientation", "image-rendering", "image-resolution",
    "inline-box-align", "justify-content", "left", "letter-spacing",
    "line-break", "line-height", "line-stacking", "line-stacking-ruby",
    "line-stacking-shift", "line-stacking-strategy", "list-style",
    "list-style-image", "list-style-position", "list-style-type", "margin",
    "margin-bottom", "margin-left", "margin-right", "margin-top",
    "marker-offset", "marks", "marquee-direction", "marquee-loop",
    "marquee-play-count", "marquee-speed", "marquee-style", "max-height",
    "max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index",
    "nav-left", "nav-right", "nav-up", "opacity", "order", "orphans", "outline",
    "outline-color", "outline-offset", "outline-style", "outline-width",
    "overflow", "overflow-style", "overflow-wrap", "overflow-x", "overflow-y",
    "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
    "page", "page-break-after", "page-break-before", "page-break-inside",
    "page-policy", "pause", "pause-after", "pause-before", "perspective",
    "perspective-origin", "pitch", "pitch-range", "play-during", "position",
    "presentation-level", "punctuation-trim", "quotes", "rendering-intent",
    "resize", "rest", "rest-after", "rest-before", "richness", "right",
    "rotation", "rotation-point", "ruby-align", "ruby-overhang",
    "ruby-position", "ruby-span", "size", "speak", "speak-as", "speak-header",
    "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set",
    "tab-size", "table-layout", "target", "target-name", "target-new",
    "target-position", "text-align", "text-align-last", "text-decoration",
    "text-decoration-color", "text-decoration-line", "text-decoration-skip",
    "text-decoration-style", "text-emphasis", "text-emphasis-color",
    "text-emphasis-position", "text-emphasis-style", "text-height",
    "text-indent", "text-justify", "text-outline", "text-shadow",
    "text-space-collapse", "text-transform", "text-underline-position",
    "text-wrap", "top", "transform", "transform-origin", "transform-style",
    "transition", "transition-delay", "transition-duration",
    "transition-property", "transition-timing-function", "unicode-bidi",
    "vertical-align", "visibility", "voice-balance", "voice-duration",
    "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress",
    "voice-volume", "volume", "white-space", "widows", "width", "word-break",
    "word-spacing", "word-wrap", "z-index"
    ];
    var cssValueKeywords = [
    "black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia",
    "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua",
        
    "above", "absolute", "activeborder", "activecaption", "afar",
    "after-white-space", "ahead", "alias", "all", "all-scroll", "alternate",
    "always", "amharic", "amharic-abegede", "antialiased", "appworkspace",
    "arabic-indic", "armenian", "asterisks", "auto", "avoid", "background",
    "backwards", "baseline", "below", "bidi-override", "binary", "bengali",
    "blink", "block", "block-axis", "bold", "bolder", "border", "border-box",
    "both", "bottom", "break-all", "break-word", "button", "button-bevel",
    "buttonface", "buttonhighlight", "buttonshadow", "buttontext", "cambodian",
    "capitalize", "caps-lock-indicator", "caption", "captiontext", "caret",
    "cell", "center", "checkbox", "circle", "cjk-earthly-branch",
    "cjk-heavenly-stem", "cjk-ideographic", "clear", "clip", "close-quote",
    "col-resize", "collapse", "compact", "condensed", "contain", "content",
    "content-box", "context-menu", "continuous", "copy", "cover", "crop",
    "cross", "crosshair", "currentcolor", "cursive", "dashed", "decimal",
    "decimal-leading-zero", "default", "default-button", "destination-atop",
    "destination-in", "destination-out", "destination-over", "devanagari",
    "disc", "discard", "document", "dot-dash", "dot-dot-dash", "dotted",
    "double", "down", "e-resize", "ease", "ease-in", "ease-in-out", "ease-out",
    "element", "ellipsis", "embed", "end", "ethiopic", "ethiopic-abegede",
    "ethiopic-abegede-am-et", "ethiopic-abegede-gez", "ethiopic-abegede-ti-er",
    "ethiopic-abegede-ti-et", "ethiopic-halehame-aa-er",
    "ethiopic-halehame-aa-et", "ethiopic-halehame-am-et",
    "ethiopic-halehame-gez", "ethiopic-halehame-om-et",
    "ethiopic-halehame-sid-et", "ethiopic-halehame-so-et",
    "ethiopic-halehame-ti-er", "ethiopic-halehame-ti-et",
    "ethiopic-halehame-tig", "ew-resize", "expanded", "extra-condensed",
    "extra-expanded", "fantasy", "fast", "fill", "fixed", "flat", "footnotes",
    "forwards", "from", "geometricPrecision", "georgian", "graytext", "groove",
    "gujarati", "gurmukhi", "hand", "hangul", "hangul-consonant", "hebrew",
    "help", "hidden", "hide", "higher", "highlight", "highlighttext",
    "hiragana", "hiragana-iroha", "horizontal", "hsl", "hsla", "icon", "ignore",
    "inactiveborder", "inactivecaption", "inactivecaptiontext", "infinite",
    "infobackground", "infotext", "inherit", "initial", "inline", "inline-axis",
    "inline-block", "inline-table", "inset", "inside", "intrinsic", "invert",
    "italic", "justify", "kannada", "katakana", "katakana-iroha", "khmer",
    "landscape", "lao", "large", "larger", "left", "level", "lighter",
    "line-through", "linear", "lines", "list-item", "listbox", "listitem",
    "local", "logical", "loud", "lower", "lower-alpha", "lower-armenian",
    "lower-greek", "lower-hexadecimal", "lower-latin", "lower-norwegian",
    "lower-roman", "lowercase", "ltr", "malayalam", "match",
    "media-controls-background", "media-current-time-display",
    "media-fullscreen-button", "media-mute-button", "media-play-button",
    "media-return-to-realtime-button", "media-rewind-button",
    "media-seek-back-button", "media-seek-forward-button", "media-slider",
    "media-sliderthumb", "media-time-remaining-display", "media-volume-slider",
    "media-volume-slider-container", "media-volume-sliderthumb", "medium",
    "menu", "menulist", "menulist-button", "menulist-text",
    "menulist-textfield", "menutext", "message-box", "middle", "min-intrinsic",
    "mix", "mongolian", "monospace", "move", "multiple", "myanmar", "n-resize",
    "narrower", "ne-resize", "nesw-resize", "no-close-quote", "no-drop",
    "no-open-quote", "no-repeat", "none", "normal", "not-allowed", "nowrap",
    "ns-resize", "nw-resize", "nwse-resize", "oblique", "octal", "open-quote",
    "optimizeLegibility", "optimizeSpeed", "oriya", "oromo", "outset",
    "outside", "overlay", "overline", "padding", "padding-box", "painted",
    "paused", "persian", "plus-darker", "plus-lighter", "pointer", "portrait",
    "pre", "pre-line", "pre-wrap", "preserve-3d", "progress", "push-button",
    "radio", "read-only", "read-write", "read-write-plaintext-only", "relative",
    "repeat", "repeat-x", "repeat-y", "reset", "reverse", "rgb", "rgba",
    "ridge", "right", "round", "row-resize", "rtl", "run-in", "running",
    "s-resize", "sans-serif", "scroll", "scrollbar", "se-resize", "searchfield",
    "searchfield-cancel-button", "searchfield-decoration",
    "searchfield-results-button", "searchfield-results-decoration",
    "semi-condensed", "semi-expanded", "separate", "serif", "show", "sidama",
    "single", "skip-white-space", "slide", "slider-horizontal",
    "slider-vertical", "sliderthumb-horizontal", "sliderthumb-vertical", "slow",
    "small", "small-caps", "small-caption", "smaller", "solid", "somali",
    "source-atop", "source-in", "source-out", "source-over", "space", "square",
    "square-button", "start", "static", "status-bar", "stretch", "stroke",
    "sub", "subpixel-antialiased", "super", "sw-resize", "table",
    "table-caption", "table-cell", "table-column", "table-column-group",
    "table-footer-group", "table-header-group", "table-row", "table-row-group",
    "telugu", "text", "text-bottom", "text-top", "textarea", "textfield", "thai",
    "thick", "thin", "threeddarkshadow", "threedface", "threedhighlight",
    "threedlightshadow", "threedshadow", "tibetan", "tigre", "tigrinya-er",
    "tigrinya-er-abegede", "tigrinya-et", "tigrinya-et-abegede", "to", "top",
    "transparent", "ultra-condensed", "ultra-expanded", "underline", "up",
    "upper-alpha", "upper-armenian", "upper-greek", "upper-hexadecimal",
    "upper-latin", "upper-norwegian", "upper-roman", "uppercase", "urdu", "url",
    "vertical", "vertical-text", "visible", "visibleFill", "visiblePainted",
    "visibleStroke", "visual", "w-resize", "wait", "wave", "white", "wider",
    "window", "windowframe", "windowtext", "x-large", "x-small", "xor",
    "xx-large", "xx-small"
    ];
    
    var processingKeywords = (
        'PImage PFont PGraphics color boolean float int char byte String short long Array HashMap ' +
        'Object String Table XML ArrayList PVector ' + 
        'for while do try catch if else switch synchronized ' + 
        'import true volatile static strictfp transient abstract assert extends static native new null interface ' +
        'implements import instanceof const final false enum super this throw case void this null ' + 
        'break continue return default finally class throws case private public package protected return ' +
        'mouseX mouseY height width frameCount frameRate keyPressed key pixels mousePressed pmouseX pmouseY ' + 
        'TWO_PI PI HALF_PI QUATER_PI CENTER LEFT RIGHT UP DOWN P3D RGB HSB TRIANGLE_STRIP CENTER_RADIUS CORNER CLOSE TRIANGLES ' +
    
        'join match matchAll nf nfc nfp nfs split splitTokens trim ' +
        'append arrayCopy concat expand reverse shorten sort splice subset ' +
        'add sub get set random2D random3D fromAngle mag magSq ' +
        'mult div dist dot cross normalize limit setMag heading rotate ' +
        'lerp angleBetween array ' + 
    
        'setup draw size strokeWeight stroke curve curveTightness background pushMatrix popMatrix translate ' +
        'abs ceil constrain dist exp floor lerp log mag map max min norm pow round sq sqrt acos asin atan atan2 degrees radians sin tan' +
        'noise noiseDetail noiseSeed random randomSeed pushMatrix popMatrix applyMatrix printMatrix resetMatrix' +
        'rotate rotateX rotateY rotateZ scale shearX shearY translate ' +
        'ambientLight directionalLight lightFalloff lights lightSpecular noLights normal pointLight spotLight ' +
        'beginCamera camera endCamera frustum ortho perspective printCamera printProjection' +
        'modelX modelY modelZ screenX screenY screenZ ambient emissive shininess specular ' +
        'alpha blue red green brightness hue lerpColor saturation createImage requestImage ' +
        'texture textureMode textureWrap blend copy filter loadPixels pixels updatePixels ' +
        'createFont loadFont text textFont textAlign textLearning textMode textSize textWidth textAscent textDescent ' +
        'rotate radians rect quad bezierCurve curveVertex vertex endShape noFill ' +
        'noStroke nf fill get bezierVertex ellipse dist mouseMoved sin smooth random colorMode ' +
        'point line noLoop loop redraw beginDraw endDraw image createGraphics triangle quad ' +
        'arc cos bezier loadImage scale println print ellipseMode atan2 atan ' +
        'updatePixels noise textFont textAlign text tint abs constrain createImage saturation ' +
        'brightness rectMode mouseDragged mouseReleased millis map hour minute second link length beginShape '
        ).split(' ');
            
    var coffeescriptKeywords = ("and break catch class continue delete do else extends false finally for " +
        "if in instanceof isnt new no not null of off on or return switch then throw true try typeof until void while with yes").split(" ");


    
})();
