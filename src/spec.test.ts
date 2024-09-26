import { describe } from 'mocha'
import { Customizations, parseDevcontainerStr } from './spec'
import { DevContainerConfig } from './spec_v2'
import assert from 'node:assert'
import * as jsonc from "jsonc-parser";

type TestCase = {
    desc: string,
    configFile: string,
    expect: Customizations | jsonc.ParseErrorCode[],
}

function runTests(testCases: TestCase[]) {
    for (const testCase of testCases) {
        it(testCase.desc, () => {
            const actual = parseDevcontainerStr(testCase.configFile);
            if ("extensions" in actual) {
                assert.deepEqual(actual, testCase.expect);
            } else {
                const codes = (actual as jsonc.ParseError[]).map(e => e.error);
                assert.deepEqual(codes, testCase.expect);
            }
        })
    }
}

describe("'customizations' format", () => {

    describe("'settings' format", () => {
        const cases: TestCase[] = [
            {
                desc: "empty",
                configFile: "{}",
                expect: {
                    settings: {},
                    extensions: [],
                    registries: {},
                },
            },
            {
                desc: "invalid jsonc format",
                configFile: "}",
                expect: [jsonc.ParseErrorCode.ValueExpected],
            },
            {
                desc: "base types are supported",
                configFile: `
                {
                    "customizations": {
                        "EDITOR": {
                            "settings": {
                                "number": 1.1,
                                "boolean": true,
                                "string": "devcontainer",
                                "object": {
                                    "number": 1,
                                }
                            }
                        }
                    }
                }
                `,
                expect: {
                    settings: {
                        number: 1.1,
                        boolean: true,
                        string: "devcontainer",
                        object: {
                            number: 1
                        }
                    },
                    extensions: [],
                    registries: {},
                },
            }
        ];
        runTests(cases.map(tc => ({
            ...tc,
            desc: `(vscode) ${tc.desc}`,
            configFile: tc.configFile.replaceAll("EDITOR", "vscode"),
        })));
        runTests(cases.map(tc => ({
            ...tc,
            desc: `(codium) ${tc.desc}`,
            configFile: tc.configFile.replaceAll("EDITOR", "vscodium"),
        })));
    });

    // describe("vscode extensions", () => {
    //     runTests([
    //         {
    //             desc: "empty",
    //             configFile: "{}",
    //             expect: {
    //                 settings: {},
    //                 registries: {},
    //                 extensions: [],
    //             }
    //         },
    //         {
    //             desc: "not an array",
                // configFile: `
                // {
                //     "customizations": {
                //         "vscode": {
                //             "extensions": {}
                //         }
                //     }
                // }
                // `,
    //             expect: [jsonc.ParseErrorCode.CloseBraceExpected]
    //         }
    //     ])
    // })

    describe("zod", () => {
        const data = `
        {
            "customizations": {
                "vscode": {
                    "extensions": []
                }
            }
        }
        `
        const result = DevContainerConfig.safeParse(jsonc.parse(data));
        console.log(result.error);
    })
})

