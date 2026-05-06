## Error Type
Runtime Error

## Error Message
Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false` to avoid hydration mismatches.


    at RichDocumentEditor (components\document\rich-document-editor.js:38:27)
    at DocumentDetailPage (components\pages\document-detail-page.js:141:11)
    at DocumentDetailRoute (app\documents\[documentId]\page.js:5:10)

## Code Frame
  36 |   );
  37 |
> 38 |   const editor = useEditor({
     |                           ^
  39 |     extensions,
  40 |     content: content || "<p></p>",
  41 |     editorProps: {

Next.js version: 15.5.15 (Webpack)
