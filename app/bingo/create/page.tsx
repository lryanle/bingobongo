import CreateBingo from '@/components/new-game/createbingo';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { generateName } from '@/lib/utils';


const CreateBingoPage = async () => {
  const userSession = (await getServerSession(authOptions))?.user;
  
  return (
    <div className="w-full h-full flex justify-center items-center my-2">
      <CreateBingo partyleader={userSession?.name ?? generateName()} leaderid={userSession?.id} />
    </div>
  )
}

export default CreateBingoPage
