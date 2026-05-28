import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    // Resolve releases folder: env override or two levels up from Next.js root
    const releasesDir = process.env.RELEASES_PATH
        ? path.resolve(process.env.RELEASES_PATH)
        : path.resolve(process.cwd(), '..', 'releases');

    if (!fs.existsSync(releasesDir)) {
        return NextResponse.json({ error: 'Releases folder not found' }, { status: 404 });
    }

    const files = fs.readdirSync(releasesDir)
        .filter(f => f.endsWith('.vsix'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(releasesDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime); // newest first

    if (files.length === 0) {
        return NextResponse.json({ error: 'No extension package available yet' }, { status: 404 });
    }

    const latest = files[0];
    const filePath = path.join(releasesDir, latest.name);
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${latest.name}"`,
            'Content-Length': String(fileBuffer.byteLength),
        },
    });
}
