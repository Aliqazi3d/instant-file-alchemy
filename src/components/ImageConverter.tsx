import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RotateCw, compress, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UploadedFile } from '@/pages/Index';

interface ImageConverterProps {
  files: UploadedFile[];
}

const ImageConverter: React.FC<ImageConverterProps> = ({ files }) => {
  const [outputFormat, setOutputFormat] = useState('png');
  const [quality, setQuality] = useState([80]);
  const [resize, setResize] = useState({ enabled: false, width: 1920, height: 1080 });
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const supportedFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' },
    { value: 'bmp', label: 'BMP' },
  ];

  const convertImage = async (file: UploadedFile): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Apply resize if enabled
        if (resize.enabled) {
          width = resize.width;
          height = resize.height;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Apply rotation
        if (rotation !== 0) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-img.width / 2, -img.height / 2);
          ctx.drawImage(img, 0, 0, img.width, img.height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Convert to desired format
        const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
        const qualityValue = outputFormat === 'jpeg' || outputFormat === 'webp' ? quality[0] / 100 : 1;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          mimeType,
          qualityValue
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file.file);
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload some images first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      for (const file of files) {
        const convertedBlob = await convertImage(file);
        
        // Create download link
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.split('.')[0]}_converted.${outputFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Conversion completed",
        description: `${files.length} image${files.length > 1 ? 's' : ''} converted successfully`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: "An error occurred during image conversion",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const compressImages = async () => {
    if (files.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload some images first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      for (const file of files) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${file.name.split('.')[0]}_compressed.${file.type.split('/')[1]}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve();
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              file.type,
              quality[0] / 100
            );
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file.file);
        });
      }

      toast({
        title: "Compression completed",
        description: `${files.length} image${files.length > 1 ? 's' : ''} compressed successfully`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression failed",
        description: "An error occurred during image compression",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center bg-white/70 backdrop-blur-sm">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Images Selected</h3>
        <p className="text-gray-500">Upload some images to start converting them.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/70 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          Image Conversion & Processing
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Format Conversion */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Format Conversion</h4>
            
            <div>
              <Label htmlFor="output-format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {supportedFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
              <div>
                <Label>Quality: {quality[0]}%</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  max={100}
                  min={10}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}

            <Button onClick={handleConvert} disabled={isProcessing} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {isProcessing ? 'Converting...' : 'Convert Images'}
            </Button>
          </div>

          {/* Image Processing */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Image Processing</h4>
            
            <div>
              <Label>Compression Quality: {quality[0]}%</Label>
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={100}
                min={10}
                step={1}
                className="mt-2"
              />
            </div>

            <Button onClick={compressImages} disabled={isProcessing} className="w-full" variant="outline">
              <compress className="w-4 h-4 mr-2" />
              {isProcessing ? 'Compressing...' : 'Compress Images'}
            </Button>
          </div>
        </div>

        {/* Resize Options */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="enable-resize"
              checked={resize.enabled}
              onChange={(e) => setResize(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="enable-resize">Enable Resize</Label>
          </div>
          
          {resize.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={resize.width}
                  onChange={(e) => setResize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={resize.height}
                  onChange={(e) => setResize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rotation */}
        <div className="mt-6 pt-6 border-t">
          <Label>Rotation: {rotation}°</Label>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation(prev => (prev - 90) % 360)}
            >
              <RotateCw className="w-4 h-4 transform scale-x-[-1]" />
            </Button>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              max={360}
              min={0}
              step={90}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* File List */}
      <Card className="p-6 bg-white/70 backdrop-blur-sm">
        <h4 className="font-medium mb-4">Selected Images ({files.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
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
      </Card>
    </div>
  );
};

export default ImageConverter;
