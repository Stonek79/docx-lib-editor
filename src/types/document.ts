import { ParagraphProperties, RunProperties } from './docx-properties'

/**
 * Перечисление типов элементов DOCX документа
 * @enum {string}
 */
export enum DomType {
    /** Корневой элемент документа */
    Document = 'document',
    /** Параграф */
    Paragraph = 'paragraph',
    /** Текстовый прогон (фрагмент текста с одинаковым форматированием) */
    Run = 'run',
    /** Таблица */
    Table = 'table',
    /** Строка таблицы */
    TableRow = 'tableRow',
    /** Ячейка таблицы */
    TableCell = 'tableCell',
    /** Текстовый узел */
    Text = 'text',
    /** Разрыв строки/страницы */
    Break = 'break',
    /** Графический элемент */
    Drawing = 'drawing',
    /** Изображение */
    Image = 'image',
    /** Элемент нумерованного списка */
    NumberingList = 'numberingList',
    /** Специальный символ */
    Symbol = 'symbol',
    /** Колонтитул */
    HEADER = 'header',
    /** Колонтитул */
    FOOTER = 'footer',
    /** Комментарий */
    COMMENT = 'comment',
    /** Закладка */
    BOOKMARK = 'bookmark',
    /** Гиперссылка */
    HYPERLINK = 'hyperlink',
    /** Графический объект */
    DRAWING = 'drawing',
    /** Поле */
    FIELD = 'field',
    /** Сноска */
    FOOTNOTE = 'footnote',
    /** Сноска */
    ENDNOTE = 'endnote',
}

/**
 * Базовый интерфейс для всех элементов DOCX документа
 */
export interface OpenXmlElement {
    /** Тип элемента */
    type: DomType
    /** Дочерние элементы */
    children?: OpenXmlElement[]
    /** Дополнительные свойства элемента */
    properties?: Record<string, any>
}

/**
 * Корневой элемент DOCX документа
 */
export interface WmlDocument extends OpenXmlElement {
    type: DomType.Document
    /** Тело документа */
    body: {
        /** Содержимое документа (параграфы и таблицы) */
        content: (WmlParagraph | WmlTable)[]
    }
}

/**
 * Текстовый узел документа
 */
export interface WmlText extends OpenXmlElement {
    type: DomType.Text
    /** Текстовое содержимое */
    text: string
}

/**
 * Специальный символ
 */
export interface WmlSymbol extends OpenXmlElement {
    type: DomType.Symbol
    /** Имя шрифта */
    font: string
    /** Символ */
    char: string
}

/**
 * Параграф документа
 */
export interface WmlParagraph extends OpenXmlElement {
    type: DomType.Paragraph
    /** Стиль параграфа */
    style?: { id: string }
    /** Нумерация параграфа */
    numbering?: { 
        /** ID нумерации */
        id: string; 
        /** Уровень нумерации */
        level?: number 
    }
    /** Содержимое параграфа (текстовые прогоны и текст) */
    content: (WmlRun | WmlText)[]
    /** Свойства параграфа */
    properties?: ParagraphProperties
    /** Уникальный идентификатор параграфа */
    paraId?: number
    /** Дополнительные свойства форматирования */
    formatting?: {
        /** Выравнивание текста */
        alignment?: string
        /** Отступы */
        indent?: {
            left?: string | number
            right?: string | number
            firstLine?: string | number
            hanging?: string | number
        }
        /** Межстрочный интервал и отступы до/после */
        spacing?: {
            before?: string | number
            after?: string | number
            line?: string | number
            lineRule?: string
        }
        /** Границы */
        borders?: Record<string, {
            style?: string
            size?: string | number
            color?: string
        }>
        /** Фон */
        shading?: {
            fill?: string
            color?: string
            value?: string
        }
    }
}

/**
 * Текстовый прогон
 */
export interface WmlRun extends OpenXmlElement {
    type: DomType.Run
    /** Содержимое прогона (текст, специальные символы и разрывы страниц) */
    content: (WmlText | WmlSymbol | WmlBreak)[]
    /** Свойства форматирования текста */
    properties?: RunProperties
}

/**
 * Таблица документа
 */
export interface WmlTable extends OpenXmlElement {
    type: DomType.Table
    /** Строки таблицы */
    rows: WmlTableRow[]
    /** Свойства таблицы */
    properties?: {
        width?: number
        borders?: TableBorders
        style?: string
        widthType?: string
        alignment?: string
        pageBreakBefore?: boolean
        pageBreakAfter?: boolean
    }
}

