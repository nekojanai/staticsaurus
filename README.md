# staticsaurus
a static file handler to be used in a [router](https://github.com/TypicalFence/brontoroutus)
## example
```ts
import { serve } from "https://deno.land/std@0.123.0/http/server.ts";
import { Router } from "https://deno.land/x/brontoroutus/mod.ts";
import { serveFile } from "https://deno.land/x/staticsaurus/mod.ts";

const router = new Router();

// serves all files in the $PWD/public dir
router.get("/public", (request) => serveFile(request));

// allows hidden files to be served
router.get("/images", (request) => serveFile(request, {
  serveHiddenFiles: true
}));

// serves all files in the $PWD/public dir while the url request are being made to /images
router.get("/images", (request) => serveFile(request, {
  serveDir: "./public/"
}));
// same
router.get("/images", (request) => serveFile(request, {
  serveDir: "./public/images/"
}));

// only serves files ending in .png and .jpg 
router.get("/public", (request) => serveFile(request, {
  allowedExtensions: [".png", ".jpg"]
}));

// multiple options
router.get("/images", (request) => serveFile(request, {
  serveDir: "./public/images",
  allowedExtensions: [".png", ".jpg"]
}));
or
router.get("/images", (request) => serveFile(request, {
  serveDir: "./public/images",
  allowedExtensions: [".png", ".jpg"]
  serveHiddenFiles: true
}));

serve(router.toHandler({}));
```

## todo
[] serve files without an extension
[] generate etag
[] return 302 when client doesn't need to fetch file
[] ???

## development
run tests with `deno test --allow-all`
