CodeMirror.newFoldFunction = function(cm, pos, rangeFinder, widget) {
    if (widget == null) widget = "...";
    if (typeof widget == "string") {
        var text = document.createTextNode(widget);
        widget = document.createElement("span");
        widget.appendChild(text);
        widget.className = "CodeMirror-foldmarker";
    }
    if (rangeFinder) {
        if (typeof pos == "number") pos = CodeMirror.Pos(pos, 0);
        var range = rangeFinder(cm, pos);
    
        if (!range) return false;

        var present = cm.findMarksAt(range.from), cleared = 0;
        for (var i = 0; i < present.length; ++i) {
            if (present[i].__isFold) {
                ++cleared;
                present[i].clear();
            }
        }
        if (cleared) return false;

        var myWidget = widget.cloneNode(true);
        CodeMirror.on(myWidget, "mousedown", function() {
            myRange.clear();
        });
        var myRange = cm.markText(range.from, range.to, {
            replacedWith: myWidget,
            clearOnEnter: true,
            __isFold: true
        });
        return true;
    }
    return false;
};
