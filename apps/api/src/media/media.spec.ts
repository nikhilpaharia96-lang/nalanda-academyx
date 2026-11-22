import { sniffImageType } from "./media.module";

describe("sniffImageType", () => {
  it("accepts real raster signatures", () => {
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe("image/png");
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe("image/jpeg");
    expect(sniffImageType(Buffer.from("RIFF0000WEBPVP8 ", "ascii"))).toBe("image/webp");
    expect(sniffImageType(Buffer.from("GIF89a000", "ascii"))).toBe("image/gif");
  });
  it("rejects SVG/HTML/other content", () => {
    expect(sniffImageType(Buffer.from("<svg onload=alert(1)></svg>"))).toBeNull();
    expect(sniffImageType(Buffer.from("<html><script>1</script></html>"))).toBeNull();
  });
});
