import { contentType } from "./deps/media-type.ts";
import { extname } from "./deps/path.ts";
import { readableStreamFromReader } from "./deps/streams.ts";

export async function serveFile(request: Request): Promise<Response> {
  const path = new URLPattern(request.url).pathname;

  let file;
  try {
    file = await Deno.open(Deno.cwd() + path, { read: true });
  } catch (error) {
    console.log(error);
    return new Response(null, {
      status: 404,
    });
  }

  return new Response(readableStreamFromReader(file), {
    status: 200,
    headers: {
      "content-type": contentType(extname(path))!,
    },
  });
}
