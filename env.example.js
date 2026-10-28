/**
 * JalMitra - Static Environment Variable Template
 * 
 * If you are running JalMitra via Python HTTP Server ('python -m http.server') or any static host
 * without a Node/Vite build tool:
 * 1. Copy this file to 'env.js' in the same directory.
 * 2. Fill in your real Firebase credentials below.
 * 3. Never commit 'env.js' to public Git repositories (it is included in .gitignore).
 */

window.__ENV__ = {
  VITE_FIREBASE_API_KEY: "your_api_key_here",
  VITE_FIREBASE_AUTH_DOMAIN: "your_project_id.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "your_project_id",
  VITE_FIREBASE_STORAGE_BUCKET: "your_project_id.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "your_messaging_sender_id",
  VITE_FIREBASE_APP_ID: "your_app_id"
};
