
"use client"

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react'
import toast from 'react-hot-toast';

import { Button } from './ui/button';
import { Input } from './ui/input';

const UploadForm = () => {

    const [file , setFile ] = useState <File |null>(null);

    const mutation = useMutation({
        mutationFn: async (file : File ) =>{
            console.log("inside the mutation function")
            const formData = new FormData();
            formData.append("file" , file);
            const res = await axios.post("/api/upload" , formData , {
                headers: { "content-Type": "multipart/form-data"},

            });
            return res.data;

        },
        onSuccess :(data) =>{
            toast.success("Document uploaded successfully");
            console.log("uploaded document ID : " , data.documentId);
        },onError :(err)=>{
            console.error(err)
            toast.error("upload failed please try again")
        }

    })
  return (
    <div  className='p-6 border rounded-2xl max-w-md mx-auto flex flex-col gap-3'>
      <h1>welcome to the hawa</h1>
      <div>
      <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button className='mt-4 cursor-pointer'
                onClick={() => {
    if (file) {
      mutation.mutate(file); // file is guaranteed to be File here
    } else {
      toast.error("Please select a file first!");
    }
  }}
>
  {mutation.isPending ? "Uploading..." : "Upload Document"}
</Button>

      </div>
    </div>
  )
}

export default UploadForm
