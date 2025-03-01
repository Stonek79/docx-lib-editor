import { BookmarksParser } from '../../src/utils/DocxParser/parsers/bookmarks/bookmarks-parser'
import { DomType } from '../../src/types/document'

describe('BookmarksParser', () => {
    let parser: BookmarksParser

    beforeEach(() => {
        parser = new BookmarksParser()
    })

    describe('isBookmarkStart', () => {
        it('should identify bookmark start element', () => {
            const element = {
                'w:bookmarkStart': {
                    '@_w:id': '1',
                    '@_w:name': 'TestBookmark'
                }
            }
            expect(parser.isBookmarkStart(element)).toBe(true)
        })

        it('should return false for non-bookmark elements', () => {
            const element = {
                'w:p': {}
            }
            expect(parser.isBookmarkStart(element)).toBe(false)
        })
    })

    describe('isBookmarkEnd', () => {
        it('should identify bookmark end element', () => {
            const element = {
                'w:bookmarkEnd': {
                    '@_w:id': '1'
                }
            }
            expect(parser.isBookmarkEnd(element)).toBe(true)
        })

        it('should return false for non-bookmark elements', () => {
            const element = {
                'w:p': {}
            }
            expect(parser.isBookmarkEnd(element)).toBe(false)
        })
    })

    describe('parseBookmarkStart', () => {
        it('should parse bookmark start element', () => {
            const startElement = {
                'w:bookmarkStart': {
                    '@_w:id': '1',
                    '@_w:name': 'TestBookmark'
                }
            }

            const result = parser.parseBookmarkStart(startElement['w:bookmarkStart'])

            expect(result).toBeDefined()
            expect(result.type).toBe(DomType.BOOKMARK)
            expect(result.id).toBe('1')
            expect(result.name).toBe('TestBookmark')
        })

        it('should handle empty bookmark attributes', () => {
            const startElement = {
                'w:bookmarkStart': {}
            }

            const result = parser.parseBookmarkStart(startElement['w:bookmarkStart'])

            expect(result).toBeDefined()
            expect(result.type).toBe(DomType.BOOKMARK)
            expect(result.id).toBe('')
            expect(result.name).toBe('')
        })
    })

    describe('getBookmarkEndId', () => {
        it('should get bookmark end id', () => {
            const endElement = {
                'w:bookmarkEnd': {
                    '@_w:id': '1'
                }
            }

            const id = parser.getBookmarkEndId(endElement)
            expect(id).toBe('1')
        })

        it('should handle missing id', () => {
            const endElement = {
                'w:bookmarkEnd': {}
            }

            const id = parser.getBookmarkEndId(endElement)
            expect(id).toBe('')
        })
    })
})
