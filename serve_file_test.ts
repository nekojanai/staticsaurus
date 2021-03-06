import { serveFile } from "./serve_file.ts";
import { assertEquals, readerFromStreamReader, Status, STATUS_TEXT } from "./test_deps.ts";

const { test } = Deno;

test("Serve image file", async function (t) {
  const fixture = await Deno.open("./test_data/images/red_pixel.jpg");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/images/red_pixel.jpg")
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
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

test("Serve a file with spaces", async function (t) {
  const fixture = await Deno.open("./test_data/test file.txt");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/test%20file.txt")
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/plain; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/plain; charset=utf-8")
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

  await t.step("responds with 404", function () {
    assertEquals(response.status, Status.NotFound);
  });

  await t.step("responds with status text Not Found", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.NotFound));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });
});

test("Serve a file from a specified directory", async function (t) {
  const fixture = await Deno.open("./test_data/css/test.css");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/css/test.css"), {
      servePath: "./test_data/"
    }
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/css; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/css; charset=utf-8")
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

test("Serve a file from a specified directory, with last part of the servePath matching the first part from the url path", async function (t) {
  const fixture = await Deno.open("./test_data/css/test.css");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/css/test.css"), {
      servePath: "./test_data/css"
    }
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/css; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/css; charset=utf-8")
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

test("Serve a file from a specified directory with the request path matching the request directory path", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/images/red_pixel.jpg"), {
      servePath: "./test_data/images/"
    }
  );

  await t.step("responds with 404", function () {
    assertEquals(response.status, Status.NotFound);
  });

  await t.step("responds with status text Not Found", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.NotFound));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });
});



test("Serve a file with allowed extensions specified", async function (t) {
  const fixture = await Deno.open("./test_data/hello.txt");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/hello.txt"), {
      allowedExtensions: [".txt"]
    }
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/plain; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/plain; charset=utf-8")
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

test("Serve a file with an extension not in the list of allowed extensions", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/hello.txt"), {
      allowedExtensions: [".css"]
    }
  );

  await t.step("responds with 403", function () {
    assertEquals(response.status, Status.Forbidden);
  });

  await t.step("responds with status text Forbidden", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.Forbidden));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });
});

test("Serve a hidden file with serveHiddenFiles false", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/.hidden_file.txt")
  );

  await t.step("responds with 403", function () {
    assertEquals(response.status, Status.Forbidden);
  });

  await t.step("responds with status text Forbidden", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.Forbidden));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });
});

test("Serve a hidden file with serveHiddenFiles true", async function (t) {
  const fixture = await Deno.open("./test_data/.hidden_file.txt");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/.hidden_file.txt"), {
      serveHiddenFiles: true
    }
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/plain; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/plain; charset=utf-8")
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

test("Serve a hidden file with serveHiddenFiles true, with from a specified directory, with an allowed file extension", async function (t) {
  const fixture = await Deno.open("./test_data/.hidden_file.txt");
  const fixtureInfo = await fixture.stat();
  const fixtureData = new Uint8Array(fixtureInfo.size);
  await fixture.read(fixtureData);
  const response = serveFile(
    new Request("https://test.local/test_data/.hidden_file.txt"), {
      servePath: "./test_data/",
      allowedExtensions: [".txt"],
      serveHiddenFiles: true
    }
  );

  await t.step("responds with 200", function () {
    assertEquals(response.status, Status.OK);
  });

  await t.step("responds with status text OK", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.OK));
  });

  await t.step("has content-type header of text/plain; charset=utf8", function() {
    const contentType = response.headers.get("content-type");
    assertEquals(contentType, "text/plain; charset=utf-8")
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

test("Serve a hidden file with serveHiddenFiles false, with a specified directory, with an allowed file extension", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/.hidden_file.txt"), {
      servePath: "./test_data/",
      allowedExtensions: [".txt"],
      serveHiddenFiles: false
    }
  );

  await t.step("responds with 403", function () {
    assertEquals(response.status, Status.Forbidden);
  });

  await t.step("responds with status text Forbidden", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.Forbidden));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });

});

test("Serve a hidden file with serveHiddenFiles true, with a specified directory with more than the last part matching, with an allowed file extension", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/test_subdir/.hidden_file.txt"), {
      servePath: "./test_data/test_subdir/",
      allowedExtensions: [".txt"],
      serveHiddenFiles: true
    }
  );

  await t.step("responds with 404", function () {
    assertEquals(response.status, Status.NotFound);
  });

  await t.step("responds with status text Not Found", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.NotFound));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });

});

test("Serve a hidden file with serveHiddenFiles true, with a specified directory, with a forbidden file extension", async function (t) {
  const response = serveFile(
    new Request("https://test.local/test_data/.hidden_file.txt"), {
      servePath: "./test_data/",
      allowedExtensions: [".png"],
      serveHiddenFiles: true
    }
  );

  await t.step("responds with 403", function () {
    assertEquals(response.status, Status.Forbidden);
  });

  await t.step("responds with status text Forbidden", function () {
    assertEquals(response.statusText, STATUS_TEXT.get(Status.Forbidden));
  });

  await t.step("body is null", function () {
    assertEquals(response.body, null);
  });

});