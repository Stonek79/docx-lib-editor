import { HyperlinkParser } from '../../src/utils/DocxParser/parsers/hyperlink/hyperlink-parser'
import { DomType } from '../../src/types/document'
import { Relationship, RelationshipTypes } from '../../src/types/relationships'

describe('HyperlinkParser', () => {
    let parser: HyperlinkParser

    beforeEach(() => {
        parser = new HyperlinkParser()
    })

    it('should check if element is hyperlink', () => {
        const element = {
            'w:hyperlink': {}
        }
        expect(parser.isHyperlink(element)).toBe(true)

        const nonHyperlinkElement = {
            'w:p': {}
        }
        expect(parser.isHyperlink(nonHyperlinkElement)).toBe(false)
    })

    it('should parse hyperlink with relationship', () => {
        const relationships = new Map<string, Relationship>([
            ['rId1', {
                id: 'rId1',
                type: RelationshipTypes.Hyperlink,
                target: 'https://example.com',
                targetMode: 'External'
            }]
        ])

        const element = {
            'w:hyperlink': {
                '@_r:id': 'rId1',
                '@_w:tooltip': 'Visit Example',
                'w:r': {
                    'w:t': {
                        '@_xml:space': 'preserve',
                        '#text': 'Example Link'
                    }
                }
            }
        }

        const contentParser = (el: any) => ({
            type: DomType.Text,
            text: el['w:t']['#text']
        })

        const result = parser.parse(element, contentParser, relationships)

        expect(result).toEqual({
            type: DomType.HYPERLINK,
            target: 'https://example.com',
            tooltip: 'Visit Example',
            children: [{
                type: DomType.Text,
                text: 'Example Link'
            }]
        })
    })

    it('should parse hyperlink without relationship', () => {
        const relationships = new Map<string, Relationship>()

        const element = {
            'w:hyperlink': {
                'w:r': {
                    'w:t': {
                        '@_xml:space': 'preserve',
                        '#text': 'Simple Link'
                    }
                }
            }
        }

        const contentParser = (el: any) => ({
            type: DomType.Text,
            text: el['w:t']['#text']
        })

        const result = parser.parse(element, contentParser, relationships)

        expect(result).toEqual({
            type: DomType.HYPERLINK,
            target: '',
            tooltip: undefined,
            children: [{
                type: DomType.Text,
                text: 'Simple Link'
            }]
        })
    })

    it('should parse hyperlink with multiple runs', () => {
        const relationships = new Map<string, Relationship>()

        const element = {
            'w:hyperlink': {
                'w:r': [
                    {
                        'w:t': {
                            '@_xml:space': 'preserve',
                            '#text': 'First '
                        }
                    },
                    {
                        'w:t': {
                            '@_xml:space': 'preserve',
                            '#text': 'Second'
                        }
                    }
                ]
            }
        }

        const contentParser = (el: any) => ({
            type: DomType.Text,
            text: el['w:t']['#text']
        })

        const result = parser.parse(element, contentParser, relationships)

        expect(result).toEqual({
            type: DomType.HYPERLINK,
            target: '',
            tooltip: undefined,
            children: [
                {
                    type: DomType.Text,
                    text: 'First '
                },
                {
                    type: DomType.Text,
                    text: 'Second'
                }
            ]
        })
    })

    it('should handle empty hyperlink', () => {
        const relationships = new Map<string, Relationship>()
        const element = {
            'w:hyperlink': {}
        }
        const contentParser = (el: any) => null

        const result = parser.parse(element, contentParser, relationships)

        expect(result).toEqual({
            type: DomType.HYPERLINK,
            target: '',
            tooltip: undefined,
            children: []
        })
    })
})
