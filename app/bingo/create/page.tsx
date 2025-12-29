import CreateBingo from '@/components/new-game/createbingo';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateName } from '@/lib/utils';


const CreateBingoPage = async () => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const userSession = session?.user;
  
  return (
    <div className="w-full h-full flex justify-center items-center my-2">
      <CreateBingo partyleader={userSession?.name ?? generateName()} leaderid={userSession?.id} />
    </div>
  )
}

export default CreateBingoPage
