import { BaseParser } from './base-parser'
import {
    WmlDocument,
    WmlParagraph,
    WmlTable,
    DomType,
    WmlHeaderFooter,
    WmlComment,
    WmlFont,
    WmlNote,
} from '@/types/document'
import { ParsedDocument, ParserOptions } from '@/types/parser'
import { StylesParser } from './parsers/styles-parser'
import { NumberingParser } from './parsers/numbering-parser'
import { RelationshipParser } from './parsers/relationship-parser'
import { ImageParser } from './parsers/image-parser'
import { MetadataParser } from './parsers/metadata-parser'
import { HeaderFooterParser } from './parsers/header-footer/header-footer-parser'
import { CommentsParser } from './parsers/comments/comments-parser'
import { FontTableParser } from './parsers/font-table/font-table-parser'
import { EndnotesFootnotesParser } from './parsers/endnotes-footnotes/endnotes-footnotes-parser'
import { ParagraphConverter, TableConverter } from './html-converters'
import JSZip from 'jszip'
import { DocxStyle } from '@/types/docx-properties'
import { NumberingDefinition } from '@/types/numbering'
import { Relationship } from '@/types/relationships'
import { DocumentParser } from './parsers/document-parser'
import { FootnoteConverter } from './html-converters/footnote-converter'
/**
 * Основной класс для парсинга DOCX документов.
 * Координирует работу всех остальных парсеров и отвечает за:
 * - Загрузку и обработку ZIP-архива DOCX
 * - Парсинг основного содержимого документа
 * - Парсинг стилей, нумерации, отношений и изображений
 * - Парсинг колонтитулов, комментариев, сносок
 * - Извлечение метаданных
 * - Конвертацию в HTML (TODO)
 */
export class DocxParser extends BaseParser {
    // Парсеры
    private stylesParser: StylesParser
    private numberingParser: NumberingParser
    private relationshipParser: RelationshipParser
    private imageParser: ImageParser
    private metadataParser: MetadataParser
    private documentParser: DocumentParser
    private headerFooterParser: HeaderFooterParser
    private commentsParser: CommentsParser
    private fontTableParser: FontTableParser
    private endnotesFootnotesParser: EndnotesFootnotesParser

    // HTML конвертеры
    private paragraphConverter: ParagraphConverter
    private tableConverter: TableConverter
    private footnoteConverter: FootnoteConverter
    // Кэши данных
    private styles: Map<string, DocxStyle> = new Map()
    private numbering: Map<string, NumberingDefinition> = new Map()
    private images: Map<string, string> = new Map()
    private relationships: Map<string, Relationship> = new Map()
    private headers: Map<string, WmlHeaderFooter> = new Map()
    private footers: Map<string, WmlHeaderFooter> = new Map()
    private comments: Map<string, WmlComment> = new Map()
    private fonts: Map<string, WmlFont> = new Map()
    private footnotes: Map<string, WmlNote> = new Map()
    private endnotes: Map<string, WmlNote> = new Map()

    /**
     * Конструктор DocxParser
     * @param options - Опции парсера
     */
    constructor(options?: ParserOptions) {
        super(options)
        // Инициализация парсеров
        this.stylesParser = new StylesParser(options)
        this.numberingParser = new NumberingParser(options)
        this.relationshipParser = new RelationshipParser(options)
        this.imageParser = new ImageParser(options)
        this.metadataParser = new MetadataParser(options)
        this.documentParser = new DocumentParser(options)
        this.headerFooterParser = new HeaderFooterParser()
        this.commentsParser = new CommentsParser()
        this.fontTableParser = new FontTableParser()
        this.endnotesFootnotesParser = new EndnotesFootnotesParser()

        // Инициализация HTML конвертеров
        this.paragraphConverter = new ParagraphConverter()
        this.tableConverter = new TableConverter()
        this.footnoteConverter = new FootnoteConverter()
    }

    /**
     * Парсит DOCX файл и возвращает структурированное представление документа
     * @param file - DOCX файл для парсинга
     * @returns Объект с HTML представлением, стилями, нумерацией, изображениями и метаданными
     */
    async parse(file: File | Blob | ArrayBuffer): Promise<ParsedDocument> {
        try {
            this.zip = await JSZip.loadAsync(file)

            if (!this.zip) {
                throw new Error('Failed to load DOCX file')
            }

            this.imageParser.setZip(this.zip)

            // Сначала загружаем критически важные компоненты
            await Promise.all([this.loadStyles(), this.loadRelationships()])

            // Затем загружаем нумерацию, которая зависит от стилей
            await this.loadNumbering()

            // Загружаем остальные компоненты параллельно
            await Promise.all([
                this.loadImages(),
                this.loadHeadersAndFooters(),
                this.loadComments(),
                this.loadFonts(),
                this.loadNotes(),
            ])

            // Проверяем наличие обязательных частей
            if (!this.styles.size) {
                console.warn('No styles found in document')
            }
            if (!this.relationships.size) {
                console.warn('No relationships found in document')
            }

            // Передаем relationships в documentParser
            this.documentParser.setRelationships(this.relationships)

            const document = await this.loadDocument()
            if (!document || !document.body || !document.body.content) {
                throw new Error('Failed to load document content')
            }

            const html = await this.convertToHtml(document.body.content)
            if (!html) {
                console.warn('Document was converted to empty HTML')
            }

            return {
                html,
                styles: Array.from(this.styles.values()),
                numbering: Array.from(this.numbering.values()),
                images: this.images,
                relationships: Array.from(this.relationships.values()),
                headers: Array.from(this.headers.values()),
                footers: Array.from(this.footers.values()),
                comments: Array.from(this.comments.values()),
                fonts: Array.from(this.fonts.values()),
                footnotes: Array.from(this.footnotes.values()),
                endnotes: Array.from(this.endnotes.values()),
                metadata: await this.extractMetadata(),
            }
        } catch (error) {
            console.error('Error parsing DOCX file:', error)
            throw error
        }
    }

