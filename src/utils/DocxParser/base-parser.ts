import { XMLParser } from 'fast-xml-parser'
import JSZip from 'jszip'
import { DomType, WmlText, WmlSymbol, WmlBreak } from '@/types/document'

/**
 * Интерфейс опций парсера
 * @property ignoreWidth - Игнорировать ширину элементов при парсинге
 * @property debug - Включить отладочный режим для вывода дополнительной информации
 */
export interface ParserOptions {
    ignoreWidth?: boolean
    debug?: boolean
}

/**
 * Базовый класс для всех парсеров DOCX документа.
 * Предоставляет общую функциональность для работы с XML и ZIP файлами,
 * а также утилиты для создания базовых элементов документа.
 *
 * Основные возможности:
 * - Парсинг XML с помощью fast-xml-parser
 * - Работа с ZIP архивами через JSZip
 * - Создание базовых элементов документа (текст, символы, разрывы)
 * - Поддержка отладочного режима
 */
export class BaseParser {
    protected zip!: JSZip
    protected xmlParser: XMLParser
    protected options: ParserOptions

    /**
     * @param options - Опции парсера
     * @param options.ignoreWidth - Игнорировать ширину элементов
     * @param options.debug - Включить отладочный режим
     */
    constructor(options: ParserOptions = {}) {
        this.options = {
            ignoreWidth: false,
            debug: true,
            ...options,
        }

        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: false, // Не преобразовывать атрибуты в числа/булевы значения
            numberParseOptions: {
                // Настройки парсинга чисел
                hex: false, // Не парсить шестнадцатеричные числа
                leadingZeros: false, // Не парсить числа с ведущими нулями
                eNotation: false, // Не парсить экспоненциальную запись
            },
            ignoreDeclaration: true,
            preserveOrder: false,
            trimValues: false,
            alwaysCreateTextNode: false,
        })
    }

    /**
     * Загружает и парсит XML файл из ZIP архива
     * @param path - Путь к файлу внутри ZIP архива
     * @returns Распарсенный XML в виде JavaScript объекта
     * @throws {Error} Если файл не найден в архиве
     */
    protected async loadXmlFile(path: string): Promise<any> {
        const content = await this.zip.file(path)?.async('text')
        if (!content) throw new Error(`Could not find ${path}`)
        return this.xmlParser.parse(content)
    }

    /**
     * Создает текстовый узел документа
     * @param text - Текстовое содержимое
     * @returns Объект WmlText с типом DomType.Text и текстовым содержимым
     */
    protected createTextNode(text: string): WmlText {
        return {
            type: DomType.Text,
            text,
        }
    }

    /**
     * Создает узел разрыва строки/страницы
     * @param breakType - Тип разрыва: page, line или column. Если не указан, используется line
     * @returns Объект WmlBreak с типом DomType.Break и типом разрыва
     * @description Используется для вставки разрывов строк или страниц в документ
     */
    protected createBreakNode(
        breakType: 'page' | 'line' | 'column' = 'line',
    ): WmlBreak {
        console.log('Break Type:', breakType)

        return {
            type: DomType.Break,
            breakType,
        }
    }

    /**
     * Создает узел символа
     * @param font - Имя шрифта, из которого берется символ
     * @param char - Символ для вставки
     * @returns Объект WmlSymbol с типом DomType.Symbol, шрифтом и символом
     * @description Используется для вставки специальных символов или символов
     * из определенных шрифтов, которые не могут быть представлены как обычный текст
     */
    protected createSymbolNode(font: string, char: string): WmlSymbol {
        return {
            type: DomType.Symbol,
            font,
            char,
        }
    }
}
