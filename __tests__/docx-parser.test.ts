import { DocxParser } from '../src/utils/DocxParser/docx-parser'
import * as fs from 'fs'
import * as path from 'path'

describe('DocxParser', () => {
    let parser: DocxParser

    beforeEach(() => {
        parser = new DocxParser()
    })

    it('should parse a full test DOCX file', async () => {
        // Читаем тестовый файл
        const filePath = path.join(__dirname, 'fixtures', 'test.docx')
        const fileBuffer = fs.readFileSync(filePath)
        const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)

        const result = await parser.parse(arrayBuffer)

        // Проверяем базовую структуру результата
        expect(result).toBeDefined()
        expect(result.html).toBeDefined()
        expect(result.styles).toBeDefined()
        expect(result.numbering).toBeDefined()
        expect(result.relationships).toBeDefined()
        expect(result.images).toBeDefined()

        // Проверяем наличие всех параграфов
        const paragraphs = result.html.filter(node => node.type === 'paragraph')
        expect(paragraphs.length).toBeGreaterThan(0)

        // Проверяем простой текст
        const simpleText = paragraphs.find(p => 
            p.children?.some(child => 
                child.type === 'text' && child.text === 'Простой текст'
            )
        )
        expect(simpleText).toBeDefined()

        // Проверяем форматированный текст
        const formattedText = paragraphs.find(p =>
            p.children?.some(child =>
                child.type === 'text' &&
                child.text === 'Форматированный текст (жирный, курсив, красный, 14pt)' &&
                child.properties?.bold === true &&
                child.properties?.italic === true &&
                child.properties?.color === 'FF0000' &&
                child.properties?.size === 28
            )
        )
        expect(formattedText).toBeDefined()

        // Проверяем заголовок
        const heading = paragraphs.find(p =>
            p.properties?.styleId === 'Heading1' &&
            p.properties?.justification === 'center' &&
            p.children?.some(child => child.text === 'Тестовый заголовок')
        )
        expect(heading).toBeDefined()

        // Проверяем нумерованный список
        const listItems = paragraphs.filter(p => p.properties?.numbering?.numId === 1)
        expect(listItems.length).toBe(2)
        expect(listItems[0].children?.[0].text).toBe('Первый элемент списка')
        expect(listItems[1].children?.[0].text).toBe('Второй элемент списка')

        // Проверяем таблицу
        const tables = result.html.filter(node => node.type === 'table')
        expect(tables.length).toBeGreaterThan(0)
        const firstTable = tables[0]
        expect(firstTable.children?.length).toBe(1) // одна строка
        expect(firstTable.children?.[0].children?.length).toBe(2) // две ячейки

        // Проверяем гиперссылку
        const hyperlink = paragraphs.find(p =>
            p.children?.some(child =>
                child.type === 'hyperlink' &&
                child.properties?.href === 'http://www.google.com' &&
                child.children?.[0].text === 'Ссылка на Google'
            )
        )
        expect(hyperlink).toBeDefined()

        // Проверяем закладку
        const bookmark = paragraphs.find(p =>
            p.children?.some(child =>
                child.type === 'bookmark' &&
                child.properties?.name === 'test_bookmark'
            )
        )
        expect(bookmark).toBeDefined()

        // Проверяем комментарий
        expect(result.comments).toBeDefined()
        expect(result.comments?.length).toBeGreaterThan(0)
        expect(result.comments?.[0].id).toBe('1')
        expect(result.comments?.[0].author).toBe('Test Author')

        // Проверяем сноску
        expect(result.footnotes).toBeDefined()
        const footnote = result.footnotes?.find(f => f.id === '1')
        expect(footnote).toBeDefined()
        expect(footnote?.children?.[0].children?.[0].text).toBe('Тестовая сноска')

        // Проверяем поле PAGE
        const pageField = paragraphs.find(p =>
            p.children?.some(child =>
                child.type === 'field' &&
                child.properties?.type === 'simple' &&
                child.properties?.instruction?.trim() === 'PAGE'
            )
        )
        expect(pageField).toBeDefined()

        // Проверяем изображение
        expect(result.images).toBeDefined()
        expect(Object.keys(result.images).length).toBeGreaterThan(0)

        // Проверяем колонтитулы
        expect(result.headers).toBeDefined()
        expect(result.headers?.['1']?.children?.[0].children?.[0].text).toBe('Тестовый верхний колонтитул')
        expect(result.footers).toBeDefined()
        expect(result.footers?.['1']?.children?.[0].children?.[0].text).toBe('Тестовый нижний колонтитул')

        // Проверяем стили
        expect(result.styles?.['Heading1']).toBeDefined()
        expect(result.styles?.['TableGrid']).toBeDefined()

        // Проверяем нумерацию
        expect(result.numbering?.['1']).toBeDefined()
        expect(result.numbering?.['1'].levels?.[0].format).toBe('decimal')
    })
})