    /**
     * Загружает и парсит основное содержимое документа
     * @returns Структура документа в формате WmlDocument
     */
    private async loadDocument(): Promise<WmlDocument> {
        try {
            const file = this.zip.file('word/document.xml')
            if (!file) {
                console.error(
                    'Main document content not found (word/document.xml)',
                )
                throw new Error('Main document content not found')
            }

            const content = await file.async('text')
            if (!content) {
                console.error('Main document is empty')
                throw new Error('Main document is empty')
            }

            const document = await this.documentParser.parse(content)

            if (!document || !document.body) {
                console.error('Failed to parse document content')
                throw new Error('Failed to parse document content')
            }

            return document
        } catch (error) {
            console.error('Error loading document:', error)
            return {
                type: DomType.Document,
                body: {
                    content: [],
                },
            }
        }
    }

    /**
     * Загружает и парсит стили документа
     */
    private async loadStyles(): Promise<void> {
        try {
            const content = await this.zip
                .file('word/styles.xml')
                ?.async('text')
            if (!content) return

            this.styles = await this.stylesParser.parse(content)
        } catch (e) {
            console.warn('Failed to load styles:', e)
        }
    }

    /**
     * Загружает и парсит настройки нумерации
     */
    private async loadNumbering(): Promise<void> {
        try {
            const file = this.zip.file('word/numbering.xml')
            if (!file) {
                console.warn('Numbering file not found (word/numbering.xml)')
                this.numbering = new Map()
                return
            }

            const content = await file.async('text')

            if (!content) {
                console.warn('Numbering file is empty')
                this.numbering = new Map()
                return
            }

            this.numbering = await this.numberingParser.parse(content)

            if (!this.numbering || !this.numbering.size) {
                console.warn('No numbering definitions found after parsing')
                this.numbering = new Map()
                return
            }

            // Проверяем корректность определений нумерации
            let validDefinitions = 0
            for (const [id, def] of this.numbering.entries()) {
                if (
                    !def ||
                    !def.levels ||
                    Object.keys(def.levels).length === 0
                ) {
                    console.warn(
                        `Removing invalid numbering definition ${id}: no levels found`,
                    )
                    this.numbering.delete(id)
                } else {
                    validDefinitions++
                }
            }
        } catch (error) {
            console.error('Error loading numbering:', error)
            this.numbering = new Map()
        }
    }

    /**
     * Загружает и парсит отношения между частями документа
     */
    private async loadRelationships(): Promise<void> {
        try {
            const content = await this.zip
                .file('word/_rels/document.xml.rels')
                ?.async('text')
            if (!content) return

            this.relationships = await this.relationshipParser.parse(content)
        } catch (e) {
            console.warn('Failed to load relationships:', e)
        }
    }

    /**
     * Загружает и обрабатывает изображения из документа
     */
    private async loadImages(): Promise<void> {
        try {
            if (!this.relationships || !this.relationships.size) {
                console.warn('No relationships found, skipping image loading')
                this.images = new Map()
                return
            }

            this.images = await this.imageParser.parse(this.relationships)
        } catch (e) {
            console.error('Failed to load images:', e)
            this.images = new Map()
        }
    }

    /**
     * Загружает и парсит колонтитулы документа
     */
    private async loadHeadersAndFooters(): Promise<void> {
        const files = await this.zip.file(/word\/(header|footer)\d+\.xml/)
        for (const file of files) {
            const content = await file.async('text')
            const isHeader = file.name.includes('header')
            const result = this.headerFooterParser.parse(content, isHeader)
            const id = file.name.match(/\d+/)?.[0] || ''

            if (isHeader) {
                this.headers.set(id, result)
            } else {
                this.footers.set(id, result)
            }
        }
    }

    /**
     * Загружает и парсит комментарии документа
     */
    private async loadComments(): Promise<void> {
        const content = await this.zip.file('word/comments.xml')?.async('text')
        if (!content) return

        const comments = this.commentsParser.parse(content)
        comments.forEach((comment) => {
            this.comments.set(comment.id, comment)
        })
    }

