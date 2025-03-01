import { FontTableParser } from '../../src/utils/DocxParser/parsers/font-table/font-table-parser'
import { WmlFont } from '../../src/types/document'

describe('FontTableParser', () => {
    let parser: FontTableParser

    beforeEach(() => {
        parser = new FontTableParser()
    })

    describe('parse', () => {
        it('should parse font table XML', () => {
            const xmlContent = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:font w:name="Times New Roman">
                        <w:family w:val="roman"/>
                        <w:charset w:val="00"/>
                        <w:pitch w:val="variable"/>
                    </w:font>
                    <w:font w:name="Arial">
                        <w:family w:val="swiss"/>
                        <w:altName w:val="Arial Unicode MS"/>
                        <w:charset w:val="00"/>
                        <w:pitch w:val="variable"/>
                    </w:font>
                    <w:font w:name="Courier New">
                        <w:family w:val="modern"/>
                        <w:charset w:val="00"/>
                        <w:pitch w:val="fixed"/>
                    </w:font>
                </w:fonts>
            `

            const fonts = parser.parse(xmlContent)

            expect(fonts.size).toBe(3)

            const timesNewRoman = fonts.get('Times New Roman')
            expect(timesNewRoman).toEqual({
                name: 'Times New Roman',
                family: 'serif',
                altName: undefined,
                charset: '00',
                pitch: 'variable'
            })

            const arial = fonts.get('Arial')
            expect(arial).toEqual({
                name: 'Arial',
                family: 'sans-serif',
                altName: 'Arial Unicode MS',
                charset: '00',
                pitch: 'variable'
            })

            const courierNew = fonts.get('Courier New')
            expect(courierNew).toEqual({
                name: 'Courier New',
                family: 'monospace',
                altName: undefined,
                charset: '00',
                pitch: 'fixed'
            })
        })

        it('should handle empty font table', () => {
            const xmlContent = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                </w:fonts>
            `

            const fonts = parser.parse(xmlContent)
            expect(fonts.size).toBe(0)
        })

        it('should handle font without family', () => {
            const xmlContent = `
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:font w:name="Symbol">
                        <w:charset w:val="02"/>
                        <w:pitch w:val="variable"/>
                    </w:font>
                </w:fonts>
            `

            const fonts = parser.parse(xmlContent)
            expect(fonts.get('Symbol')).toEqual({
                name: 'Symbol',
                family: undefined,
                altName: undefined,
                charset: '02',
                pitch: 'variable'
            })
        })
    })

    describe('Font Queries', () => {
        let fonts: Map<string, WmlFont>

        beforeEach(() => {
            fonts = new Map([
                ['Arial', {
                    name: 'Arial',
                    family: 'sans-serif',
                    altName: 'Arial Unicode MS',
                    charset: '00',
                    pitch: 'variable'
                }],
                ['Times New Roman', {
                    name: 'Times New Roman',
                    family: 'serif',
                    altName: undefined,
                    charset: '00',
                    pitch: 'variable'
                }],
                ['Courier New', {
                    name: 'Courier New',
                    family: 'monospace',
                    altName: undefined,
                    charset: '00',
                    pitch: 'fixed'
                }]
            ])
        })

        it('should check if font exists', () => {
            expect(parser.hasFont(fonts, 'Arial')).toBe(true)
            expect(parser.hasFont(fonts, 'Helvetica')).toBe(false)
        })

        it('should get font info', () => {
            const arial = parser.getFontInfo(fonts, 'Arial')
            expect(arial).toEqual({
                name: 'Arial',
                family: 'sans-serif',
                altName: 'Arial Unicode MS',
                charset: '00',
                pitch: 'variable'
            })

            const nonExistent = parser.getFontInfo(fonts, 'Helvetica')
            expect(nonExistent).toBeUndefined()
        })

        it('should get fonts by family', () => {
            const serifFonts = parser.getFontsByFamily(fonts, 'serif')
            expect(serifFonts).toHaveLength(1)
            expect(serifFonts[0].name).toBe('Times New Roman')

            const sansSerifFonts = parser.getFontsByFamily(fonts, 'sans-serif')
            expect(sansSerifFonts).toHaveLength(1)
            expect(sansSerifFonts[0].name).toBe('Arial')

            const monospaceFonts = parser.getFontsByFamily(fonts, 'monospace')
            expect(monospaceFonts).toHaveLength(1)
            expect(monospaceFonts[0].name).toBe('Courier New')

            const cursiveFonts = parser.getFontsByFamily(fonts, 'cursive')
            expect(cursiveFonts).toHaveLength(0)
        })
    })
})
