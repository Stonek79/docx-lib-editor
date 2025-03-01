/**
 * Определение нумерации в DOCX документе
 */
export interface NumberingDefinition {
    /** Уникальный идентификатор нумерации */
    id: string
    /** ID абстрактной нумерации */
    abstractNumId: string
    /** Уровни нумерации, где ключ - это номер уровня */
    levels: Record<string, NumberingLevel>
}

/**
 * Уровень нумерации
 */
export interface NumberingLevel {
    /** Номер уровня (0-8) */
    level: number
    /** Начальное значение нумерации */
    start: number
    /** Формат нумерации (decimal, upperRoman, lowerRoman, upperLetter, lowerLetter, bullet) */
    format: string
    /** Шаблон текста нумерации, где %1, %2 и т.д. заменяются на номера соответствующих уровней */
    text: string
    /** Стиль параграфа для уровня нумерации */
    style?: any
    /** Стиль текста для уровня нумерации */
    runStyle?: any
    /** Суффикс после номера (tab, space, nothing) */
    suffix?: string
    /** Выравнивание номера (left, center, right) */
    alignment?: string
    /** Использовать юридическую нумерацию (1.1, 1.1.1) */
    isLgl?: boolean
    /** Родительский уровень нумерации */
    parentLevel?: number
    /** Счетчик для текущего уровня */
    counter?: number
    /** Перезапускать счетчик при изменении родительского уровня */
    restart?: boolean
}

/**
 * Абстрактная нумерация
 * Определяет базовый шаблон нумерации, который может быть переопределен
 */
export interface AbstractNumbering {
    /** Уникальный идентификатор абстрактной нумерации */
    id: string
    /** Уровни нумерации */
    levels: Record<string, NumberingLevel>
    /** Ссылка на стиль нумерации */
    numStyleLink?: string
    /** Ссылка на связанный стиль */
    styleLink?: string
}

/**
 * Экземпляр нумерации
 * Представляет конкретное использование абстрактной нумерации с возможными переопределениями
 */
export interface NumberingInstance {
    /** Уникальный идентификатор экземпляра */
    id: string
    /** Абстрактная нумерация, на которой основан экземпляр */
    abstractNum: AbstractNumbering
    /** Переопределения уровней нумерации */
    overrides?: Record<string, Partial<NumberingLevel>>
}
