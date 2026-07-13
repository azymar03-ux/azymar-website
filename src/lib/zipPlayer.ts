import JSZip from 'jszip';

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': case 'htm': return 'text/html';
    case 'js': return 'application/javascript';
    case 'css': return 'text/css';
    case 'json': return 'application/json';
    case 'wasm': return 'application/wasm';
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'wav': return 'audio/wav';
    case 'mp3': return 'audio/mpeg';
    case 'ogg': return 'audio/ogg';
    default: return 'application/octet-stream';
  }
}

function getRelativePath(fromDir: string, toPath: string): string {
  if (fromDir === '') return toPath;
  
  const fromParts = fromDir.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);
  
  let commonDepth = 0;
  while (commonDepth < fromParts.length && commonDepth < toParts.length && fromParts[commonDepth] === toParts[commonDepth]) {
    commonDepth++;
  }
  
  const upCount = fromParts.length - commonDepth;
  const upPath = '../'.repeat(upCount);
  const downPath = toParts.slice(commonDepth).join('/');
  
  return upPath + downPath;
}

export async function loadZipGame(zipBlob: Blob): Promise<string> {
  const zip = await JSZip.loadAsync(zipBlob);
  
  const rawFiles = zip.files;
  const files: { [key: string]: any } = {};
  
  // Normalize all paths to use forward slashes for cross-platform compatibility
  for (const rawName of Object.keys(rawFiles)) {
    const normalizedName = rawName.replace(/\\/g, '/');
    files[normalizedName] = rawFiles[rawName];
  }
  
  const rawUrls: { [key: string]: string } = {};
  const fileContents: { [key: string]: string } = {};
  
  // 1. Process and load binary assets
  for (const filename of Object.keys(files)) {
    const file = files[filename];
    if (file.dir) continue;
    
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const isText = ['html', 'htm', 'js', 'css', 'json'].includes(ext);
    
    if (isText) {
      fileContents[filename] = await file.async('text');
    } else {
      const blob = await file.async('blob');
      const mimeType = getMimeType(filename);
      const typedBlob = new Blob([blob], { type: mimeType });
      rawUrls[filename] = URL.createObjectURL(typedBlob);
    }
  }

  // Find base path of index.html or index.htm (case-insensitive and folder-tolerant)
  let indexKey = Object.keys(files).find((name) => {
    const lower = name.toLowerCase();
    return lower === 'index.html' || 
           lower === 'index.htm' || 
           lower.endsWith('/index.html') || 
           lower.endsWith('/index.htm');
  });

  // Fallback: search for ANY HTML/HTM file if index.html/htm is missing
  if (!indexKey) {
    indexKey = Object.keys(files).find((name) => {
      const lower = name.toLowerCase();
      return lower.endsWith('.html') || lower.endsWith('.htm');
    });
  }
  
  if (!indexKey) {
    throw new Error('Could not find any HTML or HTM entry file in the uploaded ZIP file.');
  }
  
  const indexDir = indexKey.substring(0, indexKey.lastIndexOf('/') + 1); // e.g. "game/"

  // Helper to replace paths in text files
  const rewritePaths = (content: string, filePath: string, urlMap: { [key: string]: string }) => {
    const currentDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
    
    // Sort keys by length descending to replace longer paths first
    const sortedKeys = Object.keys(urlMap).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      const relativePath = getRelativePath(currentDir, key);
      if (!relativePath) continue;
      
      const escapedPath = relativePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Matches path in src="...", href='...', url(...), or "..."
      const regex = new RegExp(`(["'(=])\\s*\\.?\\/?${escapedPath}\\s*(["')?])`, 'g');
      content = content.replace(regex, `$1${urlMap[key]}$2`);
    }
    return content;
  };

  // 2. Rewrite CSS and JSON references
  const processedUrls = { ...rawUrls };
  for (const filename of Object.keys(fileContents)) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'css' || ext === 'json') {
      const rewritten = rewritePaths(fileContents[filename], filename, rawUrls);
      const mimeType = getMimeType(filename);
      const blob = new Blob([rewritten], { type: mimeType });
      processedUrls[filename] = URL.createObjectURL(blob);
    }
  }

  // 3. Rewrite Javascript references
  const polyfill = `<script>
(function() {
  // Storage Polyfill (Prevent crashes due to blocked localStorage/sessionStorage in sandboxed iframe)
  const patchStorage = (type) => {
    try {
      const storage = window[type];
      if (!storage) throw new Error();
      storage.setItem('__test_storage__', '1');
      storage.removeItem('__test_storage__');
    } catch (e) {
      const mockStore = {};
      const mockStorage = {
        getItem: (key) => mockStore[key] || null,
        setItem: (key, value) => { mockStore[key] = String(value); },
        removeItem: (key) => { delete mockStore[key]; },
        clear: () => { for (let key in mockStore) delete mockStore[key]; },
        key: (idx) => Object.keys(mockStore)[idx] || null,
        length: 0
      };
      Object.defineProperty(mockStorage, 'length', {
        get: () => Object.keys(mockStore).length
      });
      Object.defineProperty(window, type, {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    }
  };
  patchStorage('localStorage');
  patchStorage('sessionStorage');

  const originalAdd = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
      setTimeout(listener, 0);
    } else {
      originalAdd.call(document, type, listener, options);
    }
  };
  const originalWindowAdd = window.addEventListener;
  window.addEventListener = function(type, listener, options) {
    if (type === 'load' && document.readyState === 'complete') {
      setTimeout(listener, 0);
    } else {
      originalWindowAdd.call(window, type, listener, options);
    }
  };
})();
</script>`;

  for (const filename of Object.keys(fileContents)) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'js') {
      const rewritten = rewritePaths(fileContents[filename], filename, processedUrls);
      const mimeType = getMimeType(filename);
      const blob = new Blob([rewritten], { type: mimeType });
      processedUrls[filename] = URL.createObjectURL(blob);
    }
  }

  // 4. Rewrite index.html references
  let finalHtml = rewritePaths(fileContents[indexKey], indexKey, processedUrls);
  
  // Inject polyfill in head, html, body or prepend (case-insensitive and flexible)
  const headMatch = finalHtml.match(/<head[^>]*>/i);
  const htmlMatch = finalHtml.match(/<html[^>]*>/i);
  const bodyMatch = finalHtml.match(/<body[^>]*>/i);
  
  if (headMatch && headMatch.index !== undefined) {
    const insertIdx = headMatch.index + headMatch[0].length;
    finalHtml = finalHtml.slice(0, insertIdx) + `\n${polyfill}` + finalHtml.slice(insertIdx);
  } else if (htmlMatch && htmlMatch.index !== undefined) {
    const insertIdx = htmlMatch.index + htmlMatch[0].length;
    finalHtml = finalHtml.slice(0, insertIdx) + `\n${polyfill}` + finalHtml.slice(insertIdx);
  } else if (bodyMatch && bodyMatch.index !== undefined) {
    const insertIdx = bodyMatch.index + bodyMatch[0].length;
    finalHtml = finalHtml.slice(0, insertIdx) + `\n${polyfill}` + finalHtml.slice(insertIdx);
  } else {
    finalHtml = polyfill + finalHtml;
  }

  const htmlBlob = new Blob([finalHtml], { type: 'text/html' });
  return URL.createObjectURL(htmlBlob);
}
