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
    const { fileId, content, userId } = await req.json()
    console.log('Processing update request:', { fileId, userId })

    if (!fileId || !content || !userId) {
      throw new Error('Missing required information')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file details from database
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (fileError || !file) {
      console.error('File fetch error:', fileError)
      throw new Error('File not found or access denied')
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

    // Generate folder name (12 chars from user ID)
    const folderName = userId.replace(/-/g, '').substring(0, 12)
    const key = `${folderName}/${file.name}`

    console.log('Updating file in R2:', key)

    // Upload updated content to R2
    const command = new PutObjectCommand({
      Bucket: "st8",
      Key: key,
      Body: content,
      ContentType: file.type === 'css' ? 'text/css' : 'application/javascript',
    })

    await R2.send(command)
    console.log('File updated successfully in R2')

    return new Response(
      JSON.stringify({ message: 'File updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})