import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Burada oturum kontrolü yapabilirsin (sadece admin yükleyebilir)
        // const session = await auth();
        // if (!session) throw new Error('Unauthorized');

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({
            // İsteğe bağlı metadata (örn: hangi villa için?)
            // propertyId: clientPayload?.propertyId, 
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Yükleme bitince burası tetiklenir (Webhooks gibi)
        console.log('Upload tamamlandı:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // Bad Request
    );
  }
}