/**
 * Типы для описания свойств элементов DOCX документа
 */

/**
 * Свойства параграфа
 */
export interface ParagraphProperties {
    /** ID стиля параграфа */
    styleId?: string
    /** Нумерация параграфа */
    numPr?: {
        /** ID нумерации */
        id: string
        /** Уровень нумерации */
        level: number
    }
    /** Выравнивание текста (left, right, center, both) */
    justification?: string
    /** Отступы параграфа */
    indentation?: {
        /** Отступ слева в твипах */
        left?: number
        /** Отступ справа в твипах */
        right?: number
        /** Отступ первой строки в твипах */
        firstLine?: number
        /** Выступ первой строки в твипах */
        hanging?: number
    }
    /** Интервалы */
    spacing?: {
        /** Интервал перед параграфом в твипах */
        before?: number
        /** Интервал после параграфа в твипах */
        after?: number
        /** Межстрочный интервал в твипах */
        line?: number
        /** Тип межстрочного интервала (auto, exact, atLeast) */
        lineRule?: string
    }
    /** Уровень структуры документа (0-9) */
    outlineLevel?: number
    /** Перенос страницы перед параграфом */
    pageBreakBefore?: boolean
    /** Перенос страницы после параграфа */
    pageBreakAfter?: boolean
}

/**
 * Свойства текстового прогона
 */
export interface RunProperties {
    /** ID стиля текста */
    styleId?: string
    /** Размер шрифта в пунктах */
    fontSize?: number
    /** Полужирное начертание */
    bold?: boolean
    /** Курсивное начертание */
    italic?: boolean
    /** Тип подчеркивания (single, double, wave) */
    underline?: string
    /** Зачеркивание */
    strike?: boolean
    /** Вертикальное выравнивание (superscript, subscript) */
    vertAlign?: 'superscript' | 'subscript'
    /** Цвет текста в формате RGB */
    color?: string
    /** Цвет выделения текста */
    highlight?: string
    /** URL гиперссылки */
    hyperlink?: string
    /** Все буквы заглавные */
    caps?: boolean
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
 * Границы таблицы, строки или ячейки
 */
export interface TableBorders {
    /** Верхняя граница */
    top?: BorderStyle
    /** Правая граница */
    right?: BorderStyle
    /** Нижняя граница */
    bottom?: BorderStyle
    /** Левая граница */
    left?: BorderStyle
    /** Горизонтальные внутренние границы */
    insideH?: BorderStyle
    /** Вертикальные внутренние границы */
    insideV?: BorderStyle
}

/**
 * Свойства таблицы
 */
export interface TableProperties {
    /** Ширина таблицы в твипах */
    width?: number
    /** ID стиля таблицы */
    style?: string
    /** Границы таблицы */
    borders?: TableBorders
    widthType?: string
    alignment?: string
    pageBreakBefore?: boolean
    pageBreakAfter?: boolean
}

/**
 * Свойства строки таблицы
 */
export interface TableRowProperties {
    /** Высота строки в твипах */
    height?: number
}

/**
 * Свойства ячейки таблицы
 */
export interface TableCellProperties {
    /** Ширина ячейки в твипах */
    width?: number
    /** Границы ячейки */
    borders?: TableBorders
    /** Вертикальное объединение ячеек */
    verticalMerge?: 'restart' | 'continue'
    /** Горизонтальное объединение ячеек */
    horizontalMerge?: 'restart' | 'continue'
    /** Количество объединяемых ячеек */
    span?: number
}

/**
 * Описание стиля DOCX документа
 */
export interface DocxStyle {
    /** Уникальный идентификатор стиля */
    id: string
    /** Отображаемое имя стиля */
    name?: string
    /** Имя стиля в CSS */
    cssName?: string
    /** Альтернативные имена стиля */
    aliases?: string[]
    /** Тип стиля (paragraph, character, table, numbering) */
    target: string
    /** ID базового стиля */
    basedOn?: string
    /** Является ли стилем по умолчанию */
    isDefault?: boolean
    /** Дополнительные стили */
    styles: DocxSubStyle[]
    /** ID связанного стиля */
    linked?: string
    /** ID следующего стиля */
    next?: string
    /** Свойства параграфа */
    paragraphProps?: ParagraphProperties
    /** Свойства текста */
    runProps?: RunProperties
}

/**
 * Описание подстиля DOCX документа
 */
export interface DocxSubStyle {
    /** Тип стиля (paragraph, character, table, numbering) */
    target: string
    /** ID стиля */
    styleId: string
    /** ID базового стиля */
    basedOn?: string
}
