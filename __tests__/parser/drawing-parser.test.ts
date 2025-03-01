import { DrawingParser } from '../../src/utils/DocxParser/parsers/drawing/drawing-parser'
import { DomType } from '../../src/types/document'
import { Relationship, RelationshipTypes } from '../../src/types/relationships'

describe('DrawingParser', () => {
    let parser: DrawingParser

    beforeEach(() => {
        parser = new DrawingParser()
    })

    it('should check if element is drawing', () => {
        const element = {
            'w:drawing': {}
        }
        expect(parser.isDrawing(element)).toBe(true)

        const nonDrawingElement = {
            'w:p': {}
        }
        expect(parser.isDrawing(nonDrawingElement)).toBe(false)
    })

    it('should parse inline picture', () => {
        const relationships = new Map<string, Relationship>([
            ['rId1', {
                id: 'rId1',
                type: RelationshipTypes.Image,
                target: 'media/image1.png',
                targetMode: 'Internal'
            }]
        ])

        const element = {
            'w:drawing': {
                'wp:inline': {
                    'wp:extent': {
                        '@_cx': '952500', // 100 points
                        '@_cy': '952500'  // 100 points
                    },
                    'wp:docPr': {
                        '@_name': 'Picture 1',
                        '@_descr': 'A test picture'
                    },
                    'a:graphic': {
                        'a:graphicData': {
                            'pic:pic': {
                                'pic:blipFill': {
                                    'a:blip': {
                                        '@_r:embed': 'rId1'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const result = parser.parse(element, relationships)

        expect(result).toEqual({
            type: DomType.DRAWING,
            id: 'rId1',
            name: 'Picture 1',
            description: 'A test picture',
            width: 100,
            height: 100,
            target: 'media/image1.png'
        })
    })

    it('should parse anchor picture', () => {
        const relationships = new Map<string, Relationship>([
            ['rId2', {
                id: 'rId2',
                type: RelationshipTypes.Image,
                target: 'media/image2.png',
                targetMode: 'Internal'
            }]
        ])

        const element = {
            'w:drawing': {
                'wp:anchor': {
                    'wp:extent': {
                        '@_cx': '1905000', // 200 points
                        '@_cy': '1905000'  // 200 points
                    },
                    'wp:docPr': {
                        '@_name': 'Picture 2',
                        '@_descr': 'A floating picture'
                    },
                    'a:graphic': {
                        'a:graphicData': {
                            'pic:pic': {
                                'pic:blipFill': {
                                    'a:blip': {
                                        '@_r:embed': 'rId2'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const result = parser.parse(element, relationships)

        expect(result).toEqual({
            type: DomType.DRAWING,
            id: 'rId2',
            name: 'Picture 2',
            description: 'A floating picture',
            width: 200,
            height: 200,
            target: 'media/image2.png'
        })
    })

    it('should parse chart', () => {
        const relationships = new Map<string, Relationship>([
            ['rId3', {
                id: 'rId3',
                type: RelationshipTypes.CHART,
                target: 'charts/chart1.xml',
                targetMode: 'Internal'
            }]
        ])

        const element = {
            'w:drawing': {
                'wp:inline': {
                    'wp:extent': {
                        '@_cx': '2857500', // 300 points
                        '@_cy': '2857500'  // 300 points
                    },
                    'wp:docPr': {
                        '@_name': 'Chart 1',
                        '@_descr': 'A test chart'
                    },
                    'a:graphic': {
                        'a:graphicData': {
                            'c:chart': {
                                '@_r:id': 'rId3'
                            }
                        }
                    }
                }
            }
        }

        const result = parser.parse(element, relationships)

        expect(result).toEqual({
            type: DomType.DRAWING,
            id: 'rId3',
            name: 'Chart 1',
            description: 'A test chart',
            width: 300,
            height: 300,
            target: 'charts/chart1.xml'
        })
    })

    it('should handle invalid drawing element', () => {
        const relationships = new Map<string, Relationship>()
        const element = {
            'w:drawing': {}
        }

        const result = parser.parse(element, relationships)
        expect(result).toBeNull()
    })

    it('should handle missing graphic data', () => {
        const relationships = new Map<string, Relationship>()
        const element = {
            'w:drawing': {
                'wp:inline': {
                    'wp:extent': {
                        '@_cx': '952500',
                        '@_cy': '952500'
                    }
                }
            }
        }

        const result = parser.parse(element, relationships)
        expect(result).toBeNull()
    })
})
