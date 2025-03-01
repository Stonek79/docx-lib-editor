import { HeaderFooterParser } from '../../src/utils/DocxParser/parsers/header-footer/header-footer-parser'
import { DomType, WmlHeaderFooter, WmlParagraph, WmlTable, WmlRun, WmlText } from '../../src/types/document'

describe('HeaderFooterParser', () => {
    let parser: HeaderFooterParser

    beforeEach(() => {
        parser = new HeaderFooterParser()
    })

    test('should parse header with paragraph', () => {
        const xml = `
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:p w:rsidR="00000000" w:rsidRDefault="00000000">
                    <w:pPr/>
                    <w:r>
                        <w:rPr/>
                        <w:t xml:space="preserve">Header Text</w:t>
                    </w:r>
                </w:p>
            </w:hdr>
        `

        const result = parser.parse(xml, true)

        expect(result.type).toBe(DomType.HEADER)
        expect(result.children).toHaveLength(1)
        const paragraph = result.children[0] as WmlParagraph
        expect(paragraph.type).toBe(DomType.Paragraph)
        
        const run = paragraph.content[0] as WmlRun
        expect(run.type).toBe(DomType.Run)
        
        const text = run.content[0] as WmlText
        expect(text.type).toBe(DomType.Text)
        expect(text.text).toBe('Header Text')
    })

    test('should parse footer with table', () => {
        const xml = `
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:tbl>
                    <w:tblPr>
                        <w:tblStyle w:val="TableGrid"/>
                        <w:tblW w:w="5000" w:type="pct"/>
                    </w:tblPr>
                    <w:tblGrid>
                        <w:gridCol w:w="2500"/>
                    </w:tblGrid>
                    <w:tr>
                        <w:trPr/>
                        <w:tc>
                            <w:tcPr>
                                <w:tcW w:w="2500" w:type="dxa"/>
                            </w:tcPr>
                            <w:p w:rsidR="00000000" w:rsidRDefault="00000000">
                                <w:pPr/>
                                <w:r>
                                    <w:rPr/>
                                    <w:t xml:space="preserve">Table Cell</w:t>
                                </w:r>
                            </w:p>
                        </w:tc>
                    </w:tr>
                </w:tbl>
            </w:ftr>
        `

        const result = parser.parse(xml, false)

        expect(result.type).toBe(DomType.FOOTER)
        expect(result.children).toHaveLength(1)
        
        const table = result.children[0] as WmlTable
        expect(table.type).toBe(DomType.Table)
        
        const cell = table.rows[0].cells[0]
        const paragraph = cell.content[0] as WmlParagraph
        expect(paragraph.type).toBe(DomType.Paragraph)
        
        const run = paragraph.content[0] as WmlRun
        expect(run.type).toBe(DomType.Run)
        
        const text = run.content[0] as WmlText
        expect(text.type).toBe(DomType.Text)
        expect(text.text).toBe('Table Cell')
    })
})
