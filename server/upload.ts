import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Express, Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique name for the file to prevent collisions
    const uniqueName = `${randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter to allow only certain file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, videos, and PDFs
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only images, videos, and PDFs are allowed.'));
  }
};

// Create the multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Setup file upload routes
export function setupFileUpload(app: Express) {
  // Endpoint to upload multiple files
  app.post('/api/upload', upload.array('files', 5), (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      // Create response with file information
      const fileData = files.map(file => ({
        name: file.originalname,
        filename: file.filename,
        type: file.mimetype,
        size: file.size,
        url: `/api/files/${file.filename}`,
      }));
      
      return res.status(201).json(fileData);
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ message: 'File upload failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Endpoint to serve uploaded files
  app.get('/api/files/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Send the file
    res.sendFile(filePath);
  });
  
  // Endpoint to delete a file
  app.delete('/api/files/:filename', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    try {
      fs.unlinkSync(filePath);
      return res.sendStatus(204);
    } catch (error) {
      console.error('File deletion error:', error);
      return res.status(500).json({ message: 'File deletion failed' });
    }
  });
}