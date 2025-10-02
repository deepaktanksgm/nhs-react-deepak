import { FileText, Eye, ExternalLink } from 'lucide-react';

// ─── Document Card Component ─────────────────────────────────────────────────────
const DocumentCard = ({ doc, index, onViewDocument }) => {
    const getCleanTitle = (title) => {
        if (!title) return 'Untitled Document';

        const originalTitle = title;

        let cleanTitle = title
            .replace(/\.(pdf|docx?|txt|json)(\.(ocr|json))?$/gi, '')
            .replace(/^policy-/i, '')
            .replace(/nhsscotland-workforce-/gi, 'NHS Scotland Workforce ')
            .replace(/policy-(\d+)-(\d+)-/gi, 'Policy v$1.$2 ')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        cleanTitle = cleanTitle.replace(/\b\w/g, l => l.toUpperCase());
        cleanTitle = cleanTitle.replace(/\s+last updated.*$/i, '');
        cleanTitle = cleanTitle.replace(/\s+v?\d+(\.\d+)*$/i, '');

        if (cleanTitle.toLowerCase().includes('maternity')) {
            cleanTitle = cleanTitle.replace(/maternity policy/gi, 'Maternity Policy');
        }

        if (cleanTitle.length < 10 && originalTitle.includes('policy')) {
            cleanTitle = 'NHS Policy Document';
        }

        return {
            clean: cleanTitle.trim() || 'NHS Policy Document',
            original: originalTitle
        };
    };

    const getDocumentType = (url) => {
        if (!url) return 'unknown';

        // Remove query parameters and fragments for cleaner detection
        const cleanUrl = url.split('?')[0].split('#')[0];
        const extension = cleanUrl.toLowerCase().split('.').pop();

        // If no extension or it's a domain, treat as web page
        if (!extension || extension === cleanUrl.toLowerCase() || cleanUrl.includes('://') && !cleanUrl.includes('.', cleanUrl.indexOf('://') + 3)) {
            return 'webpage';
        }

        return extension;
    };

    const isWebPage = (url) => {
        const docType = getDocumentType(url);

        // Common web page indicators
        const webPageTypes = ['webpage', 'html', 'htm', 'php', 'asp', 'jsp'];
        const hasWebExtension = webPageTypes.includes(docType);

        // Check if it's a domain without file extension
        const isDomain = url.match(/^https?:\/\/[^\/]+\/?$/) ||
            url.match(/^https?:\/\/[^\/]+\/[^.]*$/) ||
            !url.includes('.', url.indexOf('://') + 3);

        // Check for common web patterns
        const hasWebPatterns = url.includes('://') && (
            url.includes('/page/') ||
            url.includes('/article/') ||
            url.includes('/post/') ||
            url.includes('?') ||
            url.includes('#')
        );

        return hasWebExtension || isDomain || hasWebPatterns;
    };

    const titleInfo = getCleanTitle(doc.title);

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <div className="flex items-center mr-2">
                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                            <h4
                                className="font-medium text-blue-900 text-sm leading-tight cursor-help"
                                title={`Original filename: ${titleInfo.original}`}
                            >
                                {titleInfo.clean}
                            </h4>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
                            Source #{index + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                            {doc.url && doc.url.trim() !== '' && (
                                <>
                                    {!isWebPage(doc.url) && <button
                                        onClick={() => onViewDocument(doc.url, titleInfo.clean)}
                                        className="text-blue-600 hover:text-blue-800 text-xs inline-flex items-center hover:underline font-medium"
                                        title="View document in right panel"
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View
                                    </button>
                                    }
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-xs inline-flex items-center hover:underline font-medium"
                                        title="Open document in new tab"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Open
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentCard;