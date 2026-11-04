const maxBodyBytes = 16 * 1024;

export class EnquiryPayloadError extends Error {
  constructor(readonly status: 400 | 413 | 415, message: string) {
    super(message);
  }
}

export async function readEnquiryPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new EnquiryPayloadError(415, "Please use the enquiry form to send your request.");
  }
  const tooLarge = () => new EnquiryPayloadError(413, "Your enquiry is too long. Please shorten the message and try again.");
  if (Number(request.headers.get("content-length")) > maxBodyBytes) throw tooLarge();

  const reader = request.body?.getReader();
  if (!reader) throw new EnquiryPayloadError(400, "Your enquiry could not be read. Please try again.");
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new EnquiryPayloadError(400, "Your enquiry could not be read. Please try again.");
  }
}
