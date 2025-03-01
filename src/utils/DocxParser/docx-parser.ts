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
            await Promise.all([
                this.loadStyles(),
                this.loadRelationships()
            ])

            // Затем загружаем нумерацию, которая зависит от стилей
            await this.loadNumbering()

            // Загружаем остальные компоненты параллельно
            await Promise.all([
                this.loadImages(),
                this.loadHeadersAndFooters(),
                this.loadComments(),
                this.loadFonts(),
                this.loadNotes()
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
                console.error('Main document content not found (word/document.xml)')
                throw new Error('Main document content not found')
            }

            const content = await file.async('text')
            if (!content) {
                console.error('Main document is empty')
                throw new Error('Main document is empty')
            }

            console.log(content, 'DOCX content');
            

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
                if (!def || !def.levels || Object.keys(def.levels).length === 0) {
                    console.warn(`Removing invalid numbering definition ${id}: no levels found`)
                    this.numbering.delete(id)
                } else {
                    validDefinitions++
                    console.log(`Numbering ${id} has ${Object.keys(def.levels).length} levels`)
                }
            }

            console.log(`Valid numbering definitions: ${validDefinitions}`)
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
            console.log(`Successfully loaded ${this.images.size} images`)
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
                        const paragraphHtml = this.paragraphConverter.convertParagraphToHtml(
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
                        const tableHtml = await this.tableConverter.convertTableToHtml(
                            element,
                            this.styles,
                            this.numbering,
                        )
                        
                        // Добавляем таблицу на текущую страницу
                        pages[currentPage].push(tableHtml)
                    }
                } catch (error) {
                    console.error('Error converting element to HTML:', error, element)
                    // Продолжаем конвертировать другие элементы
                }
            }

            // Создаем HTML для каждой страницы
            const pagesHtml = pages.map(page => {
                if (page.length === 0) return ''; // Пропускаем пустые страницы
                return `<div class="a4-page">${page.join('\n')}</div>`;
            }).filter(html => html !== ''); // Фильтруем пустые страницы
            
            // Оборачиваем все страницы в контейнер
            return `<div class="a4-pages-container">${pagesHtml.join('\n')}</div>`;
        } catch (error) {
            console.error('Error in convertToHtml:', error)
            return ''
        }
    }
}
