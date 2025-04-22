import { useState, useRef, ChangeEvent } from "react";
import { X, Upload, FileIcon, ImageIcon, FilmIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface FileUploadProps {
  onChange: (files: FileWithPreview[]) => void;
  value: FileWithPreview[];
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  className?: string;
}

export function FileUpload({
  onChange,
  value = [],
  maxFiles = 5,
  maxSize = 5, // 5MB
  accept = "image/*,video/*,application/pdf",
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    addFiles(Array.from(e.target.files));
    // Reset the input value so the same file can be uploaded again if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addFiles = (filesToAdd: File[]) => {
    if (value.length + filesToAdd.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files`);
      return;
    }

    const newFiles: FileWithPreview[] = [];
    
    for (const file of filesToAdd) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        continue;
      }

      // Convert to FileWithPreview
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: crypto.randomUUID(),
      });

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      newFiles.push(fileWithPreview);
    }

    onChange([...value, ...newFiles]);
  };

  const removeFile = (id: string) => {
    const updatedFiles = value.filter((file) => file.id !== id);
    
    // Clean up any preview URLs
    const fileToRemove = value.find((file) => file.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    onChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith("image/")) {
      return file.preview ? (
        <img 
          src={file.preview} 
          alt={file.name} 
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      );
    } else if (file.type.startsWith("video/")) {
      return <FilmIcon className="h-10 w-10 text-muted-foreground" />;
    } else if (file.type === "application/pdf") {
      return <FileTextIcon className="h-10 w-10 text-muted-foreground" />;
    } else {
      return <FileIcon className="h-10 w-10 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          multiple
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Drag & drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports images, videos, and PDFs up to {maxSize}MB (max {maxFiles} files)
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploaded files ({value.length}/{maxFiles})</div>
          <ul className="space-y-2">
            {value.map((file) => (
              <li 
                key={file.id}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/40"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}