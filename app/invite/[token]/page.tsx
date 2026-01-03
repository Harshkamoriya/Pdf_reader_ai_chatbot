import { div } from "framer-motion/client";


async function getInvite(token:string){
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/invites/validate/${token}`,
        {cache : "no-store"}
    );
     if(!res.ok)return null;
     return res.json();
}


export default async function InvitePage({
    params,
}:{params:{token: string}}){

  const data  = await getInvite(params.token);

  if(!data){
    return <div>Invalid or expired invite</div>;
  }

  return (
    <> <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold">
        You are invited for {data.data.job.title}
      </h1>

      <p className="text-gray-600 mt-2">
        Company: {data.data.job.companyId}
      </p>

      {/* Clerk signup / login here */}
      <form action={`/api/invites/consume`} method="POST">
        <input type="hidden" name="token" value={params.token} />
        <button className="mt-4 bg-black text-white px-4 py-2 rounded">
          Register & Continue
        </button>
      </form>
    </div>
    </>
  )
    
}