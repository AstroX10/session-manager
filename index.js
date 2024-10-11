import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { generateAccessKey } from './client/keyGenerator.js';
import sequelize, { User, File } from './client/db.js';
const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
 destination: (req, file, cb) => {
  cb(null, path.join(__dirname, 'storage'));
 },
 filename: (req, file, cb) => {
  cb(null, Date.now() + path.extname(file.originalname));
 },
});

const upload = multer({ storage });

/**
 * @route GET /
 * @desc Returns server details such as uptime and platform information.
 */
app.get('/', (req, res) => {
 const details = {
  uptime: os.uptime(),
  platform: os.platform(),
  cpuCount: os.cpus().length,
 };
 res.json({
  message: 'Server is running',
  ...details,
 });
});

/**
 * @route POST /upload
 * @desc Handles file uploads and saves the file metadata in the database.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
 try {
  const accessKey = generateAccessKey(); // Generate access key
  const user = await User.create({ accessKey }); // Create user with access key

  const fileData = await File.create({
   filename: req.file.filename,
   path: req.file.path,
   userId: user.userId,
  });

  res.json({ info: 'Upload Success', accessKey });
 } catch (error) {
  res.status(500).json({ error: 'File upload failed', details: error.message });
 }
});

/**
 * @route GET /download/:accessKey
 * @desc Allows users to download a file using their access key.
 */
app.get('/download/:accessKey', async (req, res) => {
 try {
  const user = await User.findOne({ where: { accessKey: req.params.accessKey } });
  if (!user) {
   return res.status(404).json({ error: 'Access key not found' });
  }

  const file = await File.findOne({ where: { userId: user.userId } });
  if (!file) {
   return res.status(404).json({ error: 'File not found' });
  }

  res.download(file.path, file.filename);
 } catch (error) {
  res.status(500).json({ error: 'File download failed', details: error.message });
 }
});

app.listen(PORT, () => {
 console.log(`Server running on http://localhost:${PORT}`);
});
