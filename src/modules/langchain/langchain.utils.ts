export const streamToPromise = async (
  stream: ReadableStream<string>,
): Promise<string> => {
  let data = "";

  const writableStream = new WritableStream({
    write(chunk) {
      data += chunk;
    },
  });

  await stream.pipeTo(writableStream);
  return data;
};
