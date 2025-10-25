"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";


export const useUploadResume = () =>{

    const router = useRouter();

    return useMutation({
        mutationFn : async(file :File)=>{

            if(!file) throw new Error("No file selected");
            const formData = new FormData();
            formData.append("resume" , file);
            const res = await axios.post(`/api/upload` ,formData,{
                headers:{
                    "Content-Type": "multipart/form-data",
                }
            });

            return res.data;
            
        },
        onMutate :() =>{
            toast.loading("Uploading resume...");

        },

        onSuccess: (data) =>{
            toast.dismiss();
            toast.success("Resume uploaded successfully");
            console.log("Resume Id : " , data.ResumeId);
            router.push(`/dashboard/session/${data.interviewSessionId}`);

        }, onError: (error :any)=>{
            toast.dismiss();
            const message  = error.response?.data?.message || error.message || "Upload failed";
            toast.error(message);
            console.error("Upload error :" , error);
        },
        onSettled :()=>{
            toast.dismiss();
        },

    
        });
}