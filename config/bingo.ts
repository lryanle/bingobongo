export const bingoConfig = {
	modes: [
		{
			name: "Classic Bingo",
			description:
				"Achieve victory by marking off a full line on your bingo card. Lines can be horizontal, vertical, or diagonal. The amount of bingos can be customized.",
			flags: {
				count: true,
				lockout: true,
				column: false,
				row: false,
				pattern: false,
				adjacent: false,
			},
			win: "bingo",
			enabled: true,
			modes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		},
		{
			name: "Invasion Bingo",
			description:
				"Begin your game from the opposing outer edges and strategically work your way towards the center. Opponents can block your path by claiming opposing positions. While moving through columns or rows, the amount of goals you can score have to be lessthan or equal to the previous column/row. Win by scoring the majority of goals",
			flags: {
				column: true,
				row: true,
				lockout: true,
				adjacent: true,
				count: false,
				pattern: false,
			},
			win: "majority",
			enabled: false,
		},
		{
			name: "Turfwar Bingo",
			description:
				"Capture your starting point at any edge and navigate to the opponent's row or column. The row/column to reach can be configured.",
			flags: {
				column: true,
				row: true,
				adjacent: true,
				lockout: false,
				count: false,
				pattern: false,
			},
			win: "rowcolumn",
			enabled: false,
		},
		{
			name: "Battleship Bingo",
			description:
				"Inspired by the classic game of Battleship, place hidden ships within your grid. Players can claim goals that 'hit' opponents' ships or miss them.",
			flags: {
				pattern: true,
				column: false,
				row: false,
				lockout: false,
				count: false,
				adjacent: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Lockout Bingo",
			description:
				"It's a race to claim over 50% of the goals on the board, but with a twist: once a player claims a goal, it's locked out for the opponent. This mode requires speed and strategy to claim the most advantageous goals first.",
			flags: {
				lockout: true,
				count: true,
				pattern: false,
				column: false,
				row: false,
				adjacent: false,
			},
			win: "majority",
			enabled: false,
		},
		{
			name: "Blackout Bingo",
			description:
				"The ultimate endurance test. Players aim to complete every single goal on the bingo board.",
			flags: {
				lockout: false,
				count: false,
				pattern: false,
				column: false,
				row: false,
				adjacent: false,
			},
			win: "blackout",
			enabled: false,
		},
		{
			name: "Draft Bingo",
			description:
				"Players take turns alternating and strategically selecting their objectives in a snake-style adjacent-goals only draft. The last goal picked serves as a tiebreaker.",
			flags: {
				lockout: true,
				pattern: true,
				count: false,
				column: false,
				row: false,
				adjacent: false,
			},
			win: "pattern",
			enabled: false,
			modes: ["normal", "reverse", "coinflip"]
		},
		{
			name: "Checkers Bingo",
			description:
				"Players alternate in claiming goals, mimicking the movement of checkers. The central square acts as a tiebreaker.",
			flags: {
				pattern: true,
				lockout: true,
				count: false,
				column: false,
				row: false,
				adjacent: false,
			},
			win: "majority",
			enabled: false,
		},
		{
			name: "Pizza Bingo",
			description:
				"Choose an opposing corner to start and complete all goals to the middle diagonal of the board. The game is won when a player completes their diagonal triangle (pizza) and then claims the majority of the final diagonal's goals.",
			flags: {
				pattern: true,
				lockout: false,
				count: false,
				column: false,
				row: false,
				adjacent: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Diagonal Dash Bingo",
			description:
				"Focus on conquering the central diagonal stripe starting from your corner. This is similar to Pizza Bingo with the exception that players must each complete the final diagonal after completing their side of the pizza to win.",
			flags: {
				pattern: true,
				lockout: true,
				adjacent: true,
				count: false,
				column: false,
				row: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Five Flag Bingo",
			description:
				"A quick and strategic game mode where players aim to mark off the majority of the five flags on their bingo card. All players start in a corner and must capture the majority of the five flags by moving and claiming adjacent goals.",
			flags: {
				pattern: true,
				lockout: true,
				adjacent: true,
				count: false,
				column: false,
				row: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Perimeters Bingo",
			description:
				"Start by filling the outer edge of your bingo card. Once the perimeter is complete, shift your focus to the inner perimeters. Once all players complete outside, the first team to score the majority of the goals using the inside squares wins.",
			flags: {
				pattern: true,
				lockout: true,
				adjacent: false,
				count: false,
				column: false,
				row: false,
			},
			win: "majority",
			enabled: false,
		},
		{
			name: "Tilted Bingo",
			description:
				"Every time a player marks a square, they must also mark the square that is a 90-degree rotation of the claimed square. The goal is to complete a line or pattern as usual, but with the added complexity of the titled goals.",
			flags: {
				lockout: true,
				count: true,
				pattern: true,
				adjacent: false,
				column: false,
				row: false,
			},
			win: "bingo",
			enabled: false,
			modes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		},
		{
			name: "Pirate Bingo",
			description:
				"A dynamic mode where players select a random starting goal along the edge of the bingo grid and work towards the treasure spot goal that appears after the first player captures their starting bingo spot. Players can only move adjacent to captured bingo cells.",
			flags: {
				pattern: true,
				adjacent: true,
				lockout: false,
				count: false,
				column: false,
				row: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Race Bingo",
			description:
				"A jackpot mode where the goal is to reach the randomized target amount of goals first.",
			flags: {
				count: true,
				pattern: false,
				adjacent: false,
				lockout: false,
				column: false,
				row: false,
			},
			win: "count",
			enabled: false,
		},
		{
			name: "Mystery Bingo",
			description:
				"Before the game starts, a specific pattern or shape is kept secret. As the game progresses, players try to guess and complete the mystery pattern to win.",
			flags: {
				pattern: true,
				count: false,
				adjacent: false,
				lockout: false,
				column: false,
				row: false,
			},
			win: "pattern",
			enabled: false,
		},
		{
			name: "Simon Says Bingo",
			description:
				"A version of bingo where a certain amount of bingo goals are revealed. After completing a bingo goal, a new one is revealed by the game. Players can only claim the goals selected by the game. First team to get the majority of the goals wins.",
			flags: {
				lockout: true,
				pattern: true,
				count: false,
				adjacent: false,
				column: false,
				row: false,
			},
			win: "majority",
			enabled: false,
			modes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		},
		{
			name: "Exploding Bingo",
			description:
				"At random intervals, an 'explosion' number is called, clearing marked squares in its vicinity.",
			flags: {
				count: true,
				pattern: false,
				adjacent: false,
				lockout: false,
				column: false,
				row: false,
			},
			win: "bingo",
			enabled: false,
			modes: ["easy", "medium", "hard", "unfair"],
		},
		{
			name: "Ghostbusters Bingo",
			description:
				"Squares are randomly chosen to contain a ghost. Every non-ghost square captured will show a number indicating how many squares away the nearest ghost is. Game ends with a team eliminates the majority of the ghosts.",
			flags: {
				pattern: true,
				lockout: true,
				count: false,
				adjacent: false,
				column: false,
				row: false,
			},
			win: "majority",
			enabled: false,
			modes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		},
	],
};
