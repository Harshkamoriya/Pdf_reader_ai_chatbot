"use client"

import React from 'react'
import UploadForm from './components/UploadForm'
import { ReactQueryProvider } from './components/ReactQueryProvider'
import Herosection from './components/HeroSection'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'


const page = () => {

  const { isSignedIn} = useUser();

  const handlepost = async () =>{
    const res = await axios.post(`/api/aiCoach`);
    console.log(res);
  }

  // const handlecreatesession = async ()=>{
  //   const res = await axios.post(`/api/interview`,
  //     {
        
  //     }
  //   )
  // }


  const handleSaveUser = async() =>{
    try {
      console.log("inside the handle saveruser ")
      const res = await axios.post(`/api/user`)
      console.log(res  , "res data ")
    } catch (error) {
      console.error(error , "error in saving the user")
      console.log("error in saving the user");
    }
  }
  if(isSignedIn){
    handleSaveUser();
  }
  return (
    <div className=''>
      <ReactQueryProvider>
      <Herosection/>
      <button onClick={()=>{handlepost()}}>aicoach</button>
      {/* <button onClick={()=>{handlecreatesession()}}>create session</button> */}
      </ReactQueryProvider>
      
    </div>
  )
}

export default page
