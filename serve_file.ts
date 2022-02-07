import { join, parse, contentType, readAllSync } from "./deps.ts";

/**
 * Gets a Request Object and tries to read the corresponding file from the file system.
 * @param request - a Request Object
 * @param servePath - (optional) the relative path where files are served from
 * @param allowedExtensions -  (optional) file extensions allowed to be served e.g. .png or .css
 * @returns A Response Object with either status 404 or 200 and the requested file
 */
export function serveFile(
  request: Request,
  servePath?: string,
  allowedExtensions?: string[]
): Response {
  let path: string;
  let pathname = new URL(request.url).pathname;
  let parsedPath = parse(pathname);

  if (!parsedPath.ext) {
    return new Response(null, {
      status: 404,
    });
  }

  if (servePath) {
    // the following removes the parts from the path that are in the serve path

    let pathElements = parsedPath.dir.split("/");
    pathElements.shift();
    // add requested file back to path
    pathElements.push(parsedPath.base);
    let servePathElements = servePath.split("/");
    servePathElements.shift();
    let purePath = pathElements!.filter(
      (pathElement) => !servePathElements.includes(pathElement)
    );
    path = `./${join(...purePath)}`;
  } else {
    path = `.${pathname}`;
  }

  if (allowedExtensions?.length) {
    const hasForbiddenExtension = allowedExtensions?.includes(parsedPath.ext);
    if (hasForbiddenExtension) {
      return new Response(null, {
        status: 404,
      });
    }
  }

  let file;
  try {
    const realPath = Deno.realPathSync(path);
    file = Deno.openSync(realPath, { read: true });
  } catch (error) {
    return new Response(null, {
      status: 404,
    });
  }

  const fileInfo = file.statSync();
  const data = readAllSync(file);
  file.close();

  return new Response(data, {
    status: 200,
    headers: {
      "content-type": contentType(parsedPath.ext)!,
      "content-length": fileInfo.size.toString(),
    },
  });
}
