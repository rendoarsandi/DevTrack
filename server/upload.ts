import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Express, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Clean filename dari karakter khusus
    let cleanedOriginalName = file.originalname
      .replace(/[^\w\s.-]/g, '') // Hapus karakter khusus kecuali underscore, spasi, titik, dan dash
      .replace(/\s+/g, '-');     // Ganti spasi dengan dash
    
    // Generate a unique name for the file to prevent collisions
    const uniqueName = `${randomUUID()}-${cleanedOriginalName}`;
    console.log('Saving file as:', uniqueName);
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
  app.post('/api/upload', (req: Request, res: Response) => {
    // First check authentication before processing the upload
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized. Please log in to upload files.' });
    }
    
    // Handle the file upload with error catching
    upload.array('files', 5)(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message 
        });
      }

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
        return res.status(500).json({ 
          message: 'File upload failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  });
  
  // Endpoint to serve uploaded files
  app.get('/api/files/:filename', (req: Request, res: Response) => {
    try {
      // Decode the URL-encoded filename
      const filename = decodeURIComponent(req.params.filename);
      console.log('Accessing file:', filename);
      
      const filePath = path.join(uploadDir, filename);
      console.log('Full file path:', filePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // Jika file tidak ditemukan, coba cari file dari daftar file yang ada
        console.log('File not found directly, searching in directory...');
        const files = fs.readdirSync(uploadDir);
        
        // Log semua file yang ada di direktori
        console.log('Available files:', files);
        
        // Coba cari file yang mengandung UUID dari filename
        const filenameUUID = filename.split('-')[0]; // Ambil UUID dari bagian pertama nama file
        const matchingFile = files.find(file => file.includes(filenameUUID));
        
        if (matchingFile) {
          console.log('Found matching file:', matchingFile);
          // Jika menemukan file yang cocok, gunakan file tersebut
          return res.sendFile(path.join(uploadDir, matchingFile));
        }
        
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving file:', error);
      return res.status(500).json({ 
        message: 'Error serving file', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to delete a file
  app.delete('/api/files/:filename', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Decode the URL-encoded filename
      const filename = decodeURIComponent(req.params.filename);
      console.log('Deleting file:', filename);
      
      const filePath = path.join(uploadDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // Jika file tidak ditemukan, coba cari file dari daftar file yang ada
        console.log('File not found directly, searching in directory...');
        const files = fs.readdirSync(uploadDir);
        
        // Coba cari file yang mengandung UUID dari filename
        const filenameUUID = filename.split('-')[0]; // Ambil UUID dari bagian pertama nama file
        const matchingFile = files.find(file => file.includes(filenameUUID));
        
        if (matchingFile) {
          console.log('Found matching file:', matchingFile);
          // Jika menemukan file yang cocok, hapus file tersebut
          fs.unlinkSync(path.join(uploadDir, matchingFile));
          return res.sendStatus(204);
        }
        
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      return res.sendStatus(204);
    } catch (error) {
      console.error('File deletion error:', error);
      return res.status(500).json({ 
        message: 'File deletion failed',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}