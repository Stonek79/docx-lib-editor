import { RunParser } from '../../../src/utils/DocxParser/parsers/document/run-parser'
import { DomType } from '../../../src/types/document'

describe('RunParser', () => {
    let parser: RunParser

    beforeEach(() => {
        parser = new RunParser()
    })

    describe('canParse', () => {
        it('should identify run element', () => {
            expect(parser.canParse({ 'w:r': {} })).toBe(true)
        })

        it('should reject non-run element', () => {
            expect(parser.canParse({ 'w:p': {} })).toBe(false)
        })
    })

    describe('parse', () => {
        it('should parse simple text run', () => {
            const element = {
                'w:r': {
                    'w:t': {
                        '#text': 'Hello World',
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Run,
                content: [
                    {
                        type: DomType.Text,
                        text: 'Hello World',
                    },
                ],
                properties: {},
            })
        })

        it('should parse run with symbol', () => {
            const element = {
                'w:r': {
                    'w:sym': {
                        '@_font': 'Wingdings',
                        '@_char': 'F0E2',
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Run,
                content: [
                    {
                        type: DomType.Symbol,
                        font: 'Wingdings',
                        char: 'F0E2',
                    },
                ],
                properties: {},
            })
        })

        it('should parse run with properties', () => {
            const element = {
                'w:r': {
                    'w:rPr': {
                        'w:b': {},
                        'w:i': {},
                    },
                    'w:t': {
                        '#text': 'Formatted Text',
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Run,
                content: [
                    {
                        type: DomType.Text,
                        text: 'Formatted Text',
                    },
                ],
                properties: {
                    bold: true,
                    italic: true,
                    color: undefined,
                    fontSize: 0,
                    highlight: undefined,
                    styleId: undefined,
                    underline: undefined,
                },
            })
        })

        it('should handle empty run', () => {
            const element = {
                'w:r': {},
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Run,
                content: [],
                properties: {},
            })
        })

        it('should handle symbol with missing attributes', () => {
            const element = {
                'w:r': {
                    'w:sym': {},
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Run,
                content: [
                    {
                        type: DomType.Symbol,
                        font: '',
                        char: '',
                    },
                ],
                properties: {},
            })
        })
    })
})
