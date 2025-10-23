import React from 'react'
import UploadForm from './components/UploadForm'
import { ReactQueryProvider } from './components/ReactQueryProvider'


const page = () => {
  return (
    <div className=''>
      <h1>hello worlds</h1>
      <ReactQueryProvider>
       <UploadForm/>

      </ReactQueryProvider>
      
    </div>
  )
}

export default page
