"use strict";
// (6 + 4) * 2 / (1.1 + 2.9)
var Parser = /** @class */ (function () {
    function Parser(expression) {
        this.ASTStack = [];
        this.tokens = this.walkToken(expression);
    }
    Parser.prototype.walkToken = function (expression) {
        var baseToken = function (char) { return function (pair, binary) {
            if (pair === void 0) { pair = false; }
            if (binary === void 0) { binary = false; }
            return ({
                content: char,
                pair: pair,
                binary: binary
            });
        }; };
        var pairToken = function (char) { return baseToken(char)(true, false); };
        var binaryToken = function (char) {
            return baseToken(char)(false, true);
        };
        var tokens = [];
        var tmpTokens = [];
        var isStash = false;
        for (var _i = 0, _a = Object.keys(expression); _i < _a.length; _i++) {
            var index = _a[_i];
            var char = expression[+index];
            var next = expression[+index + 1];
            if (/\s/.test(char)) {
                continue;
            }
            if (/[^\d\.]/.test(char) && tmpTokens.length) {
                isStash = false;
                tokens.push(baseToken(tmpTokens.join(''))());
                tmpTokens = [];
            }
            if (/[\(\)]/.test(char)) {
                tokens.push(pairToken(char));
            }
            else if (/[+\-*\/]/.test(char)) {
                tokens.push(binaryToken(char));
            }
            else if (char === '.') {
                tmpTokens.push(char);
            }
            else if (next && next === '.') {
                var last = expression[+index + 2];
                isStash = true;
                if (!last) {
                    throw new Error('Unexpected expression');
                }
                tmpTokens.push(char);
            }
            else {
                if (isStash) {
                    tmpTokens.push(char);
                    continue;
                }
                tokens.push(baseToken(char)());
            }
        }
        return tokens;
    };
    Parser.prototype.peekLast = function (arr) {
        return arr[arr.length - 1];
    };
    Parser.prototype.reckonBinary = function (targetArr, targetContent) {
        var arr = targetArr.slice();
        if (!/[\(\)]/.test(targetContent.content)) {
            arr.push(targetContent);
            arr = arr.slice(0, arr.length - 3).concat([
                {
                    content: eval(arr.slice(arr.length - 3, arr.length).map(function (_a) {
                        var content = _a.content;
                        return content;
                    }).join("")),
                    pair: false,
                    binary: false
                }
            ]);
            return arr;
        }
        return arr.concat([targetContent]);
    };
    Parser.prototype.reckonPair = function (targetArr, targetContent) {
        var arr = targetArr.slice();
        if (/\)/.test(targetContent.content)) {
            arr.push(targetContent);
            var leftPairIndex = arr.findIndex(function (_a) {
                var content = _a.content;
                return /\(/.test(content);
            });
            if (leftPairIndex === undefined)
                throw new Error("Unexpected expression!");
            arr = arr.slice(0, leftPairIndex).concat([
                {
                    content: eval(arr.slice(leftPairIndex + 1, arr.length - 1).map(function (_a) {
                        var content = _a.content;
                        return content;
                    }).join("")),
                    pair: false,
                    binary: false
                }
            ]);
            if (arr.length > 1) {
                var num = arr.pop();
                return this.reckonBinary(arr, num);
            }
            return arr;
        }
        return arr.concat([targetContent]);
    };
    Parser.prototype.reckon = function () {
        for (var _i = 0, _a = this.tokens; _i < _a.length; _i++) {
            var token = _a[_i];
            var pair = token.pair;
            var lastItem = this.peekLast(this.ASTStack);
            if (lastItem && lastItem.binary) {
                this.ASTStack = this.reckonBinary(this.ASTStack, token);
            }
            else if (pair) {
                this.ASTStack = this.reckonPair(this.ASTStack, token);
            }
            else {
                this.ASTStack.push(token);
            }
        }
        return +this.ASTStack.map(function (item) { return item.content; })[0];
    };
    Parser.prototype.getResult = function () {
        return this.reckon();
    };
    return Parser;
}());
var result = new Parser("(6 + 4) * 2 / (1.1 + 2.9)").getResult();