/**
 * Строка таблицы
 */
export interface WmlTableRow extends OpenXmlElement {
    type: DomType.TableRow
    /** Ячейки строки */
    cells: WmlTableCell[]
    /** Свойства строки */
    properties?: {
        height?: number
        style?: string
    }
}

/**
 * Ячейка таблицы
 */
export interface WmlTableCell extends OpenXmlElement {
    type: DomType.TableCell
    /** Содержимое ячейки (параграфы) */
    content: WmlParagraph[]
    /** Свойства ячейки */
    properties?: {
        width?: number
        borders?: TableBorders
        verticalMerge?: 'restart' | 'continue'
        horizontalMerge?: 'restart' | 'continue'
        span?: number
        style?: string
    }
}

/**
 * Границы таблицы, строки или ячейки
 */
export interface TableBorders {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
    insideH?: BorderStyle
    insideV?: BorderStyle
}

/**
 * Стиль границы
 */
export interface BorderStyle {
    /** Тип линии (solid, dashed, dotted и т.д.) */
    style: string
    /** Толщина линии в пунктах */
    width: number
    /** Цвет линии в формате RGB */
    color: string
}

/**
 * Интерфейс для колонтитула документа
 */
export interface WmlHeaderFooter extends OpenXmlElement {
    type: DomType.HEADER | DomType.FOOTER
    children: OpenXmlElement[]
}

export interface WmlText {
    type: DomType.Text
    text: string
    isFootnoteRef?: boolean
    footnoteId?: string
}

/**
 * Интерфейс для комментария в документе
 */
export interface WmlComment extends OpenXmlElement {
    type: DomType.COMMENT
    id: string
    author?: string
    date?: string
    content: OpenXmlElement[]
}

/**
 * Интерфейс для закладки в документе
 */
export interface WmlBookmark extends OpenXmlElement {
    type: DomType.BOOKMARK
    id: string
    name: string
}

/**
 * Интерфейс для гиперссылки
 */
export interface WmlHyperlink extends OpenXmlElement {
    type: DomType.HYPERLINK
    target: string
    tooltip?: string
    children: OpenXmlElement[]
}

/**
 * Интерфейс для графического объекта
 */
export interface WmlDrawing extends OpenXmlElement {
    type: DomType.DRAWING
    id: string
    name?: string
    description?: string
    width?: number
    height?: number
    target: string // URL или путь к ресурсу (изображению, диаграмме и т.д.)
}

/**
 * Интерфейс для поля документа
 */
export interface WmlField extends OpenXmlElement {
    type: DomType.FIELD
    fieldType: string
    instruction: string
    result?: OpenXmlElement[]
}

/**
 * Интерфейс для шрифта
 */
export interface WmlFont {
    name: string
    family?: string
    altName?: string
    charset?: string
    pitch?: string
}

/**
 * Интерфейс для сноски
 */
export interface WmlNote extends OpenXmlElement {
    type: DomType.FOOTNOTE | DomType.ENDNOTE
    id: string
    content: OpenXmlElement[]
}

/**
 * Интерфейс для разрыва страницы или строки
 */
export interface WmlBreak {
    /** Тип элемента */
    type: DomType.Break
    /** Тип разрыва: page - разрыв страницы, line - разрыв строки, column - разрыв колонки */
    breakType: 'page' | 'line' | 'column'
}

/**
 * Тип ссылки на колонтитул
 */
export enum WmlHeaderFooterReferenceType {
    DEFAULT = 'default',
    FIRST = 'first',
    EVEN = 'even'
}

/**
 * Интерфейс для ссылки на колонтитул
 */
export interface WmlHeaderFooterReference {
    id: string
    type: WmlHeaderFooterReferenceType
}

/**
 * Интерфейс для стиля DOM элемента
 */
export interface IDomStyle {
    id: string
    name?: string
    target?: string
    basedOn?: string
    isDefault?: boolean
    styles?: Array<{ target: string; values: Record<string, string | number> }>
    paragraphProps?: Record<string, any>
    runProps?: Record<string, any>
}

/**
 * Интерфейс для подстиля DOM элемента
 */
export interface IDomSubStyle {
    target: string
    styles?: Record<string, string | number>
    paragraphProps?: Record<string, any>
    runProps?: Record<string, any>
    values?: Record<string, string | number>
}

