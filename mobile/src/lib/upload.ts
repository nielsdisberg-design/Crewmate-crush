export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string
): Promise<{ id: string; url: string }> {
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
  const formData = new FormData();
  formData.append("file", { uri, type: mimeType, name: filename } as any);
  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error((data as any).error || "Upload failed");
  return { id: (data as any).data.id, url: (data as any).data.url };
}
