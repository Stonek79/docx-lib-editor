import { BaseParser } from '../base-parser'
import { Relationship } from '@/types/relationships'
import JSZip from 'jszip'

/**
 * Парсер изображений DOCX документа.
 * Отвечает за:
 * - Извлечение изображений из ZIP архива
 * - Конвертацию изображений в base64 формат
 * - Определение MIME типов изображений
 * - Создание data URL для использования в HTML
 */
export class ImageParser extends BaseParser {
    private images: Map<string, string> = new Map()

    /**
     * Устанавливает ZIP архив для извлечения изображений
     * @param zip - JSZip объект с содержимым DOCX файла
     */
    setZip(zip: JSZip) {
        this.zip = zip
    }

    /**
     * Извлекает и обрабатывает изображения из DOCX файла
     * @param relationships - Map связей, где ключ - это ID связи
     * @returns Map изображений, где ключ - это имя файла, а значение - data URL
     */
    async parse(
        relationships: Map<string, Relationship>,
    ): Promise<Map<string, string>> {
        if (!this.zip) {
            throw new Error('ZIP archive not set')
        }

        const imageRelationships = Array.from(relationships.values()).filter(
            (rel) =>
                rel.type ===
                'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
        )

        for (const rel of imageRelationships) {
            const fileName = `word/${rel.target}`
            const content = await this.zip.file(fileName)?.async('base64')
            if (!content) continue

            const extension = fileName.split('.').pop()?.toLowerCase()
            const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
            const dataUrl = `data:${mimeType};base64,${content}`

            const key = fileName.split('/').pop() || fileName
            this.images.set(key, dataUrl)
        }

        return this.images
    }
}
