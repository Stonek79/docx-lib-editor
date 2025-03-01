import { ParagraphParser } from '../../../src/utils/DocxParser/parsers/document/paragraph-parser'
import { DomType } from '../../../src/types/document'

describe('ParagraphParser', () => {
    let parser: ParagraphParser

    beforeEach(() => {
        parser = new ParagraphParser()
    })

    describe('canParse', () => {
        it('should identify paragraph element', () => {
            expect(parser.canParse({ 'w:p': {} })).toBe(true)
        })

        it('should reject non-paragraph element', () => {
            expect(parser.canParse({ 'w:r': {} })).toBe(false)
        })
    })

    describe('parse', () => {
        it('should parse simple paragraph', () => {
            const element = {
                'w:p': {
                    'w:r': {
                        'w:t': {
                            '#text': 'Hello World',
                        },
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Paragraph,
                content: [
                    {
                        type: DomType.Run,
                        content: [
                            {
                                type: DomType.Text,
                                text: 'Hello World',
                            },
                        ],
                        properties: {},
                    },
                ],
                properties: {},
            })
        })

        it('should parse paragraph with multiple runs', () => {
            const element = {
                'w:p': {
                    'w:r': [
                        {
                            'w:t': {
                                '#text': 'Hello',
                            },
                        },
                        {
                            'w:t': {
                                '#text': ' World',
                            },
                        },
                    ],
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Paragraph,
                content: [
                    {
                        type: DomType.Run,
                        content: [
                            {
                                type: DomType.Text,
                                text: 'Hello',
                            },
                        ],
                        properties: {},
                    },
                    {
                        type: DomType.Run,
                        content: [
                            {
                                type: DomType.Text,
                                text: ' World',
                            },
                        ],
                        properties: {},
                    },
                ],
                properties: {},
            })
        })

        it('should parse paragraph with properties', () => {
            const element = {
                'w:p': {
                    'w:pPr': {
                        'w:jc': {
                            '@_w:val': 'center',
                        },
                        'w:pStyle': {
                            '@_w:val': 'Heading1',
                        },
                    },
                    'w:r': {
                        'w:t': {
                            '#text': 'Centered Heading',
                        },
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Paragraph,
                content: [
                    {
                        type: DomType.Run,
                        content: [
                            {
                                type: DomType.Text,
                                text: 'Centered Heading',
                            },
                        ],
                        properties: {},
                    },
                ],
                properties: {
                    justification: 'center',
                    styleId: 'Heading1',
                    indentation: {
                        left: 0,
                        right: 0,
                        hanging: 0,
                        firstLine: 0
                    },
                    spacing: {
                        before: 0,
                        after: 0,
                        line: 0,
                        lineRule: undefined
                    },
                    outlineLevel: 0
                },
            })
        })

        it('should handle empty paragraph', () => {
            const element = {
                'w:p': {},
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Paragraph,
                content: [],
                properties: {},
            })
        })

        it('should handle paragraph without w:p wrapper', () => {
            const element = {
                'w:r': {
                    'w:t': {
                        '#text': 'Direct Content',
                    },
                },
            }

            const result = parser.parse(element)

            expect(result).toEqual({
                type: DomType.Paragraph,
                content: [
                    {
                        type: DomType.Run,
                        content: [
                            {
                                type: DomType.Text,
                                text: 'Direct Content',
                            },
                        ],
                        properties: {},
                    },
                ],
                properties: {},
            })
        })
    })
})
