import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.511.0"
import * as cleancss from "https://esm.sh/clean-css@5.3.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: "https://e0e5e32248d2813718e01a03f06983ef.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "812f3d923907982d2cbaf1434f8b706a",
    secretAccessKey: "3fc824fa6032c70df66de3d23edfc88399e7f062dc8f49a37521d35152cdd305",
  },
});

const compressCSS = (css: string) => {
  const cleanCSS = new cleancss();
  return cleanCSS.minify(css).styles;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let fileBuffer = await file.arrayBuffer()
    const fileName = `${userId}/${file.name}`

    // Compress CSS files before upload
    if (file.name.endsWith('.css')) {
      const cssText = new TextDecoder().decode(fileBuffer);
      const compressedCSS = compressCSS(cssText);
      fileBuffer = new TextEncoder().encode(compressedCSS);
    }

    const command = new PutObjectCommand({
      Bucket: "st8",
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command)

    const fileUrl = `https://pub-c7fe5d7345b64a8aa90756d140154223.r2.dev/${fileName}`

    return new Response(
      JSON.stringify({ 
        url: fileUrl,
        name: file.name,
        type: file.type,
        size: fileBuffer.byteLength
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})