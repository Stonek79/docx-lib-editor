import { CommentsParser } from '../../src/utils/DocxParser/parsers/comments/comments-parser'
import { DomType } from '../../src/types/document'

describe('CommentsParser', () => {
    let parser: CommentsParser

    beforeEach(() => {
        parser = new CommentsParser()
    })

    describe('parseComments', () => {
        it('should parse comments from XML', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:comment w:id="1" w:author="John Doe" w:date="2024-02-23T10:00:00Z">
                        <w:p w:rsidR="00000000" w:rsidRDefault="00000000">
                            <w:pPr/>
                            <w:r>
                                <w:rPr/>
                                <w:t xml:space="preserve">Test comment</w:t>
                            </w:r>
                        </w:p>
                    </w:comment>
                </w:comments>
            `

            const result = parser.parse(xml)

            expect(result).toBeDefined()
            expect(result[0].type).toBe(DomType.COMMENT)
            expect(result[0].id).toBe('1')
            expect(result[0].author).toBe('John Doe')
            expect(result[0].date).toBeDefined()
            expect(result[0].content).toBeDefined()
            expect(result[0].content[0].type).toBe(DomType.Paragraph)
        })

        it('should handle empty comments document', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                </w:comments>
            `

            const result = parser.parse(xml)

            expect(result).toEqual([])
        })

        it('should parse multiple comments', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:comment w:id="1" w:author="John Doe" w:date="2024-02-23T10:00:00Z">
                        <w:p w:rsidR="00000000" w:rsidRDefault="00000000">
                            <w:pPr/>
                            <w:r>
                                <w:rPr/>
                                <w:t xml:space="preserve">First comment</w:t>
                            </w:r>
                        </w:p>
                    </w:comment>
                    <w:comment w:id="2" w:author="Jane Smith" w:date="2024-02-23T11:00:00Z">
                        <w:p w:rsidR="00000000" w:rsidRDefault="00000000">
                            <w:pPr/>
                            <w:r>
                                <w:rPr/>
                                <w:t xml:space="preserve">Second comment</w:t>
                            </w:r>
                        </w:p>
                    </w:comment>
                </w:comments>
            `

            const result = parser.parse(xml)

            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('1')
            expect(result[1].id).toBe('2')
            expect(result[0].author).toBe('John Doe')
            expect(result[1].author).toBe('Jane Smith')
        })
    })

    describe('parseComment', () => {
        it('should parse comment with paragraphs', () => {
            const commentXml = {
                '@_w:id': '1',
                '@_w:author': 'John Doe',
                '@_w:date': '2024-02-23T10:00:00Z',
                'w:p': [
                    {
                        'w:pPr': {},
                        'w:r': {
                            'w:rPr': {},
                            'w:t': {
                                '@_xml:space': 'preserve',
                                '#text': 'Test comment'
                            }
                        }
                    }
                ]
            }

            const result = parser['parseComment'](commentXml)

            expect(result).toBeDefined()
            expect(result.type).toBe(DomType.COMMENT)
            expect(result.id).toBe('1')
            expect(result.author).toBe('John Doe')
            expect(result.date).toBe('2024-02-23T10:00:00Z')
            expect(result.content).toBeDefined()
            expect(result.content.length).toBeGreaterThan(0)
        })

        it('should handle comment without paragraphs', () => {
            const commentXml = {
                '@_w:id': '1',
                '@_w:author': 'John Doe',
                '@_w:date': '2024-02-23T10:00:00Z'
            }

            const result = parser['parseComment'](commentXml)

            expect(result).toBeDefined()
            expect(result.type).toBe(DomType.COMMENT)
            expect(result.id).toBe('1')
            expect(result.author).toBe('John Doe')
            expect(result.date).toBe('2024-02-23T10:00:00Z')
            expect(result.content).toEqual([])
        })
    })
})
