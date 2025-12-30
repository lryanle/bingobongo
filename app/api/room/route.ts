import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getGridSize } from "@/lib/bingo-utils";

// This is a hypothetical API route function
export async function POST(request: Request) {
	const auth = await getAuth();
	const session = await auth.api.getSession({ headers: await headers() });
	// const session = {
	// 	user: {
	// 		name: "Ryan",
	// 		email: "lryanlle@gmail.com",
	// 		image: "https://lh3.googleusercontent.com/a/ACg8ocKrTiLNkbQd_l12quqQoNKD1kRXchXv25I_stHpEG_Cog=s96-c",
	// 		id: "65938eb8e78270e2b5e30262",
	// 	},
	// };

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

          // Always create a new room (don't upsert)
          // If user has an existing room, it will remain in history
          try {
            // Calculate grid size and required items
            const boardSizeValue = roomData.boardSize[0] as number;
            const gridSize = getGridSize(boardSizeValue);
            const requiredItems = gridSize * gridSize;
            
            // Get bingo items from room data
            const providedItems = roomData.bingoItems || [];
            
            // Randomly select items if more than needed, using bingo seed for randomness
            let selectedItems: string[] = [];
            if (providedItems.length === 0) {
              // No items provided - use empty strings
              selectedItems = Array(requiredItems).fill("");
            } else if (providedItems.length === requiredItems) {
              // Exact amount - use all items
              selectedItems = [...providedItems];
            } else if (providedItems.length > requiredItems) {
              // More than needed - randomly select using seed
              const seed = roomData.bingoSeed;
              let hash = 0;
              for (let i = 0; i < seed.length; i++) {
                const char = seed.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
              }
              let state = Math.abs(hash);
              const random = () => {
                state = (state * 9301 + 49297) % 233280;
                return state / 233280;
              };
              
              // Shuffle and select
              const shuffled = [...providedItems].sort(() => random() - 0.5);
              selectedItems = shuffled.slice(0, requiredItems);
            } else {
              // Less than needed - pad with empty strings
              selectedItems = [...providedItems, ...Array(requiredItems - providedItems.length).fill("")];
            }
            
            const roomObj = await db.room.create({
              roomName: roomData.roomName,
              roomPassword: roomData.roomPassword,
              bingoSeed: roomData.bingoSeed,
              gameMode: roomData.gameMode,
              boardSize: boardSizeValue,
              teams: roomData.teams.map((team: {name: string, color: string}) => {return {name: team.name, color: team.color}}),
              owner_id: userId,
              bingoItems: selectedItems,
              claimedItems: [], // Start with no claimed items
              gameFinished: false,
            });

            return new Response(roomObj._id.toString(), { status: 200 });
          } catch (e) {
            console.error("Error creating room:", e);
            return new Response("Internal Server Error: Error creating room", { status: 500 });
          }
        } catch (e) {
          console.error("Invalid room data:", e);
          return new Response("Bad Request: Invalid room data", { status: 400 });
        }
			} catch (e) {
				console.error("Missing room data and/or user data:", e);
				return new Response("Bad Request: Missing room data and/or user data", {
					status: 400,
				});
			}
		} else { // Not Signed in
			return new Response("Unauthorized", { status: 401 });
		}
	} catch (e) {
		console.error("Internal Server Error:", e);
		return new Response("Internal Server Error", { status: 500 });
	}
}
