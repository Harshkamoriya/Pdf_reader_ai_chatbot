import { SignIn } from '@clerk/nextjs'

export default function Page() {


  return(

    <>
    <div className='h-screen w-full text-center flex items-center justify-center '>

      <SignIn />
    </div>
    </>


  ) 
}