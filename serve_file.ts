import { join, parse, contentType, readAllSync, Status, STATUS_TEXT } from "./deps.ts";

interface RespondWithOptions {
  body?: BodyInit | null | undefined;
  init?: ResponseInit | undefined;
}

function respondWith(status: Status, options?: RespondWithOptions) {
  return new Response(options?.body, {
    ...options?.init,
    status,
    statusText: STATUS_TEXT.get(status)
  }); 
};

/**
 * servePath - (optional) the relative path where files are served from
 * allowedExtensions -  (optional) file extensions allowed to be served e.g. .png or .css
 * serveHiddenFiles - (optional) set to true to serve hidden files
 */
export interface ServeFileOptions {
  servePath?: string;
  allowedExtensions?: string[];
  serveHiddenFiles?: boolean;
}

/**
 * Gets a Request Object and tries to read the corresponding file from the file system.
 * @param request - A Request Object
 * @param options - A ServeFileOptions Object
 * @returns A Response Object with either status 404 or 200 and the requested file
 */
export function serveFile(
  request: Request,
  options?: ServeFileOptions
): Response {
  let path: string;
  let pathname = new URL(request.url).pathname;
  let parsedPath = parse(pathname);

  // check if hidden files should be served
  if(!options?.serveHiddenFiles && parsedPath.name.startsWith(".")) {
    return respondWith(Status.Forbidden);
  }

  // do not serve files without an extion TODO: make possible
  if (!parsedPath.ext) {
    return respondWith(Status.NotFound); 
  }

  if (options?.servePath) {
    let pathElements = parsedPath.dir.split("/");
    pathElements.shift();
    // add requested file back to path
    pathElements.push(parsedPath.base);
    pathElements = pathElements.filter(el => el.trim());
    let servePathElements = options.servePath.split("/");
    servePathElements.shift();
    servePathElements = servePathElements.filter(el => el.trim());
    // still allow to serve file if last directory of serve path equals first element of the request path
    if(servePathElements[servePathElements.length-1] === pathElements[0]) pathElements.shift();
    let fullPath = join(...servePathElements,...pathElements);
    path = `./${decodeURIComponent(fullPath)}`;
  } else {
    path = `.${decodeURIComponent(pathname)}`;
  }

  if (options?.allowedExtensions?.length) {
    const hasForbiddenExtension = !options.allowedExtensions.includes(parsedPath.ext);
    if (hasForbiddenExtension) {
      return respondWith(Status.Forbidden)
    }
  }

  let fileInfo: Deno.FileInfo;
  let body: Uint8Array;
  try {
    const realPath = Deno.realPathSync(path);
    const file = Deno.openSync(realPath, { read: true });
    fileInfo = file.statSync();
    body = readAllSync(file);
    file.close();
  } catch (_) {
    return respondWith(Status.NotFound);
  }

  

  return respondWith(Status.OK, {
    body,
    init: {
      headers: {
        "content-type": contentType(parsedPath.ext)!,
        "content-length": fileInfo.size.toString(),
      },
    }
  });

}
