import BingoCard, { BingoCardProps } from "@/components/bingo-card/bingocard";

export default function Home() {
	const BingoCardArgs = {
		modeName: "Battleship Bingo",
		lobbyName: "Lryanle's Lobby",
		mode: "battleship" as "battleship" | "default",
		size: 5,
		bingoData: [
			{title: "Test1",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test2",slotItems: [{ color: "#ff0000", number: 3 }],favorite: false,locked: false,disabled: false},
			{title: "Test3",slotItems: [{ color: "#ff0000", number: 4 }],favorite: false,locked: false,disabled: false},
			{title: "Test4",slotItems: [{ color: "#ff0000", number: 2 }, { color: "#ff0000", number: 3 }],favorite: false,locked: false,disabled: false},
			{title: "Test5",slotItems: [{ color: "#ff0000", number: 3 }, { color: "#ff0000", number: 4 }],favorite: false,locked: false,disabled: false},
			{title: "Test6",slotItems: [{ color: "#ff0000", number: 2 },{ color: "#ff0000", number: 3 },{ color: "#ff0000", number: 4 }],favorite: false,locked: false,disabled: false},
			{title: "Test7",slotItems: [{ color: "#00ff00", number: 4 }],favorite: false,locked: false,disabled: false},
			{title: "Test8",slotItems: [{ color: "#0000ff", number: 3 }],favorite: false,locked: false,disabled: false},
			{title: "Test9",slotItems: [{ color: "#ffff00", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test10",slotItems: [{ color: "#ff0000", number: 4 },{ color: "#ffff00", number: 3 },{ color: "#00ff00", number: 3 },{ color: "#0000ff", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Look at a Ghast with a Spy Glass",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Play a Goat Horn at Height Limit",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "test13",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: true},
			{title: "Test14",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: true,disabled: false},
			{title: "Test15",slotItems: [{ color: "#ff0000", number: 2 }],favorite: true,locked: false,disabled: false},
			{title: "Play an nb with a bone block beneath it then do a 360 no scope",slotItems: [{ color: "#ff0000", number: 2 }],favorite: true,locked: false,disabled: false},
			{title: "Test17",slotItems: [],favorite: false,locked: false,disabled: false},
			{title: "",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test19",slotItems: [{ color: "#ff0000", number: 2 }],favorite: true,locked: true,disabled: false},
			{title: "Test20",slotItems: [],favorite: true,locked: true,disabled: true},
			{title: "Test21",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test22",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test23",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test24",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
			{title: "Test25",slotItems: [{ color: "#ff0000", number: 2 }],favorite: false,locked: false,disabled: false},
		],
	};

	return (
		<main>
      <div>
        <BingoCard mode={BingoCardArgs.mode } modeName={BingoCardArgs.modeName} lobbyName={BingoCardArgs.lobbyName} size={5} bingoData={BingoCardArgs.bingoData as BingoCardProps["bingoData"]} />
      </div>
    </main>
	);
}
