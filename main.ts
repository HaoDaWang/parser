// (6 + 4) * 2 / (1.1 + 2.9)

interface Token {
    content: string;
    pair: boolean;
    binary: boolean;
}

interface TokenMap {
    [index: string]: Token;
}

class Parser {
    private tokens: Token[];
    private ASTStack: Token[] = [];

    private walkToken(expression: string): Token[] {
        const baseToken = (char: string) => (
            pair: boolean = false,
            binary: boolean = false
        ): Token => ({
            content: char,
            pair,
            binary
        });
        const pairToken = (char: string): Token => baseToken(char)(true, false);
        const binaryToken = (char: string): Token =>
            baseToken(char)(false, true);
        const tokens: Token[] = [];
        let tmpTokens:string[] = []

        let isStash = false

        for (const index of Object.keys(expression)) {
            const char = expression[+index]
            const next = expression[+index + 1]

            if (/\s/.test(char)) {
                continue;
            }

            if(/[^\d\.]/.test(char) && tmpTokens.length){
                isStash = false
                tokens.push(baseToken(tmpTokens.join(''))())
                tmpTokens = []
            }

            if (/[\(\)]/.test(char)) {
                tokens.push(pairToken(char));
            } else if (/[+\-*\/]/.test(char)) {
                tokens.push(binaryToken(char));
            } 
            else if(char === '.'){
                tmpTokens.push(char)
            }
            else if(next && next === '.'){
                const last = expression[+index + 2]

                isStash = true

                if(!last){
                    throw new Error('Unexpected expression')
                }

                tmpTokens.push(char)
            }
            else {
                if(isStash){
                    tmpTokens.push(char)
                    continue
                }

                tokens.push(baseToken(char)());
            }
        }

        return tokens;
    }

    constructor(expression: string) {
        this.tokens = this.walkToken(expression);
    }

    private peekLast<T extends Token>(arr: T[]): T {
        return arr[arr.length - 1];
    }

    private reckonBinary(targetArr: Token[], targetContent: Token): Token[] {
        let arr = targetArr.slice();

        if (!/[\(\)]/.test(targetContent.content)) {
            arr.push(targetContent);

            arr = [
                ...arr.slice(0, arr.length - 3),
                {
                    content: eval(arr.slice(arr.length - 3, arr.length).map(({content}) => content).join("")),
                    pair: false,
                    binary: false
                }
            ];

            return arr;
        }

        return [...arr, targetContent];
    }

    private reckonPair(targetArr: Token[], targetContent: Token): Token[] {
        let arr = targetArr.slice();

        if (/\)/.test(targetContent.content)) {
            arr.push(targetContent)
            const leftPairIndex = arr.findIndex(({ content }) =>
                /\(/.test(content)
            );

            if (leftPairIndex === undefined) throw new Error("Unexpected expression!");

            arr = [
                ...arr.slice(0, leftPairIndex),
                {
                    content: eval(arr.slice(leftPairIndex + 1, arr.length - 1).map(({content}) => content).join("")),
                    pair: false,
                    binary: false
                }
            ];

            if (arr.length > 1) {
                const num = arr.pop()!;

                return this.reckonBinary(arr, num);
            }

            return arr
        }

        return [...arr, targetContent];
    }

    private reckon(): number {
        for (const token of this.tokens) {
            const { pair } = token;
            const lastItem = this.peekLast(this.ASTStack)

            if (lastItem && lastItem.binary) {
                this.ASTStack = this.reckonBinary(this.ASTStack, token);
            } else if (pair) {
                this.ASTStack = this.reckonPair(this.ASTStack, token);
            } else {
                this.ASTStack.push(token)
            }
        }

        return +this.ASTStack.map(item => item.content)[0];
    }

    getResult(): number {
        return this.reckon();
    }
}


let result = new Parser("(6 + 4) * 2 / (1.1 + 2.9)").getResult()