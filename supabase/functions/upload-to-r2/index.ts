import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, fileType, userId, fileContent } = await req.json()
    console.log('Processing upload request:', { fileName, fileType, userId })

    if (!fileName || !fileContent || !userId) {
      throw new Error('Missing required file information')
    }

    // Initialize R2 client
    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      },
    })

    // Generate folder name from userId (12 chars)
    const folderName = userId.replace(/-/g, '').substring(0, 12)
    const key = `${folderName}/${fileName}`

    console.log('Uploading to R2 with key:', key)

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: "st8",
      Key: key,
      Body: fileContent,
      ContentType: fileType,
    })

    await R2.send(command)
    console.log('File uploaded to R2 successfully')

    // Get the public URL
    const publicUrl = `https://cdn.000.web.id/${key}`

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Save file metadata to database
    const { error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        name: fileName,
        url: publicUrl,
        type: fileName.split('.').pop() || '',
        size: new TextEncoder().encode(fileContent).length,
      })

    if (dbError) {
      console.error('Database Error:', dbError)
      throw new Error(`Failed to save file metadata: ${dbError.message}`)
    }

    console.log('File metadata saved successfully')

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})