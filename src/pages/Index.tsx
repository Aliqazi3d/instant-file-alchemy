import React, { useState } from 'react';
import { Upload, FileImage, FileText, Scissors, Merge, RotateCw, compress } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';
import ImageConverter from '@/components/ImageConverter';
import PDFConverter from '@/components/PDFConverter';
import PDFManipulator from '@/components/PDFManipulator';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (files.length > 0 && activeTab === 'upload') {
      // Auto-switch to appropriate tab based on file type
      const hasImages = files.some(f => f.type.startsWith('image/'));
      const hasPDFs = files.some(f => f.type === 'application/pdf');
      
      if (hasImages && !hasPDFs) {
        setActiveTab('image-convert');
      } else if (hasPDFs && !hasImages) {
        setActiveTab('pdf-convert');
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              FileForge Pro
            </h1>
            <p className="text-gray-600 text-lg">
              Professional image and PDF conversion tools, right in your browser
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="image-convert" className="flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              Image Tools
            </TabsTrigger>
            <TabsTrigger value="pdf-convert" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF Convert
            </TabsTrigger>
            <TabsTrigger value="pdf-manipulate" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              PDF Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8 bg-white/70 backdrop-blur-sm border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </Card>
            
            {uploadedFiles.length > 0 && (
              <Card className="p-6 bg-white/70 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Uploaded Files ({uploadedFiles.length})</h3>
                  <button
                    onClick={clearAllFiles}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <FileImage className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="image-convert">
            <ImageConverter files={uploadedFiles.filter(f => f.type.startsWith('image/'))} />
          </TabsContent>

          <TabsContent value="pdf-convert">
            <PDFConverter files={uploadedFiles} />
          </TabsContent>

          <TabsContent value="pdf-manipulate">
            <PDFManipulator files={uploadedFiles.filter(f => f.type === 'application/pdf')} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Features Overview */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-600">All processing happens in your browser - no uploads to servers</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Image Conversion</h3>
            <p className="text-sm text-gray-600">Convert between PNG, JPG, WebP, GIF, BMP, and SVG formats</p>
          </Card>
          
          <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <compress className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Compression</h3>
            <p className="text-sm text-gray-600">Reduce file sizes while maintaining quality</p>
          </Card>
          
          <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <Merge className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">PDF Merge</h3>
            <p className="text-sm text-gray-600">Combine multiple PDFs into single documents</p>
          </Card>
          
          <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <RotateCw className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">PDF Tools</h3>
            <p className="text-sm text-gray-600">Split, rotate, and manipulate PDF documents</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
