import { BaseParser } from '../base-parser'
import {
    DomType,
    OpenXmlElement,
    WmlDocument,
    WmlParagraph,
    WmlTable,
} from '@/types/document'
import { DocumentElementParser } from '@/types/document-parser'
import { ParagraphParser } from './document/paragraph-parser'
import { TableParser } from './document/table-parser'
import { RunParser } from './document/run-parser'
import { ListParser } from './document/list-parser'
import { BookmarksParser } from './bookmarks/bookmarks-parser'
import { HyperlinkParser } from './hyperlink/hyperlink-parser'
import { DrawingParser } from './drawing/drawing-parser'
import { FieldParser } from './field/field-parser'
import { Relationship } from '@/types/relationships'
import { SectionProperties, SectionPropertiesParser } from './section-properties-parser'

/**
 * Парсер основного содержимого DOCX документа.
 * Отвечает за:
 * - Парсинг document.xml
 * - Координацию работы парсеров отдельных элементов (параграфы, таблицы и т.д.)
 * - Обработку сложных элементов (закладки, гиперссылки, поля)
 * - Построение древовидной структуры документа
 */
export class DocumentParser extends BaseParser {
    private elementParsers: DocumentElementParser[]
    private bookmarksParser: BookmarksParser
    private hyperlinkParser: HyperlinkParser
    private drawingParser: DrawingParser
    private fieldParser: FieldParser
    private sectionPropertiesParser: SectionPropertiesParser
    private relationships: Map<string, Relationship> = new Map()
    private sections: SectionProperties[] = []

    constructor(options = {}) {
        super(options)
        this.elementParsers = [
            new TableParser(),
            new ParagraphParser(),
            new RunParser(),
            new ListParser(),
        ]
        this.bookmarksParser = new BookmarksParser()
        this.hyperlinkParser = new HyperlinkParser()
        this.drawingParser = new DrawingParser()
        this.fieldParser = new FieldParser()
        this.sectionPropertiesParser = new SectionPropertiesParser()
    }

    /**
     * Устанавливает связи документа для использования в парсерах
     * @param relationships - Map связей документа
     */
    public setRelationships(relationships: Map<string, Relationship>) {
        this.relationships = relationships
    }

    /**
     * Парсит XML содержимое основного документа
     * @param xmlContent - XML содержимое файла document.xml
     * @returns Объект с древовидной структурой документа
     */
    async parse(xmlContent: string): Promise<WmlDocument> {
        const doc = this.xmlParser.parse(xmlContent)
        console.log('Исходный XML документ:', doc?.['w:document']?.['w:body'])

        // Парсим секции документа
        this.parseSections(doc?.['w:document']?.['w:body'])

        const content = this.parseDocumentElements(
            doc?.['w:document']?.['w:body'],
        )

        const filteredContent = content.filter(
            (element): element is WmlParagraph | WmlTable =>
                element.type === DomType.Paragraph ||
                element.type === DomType.Table,
        )

        return {
            type: DomType.Document,
            body: {
                content: filteredContent,
            },
        }
    }

    /**
     * Парсит секции документа
     * @param body - Тело документа
     */
    private parseSections(body: any): void {
        if (!body) return;
        
        // Очищаем предыдущие секции
        this.sections = [];
        
        // Проверяем наличие свойств секции в конце документа
        if (body['w:sectPr']) {
            const sectionProps = this.sectionPropertiesParser.parseSectionProperties(body['w:sectPr']);
            this.sections.push(sectionProps);
        }
        
        // Проверяем свойства секций внутри параграфов
        if (body['w:p']) {
            const paragraphs = Array.isArray(body['w:p']) ? body['w:p'] : [body['w:p']];
            
            for (const paragraph of paragraphs) {
                if (paragraph['w:pPr'] && paragraph['w:pPr']['w:sectPr']) {
                    const sectionProps = this.sectionPropertiesParser.parseSectionProperties(paragraph['w:pPr']['w:sectPr']);
                    this.sections.push(sectionProps);
                }
            }
        }
        
        // Если не нашли ни одной секции, создаем секцию по умолчанию
        if (this.sections.length === 0) {
            const defaultSection = this.sectionPropertiesParser.getDefaultSectionProperties();
            this.sections.push(defaultSection);
        }
    }
    
    /**
     * Возвращает секции документа
     * @returns Массив свойств секций
     */
    public getSections(): SectionProperties[] {
        return this.sections;
    }
    
    /**
     * Парсит элементы документа
     * @param elements - XML элементы для парсинга
     * @returns Массив распарсенных элементов
     */
    private parseDocumentElements(elements: any): OpenXmlElement[] {
        if (!elements) return []

        const result: OpenXmlElement[] = []
        let currentBookmark: OpenXmlElement[] = []
        let isInBookmark = false
        let currentField: OpenXmlElement[] = []
        let isInField = false

        const processElement = (element: any) => {
            if (!element || typeof element !== 'object') return false

            // Проверяем закладки
            if (this.bookmarksParser.isBookmarkStart(element)) {
                isInBookmark = true
            }

            if (this.bookmarksParser.isBookmarkEnd(element)) {
                if (isInBookmark && currentBookmark.length > 0) {
                    const bookmark = this.bookmarksParser.parseBookmarkContent(
                        currentBookmark,
                        (el) => this.parseElement(el),
                    )
                    if (bookmark) {
                        result.push(...bookmark)
                    }
                }
                isInBookmark = false
                currentBookmark = []
            }

            // Проверяем поля
            if (this.fieldParser.isComplexFieldStart(element)) {
                isInField = true
            }

            if (this.fieldParser.isComplexFieldEnd(element)) {
                if (isInField && currentField.length > 0) {
                    const field = this.fieldParser.parseComplexField(
                        currentField,
                        (el) => this.parseElement(el),
                    )
                    if (field) {
                        result.push(field)
                    }
                }
                isInField = false
                currentField = []
            }

            // Проверяем гиперссылки
            if (this.hyperlinkParser.isHyperlink(element)) {
                const hyperlink = this.hyperlinkParser.parse(
                    element,
                    (el) => this.parseElement(el),
                    this.relationships,
                )
                if (hyperlink) {
                    result.push(hyperlink)
                }
            }

            // Проверяем графические объекты
            if (this.drawingParser.isDrawing(element)) {
                const drawing = this.drawingParser.parse(
                    element,
                    this.relationships,
                )
                if (drawing) {
                    result.push(drawing)
                }
            }

            // Проверяем простые поля
            if (this.fieldParser.isSimpleField(element)) {
                const field = this.fieldParser.parseSimpleField(element, (el) =>
                    this.parseElement(el),
                )
                if (field) {
                    result.push(field)
                }
            }

            // Обрабатываем обычные элементы
            const parsed = this.parseElement(element)
            if (parsed) {
                if (isInBookmark) {
                    currentBookmark.push(element)
                } else if (isInField) {
                    currentField.push(element)
                } else {
                    result.push(parsed)
                }
            }
        }

        for (const key in elements) {
            const element = elements[key]
            if (Array.isArray(element)) {
                element.forEach(processElement)
            } else {
                processElement(element)
            }
        }

        return result
    }

    /**
     * Парсит элементы документа, используя соответствующие парсеры
     * @param element - XML элемент для парсинга
     * @returns Объект с распарсенным элементом
     */
    private parseElement(element: any): OpenXmlElement | null {
        for (const parser of this.elementParsers) {
            if (parser.canParse(element)) {
                const parsed = parser.parse(element)
                if (parsed) {
                    return parsed as OpenXmlElement
                }
            }
        }
        return null
    }
}
