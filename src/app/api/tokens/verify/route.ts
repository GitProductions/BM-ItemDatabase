// Verify Users Token
import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';

//     const header = request.headers.get('authorization');
//     return header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
// };

// const isAdminRequest = (request: NextRequest) => {
//     const token = getBearer(request);
//     const secret = process.env.ADMIN_TOKEN;
//     return Boolean(secret && token && token === secret);
// };

// const resolveRequester = async (request: NextRequest) => {
//     const bearer = getBearer(request);
//     if (bearer) {
//         if (isAdminRequest(request)) return { isAdmin: true };
//         const apiUser = await verifyApiToken(bearer);
//         if (apiUser) return { isAdmin: false, userId: apiUser.id, name: apiUser.name, email: apiUser.email };
//     }

//     const session = await getAuthSession();
//     if (session?.user?.id) {
//         return {
//             isAdmin: false,
//             userId: session.user.id,
//             name: session.user.name ?? undefined,
//             email: session.user.email ?? undefined,
//         };
//     }

//     return null;
// };

export async function POST(request: NextRequest) {
    // const requester = await resolveRequester(request);
    // if (!requester) {
    //     return withCors(
    //         NextResponse.json(
    //             {
    //                 message: 'Authentication required: provide a valid API token in Authorization: Bearer <token> or sign in with a session',
    //             },
    //             { status: 401 },
    //         ),
    //     );
    // }



    // return withCors(NextResponse.json({ message: 'valid', requester }, { status: 200 }));


    const userToken = await request.text().catch(() => '<unable to read body>');

    if (!userToken) {
        return withCors(new NextResponse(null, { status: 400 }));
    }

    try {
        const isValid = await verifyApiToken(userToken);
        if (!isValid) {
            return withCors(NextResponse.json({ message: 'invalid' }, { status: 200 }));
        }

        return withCors(NextResponse.json({ message: 'valid' }, { status: 200 }));
    } catch (error) {
        return withCors(new NextResponse(null, { status: 400 }));
    }
}
