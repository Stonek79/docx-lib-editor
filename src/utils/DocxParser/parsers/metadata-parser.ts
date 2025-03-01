import { BaseParser } from '../base-parser'
import { DocumentMetadata } from '@/types/metadata'

/**
 * Парсер метаданных DOCX документа.
 * Отвечает за:
 * - Извлечение основных свойств документа из core.xml
 * - Обработку заголовка, темы, автора
 * - Обработку ключевых слов и описания
 * - Извлечение информации о времени создания и изменения
 */
export class MetadataParser extends BaseParser {
    /**
     * Парсит XML содержимое метаданных
     * @param xmlContent - XML содержимое файла core.xml
     * @returns Объект с метаданными документа
     */
    async parse(xmlContent: string): Promise<DocumentMetadata> {
        const coreProps = this.xmlParser.parse(xmlContent)
        const cp = coreProps?.['cp:coreProperties'] || {}

        return {
            title: cp['dc:title'],
            subject: cp['dc:subject'],
            creator: cp['dc:creator'],
            keywords: cp['cp:keywords'],
            description: cp['dc:description'],
            lastModifiedBy: cp['cp:lastModifiedBy'],
            revision: cp['cp:revision'],
            created: cp['dcterms:created'],
            modified: cp['dcterms:modified'],
        }
    }
}
