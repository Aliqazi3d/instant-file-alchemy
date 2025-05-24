import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Download, Merge, Scissors, compress, RotateCw, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UploadedFile } from '@/pages/Index';

interface PDFManipulatorProps {
  files: UploadedFile[];
}

const PDFManipulator: React.FC<PDFManipulatorProps> = ({ files }) => {
  const [mergeOrder, setMergeOrder] = useState<string[]>(files.map(f => f.id));
  const [splitRange, setSplitRange] = useState('');
  const [splitMode, setSplitMode] = useState('range');
  const [compressionLevel, setCompressionLevel] = useState([70]);
  const [rotationAngle, setRotationAngle] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    setMergeOrder(files.map(f => f.id));
  }, [files]);

  const movePDF = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...mergeOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setMergeOrder(newOrder);
    }
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please select at least 2 PDF files to merge",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // This is a simplified implementation
      // In a real application, you would use PDF-lib or similar library
      const { PDFDocument } = await import('pdf-lib');
      
      const mergedPdf = await PDFDocument.create();
      
      for (const fileId of mergeOrder) {
        const file = files.find(f => f.id === fileId);
        if (!file) continue;
        
        const arrayBuffer = await file.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        pages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged_document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Merge completed",
        description: `${files.length} PDF files merged successfully`,
      });
    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "Merge failed",
        description: "An error occurred during PDF merging",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const splitPDF = async () => {
    if (files.length !== 1) {
      toast({
        title: "Select one PDF",
        description: "Please select exactly one PDF file to split",
        variant: "destructive",
      });
      return;
    }

    if (!splitRange.trim()) {
      toast({
        title: "Enter page range",
        description: "Please specify which pages to extract",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { PDFDocument } = await import('pdf-lib');
      
      const file = files[0];
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // Parse page range
      const pages = parsePageRange(splitRange, pdf.getPageCount());
      
      if (pages.length === 0) {
        throw new Error('Invalid page range');
      }

      if (splitMode === 'range') {
        // Create single PDF with specified pages
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, pages.map(p => p - 1));
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.split('.')[0]}_pages_${splitRange}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Create separate PDF for each page
        for (const pageNum of pages) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdf, [pageNum - 1]);
          newPdf.addPage(copiedPage);
          
          const pdfBytes = await newPdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${file.name.split('.')[0]}_page_${pageNum}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      toast({
        title: "Split completed",
        description: `PDF split successfully into ${splitMode === 'range' ? '1 file' : `${pages.length} files`}`,
      });
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split failed",
        description: "An error occurred during PDF splitting. Check your page range.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePageRange = (range: string, totalPages: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
        if (start && end && start <= end && start >= 1 && end <= totalPages) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(trimmed);
        if (pageNum >= 1 && pageNum <= totalPages) {
          pages.push(pageNum);
        }
      }
    }
    
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const compressPDF = async () => {
    if (files.length === 0) {
      toast({
        title: "No PDFs selected",
        description: "Please select some PDF files to compress",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // This is a simplified implementation
      // Real PDF compression would require more sophisticated algorithms
      toast({
        title: "PDF compression",
        description: "Advanced PDF compression requires specialized libraries. This feature is partially implemented.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression failed",
        description: "An error occurred during PDF compression",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 backdrop-blur-sm">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No PDFs Selected</h3>
        <p className="text-gray-500">Upload some PDF files to start manipulating them.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/70 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Scissors className="w-6 h-6 text-orange-600" />
          PDF Manipulation Tools
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Merge PDFs */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Merge className="w-5 h-5" />
              Merge PDFs
            </h4>
            
            <div className="space-y-2">
              <Label>File Order (drag to reorder)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mergeOrder.map((fileId, index) => {
                  const file = files.find(f => f.id === fileId);
                  if (!file) return null;
                  
                  return (
                    <div key={fileId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePDF(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePDF(index, 'down')}
                          disabled={index === mergeOrder.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={mergePDFs} disabled={isProcessing || files.length < 2} className="w-full">
              <Merge className="w-4 h-4 mr-2" />
              {isProcessing ? 'Merging...' : 'Merge PDFs'}
            </Button>
          </div>

          {/* Split PDF */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Split PDF
            </h4>
            
            <div>
              <Label htmlFor="split-mode">Split Mode</Label>
              <Select value={splitMode} onValueChange={setSplitMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select split mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="range">Extract Range to Single PDF</SelectItem>
                  <SelectItem value="individual">Split to Individual Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="split-range">Page Range</Label>
              <Input
                id="split-range"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g., 1-5, 10, 15-20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter page numbers (1, 3, 5) or ranges (1-5, 10-15)
              </p>
            </div>

            <Button onClick={splitPDF} disabled={isProcessing || files.length !== 1} className="w-full">
              <Scissors className="w-4 h-4 mr-2" />
              {isProcessing ? 'Splitting...' : 'Split PDF'}
            </Button>
            
            {files.length !== 1 && (
              <p className="text-sm text-orange-600">Select exactly one PDF file to split</p>
            )}
          </div>
        </div>

        {/* Compression */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            <compress className="w-5 h-5" />
            Compress PDFs
          </h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Compression Level: {compressionLevel[0]}%</Label>
              <Slider
                value={compressionLevel}
                onValueChange={setCompressionLevel}
                max={100}
                min={10}
                step={10}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>High Compression</span>
                <span>High Quality</span>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button onClick={compressPDF} disabled={isProcessing} className="w-full">
                <compress className="w-4 h-4 mr-2" />
                {isProcessing ? 'Compressing...' : 'Compress PDFs'}
              </Button>
            </div>
          </div>

        {/* Rotation */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            <RotateCw className="w-5 h-5" />
            Rotate Pages
          </h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Rotation Angle</Label>
              <Select value={rotationAngle.toString()} onValueChange={(value) => setRotationAngle(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select angle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90° Clockwise</SelectItem>
                  <SelectItem value="180">180°</SelectItem>
                  <SelectItem value="270">270° Clockwise (90° Counter-clockwise)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button disabled={isProcessing} className="w-full" variant="outline">
                <RotateCw className="w-4 h-4 mr-2" />
                {isProcessing ? 'Rotating...' : 'Rotate Pages'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* File List */}
      <Card className="p-6 bg-white/70 backdrop-blur-sm">
        <h4 className="font-medium mb-4">Selected PDF Files ({files.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PDFManipulator;
