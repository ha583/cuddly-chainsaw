import React, { useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { processDocument } from '@/services/documentProcessor';

interface DocumentUploadProps {
  onUpload?: (content: string) => void;
  onProcessDocument?: (document: File) => void;
  onClose: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, onProcessDocument, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // If onProcessDocument is available, use it directly
      if (onProcessDocument) {
        onProcessDocument(file);
        toast({
          title: "Document submitted",
          description: `Processing ${file.name}`,
        });
        onClose();
      } else if (onUpload) {
        const result = await processDocument(file);
        onUpload(result.content);
        toast({
          title: "Document uploaded",
          description: `Successfully processed ${file.name}`,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="p-4 border border-border rounded-lg bg-background/80 backdrop-blur">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upload Document</h3>
        <button 
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded-full"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          {file ? (
            <div className="flex items-center gap-3">
              <FileText className="text-primary" size={24} />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <label htmlFor="file-upload" className="block">
                <span className="mt-2 block text-sm font-medium text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,image/*"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, TXT, or images up to 10MB
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
