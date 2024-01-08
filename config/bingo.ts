export const bingoConfig = {
	modes: [
		{
			name: "Classic Bingo",
			description:
				"Achieve victory by marking off a full line on your bingo card. Lines can be horizontal, vertical, or diagonal.",
		},
		{
			name: "Double Bingo",
			description:
				"Twice the challenge and fun! Players must complete two separate lines anywhere on their card. Lines can intersect but must be distinct to count.",
		},
		{
			name: "Triple Bingo",
			description:
				"Elevate your game by completing three distinct lines. Any combination of horizontal, vertical, or diagonal lines counts.",
		},
		{
			name: "Invasion Bingo",
			description:
				"Begin your game from the opposing outer edges and strategically work your way towards the center. Opponents can block your path by claiming opposing positions. You must complete your first and second rows to progress, adhering to lockout rules that prevent claiming squares above your furthest row.",
		},
		{
			name: "Four-layer Bingo",
			description:
				"Select your starting point at any edge and navigate to the 4th row or column. This mode requires strategic advancement and planning, with victory achieved upon completing the 4th line.",
		},
		{
			name: "Battleship Bingo",
			description:
				"Inspired by the classic game of Battleship, place hidden ships within your grid. Players can claim goals that 'hit' opponents' ships or miss them.",
		},
		{
			name: "Lockout Bingo",
			description:
				"It's a race to claim over 50% of the goals on the board, but with a twist: once a player claims a goal, it's locked out for the opponent. This mode requires speed and strategy to claim the most advantageous goals first.",
		},
		{
			name: "Blackout Bingo",
			description:
				"The ultimate endurance test. Players aim to complete every single goal on the bingo board.",
		},
		{
			name: "Draft Bingo",
			description:
				"Players take turns alternating and strategically selecting their objectives in a snake-style adjacent-goals only draft. The last goal picked serves as a tiebreaker.",
		},
		{
			name: "Reverse Draft Bingo",
			description:
				"Turn the tables by selecting goals for your opponent in a snake draft.",
		},
		{
			name: "Checkers Bingo",
			description:
				"Players alternate in claiming goals, mimicking the movement of checkers. The central square acts as a tiebreaker.",
		},
		{
			name: "Dorito Corner Bingo",
			description:
				"Choose an opposing corner to start and complete all goals to the middle diagonal of the board. The game is won when a player completes their diagonal triangle (dorito) and then claims the majority of the final diagonal's goals.",
		},
		{
			name: "Dorito Dash Bingo",
			description:
				"Focus on conquering the central diagonal stripe starting from your corner.This is similar to Dorito Corner bingo with the exception that players must each complete the final diagonal after completing their side of the dorito to win.",
		},
		{
			name: "Coin Flip Bingo",
			description:
				"After drafting objectives, a coin flip determines which draft each player will pursue.",
		},
		{
			name: "Four Corners Bingo",
			description:
				"A quick and strategic game mode where players aim to be the first to mark off all four corners on their bingo card. All players start in the center and must make their way to all four corners by claiming adjacent goals.",
		},
		{
			name: "Perimeters Bingo",
			description:
				"Start by filling the outer edge of your bingo card. Once the perimeter is complete, shift your focus to the inner perimeters. The first to complete the outside and then all inside squares wins.",
		},
		{
			name: "Picture Frame Bingo",
			description:
				"Players aim to complete all the squares along the edge of their bingo card, forming a 'picture frame'.",
		},
		{
			name: "Layer Cake Bingo",
			description:
				"This mode divides the bingo card into three horizontal sections or 'layers'. Players must complete the top, middle, and bottom layers in order to win.",
		},
		{
			name: "Tilted Bingo",
			description:
				"Every time a player marks a square, they must also mark the square that is a 90-degree rotation of the claimed square. The goal is to complete a line or pattern as usual, but with the added complexity of the titled goals.",
		},
		{
			name: "Pyramid Bingo",
			description:
				"Players aim to mark off numbers to form a pyramid shape, starting with one square at the top and expanding each row by one square. The first to complete the pyramid wins.",
		},
		{
			name: "Pirate Bingo",
			description:
				"A dynamic mode where players select a random starting goal along the edge of the bingo grid and work towards the treasure spot goal that appears after the first player captures their starting bingo spot. Players can only move adjacent to captured bingo cells.",
		},
		{
			name: "Race Bingo",
			description:
				"A jackpot mode where the goal is to reach the randomized target amount of goals first.",
		},
		{
			name: "Mystery Bingo",
			description:
				"Before the game starts, a specific pattern or shape is kept secret. As the game progresses, players try to guess and complete the mystery pattern to win.",
		},
		{
			name: "Simon Says Bingo",
			description:
				"A version of bingo where aftering completing the first assigned bingo goal, the next goal is revealed by the game. Players can only claim the goal selected by the game.",
		},
		{
			name: "Exploding Bingo",
			description:
				"At random intervals, an 'explosion' number is called, clearing marked squares in its vicinity.",
		},
	],
};
