
import React, { useCallback, useState } from 'react';
import { Upload, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { UploadedFile } from '@/pages/Index';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback((fileList: FileList) => {
    setIsProcessing(true);
    const files: UploadedFile[] = [];
    
    Array.from(fileList).forEach((file) => {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        toast({
          title: "Unsupported format",
          description: `${file.name} is not a supported image or PDF file`,
          variant: "destructive",
        });
        return;
      }

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 100,
        status: 'completed',
      };

      files.push(uploadedFile);
    });

    if (files.length > 0) {
      onFilesUploaded(files);
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file${files.length > 1 ? 's' : ''} ready for processing`,
      });
    }
    
    setIsProcessing(false);
  }, [onFilesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  return (
    <div className="text-center">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50/50 scale-105'
            : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Drop your files here
            </h3>
            <p className="text-gray-600 mb-6">
              Support for images (PNG, JPG, WebP, GIF, BMP, SVG) and PDF files up to 50MB
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileImage className="w-4 h-4" />
              Images
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              PDFs
            </div>
          </div>

          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Browse Files'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
