import { EndnotesFootnotesParser } from '@/utils/DocxParser/parsers/endnotes-footnotes/endnotes-footnotes-parser'
import { DomType } from '@/types/document'

describe('EndnotesFootnotesParser', () => {
    let parser: EndnotesFootnotesParser

    beforeEach(() => {
        parser = new EndnotesFootnotesParser()
    })

    describe('parse', () => {
        it('should parse footnotes XML', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:footnote w:id="1" w:type="normal">
                        <w:p>
                            <w:r>
                                <w:t>Test footnote content</w:t>
                            </w:r>
                        </w:p>
                    </w:footnote>
                </w:footnotes>
            `
            const notes = parser.parse(xml, true)
            expect(notes.size).toBe(1)
            const note = notes.get('1')            
            expect(note).toBeDefined()
            expect(note?.type).toBe(DomType.FOOTNOTE)
            expect(note?.id).toBe('1')
            expect(note?.content).toHaveLength(1)
        })

        it('should parse endnotes XML', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:endnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:endnote w:id="1" w:type="normal">
                        <w:p>
                            <w:r>
                                <w:t>Test endnote content</w:t>
                            </w:r>
                        </w:p>
                    </w:endnote>
                </w:endnotes>
            `
            const notes = parser.parse(xml, false)
            expect(notes.size).toBe(1)
            const note = notes.get('1')
            expect(note).toBeDefined()
            expect(note?.type).toBe(DomType.ENDNOTE)
            expect(note?.id).toBe('1')
            expect(note?.content).toHaveLength(1)
        })

        it('should skip special notes', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:footnote w:id="-1" w:type="separator">
                        <w:p>
                            <w:r>
                                <w:t>Separator</w:t>
                            </w:r>
                        </w:p>
                    </w:footnote>
                    <w:footnote w:id="0" w:type="continuationSeparator">
                        <w:p>
                            <w:r>
                                <w:t>Continuation separator</w:t>
                            </w:r>
                        </w:p>
                    </w:footnote>
                    <w:footnote w:id="1" w:type="normal">
                        <w:p>
                            <w:r>
                                <w:t>Regular footnote</w:t>
                            </w:r>
                        </w:p>
                    </w:footnote>
                </w:footnotes>
            `
            const notes = parser.parse(xml, true)
            expect(notes.size).toBe(1)
            expect(notes.has('1')).toBe(true)
            expect(notes.has('-1')).toBe(false)
            expect(notes.has('0')).toBe(false)
        })

        it('should handle empty notes document', () => {
            const xml = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                </w:footnotes>
            `
            const notes = parser.parse(xml, true)
            expect(notes.size).toBe(0)
        })
    })

    describe('isNoteReference', () => {
        it('should identify footnote reference', () => {
            const element = { 'w:footnoteReference': { '@_w:id': '1' } }
            expect(parser.isNoteReference(element)).toBe(true)
        })

        it('should identify endnote reference', () => {
            const element = { 'w:endnoteReference': { '@_w:id': '1' } }
            expect(parser.isNoteReference(element)).toBe(false)
        })

        it('should return undefined for non-note element', () => {
            const element = { 'w:r': {} }
            expect(parser.isNoteReference(element)).toBeUndefined()
        })
    })

    describe('getNoteReferenceId', () => {
        it('should get footnote reference ID', () => {
            const element = { 'w:footnoteReference': { '@_w:id': '1' } }
            expect(parser.getNoteReferenceId(element)).toBe('1')
        })

        it('should get endnote reference ID', () => {
            const element = { 'w:endnoteReference': { '@_w:id': '2' } }
            expect(parser.getNoteReferenceId(element)).toBe('2')
        })

        it('should return undefined for invalid element', () => {
            const element = { 'w:r': {} }
            expect(parser.getNoteReferenceId(element)).toBeUndefined()
        })
    })

    describe('getNoteById', () => {
        it('should get note by ID', () => {
            const notes = new Map()
            const note = { id: '1', type: DomType.FOOTNOTE, content: [] }
            notes.set('1', note)
            expect(parser.getNoteById(notes, '1')).toBe(note)
        })

        it('should return undefined for non-existent ID', () => {
            const notes = new Map()
            expect(parser.getNoteById(notes, '1')).toBeUndefined()
        })
    })

    describe('isSpecialNote', () => {
        it('should identify separator note', () => {
            expect(parser.isSpecialNote({ '@_w:type': 'separator' })).toBe(true)
            expect(parser.isSpecialNote({ 'w:type': 'separator' })).toBe(true)
        })

        it('should identify continuation separator note', () => {
            expect(parser.isSpecialNote({ '@_w:type': 'continuationSeparator' })).toBe(true)
            expect(parser.isSpecialNote({ 'w:type': 'continuationSeparator' })).toBe(true)
        })

        it('should identify regular note', () => {
            expect(parser.isSpecialNote({ '@_w:type': 'normal' })).toBe(false)
            expect(parser.isSpecialNote({ 'w:type': 'normal' })).toBe(false)
        })
    })
})
