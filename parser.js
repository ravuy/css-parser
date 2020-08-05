export default function CSSToConfig() {
    // const whitespace = /[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    const aroundWhitespaces = /[\s\uFEFF\xA0]+[^*#.\w!-{}]|[\s\uFEFF\xA0]+$/gi;
    const importQuery = /@import .*?/gi;
    const supportQuery = /((@supports [\s\S]*?){([\s\S]*?}\s*?)})/gi;
    const commentQuery = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//gi;
    const cssQuery = /([\s\S]*?){([\s\S]*?)}{1,2}/gi;
    const selectorQuery = /([\s\S]*?){([\s\S]*?)}/gi;
    const ruleCaseQuery = /-([a-zA-Z])/gi;

    // const supportStatements = [];

    this.init = function() {
        String.prototype.trimWhitespace = function() {
            return this.replace(aroundWhitespaces, '');
        };
        String.prototype.convertToRuleCase = function() {
            return this.replace(ruleCaseQuery, m => m[1].toUpperCase());
        }
    };
    this.init();
    let isEmpty = function (arg) {
        return typeof arg == 'undefined' || arg.length === 0 || !arg;
    };
    let parseStyle = (rules) => {
        let split = rules.split(';').filter(Boolean);
        let temp = {};
        split.map((rule) => rule.split(':')).map(arr => { if (arr[0] && arr[1]) return temp[arr[0].convertToRuleCase()] = arr[1].trim(); else return null; });
        return temp;
    };
    let parseMedia = (rules) => {
        let css = [];
        let ind = rules.indexOf('{');
        let end = rules.lastIndexOf('}');
        rules = rules.substring(ind+1, end);
        while(true) {
            let arr = selectorQuery.exec(rules);
            if (arr === null) break;

            css.push({ selector: arr[1].trim(), style: parseStyle(arr[2]) });
        }
        return css;
    };
    let stripComments = (css) => {
        return css.replace(commentQuery, '');
    };
    let stripImports = (css) => {
        return css.replace(importQuery, '');
    };
    let stripSupports = (css) => {
        return css.replace(supportQuery, '');
    };

    let clear_out = (css) => {
        css = css.trimWhitespace();
        css = stripComments(css);
        css = stripImports(css);
        css = stripSupports(css);
        return css;
    };

    this.toJSON = (contents, args) => {
        let t0 = performance.now();
        if (!contents) return [];
        contents = clear_out(contents);

        let css = [];
        let mediaStart;
        let mediaEnd;
        let mediaArr;
        while (true) {
            let arr = cssQuery.exec(contents);
            if (arr === null) break;

            const mediaFlag = arr[0].startsWith('@media');

            if (mediaFlag) {
                mediaStart = arr.index;
                mediaArr = arr[0].substring(0, arr[0].indexOf('{'));
            } else if (arr[0].endsWith('}}')) {
                mediaEnd = cssQuery.lastIndex;
            }
            if (mediaStart && mediaEnd && (mediaStart !== mediaEnd)) {
                css.push({ selector: mediaArr.trim(), style: parseMedia(contents.slice(mediaStart, mediaEnd))});
                mediaStart = undefined;
                mediaEnd = undefined;

            } else if (arr[2] !== '' && !mediaFlag) {
                css.push({ selector: arr[1].trim(), style: parseStyle(arr[2]) });
            }
        }
        let t1 = performance.now();
        console.log('Execution took: ' + (t1-t0) + 'ms');
        return css;
    };

    return this;
};
