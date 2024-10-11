# Session Manager

Session Manager is a Node.js application that allows users to upload `.zip` files, retrieve them using an access key, and manage session data. The uploaded files are stored temporarily and can be accessed within a specified time frame. This project also includes functionality for downloading, extracting, and managing JSON files within the uploaded `.zip` files.

## Features

- Upload `.zip` files containing JSON files.
- Retrieve uploaded files using a unique access key.
- Automatically delete files after 48 hours.
- Download `.zip` files using the access key.
- Extract downloaded `.zip` files and store JSON files in a specified folder.

## Technologies Used

- **Node.js**: JavaScript runtime for server-side programming.
- **Express**: Web framework for building APIs.
- **Axios**: Promise-based HTTP client for making requests.
- **Archiver**: Library for creating `.zip` files.
- **Unzipper**: Library for extracting files from `.zip` archives.
- **fs-extra**: Library for file system operations with additional methods.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/AstroX10/session-manager.git
   cd session-manager
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the server**:

   ```bash
   npm start
   ```

   Make sure the server is running on the specified port (default: 3000).

## Usage

#### Upload

```javascript
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data'; // Import FormData from form-data package
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

/**
 * Uploads a ZIP file to the server.
 * @param {string} filePath - The path of the ZIP file to be uploaded.
 * @returns {Promise<string|null>} - Returns the access key for downloading, or null if an error occurs.
 */
export const uploadFile = async (filePath) => {
 const formData = new FormData();
 formData.append('file', fs.createReadStream(filePath));

 try {
  const response = await axios.post(`${BASE_URL}/upload`, formData, {
   headers: {
    ...formData.getHeaders(), // Get headers from form-data
   },
  });
  console.log('Upload Response:', response.data);
  return response.data.accessKey; // Return access key for download
 } catch (error) {
  console.error('Error uploading file:', error.response?.data || error.message);
  return null;
 }
};
```

#### Download

```javascript
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

/**
 * Downloads a file from the server using an access key.
 * @param {string} accessKey - The access key for downloading the file.
 * @returns {Promise<void>} - No return value. Logs success or failure to the console.
 */
export const downloadFile = async (accessKey) => {
 try {
  const response = await axios.get(`${BASE_URL}/download/${accessKey}`, {
   responseType: 'arraybuffer', // To handle binary data
  });
  const fileName = `downloaded_${accessKey}.zip`;
  fs.writeFileSync(path.join(__dirname, fileName), response.data);
  console.log(`File downloaded successfully: ${fileName}`);
 } catch (error) {
  console.error('Error downloading file:', error.response?.data || error.message);
 }
};
```
