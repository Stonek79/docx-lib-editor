const JSZip = require('jszip')
const fs = require('fs')
const path = require('path')

async function createTestDocx() {
    const zip = new JSZip()

    // document.xml
    const documentXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                   xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                   xmlns:r="http://schemas.openxmlformats.org/officeRelationships/2006/relationships">
            <w:body>
                <!-- Простой параграф -->
                <w:p>
                    <w:r>
                        <w:t>Простой текст</w:t>
                    </w:r>
                </w:p>

                <!-- Форматированный текст -->
                <w:p>
                    <w:r>
                        <w:rPr>
                            <w:b/>
                            <w:i/>
                            <w:color w:val="FF0000"/>
                            <w:sz w:val="28"/>
                        </w:rPr>
                        <w:t>Форматированный текст (жирный, курсив, красный, 14pt)</w:t>
                    </w:r>
                </w:p>

                <!-- Заголовок -->
                <w:p>
                    <w:pPr>
                        <w:pStyle w:val="Heading1"/>
                        <w:jc w:val="center"/>
                    </w:pPr>
                    <w:r>
                        <w:t>Тестовый заголовок</w:t>
                    </w:r>
                </w:p>

                <!-- Нумерованный список -->
                <w:p>
                    <w:pPr>
                        <w:numPr>
                            <w:ilvl w:val="0"/>
                            <w:numId w:val="1"/>
                        </w:numPr>
                    </w:pPr>
                    <w:r>
                        <w:t>Первый элемент списка</w:t>
                    </w:r>
                </w:p>
                <w:p>
                    <w:pPr>
                        <w:numPr>
                            <w:ilvl w:val="0"/>
                            <w:numId w:val="1"/>
                        </w:numPr>
                    </w:pPr>
                    <w:r>
                        <w:t>Второй элемент списка</w:t>
                    </w:r>
                </w:p>

                <!-- Таблица -->
                <w:tbl>
                    <w:tblPr>
                        <w:tblStyle w:val="TableGrid"/>
                    </w:tblPr>
                    <w:tr>
                        <w:tc>
                            <w:p>
                                <w:r>
                                    <w:t>Ячейка 1</w:t>
                                </w:r>
                            </w:p>
                        </w:tc>
                        <w:tc>
                            <w:p>
                                <w:r>
                                    <w:t>Ячейка 2</w:t>
                                </w:r>
                            </w:p>
                        </w:tc>
                    </w:tr>
                </w:tbl>

                <!-- Гиперссылка -->
                <w:p>
                    <w:hyperlink r:id="rId1">
                        <w:r>
                            <w:rPr>
                                <w:color w:val="0000FF"/>
                                <w:u w:val="single"/>
                            </w:rPr>
                            <w:t>Ссылка на Google</w:t>
                        </w:r>
                    </w:hyperlink>
                </w:p>

                <!-- Закладка -->
                <w:p>
                    <w:bookmarkStart w:id="1" w:name="test_bookmark"/>
                    <w:r>
                        <w:t>Текст с закладкой</w:t>
                    </w:r>
                    <w:bookmarkEnd w:id="1"/>
                </w:p>

                <!-- Комментарий -->
                <w:p>
                    <w:r>
                        <w:t>Текст с</w:t>
                    </w:r>
                    <w:commentRangeStart w:id="1"/>
                    <w:r>
                        <w:t>комментарием</w:t>
                    </w:r>
                    <w:commentRangeEnd w:id="1"/>
                    <w:r>
                        <w:commentReference w:id="1"/>
                    </w:r>
                </w:p>

                <!-- Сноска -->
                <w:p>
                    <w:r>
                        <w:t>Текст со сноской</w:t>
                    </w:r>
                    <w:r>
                        <w:footnoteReference w:id="1"/>
                    </w:r>
                </w:p>

                <!-- Поле (PAGE) -->
                <w:p>
                    <w:r>
                        <w:t>Страница </w:t>
                    </w:r>
                    <w:fldSimple w:instr=" PAGE ">
                        <w:r>
                            <w:t>1</w:t>
                        </w:r>
                    </w:fldSimple>
                </w:p>

                <!-- Изображение -->
                <w:p>
                    <w:r>
                        <w:drawing>
                            <wp:inline>
                                <wp:extent cx="5274310" cy="3523085"/>
                                <wp:docPr id="1" name="Picture 1"/>
                                <a:graphic>
                                    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                        <pic:pic>
                                            <pic:blipFill>
                                                <a:blip r:embed="rId2"/>
                                            </pic:blipFill>
                                        </pic:pic>
                                    </a:graphicData>
                                </a:graphic>
                            </wp:inline>
                        </w:drawing>
                    </w:r>
                </w:p>
            </w:body>
        </w:document>
    `
    zip.file('word/document.xml', documentXml)

    // styles.xml
    const stylesXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:style w:type="paragraph" w:styleId="Heading1">
                <w:name w:val="heading 1"/>
                <w:pPr>
                    <w:spacing w:before="240" w:after="120"/>
                    <w:jc w:val="center"/>
                </w:pPr>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="32"/>
                </w:rPr>
            </w:style>
            <w:style w:type="table" w:styleId="TableGrid">
                <w:name w:val="Table Grid"/>
                <w:tblPr>
                    <w:tblBorders>
                        <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                        <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                        <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
                    </w:tblBorders>
                </w:tblPr>
            </w:style>
        </w:styles>
    `
    zip.file('word/styles.xml', stylesXml)

    // numbering.xml
    const numberingXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:abstractNum w:abstractNumId="0">
                <w:lvl w:ilvl="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1."/>
                    <w:lvlJc w:val="left"/>
                    <w:pPr>
                        <w:ind w:left="720" w:hanging="360"/>
                    </w:pPr>
                </w:lvl>
            </w:abstractNum>
            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
            </w:num>
        </w:numbering>
    `
    zip.file('word/numbering.xml', numberingXml)

    // comments.xml
    const commentsXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:comment w:id="1" w:author="Test Author" w:date="2025-02-23T14:00:00Z">
                <w:p>
                    <w:r>
                        <w:t>Тестовый комментарий</w:t>
                    </w:r>
                </w:p>
            </w:comment>
        </w:comments>
    `
    zip.file('word/comments.xml', commentsXml)

    // footnotes.xml
    const footnotesXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:footnote w:id="0" w:type="separator">
                <w:p>
                    <w:r>
                        <w:separator/>
                    </w:r>
                </w:p>
            </w:footnote>
            <w:footnote w:id="1">
                <w:p>
                    <w:r>
                        <w:t>Тестовая сноска</w:t>
                    </w:r>
                </w:p>
            </w:footnote>
        </w:footnotes>
    `
    zip.file('word/footnotes.xml', footnotesXml)

    // header1.xml
    const headerXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:p>
                <w:r>
                    <w:t>Тестовый верхний колонтитул</w:t>
                </w:r>
            </w:p>
        </w:hdr>
    `
    zip.file('word/header1.xml', headerXml)

    // footer1.xml
    const footerXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:p>
                <w:r>
                    <w:t>Тестовый нижний колонтитул</w:t>
                </w:r>
            </w:p>
        </w:ftr>
    `
    zip.file('word/footer1.xml', footerXml)

    // Добавляем тестовое изображение
    const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
    )
    zip.file('word/media/image1.png', imageBuffer)

    // [Content_Types].xml
    const contentTypesXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
            <Default Extension="xml" ContentType="application/xml"/>
            <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
            <Default Extension="png" ContentType="image/png"/>
            <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
            <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
            <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
            <Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>
            <Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
            <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
            <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
        </Types>
    `
    zip.file('[Content_Types].xml', contentTypesXml)

    // word/_rels/document.xml.rels
    const documentRelsXml = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://www.google.com" TargetMode="External"/>
            <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
            <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>
            <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>
            <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
            <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
            <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
            <Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
        </Relationships>
    `
    zip.file('word/_rels/document.xml.rels', documentRelsXml)

    // Создаем DOCX файл
    const content = await zip.generateAsync({ type: 'nodebuffer' })
    const outputPath = path.join(__dirname, '..', '__tests__', 'fixtures', 'test.docx')
    fs.writeFileSync(outputPath, content)
    console.log(`Тестовый DOCX файл создан: ${outputPath}`)
}

createTestDocx().catch(console.error)