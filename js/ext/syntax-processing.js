CodeMirror.defineMode("clike", function(config, parserConfig) {
    var indentUnit = config.indentUnit,
    keywords = parserConfig.keywords || {},
    variables = parserConfig.variables || {},
    constants = parserConfig.constants || {},
    classes = parserConfig.classes || {},
    reserved = parserConfig.reserved || {},
    controls = parserConfig.controls || {},
    hooks = parserConfig.hooks || {},
    multiLineStrings = parserConfig.multiLineStrings;
    var isOperatorChar = /[+\-*&%=<>!?|\/]/;

    var curPunc;

    function tokenBase(stream, state) {
        var ch = stream.next();
        if (hooks[ch]) {
            var result = hooks[ch](stream, state);
            if (result !== false) return result;
        }
        if (ch == '"' || ch == "'") {
            state.tokenize = tokenString(ch);
            return state.tokenize(stream, state);
        }
        if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
            curPunc = ch;
            return null
        }
        if (/\d/.test(ch)) {
            stream.eatWhile(/[\w\.]/);
            return "number";
        }
        if (ch == "/") {
            if (stream.eat("*")) {
                state.tokenize = tokenComment;
                return tokenComment(stream, state);
            }
            if (stream.eat("/")) {
                stream.skipToEnd();
                return "comment";
            }
        }
        if (isOperatorChar.test(ch)) {
            stream.eatWhile(isOperatorChar);
            return "operator";
        }
        stream.eatWhile(/[\w\$_]/);
        var cur = stream.current();
        if (keywords.propertyIsEnumerable(cur)) return "keyword";
        if (variables.propertyIsEnumerable(cur)) return "variable";
        if (constants.propertyIsEnumerable(cur)) return "constant";
        if (classes.propertyIsEnumerable(cur)) return "class";
        if (reserved.propertyIsEnumerable(cur)) return "reserved";
        if (controls.propertyIsEnumerable(cur)) return "control";
        return "word";
    }

    function tokenString(quote) {
        return function(stream, state) {
            var escaped = false, next, end = false;
            while ((next = stream.next()) != null) {
                if (next == quote && !escaped) {
                    end = true;
                    break;
                }
                escaped = !escaped && next == "\\";
            }
            if (end || !(escaped || multiLineStrings))
                state.tokenize = tokenBase;
            return "string";
        };
    }

    function tokenComment(stream, state) {
        var maybeEnd = false, ch;
        while (ch = stream.next()) {
            if (ch == "/" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return "comment";
    }

    function Context(indented, column, type, align, prev) {
        this.indented = indented;
        this.column = column;
        this.type = type;
        this.align = align;
        this.prev = prev;
    }

    function pushContext(state, col, type) {
        return state.context = new Context(state.indented, col, type, null, state.context);
    }
    function popContext(state) {
        return state.context = state.context.prev;
    }

    // Interface

    return {
        startState: function(basecolumn) {
            return {
                tokenize: null,
                context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
                indented: 0,
                startOfLine: true
            };
        },

        token: function(stream, state) {
            var ctx = state.context;
            if (stream.sol()) {
                if (ctx.align == null) ctx.align = false;
                state.indented = stream.indentation();
                state.startOfLine = true;
            }
            if (stream.eatSpace()) return null;
            curPunc = null;
            var style = (state.tokenize || tokenBase)(stream, state);
            if (style == "comment") return style;
            if (ctx.align == null) ctx.align = true;

            if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
            else if (curPunc == "{") pushContext(state, stream.column(), "}");
            else if (curPunc == "[") pushContext(state, stream.column(), "]");
            else if (curPunc == "(") pushContext(state, stream.column(), ")");
            else if (curPunc == "}") {
                if (ctx.type == "statement") ctx = popContext(state);
                if (ctx.type == "}") ctx = popContext(state);
                if (ctx.type == "statement") ctx = popContext(state);
            }
            else if (curPunc == ctx.type) popContext(state);
            else if (ctx.type == "}" || ctx.type == "top") pushContext(state, stream.column(), "statement");
            state.startOfLine = false;
            return style;
        },

        indent: function(state, textAfter) {
            if (state.tokenize != tokenBase && state.tokenize != null) return 0;
            var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
            if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
            else if (ctx.align) return ctx.column + (closing ? 0 : 1);
            else return ctx.indented + (closing ? 0 : indentUnit);
        },

        electricChars: "{}"
    };
});

(function() {
    function words(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }
    var cKeywords = "auto if break int case long char register continue return default short do sizeof " +
    "double static else struct entry switch extern typedef float union for unsigned " +
    "goto while enum void const signed volatile";

    function cppHook(stream, state) {
        if (!state.startOfLine) return false;
        stream.skipToEnd();
        return "meta";
    }

    // C#-style strings where "" escapes a quote.
    function tokenAtString(stream, state) {
        var next;
        while ((next = stream.next()) != null) {
            if (next == '"' && !stream.eat('"')) {
                state.tokenize = null;
                break;
            }
        }
        return "string";
    }
  
    CodeMirror.defineMIME("text/processing", {
        name: "clike",
        keywords: words('join match matchAll nf nfc nfp nfs split splitTokens trim ' +
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
        'brightness rectMode mouseDragged mouseReleased millis map hour minute second link length beginShape '),
        classes: words('PImage PFont PGraphics color boolean float int char byte String short long Array HashMap ' +
            'Object String Table XML ArrayList PVector'),
        controls: words('for while do try catch if else switch synchronized'),
        reserved: words('import true volatile static strictfp transient abstract assert extends static native new null' + 
            'interface implements import instanceof const final false enum super this throw case void this null ' + 
            'break continue return default finally class throws case private public package protected return'),
        variables: words('mouseX mouseY height width frameCount frameRate keyPressed key pixels mousePressed pmouseX pmouseY'),
        constants: words('TWO_PI PI HALF_PI QUATER_PI CENTER LEFT RIGHT UP DOWN P3D RGB HSB TRIANGLE_STRIP CENTER_RADIUS CORNER CLOSE TRIANGLES ' + 
                            'FULLSCREEN'),
        hooks: {
            "@": function(stream, state) {
                stream.eatWhile(/[\w\$_]/);
                return "meta";
            }
        }
    });
  
}());