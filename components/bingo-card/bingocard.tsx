import BingoCell from "./bingocell";

export interface BingoCardProps {
	modeName: string;
	lobbyName: string;
  mode: "default" | "battleship",
  size: number,
  bingoData: [{
    title?: string,
    slotItems?: [{color: string, number: number}],
    favorite?: boolean,
    locked?: boolean,
    disabled?: boolean,
  }],
  battleshipData?: [{position: [x: number, y: number], number: number}]
}

function getUniqueColors(bingoCardData: BingoCardProps["bingoData"]) {
  const colors = new Set();

  bingoCardData.forEach(item => {
      item.slotItems?.forEach(slotItem => {
          colors.add(slotItem.color);
      });
  });
  
  return Array.from(colors).map(color => `bg-[${color}]`).join(" ");
}

export default function BingoCard({ modeName, lobbyName, mode, size, bingoData, battleshipData }: BingoCardProps) {
  // Convert bingoData to a 2d array for easier rendering
  const bingoData2d = [];
  for (let i = 0; i < bingoData.length; i += size) {
    bingoData2d.push(bingoData.slice(i, i + size));
  }

	return (
		<div className="inline-flex flex-col p-5 justify-center items-center gap-2 rounded-3xl bg-neutral-925 shadow">
			<div className="flex py-3 px-0 flex-col items-center gap-1 self-stretch rounded-2xl bg-neutral-900 bg-opacity-50 backdrop-blur-xl">
				<div className="flex justify-center items-start text-white text-center text-3xl font-semibold">{modeName}</div>
        <div className="text-white font-normal text-xl">{lobbyName}</div>
			</div>
			<div className="flex flex-col items-center gap-2 self-stretch">

        {bingoData2d.map((row) => (
          <div className="flex justify-center items-center gap-2" key={ row.map((cell) => cell.title).join("") }>
            {row.map((cell) => (
              <BingoCell title={cell.title ?? ""} slotItems={cell.slotItems} variant={mode} property="slotted" action={cell.locked ? "locked" : cell.disabled ? "disabled" : "default"} disabled={cell.disabled} favorite={cell.favorite} locked={cell.locked} key={cell.title}/>
            ))}
          </div>
        ))}
      </div>
      <div className={`hidden w-0 h-0 ${getUniqueColors(bingoData)}`}></div>
		</div>
	);
}
