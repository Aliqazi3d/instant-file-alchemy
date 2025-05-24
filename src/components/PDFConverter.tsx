
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Image as ImageIcon, FileImage } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UploadedFile } from '@/pages/Index';

interface PDFConverterProps {
  files: UploadedFile[];
}

const PDFConverter: React.FC<PDFConverterProps> = ({ files }) => {
  const [pdfToImageFormat, setPdfToImageFormat] = useState('png');
  const [pageRange, setPageRange] = useState('all');
  const [customPageRange, setCustomPageRange] = useState('');
  const [dpi, setDpi] = useState(150);
  const [imageToPdfPageSize, setImageToPdfPageSize] = useState('a4');
  const [isProcessing, setIsProcessing] = useState(false);

  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  const pdfFiles = files.filter(f => f.type === 'application/pdf');

  const convertPDFToImages = async () => {
    if (pdfFiles.length === 0) {
      toast({
        title: "No PDFs selected",
        description: "Please upload some PDF files first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // This is a simplified implementation
      // In a real application, you would use PDF.js or similar library
      toast({
        title: "PDF to Image conversion",
        description: "This feature requires a PDF processing library to be fully implemented",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: "An error occurred during PDF to image conversion",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const convertImagesToPDF = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload some images first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const file of imageFiles) {
        const img = new Image();
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            if (!isFirstPage) {
              pdf.addPage();
            }
            
            // Calculate dimensions to fit the page
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            let ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;
            
            const xOffset = (pageWidth - finalWidth) / 2;
            const yOffset = (pageHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
            isFirstPage = false;
            resolve();
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file.file);
        });
      }

      // Save the PDF
      pdf.save('converted_images.pdf');

      toast({
        title: "Conversion completed",
        description: `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} converted to PDF successfully`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: "An error occurred during image to PDF conversion",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/70 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-red-600" />
          PDF Conversion Tools
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* PDF to Images */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              PDF to Images
            </h4>
            
            <div>
              <Label htmlFor="pdf-output-format">Output Format</Label>
              <Select value={pdfToImageFormat} onValueChange={setPdfToImageFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="bmp">BMP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="page-range">Page Range</Label>
              <Select value={pageRange} onValueChange={setPageRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  <SelectItem value="first">First Page Only</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pageRange === 'custom' && (
              <div>
                <Label htmlFor="custom-range">Custom Range (e.g., 1-5, 10, 15-20)</Label>
                <Input
                  id="custom-range"
                  value={customPageRange}
                  onChange={(e) => setCustomPageRange(e.target.value)}
                  placeholder="1-5, 10, 15-20"
                />
              </div>
            )}

            <div>
              <Label htmlFor="dpi">DPI Quality</Label>
              <Select value={dpi.toString()} onValueChange={(value) => setDpi(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72">72 DPI (Web)</SelectItem>
                  <SelectItem value="150">150 DPI (Standard)</SelectItem>
                  <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                  <SelectItem value="600">600 DPI (Print)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={convertPDFToImages} 
              disabled={isProcessing || pdfFiles.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isProcessing ? 'Converting...' : 'Convert PDF to Images'}
            </Button>
            
            <p className="text-sm text-gray-500">
              {pdfFiles.length} PDF file{pdfFiles.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Images to PDF */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Images to PDF
            </h4>
            
            <div>
              <Label htmlFor="page-size">Page Size</Label>
              <Select value={imageToPdfPageSize} onValueChange={setImageToPdfPageSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="legal">Legal (8.5 × 14 in)</SelectItem>
                  <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="a5">A5 (148 × 210 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Image Order</p>
              <p className="text-sm text-blue-600">
                Images will be added to the PDF in the order they were uploaded. 
                Each image will be placed on a separate page and automatically resized to fit.
              </p>
            </div>

            <Button 
              onClick={convertImagesToPDF} 
              disabled={isProcessing || imageFiles.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isProcessing ? 'Converting...' : 'Convert Images to PDF'}
            </Button>
            
            <p className="text-sm text-gray-500">
              {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
      </Card>

      {/* File Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* PDF Files */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            PDF Files ({pdfFiles.length})
          </h4>
          {pdfFiles.length > 0 ? (
            <div className="space-y-3">
              {pdfFiles.map((file) => (
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
          ) : (
            <p className="text-gray-500 text-sm">No PDF files uploaded</p>
          )}
        </Card>

        {/* Image Files */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Image Files ({imageFiles.length})
          </h4>
          {imageFiles.length > 0 ? (
            <div className="space-y-3">
              {imageFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No image files uploaded</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PDFConverter;
