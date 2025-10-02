import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, FileText, ExternalLink, Loader2, Search, AlertTriangle, Anchor, Eye, X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// ─── Text Document Viewer Component ───────────────────────────────────────────
const TextDocumentViewer = ({ documentUrl, zoom, onLoad, onError }) => {
    const [textContent, setTextContent] = useState('');

    useEffect(() => {
        fetch(documentUrl)
            .then(response => response.text())
            .then(text => {
                setTextContent(text);
                onLoad();
            })
            .catch(err => {
                console.error('Failed to load text content:', err);
                onError(err);
            });
    }, [documentUrl, onLoad, onError]);

    return (
        <div className="p-4 h-full overflow-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                {textContent || 'Loading...'}
            </pre>
        </div>
    );
};

// ─── URL/Web Page Viewer Component ────────────────────────────────────────────
const WebPageViewer = ({ documentUrl, zoom, onLoad, onError }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const handleIframeLoad = () => {
        setIsLoading(false);
        setLoadError(false);
        onLoad();
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setLoadError(true);
        onError(new Error('Failed to load web page'));
    };

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Globe className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cannot Display Page</h3>
                <p className="text-gray-600 mb-4">
                    This page cannot be displayed in an iframe due to security restrictions.
                </p>
                <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                </a>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading page...</p>
                    </div>
                </div>
            )}
            <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="Web Page Viewer"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
        </div>
    );
};


// ─── Document Viewer Component ────────────────────────────────────────────────
// ─── Simple Document Viewer Component ─────────────────────────────────────────
const DocumentViewer = ({ onToggleFullScreen, isFullScreen, documentUrl, documentTitle, onClose, forceUrlOpen = false }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLoad = () => {
        setIsLoading(false);
        setError(null);
    };

    const handleLoadSuccess = () => {
        setIsLoading(false);
        setError(null);
    };

    const handleLoadError = (err) => {
        setIsLoading(false);
        setError('Failed to load document. Please try downloading it directly.');
        console.error('Document load error:', err);
    };

    const handleError = () => {
        setIsLoading(false);
        setError('Failed to load document');
    };
    // const getDocumentType = (url) => {
    //     if (!url) return 'unknown';
    //     const extension = url.toLowerCase().split('.').pop();
    //     return extension || 'unknown';
    // };
    // Enhanced document type detection
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

    // Check if URL is likely a web page
    const isWebPage = (url) => {
        if (forceUrlOpen) return true;

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

    const renderDocumentContent = () => {
        const docType = getDocumentType(documentUrl);

        // If forced to open as URL or detected as web page
        if (forceUrlOpen || isWebPage(documentUrl)) {
            return <WebPageViewer documentUrl={documentUrl} zoom={zoom} onLoad={handleLoadSuccess} onError={handleLoadError} />;
        }

        // For PDF files - try multiple approaches
        if (docType === 'pdf') {
            return (
                <div className="w-full h-full">
                    {/* Try direct PDF embedding first */}
                    {/* <object
              data={documentUrl}
              type="application/pdf"
              width="100%"
              height="600px"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              onLoad={handleLoadSuccess}
              onError={handleLoadError}
            > */}
                    {/* Fallback: Google Docs Viewer */}
                    <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                        width="100%"
                        height="100%"
                        onLoad={handleLoadSuccess}
                        onError={handleLoadError}
                        style={{ border: 'none' }}
                        title={documentTitle}
                    />
                    {/* </object> */}
                </div>
            );
        }

        // For images
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(docType)) {
            return (
                <div className="flex justify-center items-center p-4 overflow-auto">
                    <img
                        src={documentUrl}
                        alt={documentTitle}
                        style={{
                            transform: `scale(${zoom})`,
                            maxWidth: zoom > 1 ? 'none' : '100%',
                            height: 'auto',
                            cursor: zoom > 1 ? 'grab' : 'default'
                        }}
                        onLoad={handleLoadSuccess}
                        onError={handleLoadError}
                        draggable={false}
                    />
                </div>
            );
        }

        // For text files and JSON - we'll handle this differently
        if (['txt', 'json', 'csv'].includes(docType)) {
            return <TextDocumentViewer documentUrl={documentUrl} zoom={zoom} onLoad={handleLoadSuccess} onError={handleLoadError} />;
        }

        // For Word documents - try multiple viewers
        if (['doc', 'docx'].includes(docType)) {
            return (
                <div className="w-full h-full">
                    {/* Try Google Docs Viewer */}
                    <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                        width="100%"
                        height="600px"
                        onLoad={handleLoadSuccess}
                        onError={() => {
                            // If Google Viewer fails, try Office Online
                            const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
                            const iframe = document.createElement('iframe');
                            iframe.src = officeUrl;
                            iframe.width = '100%';
                            iframe.height = '600px';
                            iframe.style.border = 'none';
                            iframe.onload = handleLoadSuccess;
                            iframe.onerror = handleLoadError;

                            // Replace current iframe
                            const container = document.querySelector('.document-container');
                            if (container) {
                                container.innerHTML = '';
                                container.appendChild(iframe);
                            }
                        }}
                        style={{ border: 'none', transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                        title={documentTitle}
                    />
                </div>
            );
        }

        // Fallback: try to determine if it's viewable
        return (
            <div className="w-full h-full">
                <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
                    <p className="text-gray-600 mb-4">
                        This file type ({docType.toUpperCase()}) cannot be previewed in the browser.
                    </p>
                    <div className="space-y-2">
                        <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in New Tab
                        </a>
                        <a
                            href={documentUrl}
                            download
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download File
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full bg-white">
            {/* Document Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm text-left font-medium text-gray-900 truncate" title={documentTitle}>
                                {documentTitle}
                            </h3>
                            {/* <p className="text-xs text-gray-500 truncate" title={documentUrl}>
                                {documentUrl}
                            </p> */}
                        </div>
                    </div>
                    {/* <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                    </a> */}
                    {!isMobile && <button
                        onClick={onToggleFullScreen}
                        className="inline-flex items-center mr-1 px-2 py-1 custom-blue-bg text-white rounded-sm hover:bg-gray-700 transition-colors"
                    >
                        {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                    </button>
                    }
                    {!isWebPage(documentUrl) && <a
                        href={documentUrl}
                        download
                        className="inline-flex items-center px-2 py-1 custom-blue-bg text-white rounded-sm hover:bg-gray-700 transition-colors"
                    >
                        {/* <Download className="mr-2" /> */}
                        Download
                    </a>
                    }
                    <button
                        onClick={onClose}
                        className="ml-2 text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200"
                        title="Close document viewer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Loading document...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center p-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-red-600 mb-2">{error}</p>
                            <a
                                href={documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                                Open in new tab
                            </a>
                        </div>
                    </div>
                )}

                {documentUrl && (
                    //   <iframe
                    //     src={documentUrl}
                    //     className="w-full h-full border-0"
                    //     onLoad={handleLoad}
                    //     onError={handleError}
                    //     title={documentTitle}
                    //   />
                    renderDocumentContent()
                )}
            </div>
        </div>
    );
};
export default DocumentViewer;