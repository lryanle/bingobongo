import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import type { BingoRoom } from "@/types/bingo";

// This is a hypothetical API route function
export async function POST(request: Request) {
	// const session = await getServerSession(authOptions); //TODO!!!: UNDO THE ! IN !SESSION
	const session = {
		user: {
			name: "Ryan",
			email: "lryanlle@gmail.com",
			image: "https://lh3.googleusercontent.com/a/ACg8ocKrTiLNkbQd_l12quqQoNKD1kRXchXv25I_stHpEG_Cog=s96-c",
			id: "65938eb8e78270e2b5e30262",
		},
	};

	try {
		if (session) { // Signed in 
			try { // check if the correct form data is present
				const formData = await request.formData();
				const userId = formData.get("id"); // Assume this is the ID of the currently logged-in user

				// check if user sending request and the room owner are the same
				if (userId != session.user.id) {
					return new Response("Unauthorized: Requesting user and room owner do not match", { status: 401 });
				}

        // check if room data is present
        try {
          const roomData = JSON.parse(formData.get("roomData") as string);
          
          // check if room data is valid based on type BingoRoom from @/types/bingo
          //TODO: Make this prettier with tRPC
          if ( roomData === undefined || roomData === null
            || roomData.id === undefined || roomData.id.length != 24
            || roomData.roomName.length < 1 || roomData.roomName.length > 32
            || roomData.gameMode.length < 1
            || roomData.boardSize === 50 // TODO: change this if future board sizes are added 
            || roomData.teams.length < 1 || roomData.teams.length > 8
            || roomData.teams.some((team: {name: string, color: string}) => {return team.name.length < 1 || team.name.length > 32})
            || roomData.teams.some((team: {name: string, color: string}) => {return team.color.length != 4 && team.color.length != 7})
            || roomData.ownerId.length != 24
          ) {
            return new Response("Bad Request: Room data missing data", { status: 400 });
          }

          // make prisma call to upsert room
          try {
            await prisma.room.upsert({
              where: {
                ownerId: roomData.ownerId,
              },
              create: {
                roomName: roomData.roomName,
                roomPassword: roomData.roomPassword,
                bingoSeed: roomData.bingoSeed,
                gameMode: roomData.gameMode,
                boardSize: roomData.boardSize[0] as number,
                teams: roomData.teams.map((team: {name: string, color: string}) => {return {name: team.name, color: team.color}}),
                ownerId: userId,
                lastUpdated: new Date(),
              },
              update: {
                roomName: roomData.roomName,
                roomPassword: roomData.roomPassword,
                bingoSeed: roomData.bingoSeed,
                gameMode: roomData.gameMode,
                boardSize: roomData.boardSize[0] as number,
                teams: roomData.teams.map((team: {name: string, color: string}) => {return {name: team.name, color: team.color}}),
                lastUpdated: new Date(),
              },
            });

            return new Response("Successfully created room", { status: 200 });
          } catch (e) {
            return new Response("Internal Server Error: Error upserting room"+e, { status: 500 });
          }
        } catch (e) {
          return new Response("Bad Request: Invalid room data", { status: 400 });
        }
			} catch (e) {
				return new Response("Bad Request: Missing room data and/or user data", {
					status: 400,
				});
			}

			return new Response("Authorized", { status: 200 });
		} else { // Not Signed in
			return new Response("Unauthorized", { status: 401 });
		}
	} catch (e) {
		return new Response("Internal Server Error", { status: 500 });
	}
}
