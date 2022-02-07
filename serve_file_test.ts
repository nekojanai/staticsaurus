import { serveFile } from "./serve_file.ts";
import { assertEquals, readerFromStreamReader } from "./test_deps.ts";

const { test } = Deno;

test("Serve valid file", async function (t) {
  const fixture = await Deno.open("./test_data/images/red_pixel.jpg");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/images/red_pixel.jpg")
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, 200);
  });

  await t.step("has content-type header of image/jpg", function () {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "image/jpeg");
  });

  await t.step("has content-length header equal to file size", function () {
    const contentLength = parseInt(response.headers.get("content-length")!);
    assertEquals(contentLength, fixtureInfo.size);
  });

  await t.step("body is actual file", async function () {
    const contentLength = response.headers.get("content-length");
    const p = new Uint8Array(parseInt(contentLength!));
    await readerFromStreamReader(response.body?.getReader()!).read(p);
    assertEquals(p, fixtureData);
  });

  fixture.close();
});

test("Serve an non existant file", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/images/aaaaa.jpg")
  );

  await t.step("respond with a 404", function () {
    assertEquals(response.status, 404);
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });
});

test("Serve a file from a specified directory", async function (t) {
  const fixture = await Deno.open("./test_data/css/test.css");
  const fixtureInfo = await fixture.stat();
  const fixtureData = await new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/css/test.css"),
    "./test_data/css"
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, 200);
  });

  fixture.close();
});
