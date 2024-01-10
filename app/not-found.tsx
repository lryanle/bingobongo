import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="h-screen text-center flex flex-col items-center justify-center gap-4">
      <div className="flex flex-row items-center justify-center">
        <h2 className="inline-block mr-5 pr-6 font-medium text-2xl align-top border-r border-opacity-30 border-muted-foreground leading-[49px]">404</h2>
        <h2 className="inline-block">Could not find requested resource.</h2>
      </div>
      <Link href="/" className="px-4 py-2 bg-secondary rounded flex justify-center items-center">Return Home</Link>
    </div>
  )
}