const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

// Mirrors vercel.json rewrites (excluding blog proxy, not available locally)
const REWRITES = [
  { source: /^\/diagnostic$/, destination: "/index.html" },
  { source: /^\/exemple-rapport$/, destination: "/exemple-rapport.html" },
  { source: /^\/espace-professionnel$/, destination: "/espace-professionnel.html" },
  { source: /^\/index\.saaspro\.html$/, destination: "/espace-professionnel.html" },
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function resolveRequestPath(requestPath) {
  const normalizedPath = decodeURIComponent(requestPath.split("?")[0]);
  const absolutePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    return path.join(absolutePath, "index.html");
  }

  if (fs.existsSync(absolutePath)) {
    return absolutePath;
  }

  if (!path.extname(absolutePath)) {
    const htmlVariant = `${absolutePath}.html`;
    if (fs.existsSync(htmlVariant)) {
      return htmlVariant;
    }
  }

  if (normalizedPath === "/") {
    return path.join(rootDir, "index.html");
  }

  return null;
}

const server = http.createServer((request, response) => {
  let requestUrl = request.url || "/";
  const urlPath = requestUrl.split("?")[0];
  for (const rewrite of REWRITES) {
    if (rewrite.source.test(urlPath)) {
      requestUrl = rewrite.destination;
      break;
    }
  }
  const filePath = resolveRequestPath(requestUrl);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 Not Found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);

  stream.on("open", () => {
    response.writeHead(200, { "Content-Type": contentType });
  });

  stream.on("error", () => {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("500 Internal Server Error");
  });

  stream.pipe(response);
});

server.listen(port, () => {
  console.log(`DiagTertiaire V3 available on http://localhost:${port}`);
  console.log("Press Ctrl+C to stop the local server.");
});
