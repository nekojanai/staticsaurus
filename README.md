# staticsaurus
a static file handler to be used in a [router](https://github.com/TypicalFence/brontoroutus)
## example
```ts
import { serve } from "https://deno.land/std@0.123.0/http/server.ts";
import { Method, Router } from "https://deno.land/x/brontoroutus/mod.ts";
import { serveStatic } from "https://deno.land/x/staticsaurus/mod.ts";

const router = new Router();

// serves all files in the $PWD/public dir
router.get("/public/*", (request) => serveFile(request));

serve(router.toHandler({}));
```
