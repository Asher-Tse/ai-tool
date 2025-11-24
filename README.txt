# ai-tool-indol Vercel backend for aicartox.com

This project exposes a single API endpoint:

  /api/gemini-analyze

Steps:

1. Unzip this folder. You should see:

   - api/gemini-analyze.js
   - package.json

2. In Vercel dashboard, open or create the project using:

   https://ai-tool-indol.vercel.app

3. Make sure this folder is the project root source:
   - If using "Upload", upload the entire unzipped folder.
   - The file api/gemini-analyze.js MUST be inside the "api" folder.

4. In project Settings → Environment Variables add:

   - Name: GEMINI_API_KEY
   - Value: your Gemini API key from Google AI Studio

5. Deploy.

6. Test in your browser:

   https://ai-tool-indol.vercel.app/api/gemini-analyze

   You should see JSON like:

   {"error":"Missing prompt in request body"}

   That means the function is working.

7. In Shopify (aicartox.com) your frontend should call:

   https://ai-tool-indol.vercel.app/api/gemini-analyze

   with a POST JSON body: { "prompt": "..." }.
