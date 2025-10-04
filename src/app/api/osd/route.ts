export async function GET() {
  try {
    const repoApi =
      'https://api.github.com/repos/rodrigoacm10/nasa-biologic-data/contents'

    const res = await fetch(repoApi)
    if (!res.ok) throw new Error('Erro ao listar arquivos do GitHub')

    const files = await res.json()

    const osdFiles = files
      .filter((f: any) => /^OSD-\d+\.macro\.json$/.test(f.name))
      .map((f: any) => f.download_url)

    const osds = await Promise.all(
      osdFiles.map(async (url: string) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Erro ao baixar ${url}`)
        return res.json()
      }),
    )

    return Response.json(osds)
  } catch (error) {
    console.error('Erro ao carregar dados do GitHub:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao carregar os dados dos OSDs.' }),
      { status: 500 },
    )
  }
}
