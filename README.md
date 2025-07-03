# AI OCR Web App

This project is a React + TypeScript + Vite application that performs client-side image cropping and parallel OCR using the Gemini 2.5 Flash API.

Each cropped region can be rotated in 90° steps before sending to the Gemini API. Thumbnails of the selected areas are shown below the canvas from left to right, each with rotate and delete controls. OCR results appear in a side panel where each block has its own copy and redo buttons along with a global copy-all control. The interface features a header and card-style panels for a cleaner look. Running OCR processes only regions without text and indicates progress.

## Development

```bash
npm install
npm run dev
```

Set the API key in a `.env` file:

```
VITE_GEMINI_APIKEY=your_api_key_here
```

## Testing

Run the unit tests with:

```bash
npm test
```

The tests download an image from i.imgur.com, so internet access is required.
