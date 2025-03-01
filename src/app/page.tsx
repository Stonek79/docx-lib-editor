import { DocumentEditor } from '@/widgets/DocumentEditor'

/**
 * Главная страница приложения
 * Отображает редактор DOCX документов
 *
 * @returns Компонент DocumentEditor, который предоставляет
 * интерфейс для просмотра и редактирования DOCX файлов
 */
export default function Home() {
    return <DocumentEditor />
}
