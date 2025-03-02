'use client'
import { useState, useEffect, useRef } from 'react'
import { Box, Button, CircularProgress } from '@mui/material'
import { DocxParser } from '@/utils/DocxParser'
import { PageBreaker } from '@/utils/PageBreaker/pageBreaker'
import '@/styles/a4.css'
import { LoadedHtmlContentContainer } from '@/features'

/**
 * Компонент редактора DOCX документов
 * Отвечает за:
 * - Загрузку DOCX файлов через интерфейс выбора файлов
 * - Парсинг DOCX документов с помощью DocxParser
 * - Отображение содержимого документа в HTML формате
 * - Индикацию процесса загрузки и обработки файла
 * - Автоматическую разбивку содержимого на страницы
 *
 * @example
 * // Использование компонента
 * <DocumentEditor />
 */
export function DocumentEditor() {
    // Состояние загрузки файла
    const [loading, setLoading] = useState(false)
    // HTML содержимое документа
    const [content, setContent] = useState<string>('')
    // Ссылка на контейнер содержимого
    const contentRef = useRef<HTMLDivElement>(null)
    // Ссылка на объект PageBreaker
    const pageBreakerRef = useRef<PageBreaker | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    /**
     * Обработчик выбора файла
     * @param event - Событие изменения input[type="file"]
     */
    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        console.log('OPEN')

        const file = event.target.files?.[0]
        if (!file || !file.name.endsWith('.docx')) return

        // Сбрасываем PageBreaker
        if (pageBreakerRef.current) {
            pageBreakerRef.current = null
        }

        setLoading(true)
        
        setContent('')
        try {
            const parser = new DocxParser()
            const result = await parser.parse(file)

            setContent(result.html)
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error parsing document:', error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Инициализация PageBreaker после загрузки содержимого
     */
    useEffect(() => {
        if (content && contentRef.current) {
            // Ждем, пока DOM обновится с новым содержимым
            setTimeout(() => {
                // Если PageBreaker еще не создан, создаем его
                if (!pageBreakerRef.current) {
                    pageBreakerRef.current = new PageBreaker()
                }

                // Находим контейнер страниц внутри contentRef
                const pagesContainer = contentRef.current?.querySelector(
                    '.a4-pages-container',
                )

                if (pagesContainer) {
                    // Инициализируем PageBreaker с контейнером страниц
                    pageBreakerRef.current.init(pagesContainer as HTMLElement)
                }
            }, 100)
        }
    }, [content])

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                padding: '20px',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <Button
                    variant="contained"
                    component="label"
                    disabled={loading}
                >
                    Загрузить документ
                    <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept=".docx"
                        onChange={handleFileSelect}
                    />
                </Button>
                {loading && <CircularProgress size={24} />}
            </Box>
            <LoadedHtmlContentContainer
                content={content}
                contentRef={contentRef}
            />
        </Box>
    )
}