    /**
     * Загружает и парсит таблицу шрифтов
     */
    private async loadFonts(): Promise<void> {
        const content = await this.zip.file('word/fontTable.xml')?.async('text')
        if (!content) return

        this.fonts = this.fontTableParser.parse(content)
    }

    /**
     * Загружает и парсит сноски документа
     */
    private async loadNotes(): Promise<void> {
        // Загружаем обычные сноски
        const footnoteContent = await this.zip
            .file('word/footnotes.xml')
            ?.async('text')
        if (footnoteContent) {
            const footnotes = this.endnotesFootnotesParser.parse(
                footnoteContent,
                true,
            )
            this.footnotes = footnotes
            console.log('Footnotes: ', this.footnotes)
        }

        // Загружаем концевые сноски
        const endnoteContent = await this.zip
            .file('word/endnotes.xml')
            ?.async('text')
        if (endnoteContent) {
            const endnotes = this.endnotesFootnotesParser.parse(
                endnoteContent,
                false,
            )
            
            this.endnotes = endnotes            
        }
    }

    /**
     * Извлекает метаданные документа
     * @returns Объект с метаданными документа
     */
    private async extractMetadata(): Promise<ParsedDocument['metadata']> {
        try {
            const content = await this.zip
                .file('docProps/core.xml')
                ?.async('text')
            if (!content) return {}

            return this.metadataParser.parse(content)
        } catch (e) {
            console.warn('Failed to extract metadata:', e)
            return {}
        }
    }

    /**
     * Конвертирует элементы документа в HTML
     * @param elements - Массив элементов документа для конвертации
     * @returns HTML строка
     */
    private async convertToHtml(
        elements: (WmlParagraph | WmlTable)[],
    ): Promise<string> {
        try {
            // Сбрасываем состояние конвертеров
            this.paragraphConverter.reset()

            const pages: string[][] = [[]] // Массив страниц, каждая страница - массив HTML-строк
            let currentPage = 0

            for (const element of elements) {
                try {
                    if (element.type === DomType.Paragraph) {
                        const paragraphHtml =
                            this.paragraphConverter.convertParagraphToHtml(
                                element,
                                this.styles,
                                this.numbering,
                                this.relationships,
                            )

                        // Добавляем параграф на текущую страницу
                        pages[currentPage].push(paragraphHtml)

                        // Если обнаружен разрыв страницы, создаем новую страницу
                        if (this.paragraphConverter.hasPageBreakDetected()) {
                            currentPage++
                            pages[currentPage] = []
                        }
                    } else if (element.type === DomType.Table) {
                        const tableHtml =
                            await this.tableConverter.convertTableToHtml(
                                element,
                                this.styles,
                                this.numbering,
                            )

                        // Добавляем таблицу на текущую страницу
                        pages[currentPage].push(tableHtml)
                    }
                } catch (error) {
                    console.error(
                        'Error converting element to HTML:',
                        error,
                        element,
                    )
                    // Продолжаем конвертировать другие элементы
                }
            }

            // Получаем информацию о секциях документа
            const sections = this.documentParser.getSections()

            // Конвертируем сноски в HTML
            const footnotesHtml = this.footnotes.size > 0 
                ? this.footnoteConverter.convertFootnotesToHtml(
                    this.footnotes,
                    this.styles,
                    this.numbering
                  )
                : '';

            // Создаем HTML для каждой страницы с учетом ориентации
            const pagesHtml = pages
                .map((page, index) => {
                    if (page.length === 0) return '' // Пропускаем пустые страницы

                    // Определяем ориентацию страницы на основе секций
                    // По умолчанию используем портретную ориентацию
                    let orientation = 'portrait'

                    // Если есть секции, проверяем их ориентацию
                    if (sections && sections.length > 0) {
                        // Используем секцию, соответствующую текущей странице
                        // Если секций меньше, чем страниц, используем последнюю секцию
                        const sectionIndex = Math.min(
                            index,
                            sections.length - 1,
                        )
                        const section = sections[sectionIndex]

                        // Проверяем ориентацию секции
                        if (
                            section.pageSize &&
                            section.pageSize.orientation === 'landscape'
                        ) {
                            orientation = 'landscape'
                        }
                    }

                    // Добавляем класс ориентации к странице
                    const orientationClass =
                        orientation === 'landscape' ? ' landscape' : ''

                    // Создаем страницу с контентом
                    return `<div class="a4-page${orientationClass}">${page.join('\n')}</div>`
                })
                .filter((html) => html !== '') // Фильтруем пустые страницы

            // Добавляем скрытый контейнер с сносками, который будет использоваться для клонирования
            const hiddenFootnotes = footnotesHtml 
                ? `<div style="display: none;">${footnotesHtml}</div>` 
                : '';

            // Оборачиваем все страницы в контейнер и добавляем скрытые сноски
            return `<div class="a4-pages-container">${pagesHtml.join('\n')}${hiddenFootnotes}</div>`
        } catch (error) {
            console.error('Error in convertToHtml:', error)
            return ''
        }
    }
}
