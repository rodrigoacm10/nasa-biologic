import { NextRequest, NextResponse } from 'next/server';

const GITHUB_REPO_BASE =
  'https://raw.githubusercontent.com/rodrigoacm10/nasa-biologic-data/refs/heads/main';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ex: "OSD-1" ou "1"

  // normaliza para "OSD-XXX"
  const normId = id.startsWith('OSD-') ? id : `OSD-${id}`;
  const url = `${GITHUB_REPO_BASE}/processed_osds/${normId}/${normId}.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OSD ${normId} not found` },
        { status: 404 }
      );
    }

    const osd = await response.json();

    // sanity check do id interno
    if (!osd?.investigation?.id || osd.investigation.id !== normId) {
      console.warn(`⚠️ ID interno (${osd?.investigation?.id}) ≠ ${normId}`);
      osd.investigation = { ...(osd.investigation || {}), id: normId };
    }

    return NextResponse.json(osd);
  } catch (err) {
    console.error('❌ Error fetching OSD:', err);
    return NextResponse.json(
      { error: 'Failed to fetch OSD' },
      { status: 500 }
    );
  }
}
