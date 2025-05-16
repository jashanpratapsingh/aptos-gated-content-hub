
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
  onDownload?: () => void;
}

const PdfViewer = ({ pdfUrl, onDownload }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

  // Effect to re-attempt loading if URL is valid but loading fails
  useEffect(() => {
    if (error && retries < maxRetries && pdfUrl) {
      const timer = setTimeout(() => {
        console.log(`Retrying PDF load (${retries + 1}/${maxRetries})...`);
        setError(null);
        setLoading(true);
        setRetries(r => r + 1);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [error, retries, pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error, 'for URL:', pdfUrl);
    setError(error);
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  console.log('PdfViewer rendering with URL:', pdfUrl);

  return (
    <div className="pdf-viewer flex flex-col items-center w-full">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-aptosCyan" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-center">
          <p>Failed to load PDF. {retries < maxRetries ? "Retrying..." : "Please try again later."}</p>
          {retries >= maxRetries && (
            <p className="mt-2 text-sm">Error: {error.message}</p>
          )}
        </div>
      )}
      
      <ScrollArea className="w-full rounded-md border h-[600px]">
        <div className="flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Loader2 className="h-8 w-8 animate-spin text-aptosCyan" />}
            error={<p>Error loading PDF. Please try again.</p>}
            className="pdf-document"
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page" 
              width={600}
            />
          </Document>
        </div>
      </ScrollArea>
      
      {!loading && !error && numPages && numPages > 0 && (
        <div className="pdf-controls flex flex-col sm:flex-row justify-between items-center w-full mt-4 gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {onDownload && (
            <Button 
              className="aptos-btn" 
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
