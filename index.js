import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 5000;

// Directory to store files
const AUTH_DIR = path.join(__dirname, 'auth');

// Ensure `auth` folder exists
fs.ensureDirSync(AUTH_DIR);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AUTH_DIR),
  filename: (req, file, cb) => {
    let sessionNumber = getSessionNumber();
    cb(null, `session${sessionNumber}.zip`);
  },
});

const upload = multer({ storage });

// Utility function to get the current session number
const getSessionNumber = () => {
  const files = fs.readdirSync(AUTH_DIR);
  const sessions = files.filter((file) => file.startsWith('session') && file.endsWith('.zip'));
  return sessions.length + 1;
};

// Function to delete file and corresponding JSON after expiration
const scheduleDeletion = (filePath, jsonFilePath, expirationTime) => {
  const delay = expirationTime - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      fs.remove(filePath)
        .then(() => fs.remove(jsonFilePath))
        .then(() => console.log(`Deleted: ${filePath} and ${jsonFilePath}`))
        .catch((err) => console.error(`Failed to delete: ${err}`));
    }, delay);
  }
};

app.post('/upload', upload.single('zipfile'), async (req, res) => {
  const sessionNumber = getSessionNumber() - 1;
  const filePath = path.join(AUTH_DIR, `session${sessionNumber}.zip`);
  const accessKey = uuidv4(); // Generate a unique access key
  const uploadTime = Date.now();

  // Set expiration time to 1 week (7 days)
  const expirationTime = uploadTime + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Create a JSON file with metadata
  const sessionInfo = {
    session: sessionNumber,
    filename: `session${sessionNumber}.zip`,
    path: filePath,
    accessKey: accessKey,
    uploadTime: new Date(uploadTime).toISOString(),
    expirationTime: new Date(expirationTime).toISOString(),
  };

  const jsonFilePath = path.join(AUTH_DIR, `session${sessionNumber}.json`);
  await fs.writeJson(jsonFilePath, sessionInfo);

  // Schedule deletion of the file after 1 week
  scheduleDeletion(filePath, jsonFilePath, expirationTime);

  // Return the access key to the user
  res.status(201).json({
    message: `File uploaded successfully as session${sessionNumber}`,
    accessKey: accessKey,
    expiresIn: '1 week',
  });
});

// GET API to download the .zip file using the access key
app.get('/download/:accessKey', (req, res) => {
  const { accessKey } = req.params;

  // Find the JSON file that matches the given access key
  const jsonFiles = fs.readdirSync(AUTH_DIR).filter((file) => file.endsWith('.json'));
  let sessionInfo;

  for (let jsonFile of jsonFiles) {
    const jsonFilePath = path.join(AUTH_DIR, jsonFile);
    const fileData = fs.readJsonSync(jsonFilePath);
    if (fileData.accessKey === accessKey) {
      sessionInfo = fileData;
      break;
    }
  }

  if (!sessionInfo) {
    return res.status(404).send('Invalid access key or file not found.');
  }

  // Check if the file has expired
  const now = Date.now();
  if (now > new Date(sessionInfo.expirationTime).getTime()) {
    return res.status(410).send('File has expired and is no longer available.');
  }

  // Send the .zip file for download
  res.download(sessionInfo.path, (err) => {
    if (err) {
      res.status(500).send('Error in downloading file.');
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
