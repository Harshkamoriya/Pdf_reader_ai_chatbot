"use client"

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react"

export default function ChatUi (){

    const [question , setQuestion] = useState("");
    const [answer , setAnswer]  = useState("");

    const mutation = useMutation({

        mutationFn : async (q:string)=>{
            const res = await axios.post("/api/query", {question :q});
            return res.data;

        },
        onSuccess:(data) =>{
            if(data.success) setAnswer(data.answer);
            
            else setAnswer("error : " + data.error);
        },
    });

    return (

       <>
       <div className="p-6 border rounded-2xl max-w-lg mx-auto flex flex-col gap-3">
        
       <Input
       placeholder="Ask a question about your documnet ..."
       value={question}
       onChange={(e)=>setQuestion(e.target.value)}
       
       />

       <Button
       onClick={()=>mutation.mutate(question)}
       disabled={!question  || mutation.isPending}
        
        >
        {mutation.isPending ? "Generating... " : "Ask"}
       </Button>
       {answer && (
        <div className="mt-4 p-4 bg-gray-400 rounded-lg">
            <strong>
                Answer : 
            </strong>
            <p>{answer}</p>
        </div>
       )}

       </div>
       
       </>
    )
}