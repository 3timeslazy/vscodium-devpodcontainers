import { describe } from 'mocha'
import { Customizations, Settings, Extension,  parseCustomizations } from './customizations'
import assert from 'node:assert'

interface TestCase<T> {
    desc: string,
    configFile: string,
    expect: T | string,
}

function runTests<T, S = keyof Customizations>(key: S, testCases: TestCase<T>[]) {
    for (const testCase of testCases) {
        it(testCase.desc, () => {
            const actual = parseCustomizations(testCase.configFile);
            if (actual instanceof Error) {
                assert.deepEqual(actual.message, testCase.expect);
            } else {
                const full: any = {
                    settings: {},
                    extensions: [],
                };
                full[key] = testCase.expect;
                assert.deepEqual(actual, full);
            }
        })
    }
}

describe("'customizations' format", () => {

    describe("*.settings", () => {
        const cases: TestCase<Settings>[] = [
            {
                desc: "empty",
                configFile: "{}",
                expect: {},
            },
            {
                desc: "invalid jsonc format",
                configFile: "}",
                expect: "devcontainer.json must be a valid jsonc file",
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
                    number: 1.1,
                    boolean: true,
                    string: "devcontainer",
                    object: {
                        number: 1
                    }
                }
            }
        ];
        runTests("settings", cases.map(tc => ({
            ...tc,
            desc: `(vscode) ${tc.desc}`,
            configFile: tc.configFile.replaceAll("EDITOR", "vscode"),
        })));
        // runTests(cases.map(tc => ({
        //     ...tc,
        //     desc: `(codium) ${tc.desc}`,
        //     configFile: tc.configFile.replaceAll("EDITOR", "vscodium"),
        // })));
    });

    describe("vscode.extensions", () => {
        runTests<Extension[]>("extensions", [
            {
                desc: "empty",
                configFile: "{}",
                expect: []
            },
            {
                desc: "valid list",
                configFile: `
                {
                    "customizations": {
                        "vscode": {
                            "extensions": ["golang.Go"]
                        }
                    }
                }
                `,
                expect: [{
                    id: "golang.Go"
                }]
            }
        ])
    })
})

