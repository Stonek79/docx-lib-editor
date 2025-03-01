import { FieldParser } from '../../src/utils/DocxParser/parsers/field/field-parser'
import { DomType } from '../../src/types/document'

describe('FieldParser', () => {
    let parser: FieldParser

    beforeEach(() => {
        parser = new FieldParser()
    })

    describe('Simple Fields', () => {
        it('should check if element is simple field', () => {
            const element = {
                'w:fldSimple': {}
            }
            expect(parser.isSimpleField(element)).toBe(true)

            const nonFieldElement = {
                'w:p': {}
            }
            expect(parser.isSimpleField(nonFieldElement)).toBe(false)
        })

        it('should parse simple field with single run', () => {
            const element = {
                'w:fldSimple': {
                    '@_w:instr': ' PAGE ',
                    'w:r': {
                        'w:t': {
                            '@_xml:space': 'preserve',
                            '#text': '1'
                        }
                    }
                }
            }

            const contentParser = (el: any) => {
                if (el['w:t']?.['#text']) {
                    return {
                        type: DomType.Text,
                        text: el['w:t']['#text']
                    }
                }
                return null
            }

            const result = parser.parseSimpleField(element, contentParser)

            expect(result).toEqual({
                type: DomType.FIELD,
                fieldType: 'PAGE',
                instruction: ' PAGE ',
                result: [{
                    type: DomType.Text,
                    text: '1'
                }]
            })
        })

        it('should parse simple field with multiple runs', () => {
            const element = {
                'w:fldSimple': {
                    '@_w:instr': ' REF bookmark \\h',
                    'w:r': [
                        {
                            'w:t': {
                                '@_xml:space': 'preserve',
                                '#text': 'Chapter '
                            }
                        },
                        {
                            'w:t': {
                                '@_xml:space': 'preserve',
                                '#text': '1'
                            }
                        }
                    ]
                }
            }

            const contentParser = (el: any) => {
                if (el['w:t']?.['#text']) {
                    return {
                        type: DomType.Text,
                        text: el['w:t']['#text']
                    }
                }
                return null
            }

            const result = parser.parseSimpleField(element, contentParser)

            expect(result).toEqual({
                type: DomType.FIELD,
                fieldType: 'REF',
                instruction: ' REF bookmark \\h',
                result: [
                    {
                        type: DomType.Text,
                        text: 'Chapter '
                    },
                    {
                        type: DomType.Text,
                        text: '1'
                    }
                ]
            })
        })

        it('should handle empty simple field', () => {
            const element = {
                'w:fldSimple': {
                    '@_w:instr': ' DATE '
                }
            }

            const contentParser = (el: any) => null

            const result = parser.parseSimpleField(element, contentParser)

            expect(result).toEqual({
                type: DomType.FIELD,
                fieldType: 'DATE',
                instruction: ' DATE ',
                result: []
            })
        })
    })

    describe('Complex Fields', () => {
        it('should check if element is complex field start/end', () => {
            const startElement = {
                'w:fldChar': {
                    '@_w:fldCharType': 'begin'
                }
            }
            expect(parser.isComplexFieldStart(startElement)).toBe(true)

            const endElement = {
                'w:fldChar': {
                    '@_w:fldCharType': 'end'
                }
            }
            expect(parser.isComplexFieldEnd(endElement)).toBe(true)

            const nonFieldElement = {
                'w:p': {}
            }
            expect(parser.isComplexFieldStart(nonFieldElement)).toBeFalsy()
            expect(parser.isComplexFieldEnd(nonFieldElement)).toBeFalsy()
        })

        it('should parse complex field', () => {
            const elements = [
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'begin'
                    }
                },
                {
                    'w:instrText': ' TOC \\o "1-3" \\h \\z \\u '
                },
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'separate'
                    }
                },
                {
                    'w:t': {
                        '@_xml:space': 'preserve',
                        '#text': 'Table of Contents'
                    }
                },
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'end'
                    }
                }
            ]

            const contentParser = (el: any) => {
                if (el['w:t']?.['#text']) {
                    return {
                        type: DomType.Text,
                        text: el['w:t']['#text']
                    }
                }
                return null
            }

            const result = parser.parseComplexField(elements, contentParser)

            expect(result).toEqual({
                type: DomType.FIELD,
                fieldType: 'TOC',
                instruction: 'TOC \\o "1-3" \\h \\z \\u',
                result: [{
                    type: DomType.Text,
                    text: 'Table of Contents'
                }]
            })
        })

        it('should handle empty complex field', () => {
            const elements = [
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'begin'
                    }
                },
                {
                    'w:instrText': ' HYPERLINK "http://example.com" '
                },
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'separate'
                    }
                },
                {
                    'w:fldChar': {
                        '@_w:fldCharType': 'end'
                    }
                }
            ]

            const contentParser = (el: any) => null

            const result = parser.parseComplexField(elements, contentParser)

            expect(result).toEqual({
                type: DomType.FIELD,
                fieldType: 'HYPERLINK',
                instruction: 'HYPERLINK "http://example.com"',
                result: []
            })
        })
    })
})
